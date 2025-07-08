/**
 * Test Routes Handler - Handles Module Federation test routes
 * Updated to use LEPUS directly without Arena or QuickJS
 */

import { createJsonResponse } from './utils/responseUtils.js';
import { getKvAsset } from './utils/kvUtils.js';
import { MODULE_FEDERATION } from './utils/constants.js';

/**
 * Execute code in LEPUS context
 */
async function executeLEPUSCode(lepusContext, code) {
    const { ffi, context } = lepusContext;
    
    // Convert code to heap string
    const codePtr = ffi.module.stringToNewUTF8(code);
    
    try {
        // Direct LEPUS evaluation
        const resultPtr = ffi.LEPUS_Eval(
            context,
            codePtr,
            code.length,
            'test-route.js',
            0, // detectModule
            0  // evalFlags
        );
        
        // Check for exceptions
        const exceptionPtr = ffi.LEPUS_ResolveException(context, resultPtr);
        if (exceptionPtr !== resultPtr) {
            const errorStr = ffi.module.UTF8ToString(
                ffi.LEPUS_GetString(context, exceptionPtr)
            );
            ffi.LEPUS_FreeValue(context, exceptionPtr);
            throw new Error(errorStr);
        }
        
        // Convert result to JavaScript value
        const resultStr = ffi.module.UTF8ToString(
            ffi.LEPUS_Dump(context, resultPtr)
        );
        
        // Cleanup handled by GC
        return JSON.parse(resultStr);
    } finally {
        // Free the code string
        ffi.module._free(codePtr);
    }
}

/**
 * Handle LEPUS Test Route - Simple Module Federation test with HelloWorld
 */
export async function handleLepusTestRoute(context) {
    const { env, LEPUS } = context;

    try {
        // Get the remote entry from KV
        const remoteEntry = await getKvAsset(env, MODULE_FEDERATION.REMOTE_ENTRY);
        if (!remoteEntry) {
            return createJsonResponse({
                error: 'Module Federation assets not found',
                test: 'lepus-test',
                status: 'failed'
            }, 404);
        }

        // Execute remote entry in LEPUS
        await executeLEPUSCode(LEPUS, remoteEntry);

        const testCode = `
            (async () => {
                try {
                    console.log('LEPUS test starting...');

                    // Check if init is needed
                    if (typeof module.exports.init === 'function') {
                        console.log('Calling module.exports.init()...');
                        module.exports.init();
                    }

                    console.log('Getting HelloWorld module...');
                    const factory = await module.exports.get('./HelloWorld');
                    console.log('Factory received, executing...');
                    const moduleExports = factory();
                    console.log('Module executed, keys:', Object.keys(moduleExports || {}));

                    const result = moduleExports.helloWorld({ name: 'LEPUS Test', message: 'Simple test' });
                    console.log('LEPUS test result:', result);
                    globalThis.__testResult = {
                        success: true,
                        module: 'HelloWorld',
                        function: 'helloWorld',
                        result: result,
                        test: 'lepus-test'
                    };
                } catch (error) {
                    console.log('LEPUS test error:', error.message);
                    globalThis.__testResult = {
                        success: false,
                        error: error.message,
                        test: 'lepus-test'
                    };
                }
            })();
        `;

        await executeLEPUSCode(LEPUS, testCode);
        const result = await executeLEPUSCode(LEPUS, 'globalThis.__testResult');

        return createJsonResponse({
            test: 'lepus-test',
            description: 'Simple Module Federation test with HelloWorld module using LEPUS',
            ...result
        });

    } catch (error) {
        return createJsonResponse({
            test: 'lepus-test',
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * Handle Test Module Route - Comprehensive Module Federation test
 */
export async function handleTestModuleRoute(context) {
    const { env, LEPUS } = context;

    try {
        const remoteEntry = await getKvAsset(env, MODULE_FEDERATION.REMOTE_ENTRY);
        if (!remoteEntry) {
            return createJsonResponse({
                error: 'Module Federation assets not found',
                test: 'test-module',
                status: 'failed'
            }, 404);
        }

        // Execute remote entry in LEPUS
        await executeLEPUSCode(LEPUS, remoteEntry);

        const comprehensiveTestCode = `
            (async () => {
                const results = {};
                try {
                    console.log('Comprehensive test starting...');

                    // Check if init is needed
                    if (typeof module.exports.init === 'function') {
                        console.log('Calling module.exports.init()...');
                        module.exports.init();
                    }

                    // Test HelloWorld
                    console.log('Testing HelloWorld module...');
                    const helloFactory = await module.exports.get('./HelloWorld');
                    const helloModule = helloFactory();
                    results.helloWorld = helloModule.helloWorld({ name: 'Comprehensive Test', message: 'Full test' });

                    // Test DataProcessor
                    console.log('Testing DataProcessor module...');
                    const dataFactory = await module.exports.get('./DataProcessor');
                    const dataModule = dataFactory();
                    const sampleData = dataModule.generateSampleData(3);
                    results.dataProcessor = {
                        generated: sampleData.length,
                        processed: dataModule.processData(sampleData)
                    };

                    // Test WorkerUtils
                    console.log('Testing WorkerUtils module...');
                    const workerFactory = await module.exports.get('./WorkerUtils');
                    const workerModule = workerFactory();
                    results.workerUtils = workerModule.routeHandler('/health');

                    console.log('Comprehensive test completed');
                    globalThis.__testResult = {
                        success: true,
                        test: 'comprehensive-module-test',
                        results: results
                    };
                } catch (error) {
                    console.log('Comprehensive test error:', error.message);
                    globalThis.__testResult = {
                        success: false,
                        error: error.message,
                        test: 'comprehensive-module-test',
                        partialResults: results
                    };
                }
            })();
        `;

        await executeLEPUSCode(LEPUS, comprehensiveTestCode);
        const result = await executeLEPUSCode(LEPUS, 'globalThis.__testResult');

        return createJsonResponse({
            test: 'test-module',
            description: 'Comprehensive test of all Module Federation modules using LEPUS',
            ...result
        });

    } catch (error) {
        return createJsonResponse({
            test: 'test-module',
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * Handle Test Fetch Route - External API test with FetchUtils
 */
export async function handleTestFetchRoute(context) {
    const { env, LEPUS } = context;

    try {
        const remoteEntry = await getKvAsset(env, MODULE_FEDERATION.REMOTE_ENTRY);
        if (!remoteEntry) {
            return createJsonResponse({
                error: 'Module Federation assets not found',
                test: 'test-fetch',
                status: 'failed'
            }, 404);
        }

        // Set up fetch in LEPUS context
        await executeLEPUSCode(LEPUS, `
            globalThis.fetch = async (url, options) => {
                // Bridge to native fetch
                return __nativeFetch(url, options);
            };
        `);

        // Execute remote entry in LEPUS
        await executeLEPUSCode(LEPUS, remoteEntry);

        const fetchTestCode = `
            (async () => {
                try {
                    console.log('Fetch test starting...');

                    // Check if init is needed
                    if (typeof module.exports.init === 'function') {
                        console.log('Calling module.exports.init()...');
                        module.exports.init();
                    }

                    console.log('Getting FetchUtils module...');
                    const fetchFactory = await module.exports.get('./FetchUtils');
                    const fetchModule = fetchFactory();
                    console.log('FetchUtils module loaded');

                    const result = await fetchModule.quickFetchDemo();
                    console.log('Fetch test completed');

                    globalThis.__testResult = {
                        success: true,
                        test: 'fetch-test',
                        module: 'FetchUtils',
                        function: 'quickFetchDemo',
                        result: result
                    };
                } catch (error) {
                    console.log('Fetch test error:', error.message);
                    globalThis.__testResult = {
                        success: false,
                        error: error.message,
                        test: 'fetch-test'
                    };
                }
            })();
        `;

        await executeLEPUSCode(LEPUS, fetchTestCode);
        const result = await executeLEPUSCode(LEPUS, 'globalThis.__testResult');

        return createJsonResponse({
            test: 'test-fetch',
            description: 'External API fetch test using FetchUtils module with LEPUS',
            ...result
        });

    } catch (error) {
        return createJsonResponse({
            test: 'test-fetch',
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * Handle Test Real Fetch Route - Comprehensive external API test
 */
export async function handleTestRealFetchRoute(context) {
    const { env, LEPUS } = context;

    try {
        const remoteEntry = await getKvAsset(env, MODULE_FEDERATION.REMOTE_ENTRY);
        if (!remoteEntry) {
            return createJsonResponse({
                error: 'Module Federation assets not found',
                test: 'test-real-fetch',
                status: 'failed'
            }, 404);
        }

        // Set up fetch in LEPUS context
        await executeLEPUSCode(LEPUS, `
            globalThis.fetch = async (url, options) => {
                // Bridge to native fetch
                return __nativeFetch(url, options);
            };
        `);

        // Execute remote entry in LEPUS
        await executeLEPUSCode(LEPUS, remoteEntry);

        const realFetchTestCode = `
            (async () => {
                try {
                    console.log('Real fetch test starting...');

                    // Check if init is needed
                    if (typeof module.exports.init === 'function') {
                        console.log('Calling module.exports.init()...');
                        module.exports.init();
                    }

                    console.log('Getting FetchUtils module...');
                    const fetchFactory = await module.exports.get('./FetchUtils');
                    const fetchModule = fetchFactory();
                    console.log('FetchUtils module loaded for real test');

                    const comprehensiveResult = await fetchModule.demonstrateFetchCapabilities();
                    console.log('Real fetch test completed');

                    globalThis.__testResult = {
                        success: true,
                        test: 'real-fetch-test',
                        module: 'FetchUtils',
                        function: 'demonstrateFetchCapabilities',
                        result: comprehensiveResult
                    };
                } catch (error) {
                    console.log('Real fetch test error:', error.message);
                    globalThis.__testResult = {
                        success: false,
                        error: error.message,
                        test: 'real-fetch-test'
                    };
                }
            })();
        `;

        await executeLEPUSCode(LEPUS, realFetchTestCode);
        const result = await executeLEPUSCode(LEPUS, 'globalThis.__testResult');

        return createJsonResponse({
            test: 'test-real-fetch',
            description: 'Comprehensive external API test with real data fetching using LEPUS',
            ...result
        });

    } catch (error) {
        return createJsonResponse({
            test: 'test-real-fetch',
            success: false,
            error: error.message
        }, 500);
    }
}