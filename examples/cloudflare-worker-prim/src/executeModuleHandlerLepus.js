/**
 * Module execution handler for LEPUS/PrimJS
 * Uses PrimJS to evaluate modules directly
 */

import { MODULE_FEDERATION, EXECUTION_TIMEOUTS } from './utils/constants.js';
import { validateExecuteModuleInput, createContextualErrorResponse, ValidationError } from './utils/responseUtils.js';
import { info, warn, error as logError, debug } from './utils/logger.js';

/**
 * Handle module execution routes with PrimJS
 * @param {Object} context - Request context
 * @returns {Promise<Response>}
 */
export async function handleExecuteModuleRoute(context) {
    const { request, env, corsHeaders, PrimJS } = context;
    
    info('[LEPUS/PrimJS] Module execution request received');
    
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
        
        info(`[LEPUS/PrimJS] Loading remote entry from KV`);
        
        // Load remoteEntry.js from KV
        const remoteEntry = await env.MODULE_FEDERATION_ASSETS.get('remoteEntry.js', { type: 'text' });
        if (!remoteEntry) {
            throw new Error('Remote entry not found in KV storage');
        }
        
        // Execute with PrimJS
        const result = await executePrimJSModule(PrimJS, remoteEntry, { module, func, params });
        
        return new Response(JSON.stringify(result, null, 2), {
            status: result.success ? 200 : 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
                'X-Engine': 'LEPUS-PrimJS'
            }
        });
        
    } catch (error) {
        logError('[LEPUS/PrimJS] Module execution failed:', error);
        
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
 * Execute a module function using PrimJS directly
 * @param {Object} PrimJS - PrimJS module instance
 * @param {string} remoteEntry - Remote entry JavaScript code
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} - Execution result
 */
async function executePrimJSModule(PrimJS, remoteEntry, options) {
    const { module, func, params } = options;
    
    const runtime = PrimJS.newRuntime();
    runtime.setMemoryLimit(2 * 1024 * 1024); // 2MB for module execution
    runtime.setMaxStackSize(256 * 1024); // 256KB stack
    
    // Set interrupt handler
    let cycles = 0;
    runtime.setInterruptHandler(() => {
        cycles++;
        return cycles > 10000; // More cycles for module execution
    });
    
    const ctx = runtime.newContext();
    
    try {
        // First, evaluate the remote entry to set up the module system
        debug('[LEPUS/PrimJS] Evaluating remote entry');
        const entryResult = ctx.evalCode(remoteEntry);
        if (entryResult.error) {
            const error = ctx.dump(entryResult.error);
            entryResult.error.dispose();
            throw new Error(`Failed to load remote entry: ${error}`);
        }
        entryResult.value.dispose();
        
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
        
        // Execute with PrimJS
        const startTime = Date.now();
        const execResult = ctx.evalCode(executionCode);
        const executionTime = Date.now() - startTime;
        
        if (execResult.error) {
            const error = ctx.dump(execResult.error);
            execResult.error.dispose();
            throw new Error(error);
        }
        
        const result = ctx.dump(execResult.value);
        execResult.value.dispose();
        
        // Add execution metadata
        if (result && typeof result === 'object') {
            result.execution_time_ms = executionTime;
            result.timestamp = new Date().toISOString();
        }
        
        info(`[LEPUS/PrimJS] Module executed successfully in ${executionTime}ms`);
        return result;
        
    } catch (error) {
        logError('[LEPUS/PrimJS] Module evaluation error:', error);
        return {
            success: false,
            error: error.message || 'Module execution failed',
            module,
            function: func,
            engine: 'LEPUS/PrimJS',
            timestamp: new Date().toISOString()
        };
    } finally {
        ctx.dispose();
        runtime.dispose();
    }
}

/**
 * Load and execute a module with dependencies using PrimJS
 * @param {Object} PrimJS - PrimJS module instance
 * @param {string} modulePath - Module path to load
 * @param {Object} kvNamespace - KV namespace for loading dependencies
 * @returns {Promise<any>} - Module exports
 */
export async function loadModuleWithPrimJS(PrimJS, modulePath, kvNamespace) {
    const runtime = PrimJS.newRuntime();
    const ctx = runtime.newContext();
    
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
        
        // Execute with PrimJS
        const result = ctx.evalCode(wrappedCode);
        if (result.error) {
            const error = ctx.dump(result.error);
            result.error.dispose();
            throw new Error(error);
        }
        
        const moduleExports = ctx.dump(result.value);
        result.value.dispose();
        
        debug(`[LEPUS/PrimJS] Module loaded: ${modulePath}`);
        return moduleExports;
        
    } catch (error) {
        logError(`[LEPUS/PrimJS] Failed to load module ${modulePath}:`, error);
        throw error;
    } finally {
        ctx.dispose();
        runtime.dispose();
    }
}