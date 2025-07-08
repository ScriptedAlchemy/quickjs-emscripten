/**
 * QuickJS Utilities - Shared utilities for QuickJS context management
 */

import { setupArena } from './arenaUtils.js';
import { newQuickJSWASMModule, RELEASE_SYNC } from '@jitl/quickjs-wasmfile-release-sync';
import { Arena, defaultRegisteredObjects } from 'quickjs-emscripten-sync';

/**
 * Handle tracking system for proper lifecycle management
 */
export class HandleTracker {
	constructor() {
		this.handles = new Map();
		this.order = [];
	}

	/**
	 * Register a handle for tracking
	 * @param {string} name - Handle identifier
	 * @param {Object} handle - The handle to track
	 * @param {number} priority - Cleanup priority (higher = cleanup first)
	 */
	register(name, handle, priority = 0) {
		if (!handle || typeof handle.dispose !== 'function') {
			throw new Error(`Invalid handle registered: ${name}`);
		}
		
		this.handles.set(name, { handle, priority });
		this.order.push(name);
		
		if (process.env.NODE_ENV !== 'production') {
			console.log(`[HandleTracker] Registered: ${name}`);
		}
	}

	/**
	 * Dispose all handles in priority order
	 */
	disposeAll() {
		// Sort by priority (descending) then by registration order
		const sortedNames = [...this.order].sort((a, b) => {
			const priorityA = this.handles.get(a)?.priority || 0;
			const priorityB = this.handles.get(b)?.priority || 0;
			
			if (priorityB !== priorityA) {
				return priorityB - priorityA;
			}
			
			// If same priority, dispose in reverse registration order
			return this.order.indexOf(b) - this.order.indexOf(a);
		});

		for (const name of sortedNames) {
			const entry = this.handles.get(name);
			if (entry && entry.handle && typeof entry.handle.dispose === 'function') {
				try {
					entry.handle.dispose();
					if (process.env.NODE_ENV !== 'production') {
						console.log(`[HandleTracker] Disposed: ${name}`);
					}
				} catch (error) {
					console.error(`[HandleTracker] Error disposing ${name}:`, error);
				}
			}
		}

		this.handles.clear();
		this.order = [];
	}

	/**
	 * Get handle count for leak detection
	 */
	getCount() {
		return this.handles.size;
	}

	/**
	 * List all active handles
	 */
	listActive() {
		return [...this.handles.keys()];
	}
}

/**
 * Execute code in a QuickJS context with automatic cleanup using Arena
 * @param {Object} QuickJS - The QuickJS module instance
 * @param {string} code - The JavaScript code to execute
 * @param {Object} options - Execution options
 * @param {Object} options.extraGlobals - Extra global variables to set up
 * @param {boolean} options.enableFetch - Whether to enable fetch (default: false)
 * @param {boolean} options.enableKv - Whether to enable KV (default: false)
 * @returns {Object} - Execution result with { success, result?, error?, context, logs }
 */
export function executeCodeInContext(QuickJS, code, options = {}) {
	const { extraGlobals = {}, enableFetch = false, enableKv = false } = options;

	try {
		// Use Arena for consistent execution environment
		const { arena, logs, dispose } = setupArena(QuickJS, {
			enableFetch,
			enableKv,
			extraGlobals
		});

		const result = arena.evalCode(code);
		let output;

		if (result === null || result === undefined) {
			// Check for errors in the logs
			const errorInLogs = logs.find(log => log.includes('ERROR'));
			if (errorInLogs) {
				output = {
					success: false,
					error: errorInLogs,
					context: { code },
					logs
				};
			} else {
				output = {
					success: false,
					error: 'Code execution returned null or undefined',
					context: { code },
					logs
				};
			}
		} else {
			output = {
				success: true,
				result,
				context: { code },
				logs
			};
		}

		dispose();
		return output;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
			context: { code },
			logs: [`Error during execution: ${error instanceof Error ? error.message : String(error)}`]
		};
	}
}

/**
 * Set up a QuickJS context with common globals (Arena-compatible)
 * @param {Object} vm - The QuickJS context or Arena instance
 * @param {Object} globals - Object containing global variables to set
 */
export function setupContextGlobals(vm, globals = {}) {
	// Check if this is an Arena instance or raw QuickJS context
	if (vm.expose && typeof vm.expose === 'function') {
		// Arena instance - use expose method
		vm.expose(globals);
	} else {
		// Raw QuickJS context - use direct property setting
		Object.entries(globals).forEach(([key, value]) => {
			if (typeof value === 'string') {
				const handle = vm.newString(value);
				vm.setProp(vm.global, key, handle);
				handle.dispose();
			} else if (typeof value === 'number') {
				const handle = vm.newNumber(value);
				vm.setProp(vm.global, key, handle);
				handle.dispose();
			} else if (typeof value === 'object' && value !== null) {
				const handle = vm.newString(JSON.stringify(value));
				vm.setProp(vm.global, key, handle);
				handle.dispose();
			}
		});
	}
}

/**
 * Drive QuickJS until `donePromise` settles.
 * Automatically processes micro-tasks produced inside the VM.
 * @param {Object} runtime - QuickJS runtime
 * @param {Promise} donePromise - Promise to wait for
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Execution result with statistics
 */
export async function waitForQuickJS(runtime, donePromise, options = {}) {
	const { 
		maxIterations = 100,
		delayMs = 10,
		onIteration = null,
		abortSignal = null,
		timeoutMs = null
	} = options;

	let iterations = 0;
	let totalJobsProcessed = 0;

	// Create timeout promise if specified
	const timeoutPromise = timeoutMs 
		? new Promise((_, reject) => 
			setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
		)
		: null;

	// Create abort promise if signal provided
	const abortPromise = abortSignal
		? new Promise((_, reject) => {
			if (abortSignal.aborted) {
				reject(new Error('Aborted'));
			} else {
				abortSignal.addEventListener('abort', () => reject(new Error('Aborted')));
			}
		})
		: null;

	// Create iteration limit promise
	const iterationLimitPromise = new Promise((_, reject) => {
		// This will be checked in the loop
		const checkIterations = () => {
			if (iterations >= maxIterations) {
				reject(new Error(`Iteration limit reached (${maxIterations})`));
			}
		};
		// Store for later use
		iterationLimitPromise._check = checkIterations;
	});

	try {
		// Race between completion, timeout, abort, and iteration limit
		const promises = [donePromise];
		if (timeoutPromise) promises.push(timeoutPromise);
		if (abortPromise) promises.push(abortPromise);

		// Start job processing loop
		const processingLoop = async () => {
			while (true) {
				// Check if any of our exit conditions are met
				if (iterations >= maxIterations) {
					throw new Error(`Iteration limit reached (${maxIterations})`);
				}

				// Allow Node's event loop to proceed
				await new Promise(resolve => setImmediate(resolve));

				// Execute pending jobs
				const jobs = runtime.executePendingJobs();
				if (jobs.error) {
					runtime.dump(jobs.error);
					jobs.error.dispose();
					throw new Error('QuickJS runtime error during job execution');
				}

				totalJobsProcessed += jobs.value || 0;

				// Call iteration callback if provided
				if (onIteration) {
					onIteration(iterations, jobs.value);
				}

				iterations++;

				// Add delay if specified
				if (delayMs > 0) {
					await new Promise(resolve => setTimeout(resolve, delayMs));
				}

				// Check if the main promise is settled
				// Using Promise.race to see if we should continue
				const raceResult = await Promise.race([
					donePromise.then(() => ({ done: true })),
					Promise.resolve({ done: false })
				]);

				if (raceResult.done) {
					break;
				}
			}
		};

		// Run processing loop and wait for completion
		await Promise.race([
			processingLoop(),
			...promises
		]);

		// Get the result of the done promise
		const result = await donePromise;

		return { 
			iterations, 
			completed: true,
			result,
			totalJobsProcessed
		};

	} catch (error) {
		// Determine the type of failure
		const isTimeout = error.message.includes('Timeout');
		const isAborted = error.message.includes('Aborted');
		const isIterationLimit = error.message.includes('Iteration limit');
		const isRuntimeError = error.message.includes('QuickJS runtime error');

		return {
			iterations,
			completed: false,
			error: error.message,
			errorType: isTimeout ? 'timeout' : 
			          isAborted ? 'aborted' :
			          isIterationLimit ? 'iterationLimit' :
			          isRuntimeError ? 'runtime' : 'unknown',
			totalJobsProcessed
		};
	}
}

/**
 * Alternative implementation using async generator for more control
 * @param {Object} runtime - QuickJS runtime
 * @param {Object} options - Configuration options
 * @returns {AsyncGenerator} Job processing generator
 */
export async function* quickJSJobProcessor(runtime, options = {}) {
	const { delayMs = 10 } = options;
	let iteration = 0;

	while (true) {
		// Allow event loop to proceed
		await new Promise(resolve => setImmediate(resolve));

		// Execute pending jobs
		const jobs = runtime.executePendingJobs();
		if (jobs.error) {
			runtime.dump(jobs.error);
			jobs.error.dispose();
			throw new Error('QuickJS runtime error during job execution');
		}

		// Yield control back to caller with job info
		const shouldContinue = yield {
			iteration: iteration++,
			jobsProcessed: jobs.value || 0,
			hasJobs: jobs.value > 0
		};

		// Caller can stop the loop by returning false
		if (shouldContinue === false) {
			break;
		}

		// Add delay if specified
		if (delayMs > 0) {
			await new Promise(resolve => setTimeout(resolve, delayMs));
		}
	}
}

/**
 * Use the async generator for more flexible promise waiting
 * @param {Object} runtime - QuickJS runtime  
 * @param {Promise} donePromise - Promise to wait for
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Execution result
 */
export async function waitForQuickJSWithGenerator(runtime, donePromise, options = {}) {
	const { maxIterations = 100, onIteration = null } = options;
	
	const processor = quickJSJobProcessor(runtime, options);
	let totalJobs = 0;
	let iterations = 0;
	let promiseSettled = false;

	// Track when promise settles
	donePromise.finally(() => { promiseSettled = true; });

	try {
		for await (const status of processor) {
			totalJobs += status.jobsProcessed;
			iterations = status.iteration;

			if (onIteration) {
				onIteration(status.iteration, status.jobsProcessed);
			}

			// Check exit conditions
			if (promiseSettled || iterations >= maxIterations) {
				// Stop the generator
				await processor.return();
				break;
			}
		}

		// Wait for the promise to complete
		const result = await donePromise;

		return {
			iterations,
			completed: true,
			result,
			totalJobsProcessed: totalJobs
		};

	} catch (error) {
		return {
			iterations,
			completed: false,
			error: error.message,
			totalJobsProcessed: totalJobs
		};
	}
}

/**
 * Create a deferred promise utility
 * @returns {Object} Object with promise and resolve/reject functions
 */
export function createDeferredPromise() {
	let resolve, reject;
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

/**
 * Execute code within Arena with proper async handling and handle tracking
 * @param {Object} QuickJS - QuickJS module instance
 * @param {string} code - Code to execute
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Execution result
 */
export async function executeWithArena(QuickJS, code, options = {}) {
	const handleTracker = new HandleTracker();
	
	// Initialize a new context for this execution
	const vm = QuickJS.newContext();
	handleTracker.register('vm', vm, 100); // High priority for VM disposal
	
	// Create Arena with optimized settings
	const arena = new Arena(vm, {
		isMarshalable: options.isMarshalable || (() => true),
		registeredObjects: options.registeredObjects || defaultRegisteredObjects
	});
	// Arena disposal is handled by VM disposal

	// Track logs
	const logs = [];
	const consoleBridge = {
		log: (...args) => {
			const message = args.map(arg => String(arg)).join(' ');
			logs.push(`[VM] ${message}`);
			if (options.enableLogging !== false) {
				console.log(`[QuickJS] ${message}`);
			}
		}
	};

	// Expose objects to Arena
	const exposed = {
		console: consoleBridge,
		...(options.expose || {})
	};

	// Set up deferred promise pattern if async completion is needed
	if (options.async) {
		const deferred = createDeferredPromise();
		exposed.__testFinishedDeferred = {
			resolve: deferred.resolve,
			reject: deferred.reject
		};
		exposed.__testFinished = deferred.promise;
	}

	arena.expose(exposed);

	try {
		// Execute initial code
		const initialResult = arena.evalCode(code);
		
		// If async, wait for completion
		if (options.async && exposed.__testFinished) {
			const doneHandle = arena.evalCode('globalThis.__testFinished');
			if (doneHandle && typeof doneHandle.dispose === 'function') {
				handleTracker.register('doneHandle', doneHandle, 10);
			}
			
			// Convert to native promise if needed
			let donePromise;
			if (doneHandle && typeof doneHandle.dispose === 'function') {
				donePromise = vm.resolvePromise(doneHandle);
			} else {
				donePromise = Promise.resolve(doneHandle);
			}

			// Wait for async completion
			const { iterations } = await waitForQuickJS(vm.runtime, donePromise, {
				maxIterations: options.maxIterations || 100,
				delayMs: options.delayMs || 10,
				onIteration: options.onIteration
			});

			// Get final result
			const finalResult = await donePromise;

			return {
				result: finalResult,
				logs,
				iterations,
				status: 'async-completed',
				handleCount: handleTracker.getCount()
			};
		}

		// Synchronous execution
		return {
			result: initialResult,
			logs,
			status: 'sync-completed',
			handleCount: handleTracker.getCount()
		};

	} catch (error) {
		return {
			error: error.message,
			logs,
			status: 'error',
			handleCount: handleTracker.getCount()
		};
	} finally {
		// Ensure cleanup in correct order
		handleTracker.disposeAll();
		
		// Check for leaks in development
		if (process.env.NODE_ENV !== 'production' && handleTracker.getCount() > 0) {
			console.warn(`[HandleTracker] Potential leak detected: ${handleTracker.getCount()} handles remaining`);
			console.warn(`[HandleTracker] Active handles:`, handleTracker.listActive());
		}
	}
}

/**
 * Execute JavaScript code in a QuickJS context with given objects exposed
 * 
 * @param {Object} QuickJS - The QuickJS module instance
 * @param {string} code - The JavaScript code to execute
 * @param {Object} exposedObjects - Objects to expose to the QuickJS context
 * @param {boolean} enableLogging - Whether to enable console logging
 * @returns {Object} - Result object with `result`, `error`, and `logs`
 */
export async function executeInQuickJS(QuickJS, code, exposedObjects = {}, enableLogging = true) {
	const options = {
		expose: exposedObjects,
		enableLogging,
		async: false
	};

	const executionResult = await executeWithArena(QuickJS, code, options);
	
	return {
		result: executionResult.result,
		error: executionResult.error,
		logs: executionResult.logs
	};
}

/**
 * Retry mechanism with exponential backoff
 * @param {Function} operation - Async operation to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of the operation
 */
export async function retryWithBackoff(operation, options = {}) {
	const {
		maxAttempts = 3,
		initialDelayMs = 100,
		maxDelayMs = 5000,
		backoffFactor = 2,
		shouldRetry = (error) => true,
		onRetry = null
	} = options;

	let lastError;
	let delayMs = initialDelayMs;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			// Attempt the operation
			const result = await operation(attempt);
			return result;
		} catch (error) {
			lastError = error;

			// Check if we should retry
			if (attempt === maxAttempts || !shouldRetry(error)) {
				throw error;
			}

			// Calculate next delay with exponential backoff
			const currentDelay = Math.min(delayMs, maxDelayMs);
			
			// Call retry callback if provided
			if (onRetry) {
				onRetry(attempt, error, currentDelay);
			}

			// Wait before retrying
			await new Promise(resolve => setTimeout(resolve, currentDelay));

			// Increase delay for next attempt
			delayMs = Math.min(delayMs * backoffFactor, maxDelayMs);
		}
	}

	throw lastError;
}

/**
 * Retry QuickJS execution with backoff
 * @param {Function} executionFn - Function that returns QuickJS execution result
 * @param {Object} options - Retry options
 * @returns {Promise} Execution result
 */
export async function retryQuickJSExecution(executionFn, options = {}) {
	const {
		maxAttempts = 3,
		initialDelayMs = 200,
		onRetry = null,
		logger = null
	} = options;

	return retryWithBackoff(
		async (attempt) => {
			if (logger && attempt > 1) {
				logger.info(`Retrying QuickJS execution, attempt ${attempt}/${maxAttempts}`);
			}
			
			const result = await executionFn();
			
			// Check if execution was successful
			if (result.error) {
				throw new Error(result.error);
			}
			
			return result;
		},
		{
			maxAttempts,
			initialDelayMs,
			shouldRetry: (error) => {
				// Don't retry syntax errors
				if (error.message.includes('SyntaxError')) {
					return false;
				}
				// Don't retry validation errors
				if (error.message.includes('validation')) {
					return false;
				}
				// Retry timeouts and other errors
				return true;
			},
			onRetry: (attempt, error, delayMs) => {
				if (logger) {
					logger.warn(`QuickJS execution failed, retrying in ${delayMs}ms`, {
						attempt,
						error: error.message,
						delayMs
					});
				}
				if (onRetry) {
					onRetry(attempt, error, delayMs);
				}
			}
		}
	);
}
