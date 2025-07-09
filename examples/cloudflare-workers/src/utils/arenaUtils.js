/**
 * Arena Utilities - Shared utilities for QuickJS Arena management
 */

import { Arena, defaultRegisteredObjects, complexity } from 'quickjs-emscripten-sync';

/**
 * Create optimized Arena configuration with native complexity awareness
 * @param {Object} vm - QuickJS VM context
 * @param {Object} options - Configuration options
 * @returns {Arena} - Configured Arena instance
 */
export function createOptimizedArena(vm, options = {}) {
	const {
		complexityThreshold = 50,
		enableComplexityCheck = false,
		registeredObjects = []
	} = options;

	// Use native complexity function for marshalling predicate
	const complexityAwarePredicate = (target) => {
		// Always allow primitive types
		if (target === null || target === undefined) return true;
		if (typeof target !== 'object') return true;

		// Check complexity for objects using native function
		const objectComplexity = complexity(target, 5); // Shallow check for performance

		if (objectComplexity > complexityThreshold) {
			console.warn(`⚠️ Rejecting high complexity object (${objectComplexity}) from marshalling`);
			return false;
		}

		return true;
	};

	const config = {
		isMarshalable: enableComplexityCheck ? complexityAwarePredicate : () => true,
		registeredObjects: [...defaultRegisteredObjects, ...registeredObjects],
		experimentalContextEx: true // Use experimental optimizations
	};

	console.log(`🔧 Creating Arena with ${enableComplexityCheck ? 'complexity-aware' : 'permissive'} marshalling`);
	console.log(`📊 Registered ${config.registeredObjects.length} objects for performance optimization`);

	return new Arena(vm, config);
}

/**
 * Measure object complexity using native function
 * @param {any} obj - Object to measure
 * @param {number} maxDepth - Maximum depth to traverse (default: 10)
 * @returns {number} - Complexity score
 */
export function measureComplexity(obj, maxDepth = 10) {
	return complexity(obj, maxDepth);
}

/**
 * Check if an object should be marshalled based on complexity
 * @param {any} obj - Object to check
 * @param {number} threshold - Complexity threshold (default: 50)
 * @returns {boolean} - Whether object is safe to marshal
 */
export function shouldMarshal(obj, threshold = 50) {
	const objComplexity = complexity(obj);

	if (objComplexity > threshold) {
		console.warn(`⚠️ High complexity object detected (${objComplexity}). Consider optimizing.`);
		return false;
	}

	return true;
}

/**
 * Simplified resource tracking that leverages Arena's built-in capabilities
 */
export class ResourceTracker {
	constructor() {
		this.startTime = Date.now();
		this.operationCount = 0;
		this.stats = {
			operations: 0,
			errors: 0,
			warnings: 0
		};
	}

	/**
	 * Track an operation (simplified - Arena handles actual resource management)
	 * @param {string} type - Operation type
	 * @param {string} id - Operation identifier
	 * @param {Object} resource - Resource being tracked
	 * @param {Object} _metadata - Additional metadata (unused but kept for API compatibility)
	 */
	track(type, id, resource, _metadata = {}) {
		this.operationCount++;
		this.stats.operations++;

		if (process.env.NODE_ENV !== 'production') {
			console.log(`[ResourceTracker] Operation ${type}: ${id}`);
		}
	}

	/**
	 * Mark an operation as completed
	 * @param {string} id - Operation identifier
	 */
	markDisposed(id) {
		// Arena handles actual disposal, this is just for tracking
		if (process.env.NODE_ENV !== 'production') {
			console.log(`[ResourceTracker] Completed: ${id}`);
		}
	}

	/**
	 * Track an error
	 * @param {string} id - Operation identifier
	 * @param {Error} error - Error that occurred
	 */
	trackError(id, error) {
		this.stats.errors++;
		console.error(`[ResourceTracker] Error in ${id}:`, error);
	}

	/**
	 * Track a warning
	 * @param {string} id - Operation identifier
	 * @param {string} message - Warning message
	 */
	trackWarning(id, message) {
		this.stats.warnings++;
		console.warn(`[ResourceTracker] Warning in ${id}: ${message}`);
	}

	/**
	 * Clean up all tracked resources (Arena handles actual cleanup)
	 */
	cleanupAll() {
		// Arena disposal handles actual cleanup
		if (process.env.NODE_ENV !== 'production') {
			console.log(`[ResourceTracker] Session completed: ${this.operationCount} operations`);
		}
	}

	/**
	 * Get simplified resource statistics
	 */
	getStats() {
		return {
			...this.stats,
			durationMs: Date.now() - this.startTime,
			operationCount: this.operationCount
		};
	}

	/**
	 * Detect potential issues (simplified)
	 */
	detectLeaks() {
		// Since Arena handles disposal, we only track operational issues
		const issues = [];

		if (this.stats.errors > 0) {
			issues.push({
				type: 'errors',
				count: this.stats.errors,
				description: 'Operations completed with errors'
			});
		}

		if (this.stats.warnings > 5) {
			issues.push({
				type: 'warnings',
				count: this.stats.warnings,
				description: 'High number of warnings detected'
			});
		}

		return issues;
	}
}

/**
 * Create a console bridge for logging from within Arena
 * @param {Array} logs - Array to collect log messages
 * @param {string} prefix - Prefix for log messages (default: '[VM]')
 * @returns {Object} - Console bridge object
 */
export function createConsoleBridge(logs = [], prefix = '[VM]') {
	return {
		log: (...args) => {
			const message = args.map(String).join(' ');
			logs.push(`${prefix} ${message}`);
		},
		error: (...args) => {
			const message = args.map(String).join(' ');
			logs.push(`${prefix} ERROR: ${message}`);
		},
		warn: (...args) => {
			const message = args.map(String).join(' ');
			logs.push(`${prefix} WARN: ${message}`);
		}
	};
}

/**
 * Create a KV namespace proxy for Arena
 * @param {Object} env - Cloudflare environment object
 * @param {Array} logs - Array to collect log messages
 * @param {string} kvNamespace - KV namespace name (default: 'MODULE_FEDERATION_ASSETS')
 * @returns {Object} - KV namespace proxy
 */
export function createKvNamespaceProxy(env, logs = [], kvNamespace = 'MODULE_FEDERATION_ASSETS') {
	return {
		get: (key) => {
			logs.push(`[KV] Reading ${key}...`);
			return env[kvNamespace].get(key)
				.then(content => {
					if (content) {
						logs.push(`[KV] Successfully read ${key}: ${content.length} chars`);
						return content;
					}
					return undefined;
				})
				.catch(error => {
					logs.push(`[KV] Failed to read ${key}: ${error.message}`);
					return undefined;
				});
		}
	};
}

/**
 * Create an improved fetch function for Arena that properly handles Response objects
 * @param {Array} logs - Log collection array for debugging
 * @returns {Function} - Improved fetch function
 */
export function createArenaFetch(logs = []) {
	return async (input, init) => {
		const url = typeof input === 'string' ? input : input.url;
		const method = init?.method || 'GET';
		logs.push(`[Fetch] ${method.toUpperCase()} ${url}`);

		try {
			// Use native fetch but create a QuickJS-compatible response
			const response = await fetch(input, init);

			// Pre-read the body to avoid stream issues in QuickJS
			const bodyText = await response.text();

			// Pre-convert headers to entries array for QuickJS compatibility
			const headerEntries = Array.from(response.headers.entries());

			// Create a QuickJS-compatible Response-like object
			return {
				status: response.status,
				statusText: response.statusText,
				headers: headerEntries,
				url: response.url,
				ok: response.ok,
				redirected: response.redirected,
				type: response.type,
				bodyUsed: true,

				// Body reading methods
				text: async () => bodyText,
				json: async () => JSON.parse(bodyText),
				blob: async () => { throw new Error('Blob not supported in Arena context'); },
				arrayBuffer: async () => { throw new Error('ArrayBuffer not supported in Arena context'); },
				formData: async () => { throw new Error('FormData not supported in Arena context'); }
			};
		} catch (error) {
			logs.push(`[Fetch] ERROR: ${error.message}`);
			throw new Error(`Fetch failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	};
}

/**
 * @deprecated - Use createArenaFetch instead
 * Create a fetch proxy for Arena that maintains Cloudflare Workers context
 * @returns {Object} - Fetch proxy object
 */
export function createFetchProxy() {
	return {
		async request(url, options = {}) {
			try {
				const response = await fetch(url, options);
				return {
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					body: await response.text(),
					url: response.url,
					ok: response.ok
				};
			} catch (error) {
				throw new Error(`Fetch failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
	};
}

/**
 * Set up Arena with enhanced features for Module Federation
 * @param {Object} QuickJS - QuickJS module instance
 * @param {Object} options - Setup options
 * @param {Object} options.env - Cloudflare environment
 * @param {Array} options.logs - Log collection array
 * @param {boolean} options.enableFetch - Whether to enable fetch (default: true)
 * @param {boolean} options.enableKv - Whether to enable KV proxy (default: true)
 * @param {boolean} options.useLegacyFetchProxy - Use old proxy pattern (default: false)
 * @param {boolean} options.enableLogging - Enable console logging (default: true)
 * @param {boolean} options.trackResources - Enable resource tracking (default: true)
 * @param {Object} options.extraGlobals - Additional globals to expose
 * @param {number} options.memoryLimitBytes - Memory limit in bytes (default: 2MB)
 * @param {number} options.stackLimitBytes - Stack size limit in bytes (default: 256KB)
 * @param {number} options.maxInterruptCycles - Max interrupt cycles before termination (default: 10000)
 * @returns {Object} - Arena instance, runtime, and cleanup function
 */
export function setupArena(QuickJS, options = {}) {
	const {
		env,
		logs = [],
		enableFetch = true,
		enableKv = true,
		useLegacyFetchProxy = false,
		enableLogging = true,
		trackResources = true,
		extraGlobals = {},
		// Security constraints
		memoryLimitBytes = 1024 * 1024 * 2, // 2MB default
		stackLimitBytes = 1024 * 256, // 256KB default  
		maxInterruptCycles = 10000 // ~5-10 seconds execution time
	} = options;

	// Initialize resource tracker
	const resourceTracker = trackResources ? new ResourceTracker() : null;

	// Initialize a new runtime with security constraints
	const runtime = QuickJS.newRuntime();
	
	// Set configurable security limits to prevent abuse
	runtime.setMemoryLimit(memoryLimitBytes);
	runtime.setMaxStackSize(stackLimitBytes);
	
	// Set interrupt handler to prevent infinite loops
	let interruptCycles = 0;
	runtime.setInterruptHandler(() => {
		interruptCycles++;
		if (interruptCycles > maxInterruptCycles) {
			logs.push(`[VM] ERROR: Execution terminated - exceeded maximum cycles (${maxInterruptCycles})`);
			return true; // Interrupt execution
		}
		return false; // Continue execution
	});

	// Initialize a new context from the configured runtime
	const vm = runtime.newContext();

	// Create optimized Arena using native features
	const arena = createOptimizedArena(vm, {
		complexityThreshold: 100, // Higher threshold for production use
		enableComplexityCheck: false, // Keep permissive for compatibility
		registeredObjects: [] // Additional objects beyond defaults
	});

	// Track logs - use regular array, not synced
	const consoleBridge = {
		log: (...args) => {
			const message = args.map(arg => String(arg)).join(' ');
			logs.push(`[VM] ${message}`);
			if (enableLogging) {
				console.log(`[QuickJS] ${message}`);
			}
		},
		error: (...args) => {
			const message = args.map(arg => String(arg)).join(' ');
			logs.push(`[VM] ERROR: ${message}`);
			if (enableLogging) {
				console.error(`[QuickJS] ERROR:`, ...args);
			}
		},
		warn: (...args) => {
			const message = args.map(arg => String(arg)).join(' ');
			logs.push(`[VM] WARN: ${message}`);
			if (enableLogging) {
				console.warn(`[QuickJS] WARN:`, ...args);
			}
		}
	};

	// Base exposed objects
	const globals = {
		console: consoleBridge,
		require: () => ({}),
		module: { exports: {} },
		exports: {},
		...extraGlobals
	};

	// Add KV support if enabled
	if (enableKv && env) {
		globals.__CF_KV_NAMESPACE__ = createKvNamespaceProxy(env, logs);
	}

	// Add fetch - improved arena-compatible approach or legacy proxy
	if (enableFetch) {
		if (useLegacyFetchProxy) {
			// Legacy approach for backward compatibility
			globals.__fetchProxy = createFetchProxy();

			// Expose all globals first
			arena.expose(globals);

			// Set up legacy fetch in QuickJS
			arena.evalCode(`
				globalThis.fetch = async (input, init) => {
					const url = typeof input === 'string' ? input : input.url;
					const options = init || {};
					const responseData = await __fetchProxy.request(url, options);

					// Create a Response-like object compatible with Fetch API
					return {
						status: responseData.status,
						statusText: responseData.statusText,
						headers: new Map(Object.entries(responseData.headers)),
						url: responseData.url,
						ok: responseData.ok,
						text: async () => responseData.body,
						json: async () => JSON.parse(responseData.body)
					};
				};
			`);
		} else {
			// Improved approach - arena-compatible fetch with proper Response handling
			globals.fetch = createArenaFetch(logs);
			arena.expose(globals);
		}
	} else {
		// No fetch - just expose the base globals
		arena.expose(globals);
	}

	// Create simplified disposal function (Arena handles most cleanup)
	const dispose = () => {
		try {
			// Log completion statistics if tracking
			if (resourceTracker) {
				const stats = resourceTracker.getStats();
				const issues = resourceTracker.detectLeaks();

				if (process.env.NODE_ENV !== 'production') {
					console.log(`[Arena] Session stats: ${stats.operations} operations, ${stats.durationMs}ms`);
					if (issues.length > 0) {
						console.warn(`[Arena] Issues detected:`, issues);
					}
				}

				resourceTracker.cleanupAll();
			}

			// Arena.dispose() handles all VM and handle cleanup automatically
			arena.dispose();
			
			// Dispose the runtime to free memory and reset limits
			runtime.dispose();
		} catch (error) {
			console.error('[Arena] Error during disposal:', error);
		}
	};

	return {
		arena,
		vm,
		runtime,
		logs,
		dispose,
		resourceTracker,
		getResourceStats: () => resourceTracker?.getStats() || null
	};
}

/**
 * Execute async operations in Arena with job processing
 * @param {Object} arena - Arena instance
 * @param {string} code - Code to execute
 * @param {Object} options - Execution options
 * @param {number} options.maxIterations - Maximum job processing iterations (default: 50)
 * @param {number} options.delayMs - Delay between iterations in ms (default: 10)
 * @param {number} options.initialDelayMs - Initial delay before processing (default: 200)
 * @param {Array} options.logs - Log collection array
 * @returns {Promise<Object>} - Execution results
 */
export async function executeArenaCode(arena, code, options = {}) {
	const {
		maxIterations = 50,
		delayMs = 10,
		initialDelayMs = 200,
		logs = []
	} = options;

	// Execute the code
	arena.evalCode(code);

	// Initial delay for async operations to start
	await new Promise(resolve => setTimeout(resolve, initialDelayMs));

	let totalJobs = 0;
	let stableCount = 0;

	for (let i = 0; i < maxIterations; i++) {
		const jobs = arena.executePendingJobs();
		if (jobs > 0) {
			totalJobs += jobs;
			stableCount = 0;
			logs.push(`Processed ${jobs} jobs in iteration ${i + 1}`);
		} else {
			stableCount++;
		}

		// Check if execution is complete (if __executionComplete global exists)
		try {
			const isExecutionComplete = arena.evalCode('globalThis.__executionComplete');
			if (isExecutionComplete) {
				logs.push(`✅ Execution completed at iteration ${i + 1}`);
				// Process remaining jobs
				for (let j = 0; j < 10; j++) {
					const finalJobs = arena.executePendingJobs();
					if (finalJobs > 0) {
						totalJobs += finalJobs;
						logs.push(`Final cleanup: ${finalJobs} jobs`);
					}
					await new Promise(resolve => setTimeout(resolve, 50));
				}
				break;
			}
		} catch (e) {
			// Ignore eval errors during job processing
		}

		// Stop if no jobs for several iterations
		if (stableCount >= 3 && totalJobs > 0) {
			logs.push(`No more jobs, stopping at iteration ${i + 1} (${stableCount} stable iterations)`);
			break;
		}

		await new Promise(resolve => setTimeout(resolve, delayMs));
	}

	return {
		totalJobsProcessed: totalJobs,
		logs
	};
}

/**
 * Create a fetch proxy that tracks resources
 * @param {Array} logs - Log array
 * @param {ResourceTracker} resourceTracker - Resource tracker
 * @returns {Function} Fetch proxy function
 */
function createTrackedFetchProxy(logs, resourceTracker) {
	return async (input, init) => {
		const requestId = `fetch-${Date.now()}`;

		if (resourceTracker) {
			resourceTracker.track('fetch', requestId, { input, init }, { url: input });
		}

		try {
			const response = await fetch(input, init);

			if (resourceTracker) {
				resourceTracker.markDisposed(requestId);
			}

			logs.push(`[Fetch] ${input} - Status: ${response.status}`);
			return response;
		} catch (error) {
			if (resourceTracker) {
				resourceTracker.markDisposed(requestId);
			}

			logs.push(`[Fetch] ${input} - Error: ${error.message}`);
			throw error;
		}
	};
}

/**
 * Set up Arena with fetch support for Module Federation
 * @param {Object} arena - Arena instance
 * @param {Object} consoleBridge - Console bridge object
 * @param {Object} moduleObj - Module object
 * @param {Object} kvNamespace - KV namespace
 * @param {Object} options - Additional options
 */
export function setupArenaWithFetch(arena, consoleBridge, moduleObj, kvNamespace, options = {}) {
	const {
		requireStub = () => ({}),
		syncedModule = null,
		syncedExports = null,
		trackResources = true
	} = options;

	// Initialize resource tracker if needed
	const resourceTracker = trackResources ? new ResourceTracker() : null;

	// Create fetch proxy
	const fetchProxy = createTrackedFetchProxy([], resourceTracker);

	// IMPORTANT: Use arena.sync() for bidirectional data synchronization
	// This ensures changes in QuickJS are reflected in the host
	const syncedModuleObj = syncedModule || arena.sync(moduleObj);
	const syncedExportsObj = syncedExports || arena.sync(moduleObj.exports);

	// Create synchronized console if not already synchronized
	const syncedConsole = typeof consoleBridge === 'object' && !Array.isArray(consoleBridge)
		? arena.sync(consoleBridge)
		: consoleBridge;

	// Expose objects to Arena with proper synchronization
	// Note: Do NOT expose native Request, Response, Headers as they cause "Illegal invocation" errors
	arena.expose({
		console: syncedConsole,
		require: requireStub,
		module: syncedModuleObj,
		exports: syncedExportsObj,
		__CF_KV_NAMESPACE__: kvNamespace,
		fetch: fetchProxy
	});

	// Return resource tracker and synced objects for external monitoring
	return {
		resourceTracker,
		syncedModule: syncedModuleObj,
		syncedExports: syncedExportsObj
	};
}

/**
 * Wait for Arena result with timeout and job processing
 * @param {Object} QuickJS - QuickJS module instance
 * @param {string} remoteEntry - Remote entry code
 * @param {Function} setupFunc - Arena setup function
 * @param {Object} kvNamespace - KV namespace
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Execution result
 */
export async function waitForArenaResult(QuickJS, remoteEntry, setupFunc, kvNamespace, options = {}) {
	const {
		module,
		func,
		params = {},
		maxIterations = 50,
		delayMs = 10,
		initialDelayMs = 200,
		stableCountThreshold = 3
	} = options;

	// Set up Arena with resource tracking and fetch support
	const { arena, logs, dispose, resourceTracker } = setupArena(QuickJS, {
		env: { MODULE_FEDERATION_ASSETS: kvNamespace },
		enableFetch: true,
		enableKv: true,
		trackResources: true
	});

	// Module object for federation - set up after arena creation
	const moduleObj = { exports: {} };

	// Expose module object to arena for federation (arena already has fetch setup)
	arena.expose({
		module: arena.sync(moduleObj),
		exports: arena.sync(moduleObj.exports)
	});

	try {
		// Execute remote entry
		logs.push(`[Arena] Starting remote entry execution for ${module}.${func}`);
		arena.evalCode(remoteEntry);
		logs.push(`[Arena] Remote entry loaded successfully`);

		// Execute module function
		logs.push(`[Arena] Executing module function: ${module}.${func}`);
		arena.evalCode(`
			(async function() {
				try {
					const factory = await module.exports.get('./${module}');
					const moduleExports = factory();
					const result = await moduleExports.${func}(${JSON.stringify(params)});
					globalThis.__moduleResult = result;
					globalThis.__moduleComplete = true;
				} catch (error) {
					globalThis.__moduleError = error.message || String(error);
					globalThis.__moduleComplete = true;
				}
			})();
		`);

		// Wait for initial delay
		await new Promise(resolve => setTimeout(resolve, initialDelayMs));

		// Process jobs and wait for completion
		let iterations = 0;
		let stableCount = 0;
		let lastResult = null;

		while (iterations < maxIterations) {
			arena.executePendingJobs();

			const complete = arena.evalCode('globalThis.__moduleComplete');
			if (complete) {
				const error = arena.evalCode('globalThis.__moduleError');
				if (error) {
					throw new Error(error);
				}

				const result = arena.evalCode('globalThis.__moduleResult');

				// Check for stable result
				if (JSON.stringify(result) === JSON.stringify(lastResult)) {
					stableCount++;
					if (stableCount >= stableCountThreshold) {
						return {
							success: true,
							execution: {
								result,
								module,
								function: func
							},
							logs,
							iterations,
							resourceStats: resourceTracker?.getStats()
						};
					}
				} else {
					stableCount = 0;
					lastResult = result;
				}
			}

			iterations++;
			await new Promise(resolve => setTimeout(resolve, delayMs));
		}

		throw new Error(`Execution timeout after ${iterations} iterations`);

	} catch (error) {
		return {
			success: false,
			error: error.message,
			execution: {
				module,
				function: func,
				result: null
			},
			logs,
			resourceStats: resourceTracker?.getStats()
		};
	} finally {
		// Arena disposal handles cleanup automatically
		dispose();
	}
}
