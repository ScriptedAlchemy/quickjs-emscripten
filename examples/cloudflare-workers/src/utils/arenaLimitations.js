/**
 * Arena Limitations Awareness in API Design
 * Design APIs aware of QuickJS Arena limitations
 */

import { Logger } from './logger.js';

/**
 * Known Arena limitations
 */
export const ARENA_LIMITATIONS = {
	// Type limitations
	types: {
		supported: [
			'boolean',
			'number',
			'string',
			'null',
			'undefined',
			'Array',
			'Object',
			'Function'
		],
		unsupported: [
			'Symbol',
			'BigInt',
			'Map',
			'Set',
			'WeakMap',
			'WeakSet',
			'ArrayBuffer',
			'SharedArrayBuffer',
			'DataView',
			'TypedArray',
			'Promise', // Requires special handling
			'Proxy',
			'Reflect'
		],
		special: {
			'Date': 'Converted to ISO string',
			'RegExp': 'Converted to pattern string',
			'Error': 'Converted to error object with message/stack',
			'URL': 'Converted to string',
			'Promise': 'Requires async Arena configuration'
		}
	},

	// Size limitations
	size: {
		maxStringLength: 1024 * 1024,      // 1MB
		maxArrayLength: 100000,            // 100k elements
		maxObjectKeys: 10000,              // 10k properties
		maxNestingDepth: 100,              // Nesting levels
		maxFunctionSize: 50000,            // Characters
		maxTotalHeapSize: 128 * 1024 * 1024 // 128MB
	},

	// Functionality limitations
	functionality: {
		noDOM: true,
		noNodeAPIs: true,
		noNetworking: true,
		noFileSystem: true,
		noTimers: ['setTimeout', 'setInterval', 'setImmediate'],
		noConsole: false, // Can be exposed
		noGlobals: ['window', 'document', 'navigator', 'location']
	},

	// Performance considerations
	performance: {
		syncOnly: false, // With asyncify
		singleThreaded: true,
		noSharedMemory: true,
		limitedStackSize: true,
		garbageCollection: 'manual'
	}
};

/**
 * Arena limitation checker
 */
export class ArenaLimitationChecker {
	constructor(options = {}) {
		this.logger = options.logger || null;
		this.strict = options.strict || false;
		this.limitations = { ...ARENA_LIMITATIONS, ...options.overrides };
		this.warnings = [];
		this.errors = [];
	}

	/**
	 * Check value compatibility
	 * @param {*} value - Value to check
	 * @param {string} path - Value path
	 * @returns {Object} Compatibility result
	 */
	checkValue(value, path = 'root') {
		const result = {
			compatible: true,
			warnings: [],
			errors: [],
			suggestions: []
		};

		// Check type
		const typeCheck = this.checkType(value, path);
		if (!typeCheck.compatible) {
			result.compatible = false;
			result.errors.push(...typeCheck.errors);
		}
		result.warnings.push(...typeCheck.warnings);
		result.suggestions.push(...typeCheck.suggestions);

		// Check size
		const sizeCheck = this.checkSize(value, path);
		if (!sizeCheck.compatible) {
			result.compatible = false;
			result.errors.push(...sizeCheck.errors);
		}
		result.warnings.push(...sizeCheck.warnings);

		// Check nested values
		if (typeof value === 'object' && value !== null) {
			const nestedCheck = this.checkNested(value, path);
			if (!nestedCheck.compatible) {
				result.compatible = false;
			}
			result.errors.push(...nestedCheck.errors);
			result.warnings.push(...nestedCheck.warnings);
			result.suggestions.push(...nestedCheck.suggestions);
		}

		return result;
	}

	/**
	 * Check type compatibility
	 * @param {*} value - Value to check
	 * @param {string} path - Value path
	 * @returns {Object} Type check result
	 */
	checkType(value, path) {
		const result = {
			compatible: true,
			warnings: [],
			errors: [],
			suggestions: []
		};

		const type = this.getDetailedType(value);

		// Check unsupported types
		if (this.limitations.types.unsupported.includes(type)) {
			result.compatible = false;
			result.errors.push({
				path,
				type: 'unsupported-type',
				message: `Type '${type}' is not supported in Arena`,
				value: type
			});

			// Add conversion suggestion
			if (this.limitations.types.special[type]) {
				result.suggestions.push({
					path,
					type: 'type-conversion',
					message: this.limitations.types.special[type],
					original: type
				});
			}
		}

		// Check special types
		if (this.limitations.types.special[type]) {
			result.warnings.push({
				path,
				type: 'special-type',
				message: this.limitations.types.special[type],
				value: type
			});
		}

		// Check function size
		if (type === 'Function') {
			const fnString = value.toString();
			if (fnString.length > this.limitations.size.maxFunctionSize) {
				result.compatible = false;
				result.errors.push({
					path,
					type: 'function-too-large',
					message: `Function exceeds maximum size (${fnString.length} > ${this.limitations.size.maxFunctionSize})`,
					size: fnString.length
				});
			}
		}

		return result;
	}

	/**
	 * Check size constraints
	 * @param {*} value - Value to check
	 * @param {string} path - Value path
	 * @returns {Object} Size check result
	 */
	checkSize(value, path) {
		const result = {
			compatible: true,
			warnings: [],
			errors: []
		};

		// String length
		if (typeof value === 'string') {
			if (value.length > this.limitations.size.maxStringLength) {
				result.compatible = false;
				result.errors.push({
					path,
					type: 'string-too-long',
					message: `String exceeds maximum length (${value.length} > ${this.limitations.size.maxStringLength})`,
					length: value.length
				});
			}
		}

		// Array length
		if (Array.isArray(value)) {
			if (value.length > this.limitations.size.maxArrayLength) {
				result.compatible = false;
				result.errors.push({
					path,
					type: 'array-too-large',
					message: `Array exceeds maximum length (${value.length} > ${this.limitations.size.maxArrayLength})`,
					length: value.length
				});
			}
		}

		// Object keys
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			const keyCount = Object.keys(value).length;
			if (keyCount > this.limitations.size.maxObjectKeys) {
				result.compatible = false;
				result.errors.push({
					path,
					type: 'object-too-many-keys',
					message: `Object has too many keys (${keyCount} > ${this.limitations.size.maxObjectKeys})`,
					keyCount
				});
			}
		}

		return result;
	}

	/**
	 * Check nested values
	 * @param {*} value - Value to check
	 * @param {string} path - Value path
	 * @param {number} depth - Current depth
	 * @returns {Object} Nested check result
	 */
	checkNested(value, path, depth = 0) {
		const result = {
			compatible: true,
			warnings: [],
			errors: [],
			suggestions: []
		};

		// Check nesting depth
		if (depth > this.limitations.size.maxNestingDepth) {
			result.compatible = false;
			result.errors.push({
				path,
				type: 'nesting-too-deep',
				message: `Nesting depth exceeds maximum (${depth} > ${this.limitations.size.maxNestingDepth})`,
				depth
			});
			return result;
		}

		// Check array elements
		if (Array.isArray(value)) {
			value.forEach((item, index) => {
				const itemCheck = this.checkValue(item, `${path}[${index}]`);
				if (!itemCheck.compatible) {
					result.compatible = false;
				}
				result.errors.push(...itemCheck.errors);
				result.warnings.push(...itemCheck.warnings);
				result.suggestions.push(...itemCheck.suggestions);
			});
		}

		// Check object properties
		else if (value && typeof value === 'object') {
			Object.entries(value).forEach(([key, val]) => {
				const propCheck = this.checkValue(val, `${path}.${key}`);
				if (!propCheck.compatible) {
					result.compatible = false;
				}
				result.errors.push(...propCheck.errors);
				result.warnings.push(...propCheck.warnings);
				result.suggestions.push(...propCheck.suggestions);
			});
		}

		return result;
	}

	/**
	 * Get detailed type of value
	 * @param {*} value - Value to check
	 * @returns {string} Detailed type
	 */
	getDetailedType(value) {
		if (value === null) return 'null';
		if (value === undefined) return 'undefined';
		
		const type = typeof value;
		if (type !== 'object') return type;

		// Check for specific object types
		if (Array.isArray(value)) return 'Array';
		if (value instanceof Date) return 'Date';
		if (value instanceof RegExp) return 'RegExp';
		if (value instanceof Error) return 'Error';
		if (value instanceof Map) return 'Map';
		if (value instanceof Set) return 'Set';
		if (value instanceof Promise) return 'Promise';
		if (value instanceof ArrayBuffer) return 'ArrayBuffer';
		if (value instanceof DataView) return 'DataView';
		if (ArrayBuffer.isView(value)) return 'TypedArray';
		
		// Check for other built-in types
		const className = Object.prototype.toString.call(value).slice(8, -1);
		if (className !== 'Object') return className;
		
		return 'Object';
	}

	/**
	 * Check API design
	 * @param {Object} api - API definition
	 * @returns {Object} API check result
	 */
	checkAPIDesign(api) {
		const result = {
			compatible: true,
			warnings: [],
			errors: [],
			suggestions: [],
			recommendations: []
		};

		// Check each endpoint/method
		Object.entries(api).forEach(([name, definition]) => {
			// Check parameters
			if (definition.parameters) {
				const paramCheck = this.checkValue(definition.parameters, `${name}.parameters`);
				if (!paramCheck.compatible) {
					result.compatible = false;
				}
				result.errors.push(...paramCheck.errors);
				result.warnings.push(...paramCheck.warnings);
			}

			// Check return type
			if (definition.returns) {
				const returnCheck = this.checkValue(definition.returns, `${name}.returns`);
				if (!returnCheck.compatible) {
					result.compatible = false;
				}
				result.errors.push(...returnCheck.errors);
				result.warnings.push(...returnCheck.warnings);
			}

			// Check for async patterns
			if (definition.async || definition.returns?.includes('Promise')) {
				result.recommendations.push({
					api: name,
					type: 'async-pattern',
					message: 'Consider using callbacks or synchronous alternatives for better Arena compatibility'
				});
			}
		});

		// Add general recommendations
		this.addAPIRecommendations(result);

		return result;
	}

	/**
	 * Add API design recommendations
	 * @param {Object} result - Result object
	 */
	addAPIRecommendations(result) {
		result.recommendations.push({
			type: 'general',
			message: 'Use simple data types (boolean, number, string, arrays, objects) for maximum compatibility'
		});

		result.recommendations.push({
			type: 'general',
			message: 'Avoid deeply nested structures to prevent stack overflow'
		});

		result.recommendations.push({
			type: 'general',
			message: 'Consider data size limits when designing APIs that handle large datasets'
		});

		result.recommendations.push({
			type: 'general',
			message: 'Provide type conversion utilities for unsupported types'
		});
	}

	/**
	 * Create Arena-safe wrapper
	 * @param {*} value - Value to wrap
	 * @param {Object} options - Wrapper options
	 * @returns {*} Arena-safe value
	 */
	createSafeWrapper(value, options = {}) {
		const {
			convertUnsupported = true,
			maxDepth = 50,
			onError = null
		} = options;

		const convert = (val, depth = 0) => {
			// Prevent infinite recursion
			if (depth > maxDepth) {
				return '[Max depth exceeded]';
			}

			// Handle primitives
			if (val === null || val === undefined) return val;
			if (typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string') {
				return val;
			}

			// Handle functions
			if (typeof val === 'function') {
				return val; // Functions can be passed through Arena
			}

			// Handle arrays
			if (Array.isArray(val)) {
				return val.map(item => convert(item, depth + 1));
			}

			// Handle special types
			const type = this.getDetailedType(val);
			
			if (type === 'Date') {
				return convertUnsupported ? val.toISOString() : val;
			}
			
			if (type === 'RegExp') {
				return convertUnsupported ? val.toString() : val;
			}
			
			if (type === 'Error') {
				return convertUnsupported ? {
					name: val.name,
					message: val.message,
					stack: val.stack
				} : val;
			}
			
			if (type === 'Map' || type === 'Set') {
				return convertUnsupported ? {
					type,
					entries: Array.from(val.entries()).map(entry => convert(entry, depth + 1))
				} : val;
			}

			// Handle unsupported types
			if (this.limitations.types.unsupported.includes(type)) {
				if (onError) {
					onError(new Error(`Unsupported type: ${type}`), val);
				}
				return convertUnsupported ? `[Unsupported: ${type}]` : undefined;
			}

			// Handle plain objects
			if (type === 'Object') {
				const converted = {};
				for (const [key, value] of Object.entries(val)) {
					converted[key] = convert(value, depth + 1);
				}
				return converted;
			}

			return val;
		};

		return convert(value);
	}
}

/**
 * Create Arena-aware API builder
 * @param {Object} options - Builder options
 * @returns {Object} API builder
 */
export function createArenaAwareAPI(options = {}) {
	const logger = options.logger || null;
	const checker = new ArenaLimitationChecker({ logger });

	return {
		/**
		 * Define Arena-compatible method
		 * @param {string} name - Method name
		 * @param {Function} implementation - Method implementation
		 * @param {Object} schema - Method schema
		 * @returns {Function} Wrapped method
		 */
		method(name, implementation, schema = {}) {
			return async function arenaAwareMethod(...args) {
				// Validate inputs
				if (schema.parameters) {
					const paramCheck = checker.checkValue(args, `${name}.args`);
					if (!paramCheck.compatible && options.strict) {
						throw new Error(`Invalid parameters for ${name}: ${paramCheck.errors[0]?.message}`);
					}
				}

				// Execute method
				let result;
				try {
					result = await implementation(...args);
				} catch (error) {
					if (logger) {
						logger.error(`Arena method ${name} failed`, { error: error.message });
					}
					throw error;
				}

				// Validate output
				if (schema.returns) {
					const returnCheck = checker.checkValue(result, `${name}.result`);
					if (!returnCheck.compatible) {
						if (options.autoConvert) {
							result = checker.createSafeWrapper(result);
						} else if (options.strict) {
							throw new Error(`Invalid return value for ${name}: ${returnCheck.errors[0]?.message}`);
						}
					}
				}

				return result;
			};
		},

		/**
		 * Create type converter
		 * @param {string} fromType - Source type
		 * @param {string} toType - Target type
		 * @param {Function} converter - Conversion function
		 */
		addConverter(fromType, toType, converter) {
			// Store converters for automatic conversion
			if (!this.converters) this.converters = new Map();
			this.converters.set(`${fromType}->${toType}`, converter);
		},

		/**
		 * Validate API design
		 * @param {Object} apiDefinition - API definition
		 * @returns {Object} Validation result
		 */
		validate(apiDefinition) {
			return checker.checkAPIDesign(apiDefinition);
		},

		/**
		 * Create safe wrapper
		 * @param {*} value - Value to wrap
		 * @returns {*} Safe value
		 */
		wrap(value) {
			return checker.createSafeWrapper(value, options);
		},

		/**
		 * Get limitations reference
		 * @returns {Object} Arena limitations
		 */
		getLimitations() {
			return ARENA_LIMITATIONS;
		}
	};
}