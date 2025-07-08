/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import type { QuickJSWASMModule } from 'quickjs-emscripten';
import { newQuickJSWASMModule, RELEASE_SYNC as baseVariant, newVariant } from 'quickjs-emscripten';
import cloudflareWasmModule from './RELEASE_SYNC.wasm';
import type { HandlerContext } from './types.d.ts';

// Import handlers
import { handleCors, corsHeaders } from './corsHandler.js';
import { handleExamples } from './examplesHandler.js';
import { handleFetchCode, containsFetch } from './fetchCodeHandler.js';
import { handleCodeExecution } from './codeExecutionHandler.js';
import { handleError } from './errorHandler.js';
import { setupArenaWithFetch } from './fetchProxy.js';
import { handleExecuteModuleRoute } from './executeModuleHandler.js';
import { handleFederationDemoRoute } from './federationDemoHandler.js';
import { handleAssetsRoute, handleRemoteEntryRoute } from './assetsHandler.js';
import { handleArenaTestRoute, handleTestModuleRoute, handleTestFetchRoute, handleTestRealFetchRoute } from './testRoutesHandler.js';

/**
 * We need to make a new variant that directly passes the imported WebAssembly.Module
 * to Emscripten. Normally we'd load the wasm file as bytes from a URL, but
 * that's forbidden in Cloudflare workers.
 */
const cloudflareVariant = newVariant(baseVariant, {
	wasmModule: cloudflareWasmModule,
});

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
}

let QuickJS: QuickJSWASMModule | undefined;

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		QuickJS ??= await newQuickJSWASMModule(cloudflareVariant);

		const url = new URL(request.url);

		// Create normalized context object
		const context: HandlerContext = {
			request,
			url,
			env,
			executionContext: ctx,
			corsHeaders,
			QuickJS,
			setupArenaWithFetch: setupArenaWithFetch
		};

		// Handle CORS preflight requests
		const corsResponse = handleCors(context);
		if (corsResponse) {
			return corsResponse;
		}

		// Route handling based on pathname
		const pathname = url.pathname;

		try {
			// Module Federation interactive execution (POST only)
			if (pathname === '/execute-module' && request.method === 'POST') {
				if (!setupArenaWithFetch) {
					throw new Error('Arena setup function not available');
				}
				return await handleExecuteModuleRoute({
					...context,
					setupArenaWithFetch
				});
			}

			// Federation demo overview
			if (pathname === '/federation-demo') {
				return await handleFederationDemoRoute(context);
			}

			// Serve Module Federation assets
			if (pathname.startsWith('/assets/')) {
				return await handleAssetsRoute(context);
			}

			// Serve remote entry directly
			if (pathname === '/remoteEntry.js') {
				return await handleRemoteEntryRoute(context);
			}

			// Module Federation test routes
			if (pathname === '/arena-test') {
				return await handleArenaTestRoute(context);
			}

			if (pathname === '/test-module') {
				return await handleTestModuleRoute(context);
			}

			if (pathname === '/test-fetch') {
				return await handleTestFetchRoute(context);
			}

			if (pathname === '/test-real-fetch') {
				return await handleTestRealFetchRoute(context);
			}

			// POST /code - New code execution API
			if (pathname === '/code' && request.method === 'POST') {
				try {
					const body = await request.json();
					const { code: postCode } = body;
					
					if (!postCode || typeof postCode !== 'string') {
						return new Response(JSON.stringify({
							success: false,
							error: 'Missing or invalid code parameter'
						}), {
							status: 400,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders
							}
						});
					}

					// Create execution context with code from POST body
					const execContext = {
						...context,
						code: postCode
					};

					// Check if the code contains fetch - if so, handle it specially
					if (containsFetch(postCode)) {
						return await handleFetchCode(execContext);
					}

					// Regular code execution without fetch
					return handleCodeExecution(execContext);
				} catch (error) {
					return new Response(JSON.stringify({
						success: false,
						error: 'Invalid JSON in request body'
					}), {
						status: 400,
						headers: {
							'Content-Type': 'application/json',
							...corsHeaders
						}
					});
				}
			}


			// Default: Show examples/landing page
			return handleExamples(context);

		} catch (error) {
			// Create error context with error property
			const errorContext = {
				...context,
				error
			};
			return handleError(errorContext);
		}
	},
};
