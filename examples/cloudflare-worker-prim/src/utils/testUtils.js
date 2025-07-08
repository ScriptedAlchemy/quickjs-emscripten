/**
 * Test Utilities for Mock Environment Configuration
 */

/**
 * Create a mock KV namespace with predefined data
 * @param {Object} data - Initial KV data
 * @param {Object} options - Configuration options
 * @returns {Object} Mock KV namespace
 */
export function createMockKVNamespace(data = {}, options = {}) {
	const {
		latencyMs = 0,
		errorRate = 0,
		logger = null
	} = options;

	const storage = new Map(Object.entries(data));
	const metadata = new Map();

	return {
		async get(key, options = {}) {
			// Simulate latency
			if (latencyMs > 0) {
				await new Promise(resolve => setTimeout(resolve, latencyMs));
			}

			// Simulate random errors
			if (errorRate > 0 && Math.random() < errorRate) {
				throw new Error(`KV error getting key: ${key}`);
			}

			if (logger) {
				logger.database(`KV GET: ${key}`, { found: storage.has(key) });
			}

			const value = storage.get(key);
			
			if (options.type === 'stream') {
				return value ? new ReadableStream({
					start(controller) {
						controller.enqueue(new TextEncoder().encode(value));
						controller.close();
					}
				}) : null;
			}

			if (options.cacheTtl !== undefined) {
				// Simulate cache behavior
				const meta = metadata.get(key);
				if (meta?.cachedUntil && Date.now() < meta.cachedUntil) {
					if (logger) {
						logger.database(`KV GET: ${key} (cached)`, { ttl: meta.cachedUntil - Date.now() });
					}
				}
			}

			return value || null;
		},

		async put(key, value, options = {}) {
			if (latencyMs > 0) {
				await new Promise(resolve => setTimeout(resolve, latencyMs));
			}

			if (errorRate > 0 && Math.random() < errorRate) {
				throw new Error(`KV error putting key: ${key}`);
			}

			storage.set(key, value);
			
			// Store metadata
			if (options.expirationTtl || options.metadata) {
				metadata.set(key, {
					expirationTtl: options.expirationTtl,
					metadata: options.metadata,
					cachedUntil: options.expirationTtl ? Date.now() + (options.expirationTtl * 1000) : null
				});
			}

			if (logger) {
				logger.database(`KV PUT: ${key}`, { 
					size: value.length,
					ttl: options.expirationTtl 
				});
			}

			return undefined;
		},

		async delete(key) {
			if (latencyMs > 0) {
				await new Promise(resolve => setTimeout(resolve, latencyMs));
			}

			if (errorRate > 0 && Math.random() < errorRate) {
				throw new Error(`KV error deleting key: ${key}`);
			}

			const existed = storage.has(key);
			storage.delete(key);
			metadata.delete(key);

			if (logger) {
				logger.database(`KV DELETE: ${key}`, { existed });
			}

			return undefined;
		},

		async list(options = {}) {
			if (latencyMs > 0) {
				await new Promise(resolve => setTimeout(resolve, latencyMs));
			}

			const { prefix = '', limit = 1000, cursor } = options;
			const keys = Array.from(storage.keys())
				.filter(key => key.startsWith(prefix))
				.sort();

			const startIndex = cursor ? parseInt(cursor) : 0;
			const endIndex = Math.min(startIndex + limit, keys.length);
			const resultKeys = keys.slice(startIndex, endIndex);

			const result = {
				keys: resultKeys.map(name => ({
					name,
					expiration: metadata.get(name)?.expirationTtl,
					metadata: metadata.get(name)?.metadata
				})),
				list_complete: endIndex >= keys.length,
				cursor: endIndex < keys.length ? String(endIndex) : null
			};

			if (logger) {
				logger.database(`KV LIST: ${prefix}*`, { 
					count: result.keys.length,
					complete: result.list_complete 
				});
			}

			return result;
		},

		// Test utilities
		_storage: storage,
		_metadata: metadata,
		_clear() {
			storage.clear();
			metadata.clear();
		}
	};
}

/**
 * Create a mock environment builder
 * @param {Object} config - Environment configuration
 * @returns {Object} Mock environment
 */
export function createMockEnvironment(config = {}) {
	const {
		kvNamespaces = {},
		durableObjects = {},
		bindings = {},
		secrets = {},
		logger = null
	} = config;

	// Create KV namespaces
	const kvInstances = {};
	for (const [name, data] of Object.entries(kvNamespaces)) {
		kvInstances[name] = createMockKVNamespace(data, { logger });
	}

	// Create mock Durable Objects
	const doInstances = {};
	for (const [name, factory] of Object.entries(durableObjects)) {
		doInstances[name] = {
			get(id) {
				return {
					id,
					fetch: factory.fetch || (async () => new Response('Mock DO response'))
				};
			},
			newUniqueId() {
				return `mock-do-id-${Date.now()}-${Math.random()}`;
			}
		};
	}

	// Combine all bindings
	return {
		...kvInstances,
		...doInstances,
		...bindings,
		...Object.fromEntries(
			Object.entries(secrets).map(([k, v]) => [k, v])
		),
		// Test utilities
		_reset() {
			Object.values(kvInstances).forEach(kv => kv._clear());
		}
	};
}

/**
 * Edge case simulation factory
 * @returns {Object} Edge case simulators
 */
export function createEdgeCaseSimulators() {
	return {
		/**
		 * Simulate network failures
		 */
		networkFailure: {
			async fetch(input, init) {
				throw new Error('Network request failed');
			}
		},

		/**
		 * Simulate slow responses
		 */
		slowResponse: (delayMs = 5000) => ({
			async fetch(input, init) {
				await new Promise(resolve => setTimeout(resolve, delayMs));
				return new Response('Slow response', { status: 200 });
			}
		}),

		/**
		 * Simulate partial failures
		 */
		partialFailure: (successRate = 0.5) => ({
			async fetch(input, init) {
				if (Math.random() < successRate) {
					return new Response('Success', { status: 200 });
				}
				throw new Error('Random failure');
			}
		}),

		/**
		 * Simulate rate limiting
		 */
		rateLimited: (requestsPerSecond = 10) => {
			const requests = [];
			return {
				async fetch(input, init) {
					const now = Date.now();
					// Clean old requests
					const cutoff = now - 1000;
					const recentRequests = requests.filter(t => t > cutoff);
					
					if (recentRequests.length >= requestsPerSecond) {
						return new Response('Rate limit exceeded', { 
							status: 429,
							headers: {
								'Retry-After': '1'
							}
						});
					}
					
					requests.push(now);
					return new Response('Success', { status: 200 });
				}
			};
		},

		/**
		 * Simulate malformed responses
		 */
		malformedResponse: {
			async fetch(input, init) {
				return new Response('{"invalid": json', {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		},

		/**
		 * Simulate timeout
		 */
		timeout: (timeoutMs = 30000) => ({
			async fetch(input, init) {
				await new Promise((_, reject) => {
					setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
				});
			}
		}),

		/**
		 * Simulate different HTTP status codes
		 */
		httpStatus: (status, message = '') => ({
			async fetch(input, init) {
				return new Response(message || `HTTP ${status}`, { status });
			}
		}),

		/**
		 * Simulate CORS issues
		 */
		corsError: {
			async fetch(input, init) {
				return new Response('CORS error', {
					status: 200,
					headers: {
						'Access-Control-Allow-Origin': 'https://different-origin.com'
					}
				});
			}
		}
	};
}

/**
 * Create a test context for handlers
 * @param {Object} options - Context options
 * @returns {Object} Test context
 */
export function createTestContext(options = {}) {
	const {
		url = 'https://example.com/',
		method = 'GET',
		headers = {},
		env = {},
		mockKV = {},
		logger = null
	} = options;

	// Create URL object
	const urlObj = new URL(url);

	// Create mock environment with KV
	const mockEnv = createMockEnvironment({
		kvNamespaces: {
			MODULE_FEDERATION_ASSETS: mockKV
		},
		logger
	});

	// Create request
	const request = new Request(urlObj.toString(), {
		method,
		headers: new Headers(headers)
	});

	// CORS headers
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type'
	};

	return {
		request,
		url: urlObj,
		env: { ...mockEnv, ...env },
		corsHeaders,
		// Test utilities
		_mockKV: mockEnv.MODULE_FEDERATION_ASSETS,
		_reset() {
			mockEnv._reset();
		}
	};
}

/**
 * Create assertion helpers for handler testing
 * @returns {Object} Assertion utilities
 */
export function createAssertions() {
	return {
		/**
		 * Assert response status
		 */
		async assertStatus(response, expectedStatus, message = '') {
			if (response.status !== expectedStatus) {
				throw new Error(
					`Expected status ${expectedStatus}, got ${response.status}. ${message}`
				);
			}
		},

		/**
		 * Assert response JSON
		 */
		async assertJSON(response, expectedJSON, message = '') {
			const actual = await response.json();
			const expected = typeof expectedJSON === 'string' 
				? JSON.parse(expectedJSON) 
				: expectedJSON;

			if (JSON.stringify(actual) !== JSON.stringify(expected)) {
				throw new Error(
					`JSON mismatch. ${message}\nExpected: ${JSON.stringify(expected, null, 2)}\nActual: ${JSON.stringify(actual, null, 2)}`
				);
			}
		},

		/**
		 * Assert response contains
		 */
		async assertContains(response, searchString, message = '') {
			const text = await response.text();
			if (!text.includes(searchString)) {
				throw new Error(
					`Response does not contain "${searchString}". ${message}`
				);
			}
		},

		/**
		 * Assert header exists
		 */
		assertHeader(response, headerName, expectedValue = null, message = '') {
			const value = response.headers.get(headerName);
			if (!value) {
				throw new Error(`Header "${headerName}" not found. ${message}`);
			}
			if (expectedValue !== null && value !== expectedValue) {
				throw new Error(
					`Header "${headerName}" mismatch. Expected "${expectedValue}", got "${value}". ${message}`
				);
			}
		}
	};
}