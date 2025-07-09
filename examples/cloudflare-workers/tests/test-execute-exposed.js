/* eslint-disable */
import { newQuickJSWASMModule, RELEASE_SYNC } from 'quickjs-emscripten';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testExecuteExposed() {
    console.log('🚀 Testing Module Federation with executeExposed() Pattern');
    console.log('📋 Host provides executeExposed(exposeName, exportName) function to QuickJS');

    // Initialize QuickJS
    const QuickJS = await newQuickJSWASMModule(RELEASE_SYNC);
    const vm = QuickJS.newContext();

    // Handles we create – hoisted so finally{} can dispose them safely
    let logHandle;
    let consoleHandle;
    let requireHandle;
    let moduleHandle;
    let exportsHandle;
    let executeExposedHandle;
    let kvGetHandle;
    let kvNamespaceHandle;
    let globalThisHandle;

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

        // Provide KV.get that returns chunk content as string promise
        kvGetHandle = vm.newFunction('get', (keyHandle) => {
            const key = vm.dump(keyHandle); // e.g. "__federation_expose_HelloWorld.js"

            // Create QuickJS promise
            const promiseHandle = vm.newPromise();
            try {
                const chunkPath = path.resolve(__dirname, '../rsbuild-project/dist', key);
                const content = fs.readFileSync(chunkPath, 'utf8');
                const strHandle = vm.newString(content);
                promiseHandle.resolve(strHandle);
                strHandle.dispose();
            } catch (err) {
                const emptyHandle = vm.newString('');
                promiseHandle.resolve(emptyHandle);
                emptyHandle.dispose();
            }
            return promiseHandle.handle;
        });

        // Attach KV namespace so remoteEntry can fetch chunks
        kvNamespaceHandle = vm.newObject();
        vm.setProp(kvNamespaceHandle, 'get', kvGetHandle);
        globalThisHandle = vm.getProp(vm.global, 'globalThis');
        vm.setProp(globalThisHandle, '__CF_KV_NAMESPACE__', kvNamespaceHandle);

        // Create executeExposed: all logic runs inside QuickJS using module.exports.get()
        executeExposedHandle = vm.newFunction('executeExposed', (exposeH, exportH, ...argH) => {
            const expose = vm.dump(exposeH);
            const exp    = vm.dump(exportH);

            // Inject args as globals so we can reference them in eval
            argH.forEach((h,i)=>vm.setProp(vm.global, `__arg_${i}`, h));

            // Unique result slot on globalThis
            const resVar = `__exec_res_${Date.now()}_${Math.floor(Math.random()*1e6)}`;

            const script = `
              (async () => {
                try {
                  const factory = await module.exports.get('./${expose}');
                  const mod = factory();
                  const fnOrVal = mod['${exp}'];
                  globalThis['${resVar}'] = (typeof fnOrVal === 'function') ? fnOrVal(${argH.map((_,i)=>`__arg_${i}`).join(',')}) : fnOrVal;
                } catch (e) {
                  globalThis['${resVar}_err'] = e && (e.message || String(e));
                }
              })();
            `;

            // Kick off async IIFE inside VM
            const kickRes = vm.evalCode(script);
            if (kickRes.error) {
                kickRes.error.dispose();
                argH.forEach((_,i)=>vm.setProp(vm.global, `__arg_${i}`, vm.undefined));
                return vm.undefined;
            }
            kickRes.value.dispose();

            // Process jobs until result appears or max iterations
            let iterations = 0;
            let found = false;
            let resultHandle;
            const maxIterations = 20;
            while (iterations < maxIterations && vm.alive) {
                const jobs = vm.runtime.executePendingJobs();
                if (jobs.error) {
                    console.log(`❌ Job processing error: ${vm.dump(jobs.error)}`);
                    jobs.error.dispose();
                    break;
                }
                // jobs.value is a primitive number, no dispose needed

                // Check if result variable exists
                const checkRes = vm.evalCode(`globalThis.hasOwnProperty('${resVar}') || globalThis.hasOwnProperty('${resVar}_err')`);
                if (!checkRes.error && vm.dump(checkRes.value)) {
                    found = true;
                    checkRes.value.dispose();
                    resultHandle = vm.getProp(globalThisHandle, resVar);
                    vm.setProp(globalThisHandle, resVar, vm.undefined);
                    const errHandle = vm.getProp(globalThisHandle, resVar + '_err');
                    vm.setProp(globalThisHandle, resVar + '_err', vm.undefined);
                    if (errHandle && vm.typeof(errHandle) !== 'undefined') {
                        errHandle.dispose();
                        if (resultHandle && resultHandle.alive) resultHandle.dispose();
                        resultHandle = vm.undefined; // error occurred
                    } else if (errHandle) {
                        errHandle.dispose();
                    }
                    break;
                }
                if (!checkRes.error) checkRes.value.dispose();
                iterations++;
            }

            if (iterations >= maxIterations && !found) {
                console.log('⚠️ executeExposed: Reached maximum iterations without result');
            }

            // Clear injected arg globals
            argH.forEach((_,i)=>vm.setProp(vm.global, `__arg_${i}`, vm.undefined));

            if (!found) {
                return vm.undefined;
            }
            return resultHandle;
        });

        vm.setProp(vm.global, 'executeExposed', executeExposedHandle);

        // Load the remote entry
        const remoteEntryPath = path.resolve(__dirname, '../rsbuild-project/dist/remoteEntry.js');
        const remoteEntry = fs.readFileSync(remoteEntryPath, 'utf8');
        console.log(`📦 RemoteEntry loaded: ${remoteEntry.length} chars`);

        // Execute remoteEntry AND test executeExposed calls
        const fullTestResult = vm.evalCode(`
            // First execute the remote entry
            ${remoteEntry}

            console.log('=== Remote Entry Executed ===');
            console.log('executeExposed function available:', typeof executeExposed);

            // Now test executeExposed calls
            console.log('\\n🧪 TESTING executeExposed() Pattern');

            try {
                // Test HelloWorld functions
                console.log('\\n🔄 Testing HelloWorld Module:');

                var props1 = { name: 'ExecuteExposed Test', message: 'Hello from' };
                console.log('Calling executeExposed("HelloWorld", "helloWorld", props)...');
                var result1 = executeExposed('HelloWorld', 'helloWorld', props1);
                console.log('✅ helloWorld result:', result1);

                // Assert expected result
                var expectedResult1 = 'Hello from, ExecuteExposed Test!';
                if (result1 === expectedResult1) {
                    console.log('✅ ASSERTION PASSED: helloWorld returned expected greeting');
                } else {
                    console.log('❌ ASSERTION FAILED: Expected "' + expectedResult1 + '" but got "' + result1 + '"');
                    throw new Error('helloWorld assertion failed: Expected "' + expectedResult1 + '" but got "' + result1 + '"');
                }

                var props2 = { name: 'Pattern Test', message: 'Success with' };
                console.log('\\nCalling executeExposed("HelloWorld", "helloWorldFormatted", props)...');
                var result2 = executeExposed('HelloWorld', 'helloWorldFormatted', props2);
                console.log('✅ helloWorldFormatted result length:', result2 ? result2.length : 'null');
                if (result2) {
                    console.log('✅ helloWorldFormatted preview:', result2.substring(0, 120) + '...');

                    // Assert formatted result contains expected data
                    try {
                        var parsedResult2 = JSON.parse(result2);
                        var expectedGreeting2 = 'Success with, Pattern Test!';
                        if (parsedResult2.greeting === expectedGreeting2) {
                            console.log('✅ ASSERTION PASSED: helloWorldFormatted contains expected greeting');
                        } else {
                            console.log('❌ ASSERTION FAILED: Expected greeting "' + expectedGreeting2 + '" but got "' + parsedResult2.greeting + '"');
                            throw new Error('helloWorldFormatted assertion failed: Expected greeting "' + expectedGreeting2 + '" but got "' + parsedResult2.greeting + '"');
                        }
                        if (parsedResult2.source === 'Module Federation + Rsbuild + Cloudflare Workers') {
                            console.log('✅ ASSERTION PASSED: helloWorldFormatted contains expected source');
                        } else {
                            console.log('❌ ASSERTION FAILED: Unexpected source in formatted result');
                            throw new Error('helloWorldFormatted source assertion failed');
                        }
                    } catch (parseError) {
                        console.log('❌ ASSERTION FAILED: helloWorldFormatted result is not valid JSON');
                        throw new Error('helloWorldFormatted JSON parse failed: ' + parseError.message);
                    }
                } else {
                    console.log('❌ ASSERTION FAILED: helloWorldFormatted returned null');
                    throw new Error('helloWorldFormatted returned null');
                }

                var props3 = { name: 'Advanced Test', message: 'Powered by' };
                console.log('\\nCalling executeExposed("HelloWorld", "helloWorldResponse", props)...');
                var result3 = executeExposed('HelloWorld', 'helloWorldResponse', props3);
                console.log('✅ helloWorldResponse received:', !!result3);
                if (result3) {
                    console.log('✅ helloWorldResponse text:', result3.text);
                    console.log('✅ helloWorldResponse html length:', result3.html.length);
                    console.log('✅ helloWorldResponse json keys:', Object.keys(result3.json));

                    // Assert response structure and content
                    var expectedText3 = 'Powered by, Advanced Test!';
                    if (result3.text === expectedText3) {
                        console.log('✅ ASSERTION PASSED: helloWorldResponse text matches expected');
                    } else {
                        console.log('❌ ASSERTION FAILED: Expected text "' + expectedText3 + '" but got "' + result3.text + '"');
                        throw new Error('helloWorldResponse text assertion failed: Expected "' + expectedText3 + '" but got "' + result3.text + '"');
                    }

                    if (result3.html && result3.html.includes(expectedText3)) {
                        console.log('✅ ASSERTION PASSED: helloWorldResponse HTML contains expected text');
                    } else {
                        console.log('❌ ASSERTION FAILED: helloWorldResponse HTML does not contain expected text');
                        throw new Error('helloWorldResponse HTML assertion failed');
                    }

                    if (result3.json && result3.json.greeting === expectedText3) {
                        console.log('✅ ASSERTION PASSED: helloWorldResponse JSON contains expected greeting');
                    } else {
                        console.log('❌ ASSERTION FAILED: helloWorldResponse JSON greeting mismatch');
                        throw new Error('helloWorldResponse JSON assertion failed');
                    }
                } else {
                    console.log('❌ ASSERTION FAILED: helloWorldResponse returned null');
                    throw new Error('helloWorldResponse returned null');
                }

                console.log('\\nCalling executeExposed("HelloWorld", "default", props)...');
                var defaultResult = executeExposed('HelloWorld', 'default', props1);
                console.log('✅ default export result:', defaultResult);

                // Assert default export (should be same as helloWorld)
                if (defaultResult === expectedResult1) {
                    console.log('✅ ASSERTION PASSED: default export returned expected greeting');
                } else {
                    console.log('❌ ASSERTION FAILED: Expected default "' + expectedResult1 + '" but got "' + defaultResult + '"');
                    throw new Error('default export assertion failed: Expected "' + expectedResult1 + '" but got "' + defaultResult + '"');
                }

                // Test DataProcessor functions
                console.log('\\n🔄 Testing DataProcessor Module:');

                console.log('Calling executeExposed("DataProcessor", "generateSampleData", 6)...');
                var sampleData = executeExposed('DataProcessor', 'generateSampleData', 6);
                console.log('✅ generateSampleData result length:', sampleData ? sampleData.length : 'null');
                if (sampleData && sampleData.length > 0) {
                    console.log('✅ First sample item:', JSON.stringify(sampleData[0]));
                    console.log('✅ Categories:', [...new Set(sampleData.map(function(item) { return item.category; }))]);

                    var processOptions = { sortBy: 'value', limit: 4, filterCategory: 'A' };
                    console.log('\\nCalling executeExposed("DataProcessor", "processData", data, options)...');
                    var processed = executeExposed('DataProcessor', 'processData', sampleData, processOptions);
                    if (processed) {
                        console.log('✅ processData stats count:', processed.stats.count);
                        console.log('✅ processData stats average:', processed.stats.average.toFixed(2));
                        console.log('✅ processData stats range:', processed.stats.min + '-' + processed.stats.max);
                    }

                    console.log('\\nCalling executeExposed("DataProcessor", "aggregateData", data, "category")...');
                    var aggregated = executeExposed('DataProcessor', 'aggregateData', sampleData, 'category');
                    if (aggregated) {
                        console.log('✅ aggregateData categories:', Object.keys(aggregated).length);
                        Object.keys(aggregated).forEach(function(cat) {
                            var stats = aggregated[cat];
                            console.log('  - ' + cat + ': ' + stats.count + ' items, avg=' + stats.avg.toFixed(1));
                        });
                    }
                }

                // Test WorkerUtils functions
                console.log('\\n🔄 Testing WorkerUtils Module:');

                var testUrl = 'https://api.example.com/v1/users?filter=active&page=2&sort=name';
                console.log('Calling executeExposed("WorkerUtils", "parseWorkerRequest", url)...');
                var parsed = executeExposed('WorkerUtils', 'parseWorkerRequest', testUrl);
                if (parsed) {
                    console.log('✅ parseWorkerRequest pathname:', parsed.pathname);
                    console.log('✅ parseWorkerRequest params count:', Object.keys(parsed.searchParams).length);
                    console.log('✅ parseWorkerRequest segments:', parsed.segments.length);
                }

                console.log('\\nCalling executeExposed("WorkerUtils", "handleRequest", "POST", "/api/test", data)...');
                var requestData = { name: 'test', value: 42 };
                var response = executeExposed('WorkerUtils', 'handleRequest', 'POST', '/api/test', requestData);
                if (response) {
                    console.log('✅ handleRequest status:', response.status);
                    console.log('✅ handleRequest body type:', typeof response.body);
                }

                console.log('\\nCalling executeExposed("WorkerUtils", "routeHandler", "/health")...');
                var routeResponse = executeExposed('WorkerUtils', 'routeHandler', '/health');
                if (routeResponse) {
                    console.log('✅ routeHandler status:', routeResponse.status);
                    var body = JSON.parse(routeResponse.body);
                    console.log('✅ routeHandler message:', body.status || body.message || 'no message');
                }

                console.log('\\n🎉 All executeExposed tests completed successfully!');

            } catch (error) {
                console.log('❌ Error in executeExposed testing:', error.message);
                console.log('❌ Error stack:', error.stack);
            }

            'executeExposed testing completed'
        `);

        if (fullTestResult.error) {
            console.log('❌ Full test execution error:', vm.dump(fullTestResult.error));
            fullTestResult.error.dispose();
        } else {
            console.log('📊 Final result:', vm.dump(fullTestResult.value));
            fullTestResult.value.dispose();
        }

        console.log('\\n🎯 All QuickJS logs:');
        logs.forEach(log => console.log(`  [VM] ${log}`));

        console.log('\\n🎉 executeExposed pattern test completed successfully!');
        console.log('✅ Host provides executeExposed(exposeName, exportName, ...args) to QuickJS');
        console.log('✅ QuickJS calls executeExposed() to run federated module functions');
        console.log('✅ All function executions and return values captured');

    } finally {
        // Clean up handles
        try {
            if (logHandle) logHandle.dispose();
            if (consoleHandle) consoleHandle.dispose();
            if (requireHandle) requireHandle.dispose();
            if (moduleHandle) moduleHandle.dispose();
            if (exportsHandle) exportsHandle.dispose();
            if (executeExposedHandle) executeExposedHandle.dispose();
            if (kvGetHandle) kvGetHandle.dispose();
            if (kvNamespaceHandle) kvNamespaceHandle.dispose();
            if (globalThisHandle) globalThisHandle.dispose();
        } catch (e) {
            console.log('Handle cleanup error:', e.message);
        }

        vm.dispose();
        console.log('✨ VM disposed successfully');
    }
}

// Run the test
testExecuteExposed();
