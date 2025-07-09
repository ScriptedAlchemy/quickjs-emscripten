import { newQuickJSWASMModule } from 'quickjs-emscripten';
import RELEASE_SYNC from '@jitl/primjs-wasmfile-release-sync';
import { Arena, defaultRegisteredObjects } from 'quickjs-emscripten-sync';

(async () => {
  console.log('Testing Arena async behavior with PrimJS...');
  
  try {
    const QuickJS = await newQuickJSWASMModule(RELEASE_SYNC);
    const vm = QuickJS.newContext();
    
    const arena = new Arena(vm, {
      isMarshalable: () => true,
      registeredObjects: defaultRegisteredObjects
    });
    
    // Test promise handling
    console.log('\n1. Testing promise creation:');
    const promiseCode = `
      new Promise((resolve) => {
        resolve("Hello from promise");
      })
    `;
    const promiseResult = arena.evalCode(promiseCode);
    console.log('Promise result:', promiseResult);
    console.log('Type:', typeof promiseResult);
    
    // Test deferred pattern
    console.log('\n2. Testing deferred pattern:');
    arena.expose({
      __testDeferred: {}
    });
    
    arena.evalCode(`
      globalThis.__testPromise = new Promise((resolve) => {
        globalThis.__testDeferred.resolve = resolve;
      });
    `);
    
    const hasPromise = arena.evalCode('typeof globalThis.__testPromise');
    console.log('Has promise:', hasPromise);
    
    // Resolve the promise
    arena.evalCode('globalThis.__testDeferred.resolve("Resolved!")');
    
    // Try to get the promise
    const promiseHandle = vm.getProp(vm.global, '__testPromise');
    console.log('Promise handle:', promiseHandle);
    
    if (promiseHandle && typeof promiseHandle.dispose === 'function') {
      console.log('Promise handle is valid');
      promiseHandle.dispose();
    }
    
    vm.dispose();
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();