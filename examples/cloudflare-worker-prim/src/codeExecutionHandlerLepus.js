/**
 * Code execution handler for LEPUS/PrimJS
 * Direct native API usage without QuickJS compatibility layer
 */

import { validateCodeInput } from './utils/responseUtils.js';
import { info, warn, error, debug } from './utils/logger.js';
import { createCloudflareCompatibleLEPUS } from './utils/lepusUtils.js';

/**
 * Execute JavaScript code using LEPUS native API
 * @param {Object} context - Handler context with LEPUS instance
 * @returns {Promise<Response>}
 */
export async function handleCodeExecution(context) {
    const { request, LEPUS, corsHeaders } = context;
    
    info('[LEPUS] Code execution request received');
    
    try {
        const body = await request.json();
        const { code } = body;
        
        // Validate the code
        try {
            validateCodeInput(code);
        } catch (validationError) {
            warn('[LEPUS] Code validation failed:', validationError.message);
            return new Response(JSON.stringify({
                error: validationError.message,
                engine: 'LEPUS/PrimJS (Native)'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
        
        info('[LEPUS] Processing code request');
        const startTime = Date.now();
        
        try {
            // Create Cloudflare-compatible LEPUS wrapper
            const compatibleLEPUS = createCloudflareCompatibleLEPUS(LEPUS);
            
            // Try to parse the code as a simple expression
            let result;
            
            // Check for simple arithmetic
            const arithmeticMatch = code.match(/^\s*(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)\s*$/);
            if (arithmeticMatch) {
                const [, a, op, b] = arithmeticMatch;
                const num1 = parseFloat(a);
                const num2 = parseFloat(b);
                
                switch (op) {
                    case '+': result = compatibleLEPUS.math.add(num1, num2); break;
                    case '-': result = compatibleLEPUS.math.subtract(num1, num2); break;
                    case '*': result = compatibleLEPUS.math.multiply(num1, num2); break;
                    case '/': result = compatibleLEPUS.math.divide(num1, num2); break;
                }
            }
            // Check for pre-defined function calls
            else if (code.includes('(') && code.includes(')')) {
                // Parse function call like "math.add(5, 3)"
                const funcMatch = code.match(/^(\w+)\.(\w+)\((.*)\)$/);
                if (funcMatch) {
                    const [, category, method, argsStr] = funcMatch;
                    const args = argsStr.split(',').map(arg => {
                        const trimmed = arg.trim();
                        // Try to parse as number
                        const num = parseFloat(trimmed);
                        return isNaN(num) ? trimmed.replace(/['"]/g, '') : num;
                    });
                    
                    result = compatibleLEPUS.execute(`${category}.${method}`, ...args);
                } else {
                    throw new Error('Complex code evaluation not supported in Cloudflare Workers. Use pre-defined operations.');
                }
            }
            // Return the code as-is for simple values
            else {
                result = code.trim();
            }
            
            const executionTime = Date.now() - startTime;
            
            info(`[LEPUS] Code processed successfully in ${executionTime}ms`);
            
            return new Response(JSON.stringify({
                success: true,
                result,
                engine: 'LEPUS/PrimJS (Pre-compiled)',
                gc_enabled: LEPUS.isGCMode(),
                execution_time_ms: executionTime,
                timestamp: new Date().toISOString(),
                note: 'Cloudflare Workers restricts dynamic code evaluation. Using pre-compiled operations.'
            }), {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json', 
                    ...corsHeaders,
                    'X-Engine': 'LEPUS-Native',
                    'X-Execution-Time': `${executionTime}ms`
                }
            });
        } catch (evalError) {
            const executionTime = Date.now() - startTime;
            error('[LEPUS] Code processing error:', evalError);
            
            return new Response(JSON.stringify({
                success: false,
                error: evalError.message || 'Code processing failed',
                engine: 'LEPUS/PrimJS (Pre-compiled)',
                gc_enabled: LEPUS.isGCMode(),
                execution_time_ms: executionTime,
                timestamp: new Date().toISOString(),
                hint: 'Try simple arithmetic (e.g., "5 + 3") or pre-defined functions (e.g., "math.add(5, 3)")'
            }), {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json', 
                    ...corsHeaders,
                    'X-Engine': 'LEPUS-Native'
                }
            });
        }
    } catch (error) {
        error('[LEPUS] Request processing error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Failed to process request',
            engine: 'LEPUS/PrimJS (Native)',
            timestamp: new Date().toISOString()
        }), {
            status: 400,
            headers: { 
                'Content-Type': 'application/json', 
                ...corsHeaders,
                'X-Engine': 'LEPUS-Native'
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