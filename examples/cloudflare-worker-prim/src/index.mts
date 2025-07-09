/**
 * Cloudflare Workers with Direct LEPUS/PrimJS
 * 
 * Pure LEPUS API usage without QuickJS compatibility layer.
 * This is the native PrimJS implementation as requested.
 */

// Import PrimJS variant and WASM module
import { newQuickJSWASMModuleFromVariant, newVariant } from 'quickjs-emscripten-core';
import type { QuickJSWASMModule } from 'quickjs-emscripten-core';
import PRIMJS_RELEASE_SYNC from '@jitl/primjs-wasmfile-release-sync';
import primjsWasmModule from './PRIMJS_RELEASE_SYNC.wasm';

// Import handlers
import { handleCors, corsHeaders } from './corsHandler.js';
import { handleError } from './errorHandler.js';
import { handleAssetsRoute, handleRemoteEntryRoute } from './assetsHandler.js';
import { handleExecuteModuleRoute } from './executeModuleHandlerLepus.js';
import { handleFederationDemoRoute } from './federationDemoHandler.js';
import { handleCodeExecution } from './codeExecutionHandlerLepus.js';

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	MODULE_FEDERATION_ASSETS?: KVNamespace;
}

// Create PrimJS variant for Cloudflare Workers
const primjsCloudflareVariant = newVariant(PRIMJS_RELEASE_SYNC, {
	wasmModule: primjsWasmModule,
});

// Global PrimJS instance
let PrimJS: QuickJSWASMModule | undefined;


/**
 * Handler context for LEPUS-native implementation
 */
interface LepusHandlerContext {
	request: Request;
	url: URL;
	env: Env;
	executionContext: ExecutionContext;
	corsHeaders: Record<string, string>;
	PrimJS: QuickJSWASMModule;
	error?: Error | string | unknown;
}


/**
 * Handle examples/landing page
 */
async function handleExamples(context: LepusHandlerContext): Promise<Response> {
	// Import the rich HTML page
	const { default: htmlPage } = await import('./htmlPageLepus.js');
	
	return new Response(htmlPage, {
		headers: {
			'Content-Type': 'text/html',
			...context.corsHeaders,
			'X-Engine': 'LEPUS-Native'
		}
	});
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			// Initialize PrimJS if not already done
			PrimJS ??= await newQuickJSWASMModuleFromVariant(primjsCloudflareVariant);
			
			const url = new URL(request.url);
			
			// Create handler context
			const context: LepusHandlerContext = {
				request,
				url,
				env,
				executionContext: ctx,
				corsHeaders,
				PrimJS
			};

			// Handle CORS preflight requests
			const corsResponse = handleCors({ request });
			if (corsResponse) {
				return corsResponse;
			}

			// Route handling
			const pathname = url.pathname;

			try {
				// Code execution endpoint
				if (pathname === '/code' && request.method === 'POST') {
					return await handleCodeExecution(context);
				}

				// Serve Module Federation assets
				if (pathname.startsWith('/assets/')) {
					return await handleAssetsRoute(context);
				}

				// Serve remote entry directly
				if (pathname === '/remoteEntry.js') {
					return await handleRemoteEntryRoute(context);
				}

				// Module execution endpoint
				if (pathname === '/execute-module' && request.method === 'POST') {
					return await handleExecuteModuleRoute(context);
				}

				// Module federation demo endpoint
				if (pathname === '/federation-demo') {
					return await handleFederationDemoRoute(context);
				}

				// Default: Show examples/landing page
				return handleExamples(context);

			} catch (error) {
				// Handle route-specific errors
				const errorContext = { ...context, error };
				return handleError(errorContext);
			}
		} catch (error: any) {
			// Global error handler
			return new Response(JSON.stringify({
				error: error.message || 'Internal server error',
				timestamp: new Date().toISOString(),
				engine: 'LEPUS/PrimJS (Native)'
			}), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders,
					'X-Engine': 'LEPUS-Native'
				}
			});
		}
	},
};