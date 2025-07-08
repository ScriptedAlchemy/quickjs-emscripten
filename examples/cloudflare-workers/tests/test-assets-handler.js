#!/usr/bin/env node
/* eslint-disable */
import { handleAssetsRoute, handleRemoteEntryRoute } from '../src/assetsHandler.js';

/**
 * Tests for Assets Handler
 */

(async () => {
  console.log('🧪 Testing Assets Handler');

  // Mock KV store for testing
  const mockEnv = {
    MODULE_FEDERATION_ASSETS: {
      async get(key) {
        const mockFiles = {
          'main.js': 'console.log("Mock main.js content");',
          'style.css': 'body { background: blue; }',
          'image.png': 'mock-binary-data',
          'remoteEntry.js': 'console.log("Mock remoteEntry.js content");'
        };

        return mockFiles[key] || null;
      },

      async list(options = {}) {
        return {
          keys: [
            { name: 'main.js' },
            { name: 'style.css' },
            { name: 'image.png' }
          ]
        };
      },

      async getWithMetadata(key) {
        const value = await this.get(key);
        if (!value) {
          return { value: null, metadata: null };
        }
        
        const metadata = {
          contentType: key.endsWith('.js') ? 'application/javascript' :
                      key.endsWith('.css') ? 'text/css' :
                      key.endsWith('.png') ? 'image/png' : 'text/plain'
        };

        return {
          value: value,
          metadata: metadata
        };
      }
    }
  };

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  console.log('\n📋 Testing handleAssetsRoute...');

  // Test 1: Valid JavaScript asset
  console.log('🔍 Test 1: Valid JavaScript asset');
  const jsUrl = new URL('https://example.com/assets/main.js');
  const jsContext = { url: jsUrl, env: mockEnv, corsHeaders };
  const jsResponse = await handleAssetsRoute(jsContext);

  if (jsResponse.status === 200) {
    const jsContent = await jsResponse.text();
    const contentType = jsResponse.headers.get('Content-Type');

    if (jsContent === 'console.log("Mock main.js content");' &&
        contentType === 'application/javascript') {
      console.log('✅ JavaScript asset served correctly');
    } else {
      throw new Error(`❌ JavaScript asset content or content-type incorrect. Content: ${jsContent}, Content-Type: ${contentType}`);
    }
  } else {
    throw new Error(`❌ JavaScript asset returned wrong status: ${jsResponse.status}`);
  }

  // Test 2: Valid CSS asset
  console.log('🔍 Test 2: Valid CSS asset');
  const cssUrl = new URL('https://example.com/assets/style.css');
  const cssContext = { url: cssUrl, env: mockEnv, corsHeaders };
  const cssResponse = await handleAssetsRoute(cssContext);

  if (cssResponse.status === 200) {
    const cssContent = await cssResponse.text();
    const contentType = cssResponse.headers.get('Content-Type');

    if (cssContent === 'body { background: blue; }' &&
        contentType === 'text/css') {
      console.log('✅ CSS asset served correctly');
    } else {
      throw new Error('❌ CSS asset content or content-type incorrect');
    }
  } else {
    throw new Error(`❌ CSS asset returned wrong status: ${cssResponse.status}`);
  }

  // Test 3: Binary asset (PNG)
  console.log('🔍 Test 3: Binary asset (PNG)');
  const pngUrl = new URL('https://example.com/assets/image.png');
  const pngContext = { url: pngUrl, env: mockEnv, corsHeaders };
  const pngResponse = await handleAssetsRoute(pngContext);

  if (pngResponse.status === 200) {
    const pngContent = await pngResponse.text();
    const contentType = pngResponse.headers.get('Content-Type');

    if (pngContent === 'mock-binary-data' &&
        contentType === 'image/png') {
      console.log('✅ PNG asset served correctly');
    } else {
      throw new Error(`❌ PNG asset content or content-type incorrect. Content: "${pngContent}", Content-Type: "${contentType}"`);
    }
  } else {
    throw new Error(`❌ PNG asset returned wrong status: ${pngResponse.status}`);
  }

  // Test 4: Non-existent asset (404)
  console.log('🔍 Test 4: Non-existent asset (404)');
  const notFoundUrl = new URL('https://example.com/assets/nonexistent.js');
  const notFoundContext = { url: notFoundUrl, env: mockEnv, corsHeaders };
  const notFoundResponse = await handleAssetsRoute(notFoundContext);

  if (notFoundResponse.status === 404) {
    const errorResponse = await notFoundResponse.json();
    if (errorResponse.error === 'Asset not found') {
      console.log('✅ Non-existent asset correctly returns 404');
    } else {
      throw new Error(`❌ 404 response has wrong error message: ${JSON.stringify(errorResponse, null, 2)}`);
    }
  } else {
    throw new Error(`❌ Non-existent asset returned wrong status: ${notFoundResponse.status}`);
  }

  // Test 5: CORS headers are present
  console.log('🔍 Test 5: CORS headers validation');
  const corsTestUrl = new URL('https://example.com/assets/main.js');
  const corsTestContext = { url: corsTestUrl, env: mockEnv, corsHeaders };
  const corsTestResponse = await handleAssetsRoute(corsTestContext);

  const allowOrigin = corsTestResponse.headers.get('Access-Control-Allow-Origin');
  const cacheControl = corsTestResponse.headers.get('Cache-Control');

  if (allowOrigin === '*' && cacheControl === 'public, max-age=86400') {
    console.log('✅ CORS and cache headers are correct');
  } else {
    throw new Error(`❌ CORS or cache headers incorrect. Allow-Origin: ${allowOrigin}, Cache-Control: ${cacheControl}`);
  }

  console.log('\n📋 Testing handleRemoteEntryRoute...');

  // Test 6: Valid remoteEntry.js
  console.log('🔍 Test 6: Valid remoteEntry.js');
  const remoteEntryContext = { env: mockEnv, corsHeaders };
  const remoteEntryResponse = await handleRemoteEntryRoute(remoteEntryContext);

  if (remoteEntryResponse.status === 200) {
    const content = await remoteEntryResponse.text();
    const contentType = remoteEntryResponse.headers.get('Content-Type');
    const cacheControl = remoteEntryResponse.headers.get('Cache-Control');

    if (content === 'console.log("Mock remoteEntry.js content");' &&
        contentType === 'application/javascript' &&
        cacheControl === 'public, max-age=3600') {
      console.log('✅ remoteEntry.js served correctly');
    } else {
      throw new Error(`❌ remoteEntry.js content or headers incorrect. Content: ${content}, Content-Type: ${contentType}, Cache-Control: ${cacheControl}`);
    }
  } else {
    throw new Error(`❌ remoteEntry.js returned wrong status: ${remoteEntryResponse.status}`);
  }

  // Test 7: Missing remoteEntry.js (simulate KV failure)
  console.log('🔍 Test 7: Missing remoteEntry.js');
  const mockEnvNoRemoteEntry = {
    MODULE_FEDERATION_ASSETS: {
      async get(key) {
        if (key === 'remoteEntry.js') {
          return null; // Simulate missing file
        }
        return 'some content';
      },
      async getWithMetadata(key) {
        const value = await this.get(key);
        if (!value) {
          return { value: null, metadata: null };
        }
        return {
          value: value,
          metadata: { contentType: 'text/plain' }
        };
      }
    }
  };

  const missingRemoteEntryContext = { env: mockEnvNoRemoteEntry, corsHeaders };
  const missingRemoteEntryResponse = await handleRemoteEntryRoute(missingRemoteEntryContext);

  if (missingRemoteEntryResponse.status === 404) {
    const errorResponse = await missingRemoteEntryResponse.json();
    if (errorResponse.error === 'Module Federation entry not found') {
      console.log('✅ Missing remoteEntry.js correctly returns 404');
    } else {
      throw new Error(`❌ 404 response has wrong error message: ${JSON.stringify(errorResponse, null, 2)}`);
    }
  } else {
    throw new Error(`❌ Missing remoteEntry.js returned wrong status: ${missingRemoteEntryResponse.status}`);
  }

  // Test 8: CORS headers in remoteEntry response
  console.log('🔍 Test 8: remoteEntry CORS headers validation');
  const remoteEntryCorsContext = { env: mockEnv, corsHeaders };
  const remoteEntryCorsResponse = await handleRemoteEntryRoute(remoteEntryCorsContext);

  const remoteEntryAllowOrigin = remoteEntryCorsResponse.headers.get('Access-Control-Allow-Origin');

  if (remoteEntryAllowOrigin === '*') {
    console.log('✅ remoteEntry CORS headers are correct');
  } else {
    throw new Error(`❌ remoteEntry CORS headers incorrect. Allow-Origin: ${remoteEntryAllowOrigin}`);
  }

  console.log('\n✅ ASSETS HANDLER TESTS PASSED');
  console.log('📋 All asset serving functions work correctly');
  console.log('📋 Proper error handling for missing assets');
  console.log('📋 Correct content types and caching headers');
  console.log('📋 CORS headers properly applied');
  console.log('✨ Test completed successfully');

})();
