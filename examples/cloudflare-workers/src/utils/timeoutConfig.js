/**
 * Timeout Configuration Management
 * Comprehensive timeout configuration for all async operations
 */

import { Logger } from './logger.js';

/**
 * Default timeout configurations
 */
export const DEFAULT_TIMEOUTS = {
	// QuickJS execution
	quickjs: {
		createContext: 5000,      // 5 seconds
		executeCode: 30000,       // 30 seconds
		jobProcessing: 1000,      // 1 second per job
		handleCleanup: 500,       // 500ms
		arenaSync: 2000          // 2 seconds
	},
	
	// Network operations
	network: {
		fetch: 30000,            // 30 seconds
		kvGet: 5000,             // 5 seconds
		kvPut: 10000,            // 10 seconds
		kvList: 15000            // 15 seconds
	},
	
	// Module federation
	moduleFederation: {
		loadModule: 20000,       // 20 seconds
		parseManifest: 5000,     // 5 seconds
		resolveAssets: 10000     // 10 seconds
	},
	
	// Handler operations
	handlers: {
		codeExecution: 60000,    // 1 minute
		executeModule: 60000,    // 1 minute
		assetRetrieval: 30000,   // 30 seconds
		examples: 10000,         // 10 seconds
		federationDemo: 45000    // 45 seconds
	},
	
	// System operations
	system: {
		gracefulShutdown: 5000,  // 5 seconds
		healthCheck: 3000,       // 3 seconds
		warmup: 10000           // 10 seconds
	}
};

/**
 * Timeout configuration manager
 */
export class TimeoutManager {
	constructor(options = {}) {
		this.configs = new Map();
		this.overrides = new Map();
		this.logger = options.logger || null;
		
		// Initialize with defaults
		this.loadDefaults();
	}

	/**
	 * Load default timeout configurations
	 */
	loadDefaults() {
		Object.entries(DEFAULT_TIMEOUTS).forEach(([category, timeouts]) => {
			Object.entries(timeouts).forEach(([operation, timeout]) => {
				const key = `${category}.${operation}`;
				this.configs.set(key, {
					category,
					operation,
					timeout,
					isDefault: true
				});
			});
		});
	}

	/**
	 * Get timeout for operation
	 * @param {string} key - Operation key (e.g., 'quickjs.executeCode')
	 * @param {number} fallback - Fallback timeout
	 * @returns {number} Timeout in milliseconds
	 */
	get(key, fallback = 30000) {
		// Check overrides first
		if (this.overrides.has(key)) {
			return this.overrides.get(key);
		}

		// Check configured timeout
		const config = this.configs.get(key);
		if (config) {
			return config.timeout;
		}

		// Log missing configuration
		if (this.logger) {
			this.logger.warn(`No timeout configured for: ${key}, using fallback: ${fallback}ms`);
		}

		return fallback;
	}

	/**
	 * Set timeout for operation
	 * @param {string} key - Operation key
	 * @param {number} timeout - Timeout in milliseconds
	 */
	set(key, timeout) {
		if (typeof timeout !== 'number' || timeout <= 0) {
			throw new Error(`Invalid timeout value: ${timeout}`);
		}

		const [category, operation] = key.split('.');
		
		this.configs.set(key, {
			category,
			operation,
			timeout,
			isDefault: false
		});

		if (this.logger) {
			this.logger.info(`Timeout configured: ${key} = ${timeout}ms`);
		}
	}

	/**
	 * Override timeout temporarily
	 * @param {string} key - Operation key
	 * @param {number} timeout - Timeout in milliseconds
	 */
	override(key, timeout) {
		if (typeof timeout !== 'number' || timeout <= 0) {
			throw new Error(`Invalid timeout value: ${timeout}`);
		}

		this.overrides.set(key, timeout);

		if (this.logger) {
			this.logger.debug(`Timeout override: ${key} = ${timeout}ms`);
		}
	}

	/**
	 * Clear override
	 * @param {string} key - Operation key
	 */
	clearOverride(key) {
		this.overrides.delete(key);
	}

	/**
	 * Clear all overrides
	 */
	clearAllOverrides() {
		this.overrides.clear();
	}

	/**
	 * Get all timeouts for a category
	 * @param {string} category - Category name
	 * @returns {Object} Category timeouts
	 */
	getCategory(category) {
		const categoryTimeouts = {};
		
		for (const [key, config] of this.configs) {
			if (config.category === category) {
				categoryTimeouts[config.operation] = config.timeout;
			}
		}

		return categoryTimeouts;
	}

	/**
	 * Scale all timeouts by factor
	 * @param {number} factor - Scaling factor
	 */
	scale(factor) {
		if (typeof factor !== 'number' || factor <= 0) {
			throw new Error(`Invalid scaling factor: ${factor}`);
		}

		for (const [key, config] of this.configs) {
			config.timeout = Math.round(config.timeout * factor);
		}

		if (this.logger) {
			this.logger.info(`All timeouts scaled by factor: ${factor}`);
		}
	}

	/**
	 * Get timeout statistics
	 * @returns {Object} Statistics
	 */
	getStatistics() {
		const stats = {
			total: this.configs.size,
			defaults: 0,
			custom: 0,
			overrides: this.overrides.size,
			categories: {},
			ranges: {
				fast: 0,      // < 1s
				normal: 0,    // 1s - 10s
				slow: 0,      // 10s - 30s
				verySlow: 0   // > 30s
			}
		};

		for (const [key, config] of this.configs) {
			// Count defaults vs custom
			if (config.isDefault) {
				stats.defaults++;
			} else {
				stats.custom++;
			}

			// Count by category
			if (!stats.categories[config.category]) {
				stats.categories[config.category] = 0;
			}
			stats.categories[config.category]++;

			// Count by range
			const timeout = config.timeout;
			if (timeout < 1000) {
				stats.ranges.fast++;
			} else if (timeout <= 10000) {
				stats.ranges.normal++;
			} else if (timeout <= 30000) {
				stats.ranges.slow++;
			} else {
				stats.ranges.verySlow++;
			}
		}

		return stats;
	}

	/**
	 * Export configuration
	 * @returns {Object} Configuration export
	 */
	export() {
		const exported = {};
		
		for (const [key, config] of this.configs) {
			if (!exported[config.category]) {
				exported[config.category] = {};
			}
			exported[config.category][config.operation] = config.timeout;
		}

		return exported;
	}

	/**
	 * Import configuration
	 * @param {Object} config - Configuration to import
	 */
	import(config) {
		Object.entries(config).forEach(([category, operations]) => {
			Object.entries(operations).forEach(([operation, timeout]) => {
				this.set(`${category}.${operation}`, timeout);
			});
		});
	}
}

/**
 * Create timeout wrapper
 * @param {Function} fn - Function to wrap
 * @param {number} timeout - Timeout in milliseconds
 * @param {Object} options - Options
 * @returns {Function} Wrapped function
 */
export function withTimeout(fn, timeout, options = {}) {
	const {
		errorMessage = 'Operation timed out',
		logger = null,
		onTimeout = null
	} = options;

	return async function timeoutWrapper(...args) {
		const timeoutId = setTimeout(() => {
			if (onTimeout) {
				onTimeout();
			}
		}, timeout);

		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => {
				reject(new Error(`${errorMessage} after ${timeout}ms`));
			}, timeout);
		});

		try {
			const result = await Promise.race([
				fn(...args),
				timeoutPromise
			]);
			
			clearTimeout(timeoutId);
			return result;
		} catch (error) {
			clearTimeout(timeoutId);
			
			if (logger && error.message.includes('timed out')) {
				logger.error('Operation timeout', {
					function: fn.name || 'anonymous',
					timeout: `${timeout}ms`,
					error: error.message
				});
			}
			
			throw error;
		}
	};
}

/**
 * Create adaptive timeout wrapper
 * @param {Function} fn - Function to wrap
 * @param {Object} options - Options
 * @returns {Function} Wrapped function
 */
export function withAdaptiveTimeout(fn, options = {}) {
	const {
		initialTimeout = 5000,
		maxTimeout = 60000,
		increment = 1.5,
		logger = null
	} = options;

	let currentTimeout = initialTimeout;
	let successCount = 0;
	let failureCount = 0;

	return async function adaptiveTimeoutWrapper(...args) {
		const startTime = Date.now();

		try {
			const result = await withTimeout(fn, currentTimeout, { logger })(...args);
			const duration = Date.now() - startTime;

			// Adapt timeout based on performance
			successCount++;
			if (successCount > 3 && duration < currentTimeout * 0.5) {
				// Reduce timeout if consistently fast
				currentTimeout = Math.max(initialTimeout, currentTimeout / increment);
				if (logger) {
					logger.debug('Adaptive timeout reduced', { 
						newTimeout: `${currentTimeout}ms`,
						reason: 'consistent fast performance'
					});
				}
			}

			failureCount = 0;
			return result;
		} catch (error) {
			if (error.message.includes('timed out')) {
				failureCount++;
				
				// Increase timeout on failure
				currentTimeout = Math.min(maxTimeout, currentTimeout * increment);
				if (logger) {
					logger.warn('Adaptive timeout increased', {
						newTimeout: `${currentTimeout}ms`,
						failures: failureCount
					});
				}
			}
			
			throw error;
		}
	};
}

/**
 * Create timeout context
 * @param {Object} options - Context options
 * @returns {Object} Timeout utilities
 */
export function createTimeoutContext(options = {}) {
	const logger = options.logger || null;
	const manager = new TimeoutManager({ logger });

	return {
		manager,
		withTimeout: (fn, timeout, opts) => withTimeout(fn, timeout, { logger, ...opts }),
		withAdaptiveTimeout: (fn, opts) => withAdaptiveTimeout(fn, { logger, ...opts }),
		
		// Convenience methods
		get: (key, fallback) => manager.get(key, fallback),
		set: (key, timeout) => manager.set(key, timeout),
		override: (key, timeout) => manager.override(key, timeout),
		
		// Category-specific getters
		quickjs: () => manager.getCategory('quickjs'),
		network: () => manager.getCategory('network'),
		handlers: () => manager.getCategory('handlers')
	};
}

// Global timeout manager instance
export const globalTimeoutManager = new TimeoutManager();