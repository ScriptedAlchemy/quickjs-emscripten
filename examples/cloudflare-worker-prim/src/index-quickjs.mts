/**
 * Cloudflare Workers with PrimJS-Emscripten
 * 
 * Direct LEPUS API usage for native PrimJS performance.
 * No QuickJS compatibility layer.
 */

// Import PrimJS variant and WASM module
import { getQuickJS } from '@jitl/primjs-wasmfile-release-sync';
import PRIMJS_RELEASE_SYNC from './PRIMJS_RELEASE_SYNC.wasm';

// Import handlers
import { handleCors, corsHeaders } from './corsHandler.js';
import { handleError } from './errorHandler.js';
import { handleAssetsRoute, handleRemoteEntryRoute } from './assetsHandler.js';
import { handleExecuteModuleRoute } from './executeModuleHandler.js';
import { handleFederationDemoRoute } from './federationDemoHandler.js';

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
}

// QuickJS runtime and context (using PrimJS WASM)
let quickJS: any | undefined;

/**
 * Initialize PrimJS runtime
 */
async function initializeLEPUS() {
	if (quickJS) {
		return quickJS;
	}

	// Load QuickJS with PrimJS WASM module
	quickJS = await getQuickJS();
	
	console.log('🚀 PrimJS runtime initialized');
	
	return quickJS;
}

/**
 * Simple handler context without QuickJS compatibility
 */
interface LepusHandlerContext {
	request: Request;
	url: URL;
	env: Env;
	executionContext: ExecutionContext;
	corsHeaders: Record<string, string>;
	lepus: any;
	error?: Error | string | unknown;
}

/**
 * Execute JavaScript code using QuickJS API (with PrimJS WASM)
 */
function executeLEPUSCode(quickJS: any, code: string): any {
	const context = quickJS.newContext();
	
	try {
		// Evaluate code
		const result = context.evalCode(code);
		
		if (result.error) {
			const error = context.dump(result.error);
			result.error.dispose();
			throw new Error(error);
		}
		
		// Get result value
		const value = context.dump(result.value);
		result.value.dispose();
		
		return { success: true, result: value };
	} catch (error: any) {
		return { success: false, error: error.message || 'Unknown error' };
	} finally {
		// Cleanup context
		context.dispose();
	}
}

/**
 * Handle code execution endpoint
 */
async function handleCodeExecution(context: LepusHandlerContext): Promise<Response> {
	const { request, lepus, corsHeaders } = context;
	
	try {
		const body = await request.json();
		const { code } = body as { code: string };
		
		if (!code || typeof code !== 'string') {
			return new Response(JSON.stringify({
				error: 'Invalid request: code must be a non-empty string'
			}), {
				status: 400,
				headers: { 'Content-Type': 'application/json', ...corsHeaders }
			});
		}
		
		const result = executeLEPUSCode(lepus, code);
		
		return new Response(JSON.stringify({
			...result,
			engine: 'LEPUS/PrimJS',
			timestamp: new Date().toISOString()
		}), {
			status: result.success ? 200 : 500,
			headers: { 'Content-Type': 'application/json', ...corsHeaders }
		});
	} catch (error: any) {
		return new Response(JSON.stringify({
			error: error.message || 'Failed to process request',
			engine: 'LEPUS/PrimJS',
			timestamp: new Date().toISOString()
		}), {
			status: 400,
			headers: { 'Content-Type': 'application/json', ...corsHeaders }
		});
	}
}

/**
 * Handle examples/landing page
 */
function handleExamples(context: LepusHandlerContext): Response {
	const html = `
<!DOCTYPE html>
<html>
<head>
	<title>PrimJS on Cloudflare Workers</title>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			max-width: 800px;
			margin: 0 auto;
			padding: 20px;
			line-height: 1.6;
		}
		h1 { color: #333; }
		.endpoint {
			background: #f5f5f5;
			padding: 15px;
			margin: 10px 0;
			border-radius: 5px;
		}
		.method { 
			display: inline-block;
			padding: 3px 8px;
			border-radius: 3px;
			font-weight: bold;
			font-size: 0.9em;
		}
		.get { background: #61affe; color: white; }
		.post { background: #49cc90; color: white; }
		code {
			background: #f0f0f0;
			padding: 2px 5px;
			border-radius: 3px;
		}
		pre {
			background: #f5f5f5;
			padding: 15px;
			border-radius: 5px;
			overflow-x: auto;
		}
	</style>
</head>
<body>
	<h1>PrimJS on Cloudflare Workers</h1>
	<p>Direct LEPUS API usage for native PrimJS performance.</p>
	
	<h2>Available Endpoints</h2>
	
	<div class="endpoint">
		<span class="method post">POST</span> <code>/code</code>
		<p>Execute JavaScript code using PrimJS</p>
		<pre>{
  "code": "const sum = (a, b) => a + b; sum(5, 3)"
}</pre>
	</div>
	
	<div class="endpoint">
		<span class="method get">GET</span> <code>/assets/*</code>
		<p>Serve static assets from KV storage</p>
	</div>
	
	<div class="endpoint">
		<span class="method get">GET</span> <code>/remoteEntry.js</code>
		<p>Module Federation remote entry point</p>
	</div>
	
	<div class="endpoint">
		<span class="method get">GET</span> <code>/federation-demo</code>
		<p>Module Federation demo information</p>
	</div>
	
	<div class="endpoint">
		<span class="method post">POST</span> <code>/execute-module</code>
		<p>Execute Module Federation modules</p>
		<pre>{
  "module": "HelloWorld",
  "function": "greet",
  "params": { "name": "LEPUS" }
}</pre>
	</div>
	
	<h2>Example Usage</h2>
	<pre>// Execute code
fetch('/code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'console.log("Hello from PrimJS!"); return 42;'
  })
})
.then(res => res.json())
.then(console.log);</pre>
	
	<p><small>Powered by LEPUS/PrimJS • ${new Date().toISOString()}</small></p>
</body>
</html>`;
	
	return new Response(html, {
		headers: {
			'Content-Type': 'text/html',
			...context.corsHeaders
		}
	});
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			// Initialize LEPUS
			const lepus = await initializeLEPUS();
			
			const url = new URL(request.url);
			
			// Create handler context
			const context: LepusHandlerContext = {
				request,
				url,
				env,
				executionContext: ctx,
				corsHeaders,
				lepus
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
					// Read the request body
					const body = await request.json();
					const { code } = body as { code: string };
					
					return await handleCodeExecution(context);
				}

				// Serve Module Federation assets
				if (pathname.startsWith('/assets/')) {
					return await handleAssetsRoute({
						...context,
						LEPUS: lepus
					});
				}

				// Serve remote entry directly
				if (pathname === '/remoteEntry.js') {
					return await handleRemoteEntryRoute({
						...context,
						LEPUS: lepus
					});
				}

				// Module execution endpoint
				if (pathname === '/execute-module' && request.method === 'POST') {
					return await handleExecuteModuleRoute({
						...context,
						LEPUS: lepus
					});
				}

				// Module federation demo endpoint
				if (pathname === '/federation-demo') {
					return await handleFederationDemoRoute({
						...context,
						LEPUS: lepus
					});
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
				engine: 'LEPUS/PrimJS'
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