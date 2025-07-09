/**
 * Test Routes Handler - Handles Module Federation test routes
 */

import { createJsonResponse } from './utils/responseUtils.js';
import { setupArena, executeArenaCode } from './utils/arenaUtils.js';
import { getKvAsset } from './utils/kvUtils.js';
import { MODULE_FEDERATION, EXECUTION_TIMEOUTS } from './utils/constants.js';

/**
 * Handle Arena Test Route - Simple Module Federation test with HelloWorld
 */
export async function handleArenaTestRoute(context) {
    const { env, corsHeaders, QuickJS } = context;

    try {
        // Get the remote entry from KV
        const remoteEntry = await getKvAsset(env, MODULE_FEDERATION.REMOTE_ENTRY);
        if (!remoteEntry) {
            return createJsonResponse({
                error: 'Module Federation assets not found',
                test: 'arena-test',
                status: 'failed'
            }, 404);
        }

        // Set up Arena for simple test
        const { arena, logs, dispose } = setupArena(QuickJS, {
            env,
            enableFetch: true,
            enableKv: true
        });

        // Execute remote entry and simple HelloWorld test
        await executeArenaCode(arena, remoteEntry, {
            maxIterations: 3,
            delayMs: 50,
            logs
        });

        const testCode = `
            (async () => {
                try {
                    console.log('Arena test starting...');

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

                    const result = moduleExports.helloWorld({ name: 'Arena Test', message: 'Simple test' });
                    console.log('Arena test result:', result);
                    globalThis.__testResult = {
                        success: true,
                        module: 'HelloWorld',
                        function: 'helloWorld',
                        result: result,
                        test: 'arena-test'
                    };
                } catch (error) {
                    console.log('Arena test error:', error.message);
                    globalThis.__testResult = {
                        success: false,
                        error: error.message,
                        test: 'arena-test'
                    };
                }
            })();
        `;

        await executeArenaCode(arena, testCode, {
            maxIterations: 5,
            delayMs: 100,
            logs
        });

        const result = arena.evalCode('globalThis.__testResult');
        dispose();

        return createJsonResponse({
            test: 'arena-test',
            description: 'Simple Module Federation test with HelloWorld module',
            ...result,
            logs: logs.slice(-10) // Last 10 log entries
        });

    } catch (error) {
        return createJsonResponse({
            test: 'arena-test',
            success: false,
            error: error.message
        }, 500);
    }
}

/**
 * Handle Test Module Route - Comprehensive Module Federation test
 */
export async function handleTestModuleRoute(context) {
    const { env, corsHeaders, QuickJS } = context;

    try {
        const remoteEntry = await getKvAsset(env, MODULE_FEDERATION.REMOTE_ENTRY);
        if (!remoteEntry) {
            return createJsonResponse({
                error: 'Module Federation assets not found',
                test: 'test-module',
                status: 'failed'
            }, 404);
        }

        const { arena, logs, dispose } = setupArena(QuickJS, {
            env,
            enableFetch: true,
            enableKv: true
        });

        await executeArenaCode(arena, remoteEntry, {
            maxIterations: 3,
            delayMs: 50,
            logs
        });

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

        await executeArenaCode(arena, comprehensiveTestCode, {
            maxIterations: 8,
            delayMs: 150,
            logs
        });

        const result = arena.evalCode('globalThis.__testResult');
        dispose();

        return createJsonResponse({
            test: 'test-module',
            description: 'Comprehensive test of all Module Federation modules',
            ...result,
            logs: logs.slice(-15)
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
    const { env, corsHeaders, QuickJS } = context;

    try {
        const remoteEntry = await getKvAsset(env, MODULE_FEDERATION.REMOTE_ENTRY);
        if (!remoteEntry) {
            return createJsonResponse({
                error: 'Module Federation assets not found',
                test: 'test-fetch',
                status: 'failed'
            }, 404);
        }

        const { arena, logs, dispose } = setupArena(QuickJS, {
            env,
            enableFetch: true,
            enableKv: true
        });

        await executeArenaCode(arena, remoteEntry, {
            maxIterations: 3,
            delayMs: 50,
            logs
        });

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

        await executeArenaCode(arena, fetchTestCode, {
            maxIterations: 10,
            delayMs: 200,
            logs
        });

        const result = arena.evalCode('globalThis.__testResult');
        dispose();

        return createJsonResponse({
            test: 'test-fetch',
            description: 'External API fetch test using FetchUtils module',
            ...result,
            logs: logs.slice(-15)
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
    const { env, corsHeaders, QuickJS } = context;

    try {
        const remoteEntry = await getKvAsset(env, MODULE_FEDERATION.REMOTE_ENTRY);
        if (!remoteEntry) {
            return createJsonResponse({
                error: 'Module Federation assets not found',
                test: 'test-real-fetch',
                status: 'failed'
            }, 404);
        }

        const { arena, logs, dispose } = setupArena(QuickJS, {
            env,
            enableFetch: true,
            enableKv: true
        });

        await executeArenaCode(arena, remoteEntry, {
            maxIterations: 3,
            delayMs: 50,
            logs
        });

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

        await executeArenaCode(arena, realFetchTestCode, {
            maxIterations: EXECUTION_TIMEOUTS.FETCH_UTILS_MAX_ITERATIONS,
            delayMs: EXECUTION_TIMEOUTS.FETCH_UTILS_DELAY_MS,
            logs
        });

        const result = arena.evalCode('globalThis.__testResult');
        dispose();

        return createJsonResponse({
            test: 'test-real-fetch',
            description: 'Comprehensive external API test with real data fetching',
            ...result,
            logs: logs.slice(-20)
        });

    } catch (error) {
        return createJsonResponse({
            test: 'test-real-fetch',
            success: false,
            error: error.message
        }, 500);
    }
}
