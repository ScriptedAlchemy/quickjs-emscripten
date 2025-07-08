/**
 * LEPUS utilities for Cloudflare Workers
 * Works within platform constraints (no eval/code generation)
 */

import { info, warn, error as logError } from './logger.js';

/**
 * Create a LEPUS context that works within Cloudflare constraints
 * Since we can't use evalCode, we provide pre-compiled functionality
 */
export function createCloudflareCompatibleLEPUS(lepusModule) {
    return {
        // Original LEPUS module
        _module: lepusModule,
        
        // GC functions work normally
        isGCMode: () => lepusModule.isGCMode(),
        runGC: () => lepusModule.runGC(),
        dispose: () => lepusModule.dispose(),
        
        // Pre-compiled functions that don't require eval
        math: {
            add: (a, b) => a + b,
            subtract: (a, b) => a - b,
            multiply: (a, b) => a * b,
            divide: (a, b) => a / b,
            pow: (a, b) => Math.pow(a, b),
            sqrt: (a) => Math.sqrt(a)
        },
        
        string: {
            concat: (...args) => args.join(''),
            split: (str, sep) => str.split(sep),
            replace: (str, search, replace) => str.replace(search, replace),
            toUpperCase: (str) => str.toUpperCase(),
            toLowerCase: (str) => str.toLowerCase()
        },
        
        json: {
            parse: (str) => JSON.parse(str),
            stringify: (obj, replacer, space) => JSON.stringify(obj, replacer, space)
        },
        
        // Execute pre-defined operations
        execute: function(operation, ...args) {
            const parts = operation.split('.');
            let current = this;
            
            for (const part of parts) {
                current = current[part];
                if (!current) {
                    throw new Error(`Operation not found: ${operation}`);
                }
            }
            
            if (typeof current === 'function') {
                return current(...args);
            }
            
            return current;
        }
    };
}

/**
 * Module registry for pre-loaded modules
 * Since we can't eval module code, we need to pre-register modules
 */
export const moduleRegistry = new Map();

/**
 * Register a module for execution
 */
export function registerModule(name, moduleExports) {
    moduleRegistry.set(name, moduleExports);
    info(`[LEPUS] Module registered: ${name}`);
}

/**
 * Execute a registered module function
 */
export function executeRegisteredModule(moduleName, functionName, params) {
    const module = moduleRegistry.get(moduleName);
    if (!module) {
        throw new Error(`Module not found: ${moduleName}`);
    }
    
    const func = module[functionName];
    if (typeof func !== 'function') {
        throw new Error(`Function not found: ${moduleName}.${functionName}`);
    }
    
    return func(params);
}

// Pre-register some example modules
registerModule('HelloWorld', {
    greet: (params) => `Hello, ${params?.name || 'World'}!`,
    sayGoodbye: (params) => `Goodbye, ${params?.name || 'World'}!`,
    getGreeting: () => 'Welcome to LEPUS/PrimJS on Cloudflare Workers!'
});

registerModule('MathUtils', {
    add: (params) => (params?.a || 0) + (params?.b || 0),
    multiply: (params) => (params?.a || 0) * (params?.b || 0),
    factorial: (params) => {
        const n = params?.n || 0;
        if (n <= 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }
});

registerModule('StringUtils', {
    reverse: (params) => (params?.text || '').split('').reverse().join(''),
    capitalize: (params) => {
        const text = params?.text || '';
        return text.charAt(0).toUpperCase() + text.slice(1);
    },
    repeat: (params) => (params?.text || '').repeat(params?.times || 1)
});

/**
 * Create a safe execution context for LEPUS
 */
export function createSafeExecutionContext() {
    return {
        modules: moduleRegistry,
        execute: executeRegisteredModule,
        info: {
            engine: 'LEPUS/PrimJS',
            platform: 'Cloudflare Workers',
            limitations: [
                'No dynamic code evaluation (eval/Function)',
                'Pre-compiled modules only',
                'Garbage collection available'
            ]
        }
    };
}