/**
 * Handle serving Module Federation assets from KV storage
 */

import { createErrorResponse, validateAssetPath, createContextualErrorResponse, ValidationError } from './utils/responseUtils.js';
import { getKvAsset, getKvAssetWithMetadata, getContentType } from './utils/kvUtils.js';
import { corsHeaders } from './corsHandler.js';
import { MODULE_FEDERATION, CACHE_HEADERS } from './utils/constants.js';

async function handleAssetsRoute(context) {
    const { url, env, corsHeaders } = context;

    try {
        const assetPath = url.pathname.substring(8); // Remove '/assets/' prefix
        
        // Validate asset path
        validateAssetPath(assetPath);

        const asset = await getKvAsset(env, assetPath);

        if (!asset) {
            return createContextualErrorResponse(
                new Error('Asset not found'),
                {
                    handler: 'assetsHandler',
                    operation: 'getAsset',
                    inputs: { assetPath }
                },
                404,
                corsHeaders
            );
        }

        // Get metadata to determine content type
        const metadata = await getKvAssetWithMetadata(env, assetPath);
        const contentType = (metadata?.metadata)?.contentType || getContentType(assetPath);

        return new Response(asset, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': CACHE_HEADERS.ASSETS,
                ...corsHeaders
            }
        });

    } catch (error) {
        // Handle validation errors with 400 status
        if (error instanceof ValidationError) {
            return createContextualErrorResponse(
                error,
                {
                    handler: 'assetsHandler',
                    operation: 'validation',
                    inputs: { pathname: url.pathname }
                },
                400,
                corsHeaders
            );
        }

        // Handle other errors
        return createContextualErrorResponse(
            error,
            {
                handler: 'assetsHandler',
                operation: 'serveAsset',
                inputs: { pathname: url.pathname }
            },
            500,
            corsHeaders
        );
    }
}

/**
 * Handle serving the remoteEntry.js file directly
 */
async function handleRemoteEntryRoute(context) {
    const { env, corsHeaders } = context;

    try {
        const remoteEntry = await getKvAsset(env, MODULE_FEDERATION.REMOTE_ENTRY);

        if (!remoteEntry) {
            return createContextualErrorResponse(
                new Error('Module Federation entry not found'),
                {
                    handler: 'assetsHandler',
                    operation: 'getRemoteEntry',
                    inputs: { file: MODULE_FEDERATION.REMOTE_ENTRY }
                },
                404,
                corsHeaders
            );
        }

        return new Response(remoteEntry, {
            headers: {
                'Content-Type': 'application/javascript',
                'Cache-Control': CACHE_HEADERS.REMOTE_ENTRY,
                ...corsHeaders
            }
        });

    } catch (error) {
        return createContextualErrorResponse(
            error,
            {
                handler: 'assetsHandler',
                operation: 'serveRemoteEntry',
                inputs: { file: MODULE_FEDERATION.REMOTE_ENTRY }
            },
            500,
            corsHeaders
        );
    }
}

export {
    handleAssetsRoute,
    handleRemoteEntryRoute
};
