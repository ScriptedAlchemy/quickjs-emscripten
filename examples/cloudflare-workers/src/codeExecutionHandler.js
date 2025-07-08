/**
 * Code Execution Handler - Executes regular JavaScript code
 */

import { createJsonResponse, validateCodeInput, createContextualErrorResponse, ValidationError, validateResponse } from './utils/responseUtils.js';
import { setupArena } from './utils/arenaUtils.js';

/**
 * Handle regular code execution without fetch
 * @param {Object} context - Handler context object
 * @param {string} context.code - The JavaScript code to execute
 * @param {Object} context.QuickJS - The QuickJS module instance
 * @param {Object} context.corsHeaders - CORS headers
 * @returns {Response} - Response with execution results
 */
export function handleCodeExecution(context) {
	const { code, QuickJS, corsHeaders = {} } = context;

	try {
		// Validate input code
		validateCodeInput(code);

		// Set up Arena for consistent execution environment with strict security limits
		const { arena, logs, dispose } = setupArena(QuickJS, {
			enableFetch: false,
			enableKv: false,
			// Stricter limits for public code execution to prevent abuse
			memoryLimitBytes: 1024 * 1024, // 1MB memory limit (stricter than default)
			stackLimitBytes: 1024 * 128, // 128KB stack limit (stricter than default)
			maxInterruptCycles: 5000 // ~2-5 seconds execution time (stricter than default)
		});

		try {
			const result = arena.evalCode(code);
			let output;

			if (result === null || result === undefined) {
				// Check for errors in the logs
				const errorInLogs = logs.find(log => log.includes('ERROR'));
				if (errorInLogs) {
					output = { error: errorInLogs };
				} else {
					output = { error: 'Code execution returned null or undefined' };
				}
			} else {
				output = { result };
			}

			// Build response data
			const responseData = {
				code,
				logs,
				...output
			};

			// Validate response structure
			validateResponse(responseData, ['code', 'logs']);

			return createJsonResponse(responseData, corsHeaders);

		} finally {
			// Ensure cleanup happens even if execution fails
			dispose();
		}

	} catch (error) {
		// Handle validation errors with 400 status
		if (error instanceof ValidationError) {
			return createContextualErrorResponse(
				error,
				{
					handler: 'codeExecutionHandler',
					operation: 'validation',
					inputs: { codeLength: code?.length || 0 }
				},
				400,
				corsHeaders
			);
		}

		// Handle other errors
		return createContextualErrorResponse(
			error,
			{
				handler: 'codeExecutionHandler',
				operation: 'executeCode',
				inputs: { codeLength: code?.length || 0 }
			},
			500,
			corsHeaders
		);
	}
}

/**
 * Validate JavaScript code (basic validation)
 * @param {string} code - The JavaScript code to validate
 * @returns {boolean} - True if code appears valid
 */
export function validateCode(code) {
	try {
		validateCodeInput(code);
		return true;
	} catch (error) {
		return false;
	}
}
