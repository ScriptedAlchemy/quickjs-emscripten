/**
 * Handle the federation demo endpoint - provides overview of Module Federation capabilities
 */

import { createJsonResponse, createErrorResponse } from './utils/responseUtils.js';
import { getKvAsset } from './utils/kvUtils.js';
import { MODULE_FEDERATION } from './utils/constants.js';

async function handleFederationDemoRoute(context) {
    const { env, corsHeaders } = context;

    try {
        // Get the remote entry from KV using shared utility
        const remoteEntry = await getKvAsset(env, MODULE_FEDERATION.REMOTE_ENTRY);
        if (!remoteEntry) {
            return createErrorResponse('Module Federation assets not found', corsHeaders || {}, 404);
        }

        const demoResponse = {
            message: 'Real Module Federation Demo - Use /test-module for execution',
            assets_available: true,
            remote_entry_size: remoteEntry.length,
            real_execution_endpoint: '/test-module',
            exposed_modules: MODULE_FEDERATION.EXPOSED_MODULES,
            note: 'Real Module Federation execution available at /test-module endpoint'
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
