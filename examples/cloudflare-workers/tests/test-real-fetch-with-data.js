/* eslint-disable */
/* eslint-env node */
// Test: Real fetch operations with FULL POST DATA using FetchUtils module via Module Federation

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
  console.log('🌐 Testing Real Fetch Operations with FULL POST DATA (Improved Arena Setup)');
  const overallStartTime = Date.now();

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
    const setupStartTime = Date.now();

    // Load the remote entry
    const remoteEntryPath = path.resolve(__dirname, '../rsbuild-project/dist/remoteEntry.js');
    const remoteEntry = fs.readFileSync(remoteEntryPath, 'utf8');

    console.log(`📦 Remote entry loaded: ${remoteEntry.length} chars`);
    console.log('✅ Arena set up with improved fetch implementation');

    // Execute remote entry and set up the test completion promise
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

    const setupEndTime = Date.now();
    const setupTime = setupEndTime - setupStartTime;
    console.log(`⏱️ Setup time: ${setupTime}ms`);
    console.log('✅ Remote entry executed and test promise set up');

    const testExecutionStartTime = Date.now();

    // Test FetchUtils module with real external API calls and CAPTURE FULL DATA
    arena.evalCode(`
      const executeFetchTests = async () => {
        let testResults = {};
        let testErrors = {};

        // Track timing for VM operations vs network operations
        let vmTime = 0;
        let networkTime = 0;
        const timingStart = Date.now();

        try {
          console.log('🧪 Testing FetchUtils Module with FULL POST DATA CAPTURE');

          const moduleLoadStart = Date.now();
          const fetchUtilsFactory = await module.exports.get('./FetchUtils');
          const moduleLoadEnd = Date.now();
          vmTime += (moduleLoadEnd - moduleLoadStart);

          console.log('FetchUtils factory type:', typeof fetchUtilsFactory);

          if (typeof fetchUtilsFactory === 'function') {
            const moduleInstantiateStart = Date.now();
            const fetchUtilsModule = fetchUtilsFactory();
            const moduleInstantiateEnd = Date.now();
            vmTime += (moduleInstantiateEnd - moduleInstantiateStart);

            console.log('FetchUtils module keys:', Object.keys(fetchUtilsModule || {}));

            // Test 1: Fetch posts from JSONPlaceholder WITH FULL DATA
            if (fetchUtilsModule && fetchUtilsModule.fetchPlaceholderPosts) {
              try {
                console.log('\\n🌐 Test 1: Fetching 3 posts from JSONPlaceholder WITH FULL DATA...');

                const fetchStart = Date.now();
                const postsResult = await fetchUtilsModule.fetchPlaceholderPosts(3);
                const fetchEnd = Date.now();
                networkTime += (fetchEnd - fetchStart);

                const processStart = Date.now();
                console.log('✅ Posts fetched successfully!');
                console.log('  - Status:', postsResult.status);
                console.log('  - Duration:', postsResult.duration + 'ms');
                console.log('  - Posts count:', postsResult.data.length);

                // LOG EVERY POST TITLE AND BODY
                postsResult.data.forEach((post, index) => {
                  console.log(\`  - Post \${index + 1} (ID: \${post.id}): \${post.title}\`);
                  console.log(\`    Body: \${post.body.substring(0, 100)}...\`);
                });

                // STORE FULL POST DATA - NOT JUST SUMMARY
                testResults.posts = {
                  success: true,
                  count: postsResult.data.length,
                  duration: postsResult.duration,
                  status: postsResult.status,
                  fullData: postsResult.data, // STORE THE ACTUAL POSTS!
                  metadata: {
                    timestamp: postsResult.timestamp,
                    url: postsResult.url
                  }
                };

                console.log('\\n📋 FULL POST DATA STORED:');
                console.log('  - Total posts:', postsResult.data.length);
                console.log('  - First post full title:', postsResult.data[0]?.title);
                console.log('  - Second post full title:', postsResult.data[1]?.title);
                console.log('  - Third post full title:', postsResult.data[2]?.title);

                const processEnd = Date.now();
                vmTime += (processEnd - processStart);

              } catch (error) {
                console.log('❌ Posts fetch error:', error.message);
                testErrors.posts = error.message;
              }
            }

            // Test 2: Demonstrate the comprehensive fetch capabilities
            if (fetchUtilsModule && fetchUtilsModule.demonstrateFetchCapabilities) {
              try {
                console.log('\\n🌐 Test 2: Running comprehensive fetch demo...');

                const demoFetchStart = Date.now();
                const demoResult = await fetchUtilsModule.demonstrateFetchCapabilities();
                const demoFetchEnd = Date.now();
                networkTime += (demoFetchEnd - demoFetchStart);

                const demoProcessStart = Date.now();
                console.log('✅ Comprehensive demo completed!');

                // STORE THE COMPLETE DEMO RESULT WITH ALL DATA
                testResults.comprehensiveDemo = demoResult;

                console.log('\\n📋 COMPREHENSIVE DEMO RESULTS:');
                console.log('  - Success:', demoResult.success);
                console.log('  - Total duration:', demoResult.totalDuration + 'ms');
                if (demoResult.results) {
                  console.log('  - Posts sample:', JSON.stringify(demoResult.results.posts?.sample, null, 2));
                  console.log('  - Users sample:', JSON.stringify(demoResult.results.users?.sample, null, 2));
                  console.log('  - New post created:', demoResult.results.newPost?.title);
                }

                const demoProcessEnd = Date.now();
                vmTime += (demoProcessEnd - demoProcessStart);

              } catch (error) {
                console.log('❌ Comprehensive demo error:', error.message);
                testErrors.comprehensiveDemo = error.message;
              }
            }

            console.log('\\n🎉 ALL FetchUtils tests completed with FULL DATA!');

          } else {
            throw new Error('FetchUtils factory not found or not a function');
          }

        } catch (error) {
          console.log('❌ FetchUtils test execution error:', error.message);
          testErrors.execution = error.message;
        } finally {
          const timingEnd = Date.now();
          const totalTestTime = timingEnd - timingStart;

          // Log timing breakdown
          console.log('\\n⏱️ TIMING BREAKDOWN:');
          console.log('  - Total test time: ' + totalTestTime + 'ms');
          console.log('  - Network time (API calls): ' + networkTime + 'ms');
          console.log('  - VM processing time: ' + vmTime + 'ms');
          console.log('  - Other overhead: ' + (totalTestTime - networkTime - vmTime) + 'ms');
          console.log('  - Network % of total: ' + Math.round((networkTime / totalTestTime) * 100) + '%');
          console.log('  - VM % of total: ' + Math.round((vmTime / totalTestTime) * 100) + '%');

          // Update globals for compatibility
          globalThis.__fetchResults = testResults;
          globalThis.__fetchErrors = testErrors;

          // Add timing info to results
          testResults.timing = {
            totalTestTime,
            networkTime,
            vmTime,
            otherOverhead: totalTestTime - networkTime - vmTime,
            networkPercentage: Math.round((networkTime / totalTestTime) * 100),
            vmPercentage: Math.round((vmTime / totalTestTime) * 100)
          };

          // Resolve the test completion promise with results
          globalThis.__testFinishedDeferred.resolve({
            results: testResults,
            errors: testErrors
          });
        }
      };

      executeFetchTests();
    `);

    console.log('Fetch tests initiated, waiting for completion using promise-based approach...');

    // Get the promise handle and convert it to a native promise
    const doneHandle = arena.evalCode('globalThis.__testFinished');
    console.log('Done handle type:', typeof doneHandle, 'has dispose:', typeof doneHandle?.dispose);

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

    // Get the final results
    const testResults = await donePromise;
    console.log('Test results type:', typeof testResults);
    console.log('Test results:', testResults);

    let fetchResults, fetchErrors;

    if (testResults && typeof testResults === 'object') {
      fetchResults = testResults.results;
      fetchErrors = testResults.errors;
    } else {
      // Fallback to reading from globals
      console.log('Using fallback to read results from globals...');
      fetchResults = arena.evalCode('globalThis.__fetchResults');
      fetchErrors = arena.evalCode('globalThis.__fetchErrors');
    }

    // One last sweep to finish any stray jobs
    let finalJobs = 0;
    while (vm.runtime.executePendingJobs().value > 0) {
      finalJobs++;
      if (finalJobs > 10) break; // safety limit
    }

    // Only dispose if it's a QuickJS handle
    if (doneHandle && typeof doneHandle.dispose === 'function') {
      doneHandle.dispose();
    }

    console.log('\n=== FETCH TEST RESULTS WITH FULL DATA (Improved Arena Setup) ===');
    console.log('Results keys:', Object.keys(fetchResults || {}));
    console.log('Errors:', fetchErrors);

    // DISPLAY THE ACTUAL POST DATA
    if (fetchResults?.posts?.fullData) {
      console.log('\n🎯 THE 3 POSTS YOU REQUESTED:');
      fetchResults.posts.fullData.forEach((post, index) => {
        console.log(`\n📄 POST ${index + 1}:`);
        console.log(`   ID: ${post.id}`);
        console.log(`   Title: ${post.title}`);
        console.log(`   Body: ${post.body}`);
        console.log(`   User ID: ${post.userId}`);
      });
    }

    // DISPLAY COMPREHENSIVE DEMO RESULTS
    if (fetchResults?.comprehensiveDemo) {
      console.log('\n🎯 COMPREHENSIVE DEMO RESULTS:');
      const demo = fetchResults.comprehensiveDemo;
      console.log('Success:', demo.success);
      console.log('Total Duration:', demo.totalDuration + 'ms');

      if (demo.results?.posts?.sample) {
        console.log('\n📄 Posts Sample from Demo:');
        demo.results.posts.sample.forEach((post, index) => {
          console.log(`   ${index + 1}. ID: ${post.id}, Title: ${post.title}`);
        });
      }

      if (demo.results?.users?.sample) {
        console.log('\n👥 Users Sample from Demo:');
        demo.results.users.sample.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
        });
      }
    }

    // Count successful tests
    const successCount = fetchResults ? Object.keys(fetchResults).length : 0;
    const errorCount = fetchErrors ? Object.keys(fetchErrors).length : 0;

    console.log(`📊 Summary: ${successCount} successful, ${errorCount} errors`);
    console.log(`🔧 Final jobs processed: ${finalJobs}`);

    const testExecutionEndTime = Date.now();
    const testExecutionTime = testExecutionEndTime - testExecutionStartTime;
    const overallEndTime = Date.now();
    const overallTime = overallEndTime - overallStartTime;

    console.log(`\n⏱️ HOST TIMING BREAKDOWN:`);
    console.log(`  - Overall time (including setup): ${overallTime}ms`);
    console.log(`  - Setup time: ${setupTime}ms`);
    console.log(`  - Test execution time: ${testExecutionTime}ms`);
    console.log(`  - VM event loop processing: ${testExecutionTime - (fetchResults?.timing?.totalTestTime || 0)}ms`);

    if (fetchResults?.timing) {
      console.log(`\n⏱️ GUEST (QuickJS) TIMING BREAKDOWN:`);
      console.log(`  - Total guest execution: ${fetchResults.timing.totalTestTime}ms`);
      console.log(`  - Network/API calls: ${fetchResults.timing.networkTime}ms (${fetchResults.timing.networkPercentage}%)`);
      console.log(`  - VM processing: ${fetchResults.timing.vmTime}ms (${fetchResults.timing.vmPercentage}%)`);
      console.log(`  - Other overhead: ${fetchResults.timing.otherOverhead}ms`);

      console.log(`\n⏱️ EFFICIENCY ANALYSIS:`);
      console.log(`  - Pure VM overhead (host + guest): ${setupTime + (testExecutionTime - fetchResults.timing.totalTestTime) + fetchResults.timing.vmTime}ms`);
      console.log(`  - Network time: ${fetchResults.timing.networkTime}ms`);
      console.log(`  - VM efficiency: ${Math.round(((fetchResults.timing.networkTime) / overallTime) * 100)}% of time spent on actual work (network)`);
    }

    // Show arena logs for debugging
    console.log('\n📋 Arena Logs (last 5):');
    logs.slice(-5).forEach(log => console.log(`  ${log}`));

    // Determine overall success
    const success = successCount > 0 && successCount > errorCount;

    if (success) {
      console.log('✅ FETCH TESTS PASSED: External API calls working via Module Federation WITH FULL DATA (Improved Arena Setup)');
    } else {
      console.log('❌ FETCH TESTS FAILED: Issues with external API calls');
      throw new Error(`Fetch tests failed: ${successCount} successful, ${errorCount} errors`);
    }

  } catch (error) {
    console.error('💥 Fetch test failed:', error.message);
    throw error;
  } finally {
    dispose();
    console.log('✨ Real fetch test completed & Arena disposed (Improved Arena Setup)');
  }
})();
