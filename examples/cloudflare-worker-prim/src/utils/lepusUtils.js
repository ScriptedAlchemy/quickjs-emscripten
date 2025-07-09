/**
 * LEPUS/PrimJS utilities for Cloudflare Workers
 * Helper functions for PrimJS integration
 */

import { info, warn, error as logError } from './logger.js';

/**
 * Get PrimJS instance information
 */
export function getPrimJSInfo() {
    return {
        engine: 'LEPUS/PrimJS',
        version: '2.11.1-rc.1',
        features: [
            'Garbage Collection',
            'WebAssembly Sandbox',
            'Memory Limits',
            'Interrupt Handlers',
            'Full JavaScript Support'
        ],
        performance: '28% faster than QuickJS'
    };
}

/**
 * Log PrimJS execution metrics
 */
export function logExecutionMetrics(executionTime, memoryUsed) {
    info(`[PrimJS] Execution completed in ${executionTime}ms`);
    if (memoryUsed) {
        info(`[PrimJS] Memory used: ${memoryUsed} bytes`);
    }
}