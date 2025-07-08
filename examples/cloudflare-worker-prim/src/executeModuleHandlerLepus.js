/**
 * Module execution handler for LEPUS/PrimJS
 * Uses LEPUS to evaluate modules directly without JS eval/Function
 */

import { MODULE_FEDERATION, EXECUTION_TIMEOUTS } from './utils/constants.js';
import { validateExecuteModuleInput, createContextualErrorResponse, ValidationError } from './utils/responseUtils.js';
import { info, warn, error as logError, debug } from './utils/logger.js';
import { executeRegisteredModule, moduleRegistry } from './utils/lepusUtils.js';

/**
 * Handle module execution routes with LEPUS
 * @param {Object} context - Request context with LEPUS instance
 * @returns {Promise<Response>}
 */
export async function handleExecuteModuleRoute(context) {
    const { request, env, corsHeaders, LEPUS } = context;
    
    info('[LEPUS] Module execution request received');
    
    let requestBody = null;
    
    try {
        // Parse request body
        try {
            requestBody = await request.json();
        } catch (e) {
            throw new ValidationError('Invalid JSON in request body', ['Request body must be valid JSON']);
        }
        
        const { module, function: func, params } = requestBody;
        
        // Validate inputs
        validateExecuteModuleInput({ module, function: func });
        
        // Check KV namespace
        if (!env?.MODULE_FEDERATION_ASSETS) {
            throw new ValidationError('Missing MODULE_FEDERATION_ASSETS in environment', ['KV namespace is required']);
        }
        
        info(`[LEPUS] Executing pre-registered module: ${module}.${func}`);
        
        // Since we can't eval in Cloudflare Workers, use pre-registered modules
        let result;
        try {
            const executionResult = executeRegisteredModule(module, func, params);
            
            result = {
                success: true,
                result: executionResult,
                module,
                function: func,
                engine: 'LEPUS/PrimJS (Pre-compiled)',
                gc_enabled: LEPUS.isGCMode(),
                timestamp: new Date().toISOString(),
                available_modules: Array.from(moduleRegistry.keys())
            };
            
            // Run GC after execution
            if (LEPUS.isGCMode()) {
                LEPUS.runGC();
                debug('[LEPUS] Garbage collection completed');
            }
        } catch (execError) {
            result = {
                success: false,
                error: execError.message,
                module,
                function: func,
                engine: 'LEPUS/PrimJS (Pre-compiled)',
                available_modules: Array.from(moduleRegistry.keys()),
                timestamp: new Date().toISOString()
            };
        }
        
        return new Response(JSON.stringify(result, null, 2), {
            status: result.success ? 200 : 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
                'X-Engine': 'LEPUS-Native'
            }
        });
        
    } catch (error) {
        logError('[LEPUS] Module execution failed:', error);
        
        if (error instanceof ValidationError) {
            return createContextualErrorResponse(
                error,
                {
                    handler: 'executeModuleHandlerLEPUS',
                    operation: 'validation',
                    inputs: requestBody
                },
                400,
                corsHeaders
            );
        }
        
        return createContextualErrorResponse(
            error,
            {
                handler: 'executeModuleHandlerLEPUS',
                operation: 'executeModule',
                inputs: requestBody,
                engine: 'LEPUS/PrimJS'
            },
            500,
            corsHeaders
        );
    }
}

/**
 * Execute a module function using LEPUS directly
 * @param {Object} LEPUS - LEPUS module instance
 * @param {string} remoteEntry - Remote entry JavaScript code
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} - Execution result
 */
async function executeLEPUSModule(LEPUS, remoteEntry, options) {
    const { module, func, params } = options;
    
    try {
        // First, evaluate the remote entry to set up the module system
        debug('[LEPUS] Evaluating remote entry');
        LEPUS.evalCode(remoteEntry);
        
        // Now evaluate code to access and execute the specific module function
        const executionCode = `
            (function() {
                try {
                    // Check if __remoteEntry exists
                    if (typeof __remoteEntry === 'undefined' || !__remoteEntry.get) {
                        return { 
                            success: false, 
                            error: 'Remote entry not properly initialized' 
                        };
                    }
                    
                    // Get the exposed module
                    const exposedModule = __remoteEntry.get('./${module}');
                    if (!exposedModule) {
                        return { 
                            success: false, 
                            error: 'Module not found: ' + '${module}' 
                        };
                    }
                    
                    // Check if function exists
                    if (typeof exposedModule.${func} !== 'function') {
                        return { 
                            success: false, 
                            error: 'Function not found: ' + '${module}.${func}' 
                        };
                    }
                    
                    // Execute the function with parameters
                    const result = exposedModule.${func}.apply(null, ${JSON.stringify([params])});
                    
                    return {
                        success: true,
                        result: result,
                        module: '${module}',
                        function: '${func}',
                        engine: 'LEPUS/PrimJS',
                        gc_enabled: true
                    };
                    
                } catch (e) {
                    return {
                        success: false,
                        error: e.message || 'Execution error',
                        module: '${module}',
                        function: '${func}',
                        engine: 'LEPUS/PrimJS'
                    };
                }
            })()
        `;
        
        // Execute with LEPUS
        const startTime = Date.now();
        const result = LEPUS.evalCode(executionCode);
        const executionTime = Date.now() - startTime;
        
        // Run garbage collection
        if (LEPUS.isGCMode()) {
            LEPUS.runGC();
            debug('[LEPUS] Garbage collection completed');
        }
        
        // Add execution metadata
        if (result && typeof result === 'object') {
            result.execution_time_ms = executionTime;
            result.timestamp = new Date().toISOString();
        }
        
        info(`[LEPUS] Module executed successfully in ${executionTime}ms`);
        return result;
        
    } catch (error) {
        logError('[LEPUS] Module evaluation error:', error);
        return {
            success: false,
            error: error.message || 'Module execution failed',
            module,
            function: func,
            engine: 'LEPUS/PrimJS',
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Load and execute a module with dependencies using LEPUS
 * @param {Object} LEPUS - LEPUS module instance
 * @param {string} modulePath - Module path to load
 * @param {Object} kvNamespace - KV namespace for loading dependencies
 * @returns {Promise<any>} - Module exports
 */
export async function loadModuleWithLEPUS(LEPUS, modulePath, kvNamespace) {
    try {
        // Load module code from KV
        const moduleCode = await kvNamespace.get(modulePath, { type: 'text' });
        if (!moduleCode) {
            throw new Error(`Module not found: ${modulePath}`);
        }
        
        // Create module wrapper
        const wrappedCode = `
            (function() {
                const module = { exports: {} };
                const exports = module.exports;
                
                ${moduleCode}
                
                return module.exports;
            })()
        `;
        
        // Execute with LEPUS
        const moduleExports = LEPUS.evalCode(wrappedCode);
        
        debug(`[LEPUS] Module loaded: ${modulePath}`);
        return moduleExports;
        
    } catch (error) {
        logError(`[LEPUS] Failed to load module ${modulePath}:`, error);
        throw error;
    }
}