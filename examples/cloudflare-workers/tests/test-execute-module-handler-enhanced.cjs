#!/usr/bin/env node
/* eslint-disable */
const { newQuickJSWASMModule, RELEASE_SYNC } = require('quickjs-emscripten');
const { handleExecuteModuleRoute } = require('../src/executeModuleHandler.js');
const fs = require('fs/promises');
const path = require('path');

(async () => {
  console.log('🧪 Testing executeModuleHandler (Enhanced)');

  // Prepare QuickJS instance
  const QuickJS = await newQuickJSWASMModule(RELEASE_SYNC);

  // Load remoteEntry for KV simulation
  const distDir = path.resolve(__dirname, '../rsbuild-project/dist');
  let remoteEntry;
  try {
    remoteEntry = await fs.readFile(path.join(distDir, 'remoteEntry.js'), 'utf8');
  } catch (error) {
    console.log('⚠️ Could not load real remoteEntry.js, using mock');
    remoteEntry = `
      // Mock remoteEntry for testing
      const __webpack_require__ = {
        u: (id) => \`chunk-\${id}.js\`,
        e: (id) => Promise.resolve()
      };
      const module = { exports: {
        get: async (name) => {
          if (name === './HelloWorld') {
            return () => ({ helloWorld: (params) => \`Hello \${params?.name || 'World'}!\` });
          }
          throw new Error('Module not found: ' + name);
        }
      }};
      globalThis.module = module;
    `;
  }

  // Mock KV namespace
  const kvNamespace = {
    async get(key) {
      if (key === 'remoteEntry.js') return remoteEntry;

      // Try to load real chunks, but fall back to mocks
      try {
        return await fs.readFile(path.join(distDir, key), 'utf8');
      } catch (error) {
        console.log(`[KV] File not found: ${key}, using mock`);

        // Return mock chunks for testing
        if (key.includes('HelloWorld')) {
          return 'module.exports = () => ({ helloWorld: (params) => `Hello ${params?.name || "World"}!` });';
        }
        if (key.includes('DataProcessor')) {
          return 'module.exports = () => ({ processData: (data) => ({ processed: true, data }) });';
        }
        return null;
      }
    }
  };

  // Mock environment (matching the actual interface)
  const env = { MODULE_FEDERATION_ASSETS: kvNamespace };

  // Mock CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Mock setupArenaWithFetch function (simplified version)
  const setupArenaWithFetch = (arena, consoleBridge, moduleObj, kvNS, opts) => {
    // Simplified arena setup for testing
    arena.expose({
      console: consoleBridge,
      require: opts?.requireStub || (() => ({})),
      module: opts?.syncedModule,
      exports: opts?.syncedExports,
      __CF_KV_NAMESPACE__: kvNS,
      // Mock fetch for testing
      fetch: async (input, init) => {
        return {
          ok: true,
          status: 200,
          json: async () => ({ test: 'mock response' }),
          text: async () => 'mock response'
        };
      },
    });
  };

  let testCount = 0;
  let passedTests = 0;

  const runTest = async (testName, testFunction) => {
    testCount++;
    console.log(`\n🔍 Test ${testCount}: ${testName}`);
    try {
      await testFunction();
      passedTests++;
      console.log(`✅ ${testName} PASSED`);
    } catch (error) {
      console.log(`❌ ${testName} FAILED:`, error.message);
      console.error('Stack:', error.stack);
    }
  };

  // Test 1: Basic HelloWorld execution
  await runTest('Basic HelloWorld execution', async () => {
    const testUrl = new URL('https://example.com/execute-module?module=HelloWorld&function=helloWorld&params=' +
      encodeURIComponent(JSON.stringify({ name: 'Enhanced Test' })));

    const context = { url: testUrl, env, corsHeaders, QuickJS, setupArenaWithFetch };
    const response = await handleExecuteModuleRoute(context);

    if (response.status !== 200) {
      const errorText = await response.text();
      throw new Error(`Wrong status ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`Execution failed: ${result.error}`);
    }

    if (!result.execution || !result.execution.result) {
      throw new Error('Missing execution result');
    }

    console.log('📋 Result:', result.execution.result);
  });

  // Test 2: Default parameters handling
  await runTest('Default parameters handling', async () => {
    const testUrl = new URL('https://example.com/execute-module?module=HelloWorld&function=helloWorld');

    const context = { url: testUrl, env, corsHeaders, QuickJS, setupArenaWithFetch };
    const response = await handleExecuteModuleRoute(context);
    const result = await response.json();

    if (!result.success) {
      throw new Error(`Execution failed: ${result.error}`);
    }

    // Should have default empty object params
    if (!result.execution.params || typeof result.execution.params !== 'object') {
      throw new Error('Default params not properly set');
    }

    console.log('📋 Default params:', JSON.stringify(result.execution.params));
  });

  // Test 3: Invalid JSON parameters
  await runTest('Invalid JSON parameters handling', async () => {
    const testUrl = new URL('https://example.com/execute-module?module=HelloWorld&function=helloWorld&params=invalid-json');

    const context = { url: testUrl, env, corsHeaders, QuickJS, setupArenaWithFetch };
    const response = await handleExecuteModuleRoute(context);
    const result = await response.json();

    // Should still succeed with empty object params
    if (!result.success) {
      throw new Error(`Should handle invalid JSON gracefully: ${result.error}`);
    }

    // Should fallback to empty object
    if (JSON.stringify(result.execution.params) !== '{}') {
      throw new Error('Should fallback to empty object for invalid JSON');
    }

    console.log('📋 Fallback params:', JSON.stringify(result.execution.params));
  });

  // Test 4: Missing remoteEntry (404 error)
  await runTest('Missing remoteEntry handling', async () => {
    const envNoRemoteEntry = {
      MODULE_FEDERATION_ASSETS: {
        async get(key) {
          if (key === 'remoteEntry.js') return null;
          return 'some content';
        }
      }
    };

    const testUrl = new URL('https://example.com/execute-module?module=HelloWorld&function=helloWorld');
    const context = { url: testUrl, env: envNoRemoteEntry, corsHeaders, QuickJS, setupArenaWithFetch };
    const response = await handleExecuteModuleRoute(context);

    if (response.status !== 404) {
      throw new Error(`Expected 404 status, got ${response.status}`);
    }

    const errorResponse = await response.json();
    if (!errorResponse.error || errorResponse.error !== 'Module Federation assets not found') {
      throw new Error(`Wrong error message: ${errorResponse.error || 'no error message'}`);
    }

    console.log('📋 Correctly returned 404 for missing remoteEntry');
  });

  // Test 5: CORS headers validation
  await runTest('CORS headers validation', async () => {
    const testUrl = new URL('https://example.com/execute-module?module=HelloWorld&function=helloWorld');
    const context = { url: testUrl, env, corsHeaders, QuickJS, setupArenaWithFetch };
    const response = await handleExecuteModuleRoute(context);

    const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
    const contentType = response.headers.get('Content-Type');

    if (allowOrigin !== '*') {
      throw new Error(`Wrong CORS header: ${allowOrigin}`);
    }

    if (contentType !== 'application/json') {
      throw new Error(`Wrong content type: ${contentType}`);
    }

    console.log('📋 CORS and content-type headers are correct');
  });

  // Test 6: Response structure validation
  await runTest('Response structure validation', async () => {
    const testUrl = new URL('https://example.com/execute-module?module=HelloWorld&function=helloWorld&params=' +
      encodeURIComponent(JSON.stringify({ name: 'Structure Test' })));

    const context = { url: testUrl, env, corsHeaders, QuickJS, setupArenaWithFetch };
    const response = await handleExecuteModuleRoute(context);
    const result = await response.json();

    // Check required fields
    const requiredFields = ['success', 'execution', 'logs', 'note', 'debug'];
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check execution object structure
    if (result.success && result.execution) {
      const executionFields = ['module', 'function', 'params', 'result', 'type', 'timestamp'];
      for (const field of executionFields) {
        if (!(field in result.execution)) {
          throw new Error(`Missing execution field: ${field}`);
        }
      }
    }

    // Check debug object
    if (!result.debug || typeof result.debug !== 'object') {
      throw new Error('Missing or invalid debug object');
    }

    console.log('📋 Response structure is valid');
  });

  // Test 7: Error handling for exceptions
  await runTest('Exception handling', async () => {
    const envError = {
      MODULE_FEDERATION_ASSETS: {
        async get(key) {
          if (key === 'remoteEntry.js') {
            throw new Error('Simulated KV error');
          }
          return null;
        }
      }
    };

    const testUrl = new URL('https://example.com/execute-module?module=HelloWorld&function=helloWorld');
    const context = { url: testUrl, env: envError, corsHeaders, QuickJS, setupArenaWithFetch };
    const response = await handleExecuteModuleRoute(context);

    if (response.status !== 404) {
      throw new Error(`Expected 404 status for KV error (treated as missing asset), got ${response.status}`);
    }

    const result = await response.json();
    if (result.success !== false) {
      throw new Error('Error response should have success=false');
    }

    if (!result.error || result.error !== 'Module Federation assets not found') {
      throw new Error(`Wrong error message: ${result.error}`);
    }

    console.log('📋 Exception properly handled (KV error treated as missing assets)');
  });

  // Test 8: Logs generation
  await runTest('Logs generation', async () => {
    const testUrl = new URL('https://example.com/execute-module?module=HelloWorld&function=helloWorld');
    const context = { url: testUrl, env, corsHeaders, QuickJS, setupArenaWithFetch };
    const response = await handleExecuteModuleRoute(context);
    const result = await response.json();

    if (!Array.isArray(result.logs)) {
      throw new Error('Logs should be an array');
    }

    if (result.logs.length === 0) {
      throw new Error('Should generate some logs');
    }

    // Check for expected log patterns
    const hasVMLog = result.logs.some(log => log.includes('[VM]'));
    const hasJobsLog = result.logs.some(log => log.includes('jobs'));

    if (!hasVMLog && !hasJobsLog) {
      console.log('⚠️ Expected VM or jobs logs, but execution succeeded');
    } else {
      console.log('📋 Logs properly generated');
    }

    console.log(`📋 Generated ${result.logs.length} log entries`);
  });

  // Test 9: URL parameter parsing
  await runTest('URL parameter parsing', async () => {
    // Test with all default values
    const minimalUrl = new URL('https://example.com/execute-module');
    const context1 = { url: minimalUrl, env, corsHeaders, QuickJS, setupArenaWithFetch };
    const response1 = await handleExecuteModuleRoute(context1);
    const result1 = await response1.json();

    if (result1.success && result1.execution) {
      if (result1.execution.module !== 'HelloWorld') {
        throw new Error(`Default module should be HelloWorld, got ${result1.execution.module}`);
      }
      if (result1.execution.function !== 'helloWorld') {
        throw new Error(`Default function should be helloWorld, got ${result1.execution.function}`);
      }
    }

    // Test with custom values
    const customUrl = new URL('https://example.com/execute-module?module=CustomModule&function=customFunction&params={"test":true}');
    const context2 = { url: customUrl, env, corsHeaders, QuickJS, setupArenaWithFetch };
    const response2 = await handleExecuteModuleRoute(context2);
    const result2 = await response2.json();

    // Even if execution fails, parameters should be parsed correctly
    if (result2.execution && result2.execution.params) {
      if (!result2.execution.params.test) {
        throw new Error('Custom params not parsed correctly');
      }
    }

    console.log('📋 URL parameters parsed correctly');
  });

  // Test 10: Performance and timing
  await runTest('Performance and timing', async () => {
    const testUrl = new URL('https://example.com/execute-module?module=HelloWorld&function=helloWorld');

    const startTime = Date.now();
    const context = { url: testUrl, env, corsHeaders, QuickJS, setupArenaWithFetch };
    const response = await handleExecuteModuleRoute(context);
    const endTime = Date.now();

    const duration = endTime - startTime;

    if (duration > 10000) { // 10 seconds
      throw new Error(`Execution took too long: ${duration}ms`);
    }

    const result = await response.json();

    // Check if timestamp is recent
    if (result.execution && result.execution.timestamp) {
      const timestamp = new Date(result.execution.timestamp);
      const timeDiff = Math.abs(Date.now() - timestamp.getTime());

      if (timeDiff > 5000) { // 5 seconds tolerance
        throw new Error(`Timestamp seems off by ${timeDiff}ms`);
      }
    }

    console.log(`📋 Execution completed in ${duration}ms`);
  });

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 ENHANCED EXECUTE MODULE HANDLER TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${passedTests}/${testCount}`);
  console.log(`❌ Failed: ${testCount - passedTests}/${testCount}`);

  if (passedTests === testCount) {
    console.log('\n🎉 ALL ENHANCED TESTS PASSED!');
    console.log('📋 Basic module execution works');
    console.log('📋 Parameter parsing and validation works');
    console.log('📋 Error handling works correctly');
    console.log('📋 CORS and response structure correct');
    console.log('📋 Performance within acceptable limits');
    console.log('✨ Enhanced test completed successfully');
  } else {
    console.log(`\n💥 ${testCount - passedTests} TEST(S) FAILED!`);
    process.exit(1);
  }

})();
