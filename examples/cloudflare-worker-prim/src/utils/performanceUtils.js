/**
 * Performance Utilities for Detailed Timing Tracking
 */

/**
 * Performance Tracker for granular timing
 */
export class PerformanceTracker {
	constructor(name) {
		this.name = name;
		this.marks = new Map();
		this.measures = new Map();
		this.startTime = Date.now();
		this.enabled = process.env.NODE_ENV !== 'production';
	}

	/**
	 * Mark a timing point
	 * @param {string} name - Mark name
	 * @param {Object} metadata - Additional metadata
	 */
	mark(name, metadata = {}) {
		if (!this.enabled) return;
		
		const mark = {
			name,
			timestamp: Date.now(),
			relativeTime: Date.now() - this.startTime,
			metadata
		};
		
		this.marks.set(name, mark);
		return mark;
	}

	/**
	 * Measure time between two marks
	 * @param {string} name - Measure name
	 * @param {string} startMark - Start mark name
	 * @param {string} endMark - End mark name (optional, defaults to current time)
	 * @returns {Object} Measure object
	 */
	measure(name, startMark, endMark = null) {
		if (!this.enabled) return null;
		
		const start = this.marks.get(startMark);
		if (!start) {
			throw new Error(`Start mark '${startMark}' not found`);
		}
		
		const endTime = endMark ? this.marks.get(endMark)?.timestamp : Date.now();
		if (endMark && !this.marks.has(endMark)) {
			throw new Error(`End mark '${endMark}' not found`);
		}
		
		const duration = endTime - start.timestamp;
		
		const measure = {
			name,
			startMark,
			endMark,
			duration,
			startTime: start.timestamp,
			endTime,
			metadata: {
				...start.metadata,
				...(endMark ? this.marks.get(endMark)?.metadata : {})
			}
		};
		
		this.measures.set(name, measure);
		return measure;
	}

	/**
	 * Get a summary of all timings
	 * @returns {Object} Timing summary
	 */
	getSummary() {
		const totalDuration = Date.now() - this.startTime;
		const marks = Array.from(this.marks.values());
		const measures = Array.from(this.measures.values());
		
		// Calculate percentages for measures
		const measuresWithPercentage = measures.map(m => ({
			...m,
			percentage: ((m.duration / totalDuration) * 100).toFixed(2) + '%'
		}));
		
		// Sort measures by duration
		measuresWithPercentage.sort((a, b) => b.duration - a.duration);
		
		return {
			name: this.name,
			totalDuration,
			markCount: marks.length,
			measureCount: measures.length,
			marks: marks.map(m => ({
				name: m.name,
				relativeTime: m.relativeTime,
				metadata: m.metadata
			})),
			measures: measuresWithPercentage,
			breakdown: this.getBreakdown()
		};
	}

	/**
	 * Get breakdown of time spent in different operations
	 * @returns {Object} Time breakdown
	 */
	getBreakdown() {
		const breakdown = {};
		const totalDuration = Date.now() - this.startTime;
		
		// Group measures by category (first part of name before ':')
		this.measures.forEach((measure, name) => {
			const category = name.split(':')[0] || 'other';
			if (!breakdown[category]) {
				breakdown[category] = {
					duration: 0,
					count: 0,
					operations: []
				};
			}
			
			breakdown[category].duration += measure.duration;
			breakdown[category].count++;
			breakdown[category].operations.push({
				name: measure.name,
				duration: measure.duration
			});
		});
		
		// Calculate percentages
		Object.keys(breakdown).forEach(category => {
			breakdown[category].percentage = 
				((breakdown[category].duration / totalDuration) * 100).toFixed(2) + '%';
		});
		
		return breakdown;
	}

	/**
	 * Create a scoped timer for measuring a specific operation
	 * @param {string} name - Operation name
	 * @returns {Function} End timer function
	 */
	startTimer(name) {
		const startMark = `${name}:start`;
		this.mark(startMark);
		
		return (metadata = {}) => {
			const endMark = `${name}:end`;
			this.mark(endMark, metadata);
			return this.measure(name, startMark, endMark);
		};
	}

	/**
	 * Measure an async operation
	 * @param {string} name - Operation name
	 * @param {Function} operation - Async operation to measure
	 * @param {Object} metadata - Additional metadata
	 * @returns {Promise} Operation result
	 */
	async measureAsync(name, operation, metadata = {}) {
		const endTimer = this.startTimer(name);
		
		try {
			const result = await operation();
			endTimer({ ...metadata, success: true });
			return result;
		} catch (error) {
			endTimer({ ...metadata, success: false, error: error.message });
			throw error;
		}
	}

	/**
	 * Create a performance report
	 * @returns {string} Formatted performance report
	 */
	getReport() {
		const summary = this.getSummary();
		
		let report = `Performance Report: ${summary.name}\n`;
		report += `${'='.repeat(50)}\n`;
		report += `Total Duration: ${summary.totalDuration}ms\n\n`;
		
		if (summary.measures.length > 0) {
			report += `Top Operations:\n`;
			summary.measures.slice(0, 10).forEach(m => {
				report += `  ${m.name}: ${m.duration}ms (${m.percentage})\n`;
			});
			report += '\n';
		}
		
		if (Object.keys(summary.breakdown).length > 0) {
			report += `Time Breakdown by Category:\n`;
			Object.entries(summary.breakdown).forEach(([category, data]) => {
				report += `  ${category}: ${data.duration}ms (${data.percentage}) - ${data.count} operations\n`;
			});
		}
		
		return report;
	}
}

/**
 * Global performance tracker instance
 */
let globalTracker = null;

/**
 * Get or create global performance tracker
 * @returns {PerformanceTracker} Global tracker instance
 */
export function getGlobalTracker() {
	if (!globalTracker) {
		globalTracker = new PerformanceTracker('global');
	}
	return globalTracker;
}

/**
 * Create a request-scoped performance tracker
 * @param {string} requestId - Request identifier
 * @returns {PerformanceTracker} Request tracker instance
 */
export function createRequestTracker(requestId) {
	return new PerformanceTracker(`request:${requestId}`);
}

/**
 * Performance middleware for tracking handler execution
 * @param {string} handlerName - Handler name
 * @param {Function} handler - Handler function
 * @returns {Function} Wrapped handler
 */
export function withPerformanceTracking(handlerName, handler) {
	return async (context) => {
		const tracker = createRequestTracker(`${handlerName}-${Date.now()}`);
		
		// Add tracker to context
		context.performanceTracker = tracker;
		
		try {
			// Mark handler start
			tracker.mark('handler:start', { handler: handlerName });
			
			// Execute handler
			const result = await handler(context);
			
			// Mark handler end
			tracker.mark('handler:end', { status: 'success' });
			tracker.measure('handler:total', 'handler:start', 'handler:end');
			
			// Add performance data to response headers if possible
			if (result instanceof Response && process.env.NODE_ENV !== 'production') {
				const summary = tracker.getSummary();
				result.headers.append('X-Performance-Total', summary.totalDuration);
				result.headers.append('X-Performance-Operations', summary.measureCount);
			}
			
			return result;
		} catch (error) {
			// Mark error
			tracker.mark('handler:error', { 
				error: error.message,
				handler: handlerName 
			});
			
			throw error;
		} finally {
			// Log performance report in development
			if (process.env.NODE_ENV !== 'production') {
				console.log(tracker.getReport());
			}
		}
	};
}