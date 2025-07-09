/**
 * Edge Case Handling Patterns
 * Provides graceful handling for null/undefined/invalid inputs
 */

import { Logger } from './logger.js';
import { ValidationError } from './responseUtils.js';

/**
 * Safe value extractor with fallback
 * @param {*} value - Value to extract
 * @param {*} fallback - Fallback value
 * @param {Function} transformer - Optional transformer
 * @returns {*} Safe value
 */
export function safeValue(value, fallback, transformer = null) {
	// Handle null/undefined
	if (value === null || value === undefined) {
		return fallback;
	}

	// Apply transformer if provided
	if (transformer) {
		try {
			return transformer(value);
		} catch (error) {
			return fallback;
		}
	}

	return value;
}

/**
 * Safe property access with path
 * @param {Object} obj - Object to access
 * @param {string} path - Property path (e.g., 'a.b.c')
 * @param {*} fallback - Fallback value
 * @returns {*} Property value or fallback
 */
export function safeGet(obj, path, fallback = undefined) {
	if (!obj || typeof obj !== 'object') {
		return fallback;
	}

	const keys = path.split('.');
	let current = obj;

	for (const key of keys) {
		if (current === null || current === undefined || !(key in current)) {
			return fallback;
		}
		current = current[key];
	}

	return current;
}

/**
 * Safe array operations
 */
export const safeArray = {
	/**
	 * Ensure value is an array
	 * @param {*} value - Value to check
	 * @param {Array} fallback - Fallback array
	 * @returns {Array} Array value
	 */
	ensure(value, fallback = []) {
		if (Array.isArray(value)) {
			return value;
		}
		if (value === null || value === undefined) {
			return fallback;
		}
		// Single value to array
		return [value];
	},

	/**
	 * Safe array access
	 * @param {Array} arr - Array to access
	 * @param {number} index - Index
	 * @param {*} fallback - Fallback value
	 * @returns {*} Array element or fallback
	 */
	get(arr, index, fallback = undefined) {
		if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
			return fallback;
		}
		return arr[index];
	},

	/**
	 * Safe array map with error handling
	 * @param {Array} arr - Array to map
	 * @param {Function} mapper - Mapper function
	 * @param {Object} options - Options
	 * @returns {Array} Mapped array
	 */
	map(arr, mapper, options = {}) {
		const {
			skipErrors = true,
			fallbackValue = null,
			logger = null
		} = options;

		if (!Array.isArray(arr)) {
			return [];
		}

		const results = [];
		
		for (let i = 0; i < arr.length; i++) {
			try {
				results.push(mapper(arr[i], i, arr));
			} catch (error) {
				if (logger) {
					logger.warn(`Array map error at index ${i}`, { error: error.message });
				}
				
				if (!skipErrors) {
					throw error;
				}
				
				if (fallbackValue !== undefined) {
					results.push(fallbackValue);
				}
			}
		}

		return results;
	},

	/**
	 * Safe array filter
	 * @param {Array} arr - Array to filter
	 * @param {Function} predicate - Filter predicate
	 * @param {Object} options - Options
	 * @returns {Array} Filtered array
	 */
	filter(arr, predicate, options = {}) {
		const { skipErrors = true, logger = null } = options;

		if (!Array.isArray(arr)) {
			return [];
		}

		const results = [];
		
		for (let i = 0; i < arr.length; i++) {
			try {
				if (predicate(arr[i], i, arr)) {
					results.push(arr[i]);
				}
			} catch (error) {
				if (logger) {
					logger.warn(`Array filter error at index ${i}`, { error: error.message });
				}
				
				if (!skipErrors) {
					throw error;
				}
			}
		}

		return results;
	}
};

/**
 * Safe string operations
 */
export const safeString = {
	/**
	 * Ensure value is a string
	 * @param {*} value - Value to check
	 * @param {string} fallback - Fallback string
	 * @returns {string} String value
	 */
	ensure(value, fallback = '') {
		if (typeof value === 'string') {
			return value;
		}
		if (value === null || value === undefined) {
			return fallback;
		}
		return String(value);
	},

	/**
	 * Safe string trim
	 * @param {*} value - Value to trim
	 * @param {string} fallback - Fallback value
	 * @returns {string} Trimmed string
	 */
	trim(value, fallback = '') {
		const str = this.ensure(value, fallback);
		return str.trim();
	},

	/**
	 * Safe string split
	 * @param {*} value - Value to split
	 * @param {string} separator - Separator
	 * @param {Object} options - Options
	 * @returns {Array} Split array
	 */
	split(value, separator, options = {}) {
		const { limit, fallback = [] } = options;
		const str = this.ensure(value);
		
		if (!str) {
			return fallback;
		}

		return limit ? str.split(separator, limit) : str.split(separator);
	},

	/**
	 * Safe JSON parse
	 * @param {*} value - Value to parse
	 * @param {*} fallback - Fallback value
	 * @returns {*} Parsed value or fallback
	 */
	parseJSON(value, fallback = null) {
		const str = this.ensure(value);
		
		if (!str) {
			return fallback;
		}

		try {
			return JSON.parse(str);
		} catch (error) {
			return fallback;
		}
	}
};

/**
 * Safe number operations
 */
export const safeNumber = {
	/**
	 * Parse number safely
	 * @param {*} value - Value to parse
	 * @param {number} fallback - Fallback number
	 * @returns {number} Parsed number
	 */
	parse(value, fallback = 0) {
		if (typeof value === 'number' && !isNaN(value)) {
			return value;
		}
		
		const parsed = Number(value);
		return isNaN(parsed) ? fallback : parsed;
	},

	/**
	 * Parse integer safely
	 * @param {*} value - Value to parse
	 * @param {number} fallback - Fallback integer
	 * @returns {number} Parsed integer
	 */
	parseInt(value, fallback = 0) {
		const parsed = parseInt(value, 10);
		return isNaN(parsed) ? fallback : parsed;
	},

	/**
	 * Clamp number to range
	 * @param {number} value - Value to clamp
	 * @param {number} min - Minimum value
	 * @param {number} max - Maximum value
	 * @returns {number} Clamped value
	 */
	clamp(value, min, max) {
		const num = this.parse(value, min);
		return Math.max(min, Math.min(max, num));
	}
};

/**
 * Safe function execution
 * @param {Function} fn - Function to execute
 * @param {Array} args - Arguments
 * @param {Object} options - Options
 * @returns {*} Function result or fallback
 */
export async function safeExecute(fn, args = [], options = {}) {
	const {
		fallback = null,
		timeout = null,
		logger = null,
		context = null
	} = options;

	try {
		// Create timeout promise if needed
		if (timeout) {
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Function timeout')), timeout);
			});

			const fnPromise = Promise.resolve(fn.apply(context, args));
			return await Promise.race([fnPromise, timeoutPromise]);
		}

		// Regular execution
		return await fn.apply(context, args);
	} catch (error) {
		if (logger) {
			logger.warn('Safe execute error', {
				error: error.message,
				function: fn.name || 'anonymous'
			});
		}
		return fallback;
	}
}

/**
 * Edge case handler builder
 */
export class EdgeCaseHandler {
	constructor(options = {}) {
		this.logger = options.logger || null;
		this.handlers = new Map();
		this.defaultHandler = null;
	}

	/**
	 * Register edge case handler
	 * @param {string} type - Edge case type
	 * @param {Function} handler - Handler function
	 * @returns {EdgeCaseHandler} Self for chaining
	 */
	register(type, handler) {
		this.handlers.set(type, handler);
		return this;
	}

	/**
	 * Set default handler
	 * @param {Function} handler - Default handler
	 * @returns {EdgeCaseHandler} Self for chaining
	 */
	setDefault(handler) {
		this.defaultHandler = handler;
		return this;
	}

	/**
	 * Handle edge case
	 * @param {*} value - Value to handle
	 * @param {Object} context - Context
	 * @returns {*} Handled value
	 */
	async handle(value, context = {}) {
		// Determine edge case type
		const type = this.detectType(value);
		
		// Get appropriate handler
		const handler = this.handlers.get(type) || this.defaultHandler;
		
		if (!handler) {
			throw new Error(`No handler for edge case type: ${type}`);
		}

		// Execute handler
		try {
			return await handler(value, context);
		} catch (error) {
			if (this.logger) {
				this.logger.error('Edge case handler error', {
					type,
					error: error.message
				});
			}
			throw error;
		}
	}

	/**
	 * Detect edge case type
	 * @param {*} value - Value to check
	 * @returns {string} Edge case type
	 */
	detectType(value) {
		if (value === null) return 'null';
		if (value === undefined) return 'undefined';
		if (value === '') return 'empty-string';
		if (Array.isArray(value) && value.length === 0) return 'empty-array';
		if (typeof value === 'object' && Object.keys(value).length === 0) return 'empty-object';
		if (typeof value === 'number' && isNaN(value)) return 'nan';
		if (value === Infinity || value === -Infinity) return 'infinity';
		return 'normal';
	}
}

/**
 * Create a guarded handler wrapper
 * @param {Function} handler - Handler function
 * @param {Object} options - Guard options
 * @returns {Function} Guarded handler
 */
export function createGuardedHandler(handler, options = {}) {
	const {
		validateInput = null,
		transformInput = null,
		validateOutput = null,
		transformOutput = null,
		fallbackResponse = null,
		logger = null
	} = options;

	return async function guardedHandler(...args) {
		try {
			// Validate input
			if (validateInput) {
				const validation = await validateInput(...args);
				if (!validation.valid) {
					throw new ValidationError(validation.message, validation.errors);
				}
			}

			// Transform input
			let processedArgs = args;
			if (transformInput) {
				processedArgs = await transformInput(...args);
			}

			// Execute handler
			let result = await handler(...processedArgs);

			// Validate output
			if (validateOutput) {
				const validation = await validateOutput(result);
				if (!validation.valid) {
					throw new ValidationError(
						`Invalid output: ${validation.message}`,
						validation.errors
					);
				}
			}

			// Transform output
			if (transformOutput) {
				result = await transformOutput(result);
			}

			return result;
		} catch (error) {
			if (logger) {
				logger.error('Guarded handler error', {
					handler: handler.name || 'anonymous',
					error: error.message,
					stack: error.stack
				});
			}

			// Return fallback if provided
			if (fallbackResponse) {
				return typeof fallbackResponse === 'function'
					? await fallbackResponse(error, ...args)
					: fallbackResponse;
			}

			throw error;
		}
	};
}

/**
 * Create edge case aware wrapper
 * @param {Object} options - Options
 * @returns {Object} Edge case utilities
 */
export function createEdgeCaseContext(options = {}) {
	const logger = options.logger || null;

	return {
		safeValue,
		safeGet,
		safeArray,
		safeString,
		safeNumber,
		safeExecute: (fn, args) => safeExecute(fn, args, { logger }),
		handler: new EdgeCaseHandler({ logger }),
		createGuarded: (handler, opts) => createGuardedHandler(handler, { ...opts, logger })
	};
}