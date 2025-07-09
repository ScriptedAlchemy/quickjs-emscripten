/* eslint-disable */
/* eslint-env node */
// Test: demonstrateFetchCapabilities Function with improved promise-based async handling

import { newQuickJSWASMModule, RELEASE_SYNC } from 'quickjs-emscripten';
import { Arena } from 'quickjs-emscripten-sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupArena } from '../src/utils/arenaUtils.js';

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

/**
 * Test FetchUtils demonstrateFetchCapabilities with improved arena setup
 */

(async () => {
  console.log('🔧 Testing FetchUtils with Improved Arena Setup (Native Fetch)');
  const startTime = Date.now();

  const QuickJS = await newQuickJSWASMModule(RELEASE_SYNC);

  // Mock environment for KV operations
  const distDir = path.resolve(__dirname, '../rsbuild-project/dist');
  const mockEnv = {
    MODULE_FEDERATION_ASSETS: {
      get: (key) => {
        const fp = path.join(distDir, key);
        console.log(`[KV] Reading ${key}...`);
        return fs.promises.readFile(fp, 'utf8')
          .then(content => {
            console.log(`[KV] Successfully read ${key}: ${content.length} chars`);
            return content;
          });
      },
    }
  };

  // Set up arena with improved fetch
  const logs = [];
  const { arena, vm, dispose } = setupArena(QuickJS, {
    env: mockEnv,
    logs: logs,
    enableFetch: true,
    useLegacyFetchProxy: false // Use improved arena-compatible fetch
  });

  try {
    // Load the remote entry
    const remoteEntryPath = path.resolve(__dirname, '../rsbuild-project/dist/remoteEntry.js');
    const remoteEntry = fs.readFileSync(remoteEntryPath, 'utf8');

    console.log(`📦 Remote entry loaded: ${remoteEntry.length} chars`);
    console.log('✅ Arena set up with improved fetch implementation');

    // Execute remote entry and set up promise-based completion
    arena.evalCode(`
      // Execute the remote entry
      ${remoteEntry}

      // Set up test completion promise
      globalThis.__testFinishedDeferred = {};
      globalThis.__testFinished = new Promise(resolve => {
        globalThis.__testFinishedDeferred.resolve = resolve;
      });

      // Set up test result storage
      globalThis.__fetchResults = {};
      globalThis.__fetchErrors = {};
    `);

    console.log('✅ Remote entry executed and test promise set up');

    // Test FetchUtils module
    arena.evalCode(`
      const executeFetchTests = async () => {
        let testResults = {};
        let testErrors = {};

        try {
          console.log('🧪 Testing FetchUtils Module with Improved Arena Fetch');

          const fetchUtilsFactory = await module.exports.get('./FetchUtils');
          console.log('FetchUtils factory type:', typeof fetchUtilsFactory);

          if (typeof fetchUtilsFactory === 'function') {
            const fetchUtilsModule = fetchUtilsFactory();
            console.log('FetchUtils module keys:', Object.keys(fetchUtilsModule || {}));

            // Test demonstrateFetchCapabilities
            if (fetchUtilsModule && fetchUtilsModule.demonstrateFetchCapabilities) {
              try {
                console.log('🌐 Running demonstrateFetchCapabilities with improved fetch...');

                const result = await fetchUtilsModule.demonstrateFetchCapabilities();

                console.log('✅ demonstrateFetchCapabilities completed!');
                console.log('Demo success:', result.success);
                console.log('Total duration:', result.totalDuration + 'ms');

                // Store the complete result
                testResults.demonstrateCapabilities = result;

                if (result.results?.posts?.sample) {
                  console.log('📄 Posts Sample from Demo:');
                  result.results.posts.sample.slice(0, 2).forEach((post, index) => {
                    console.log('   ' + (index + 1) + '. ID: ' + post.id + ', Title: ' + post.title.substring(0, 50) + '...');
                  });
                }

                if (result.results?.users?.sample) {
                  console.log('👥 Users Sample from Demo:');
                  result.results.users.sample.slice(0, 2).forEach((user, index) => {
                    console.log('   ' + (index + 1) + '. ID: ' + user.id + ', Name: ' + user.name + ', Email: ' + user.email);
                  });
                }

              } catch (error) {
                console.log('❌ demonstrateFetchCapabilities error:', error.message);
                testErrors.demonstrateCapabilities = error.message;
              }
            }

            console.log('🎉 FetchUtils test completed with improved arena fetch!');

          } else {
            throw new Error('FetchUtils factory not found or not a function');
          }

        } catch (error) {
          console.log('❌ FetchUtils test execution error:', error.message);
          testErrors.execution = error.message;
        } finally {
          // Update globals for compatibility
          globalThis.__fetchResults = testResults;
          globalThis.__fetchErrors = testErrors;

          // Resolve the test completion promise
          globalThis.__testFinishedDeferred.resolve({
            results: testResults,
            errors: testErrors
          });
        }
      };

      executeFetchTests();
    `);

    console.log('Test initiated, waiting for completion...');

    // Get the promise handle and convert it to a native promise
    const doneHandle = arena.evalCode('globalThis.__testFinished');
    let donePromise;
    if (doneHandle && typeof doneHandle.dispose === 'function') {
      donePromise = vm.resolvePromise(doneHandle);
    } else {
      donePromise = Promise.resolve(doneHandle);
    }

    // Drive the VM until that promise resolves
    await waitForQuickJS(vm.runtime, donePromise);

    // Get the final result
    const testResults = await donePromise;

    // Only dispose if it's a QuickJS handle
    if (doneHandle && typeof doneHandle.dispose === 'function') {
      doneHandle.dispose();
    }

    console.log('\n=== IMPROVED ARENA FETCH TEST RESULTS ===');
    console.log('Test results:', testResults);

    let fetchResults, fetchErrors;
    if (testResults && typeof testResults === 'object') {
      fetchResults = testResults.results;
      fetchErrors = testResults.errors;
    } else {
      // Fallback to reading from globals
      fetchResults = arena.evalCode('globalThis.__fetchResults');
      fetchErrors = arena.evalCode('globalThis.__fetchErrors');
    }

    console.log('Results keys:', Object.keys(fetchResults || {}));
    console.log('Errors:', fetchErrors);

    // Display results
    if (fetchResults?.demonstrateCapabilities) {
      const demo = fetchResults.demonstrateCapabilities;
      console.log('\n🎯 DEMONSTRATION RESULTS:');
      console.log('Success:', demo.success);
      console.log('Total Duration:', demo.totalDuration + 'ms');

      if (demo.results?.posts?.sample) {
        console.log(`Posts fetched: ${demo.results.posts.sample.length}`);
      }
      if (demo.results?.users?.sample) {
        console.log(`Users fetched: ${demo.results.users.sample.length}`);
      }
    }

    // Count successful tests
    const successCount = fetchResults ? Object.keys(fetchResults).length : 0;
    const errorCount = fetchErrors ? Object.keys(fetchErrors).length : 0;

    console.log(`📊 Summary: ${successCount} successful, ${errorCount} errors`);

    const endTime = Date.now();
    console.log(`⏱️ Total execution time: ${endTime - startTime}ms`);

    // Show arena logs for debugging
    console.log('\n📋 Arena Logs (last 5):');
    logs.slice(-5).forEach(log => console.log(`  ${log}`));

    // Determine overall success
    const success = successCount > 0 && successCount > errorCount;

    if (success) {
      console.log('✅ IMPROVED ARENA FETCH TEST PASSED: External API calls working with better implementation');
    } else {
      console.log('❌ IMPROVED ARENA FETCH TEST FAILED: Issues with external API calls');
      throw new Error(`Improved arena fetch test failed: ${successCount} successful, ${errorCount} errors`);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    throw error;
  } finally {
    dispose();
    console.log('✨ Test completed & Arena disposed');
  }
})();
