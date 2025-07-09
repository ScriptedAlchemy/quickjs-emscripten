/**
 * Test Phase Organization
 * Organize operations into clear phases with timing
 */

import { Logger } from './logger.js';
import { PerformanceTracker } from './performanceUtils.js';

/**
 * Standard operation phases
 */
export const STANDARD_PHASES = {
	// Handler phases
	handler: [
		'initialization',
		'validation',
		'preparation',
		'execution',
		'postProcessing',
		'response',
		'cleanup'
	],
	
	// LEPUS phases
	lepus: [
		'contextCreation',
		'codePreparation',
		'execution',
		'garbageCollection',
		'resultExtraction',
		'cleanup'
	],
	
	// Module federation phases
	moduleFederation: [
		'discovery',
		'manifestParsing',
		'assetResolution',
		'moduleLoading',
		'initialization',
		'execution'
	],
	
	// Network phases
	network: [
		'connectionSetup',
		'requestPreparation',
		'transmission',
		'responseProcessing',
		'dataValidation'
	]
};

/**
 * Phase organizer for structured operations
 */
export class PhaseOrganizer {
	constructor(options = {}) {
		this.name = options.name || 'Operation';
		this.phases = options.phases || STANDARD_PHASES.handler;
		this.logger = options.logger || null;
		this.tracker = new PerformanceTracker(this.name);
		this.currentPhase = null;
		this.phaseData = new Map();
		this.phaseCallbacks = new Map();
		this.strict = options.strict || false;
	}

	/**
	 * Start a phase
	 * @param {string} phaseName - Phase name
	 * @param {Object} data - Phase data
	 */
	startPhase(phaseName, data = {}) {
		// Validate phase
		if (this.strict && !this.phases.includes(phaseName)) {
			throw new Error(`Unknown phase: ${phaseName}. Valid phases: ${this.phases.join(', ')}`);
		}

		// End current phase if any
		if (this.currentPhase) {
			this.endPhase();
		}

		this.currentPhase = phaseName;
		this.tracker.startPhase(phaseName);
		this.phaseData.set(phaseName, {
			startTime: Date.now(),
			data,
			status: 'running'
		});

		// Execute phase start callback
		const callback = this.phaseCallbacks.get(`${phaseName}:start`);
		if (callback) {
			callback(data);
		}

		if (this.logger) {
			this.logger.phase(`▶️ ${this.name}: ${phaseName}`, data);
		}
	}

	/**
	 * End current phase
	 * @param {Object} result - Phase result
	 */
	endPhase(result = {}) {
		if (!this.currentPhase) {
			return;
		}

		this.tracker.endPhase(this.currentPhase);
		
		const phaseInfo = this.phaseData.get(this.currentPhase);
		phaseInfo.endTime = Date.now();
		phaseInfo.duration = phaseInfo.endTime - phaseInfo.startTime;
		phaseInfo.result = result;
		phaseInfo.status = 'completed';

		// Execute phase end callback
		const callback = this.phaseCallbacks.get(`${this.currentPhase}:end`);
		if (callback) {
			callback(result, phaseInfo);
		}

		if (this.logger) {
			this.logger.phase(`✅ ${this.name}: ${this.currentPhase} (${phaseInfo.duration}ms)`, result);
		}

		this.currentPhase = null;
	}

	/**
	 * Execute a phase with automatic timing
	 * @param {string} phaseName - Phase name
	 * @param {Function} fn - Phase function
	 * @param {Object} data - Phase data
	 * @returns {*} Phase result
	 */
	async executePhase(phaseName, fn, data = {}) {
		this.startPhase(phaseName, data);

		try {
			const result = await fn(data);
			this.endPhase({ success: true, result });
			return result;
		} catch (error) {
			this.endPhase({ success: false, error: error.message });
			
			// Mark phase as failed
			const phaseInfo = this.phaseData.get(phaseName);
			phaseInfo.status = 'failed';
			phaseInfo.error = error;

			if (this.logger) {
				this.logger.error(`❌ ${this.name}: ${phaseName} failed`, {
					error: error.message,
					stack: error.stack
				});
			}

			throw error;
		}
	}

	/**
	 * Execute all phases in sequence
	 * @param {Object} phaseFunctions - Map of phase names to functions
	 * @param {Object} initialData - Initial data
	 * @returns {Object} Results from all phases
	 */
	async executeAll(phaseFunctions, initialData = {}) {
		const results = {};
		let context = { ...initialData };

		for (const phaseName of this.phases) {
			const fn = phaseFunctions[phaseName];
			
			if (!fn) {
				if (this.strict) {
					throw new Error(`No function provided for phase: ${phaseName}`);
				}
				continue;
			}

			try {
				const result = await this.executePhase(phaseName, async () => {
					return await fn(context, results);
				}, context);

				results[phaseName] = result;
				
				// Update context with phase result
				if (result && typeof result === 'object') {
					context = { ...context, ...result };
				}
			} catch (error) {
				// Stop execution on error
				results[phaseName] = { error: error.message };
				break;
			}
		}

		return results;
	}

	/**
	 * Register phase callback
	 * @param {string} phaseName - Phase name
	 * @param {string} event - Event type ('start' or 'end')
	 * @param {Function} callback - Callback function
	 */
	onPhase(phaseName, event, callback) {
		const key = `${phaseName}:${event}`;
		this.phaseCallbacks.set(key, callback);
	}

	/**
	 * Get phase report
	 * @returns {Object} Phase report
	 */
	getReport() {
		const report = this.tracker.finish();
		const phaseDetails = {};

		for (const [phaseName, info] of this.phaseData) {
			phaseDetails[phaseName] = {
				duration: info.duration || 0,
				status: info.status,
				hasError: !!info.error,
				data: info.data,
				result: info.result
			};
		}

		return {
			...report,
			phaseDetails,
			completedPhases: Array.from(this.phaseData.keys()),
			successfulPhases: Array.from(this.phaseData.entries())
				.filter(([_, info]) => info.status === 'completed')
				.map(([name]) => name),
			failedPhases: Array.from(this.phaseData.entries())
				.filter(([_, info]) => info.status === 'failed')
				.map(([name]) => name)
		};
	}

	/**
	 * Reset organizer
	 */
	reset() {
		this.currentPhase = null;
		this.phaseData.clear();
		this.tracker = new PerformanceTracker(this.name);
	}

	/**
	 * Create phase wrapper
	 * @param {string} phaseName - Phase name
	 * @returns {Function} Phase wrapper
	 */
	createPhaseWrapper(phaseName) {
		return (fn) => {
			return async (...args) => {
				return await this.executePhase(phaseName, () => fn(...args));
			};
		};
	}
}

/**
 * Phase pipeline builder
 */
export class PhasePipeline {
	constructor(options = {}) {
		this.name = options.name || 'Pipeline';
		this.logger = options.logger || null;
		this.phases = [];
		this.middlewares = [];
	}

	/**
	 * Add phase to pipeline
	 * @param {string} name - Phase name
	 * @param {Function} handler - Phase handler
	 * @param {Object} options - Phase options
	 * @returns {PhasePipeline} Self for chaining
	 */
	addPhase(name, handler, options = {}) {
		this.phases.push({
			name,
			handler,
			options,
			skip: false
		});
		return this;
	}

	/**
	 * Add middleware
	 * @param {Function} middleware - Middleware function
	 * @returns {PhasePipeline} Self for chaining
	 */
	use(middleware) {
		this.middlewares.push(middleware);
		return this;
	}

	/**
	 * Skip phase conditionally
	 * @param {string} phaseName - Phase name
	 * @param {Function} condition - Skip condition
	 * @returns {PhasePipeline} Self for chaining
	 */
	skipIf(phaseName, condition) {
		const phase = this.phases.find(p => p.name === phaseName);
		if (phase) {
			phase.skipCondition = condition;
		}
		return this;
	}

	/**
	 * Execute pipeline
	 * @param {Object} initialContext - Initial context
	 * @returns {Object} Pipeline result
	 */
	async execute(initialContext = {}) {
		const organizer = new PhaseOrganizer({
			name: this.name,
			phases: this.phases.map(p => p.name),
			logger: this.logger
		});

		let context = { ...initialContext };
		const results = {};

		// Apply middlewares
		for (const middleware of this.middlewares) {
			context = await middleware(context) || context;
		}

		// Execute phases
		for (const phase of this.phases) {
			// Check skip condition
			if (phase.skipCondition && await phase.skipCondition(context, results)) {
				if (this.logger) {
					this.logger.info(`Skipping phase: ${phase.name}`);
				}
				continue;
			}

			try {
				const result = await organizer.executePhase(
					phase.name,
					() => phase.handler(context, results),
					phase.options
				);

				results[phase.name] = result;
				
				// Update context
				if (result && typeof result === 'object' && phase.options.mergeResult !== false) {
					context = { ...context, ...result };
				}
			} catch (error) {
				if (phase.options.optional) {
					results[phase.name] = { skipped: true, error: error.message };
					continue;
				}
				throw error;
			}
		}

		return {
			context,
			results,
			report: organizer.getReport()
		};
	}
}

/**
 * Create phase utilities
 * @param {Object} options - Options
 * @returns {Object} Phase utilities
 */
export function createPhaseContext(options = {}) {
	const logger = options.logger || null;

	return {
		organizer: (name, phases) => new PhaseOrganizer({ name, phases, logger }),
		pipeline: (name) => new PhasePipeline({ name, logger }),
		
		// Standard phase templates
		templates: {
			handler: () => new PhaseOrganizer({ 
				name: 'Handler',
				phases: STANDARD_PHASES.handler,
				logger 
			}),
			lepus: () => new PhaseOrganizer({
				name: 'LEPUS',
				phases: STANDARD_PHASES.lepus,
				logger
			}),
			moduleFederation: () => new PhaseOrganizer({
				name: 'ModuleFederation',
				phases: STANDARD_PHASES.moduleFederation,
				logger
			}),
			network: () => new PhaseOrganizer({
				name: 'Network',
				phases: STANDARD_PHASES.network,
				logger
			})
		},

		// Phase decorators
		decorators: {
			timed: (phaseName) => (target, propertyKey, descriptor) => {
				const originalMethod = descriptor.value;
				descriptor.value = async function(...args) {
					const organizer = new PhaseOrganizer({ name: propertyKey, logger });
					return await organizer.executePhase(phaseName, () => originalMethod.apply(this, args));
				};
				return descriptor;
			}
		}
	};
}