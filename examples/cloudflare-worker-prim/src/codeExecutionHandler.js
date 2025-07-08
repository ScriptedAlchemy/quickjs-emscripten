/**
 * Code Execution Handler - Executes regular JavaScript code using LEPUS
 */

import { createJsonResponse, validateCodeInput, createContextualErrorResponse, ValidationError, validateResponse } from './utils/responseUtils.js';

/**
 * Handle regular code execution using LEPUS directly
 * @param {Object} context - Handler context object
 * @param {string} context.code - The JavaScript code to execute
 * @param {Object} context.LEPUS - The LEPUS module instance
 * @param {Object} context.corsHeaders - CORS headers
 * @returns {Response} - Response with execution results
 */
export function handleCodeExecution(context) {
	const { code, LEPUS, corsHeaders = {} } = context;

	try {
		// Validate input code
		validateCodeInput(code);

		// Create logs array for collecting output
		const logs = [];

		// Create a new LEPUS runtime with security limits
		const runtime = LEPUS.newRuntime();
		
		// Set security limits (LEPUS has native memory management)
		runtime.setMemoryLimit(1024 * 1024); // 1MB memory limit
		// Note: LEPUS has automatic GC, no manual memory management needed
		
		// Create a new context
		const ctx = runtime.newContext();

		try {
			// Set up console for logging
			const consoleObj = ctx.newObject();
			
			// Add console.log function
			const logFn = ctx.newFunction('log', (...args) => {
				const message = args.map(arg => String(arg)).join(' ');
				logs.push(`[VM] ${message}`);
			});
			ctx.setProp(consoleObj, 'log', logFn);
			logFn.dispose();
			
			// Add console.error function
			const errorFn = ctx.newFunction('error', (...args) => {
				const message = args.map(arg => String(arg)).join(' ');
				logs.push(`[VM] ERROR: ${message}`);
			});
			ctx.setProp(consoleObj, 'error', errorFn);
			errorFn.dispose();
			
			// Set console on global
			ctx.setProp(ctx.global, 'console', consoleObj);
			consoleObj.dispose();

			// Execute the code using LEPUS evalCode
			const evalResult = ctx.evalCode(code);
			
			let output;
			if (evalResult.error) {
				// LEPUS provides native error handling
				const error = ctx.dump(evalResult.error);
				evalResult.error.dispose();
				output = { error: error.toString() };
			} else {
				// Get the result value
				const result = ctx.dump(evalResult.value);
				evalResult.value.dispose();
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
			// LEPUS has automatic garbage collection
			// Just dispose the context and runtime
			ctx.dispose();
			runtime.dispose();
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
