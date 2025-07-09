/**
 * Code execution handler for LEPUS/PrimJS
 * Direct native API usage without QuickJS compatibility layer
 */

import { validateCodeInput } from './utils/responseUtils.js';
import { info, warn, error as logError, debug } from './utils/logger.js';

/**
 * Execute JavaScript code using LEPUS native API
 * @param {Object} context - Handler context with LEPUS instance
 * @returns {Promise<Response>}
 */
export async function handleCodeExecution(context) {
    const { request, corsHeaders, PrimJS } = context;
    
    info('[LEPUS/PrimJS] Code execution request received');
    
    try {
        const body = await request.json();
        const { code } = body;
        
        // Validate the code
        try {
            validateCodeInput(code);
        } catch (validationError) {
            warn('[LEPUS/PrimJS] Code validation failed:', validationError.message);
            return new Response(JSON.stringify({
                error: validationError.message,
                engine: 'LEPUS/PrimJS'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
        
        info('[LEPUS/PrimJS] Executing code with PrimJS');
        const startTime = Date.now();
        
        // Create PrimJS runtime
        const runtime = PrimJS.newRuntime();
        
        // Set memory and stack limits
        runtime.setMemoryLimit(1024 * 1024); // 1MB memory limit
        runtime.setMaxStackSize(1024 * 128); // 128KB stack limit
        
        // Set interrupt handler for timeout
        let cycles = 0;
        runtime.setInterruptHandler(() => {
            cycles++;
            return cycles > 5000; // ~2-5 seconds execution time
        });
        
        const ctx = runtime.newContext();
        
        try {
            // Add console.log support
            const logs = [];
            const consoleLog = ctx.newFunction('log', (...args) => {
                const nativeArgs = args.map(arg => ctx.dump(arg));
                logs.push(nativeArgs.join(' '));
            });
            const consoleProp = ctx.newObject();
            ctx.setProp(consoleProp, 'log', consoleLog);
            ctx.setProp(ctx.global, 'console', consoleProp);
            consoleLog.dispose();
            consoleProp.dispose();
            
            // Execute the code
            const result = ctx.evalCode(code);
            
            if (result.error) {
                const errorValue = ctx.dump(result.error);
                result.error.dispose();
                
                const executionTime = Date.now() - startTime;
                return new Response(JSON.stringify({
                    success: false,
                    error: errorValue,
                    engine: 'LEPUS/PrimJS',
                    gc_enabled: true,
                    execution_time_ms: executionTime,
                    logs: logs.length > 0 ? logs : undefined,
                    timestamp: new Date().toISOString()
                }), {
                    status: 200,
                    headers: { 
                        'Content-Type': 'application/json', 
                        ...corsHeaders,
                        'X-Engine': 'LEPUS-PrimJS',
                        'X-Execution-Time': `${executionTime}ms`
                    }
                });
            }
            
            const resultValue = ctx.dump(result.value);
            result.value.dispose();
            
            const executionTime = Date.now() - startTime;
            
            info(`[LEPUS/PrimJS] Code executed successfully in ${executionTime}ms`);
            
            return new Response(JSON.stringify({
                success: true,
                result: resultValue,
                engine: 'LEPUS/PrimJS',
                gc_enabled: true,
                execution_time_ms: executionTime,
                logs: logs.length > 0 ? logs : undefined,
                timestamp: new Date().toISOString()
            }), {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json', 
                    ...corsHeaders,
                    'X-Engine': 'LEPUS-PrimJS',
                    'X-Execution-Time': `${executionTime}ms`
                }
            });
        } finally {
            ctx.dispose();
            runtime.dispose();
        }
    } catch (error) {
        logError('[LEPUS/PrimJS] Request processing error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Failed to process request',
            engine: 'LEPUS/PrimJS',
            timestamp: new Date().toISOString()
        }), {
            status: 400,
            headers: { 
                'Content-Type': 'application/json', 
                ...corsHeaders,
                'X-Engine': 'LEPUS-PrimJS'
            }
        });
    }
}

/**
 * Execute code with advanced LEPUS features
 * @param {Object} LEPUS - LEPUS module instance
 * @param {string} code - JavaScript code to execute
 * @param {Object} options - Execution options
 * @returns {Object} Execution result
 */
export function executeLEPUSCodeAdvanced(LEPUS, code, options = {}) {
    const {
        collectGarbage = true,
        measureMemory = false,
        timeout = 5000
    } = options;
    
    const metrics = {
        startTime: Date.now(),
        memoryBefore: null,
        memoryAfter: null
    };
    
    try {
        // Run GC before execution if requested
        if (collectGarbage && LEPUS.isGCMode()) {
            LEPUS.runGC();
            debug('[LEPUS] Garbage collection completed before execution');
        }
        
        // Execute the code
        const result = LEPUS.evalCode(code);
        
        // Run GC after execution if requested
        if (collectGarbage && LEPUS.isGCMode()) {
            LEPUS.runGC();
            debug('[LEPUS] Garbage collection completed after execution');
        }
        
        metrics.endTime = Date.now();
        metrics.executionTime = metrics.endTime - metrics.startTime;
        
        return {
            success: true,
            result,
            metrics,
            gc_mode: LEPUS.isGCMode()
        };
    } catch (error) {
        metrics.endTime = Date.now();
        metrics.executionTime = metrics.endTime - metrics.startTime;
        
        return {
            success: false,
            error: error.message || 'Execution failed',
            metrics,
            gc_mode: LEPUS.isGCMode()
        };
    }
}