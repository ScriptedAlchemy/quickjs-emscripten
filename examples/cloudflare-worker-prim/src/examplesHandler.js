/**
 * Examples Handler - Shows help and usage information for LEPUS
 */

import { createJsonResponse } from './utils/responseUtils.js';
import { EXAMPLES } from './utils/constants.js';
import { htmlPage } from './htmlPage.js';

/**
 * Handle requests without code parameter - show examples and usage
 * @param {Object} [context] - Handler context object (optional for backwards compatibility)
 * @returns {Response} - HTML page for browsers, JSON for API calls
 */
export function handleExamples(context) {
	// Check if this is a browser request (looks for HTML in Accept header)
	const acceptHeader = context?.request?.headers?.get('Accept') || '';
	const isHtmlRequest = acceptHeader.includes('text/html');

	if (isHtmlRequest) {
		// Return HTML page for browser requests
		return new Response(htmlPage, {
			headers: {
				'Content-Type': 'text/html;charset=UTF-8',
				...context.corsHeaders
			}
		});
	}

	// Return JSON for API calls
	const responseData = {
		message: 'LEPUS/PrimJS Cloudflare Worker - High-performance JavaScript execution with native GC',
		endpoints: {
			code_execution: 'POST /code with JSON body {"code": "your-js-code"}',
			module_execution: 'POST /execute-module with JSON body {"module": "ModuleName", "function": "functionName", "params": {...}}'
		},
		examples: EXAMPLES,
		usage: 'Use POST requests with JSON bodies for secure, modern API access',
		runtime: 'Powered by LEPUS/PrimJS - 28% faster than QuickJS with automatic garbage collection',
		fetch_note: 'Fetch-based code execution is supported for external API calls but disabled for the public /code endpoint for security',
		documentation: 'Visit the homepage with a browser to see full API documentation'
	};

	return createJsonResponse(responseData, {
		extraHeaders: context?.corsHeaders || {}
	});
}

/**
 * Get the examples object for testing purposes
 * @returns {Object} - The examples object
 */
export function getExamples() {
	return EXAMPLES;
}
