/* eslint-disable */
/* eslint-env node */
// Test: Arena async demonstration with proper promise handling

import { newQuickJSWASMModule, RELEASE_SYNC } from 'quickjs-emscripten';
import { Arena } from 'quickjs-emscripten-sync';

(async () => {
  console.log('🚀 Arena async test');

  const QuickJS = await newQuickJSWASMModule(RELEASE_SYNC);
  const vm = QuickJS.newContext();
  const arena = new Arena(vm, { isMarshalable: true });

  try {
    // Simple async function that returns a Promise
    const simpleAsync = async (message) => {
      console.log(`[Host] Processing: ${message}`);
      await new Promise(resolve => setTimeout(resolve, 50));
      return `Processed: ${message}`;
    };

    // Expose to QuickJS
    arena.expose({
      console: { log: (...args) => console.log('[QuickJS]', ...args) },
      simpleAsync
    });

    // Test 1: Simple async call
    console.log('=== Test 1: Simple async ===');
    arena.evalCode(`
      console.log('Calling simpleAsync...');
      simpleAsync('Hello from QuickJS').then(result => {
        console.log('Got result:', result);
        globalThis.test1Result = result;
      });
    `);

    // Wait for promise to resolve
    let attempts = 0;
    while (attempts < 20) {
      arena.executePendingJobs();
      const result = arena.evalCode('globalThis.test1Result');
      if (result) {
        console.log('✅ Test 1 completed:', result);
        break;
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Test 2: Fetch-like operation
    console.log('\n=== Test 2: Fetch-like operation ===');

    const mockFetch = async (url) => {
      console.log(`[Host] Mock fetching: ${url}`);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Return a response-like object
      return {
        ok: true,
        status: 200,
        json: async () => ({
          userId: 1,
          title: "delectus aut autem from Arena",
          completed: false
        })
      };
    };

    arena.expose({ mockFetch });

    arena.evalCode(`
      console.log('Starting mock fetch...');
      mockFetch('https://api.example.com/todos/1')
        .then(response => {
          console.log('Got response, calling json()...');
          return response.json();
        })
        .then(data => {
          console.log('JSON data:', JSON.stringify(data));
          globalThis.fetchResult = data.title;
        });
    `);

    // Wait for fetch to complete
    attempts = 0;
    while (attempts < 30) {
      arena.executePendingJobs();
      const result = arena.evalCode('globalThis.fetchResult');
      if (result) {
        console.log('✅ Test 2 completed! Title:', result);
        break;
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    if (attempts >= 30) {
      console.log('⚠️ Test 2 timed out');
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    arena.dispose();
    vm.dispose();
    console.log('✨ Test completed');
  }
})();
