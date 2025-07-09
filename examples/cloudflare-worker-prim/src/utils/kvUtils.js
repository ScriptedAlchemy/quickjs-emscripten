/**
 * KV Utilities - Shared utilities for Cloudflare KV operations
 */

/**
 * Get an asset from KV with error handling
 * @param {Object} env - Cloudflare environment object
 * @param {string} key - KV key to retrieve
 * @param {string} namespace - KV namespace name (default: 'MODULE_FEDERATION_ASSETS')
 * @returns {Promise<string|null>} - Asset content or null if not found
 */
export async function getKvAsset(env, key, namespace = 'MODULE_FEDERATION_ASSETS') {
	try {
		return await env[namespace].get(key);
	} catch (error) {
		console.error(`Failed to get KV asset ${key}:`, error);
		return null;
	}
}

/**
 * Get an asset from KV with metadata
 * @param {Object} env - Cloudflare environment object
 * @param {string} key - KV key to retrieve
 * @param {string} namespace - KV namespace name (default: 'MODULE_FEDERATION_ASSETS')
 * @returns {Promise<Object|null>} - Asset with metadata or null if not found
 */
export async function getKvAssetWithMetadata(env, key, namespace = 'MODULE_FEDERATION_ASSETS') {
	try {
		return await env[namespace].getWithMetadata(key);
	} catch (error) {
		console.error(`Failed to get KV asset with metadata ${key}:`, error);
		return null;
	}
}

/**
 * Check if an asset exists in KV
 * @param {Object} env - Cloudflare environment object
 * @param {string} key - KV key to check
 * @param {string} namespace - KV namespace name (default: 'MODULE_FEDERATION_ASSETS')
 * @returns {Promise<boolean>} - True if asset exists
 */
export async function kvAssetExists(env, key, namespace = 'MODULE_FEDERATION_ASSETS') {
	try {
		const asset = await env[namespace].get(key);
		return asset !== null;
	} catch (error) {
		console.error(`Failed to check KV asset existence ${key}:`, error);
		return false;
	}
}

/**
 * Get content type for a file based on extension
 * @param {string} filename - The filename or path
 * @returns {string} - Content type
 */
export function getContentType(filename) {
	const ext = filename.split('.').pop()?.toLowerCase();

	const contentTypes = {
		'js': 'application/javascript',
		'mjs': 'application/javascript',
		'json': 'application/json',
		'css': 'text/css',
		'html': 'text/html',
		'txt': 'text/plain',
		'md': 'text/markdown',
		'png': 'image/png',
		'jpg': 'image/jpeg',
		'jpeg': 'image/jpeg',
		'gif': 'image/gif',
		'svg': 'image/svg+xml',
		'wasm': 'application/wasm',
		'map': 'application/json'
	};

	return contentTypes[ext] || 'application/octet-stream';
}
