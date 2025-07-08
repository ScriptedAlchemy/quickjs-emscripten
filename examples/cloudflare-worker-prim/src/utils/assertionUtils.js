/**
 * Assertion Utilities for Structured Test-like Assertions
 */

import { Logger } from './logger.js';

/**
 * Custom assertion error with detailed context
 */
export class AssertionError extends Error {
	constructor(message, context = {}) {
		super(message);
		this.name = 'AssertionError';
		this.context = context;
		this.timestamp = new Date().toISOString();
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			context: this.context,
			timestamp: this.timestamp,
			stack: this.stack
		};
	}
}

/**
 * Assertion configuration and state
 */
class AssertionConfig {
	constructor() {
		this.enabled = true;
		this.throwOnFailure = true;
		this.logger = null;
		this.results = [];
	}

	setLogger(logger) {
		this.logger = logger;
	}

	recordResult(assertion) {
		this.results.push(assertion);
		if (this.logger && !assertion.passed) {
			this.logger.error(`Assertion failed: ${assertion.message}`, assertion.context);
		}
		return assertion;
	}

	getReport() {
		const passed = this.results.filter(r => r.passed).length;
		const failed = this.results.filter(r => !r.passed).length;
		return {
			total: this.results.length,
			passed,
			failed,
			results: this.results,
			success: failed === 0
		};
	}

	clear() {
		this.results = [];
	}
}

// Global assertion configuration
const config = new AssertionConfig();

/**
 * Core assertion function
 * @param {boolean} condition - Condition to test
 * @param {string} message - Failure message
 * @param {Object} context - Additional context
 * @returns {Object} Assertion result
 */
function assert(condition, message, context = {}) {
	const result = {
		passed: !!condition,
		message,
		context,
		timestamp: new Date().toISOString()
	};

	config.recordResult(result);

	if (!condition && config.throwOnFailure && config.enabled) {
		throw new AssertionError(message, context);
	}

	return result;
}

/**
 * Assertion utilities
 */
export const assertions = {
	/**
	 * Configure assertions
	 * @param {Object} options - Configuration options
	 */
	configure(options = {}) {
		if (options.enabled !== undefined) config.enabled = options.enabled;
		if (options.throwOnFailure !== undefined) config.throwOnFailure = options.throwOnFailure;
		if (options.logger !== undefined) config.setLogger(options.logger);
	},

	/**
	 * Get assertion report
	 * @returns {Object} Report of all assertions
	 */
	getReport() {
		return config.getReport();
	},

	/**
	 * Clear assertion results
	 */
	clear() {
		config.clear();
	},

	/**
	 * Assert equality with detailed comparison
	 * @param {*} actual - Actual value
	 * @param {*} expected - Expected value
	 * @param {string} message - Optional message
	 * @returns {Object} Assertion result
	 */
	assertEqual(actual, expected, message = '') {
		const passed = actual === expected;
		const defaultMessage = `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
		
		return assert(passed, message || defaultMessage, {
			actual,
			expected,
			type: 'assertEqual'
		});
	},

	/**
	 * Assert deep equality
	 * @param {*} actual - Actual value
	 * @param {*} expected - Expected value
	 * @param {string} message - Optional message
	 * @returns {Object} Assertion result
	 */
	assertDeepEqual(actual, expected, message = '') {
		const passed = JSON.stringify(actual) === JSON.stringify(expected);
		const defaultMessage = `Deep equality failed`;
		
		return assert(passed, message || defaultMessage, {
			actual,
			expected,
			type: 'assertDeepEqual',
			actualJSON: JSON.stringify(actual, null, 2),
			expectedJSON: JSON.stringify(expected, null, 2)
		});
	},

	/**
	 * Assert truthy value
	 * @param {*} value - Value to test
	 * @param {string} message - Optional message
	 * @returns {Object} Assertion result
	 */
	assertTruthy(value, message = '') {
		const defaultMessage = `Expected truthy value, got ${JSON.stringify(value)}`;
		return assert(!!value, message || defaultMessage, {
			actual: value,
			type: 'assertTruthy'
		});
	},

	/**
	 * Assert falsy value
	 * @param {*} value - Value to test
	 * @param {string} message - Optional message
	 * @returns {Object} Assertion result
	 */
	assertFalsy(value, message = '') {
		const defaultMessage = `Expected falsy value, got ${JSON.stringify(value)}`;
		return assert(!value, message || defaultMessage, {
			actual: value,
			type: 'assertFalsy'
		});
	},

	/**
	 * Assert type
	 * @param {*} value - Value to test
	 * @param {string} expectedType - Expected type
	 * @param {string} message - Optional message
	 * @returns {Object} Assertion result
	 */
	assertType(value, expectedType, message = '') {
		const actualType = typeof value;
		const passed = actualType === expectedType;
		const defaultMessage = `Expected type ${expectedType}, got ${actualType}`;
		
		return assert(passed, message || defaultMessage, {
			actual: value,
			actualType,
			expectedType,
			type: 'assertType'
		});
	},

	/**
	 * Assert instance of
	 * @param {*} value - Value to test
	 * @param {Function} constructor - Expected constructor
	 * @param {string} message - Optional message
	 * @returns {Object} Assertion result
	 */
	assertInstanceOf(value, constructor, message = '') {
		const passed = value instanceof constructor;
		const defaultMessage = `Expected instance of ${constructor.name}`;
		
		return assert(passed, message || defaultMessage, {
			actual: value,
			expectedConstructor: constructor.name,
			actualConstructor: value?.constructor?.name,
			type: 'assertInstanceOf'
		});
	},

	/**
	 * Assert array contains
	 * @param {Array} array - Array to test
	 * @param {*} item - Item to find
	 * @param {string} message - Optional message
	 * @returns {Object} Assertion result
	 */
	assertContains(array, item, message = '') {
		const passed = Array.isArray(array) && array.includes(item);
		const defaultMessage = `Array does not contain ${JSON.stringify(item)}`;
		
		return assert(passed, message || defaultMessage, {
			array,
			item,
			type: 'assertContains'
		});
	},

	/**
	 * Assert object has property
	 * @param {Object} obj - Object to test
	 * @param {string} property - Property name
	 * @param {string} message - Optional message
	 * @returns {Object} Assertion result
	 */
	assertHasProperty(obj, property, message = '') {
		const passed = obj && property in obj;
		const defaultMessage = `Object does not have property "${property}"`;
		
		return assert(passed, message || defaultMessage, {
			object: obj,
			property,
			type: 'assertHasProperty'
		});
	},

	/**
	 * Assert throws error
	 * @param {Function} fn - Function to test
	 * @param {RegExp|string|Function} expected - Expected error
	 * @param {string} message - Optional message
	 * @returns {Object} Assertion result
	 */
	assertThrows(fn, expected = null, message = '') {
		let error = null;
		let passed = false;

		try {
			fn();
		} catch (e) {
			error = e;
			if (expected === null) {
				passed = true;
			} else if (expected instanceof RegExp) {
				passed = expected.test(e.message);
			} else if (typeof expected === 'string') {
				passed = e.message.includes(expected);
			} else if (typeof expected === 'function') {
				passed = e instanceof expected;
			}
		}

		const defaultMessage = expected 
			? `Expected error matching ${expected}, got ${error?.message || 'no error'}`
			: `Expected function to throw`;
		
		return assert(passed, message || defaultMessage, {
			error,
			expected,
			type: 'assertThrows'
		});
	},

	/**
	 * Assert async throws
	 * @param {Function} asyncFn - Async function to test
	 * @param {RegExp|string|Function} expected - Expected error
	 * @param {string} message - Optional message
	 * @returns {Promise<Object>} Assertion result
	 */
	async assertAsyncThrows(asyncFn, expected = null, message = '') {
		let error = null;
		let passed = false;

		try {
			await asyncFn();
		} catch (e) {
			error = e;
			if (expected === null) {
				passed = true;
			} else if (expected instanceof RegExp) {
				passed = expected.test(e.message);
			} else if (typeof expected === 'string') {
				passed = e.message.includes(expected);
			} else if (typeof expected === 'function') {
				passed = e instanceof expected;
			}
		}

		const defaultMessage = expected 
			? `Expected async error matching ${expected}, got ${error?.message || 'no error'}`
			: `Expected async function to throw`;
		
		return assert(passed, message || defaultMessage, {
			error,
			expected,
			type: 'assertAsyncThrows'
		});
	},

	/**
	 * Assert response status
	 * @param {Response} response - Response object
	 * @param {number} expectedStatus - Expected status code
	 * @param {string} message - Optional message
	 * @returns {Object} Assertion result
	 */
	assertResponseStatus(response, expectedStatus, message = '') {
		const passed = response.status === expectedStatus;
		const defaultMessage = `Expected status ${expectedStatus}, got ${response.status}`;
		
		return assert(passed, message || defaultMessage, {
			actual: response.status,
			expected: expectedStatus,
			statusText: response.statusText,
			type: 'assertResponseStatus'
		});
	},

	/**
	 * Assert response header
	 * @param {Response} response - Response object
	 * @param {string} header - Header name
	 * @param {string} expectedValue - Expected value (optional)
	 * @param {string} message - Optional message
	 * @returns {Object} Assertion result
	 */
	assertResponseHeader(response, header, expectedValue = null, message = '') {
		const actualValue = response.headers.get(header);
		const hasHeader = actualValue !== null;
		const passed = expectedValue === null ? hasHeader : actualValue === expectedValue;
		
		const defaultMessage = expectedValue === null
			? `Expected header "${header}" to exist`
			: `Expected header "${header}" to be "${expectedValue}", got "${actualValue}"`;
		
		return assert(passed, message || defaultMessage, {
			header,
			actual: actualValue,
			expected: expectedValue,
			type: 'assertResponseHeader'
		});
	},

	/**
	 * Assert response JSON
	 * @param {Response} response - Response object
	 * @param {Object} expected - Expected JSON
	 * @param {string} message - Optional message
	 * @returns {Promise<Object>} Assertion result
	 */
	async assertResponseJSON(response, expected, message = '') {
		let actual;
		let error;

		try {
			actual = await response.json();
		} catch (e) {
			error = e;
		}

		if (error) {
			return assert(false, message || 'Failed to parse response as JSON', {
				error,
				type: 'assertResponseJSON'
			});
		}

		return this.assertDeepEqual(actual, expected, message || 'Response JSON mismatch');
	},

	/**
	 * Assert within range
	 * @param {number} value - Value to test
	 * @param {number} min - Minimum value
	 * @param {number} max - Maximum value
	 * @param {string} message - Optional message
	 * @returns {Object} Assertion result
	 */
	assertInRange(value, min, max, message = '') {
		const passed = typeof value === 'number' && value >= min && value <= max;
		const defaultMessage = `Expected ${value} to be between ${min} and ${max}`;
		
		return assert(passed, message || defaultMessage, {
			actual: value,
			min,
			max,
			type: 'assertInRange'
		});
	},

	/**
	 * Create a test scope with automatic reporting
	 * @param {string} name - Test name
	 * @param {Function} fn - Test function
	 * @returns {Promise<Object>} Test result
	 */
	async test(name, fn) {
		const startTime = Date.now();
		config.clear();

		let error = null;
		try {
			await fn();
		} catch (e) {
			error = e;
		}

		const duration = Date.now() - startTime;
		const report = config.getReport();

		const result = {
			name,
			duration,
			...report,
			error
		};

		if (config.logger) {
			const emoji = result.success ? '✅' : '❌';
			config.logger.test(`${emoji} ${name}`, {
				duration: `${duration}ms`,
				assertions: `${report.passed}/${report.total}`
			});
		}

		return result;
	}
};

/**
 * Create assertion context for handlers
 * @param {Logger} logger - Optional logger
 * @returns {Object} Assertion context
 */
export function createAssertionContext(logger = null) {
	const context = {
		...assertions,
		results: []
	};

	// Configure with logger if provided
	if (logger) {
		context.configure({ logger });
	}

	return context;
}