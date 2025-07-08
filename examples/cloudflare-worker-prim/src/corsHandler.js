/**
 * CORS Handler - Manages CORS headers and OPTIONS requests for LEPUS
 */

export const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handle CORS preflight requests
 * @param {Object} context - Handler context object
 * @param {Request} context.request - The incoming request
 * @returns {Response|null} - CORS response or null if not an OPTIONS request
 */
export function handleCors(context) {
	const { request } = context;

	if (request.method === 'OPTIONS') {
		return new Response(null, { headers: corsHeaders });
	}
	return null;
}

/**
 * Add CORS headers to a response
 * @param {Response} response - The response to add headers to
 * @returns {Response} - Response with CORS headers added
 */
export function addCorsHeaders(response) {
	const newHeaders = new Headers(response.headers);
	Object.entries(corsHeaders).forEach(([key, value]) => {
		newHeaders.set(key, value);
	});

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: newHeaders
	});
}
