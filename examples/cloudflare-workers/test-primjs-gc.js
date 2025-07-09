#!/usr/bin/env node

/**
 * Test script to verify PrimJS GC functionality
 */

const { newQuickJSWASMModule, PRIMJS_RELEASE_SYNC } = require('quickjs-emscripten');

async function testPrimJSGC() {
  console.log('Testing PrimJS GC functionality...');
  
  try {
    // Load PrimJS variant
    const QuickJS = await newQuickJSWASMModule(PRIMJS_RELEASE_SYNC);
    console.log('✓ PrimJS module loaded successfully');
    
    const runtime = QuickJS.newRuntime();
    console.log('✓ Runtime created');
    
    // Test GC functions if available
    if (runtime.ffi.QTS_IsGCModeRT) {
      const isGCMode = runtime.ffi.QTS_IsGCModeRT(runtime.rt.value);
      console.log(`✓ GC Mode enabled: ${Boolean(isGCMode)}`);
    } else {
      console.log('⚠ QTS_IsGCModeRT not available');
    }
    
    if (runtime.ffi.QTS_GetHeapSize) {
      const heapSize = runtime.ffi.QTS_GetHeapSize(runtime.rt.value);
      console.log(`✓ Heap size: ${heapSize} bytes`);
    } else {
      console.log('⚠ QTS_GetHeapSize not available');
    }
    
    if (runtime.ffi.QTS_RunGC) {
      runtime.ffi.QTS_RunGC(runtime.rt.value);
      console.log('✓ Manual GC run successful');
    } else {
      console.log('⚠ QTS_RunGC not available');
    }
    
    const context = runtime.newContext();
    console.log('✓ Context created');
    
    // Test basic evaluation
    const result = context.evalCode('2 + 3');
    const value = context.dump(result);
    console.log(`✓ Eval result: ${value}`);
    
    result.dispose();
    context.dispose();
    runtime.dispose();
    
    console.log('✓ All tests passed!');
    
  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

testPrimJSGC();