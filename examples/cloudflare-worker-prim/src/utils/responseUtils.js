/**
 * Response Utilities - Shared utilities for consistent response creation
 */

import { corsHeaders } from '../corsHandler.js';
import { MODULE_FEDERATION } from './constants.js';

/**
 * Create a standardized JSON response with CORS headers
 * @param {Object} data - The data to include in the response
 * @param {Object} options - Response options
 * @param {number} options.status - HTTP status code (default: 200)
 * @param {Object} options.extraHeaders - Additional headers to include
 * @param {boolean} options.addTimestamp - Whether to add a timestamp (default: true)
 * @returns {Response} - JSON response with CORS headers
 */
export function createJsonResponse(data, options = {}) {
	const {
		status = 200,
		extraHeaders = {},
		addTimestamp = true
	} = options;

	const responseData = addTimestamp
		? { ...data, timestamp: new Date().toISOString() }
		: data;

	return new Response(JSON.stringify(responseData, null, 2), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...extraHeaders
		}
	});
}

/**
 * Create a standardized success response
 * @param {Object} data - The success data
 * @param {string} message - Optional success message
 * @param {Object} options - Response options
 * @returns {Response} - Success response
 */
export function createSuccessResponse(data, message = null, options = {}) {
	const responseData = {
		success: true,
		...(message && { message }),
		...data
	};

	return createJsonResponse(responseData, options);
}

/**
 * Create a standardized error response
 * @param {Error|string} error - The error that occurred
 * @param {Object} context - Additional context for the error
 * @param {number} status - HTTP status code (default: 500)
 * @returns {Response} - Error response
 */
export function createErrorResponse(error, context = {}, status = 500) {
	const errorMessage = error instanceof Error ? error.message : String(error);

	const responseData = {
		success: false,
		error: errorMessage,
		...context
	};

	return createJsonResponse(responseData, { status });
}

/**
 * Create a validation error response
 * @param {string} message - Validation error message
 * @param {Object} context - Additional context
 * @returns {Response} - Validation error response
 */
export function createValidationErrorResponse(message, context = {}) {
	return createErrorResponse(
		new Error(`Validation Error: ${message}`),
		context,
		400
	);
}

/**
 * Validation error class
 */
export class ValidationError extends Error {
	constructor(message, errors = []) {
		super(message);
		this.name = 'ValidationError';
		this.errors = errors;
	}
}

/**
 * Validate execute module input
 * @param {URL} url - Request URL
 * @param {Object} env - Environment object
 * @throws {ValidationError} If validation fails
 */
export function validateExecuteModuleInput(url, env) {
	const errors = [];
	
	// Validate URL
	if (!url || !(url instanceof URL)) {
		errors.push('Invalid URL object');
	}
	
	// Validate environment
	if (!env) {
		errors.push('Missing environment object');
	} else if (!env.MODULE_FEDERATION_ASSETS) {
		errors.push('Missing MODULE_FEDERATION_ASSETS in environment');
	}
	
	// Validate module parameter
	if (url) {
		const module = url.searchParams.get('module');
		if (module) {
			const validModules = ['HelloWorld', 'DataProcessor', 'WorkerUtils', 'FetchUtils', 'AdvancedExamples', 'ApiUtils'];
			if (!validModules.includes(module)) {
				errors.push(`Invalid module: ${module}. Valid modules: ${validModules.join(', ')}`);
			}
		}
		
		// Validate function parameter if module is provided
		const func = url.searchParams.get('function');
		if (module && !func) {
			errors.push('Missing function parameter when module is specified');
		}
	}
	
	if (errors.length > 0) {
		throw new ValidationError(`Input validation failed: ${errors.join('; ')}`, errors);
	}
}

/**
 * Validate code execution input
 * @param {string} code - JavaScript code to execute
 * @throws {ValidationError} If validation fails
 */
export function validateCodeInput(code) {
	const errors = [];
	
	if (code === null || code === undefined) {
		errors.push('Code parameter is required');
	} else if (typeof code !== 'string') {
		errors.push(`Code must be a string, received ${typeof code}`);
	} else if (code.trim() === '') {
		errors.push('Code cannot be empty or whitespace only');
	} else if (code.length > 100000) {
		errors.push('Code exceeds maximum length of 100,000 characters');
	}
	
	if (errors.length > 0) {
		throw new ValidationError(`Code validation failed: ${errors.join('; ')}`, errors);
	}
}

/**
 * Validate response data structure
 * @param {Object} responseData - Response data to validate
 * @param {Array<string>} requiredFields - Required fields in response
 * @throws {Error} If validation fails
 */
export function validateResponse(responseData, requiredFields = []) {
	if (!responseData || typeof responseData !== 'object') {
		throw new Error('Response data must be an object');
	}
	
	const missing = requiredFields.filter(field => !(field in responseData));
	if (missing.length > 0) {
		throw new Error(`Response missing required fields: ${missing.join(', ')}`);
	}
	
	// Validate timestamp if present
	if (responseData.timestamp) {
		const timestamp = new Date(responseData.timestamp);
		if (isNaN(timestamp.getTime())) {
			throw new Error('Invalid timestamp format');
		}
	}
	
	// Validate error field if present
	if (responseData.error && typeof responseData.error !== 'string') {
		throw new Error('Error field must be a string');
	}
	
	return true;
}

/**
 * Validate asset path
 * @param {string} assetPath - Asset path to validate
 * @throws {ValidationError} If validation fails
 */
export function validateAssetPath(assetPath) {
	const errors = [];
	
	if (!assetPath || typeof assetPath !== 'string') {
		errors.push('Asset path must be a non-empty string');
	} else {
		// Prevent directory traversal
		if (assetPath.includes('..')) {
			errors.push('Asset path cannot contain directory traversal');
		}
		
		// Check for invalid characters
		if (!/^[\w\-\.\/]+$/.test(assetPath)) {
			errors.push('Asset path contains invalid characters');
		}
		
		// Check file extension
		const validExtensions = ['.js', '.mjs', '.json', '.css', '.html', '.txt', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.wasm', '.map'];
		const hasValidExtension = validExtensions.some(ext => assetPath.endsWith(ext));
		if (!hasValidExtension) {
			errors.push(`Asset must have a valid extension: ${validExtensions.join(', ')}`);
		}
	}
	
	if (errors.length > 0) {
		throw new ValidationError(`Asset path validation failed: ${errors.join('; ')}`, errors);
	}
}

/**
 * Create a contextual error response with detailed information
 * @param {Error} error - The error that occurred
 * @param {Object} context - Context information
 * @param {number} status - HTTP status code
 * @param {Object} corsHeaders - CORS headers
 * @returns {Response}
 */
export function createContextualErrorResponse(error, context, status = 500, corsHeaders = {}) {
	const errorContext = {
		error: error instanceof Error ? error.message : String(error),
		context: {
			handler: context.handler,
			operation: context.operation,
			inputs: context.inputs,
			timestamp: new Date().toISOString()
		}
	};
	
	// Add validation errors if present
	if (error instanceof ValidationError && error.errors) {
		errorContext.validationErrors = error.errors;
	}
	
	// Add truncated stack trace in development
	if (error instanceof Error && error.stack && process.env.NODE_ENV !== 'production') {
		errorContext.stack = error.stack.split('\n').slice(0, 5);
	}
	
	return createJsonResponse(errorContext, { 
		status, 
		extraHeaders: corsHeaders 
	});
}
