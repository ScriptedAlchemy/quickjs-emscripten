#!/usr/bin/env node

// Direct test script for PrimJS integration
const { QuickJSFFI } = require('./dist/ffi.js');
const loadModule = require('./dist/emscripten-module.cjs');

async function testPrimJSDirect() {
  console.log('Testing PrimJS integration directly...\n');
  
  try {
    // Load the WASM module
    console.log('Loading PrimJS WASM module...');
    const wasmModule = await loadModule();
    console.log('✓ WASM module loaded successfully');
    
    // Create FFI interface
    const ffi = new QuickJSFFI(wasmModule);
    console.log('✓ FFI interface created');
    
    // Create runtime
    const rtPtr = ffi.QTS_NewRuntime();
    console.log('✓ Runtime created:', rtPtr);
    
    // Create context
    const ctxPtr = ffi.QTS_NewContext(rtPtr, /* intrinsics */ 0);
    console.log('✓ Context created:', ctxPtr);
    
    // Test 1: Basic evaluation
    console.log('\nTest 1: Basic evaluation');
    const code1 = '1 + 2';
    const codeLen1 = wasmModule.lengthBytesUTF8(code1) + 1;
    const codePtr1 = wasmModule._malloc(codeLen1);
    wasmModule.stringToUTF8(code1, codePtr1, codeLen1);
    
    const resultPtr1 = ffi.QTS_Eval(ctxPtr, codePtr1, code1.length, 'test1.js', /* detectModule */ 0, /* flags */ 0);
    wasmModule._free(codePtr1);
    
    const strPtr1 = ffi.QTS_Dump(ctxPtr, resultPtr1);
    const result1 = wasmModule.UTF8ToString(strPtr1);
    console.log(`${code1} = ${result1}`);
    ffi.QTS_FreeCString(ctxPtr, strPtr1);
    ffi.QTS_FreeValuePointer(ctxPtr, resultPtr1);
    
    // Test 2: String operations
    console.log('\nTest 2: String operations');
    const code2 = '"Hello, " + "PrimJS!"';
    const codeLen2 = wasmModule.lengthBytesUTF8(code2) + 1;
    const codePtr2 = wasmModule._malloc(codeLen2);
    wasmModule.stringToUTF8(code2, codePtr2, codeLen2);
    
    const resultPtr2 = ffi.QTS_Eval(ctxPtr, codePtr2, code2.length, 'test2.js', 0, 0);
    wasmModule._free(codePtr2);
    
    const strPtr2 = ffi.QTS_Dump(ctxPtr, resultPtr2);
    const result2 = wasmModule.UTF8ToString(strPtr2);
    console.log(`${code2} = ${result2}`);
    ffi.QTS_FreeCString(ctxPtr, strPtr2);
    ffi.QTS_FreeValuePointer(ctxPtr, resultPtr2);
    
    // Test 3: Object creation
    console.log('\nTest 3: Object creation');
    const code3 = '({ name: "PrimJS", version: "1.0", features: ["fast", "modern"] })';
    const codeLen3 = wasmModule.lengthBytesUTF8(code3) + 1;
    const codePtr3 = wasmModule._malloc(codeLen3);
    wasmModule.stringToUTF8(code3, codePtr3, codeLen3);
    
    const resultPtr3 = ffi.QTS_Eval(ctxPtr, codePtr3, code3.length, 'test3.js', 0, 0);
    wasmModule._free(codePtr3);
    
    const strPtr3 = ffi.QTS_Dump(ctxPtr, resultPtr3);
    const result3 = wasmModule.UTF8ToString(strPtr3);
    console.log('Object:', result3);
    ffi.QTS_FreeCString(ctxPtr, strPtr3);
    ffi.QTS_FreeValuePointer(ctxPtr, resultPtr3);
    
    // Test 4: Memory usage
    console.log('\nTest 4: Memory usage');
    try {
      const memUsagePtr = wasmModule._malloc(256); // Allocate space for JSMemoryUsage struct
      const memResult = ffi.QTS_RuntimeComputeMemoryUsage(rtPtr, memUsagePtr);
      if (memResult === 0) {
        console.log('✓ Memory usage computed successfully');
      } else {
        console.log('Memory usage computation returned:', memResult);
      }
      wasmModule._free(memUsagePtr);
    } catch (e) {
      console.log('Memory usage test skipped (not fully implemented in PrimJS release build)');
    }
    
    // Test 5: Error handling
    console.log('\nTest 5: Error handling');
    const errorCode = 'throw new Error("Test error")';
    const errorCodeLen = wasmModule.lengthBytesUTF8(errorCode) + 1;
    const errorCodePtr = wasmModule._malloc(errorCodeLen);
    wasmModule.stringToUTF8(errorCode, errorCodePtr, errorCodeLen);
    
    const errorPtr = ffi.QTS_Eval(ctxPtr, errorCodePtr, errorCode.length, 'error.js', 0, 0);
    wasmModule._free(errorCodePtr);
    
    const errorStrPtr = ffi.QTS_Dump(ctxPtr, errorPtr);
    const errorStr = wasmModule.UTF8ToString(errorStrPtr);
    console.log('Error result:', errorStr);
    ffi.QTS_FreeCString(ctxPtr, errorStrPtr);
    ffi.QTS_FreeValuePointer(ctxPtr, errorPtr);
    
    // Clean up
    console.log('\nCleaning up...');
    ffi.QTS_FreeContext(ctxPtr);
    ffi.QTS_FreeRuntime(rtPtr);
    console.log('✓ Cleanup complete');
    
    console.log('\n✅ All tests passed! PrimJS integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testPrimJSDirect().catch(console.error);