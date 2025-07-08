/* eslint-disable */
/* eslint-env node */
import path from 'path';
import { newQuickJSWASMModule, RELEASE_SYNC } from 'quickjs-emscripten';
import fs from 'fs';
const { promises: fsPromises } = fs;

async function testAsyncFSWorkerSimulation() {
    console.log('🚀 Testing QuickJS Promise with Async FS (KV Simulation)');

    // Initialize QuickJS
    const QuickJS = await newQuickJSWASMModule(RELEASE_SYNC);
    const vm = QuickJS.newContext();

    // Hoisted handles for final cleanup
    let consoleHandle;
    let logHandle;
    let requireHandle;
    let moduleHandle;
    let exportsHandle;
    let urlHandle;
    let kvGetHandle;
    let kvNamespaceHandle;
    let globalThisHandle;
    let pluginLogsHandle;

    try {
        // Set up console.log for debugging
        const logs = [];
        consoleHandle = vm.newObject();
        logHandle = vm.newFunction('log', (...args) => {
            const message = args.map(arg => vm.dump(arg)).join(' ');
            logs.push(message);
            console.log('[QuickJS]', message);
            return vm.undefined;
        });
        vm.setProp(consoleHandle, 'log', logHandle);
        vm.setProp(vm.global, 'console', consoleHandle);

        // Expose URL constructor for WorkerUtils
        urlHandle = vm.newFunction('URL', (urlStr, baseStr) => {
            const url = vm.dump(urlStr);
            const base = baseStr ? vm.dump(baseStr) : undefined;
            try {
                const urlObj = new URL(url, base);
                const result = vm.newObject();
                vm.setProp(result, 'pathname', vm.newString(urlObj.pathname));
                vm.setProp(result, 'search', vm.newString(urlObj.search));
                // Add searchParams as an object
                const paramsObj = vm.newObject();
                for (const [key, value] of urlObj.searchParams) {
                    vm.setProp(paramsObj, key, vm.newString(value));
                }
                vm.setProp(result, 'searchParams', paramsObj);
                return result;
            } catch (error) {
                console.log('[URL] Error parsing URL:', error.message);
                return vm.newObject();
            }
        });
        vm.setProp(vm.global, 'URL', urlHandle);

        // Set up CommonJS globals
        moduleHandle = vm.newObject();
        exportsHandle = vm.newObject();

        vm.setProp(moduleHandle, 'exports', exportsHandle);
        vm.setProp(vm.global, 'module', moduleHandle);
        vm.setProp(vm.global, 'exports', exportsHandle);

        // Mock require function
        requireHandle = vm.newFunction('require', (idHandle) => {
            const id = vm.dump(idHandle);
            logs.push(`[QuickJS] require called for: ${id}`);
            return vm.newObject();
        });
        vm.setProp(vm.global, 'require', requireHandle);

        // Store pending KV promises - THIS IS KEY FOR PROPER CLEANUP
        const pendingKVPromises = new Map();
        let kvPromiseId = 0;
        let isDisposing = false;

        // Create KV getter function using synchronous fs.readFileSync like test-execute-exposed
        kvGetHandle = vm.newFunction('get', (keyHandle) => {
            const key = vm.dump(keyHandle);
            logs.push(`[Runtime Plugin] KV get requested: ${key}`);

            // Create a QuickJS promise
            const promiseHandle = vm.newPromise();

            try {
                const chunkPath = path.resolve(process.cwd(), 'rsbuild-project/dist', key);
                const content = fs.readFileSync(chunkPath, 'utf8');
                console.log(`[Host] 📄 File read sync for ${key}: ${content.length} chars`);
                const strHandle = vm.newString(content);
                promiseHandle.resolve(strHandle);
                strHandle.dispose();
                console.log(`[Host] ✅ Promise resolved with chunk string for ${key}`);
            } catch (err) {
                console.log(`[Host] ❌ File read failed for ${key}:`, err.message);
                const emptyHandle = vm.newString('');
                promiseHandle.resolve(emptyHandle);
                emptyHandle.dispose();
                console.log(`[Host] ✅ Promise resolved (empty) for ${key}`);
            }

            return promiseHandle.handle;
        });

        // Set up KV namespace for runtime plugin
        kvNamespaceHandle = vm.newObject();
        vm.setProp(kvNamespaceHandle, 'get', kvGetHandle);

        globalThisHandle = vm.getProp(vm.global, 'globalThis');
        vm.setProp(globalThisHandle, '__CF_KV_NAMESPACE__', kvNamespaceHandle);

        // Set up plugin logs storage in global context
        pluginLogsHandle = vm.newArray();
        vm.setProp(globalThisHandle, '__PLUGIN_LOGS__', pluginLogsHandle);

        // Get the remote entry from file system
        const remoteEntryPath = path.resolve(process.cwd(), 'rsbuild-project/dist/remoteEntry.js');
        const remoteEntry = await fsPromises.readFile(remoteEntryPath, 'utf8');
        console.log(`📦 RemoteEntry loaded: ${remoteEntry.length} chars`);

        // Execute the remote entry
        const result = vm.evalCode(remoteEntry);

        // Process pending jobs after remote entry execution
        console.log('\n⚙️ Processing pending jobs after remote entry execution...');

        // Process pending jobs to handle promise resolutions
        let jobResult;
        let jobCount = 0;
        let totalJobs = 0;

        do {
            jobResult = vm.runtime.executePendingJobs();
            if (jobResult.error) {
                logs.push(`[Job Error] ${vm.dump(jobResult.error)}`);
                jobResult.error.dispose();
                break;
            }
            jobCount = jobResult.value;
            totalJobs += jobCount;
            if (totalJobs > 100) {
                logs.push('[Job Warning] Too many jobs, breaking');
                break;
            }
        } while (jobCount > 0);

        logs.push(`[Job Processing] Processed ${totalJobs} total jobs`);
        console.log(`⚙️ Processed ${totalJobs} total job cycles`);

        let output;
        if (result.error) {
            const errorDetails = vm.dump(result.error);
            output = {
                success: false,
                error: errorDetails,
                logs: logs,
                note: 'Error executing remote entry in QuickJS'
            };
            result.error.dispose();
        } else {
            // Test Module Federation with proper .get().then() pattern
            const inspectResult = vm.evalCode(`
                console.log('=== Module Federation Promise-Based Test ===');
                console.log('typeof __webpack_require__:', typeof __webpack_require__);
                console.log('module.exports keys:', Object.keys(module.exports));

                // Check if the remote entry exported anything
                if (module.exports && typeof module.exports === 'object') {
                    console.log('module.exports type:', typeof module.exports);
                    if (module.exports.get) {
                        console.log('module.exports.get available - Starting promise-based tests...');

                        // TEST 1: HelloWorld Module with Promise pattern
                        try {
                            console.log('\\n🧪 TEST 1: HelloWorld Module (Promise-based)');

                            // Use the proper Module Federation pattern: get().then()
                            const helloWorldPromise = module.exports.get('./HelloWorld');
                            console.log('HelloWorld promise created:', !!helloWorldPromise);
                            console.log('HelloWorld promise type:', typeof helloWorldPromise);

                            if (helloWorldPromise && typeof helloWorldPromise.then === 'function') {
                                // This will be resolved by the KV system
                                helloWorldPromise.then(function(factoryFunction) {
                                    console.log('🎉 HelloWorld promise resolved!');
                                    console.log('Factory function received:', typeof factoryFunction);

                                    if (typeof factoryFunction === 'function') {
                                        try {
                                            // Execute the factory function to get the actual module
                                            const helloWorldModule = factoryFunction();
                                            console.log('HelloWorld module from factory:', !!helloWorldModule);
                                            console.log('HelloWorld module keys:', Object.keys(helloWorldModule || {}));

                                            // Test the actual functions
                                            if (helloWorldModule && helloWorldModule.helloWorld) {
                                                const result1 = helloWorldModule.helloWorld({ name: 'AsyncFS Promise', message: 'Greetings from' });
                                                console.log('✅ helloWorld executed:', result1);

                                                // Assert expected result
                                                const expectedResult1 = 'Greetings from, AsyncFS Promise!';
                                                if (result1 === expectedResult1) {
                                                    console.log('✅ ASSERTION PASSED: helloWorld returned expected greeting');
                                                } else {
                                                    console.log('❌ ASSERTION FAILED: Expected "' + expectedResult1 + '" but got "' + result1 + '"');
                                                    throw new Error('async-fs helloWorld assertion failed: Expected "' + expectedResult1 + '" but got "' + result1 + '"');
                                                }
                                            }

                                            if (helloWorldModule && helloWorldModule.helloWorldFormatted) {
                                                const result2 = helloWorldModule.helloWorldFormatted({ name: 'Promise Pattern', message: 'Success with' });
                                                console.log('✅ helloWorldFormatted executed (length):', result2.length);
                                                console.log('✅ helloWorldFormatted preview:', result2.substring(0, 100) + '...');
                                            }

                                            if (helloWorldModule && helloWorldModule.helloWorldResponse) {
                                                const result3 = helloWorldModule.helloWorldResponse({ name: 'True Async', message: 'Powered by' });
                                                console.log('✅ helloWorldResponse executed:');
                                                console.log('  - text:', result3.text);
                                                console.log('  - html length:', result3.html.length);
                                                console.log('  - json keys:', Object.keys(result3.json));
                                            }

                                            if (helloWorldModule && helloWorldModule.default) {
                                                const defaultResult = helloWorldModule.default({ name: 'Default Promise', message: 'Hello from' });
                                                console.log('✅ Default export result:', defaultResult);
                                            }
                                        } catch (execError) {
                                            console.log('❌ Error executing HelloWorld factory:', execError.message);
                                        }
                                    } else {
                                        console.log('⚠️ Factory function not received, got:', factoryFunction);
                                    }
                                });
                            }
                        } catch (error) {
                            console.log('❌ Error with HelloWorld promise setup:', error.message);
                        }

                        // TEST 2: DataProcessor Module with Promise pattern
                        try {
                            console.log('\\n🧪 TEST 2: DataProcessor Module (Promise-based)');

                            const dataProcessorPromise = module.exports.get('./DataProcessor');
                            console.log('DataProcessor promise created:', !!dataProcessorPromise);

                            if (dataProcessorPromise && typeof dataProcessorPromise.then === 'function') {
                                dataProcessorPromise.then(function(factoryFunction) {
                                    console.log('🎉 DataProcessor promise resolved!');

                                    if (typeof factoryFunction === 'function') {
                                        try {
                                            const dataProcessorModule = factoryFunction();
                                            console.log('DataProcessor module keys:', Object.keys(dataProcessorModule || {}));

                                            if (dataProcessorModule && dataProcessorModule.generateSampleData) {
                                                const sampleData = dataProcessorModule.generateSampleData(8);
                                                console.log('✅ Generated', sampleData.length, 'data points');
                                                console.log('✅ First item:', JSON.stringify(sampleData[0]));

                                                if (dataProcessorModule.processData) {
                                                    const processed = dataProcessorModule.processData(sampleData, {
                                                        sortBy: 'value',
                                                        limit: 3,
                                                        filterCategory: 'A'
                                                    });
                                                    console.log('✅ Processed data count:', processed.stats.count);
                                                    console.log('✅ Processed data average:', processed.stats.average.toFixed(2));
                                                }

                                                if (dataProcessorModule.aggregateData) {
                                                    const aggregated = dataProcessorModule.aggregateData(sampleData, 'category');
                                                    console.log('✅ Aggregated categories:', Object.keys(aggregated).length);
                                                }
                                            }
                                        } catch (execError) {
                                            console.log('❌ Error executing DataProcessor factory:', execError.message);
                                        }
                                    }
                                });
                            }
                        } catch (error) {
                            console.log('❌ Error with DataProcessor promise setup:', error.message);
                        }

                        // TEST 3: WorkerUtils Module with Promise pattern
                        try {
                            console.log('\\n🧪 TEST 3: WorkerUtils Module (Promise-based)');

                            const workerUtilsPromise = module.exports.get('./WorkerUtils');
                            console.log('WorkerUtils promise created:', !!workerUtilsPromise);

                            if (workerUtilsPromise && typeof workerUtilsPromise.then === 'function') {
                                workerUtilsPromise.then(function(factoryFunction) {
                                    console.log('🎉 WorkerUtils promise resolved!');

                                    if (typeof factoryFunction === 'function') {
                                        try {
                                            const workerUtilsModule = factoryFunction();
                                            console.log('WorkerUtils module keys:', Object.keys(workerUtilsModule || {}));

                                            if (workerUtilsModule && workerUtilsModule.parseWorkerRequest) {
                                                const parsed = workerUtilsModule.parseWorkerRequest('https://api.example.com/v1/test?param=value');
                                                console.log('✅ URL parsed - pathname:', parsed.pathname);
                                                console.log('✅ URL parsed - params:', Object.keys(parsed.searchParams).length);
                                            }

                                            if (workerUtilsModule && workerUtilsModule.handleRequest) {
                                                const response = workerUtilsModule.handleRequest('GET', '/api/test');
                                                console.log('✅ Request handled - status:', response.status);
                                            }
                                        } catch (execError) {
                                            console.log('❌ Error executing WorkerUtils factory:', execError.message);
                                        }
                                    }
                                });
                            }
                        } catch (error) {
                            console.log('❌ Error with WorkerUtils promise setup:', error.message);
                        }

                        console.log('\\n🎉 All promise-based module tests initiated!');
                        console.log('📝 Note: Results will appear as promises resolve');
                    }
                }

                'promise-based testing initiated'
            `);

            if (inspectResult.error) {
                inspectResult.error.dispose();
            } else {
                inspectResult.value.dispose();
            }

            // -----------------------------------------------------------------
            // SIMPLE GREETING TEST – like arena example
            // -----------------------------------------------------------------
            const greetKick = vm.evalCode(`
                module.exports.get('./HelloWorld')
                  .then(factory => {
                    console.log('🎉 HelloWorld factory received:', typeof factory);
                    if(typeof factory === 'function') {
                      const mod = factory();
                      console.log('🎉 HelloWorld module:', typeof mod);
                      if(mod && typeof mod.helloWorld === 'function') {
                        const result = mod.helloWorld({ name:'AsyncFS', message:'Hello from' });
                        console.log('🎉 Greeting from HelloWorld:', result);
                      } else {
                        console.log('HelloWorld module missing helloWorld export');
                      }
                    } else {
                      console.log('Expected function factory, got:', typeof factory);
                    }
                  });
            `);
            if (greetKick.error) greetKick.error.dispose(); else greetKick.value.dispose();

            // Process jobs to handle the async greeting test
            console.log('\n⚙️ Processing jobs for greeting test...');
            let greetJobs = 0;
            let greetIterations = 0;
            const maxIterations = 20;
            while (greetIterations < maxIterations && vm.alive) {
                const jobs = vm.runtime.executePendingJobs();
                if (jobs.error) {
                    console.log(`❌ Job processing error: ${vm.dump(jobs.error)}`);
                    jobs.error.dispose();
                    break;
                }
                greetJobs += jobs.value;
                greetIterations++;

                if (jobs.value === 0) {
                    console.log('✅ No more jobs to process, greeting test completed!');
                    break;
                }
            }
            if (greetIterations >= maxIterations) {
                console.log('⚠️ Reached maximum iterations, terminating job processing');
            }
            console.log(`⚙️ Processed ${greetJobs} jobs in ${greetIterations} iterations for greeting`);

            output = {
                success: true,
                logs: logs,
                note: 'Remote entry executed successfully with async FS KV simulation'
            };
            result.value.dispose();
        }

        console.log('\n📊 Execution Result:');
        console.log(`✅ Success: ${output.success}`);
        if (output.error) {
            console.log(`❌ Error: ${output.error}`);
        }
        console.log(`📝 Note: ${output.note}`);

        console.log('\n📋 KV Promise Status:');
        pendingKVPromises.forEach((promise, id) => {
            console.log(`  KV Promise ${id} (${promise.key}): ${promise.resolved ? '✅ Resolved' : '❌ Pending'}`);
        });

        // Mark as disposing to prevent further promise resolutions
        isDisposing = true;

        // Dispose of all promise handles
        console.log('\n🧹 Cleaning up KV promises...');
        pendingKVPromises.forEach((promiseInfo, id) => {
            if (promiseInfo.promise && promiseInfo.promise.alive) {
                try {
                    promiseInfo.promise.dispose();
                } catch (e) {
                    console.log(`⚠️ Error disposing promise ${id}:`, e.message);
                }
            }
        });
        pendingKVPromises.clear();

        // Clean up all handles in correct order
        pluginLogsHandle.dispose();
        globalThisHandle.dispose();
        kvNamespaceHandle.dispose();
        kvGetHandle.dispose();
        requireHandle.dispose();
        moduleHandle.dispose();
        exportsHandle.dispose();
        logHandle.dispose();
        consoleHandle.dispose();
        if (urlHandle) urlHandle.dispose();

        console.log('\n🎯 All logs from QuickJS:');
        logs.forEach(log => console.log(`  [VM] ${log}`));

        // Check if any assertions passed - if not, fail the test
        const assertionPassed = logs.some(log => log.includes('✅ ASSERTION PASSED'));
        if (!assertionPassed) {
            console.log('❌ TEST FAILED: No assertions passed - module functions were not executed properly');
            throw new Error('async-fs test failed: No module functions executed successfully');
        }

        // ensure all promise jobs complete so greeting logs
        vm.runtime.executePendingJobs();

    } finally {
        console.log('\n🧹 Disposing VM...');
        vm.dispose();
        console.log('✨ Test completed, VM disposed successfully');
    }
}

// Run the test
testAsyncFSWorkerSimulation();
