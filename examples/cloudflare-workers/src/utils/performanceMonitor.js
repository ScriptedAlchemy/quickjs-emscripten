/**
 * Performance Monitoring Integration
 * Provides optional performance logging for all operations
 */

import { Logger } from './logger.js';
import { PerformanceTracker } from './performanceUtils.js';

/**
 * Performance monitor configuration
 */
class PerformanceMonitorConfig {
	constructor() {
		this.enabled = false;
		this.detailedLogging = false;
		this.thresholds = {
			slow: 1000,     // 1 second
			warning: 500,   // 500ms
			target: 200     // 200ms target
		};
		this.aggregateInterval = 60000; // 1 minute
		this.metrics = new Map();
		this.logger = null;
	}

	setLogger(logger) {
		this.logger = logger;
	}

	enable(options = {}) {
		this.enabled = true;
		if (options.detailed) this.detailedLogging = true;
		if (options.thresholds) Object.assign(this.thresholds, options.thresholds);
		if (options.logger) this.logger = options.logger;
	}

	disable() {
		this.enabled = false;
	}
}

// Global configuration
const config = new PerformanceMonitorConfig();

/**
 * Performance metric aggregator
 */
class MetricAggregator {
	constructor(name) {
		this.name = name;
		this.count = 0;
		this.totalTime = 0;
		this.minTime = Infinity;
		this.maxTime = -Infinity;
		this.samples = [];
		this.errors = 0;
		this.lastReset = Date.now();
	}

	record(duration, success = true) {
		this.count++;
		this.totalTime += duration;
		this.minTime = Math.min(this.minTime, duration);
		this.maxTime = Math.max(this.maxTime, duration);
		
		// Keep last 100 samples for percentile calculations
		this.samples.push(duration);
		if (this.samples.length > 100) {
			this.samples.shift();
		}

		if (!success) {
			this.errors++;
		}
	}

	getStats() {
		if (this.count === 0) {
			return {
				count: 0,
				average: 0,
				min: 0,
				max: 0,
				p50: 0,
				p90: 0,
				p95: 0,
				p99: 0,
				errorRate: 0,
				throughput: 0
			};
		}

		const sorted = [...this.samples].sort((a, b) => a - b);
		const elapsed = Date.now() - this.lastReset;

		return {
			count: this.count,
			average: this.totalTime / this.count,
			min: this.minTime,
			max: this.maxTime,
			p50: this.getPercentile(sorted, 0.5),
			p90: this.getPercentile(sorted, 0.9),
			p95: this.getPercentile(sorted, 0.95),
			p99: this.getPercentile(sorted, 0.99),
			errorRate: (this.errors / this.count) * 100,
			throughput: (this.count / elapsed) * 1000 // per second
		};
	}

	getPercentile(sorted, percentile) {
		if (sorted.length === 0) return 0;
		const index = Math.ceil(sorted.length * percentile) - 1;
		return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
	}

	reset() {
		this.count = 0;
		this.totalTime = 0;
		this.minTime = Infinity;
		this.maxTime = -Infinity;
		this.samples = [];
		this.errors = 0;
		this.lastReset = Date.now();
	}
}

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
	/**
	 * Configure the performance monitor
	 * @param {Object} options - Configuration options
	 */
	static configure(options = {}) {
		config.enable(options);
		
		// Start aggregate reporting if enabled
		if (config.enabled && options.aggregateReporting) {
			this.startAggregateReporting();
		}
	}

	/**
	 * Disable performance monitoring
	 */
	static disable() {
		config.disable();
		this.stopAggregateReporting();
	}

	/**
	 * Monitor a handler execution
	 * @param {string} handlerName - Name of the handler
	 * @param {Function} handler - Handler function
	 * @param {Object} context - Execution context
	 * @returns {*} Handler result
	 */
	static async monitorHandler(handlerName, handler, context = {}) {
		if (!config.enabled) {
			return await handler();
		}

		const tracker = new PerformanceTracker(handlerName);
		let metric = config.metrics.get(handlerName);
		
		if (!metric) {
			metric = new MetricAggregator(handlerName);
			config.metrics.set(handlerName, metric);
		}

		try {
			// Add context phases if provided
			if (context.phases) {
				for (const phase of context.phases) {
					tracker.addPhase(phase);
				}
			}

			const result = await handler();
			const report = tracker.finish();
			
			// Record metric
			metric.record(report.totalDuration, true);

			// Log if needed
			this.logPerformance(handlerName, report);

			return result;
		} catch (error) {
			const report = tracker.finish();
			metric.record(report.totalDuration, false);
			
			// Log error performance
			this.logPerformance(handlerName, report, error);
			
			throw error;
		}
	}

	/**
	 * Create a monitored wrapper for a function
	 * @param {string} name - Function name
	 * @param {Function} fn - Function to monitor
	 * @returns {Function} Monitored function
	 */
	static wrap(name, fn) {
		return async (...args) => {
			return await this.monitorHandler(name, () => fn(...args));
		};
	}

	/**
	 * Log performance data
	 * @param {string} name - Operation name
	 * @param {Object} report - Performance report
	 * @param {Error} error - Optional error
	 */
	static logPerformance(name, report, error = null) {
		if (!config.logger) return;

		const { totalDuration } = report;
		const { thresholds } = config;

		// Determine log level
		let level = 'info';
		let emoji = '⚡';
		
		if (error) {
			level = 'error';
			emoji = '❌';
		} else if (totalDuration > thresholds.slow) {
			level = 'warn';
			emoji = '🐌';
		} else if (totalDuration > thresholds.warning) {
			level = 'warn';
			emoji = '⚠️';
		} else if (totalDuration <= thresholds.target) {
			emoji = '🚀';
		}

		// Log based on configuration
		if (config.detailedLogging) {
			config.logger.performance(`${emoji} ${name}`, {
				duration: `${totalDuration}ms`,
				phases: report.phases.map(p => ({
					name: p.name,
					duration: `${p.duration}ms`,
					percentage: `${p.percentage}%`
				})),
				error: error?.message
			});
		} else {
			// Simple logging
			const message = error 
				? `${emoji} ${name} failed in ${totalDuration}ms`
				: `${emoji} ${name} completed in ${totalDuration}ms`;
			
			config.logger[level](message);
		}
	}

	/**
	 * Get performance metrics
	 * @param {string} name - Metric name (optional)
	 * @returns {Object} Metrics
	 */
	static getMetrics(name = null) {
		if (name) {
			const metric = config.metrics.get(name);
			return metric ? { [name]: metric.getStats() } : null;
		}

		const allMetrics = {};
		for (const [key, metric] of config.metrics) {
			allMetrics[key] = metric.getStats();
		}
		return allMetrics;
	}

	/**
	 * Reset metrics
	 * @param {string} name - Metric name (optional)
	 */
	static resetMetrics(name = null) {
		if (name) {
			const metric = config.metrics.get(name);
			if (metric) metric.reset();
		} else {
			for (const metric of config.metrics.values()) {
				metric.reset();
			}
		}
	}

	/**
	 * Start aggregate reporting
	 */
	static startAggregateReporting() {
		if (this.aggregateTimer) return;

		this.aggregateTimer = setInterval(() => {
			this.reportAggregateMetrics();
		}, config.aggregateInterval);
	}

	/**
	 * Stop aggregate reporting
	 */
	static stopAggregateReporting() {
		if (this.aggregateTimer) {
			clearInterval(this.aggregateTimer);
			this.aggregateTimer = null;
		}
	}

	/**
	 * Report aggregate metrics
	 */
	static reportAggregateMetrics() {
		if (!config.logger || config.metrics.size === 0) return;

		const metrics = this.getMetrics();
		const summary = {
			timestamp: new Date().toISOString(),
			handlers: {}
		};

		for (const [name, stats] of Object.entries(metrics)) {
			if (stats.count > 0) {
				summary.handlers[name] = {
					requests: stats.count,
					avgTime: `${stats.average.toFixed(2)}ms`,
					p95: `${stats.p95.toFixed(2)}ms`,
					errorRate: `${stats.errorRate.toFixed(2)}%`,
					throughput: `${stats.throughput.toFixed(2)}/s`
				};
			}
		}

		config.logger.performance('📊 Performance Summary', summary);
		
		// Reset metrics after reporting
		this.resetMetrics();
	}

	/**
	 * Create performance report
	 * @returns {Object} Performance report
	 */
	static createReport() {
		const metrics = this.getMetrics();
		const report = {
			timestamp: new Date().toISOString(),
			enabled: config.enabled,
			thresholds: config.thresholds,
			metrics: {}
		};

		for (const [name, stats] of Object.entries(metrics)) {
			report.metrics[name] = {
				...stats,
				status: this.getPerformanceStatus(stats.average)
			};
		}

		return report;
	}

	/**
	 * Get performance status based on average time
	 * @param {number} avgTime - Average time
	 * @returns {string} Status
	 */
	static getPerformanceStatus(avgTime) {
		const { thresholds } = config;
		
		if (avgTime <= thresholds.target) return 'excellent';
		if (avgTime <= thresholds.warning) return 'good';
		if (avgTime <= thresholds.slow) return 'warning';
		return 'slow';
	}
}

/**
 * Performance monitoring decorator
 * @param {string} name - Operation name
 * @returns {Function} Decorator
 */
export function monitored(name) {
	return function(target, propertyKey, descriptor) {
		const originalMethod = descriptor.value;
		
		descriptor.value = async function(...args) {
			return await PerformanceMonitor.monitorHandler(
				name || `${target.constructor.name}.${propertyKey}`,
				() => originalMethod.apply(this, args)
			);
		};
		
		return descriptor;
	};
}

/**
 * Create a performance monitoring context
 * @param {Object} options - Context options
 * @returns {Object} Monitoring context
 */
export function createMonitoringContext(options = {}) {
	const context = {
		monitor: PerformanceMonitor,
		logger: options.logger || new Logger({ component: 'performance' }),
		metrics: new Map()
	};

	// Configure monitor with context logger
	PerformanceMonitor.configure({
		logger: context.logger,
		...options
	});

	return context;
}