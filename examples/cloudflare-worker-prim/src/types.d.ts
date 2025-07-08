import type { LEPUSModule } from '@jitl/primjs-emscripten';

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

  /** LEPUS module instance (native PrimJS for performance) */
  LEPUS: LEPUSModule;

  /** JavaScript code to execute (optional, for code execution handlers) */
  code?: string | null;

  /** Error object (optional, for error handlers) */
  error?: Error | string | unknown;

}

/**
 * Generic handler function type
 */
export type Handler = (context: HandlerContext) => Promise<Response> | Response;

/**
 * Error handler function type
 */
export type ErrorHandler = (context: HandlerContext) => Response;
