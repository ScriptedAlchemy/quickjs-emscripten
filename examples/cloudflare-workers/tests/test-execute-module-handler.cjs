#!/usr/bin/env node
/* eslint-disable */
const { newQuickJSWASMModule, RELEASE_SYNC } = require('quickjs-emscripten');
const { handleExecuteModuleRoute } = require('../src/executeModuleHandler.js');
const fs = require('fs/promises');
const path = require('path');

(async () => {
  console.log('🧪 Testing executeModuleHandler with Performance Timing');
  console.log('=' .repeat(60));

  const timings = {};
  const startTime = performance.now();

  // Phase 1: Setup
  const setupStart = performance.now();
  console.log('⏱️  Phase 1: Setup starting...');

  // Prepare QuickJS instance
  const quickjsStart = performance.now();
  const QuickJS = await newQuickJSWASMModule(RELEASE_SYNC);
  timings.quickjsInit = performance.now() - quickjsStart;
  console.log(`   📦 QuickJS initialization: ${timings.quickjsInit.toFixed(2)}ms`);

  // Load remoteEntry for KV simulation
  const fileLoadStart = performance.now();
  const distDir = path.resolve(__dirname, '../rsbuild-project/dist');
  const remoteEntry = await fs.readFile(path.join(distDir, 'remoteEntry.js'), 'utf8');
  timings.fileLoad = performance.now() - fileLoadStart;
  console.log(`   📄 RemoteEntry load: ${timings.fileLoad.toFixed(2)}ms`);

  // Mock KV namespace
  const kvNamespace = {
    async get(key) {
      if (key === 'remoteEntry.js') return remoteEntry;
      try {
        return await fs.readFile(path.join(distDir, key), 'utf8');
      } catch (error) {
        console.log(`[KV] File not found: ${key}`);
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

  timings.setup = performance.now() - setupStart;
  console.log(`✅ Phase 1 Complete: Setup took ${timings.setup.toFixed(2)}ms`);
  console.log();

  try {
    // Phase 2: Test Execution
    const executionStart = performance.now();
    console.log('⏱️  Phase 2: Test Execution starting...');

    console.log('✅ Testing basic handleExecuteModuleRoute...');

    // Create URL with query parameters
    const urlStart = performance.now();
    const testUrl = new URL('https://example.com/execute-module?module=HelloWorld&function=helloWorld&params=' +
      encodeURIComponent(JSON.stringify({ name: 'executeModuleHandler Test' })));
    timings.urlCreation = performance.now() - urlStart;
    console.log(`   🔗 URL creation: ${timings.urlCreation.toFixed(2)}ms`);

    // Context creation
    const contextStart = performance.now();
    const context = {
      url: testUrl,
      env: env,
      corsHeaders: corsHeaders,
      QuickJS: QuickJS,
      setupArenaWithFetch: setupArenaWithFetch
    };
    timings.contextCreation = performance.now() - contextStart;
    console.log(`   📦 Context creation: ${timings.contextCreation.toFixed(2)}ms`);

    // Handler execution
    const handlerStart = performance.now();
    const response = await handleExecuteModuleRoute(context);
    timings.handlerExecution = performance.now() - handlerStart;
    console.log(`   🚀 Handler execution: ${timings.handlerExecution.toFixed(2)}ms`);

    timings.execution = performance.now() - executionStart;
    console.log(`✅ Phase 2 Complete: Execution took ${timings.execution.toFixed(2)}ms`);
    console.log();

    // Phase 3: Validation
    const validationStart = performance.now();
    console.log('⏱️  Phase 3: Validation starting...');

    if (response && response.status === 200) {
      const jsonStart = performance.now();
      const result = await response.json();
      timings.jsonParsing = performance.now() - jsonStart;
      console.log(`   📋 JSON parsing: ${timings.jsonParsing.toFixed(2)}ms`);

      console.log('✅ Handler response received');

      if (result.success && result.execution) {
        console.log('✅ EXECUTE MODULE HANDLER TEST PASSED');
        console.log('📋 Module:', result.execution.module);
        console.log('📋 Function:', result.execution.function);
        console.log('📋 Result:', result.execution.result);

        // Verify the greeting contains our test input
        if (result.execution.result && typeof result.execution.result === 'string' &&
            result.execution.result.includes('executeModuleHandler Test')) {
          console.log('✅ Result contains expected test input');
        } else {
          console.log('⚠️ Result format unexpected, but execution succeeded');
        }
      } else {
        console.log('❌ Handler returned unsuccessful result:', result.error || 'unknown error');
        console.log('📋 Full response:', JSON.stringify(result, null, 2));
        process.exit(1);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Handler returned error response:', response.status);
      console.log('📋 Error:', errorText);
      process.exit(1);
    }

    timings.validation = performance.now() - validationStart;
    console.log(`✅ Phase 3 Complete: Validation took ${timings.validation.toFixed(2)}ms`);

  } catch (error) {
    console.error('❌ EXECUTE MODULE HANDLER TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }

  // Final timing summary
  timings.total = performance.now() - startTime;

  console.log();
  console.log('=' .repeat(60));
  console.log('📊 PERFORMANCE TIMING SUMMARY');
  console.log('=' .repeat(60));
  console.log(`🔹 QuickJS Initialization:     ${timings.quickjsInit.toFixed(2)}ms`);
  console.log(`🔹 File Loading:               ${timings.fileLoad.toFixed(2)}ms`);
  console.log(`🔹 URL Creation:               ${timings.urlCreation.toFixed(2)}ms`);
  console.log(`🔹 Context Creation:           ${timings.contextCreation.toFixed(2)}ms`);
  console.log(`🔹 Handler Execution:          ${timings.handlerExecution.toFixed(2)}ms`);
  console.log(`🔹 JSON Parsing:               ${timings.jsonParsing.toFixed(2)}ms`);
  console.log('─'.repeat(60));
  console.log(`📈 Setup Phase:                ${timings.setup.toFixed(2)}ms`);
  console.log(`📈 Execution Phase:            ${timings.execution.toFixed(2)}ms`);
  console.log(`📈 Validation Phase:           ${timings.validation.toFixed(2)}ms`);
  console.log('─'.repeat(60));
  console.log(`🏆 TOTAL EXECUTION TIME:       ${timings.total.toFixed(2)}ms`);
  console.log('=' .repeat(60));

  // Performance analysis
  const handlerPercentage = (timings.handlerExecution / timings.total * 100).toFixed(1);
  const setupPercentage = (timings.setup / timings.total * 100).toFixed(1);

  console.log();
  console.log('🔍 PERFORMANCE ANALYSIS:');
  console.log(`   • Handler execution represents ${handlerPercentage}% of total time`);
  console.log(`   • Setup overhead represents ${setupPercentage}% of total time`);
  console.log(`   • Context pattern overhead: ~${timings.contextCreation.toFixed(2)}ms (${(timings.contextCreation/timings.total*100).toFixed(1)}%)`);

  console.log('✨ Test completed successfully with detailed timing analysis');
})();
