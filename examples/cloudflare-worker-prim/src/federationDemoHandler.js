/**
 * Handle the federation demo endpoint - provides overview of Module Federation capabilities
 * Updated for LEPUS/PrimJS runtime
 */

import { createJsonResponse, createErrorResponse } from './utils/responseUtils.js';
import { getKvAsset } from './utils/kvUtils.js';
import { MODULE_FEDERATION } from './utils/constants.js';

async function handleFederationDemoRoute(context) {
    const { env, corsHeaders, LEPUS } = context;

    try {
        // Get the remote entry from KV using shared utility
        const remoteEntry = await getKvAsset(env, MODULE_FEDERATION.REMOTE_ENTRY);
        if (!remoteEntry) {
            return createErrorResponse('Module Federation assets not found', corsHeaders || {}, 404);
        }

        const demoResponse = {
            message: 'Module Federation Demo - Powered by LEPUS/PrimJS',
            runtime: 'LEPUS/PrimJS with GC',
            assets_available: true,
            remote_entry_size: remoteEntry.length,
            execution_endpoint: '/execute-module',
            exposed_modules: MODULE_FEDERATION.EXPOSED_MODULES,
            features: [
                'Native garbage collection',
                'Simplified memory management',
                'Direct LEPUS API access',
                'No Arena/QuickJS dependencies'
            ],
            note: 'Module execution available at /execute-module endpoint'
        };

        return createJsonResponse(demoResponse, {
            extraHeaders: corsHeaders || {}
        });
    } catch (error) {
        return createErrorResponse(`Federation demo error: ${error}`, corsHeaders || {}, 500);
    }
}

export {
    handleFederationDemoRoute
};
