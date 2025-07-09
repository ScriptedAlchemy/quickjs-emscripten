/**
 * Shared Constants - Common values used across handlers
 */

export const MODULE_FEDERATION = {
	NAMESPACE: 'MODULE_FEDERATION_ASSETS',
	REMOTE_ENTRY: 'remoteEntry.js',
	EXPOSED_MODULES: [
		'HelloWorld - Basic greeting functions',
		'DataProcessor - Data manipulation utilities',
		'ApiUtils - API request utilities',
		'WorkerUtils - Cloudflare Worker utilities',
		'AdvancedExamples - Complex async patterns',
		'FetchUtils - External API fetching with JSONPlaceholder'
	]
};

export const CACHE_HEADERS = {
	ASSETS: 'public, max-age=86400', // 1 day
	REMOTE_ENTRY: 'public, max-age=3600', // 1 hour
};

export const EXECUTION_TIMEOUTS = {
	DEFAULT_MAX_ITERATIONS: 50,
	FETCH_UTILS_MAX_ITERATIONS: 100,
	DEFAULT_DELAY_MS: 10,
	FETCH_UTILS_DELAY_MS: 100,
	INITIAL_DELAY_MS: 200,
	STABLE_COUNT_THRESHOLD: 3,
	FETCH_UTILS_STABLE_COUNT: 10
};

export const EXAMPLES = {
	basic: '1 + 1',
	string: '"Hello from QuickJS!"',
	array: '[1, 2, 3].map(x => x * 2)',
	fetch_simple: 'fetch("https://httpbin.org/uuid")',
	fetch_json: 'JSON.parse(fetchedData).uuid',
	fetch_users: 'fetch("https://jsonplaceholder.typicode.com/users")',
	process_users: 'JSON.parse(fetchedData).slice(0, 3).map(u => u.name)'
};
