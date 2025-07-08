import type { QuickJSWASMModule } from 'quickjs-emscripten';

/**
 * Normalized context object passed to all handlers
 */
export interface HandlerContext {
  /** Original request object */
  request: Request;

  /** Parsed URL object from the request */
  url: URL;

  /** Cloudflare Worker environment bindings */
  env: any; // Using any since Env interface may vary

  /** Execution context from Cloudflare Worker */
  executionContext: ExecutionContext;

  /** CORS headers object */
  corsHeaders: Record<string, string>;

  /** QuickJS WASM module instance */
  QuickJS: QuickJSWASMModule;

  /** JavaScript code to execute (optional, for code execution handlers) */
  code?: string | null;

  /** Error object (optional, for error handlers) */
  error?: Error | string | unknown;

  /** Setup function for Arena with fetch capabilities (optional) */
  setupArenaWithFetch?: Function;
}

/**
 * Generic handler function type
 */
export type Handler = (context: HandlerContext) => Promise<Response> | Response;

/**
 * Error handler function type
 */
export type ErrorHandler = (context: HandlerContext) => Response;
