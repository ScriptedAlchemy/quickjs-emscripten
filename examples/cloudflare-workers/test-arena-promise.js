import { newQuickJSWASMModule } from 'quickjs-emscripten';
import RELEASE_SYNC from '@jitl/primjs-wasmfile-release-sync';
import { Arena } from 'quickjs-emscripten-sync';

async function waitForQuickJS(runtime, donePromise) {
  let isComplete = false;
  donePromise.then(() => { isComplete = true; });
  
  while (!isComplete) {
    await new Promise(resolve => setImmediate(resolve));
    const jobs = runtime.executePendingJobs();
    if (jobs.error) {
      runtime.dump(jobs.error);
      jobs.error.dispose();
      throw new Error('QuickJS runtime error during job execution');
    }
  }
}

(async () => {
  console.log('Testing promise resolution with PrimJS...');
  
  try {
    const QuickJS = await newQuickJSWASMModule(RELEASE_SYNC);
    const vm = QuickJS.newContext();
    
    const arena = new Arena(vm, {
      isMarshalable: () => true
    });
    
    // Set up deferred promise
    const setupResult = arena.evalCode(`
      globalThis.__testDeferred = {};
      globalThis.__testFinished = new Promise((resolve) => {
        globalThis.__testDeferred.resolve = resolve;
      });
    `);
    console.log('Setup result:', setupResult);
    
    // Resolve with test data
    const resolveResult = arena.evalCode(`
      setTimeout(() => {
        globalThis.__testDeferred.resolve({
          message: "Hello from promise!",
          success: true
        });
      }, 100);
    `);
    console.log('Resolve setup result:', resolveResult);
    
    // Get promise handle
    const promiseHandle = vm.getProp(vm.global, '__testFinished');
    if (!promiseHandle) {
      throw new Error('Failed to get promise handle');
    }
    
    const nativePromise = vm.resolvePromise(promiseHandle);
    promiseHandle.dispose();
    
    console.log('Waiting for promise...');
    await waitForQuickJS(vm.runtime, nativePromise);
    
    const result = await nativePromise;
    console.log('Promise result:', result);
    console.log('Result type:', typeof result);
    console.log('Result constructor:', result?.constructor?.name);
    
    // Try to extract value
    if (result && typeof result === 'object' && 'value' in result) {
      console.log('Has value property, dumping...');
      const dumped = vm.dump(result.value);
      console.log('Dumped value:', dumped);
      if (result.value._alive !== false) {
        result.value.dispose();
      }
    }
    
    vm.dispose();
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (error && error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
})();