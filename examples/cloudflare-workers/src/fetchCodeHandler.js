/**
 * Fetch Code Handler - Executes JavaScript code with fetch support
 */

import { createJsonResponse, createErrorResponse } from './utils/responseUtils.js';
import { setupArena } from './utils/arenaUtils.js';

/**
 * Handle code execution that includes fetch calls
 * @param {Object} context - Handler context object
 * @param {string} context.code - The JavaScript code to execute
 * @param {Object} context.QuickJS - The QuickJS module instance
 * @returns {Promise<Response>} - Response with execution results
 */
export async function handleFetchCode(context) {
	const { code, QuickJS } = context;

	// Extract fetch URLs and execute them first
	const fetchUrlMatch = code.match(/fetch\(['"`]([^'"`]+)['"`]\)/);
	if (!fetchUrlMatch) {
		throw new Error('No valid fetch URL found in code');
	}

	const fetchUrl = fetchUrlMatch[1];

	try {
		const response = await fetch(fetchUrl);
		const data = await response.json();

		// Set up Arena with fetched data as extra globals
		const { arena, logs, dispose } = setupArena(QuickJS, {
			enableFetch: false, // We're pre-fetching the data
			enableKv: false,
			extraGlobals: {
				fetchedData: JSON.stringify(data)
			}
		});

		// Replace fetch call with the fetched data in the code
		const modifiedCode = code.replace(/fetch\(['"`][^'"`]+['"`]\)(?:\.then\([^)]*\))*/, 'fetchedData');

		const result = arena.evalCode(modifiedCode);
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

		dispose();

		return createJsonResponse({
			code: modifiedCode,
			original_code: code,
			fetched_from: fetchUrl,
			logs,
			...output
		});
	} catch (fetchError) {
		return createErrorResponse(
			`Fetch failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
			{ code },
			500
		);
	}
}

/**
 * Check if code contains fetch calls
 * @param {string} code - The JavaScript code to check
 * @returns {boolean} - True if code contains fetch calls
 */
export function containsFetch(code) {
	return code.includes('fetch(');
}
