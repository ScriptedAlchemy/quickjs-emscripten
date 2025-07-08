import type {
  FederationRuntimePlugin,
  FederationHost,
} from '@module-federation/runtime';

type WebpackRequire = {
  (id: string): any;
  u: (chunkId: string) => string;
  p: string;
  m: { [key: string]: any };
  o: (obj: any, prop: string) => boolean;
  C?: (chunk: any) => void;
  l: (
    url: string,
    done: (res: any) => void,
    key: string,
    chunkId: string,
  ) => void;
  federation: {
    runtime: {
      loadScriptNode: (
        url: string,
        options: { attrs: { globalName: string } },
      ) => Promise<any>;
    };
    instance: FederationHost;
    chunkMatcher?: (chunkId: string) => boolean;
    rootOutputDir?: string;
    initOptions: {
      name: string;
      remotes: any;
    };
  };
  f?: {
    require?: (chunkId: string, promises: any[]) => void;
    readFileVm?: (chunkId: string, promises: any[]) => void;
  };
};

declare const __webpack_require__: WebpackRequire;

// Helper to get KV namespace from global context
const getKVNamespace = (): KVNamespace | null => {
  const globalContext = typeof globalThis !== 'undefined' ? globalThis :
                       typeof self !== 'undefined' ? self :
                       typeof window !== 'undefined' ? window : {};

  // @ts-ignore
  return globalContext.__CF_KV_NAMESPACE__ || null;
};

// Global logs array for collecting debug information
let pluginLogs: string[] = [];

// Helper to get logs
export const getPluginLogs = (): string[] => {
  const logs = [...pluginLogs];
  pluginLogs = []; // Clear logs after reading
  return logs;
};

// Helper to add log
const addLog = (message: string): void => {
  pluginLogs.push(message);
};

// Global storage for executed modules (to avoid re-execution)
let executedModulesCache: { [key: string]: any } = {};

// Check if this is a Module Federation factory that needs immediate execution
const isModuleFederationFactory = (moduleFactory: any): boolean => {
  if (typeof moduleFactory !== 'function') return false;
  const factoryStr = moduleFactory.toString();
  // Match patterns like: ()=>__webpack_require__(360) or function(){return __webpack_require__(360)}
  return /(\(\)\s*=>\s*__webpack_require__\s*\(\s*\d+\s*\)|function\s*\(\)\s*\{\s*return\s+__webpack_require__\s*\(\s*\d+\s*\)\s*\})/.test(factoryStr);
};

// Load chunk from KV and execute using eval (LEPUS/PrimJS compatible)
const loadChunkFromKV = (
  chunkId: string,
  callback: (err: Error | null, chunk: any) => void,
): void => {
  try {
    const kv = getKVNamespace();
    if (!kv) {
      return callback(new Error('KV namespace not available'), null);
    }

    const chunkName = __webpack_require__.u(chunkId);
    addLog(`[CloudflarePlugin] Loading chunk: ${chunkName}`);

    // Use promise-based KV access
    if (typeof kv.get === 'function') {
      // Call KV get which returns a promise
      const promise = kv.get(chunkName);
      addLog(`[CloudflarePlugin] KV promise created for: ${chunkName}`);

      // Handle the promise (this will be resolved by the Cloudflare Worker host)
      promise.then((content: string) => {
        addLog(`[CloudflarePlugin] KV promise resolved for: ${chunkName}`);

        if (!content) {
          return callback(new Error(`Chunk not found in KV: ${chunkName}`), null);
        }

        addLog(`[CloudflarePlugin] Chunk loaded from KV: ${chunkName} (${content.length} chars)`);

        // Execute the chunk code in LEPUS/PrimJS context
        const chunk = {
          modules: {},
          ids: [],
          runtime: null
        };

        try {

          eval(`(function(exports, require, __dirname, __filename) {${content}\n})`)(
            chunk,
            __webpack_require__,
            '/',
            chunkName,
          );


          addLog(`[CloudflarePlugin] Chunk executed successfully: ${chunkName}`);
          addLog(`[CloudflarePlugin] Chunk modules keys: ${Object.keys(chunk.modules || {}).join(', ')}`);
          addLog(`[CloudflarePlugin] Chunk ids: ${JSON.stringify(chunk.ids)}`);
          addLog(`[CloudflarePlugin] Chunk runtime: ${typeof chunk.runtime}`);

          callback(null, chunk);
        } catch (execError) {
          addLog(`[CloudflarePlugin] Error executing chunk: ${chunkName} - ${execError}`);
          callback(execError as Error, null);
        }
      }).catch((error: Error) => {
        addLog(`[CloudflarePlugin] KV promise rejected for: ${chunkName} - ${error.message}`);
        callback(error, null);
      });
    } else {
      return callback(new Error('KV.get is not a function'), null);
    }
  } catch (error) {
    addLog(`[CloudflarePlugin] Error loading chunk from KV: ${chunkId} - ${error}`);
    callback(error as Error, null);
  }
};

// Install chunk modules into webpack
const installChunk = (
  chunk: any,
  installedChunks: { [key: string]: any },
): void => {
  // Add modules to the webpack module cache
  for (const moduleId in chunk.modules) {
    __webpack_require__.m[moduleId] = chunk.modules[moduleId];
  }

  // Execute runtime if present
  if (chunk.runtime) {
    chunk.runtime(__webpack_require__);
  }

  // Mark chunks as loaded
  for (const chunkId of chunk.ids || []) {
    if (installedChunks[chunkId]) {
      installedChunks[chunkId][0]();
    }
    installedChunks[chunkId] = 0;
  }
};

// Delete chunk on failure
const deleteChunk = (
  chunkId: string,
  installedChunks: { [key: string]: any },
): boolean => {
  delete installedChunks[chunkId];
  return true;
};

// Set up chunk handler for readFileVm
const setupChunkHandler = (
  installedChunks: { [key: string]: any },
): ((chunkId: string, promises: any[]) => void) => {
  return (chunkId: string, promises: any[]): void => {
    let installedChunkData = installedChunks[chunkId];

    if (installedChunkData !== 0) { // 0 means "already installed"
      if (installedChunkData) {
        // Promise already exists, just add to promises array
        promises.push(installedChunkData[2]);
      } else {
        // Create new promise for this chunk
        const promise = new Promise((resolve, reject) => {
          installedChunkData = installedChunks[chunkId] = [resolve, reject];

          // Load chunk from KV (now uses callbacks instead of async/await)
          loadChunkFromKV(chunkId, (err, chunk) => {
            if (err) {
              addLog(`[CloudflarePlugin] Failed to load chunk: ${chunkId} - ${err.message}`);
              deleteChunk(chunkId, installedChunks);
              return reject(err);
            }

            if (chunk) {
              installChunk(chunk, installedChunks);
            }

            resolve(chunk);
          });
        });

        promises.push((installedChunkData[2] = promise));
      }
    }
  };
};

export default function cloudflareRuntimePlugin(): FederationRuntimePlugin {
  return {
    name: 'cloudflare-runtime-plugin',
    beforeInit(args) {
      addLog('[CloudflarePlugin] Initializing Node Federation runtime plugin');

      // Create the chunk tracking object
      const installedChunks: { [key: string]: any } = {};

      // Create chunk handler
      const chunkHandler = setupChunkHandler(installedChunks);

      // Patch webpack chunk loading for async-node target
      if (__webpack_require__.f) {
        // For async-node target, patch readFileVm
        if (__webpack_require__.f.readFileVm) {
          addLog('[CloudflarePlugin] Patching __webpack_require__.f.readFileVm for async-node');
          __webpack_require__.f.readFileVm = chunkHandler;
        }

        // Also patch require as fallback
        if (__webpack_require__.f.require) {
          addLog('[CloudflarePlugin] Patching __webpack_require__.f.require as fallback');
          __webpack_require__.f.require = chunkHandler;
        }
      }

      return args;
    },
  };
}

// Export a helper to set KV namespace in global context
export function setKVNamespace(kv: KVNamespace): void {
  const globalContext = typeof globalThis !== 'undefined' ? globalThis :
                       typeof self !== 'undefined' ? self :
                       typeof window !== 'undefined' ? window : {};
  // @ts-ignore
  globalContext.__CF_KV_NAMESPACE__ = kv;
}
