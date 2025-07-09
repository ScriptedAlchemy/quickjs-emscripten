/**
 * Mock/Fallback Mechanisms
 * Implements fallback behaviors and circuit breaker patterns for production edge cases
 */

import { Logger } from './logger.js';

/**
 * Circuit breaker states
 */
const CircuitState = {
	CLOSED: 'CLOSED',
	OPEN: 'OPEN',
	HALF_OPEN: 'HALF_OPEN'
};

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
	constructor(options = {}) {
		this.name = options.name || 'CircuitBreaker';
		this.failureThreshold = options.failureThreshold || 5;
		this.successThreshold = options.successThreshold || 2;
		this.timeout = options.timeout || 60000; // 1 minute
		this.halfOpenRetries = options.halfOpenRetries || 3;
		this.logger = options.logger || null;
		
		// State tracking
		this.state = CircuitState.CLOSED;
		this.failureCount = 0;
		this.successCount = 0;
		this.nextAttempt = 0;
		this.lastFailureTime = null;
		this.statistics = {
			requests: 0,
			failures: 0,
			successes: 0,
			rejections: 0,
			timeouts: 0,
			fallbacks: 0
		};
	}

	/**
	 * Execute function with circuit breaker
	 * @param {Function} fn - Function to execute
	 * @param {Function} fallback - Fallback function
	 * @returns {*} Function result or fallback
	 */
	async execute(fn, fallback = null) {
		this.statistics.requests++;

		// Check circuit state
		if (this.state === CircuitState.OPEN) {
			if (Date.now() < this.nextAttempt) {
				this.statistics.rejections++;
				if (this.logger) {
					this.logger.warn(`Circuit breaker ${this.name} is OPEN`, {
						nextAttempt: new Date(this.nextAttempt).toISOString()
					});
				}
				
				if (fallback) {
					this.statistics.fallbacks++;
					return await this.executeFallback(fallback);
				}
				
				throw new Error(`Circuit breaker ${this.name} is OPEN`);
			}
			
			// Move to half-open
			this.state = CircuitState.HALF_OPEN;
			this.successCount = 0;
			if (this.logger) {
				this.logger.info(`Circuit breaker ${this.name} moved to HALF_OPEN`);
			}
		}

		try {
			const result = await fn();
			this.onSuccess();
			return result;
		} catch (error) {
			this.onFailure(error);
			
			if (fallback) {
				this.statistics.fallbacks++;
				return await this.executeFallback(fallback, error);
			}
			
			throw error;
		}
	}

	/**
	 * Execute fallback function
	 * @param {Function} fallback - Fallback function
	 * @param {Error} originalError - Original error
	 * @returns {*} Fallback result
	 */
	async executeFallback(fallback, originalError = null) {
		try {
			if (this.logger) {
				this.logger.info(`Executing fallback for ${this.name}`, {
					originalError: originalError?.message
				});
			}
			return await fallback(originalError);
		} catch (fallbackError) {
			if (this.logger) {
				this.logger.error(`Fallback failed for ${this.name}`, {
					error: fallbackError.message
				});
			}
			throw fallbackError;
		}
	}

	/**
	 * Handle successful execution
	 */
	onSuccess() {
		this.statistics.successes++;
		this.failureCount = 0;
		
		if (this.state === CircuitState.HALF_OPEN) {
			this.successCount++;
			
			if (this.successCount >= this.successThreshold) {
				this.state = CircuitState.CLOSED;
				if (this.logger) {
					this.logger.info(`Circuit breaker ${this.name} moved to CLOSED`);
				}
			}
		}
	}

	/**
	 * Handle failed execution
	 * @param {Error} error - Execution error
	 */
	onFailure(error) {
		this.statistics.failures++;
		this.failureCount++;
		this.lastFailureTime = Date.now();
		
		if (this.logger) {
			this.logger.error(`Circuit breaker ${this.name} recorded failure`, {
				error: error.message,
				failureCount: this.failureCount
			});
		}
		
		if (this.state === CircuitState.HALF_OPEN || 
			this.failureCount >= this.failureThreshold) {
			this.state = CircuitState.OPEN;
			this.nextAttempt = Date.now() + this.timeout;
			
			if (this.logger) {
				this.logger.warn(`Circuit breaker ${this.name} moved to OPEN`, {
					nextAttempt: new Date(this.nextAttempt).toISOString()
				});
			}
		}
	}

	/**
	 * Get circuit breaker status
	 * @returns {Object} Status information
	 */
	getStatus() {
		return {
			name: this.name,
			state: this.state,
			failureCount: this.failureCount,
			successCount: this.successCount,
			lastFailureTime: this.lastFailureTime,
			nextAttempt: this.state === CircuitState.OPEN ? this.nextAttempt : null,
			statistics: { ...this.statistics }
		};
	}

	/**
	 * Reset circuit breaker
	 */
	reset() {
		this.state = CircuitState.CLOSED;
		this.failureCount = 0;
		this.successCount = 0;
		this.nextAttempt = 0;
		this.lastFailureTime = null;
		
		if (this.logger) {
			this.logger.info(`Circuit breaker ${this.name} reset`);
		}
	}
}

/**
 * Fallback strategy manager
 */
export class FallbackManager {
	constructor(options = {}) {
		this.strategies = new Map();
		this.logger = options.logger || null;
		this.defaultStrategy = options.defaultStrategy || 'cache';
		this.cache = new Map();
		this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes
	}

	/**
	 * Register fallback strategy
	 * @param {string} name - Strategy name
	 * @param {Function} strategy - Strategy function
	 */
	registerStrategy(name, strategy) {
		this.strategies.set(name, strategy);
	}

	/**
	 * Execute with fallback
	 * @param {Function} fn - Primary function
	 * @param {Object} options - Fallback options
	 * @returns {*} Function result or fallback
	 */
	async executeWithFallback(fn, options = {}) {
		const {
			strategy = this.defaultStrategy,
			cacheKey = null,
			fallbackValue = null,
			timeout = null
		} = options;

		try {
			// Execute with optional timeout
			let result;
			if (timeout) {
				const timeoutPromise = new Promise((_, reject) => {
					setTimeout(() => reject(new Error('Operation timeout')), timeout);
				});
				result = await Promise.race([fn(), timeoutPromise]);
			} else {
				result = await fn();
			}

			// Cache successful result
			if (cacheKey) {
				this.cache.set(cacheKey, {
					value: result,
					timestamp: Date.now()
				});
			}

			return result;
		} catch (error) {
			if (this.logger) {
				this.logger.warn('Primary function failed, using fallback', {
					error: error.message,
					strategy
				});
			}

			// Get fallback strategy
			const fallbackStrategy = this.strategies.get(strategy);
			
			if (fallbackStrategy) {
				return await fallbackStrategy({
					error,
					cacheKey,
					cache: this.cache,
					cacheTimeout: this.cacheTimeout,
					fallbackValue,
					logger: this.logger
				});
			}

			// Default fallback
			if (fallbackValue !== undefined) {
				return fallbackValue;
			}

			throw error;
		}
	}

	/**
	 * Clear cache
	 * @param {string} key - Cache key (optional)
	 */
	clearCache(key = null) {
		if (key) {
			this.cache.delete(key);
		} else {
			this.cache.clear();
		}
	}
}

/**
 * Predefined fallback strategies
 */
export const fallbackStrategies = {
	/**
	 * Cache fallback strategy
	 */
	cache: async ({ cacheKey, cache, cacheTimeout, fallbackValue, error }) => {
		if (cacheKey && cache.has(cacheKey)) {
			const cached = cache.get(cacheKey);
			const age = Date.now() - cached.timestamp;
			
			if (age < cacheTimeout) {
				return cached.value;
			}
		}
		
		if (fallbackValue !== undefined) {
			return fallbackValue;
		}
		
		throw error;
	},

	/**
	 * Default value fallback
	 */
	defaultValue: async ({ fallbackValue, error }) => {
		if (fallbackValue !== undefined) {
			return fallbackValue;
		}
		throw error;
	},

	/**
	 * Empty response fallback
	 */
	empty: async ({ error }) => {
		const type = error.message.toLowerCase();
		
		if (type.includes('array')) return [];
		if (type.includes('object')) return {};
		if (type.includes('string')) return '';
		if (type.includes('number')) return 0;
		
		return null;
	},

	/**
	 * Mock response fallback
	 */
	mock: async ({ error, fallbackValue }) => {
		return fallbackValue || {
			status: 'mocked',
			data: null,
			message: 'Using mock response due to error',
			originalError: error.message
		};
	},

	/**
	 * Retry with exponential backoff
	 */
	retry: async ({ error, retryFn, maxRetries = 3, initialDelay = 1000 }) => {
		let lastError = error;
		
		for (let i = 0; i < maxRetries; i++) {
			const delay = initialDelay * Math.pow(2, i);
			await new Promise(resolve => setTimeout(resolve, delay));
			
			try {
				return await retryFn();
			} catch (retryError) {
				lastError = retryError;
			}
		}
		
		throw lastError;
	}
};

/**
 * Graceful degradation manager
 */
export class GracefulDegradation {
	constructor(options = {}) {
		this.levels = options.levels || ['full', 'reduced', 'minimal', 'emergency'];
		this.currentLevel = 0;
		this.degradationThreshold = options.degradationThreshold || 10;
		this.recoveryThreshold = options.recoveryThreshold || 5;
		this.windowSize = options.windowSize || 60000; // 1 minute
		this.logger = options.logger || null;
		
		this.errors = [];
		this.successes = [];
	}

	/**
	 * Record error
	 */
	recordError() {
		const now = Date.now();
		this.errors.push(now);
		this.cleanupOldEntries();
		
		// Check if we need to degrade
		if (this.errors.length >= this.degradationThreshold) {
			this.degrade();
		}
	}

	/**
	 * Record success
	 */
	recordSuccess() {
		const now = Date.now();
		this.successes.push(now);
		this.cleanupOldEntries();
		
		// Check if we can recover
		if (this.successes.length >= this.recoveryThreshold && 
			this.errors.length < this.degradationThreshold / 2) {
			this.recover();
		}
	}

	/**
	 * Degrade service level
	 */
	degrade() {
		if (this.currentLevel < this.levels.length - 1) {
			this.currentLevel++;
			
			if (this.logger) {
				this.logger.warn('Service degraded', {
					from: this.levels[this.currentLevel - 1],
					to: this.levels[this.currentLevel],
					errorCount: this.errors.length
				});
			}
		}
	}

	/**
	 * Recover service level
	 */
	recover() {
		if (this.currentLevel > 0) {
			this.currentLevel--;
			
			if (this.logger) {
				this.logger.info('Service recovered', {
					from: this.levels[this.currentLevel + 1],
					to: this.levels[this.currentLevel],
					successCount: this.successes.length
				});
			}
		}
	}

	/**
	 * Clean up old entries
	 */
	cleanupOldEntries() {
		const cutoff = Date.now() - this.windowSize;
		this.errors = this.errors.filter(t => t > cutoff);
		this.successes = this.successes.filter(t => t > cutoff);
	}

	/**
	 * Get current service level
	 * @returns {string} Current level
	 */
	getCurrentLevel() {
		return this.levels[this.currentLevel];
	}

	/**
	 * Check if feature is available at current level
	 * @param {string} requiredLevel - Required service level
	 * @returns {boolean} Feature availability
	 */
	isFeatureAvailable(requiredLevel) {
		const requiredIndex = this.levels.indexOf(requiredLevel);
		return requiredIndex >= this.currentLevel;
	}

	/**
	 * Get status
	 * @returns {Object} Status information
	 */
	getStatus() {
		return {
			currentLevel: this.getCurrentLevel(),
			levelIndex: this.currentLevel,
			errorCount: this.errors.length,
			successCount: this.successes.length,
			levels: this.levels
		};
	}
}

/**
 * Create fallback context
 * @param {Object} options - Context options
 * @returns {Object} Fallback utilities
 */
export function createFallbackContext(options = {}) {
	const logger = options.logger || null;
	
	// Create managers
	const fallbackManager = new FallbackManager({ logger });
	const degradation = new GracefulDegradation({ logger });
	
	// Register default strategies
	Object.entries(fallbackStrategies).forEach(([name, strategy]) => {
		fallbackManager.registerStrategy(name, strategy);
	});

	return {
		circuitBreaker: (name, opts = {}) => new CircuitBreaker({ name, logger, ...opts }),
		fallback: fallbackManager,
		degradation,
		
		// Utility methods
		withFallback: (fn, fallback) => fallbackManager.executeWithFallback(fn, fallback),
		withCircuitBreaker: (name, fn, fallback) => {
			const breaker = new CircuitBreaker({ name, logger });
			return () => breaker.execute(fn, fallback);
		}
	};
}