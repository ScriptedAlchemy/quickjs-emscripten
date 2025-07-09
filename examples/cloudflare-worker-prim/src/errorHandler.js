/**
 * Error Handler - Manages error responses consistently
 */

import { corsHeaders } from './corsHandler.js';

/**
 * Handle errors and return consistent error responses
 * @param {Object} context - Handler context object
 * @param {Error|string|unknown} context.error - The error that occurred
 * @param {string} context.code - The code that caused the error
 * @param {number} status - HTTP status code (default: 500)
 * @returns {Response} - Error response
 */
export function handleError(context, status = 500) {
	const { error, code } = context;
	const errorMessage = error instanceof Error ? error.message : String(error);

	const responseData = {
		error: errorMessage,
		timestamp: new Date().toISOString()
	};

	// Only include code field if it's present
	if (code !== undefined && code !== null) {
		responseData.code = code;
	}

	return new Response(JSON.stringify(responseData, null, 2), {
		status,
		headers: { 'Content-Type': 'application/json', ...corsHeaders }
	});
}

/**
 * Handle validation errors specifically
 * @param {Object} context - Handler context object
 * @param {string} message - Validation error message
 * @returns {Response} - Validation error response
 */
export function handleValidationError(context, message) {
	return handleError({
		...context,
		error: new Error(`Validation Error: ${message}`)
	}, 400);
}

/**
 * Format error for logging/debugging
 * @param {Error|string} error - The error to format
 * @returns {Object} - Formatted error object
 */
export function formatError(error) {
	if (error instanceof Error) {
		return {
			message: error.message,
			stack: error.stack,
			name: error.name
		};
	}
	return { message: String(error) };
}
