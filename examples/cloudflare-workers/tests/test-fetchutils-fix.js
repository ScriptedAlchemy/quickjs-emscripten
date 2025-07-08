/* eslint-disable */
/* eslint-env node */
/**
 * Test to demonstrate the FetchUtils execution fix
 * This shows how to properly capture async results from demonstrateFetchCapabilities
 */

import { newQuickJSWASMModule, RELEASE_SYNC } from 'quickjs-emscripten';
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

(async () => {
  console.log('🔧 Testing FetchUtils demonstrateFetchCapabilities Result Capture Fix (Improved Arena Setup)');
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

      // Execution status tracking
      globalThis.__executionStatus = 'initializing';
      globalThis.__executionError = null;
      globalThis.__executionResult = null;
    `);

    // Set up the execution with improved promise-based completion
    arena.evalCode(`
      console.log('🔄 Starting FetchUtils execution...');
      globalThis.__executionStatus = 'loading-factory';

      const execute = async () => {
        try {
          const fetchUtilsFactory = await module.exports.get('./FetchUtils');
          console.log('✅ FetchUtils factory loaded, type:', typeof fetchUtilsFactory);

          if (typeof fetchUtilsFactory === 'function') {
            const fetchUtilsModule = fetchUtilsFactory();
            console.log('✅ FetchUtils module instantiated, keys:', Object.keys(fetchUtilsModule || {}));

            if (fetchUtilsModule && fetchUtilsModule.demonstrateFetchCapabilities) {
              globalThis.__executionStatus = 'executing-fetch-demo';
              console.log('🌐 Executing demonstrateFetchCapabilities...');

              const result = await fetchUtilsModule.demonstrateFetchCapabilities();

              console.log('✅ demonstrateFetchCapabilities completed!');
              console.log('📊 Demo result type:', typeof result);
              console.log('📊 Demo success:', result?.success);

              if (result?.results?.posts?.sample) {
                console.log('📄 Posts sample count:', result.results.posts.sample.length);
                console.log('📄 First post title:', result.results.posts.sample[0]?.title);
              }

              globalThis.__executionStatus = 'completed-success';
              globalThis.__executionResult = {
                module: 'FetchUtils',
                function: 'demonstrateFetchCapabilities',
                result: result,
                status: 'completed'
              };

              console.log('🎉 Execution completed and result stored successfully!');

              // Resolve with the final result
              globalThis.__testFinishedDeferred.resolve(globalThis.__executionResult);

            } else {
              throw new Error('demonstrateFetchCapabilities function not found');
            }
          } else {
            throw new Error('FetchUtils factory not found or not a function');
          }

        } catch (error) {
          console.log('❌ FetchUtils execution error:', error.message);
          globalThis.__executionStatus = 'completed-error';
          globalThis.__executionError = error.message;
          globalThis.__testFinishedDeferred.resolve({ error: error.message });
        }
      };

      execute();
    `);

    console.log('🔄 Async execution initiated, processing jobs...');

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
    const executionStatus = arena.evalCode('globalThis.__executionStatus');

    console.log(`✅ Execution completed with status: ${executionStatus}`);

    console.log('\n============================================================');
    console.log('🎯 FETCHUTILS EXECUTION RESULTS (Improved Arena Setup)');
    console.log('============================================================');
    console.log('Final status:', executionStatus);
    console.log('Has error:', !!finalResult?.error);
    console.log('Result type:', typeof finalResult);
    console.log('Result exists:', !!finalResult);

    if (finalResult && !finalResult.error) {
      console.log('✅ RESULT CAPTURED SUCCESSFULLY!');
      console.log('Module:', finalResult.module);
      console.log('Function:', finalResult.function);
      console.log('Result type:', typeof finalResult.result);
      console.log('Status:', finalResult.status);

      // Display the actual results
      if (finalResult.result && finalResult.result.results) {
        const results = finalResult.result.results;

        if (results.posts && results.posts.sample) {
          console.log('\n🎉 SUCCESS! THE POSTS DATA:');
          console.log('Posts count:', results.posts.sample.length);
          console.log('First post title:', results.posts.sample[0]?.title);
          console.log('Posts sample:');
          results.posts.sample.slice(0, 2).forEach((post, index) => {
            console.log(`  ${index + 1}. [${post.id}] ${post.title}`);
          });
        }

        if (results.users && results.users.sample) {
          console.log('\n👥 Users data:');
          results.users.sample.slice(0, 2).forEach((user, index) => {
            console.log(`  ${index + 1}. [${user.id}] ${user.name} (${user.email})`);
          });
        }
      }

      console.log('\n✅ FETCHUTILS RESULT CAPTURE IS WORKING!');
      console.log('✅ All external API data successfully retrieved and captured!');
    } else {
      console.log('❌ FETCHUTILS EXECUTION FAILED');
      console.log('Error:', finalResult?.error);
      throw new Error('FetchUtils execution failed: ' + finalResult?.error);
    }

    // Dispose handle if needed
    if (doneHandle && typeof doneHandle.dispose === 'function') {
      doneHandle.dispose();
    }

    const endTime = Date.now();
    console.log(`⏱️ Total execution time: ${endTime - startTime}ms`);

    // Show arena logs for debugging
    console.log('\n📋 Arena Logs (last 5):');
    logs.slice(-5).forEach(log => console.log(`  ${log}`));

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    throw error;
  } finally {
    dispose();
    console.log('✨ Test completed & Arena disposed (Improved Arena Setup)');
  }
})();
