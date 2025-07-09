/**
 * Structured Logger with Visual Indicators
 */

export const LogLevel = {
	DEBUG: 0,
	INFO: 1,
	SUCCESS: 2,
	WARNING: 3,
	ERROR: 4
};

export const LogIcons = {
	DEBUG: '🔍',
	INFO: '📋',
	SUCCESS: '✅',
	WARNING: '⚠️',
	ERROR: '❌',
	TIMER: '⏱️',
	NETWORK: '🌐',
	DATABASE: '💾',
	PROCESS: '⚙️',
	ROCKET: '🚀',
	COMPLETE: '🎉',
	CLEANUP: '🧹',
	LOCK: '🔒',
	UNLOCK: '🔓',
	PACKAGE: '📦'
};

/**
 * Structured Logger class
 */
export class Logger {
	constructor(options = {}) {
		this.name = options.name || 'APP';
		this.level = options.level || LogLevel.INFO;
		this.useColors = options.useColors !== false;
		this.useIcons = options.useIcons !== false;
		this.timestamp = options.timestamp !== false;
		this.handlers = options.handlers || [this.defaultHandler.bind(this)];
	}

	/**
	 * Default log handler that outputs to console
	 */
	defaultHandler(logEntry) {
		const { level, message, icon, metadata, timestamp } = logEntry;
		
		let output = '';
		
		// Add timestamp if enabled
		if (this.timestamp && timestamp) {
			output += `[${timestamp.toISOString()}] `;
		}
		
		// Add name
		output += `[${this.name}] `;
		
		// Add icon if enabled
		if (this.useIcons && icon) {
			output += `${icon} `;
		}
		
		// Add message
		output += message;
		
		// Add metadata if present
		if (metadata && Object.keys(metadata).length > 0) {
			output += ' ' + JSON.stringify(metadata);
		}
		
		// Output based on level
		switch (level) {
			case LogLevel.ERROR:
				console.error(output);
				break;
			case LogLevel.WARNING:
				console.warn(output);
				break;
			default:
				console.log(output);
		}
	}

	/**
	 * Create a log entry
	 */
	createLogEntry(level, icon, message, metadata) {
		return {
			level,
			icon,
			message,
			metadata,
			timestamp: new Date(),
			logger: this.name
		};
	}

	/**
	 * Log a message
	 */
	log(level, icon, message, metadata = {}) {
		if (level < this.level) return;
		
		const logEntry = this.createLogEntry(level, icon, message, metadata);
		
		// Send to all handlers
		this.handlers.forEach(handler => {
			try {
				handler(logEntry);
			} catch (error) {
				console.error('Logger handler error:', error);
			}
		});
	}

	// Convenience methods
	debug(message, metadata) {
		this.log(LogLevel.DEBUG, LogIcons.DEBUG, message, metadata);
	}

	info(message, metadata) {
		this.log(LogLevel.INFO, LogIcons.INFO, message, metadata);
	}

	success(message, metadata) {
		this.log(LogLevel.SUCCESS, LogIcons.SUCCESS, message, metadata);
	}

	warn(message, metadata) {
		this.log(LogLevel.WARNING, LogIcons.WARNING, message, metadata);
	}

	error(message, metadata) {
		this.log(LogLevel.ERROR, LogIcons.ERROR, message, metadata);
	}

	// Specialized logging methods
	network(message, metadata) {
		this.log(LogLevel.INFO, LogIcons.NETWORK, message, metadata);
	}

	database(message, metadata) {
		this.log(LogLevel.INFO, LogIcons.DATABASE, message, metadata);
	}

	process(message, metadata) {
		this.log(LogLevel.INFO, LogIcons.PROCESS, message, metadata);
	}

	timer(message, metadata) {
		this.log(LogLevel.INFO, LogIcons.TIMER, message, metadata);
	}

	/**
	 * Create a phase logger for tracking operation phases
	 */
	createPhaseLogger() {
		return new PhaseLogger(this);
	}

	/**
	 * Create a child logger with a new name
	 */
	child(name) {
		return new Logger({
			...this,
			name: `${this.name}:${name}`,
			handlers: this.handlers
		});
	}
}

/**
 * Phase Logger for tracking operation phases with timing
 */
export class PhaseLogger {
	constructor(logger) {
		this.logger = logger;
		this.phases = [];
		this.currentPhase = null;
		this.startTime = Date.now();
	}

	/**
	 * Start a new phase
	 */
	startPhase(name, metadata = {}) {
		// End current phase if exists
		if (this.currentPhase) {
			this.endPhase();
		}
		
		this.currentPhase = {
			name,
			startTime: Date.now(),
			metadata
		};
		
		this.logger.log(
			LogLevel.INFO,
			LogIcons.TIMER,
			`Phase ${this.phases.length + 1}: ${name} starting...`,
			metadata
		);
	}

	/**
	 * End the current phase
	 */
	endPhase(metadata = {}) {
		if (!this.currentPhase) return;
		
		const duration = Date.now() - this.currentPhase.startTime;
		
		this.phases.push({
			...this.currentPhase,
			endTime: Date.now(),
			duration,
			metadata: { ...this.currentPhase.metadata, ...metadata }
		});
		
		this.logger.log(
			LogLevel.SUCCESS,
			LogIcons.SUCCESS,
			`Phase ${this.phases.length} Complete: ${this.currentPhase.name} took ${duration.toFixed(2)}ms`,
			{ duration, ...metadata }
		);
		
		this.currentPhase = null;
	}

	/**
	 * Get summary of all phases
	 */
	getSummary() {
		const totalDuration = Date.now() - this.startTime;
		
		return {
			totalDuration,
			phaseCount: this.phases.length,
			phases: this.phases.map(p => ({
				name: p.name,
				duration: p.duration,
				percentage: ((p.duration / totalDuration) * 100).toFixed(1) + '%'
			}))
		};
	}

	/**
	 * Log summary of all phases
	 */
	logSummary() {
		const summary = this.getSummary();
		
		this.logger.log(
			LogLevel.INFO,
			LogIcons.COMPLETE,
			`All phases completed in ${summary.totalDuration}ms`,
			summary
		);
	}
}

// Default logger instance
export const defaultLogger = new Logger({
	name: 'CloudflareWorker',
	level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
});

// Export convenience functions using default logger
export const debug = (message, metadata) => defaultLogger.debug(message, metadata);
export const info = (message, metadata) => defaultLogger.info(message, metadata);
export const success = (message, metadata) => defaultLogger.success(message, metadata);
export const warn = (message, metadata) => defaultLogger.warn(message, metadata);
export const error = (message, metadata) => defaultLogger.error(message, metadata);