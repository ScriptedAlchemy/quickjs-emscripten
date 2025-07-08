/* eslint-disable */
/* eslint-env node */
// Test: Arena-sync with improved promise-based async handling

import { newQuickJSWASMModule, RELEASE_SYNC } from 'quickjs-emscripten';
import { Arena, defaultRegisteredObjects } from 'quickjs-emscripten-sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Drive QuickJS until `donePromise` settles.
 * Automatically processes micro-tasks produced inside the VM.
 */
async function waitForQuickJS(runtime, donePromise) {
  let isComplete = false;

  // Set up completion detection
  donePromise.then(() => { isComplete = true; });

  // keep pumping until our sentinel promise is done
  while (!isComplete) {
    // allow Node's event-loop to proceed
    await new Promise(resolve => setImmediate(resolve));

    const jobs = runtime.executePendingJobs();
    if (jobs.error) {
      runtime.dump(jobs.error);
      jobs.error.dispose();
      throw new Error('QuickJS runtime error during job execution');
    }
  }
}

(async () => {
  console.log('🚀 Arena test – automatic handle tracking (Improved Promise-based)');

  const QuickJS = await newQuickJSWASMModule(RELEASE_SYNC);
  const vm = QuickJS.newContext();
  console.log('✅ QuickJS context created');

  const arena = new Arena(vm, {
    isMarshalable: true,
    registeredObjects: defaultRegisteredObjects
  });
  console.log('✅ Arena created with permissive marshalling and performance optimizations');

  try {
    // Load the remote entry
    const remoteEntryPath = path.resolve(__dirname, '../rsbuild-project/dist/remoteEntry.js');
    const remoteEntry = fs.readFileSync(remoteEntryPath, 'utf8');
    const distDir = path.resolve(__dirname, '../rsbuild-project/dist');

    console.log(`📦 remoteEntry loaded: ${remoteEntry.length} chars`);

    // Set up host-side globals
    const logs = [];
    const consoleBridge = {
      log: (...args) => {
        const message = args.map(String).join(' ');
        logs.push(`[VM] ${message}`);
        console.log('[QuickJS]', message);
      },
    };

    const requireStub = (id) => {
      console.log(`[Host] require() called with: ${id}`);
      if (id === 'fs') {
        return {
          readFileSync: (path) => {
            console.log(`[Host] readFileSync: ${path}`);
            return 'mocked file content';
          }
        };
      }
      return {};
    };

    const moduleObj = { exports: {} };
    const kvNamespace = arena.sync({
      get: (key) => {
        const fp = path.join(distDir, key);
        console.log(`[KV] Async reading ${key}...`);
        return fs.promises.readFile(fp, 'utf8')
          .then(content => {
            console.log(`[KV] Successfully read ${key}: ${content.length} chars`);
            return content;
          });
      },
    });

    // Expose objects to Arena
    arena.expose({
      console: consoleBridge,
      require: requireStub,
      module: arena.sync(moduleObj),
      exports: arena.sync(moduleObj.exports),
      __CF_KV_NAMESPACE__: kvNamespace,
    });

    console.log('Exposing objects to Arena...');
    console.log('✅ Objects exposed successfully with sync');

    // Execute remote entry and set up promise-based completion
    console.log('Executing remote entry and test in same context...');
    try {
      arena.evalCode(`
        // Execute the remote entry
        ${remoteEntry}

        // Set up test completion promise
        globalThis.__testFinishedDeferred = {};
        globalThis.__testFinished = new Promise(resolve => {
          globalThis.__testFinishedDeferred.resolve = resolve;
        });

        // Set up test result storage
        globalThis.__testResult = null;
        globalThis.__testError = null;
      `);
      console.log('✅ Remote entry and test executed in same context');
    } catch (error) {
      console.log('❌ Remote entry and test execution failed:', error);
      throw error;
    }

    // Execute Module Federation test with promise-based completion
    console.log('Testing module exports and webpack runtime...');
    let testResult;
    try {
      // Test basic access first
      testResult = arena.evalCode(`
        console.log('Testing basic access...');
        console.log('typeof module:', typeof module);
        console.log('typeof exports:', typeof exports);
        'Basic access test'
      `);
      console.log('✅ Basic access test result:', testResult);

      // Test module.exports access
      testResult = arena.evalCode(`
        console.log('Testing module.exports access...');
        console.log('typeof module.exports:', typeof module.exports);
        'Module.exports access test'
      `);
      console.log('✅ Module.exports access test result:', testResult);

      // Check what's available in global scope after remote entry execution
      testResult = arena.evalCode(`
        console.log('Checking global scope after remote entry...');
        console.log('typeof __webpack_require__:', typeof __webpack_require__);
        console.log('typeof globalThis.__webpack_require__:', typeof globalThis.__webpack_require__);
        console.log('typeof self:', typeof self);
        console.log('typeof window:', typeof window);

        // Check what globals are available
        const globals = [];
        for (const key in globalThis) {
          if (key.includes('webpack') || key.includes('__')) {
            globals.push(key + ': ' + typeof globalThis[key]);
          }
        }
        console.log('Webpack-related globals:', globals);

        'Global scope check'
      `);
      console.log('✅ Global scope test result:', testResult);

      // Test Object.keys on module.exports
      testResult = arena.evalCode(`
        console.log('Testing Object.keys...');
        const keys = Object.keys(module.exports);
        console.log('Module exports keys:', keys);
        'Object.keys test: ' + keys.length + ' keys'
      `);
      console.log('✅ Object.keys test result:', testResult);

      // Test get method access and init
      testResult = arena.evalCode(`
        console.log('Testing get method access...');
        console.log('module.exports.get type:', typeof module.exports.get);
        console.log('module.exports.init type:', typeof module.exports.init);

        if (!module.exports || !module.exports.get) {
          throw new Error('module.exports.get not available');
        }

        // Try calling init() first as suggested
        if (typeof module.exports.init === 'function') {
          console.log('Calling module.exports.init()...');
          try {
            const initResult = module.exports.init();
            console.log('Init result:', typeof initResult);
          } catch (initError) {
            console.log('Init error:', initError.message);
          }
        }

        'Module Federation test started'
      `);
      console.log('✅ Get method test result:', testResult);

    } catch (error) {
      console.log('❌ Module exports test failed:', error);
      throw error;
    }

    console.log('Test initialization:', testResult);

    // Now execute the actual test with promise-based completion
    console.log('Setting up promise-based test...');

    arena.evalCode(`
      const execute = async () => {
        try {
          console.log('Testing Module Federation pattern using getAndExecute method');

          console.log('About to call module.exports.get...');
          const factory = await module.exports.get('./HelloWorld');
          console.log('Factory received in Arena:', typeof factory);
          console.log('Factory content preview:', String(factory).substring(0, 200) + '...');

          // Execute the factory
          console.log('Executing factory...');
          const moduleExports = factory();
          console.log('Factory executed, module type:', typeof moduleExports);
          console.log('Module keys:', Object.keys(moduleExports || {}));

          let greeting;
          if (moduleExports && typeof moduleExports.helloWorld === 'function') {
            greeting = moduleExports.helloWorld({ name: 'Arena' });
            console.log('HelloWorld function result:', greeting);
          } else if (moduleExports && typeof moduleExports.default === 'function') {
            greeting = moduleExports.default({ name: 'Arena' });
            console.log('Default function result:', greeting);
          } else {
            console.log('Module structure:', Object.keys(moduleExports || {}));
            throw new Error('HelloWorld function not found in module exports');
          }

          // Resolve with the final result
          globalThis.__testFinishedDeferred.resolve(greeting);

        } catch (err) {
          console.log('Async execution error:', err && (err.message || String(err)));
          globalThis.__testFinishedDeferred.resolve('Error: ' + (err && (err.message || String(err))));
        }
      };

      execute();
    `);

    console.log('Waiting for async operations and executing pending jobs...');

    // Get the promise handle and convert it to a native promise
    const doneHandle = arena.evalCode('globalThis.__testFinished');

    // Use vm.resolvePromise if we have a QuickJS handle, otherwise handle directly
    let donePromise;
    if (doneHandle && typeof doneHandle.dispose === 'function') {
      donePromise = vm.resolvePromise(doneHandle);
    } else {
      // Arena might have already converted it to a native promise
      donePromise = Promise.resolve(doneHandle);
    }

    // Drive the VM until that promise resolves
    await waitForQuickJS(vm.runtime, donePromise);

    // Get the final result
    const finalResult = await donePromise;

    console.log('Final result:', finalResult);

    // Assert the expected result
    const expectedGreeting = 'Hello, Arena!';
    if (finalResult === expectedGreeting) {
      console.log('✅ Arena test PASSED: Greeting matches expected result');
    } else {
      console.log('❌ Arena test FAILED: Expected "' + expectedGreeting + '" but got "' + finalResult + '"');
      throw new Error('Arena test assertion failed: Expected "' + expectedGreeting + '" but got "' + finalResult + '"');
    }

    // Dispose handle if needed
    if (doneHandle && typeof doneHandle.dispose === 'function') {
      doneHandle.dispose();
    }

  } finally {
    arena.dispose();  // disposes VM too
    console.log('✨ Arena test completed & VM disposed (Promise-based approach)\n');
  }
})();
