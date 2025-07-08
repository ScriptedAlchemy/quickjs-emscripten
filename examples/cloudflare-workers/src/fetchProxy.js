/**
 * Fetch Proxy - Legacy compatibility layer for arena setup
 *
 * @deprecated - Use ./utils/arenaUtils.js directly
 * This file now re-exports shared utilities for backward compatibility
 */

import { createFetchProxy, setupArena } from './utils/arenaUtils.js';

// Re-export for backward compatibility
function setupArenaWithFetch(
  arena,
  consoleBridge,
  moduleObj,
  kvNamespace,
  opts = {},
) {
  // This is the legacy interface - expose the globals manually
  arena.expose({
    console: consoleBridge,
    require: opts.requireStub || (() => ({})),
    module: opts.syncedModule || arena.sync(moduleObj),
    exports: opts.syncedExports || arena.sync(moduleObj.exports),
    __CF_KV_NAMESPACE__: kvNamespace,
    __fetchProxy: createFetchProxy(),
  });

  // Set up fetch in QuickJS using the proxy
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
}

export {
  createFetchProxy,
  setupArenaWithFetch
};
