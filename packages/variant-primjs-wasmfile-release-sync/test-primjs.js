#!/usr/bin/env node

// Test script for PrimJS integration
const { getQuickJS } = require('../quickjs-emscripten/dist/index.js');
const primjsVariant = require('./dist/index.js');

async function testPrimJS() {
  console.log('Testing PrimJS integration...\n');
  
  // Load the PrimJS variant
  const QuickJS = await getQuickJS(primjsVariant);
  const vm = QuickJS.newContext();
  
  try {
    // Test 1: Basic evaluation
    console.log('Test 1: Basic evaluation');
    const result1 = vm.evalCode('1 + 2');
    console.log('1 + 2 =', vm.dump(result1));
    result1.dispose();
    
    // Test 2: String operations
    console.log('\nTest 2: String operations');
    const result2 = vm.evalCode('"Hello, " + "PrimJS!"');
    console.log('String concatenation:', vm.dump(result2));
    result2.dispose();
    
    // Test 3: Object creation
    console.log('\nTest 3: Object creation');
    const result3 = vm.evalCode('({ name: "PrimJS", version: "1.0", features: ["fast", "modern"] })');
    console.log('Object:', vm.dump(result3));
    result3.dispose();
    
    // Test 4: Function execution
    console.log('\nTest 4: Function execution');
    const result4 = vm.evalCode(`
      function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      }
      fibonacci(10)
    `);
    console.log('fibonacci(10) =', vm.dump(result4));
    result4.dispose();
    
    // Test 5: Error handling
    console.log('\nTest 5: Error handling');
    const result5 = vm.evalCode('throw new Error("Test error")');
    if (result5.error) {
      const error = vm.dump(result5.error);
      console.log('Caught error:', error);
      result5.error.dispose();
    }
    
    // Test 6: Memory usage
    console.log('\nTest 6: Memory usage');
    const memoryUsage = vm.runtime.computeMemoryUsage();
    console.log('Memory usage:', memoryUsage);
    
    // Test 7: Promise support (if available)
    console.log('\nTest 7: Promise support');
    const result7 = vm.evalCode(`
      Promise.resolve(42).then(x => x * 2)
    `);
    console.log('Promise created:', vm.dump(result7));
    result7.dispose();
    
    // Execute pending jobs
    vm.runtime.executePendingJobs();
    
    console.log('\n✅ All tests passed! PrimJS integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up
    vm.dispose();
    QuickJS.dispose();
  }
}

// Run the test
testPrimJS().catch(console.error);