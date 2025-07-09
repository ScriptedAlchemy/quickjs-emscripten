import { newQuickJSWASMModule } from 'quickjs-emscripten';
import RELEASE_SYNC from '@jitl/primjs-wasmfile-release-sync';
import { Arena, defaultRegisteredObjects } from 'quickjs-emscripten-sync';

(async () => {
  console.log('Testing Arena with PrimJS...');
  
  try {
    const QuickJS = await newQuickJSWASMModule(RELEASE_SYNC);
    const vm = QuickJS.newContext();
    
    const arena = new Arena(vm, {
      isMarshalable: () => true,
      registeredObjects: defaultRegisteredObjects
    });
    
    // Test basic evaluation
    console.log('\n1. Testing basic evaluation:');
    const result1 = arena.evalCode('40 + 2');
    console.log('Result:', result1);
    console.log('Type:', typeof result1);
    
    // Test string evaluation
    console.log('\n2. Testing string evaluation:');
    const result2 = arena.evalCode('"Hello World"');
    console.log('Result:', result2);
    
    // Test object evaluation
    console.log('\n3. Testing object evaluation:');
    const result3 = arena.evalCode('({a: 1, b: "test"})');
    console.log('Result:', result3);
    
    // Test error handling
    console.log('\n4. Testing error handling:');
    try {
      const result4 = arena.evalCode('throw new Error("test error")');
      console.log('Result:', result4);
    } catch (e) {
      console.log('Caught error:', e.message);
    }
    
    // Test with exposed object
    console.log('\n5. Testing with exposed object:');
    arena.expose({
      testObj: { value: 42 }
    });
    const result5 = arena.evalCode('testObj.value');
    console.log('Result:', result5);
    
    vm.dispose();
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();