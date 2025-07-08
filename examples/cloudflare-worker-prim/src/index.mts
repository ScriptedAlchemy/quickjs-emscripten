/**
 * Cloudflare Workers with Direct LEPUS/PrimJS
 * 
 * Pure LEPUS API usage without QuickJS compatibility layer.
 * This is the native PrimJS implementation as requested.
 */

// Import LEPUS/PrimJS directly
import { createLEPUSModule } from '@jitl/primjs-emscripten';
import PRIMJS_RELEASE_SYNC from './PRIMJS_RELEASE_SYNC.wasm';

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
}

// LEPUS module instance
let lepusModule: any | undefined;

/**
 * Initialize LEPUS runtime
 */
async function initializeLEPUS() {
	if (lepusModule) {
		return lepusModule;
	}

	// Create LEPUS module directly
	lepusModule = await createLEPUSModule();
	
	console.log('🚀 LEPUS/PrimJS runtime initialized (native mode)');
	
	return lepusModule;
}

/**
 * Handler context for LEPUS-native implementation
 */
interface LepusHandlerContext {
	request: Request;
	url: URL;
	env: Env;
	executionContext: ExecutionContext;
	corsHeaders: Record<string, string>;
	LEPUS: any;
	error?: Error | string | unknown;
}


/**
 * Handle examples/landing page
 */
function handleExamples(context: LepusHandlerContext): Response {
	const html = `
<!DOCTYPE html>
<html>
<head>
	<title>LEPUS/PrimJS on Cloudflare Workers</title>
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
		.badge {
			display: inline-block;
			padding: 2px 8px;
			background: #ff6b6b;
			color: white;
			border-radius: 3px;
			font-size: 0.8em;
			margin-left: 10px;
		}
	</style>
</head>
<body>
	<h1>LEPUS/PrimJS on Cloudflare Workers <span class="badge">Native Mode</span></h1>
	<p>Direct LEPUS API usage for maximum PrimJS performance. No QuickJS compatibility layer.</p>
	<p><strong>Features:</strong> Garbage Collection, Chrome DevTools support, High Performance</p>
	
	<h2>Available Endpoints</h2>
	
	<div class="endpoint">
		<span class="method post">POST</span> <code>/code</code>
		<p>Execute JavaScript code using native LEPUS/PrimJS</p>
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
		<p>Execute Module Federation modules with LEPUS</p>
		<pre>{
  "module": "HelloWorld",
  "function": "greet",
  "params": { "name": "LEPUS" }
}</pre>
	</div>
	
	<h2>Example Usage</h2>
	<pre>// Execute code with native LEPUS
fetch('/code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: \`
      // PrimJS with garbage collection!
      const obj = { message: "Hello from LEPUS!" };
      JSON.stringify(obj);
    \`
  })
})
.then(res => res.json())
.then(console.log);</pre>
	
	<p><small>Powered by LEPUS/PrimJS ${context.LEPUS.isGCMode() ? '(GC Enabled)' : ''} • ${new Date().toISOString()}</small></p>
</body>
</html>`;
	
	return new Response(html, {
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
			// Initialize LEPUS
			const LEPUS = await initializeLEPUS();
			
			const url = new URL(request.url);
			
			// Create handler context
			const context: LepusHandlerContext = {
				request,
				url,
				env,
				executionContext: ctx,
				corsHeaders,
				LEPUS
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