/* eslint-disable */
/* eslint-env node */
// Test: Real remote entry with improved promise-based async handling

import { newQuickJSWASMModule, RELEASE_SYNC } from 'quickjs-emscripten';
import { Arena } from 'quickjs-emscripten-sync';
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
  console.log('🔥 Testing with REAL remote entry file (Improved Promise-based)');
  const startTime = Date.now();

  const QuickJS = await newQuickJSWASMModule(RELEASE_SYNC);
  const vm = QuickJS.newContext();
  const arena = new Arena(vm, { isMarshalable: true });

  try {
    // Load the REAL remote entry from the built file
    const realRemoteEntryPath = path.resolve(__dirname, '../rsbuild-project/dist/remoteEntry.js');
    const realRemoteEntry = fs.readFileSync(realRemoteEntryPath, 'utf8');
    const distDir = path.resolve(__dirname, '../rsbuild-project/dist');

    console.log(`📦 Real remoteEntry loaded: ${realRemoteEntry.length} chars`);

    // Set up host-side FS and KV simulation
    const kvNamespace = arena.sync({
      get: (key) => {
        const fp = path.join(distDir, key);
        console.log(`[KV] Reading ${key} from ${fp}`);
        return fs.promises.readFile(fp, 'utf8')
          .then(content => {
            console.log(`[KV] Successfully read ${key}: ${content.length} chars`);
            return content;
          });
      },
    });

    const moduleObj = { exports: {} };

    // Expose FS and KV to Arena
    arena.expose({
      console: arena.sync({
        log: (...args) => {
          const message = args.map(String).join(' ');
          console.log('[QuickJS]', message);
        },
      }),
      require: () => ({}),
      module: arena.sync(moduleObj),
      exports: arena.sync(moduleObj.exports),
      __CF_KV_NAMESPACE__: kvNamespace,
    });

    console.log('✅ FS and KV exposed to Arena');

    // Execute real remote entry and set up promise-based completion
    arena.evalCode(`
      // Execute the real remote entry
      ${realRemoteEntry}

      // Set up test completion promise
      globalThis.__testFinishedDeferred = {};
      globalThis.__testFinished = new Promise(resolve => {
        globalThis.__testFinishedDeferred.resolve = resolve;
      });

      // Set up result storage
      globalThis.__realTestResult = null;
      globalThis.__realTestError = null;
    `);

    console.log('\n=== REAL REMOTE ENTRY TEST ===');

    // Basic validation of the real remote entry execution
    const moduleType = arena.evalCode('typeof module.exports');
    const moduleKeys = arena.evalCode('Object.keys(module.exports)');
    const getType = arena.evalCode('typeof module.exports.get');
    const webpackRequireGlobal = arena.evalCode('typeof __webpack_require__');
    const webpackRequireGlobalThis = arena.evalCode('typeof globalThis.__webpack_require__');

    console.log('[QuickJS] Real remote entry executed');
    console.log('[QuickJS] module.exports type:', moduleType);
    console.log('[QuickJS] module.exports keys:', moduleKeys);
    console.log('[QuickJS] module.exports.get type:', getType);
    console.log('[QuickJS] __webpack_require__ in global scope:', webpackRequireGlobal);
    console.log('[QuickJS] globalThis.__webpack_require__:', webpackRequireGlobalThis);

    console.log('\n=== TESTING REAL GET METHOD ===');

    // Test the real module.exports.get method with promise-based completion
    arena.evalCode(`
      const testRealGet = async () => {
        try {
          console.log('Testing real module.exports.get...');
          console.log('Calling real get method...');

          const realFactory = await module.exports.get('./HelloWorld');
          console.log('Real factory received:', typeof realFactory);
          console.log('Real factory preview:', String(realFactory).substring(0, 200) + '...');

          console.log('Attempting to execute real factory...');
          const realModuleExports = realFactory();
          console.log('Real factory executed successfully!');
          console.log('Real module exports type:', typeof realModuleExports);
          console.log('Real module keys:', Object.keys(realModuleExports || {}));

          if (realModuleExports && typeof realModuleExports.helloWorld === 'function') {
            const realGreeting = realModuleExports.helloWorld({ name: 'Real Test' });
            console.log('Real greeting:', realGreeting);

            // Resolve with the final result
            globalThis.__testFinishedDeferred.resolve(realGreeting);
          } else {
            throw new Error('helloWorld function not found in real module exports');
          }

        } catch (err) {
          console.log('Real test error:', err && (err.message || String(err)));
          globalThis.__testFinishedDeferred.resolve('Error: ' + (err && (err.message || String(err))));
        }
      };

      testRealGet();
    `);

    console.log('\n=== WAITING FOR ASYNC OPERATIONS ===');

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
    const realTestResult = await donePromise;
    const realTestError = arena.evalCode('globalThis.__realTestError');

    console.log('\n=== REAL REMOTE ENTRY RESULTS ===');
    console.log('Real test result:', realTestResult);
    console.log('Real test error:', realTestError);

    if (realTestResult && !realTestResult.startsWith('Error:')) {
      console.log('✅ SUCCESS with real remote entry:', realTestResult);
    } else {
      console.log('❌ FAILED with real remote entry:', realTestResult || realTestError);
      throw new Error('Real remote entry test failed: ' + (realTestResult || realTestError));
    }

    // Dispose handle if needed
    if (doneHandle && typeof doneHandle.dispose === 'function') {
      doneHandle.dispose();
    }

    const endTime = Date.now();
    console.log(`⏱️ Total execution time: ${endTime - startTime}ms`);

  } catch (error) {
    console.error('💥 Real remote entry test failed:', error.message);
    throw error;
  } finally {
    arena.dispose();
    console.log('✨ Real remote entry test completed (Promise-based approach)');
  }
})();
