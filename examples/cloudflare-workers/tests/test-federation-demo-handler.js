#!/usr/bin/env node
/* eslint-disable */
import { handleFederationDemoRoute } from '../src/federationDemoHandler.js';

(async () => {
  console.log('🧪 Testing Federation Demo Handler');

  // Mock KV store for testing
  const mockEnv = {
    MODULE_FEDERATION_ASSETS: {
      async get(key) {
        if (key === 'remoteEntry.js') {
          return 'console.log("Mock remoteEntry.js content");';
        }
        return null;
      }
    }
  };

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  console.log('\n📋 Testing handleFederationDemoRoute...');

  // Test 1: Valid federation demo response
  console.log('🔍 Test 1: Valid federation demo response');
  const context = { env: mockEnv, corsHeaders };
  const response = await handleFederationDemoRoute(context);

  if (response.status === 200) {
    const contentType = response.headers.get('Content-Type');
    const responseData = await response.json();

    // Validate content type
    if (contentType !== 'application/json') {
      throw new Error(`❌ Wrong content type: ${contentType}`);
    }

    // Validate response structure
    const expectedFields = [
      'message',
      'assets_available',
      'remote_entry_size',
      'real_execution_endpoint',
      'exposed_modules',
      'note'
    ];

    let allFieldsPresent = true;
    for (const field of expectedFields) {
      if (!(field in responseData)) {
        throw new Error(`❌ Missing field: ${field}. Response data: ${JSON.stringify(responseData, null, 2)}`);
      }
    }

    // Validate specific values
    if (responseData.message !== 'Real Module Federation Demo - Use /test-module for execution') {
      throw new Error(`❌ Wrong message: ${responseData.message}`);
    }

    if (responseData.assets_available !== true) {
      throw new Error(`❌ assets_available should be true: ${responseData.assets_available}`);
    }

    if (typeof responseData.remote_entry_size !== 'number') {
      throw new Error(`❌ remote_entry_size should be a number: ${responseData.remote_entry_size}`);
    }

    if (responseData.real_execution_endpoint !== '/test-module') {
      throw new Error(`❌ Wrong execution endpoint: ${responseData.real_execution_endpoint}`);
    }

    if (!Array.isArray(responseData.exposed_modules)) {
      throw new Error(`❌ exposed_modules should be an array: ${responseData.exposed_modules}`);
    }

    // Validate exposed modules list
    const expectedModules = [
      'HelloWorld - Basic greeting functions',
      'DataProcessor - Data manipulation utilities',
      'ApiUtils - API request utilities',
      'WorkerUtils - Cloudflare Worker utilities',
      'AdvancedExamples - Complex async patterns',
      'FetchUtils - External API fetching with JSONPlaceholder'
    ];

    if (responseData.exposed_modules.length !== expectedModules.length) {
      throw new Error(`❌ Wrong number of exposed modules: ${responseData.exposed_modules.length}`);
    }

    for (let i = 0; i < expectedModules.length; i++) {
      if (responseData.exposed_modules[i] !== expectedModules[i]) {
        throw new Error(`❌ Module ${i} mismatch: ${responseData.exposed_modules[i]}`);
      }
    }

    console.log('✅ Federation demo response structure is correct');
    console.log('📋 Message:', responseData.message);
    console.log('📋 Assets available:', responseData.assets_available);
    console.log('📋 Remote entry size:', responseData.remote_entry_size);
    console.log('📋 Execution endpoint:', responseData.real_execution_endpoint);
    console.log('📋 Exposed modules count:', responseData.exposed_modules.length);

  } else {
    const errorText = await response.text();
    throw new Error(`❌ Federation demo returned wrong status: ${response.status}. Error: ${errorText}`);
  }

  // Test 2: CORS headers validation
  console.log('🔍 Test 2: CORS headers validation');
  const corsContext = { env: mockEnv, corsHeaders };
  const corsResponse = await handleFederationDemoRoute(corsContext);

  const allowOrigin = corsResponse.headers.get('Access-Control-Allow-Origin');

  if (allowOrigin === '*') {
    console.log('✅ CORS headers are correct');
  } else {
    throw new Error(`❌ CORS headers incorrect. Allow-Origin: ${allowOrigin}`);
  }

  // Test 3: Missing remoteEntry.js (simulate KV failure)
  console.log('🔍 Test 3: Missing remoteEntry.js handling');
  const mockEnvNoRemoteEntry = {
    MODULE_FEDERATION_ASSETS: {
      async get(key) {
        if (key === 'remoteEntry.js') {
          return null; // Simulate missing file
        }
        return 'some content';
      }
    }
  };

  const missingContext = { env: mockEnvNoRemoteEntry, corsHeaders };
  const missingRemoteEntryResponse = await handleFederationDemoRoute(missingContext);

  if (missingRemoteEntryResponse.status === 404) {
    const errorResponse = await missingRemoteEntryResponse.json();
    if (errorResponse.error === 'Module Federation assets not found') {
      console.log('✅ Missing remoteEntry.js correctly returns 404');
    } else {
      throw new Error(`❌ 404 response has wrong error message: ${JSON.stringify(errorResponse, null, 2)}`);
    }
  } else {
    throw new Error(`❌ Missing remoteEntry.js returned wrong status: ${missingRemoteEntryResponse.status}`);
  }

  // Test 4: KV error handling (simulate KV namespace error)
  console.log('🔍 Test 4: KV error handling');
  const mockEnvError = {
    MODULE_FEDERATION_ASSETS: {
      async get(key) {
        throw new Error('KV namespace error');
      }
    }
  };

  const errorContext = { env: mockEnvError, corsHeaders };
  const errorResponse = await handleFederationDemoRoute(errorContext);

  if (errorResponse.status === 404) {
    // The KV error gets caught and treated as missing assets, returning 404
    const errorResponseJson = await errorResponse.json();
    if (errorResponseJson.error === 'Module Federation assets not found') {
      console.log('✅ KV errors correctly handled (treated as missing assets)');
    } else {
      throw new Error(`❌ Error response has wrong error message: ${JSON.stringify(errorResponseJson, null, 2)}`);
    }
  } else {
    throw new Error(`❌ KV error returned wrong status: ${errorResponse.status}. Expected: 404 (KV errors are treated as missing assets)`);
  }

  // Test 5: Response is valid JSON
  console.log('🔍 Test 5: Response JSON validity');
  const jsonContext = { env: mockEnv, corsHeaders };
  const jsonResponse = await handleFederationDemoRoute(jsonContext);

  const parsed = await jsonResponse.json();
  if (typeof parsed === 'object' && parsed !== null) {
    console.log('✅ Response is valid JSON object');
  } else {
    throw new Error('❌ Response is not a valid JSON object');
  }

  // Test 6: Demo information completeness
  console.log('🔍 Test 6: Demo information completeness');
  const infoContext = { env: mockEnv, corsHeaders };
  const infoResponse = await handleFederationDemoRoute(infoContext);
  const infoData = await infoResponse.json();

  // Check if all essential demo information is present
  const hasMessage = infoData.message && infoData.message.length > 0;
  const hasExecutionEndpoint = infoData.real_execution_endpoint && infoData.real_execution_endpoint.length > 0;
  const hasModulesList = infoData.exposed_modules && infoData.exposed_modules.length > 0;
  const hasNote = infoData.note && infoData.note.length > 0;

  if (hasMessage && hasExecutionEndpoint && hasModulesList && hasNote) {
    console.log('✅ Demo information is complete');
    console.log('📋 All essential fields have meaningful content');
  } else {
    throw new Error(`❌ Demo information is incomplete. Has message: ${hasMessage}, Has execution endpoint: ${hasExecutionEndpoint}, Has modules list: ${hasModulesList}, Has note: ${hasNote}`);
  }

  console.log('\n✅ FEDERATION DEMO HANDLER TESTS PASSED');
  console.log('📋 Federation demo endpoint works correctly');
  console.log('📋 Proper JSON response structure');
  console.log('📋 Correct error handling for missing assets');
  console.log('📋 Proper KV error handling');
  console.log('📋 CORS headers properly applied');
  console.log('📋 Complete module information provided');
  console.log('✨ Test completed successfully');

})();
