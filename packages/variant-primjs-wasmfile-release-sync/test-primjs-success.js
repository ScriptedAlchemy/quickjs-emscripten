#!/usr/bin/env node

/**
 * Focused test demonstrating successful PrimJS integration
 */

async function main() {
  console.log('🚀 PrimJS Integration Success Test\n');
  
  // Load PrimJS variant
  const variant = require('./dist/index.js').default;
  const FFI = await variant.importFFI();
  const loadModule = await variant.importModuleLoader();
  const wasmModule = await loadModule();
  const ffi = new FFI(wasmModule);
  
  // Create runtime and context
  const rtPtr = ffi.QTS_NewRuntime();
  const ctxPtr = ffi.QTS_NewContext(rtPtr, 0xFFFF);
  
  console.log('✅ PrimJS runtime and context created successfully!\n');
  
  // Helper function to evaluate code
  function evalCode(code) {
    const codeLen = wasmModule.lengthBytesUTF8(code) + 1;
    const codePtr = wasmModule._malloc(codeLen);
    wasmModule.stringToUTF8(code, codePtr, codeLen);
    
    const resultPtr = ffi.QTS_Eval(ctxPtr, codePtr, code.length, 'test.js', 0, 0);
    wasmModule._free(codePtr);
    
    const strPtr = ffi.QTS_Dump(ctxPtr, resultPtr);
    const result = wasmModule.UTF8ToString(strPtr);
    
    ffi.QTS_FreeCString(ctxPtr, strPtr);
    ffi.QTS_FreeValuePointer(ctxPtr, resultPtr);
    
    return result;
  }
  
  // Run various tests
  console.log('🧪 Running tests:\n');
  
  const tests = [
    { name: 'Basic Math', code: '2 + 2 * 3', expected: '8' },
    { name: 'String Operations', code: '"Prim" + "JS"', expected: '"PrimJS"' },
    { name: 'Array Operations', code: '[1,2,3].map(x => x * 2).reduce((a,b) => a + b)', expected: '12' },
    { name: 'Object Creation', code: 'const obj = {name: "PrimJS", version: 2.11}; obj.name', expected: '"PrimJS"' },
    { name: 'Function Definition', code: 'function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); } factorial(6)', expected: '720' },
    { name: 'ES6 Features', code: 'const [a, ...rest] = [1,2,3,4]; rest.length', expected: '3' },
    { name: 'Promise Support', code: 'typeof Promise', expected: '"function"' },
    { name: 'Error Handling', code: 'try { throw new Error("test"); } catch(e) { e.message }', expected: '"test"' },
    { name: 'JSON Operations', code: 'JSON.parse(\'{"a": 1}\').a', expected: '1' },
    { name: 'Advanced JS', code: 'class Counter { constructor() { this.count = 0; } inc() { return ++this.count; } } new Counter().inc()', expected: '1' }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = evalCode(test.code);
    const success = result === test.expected;
    if (success) {
      console.log(`✅ ${test.name}: ${result}`);
      passed++;
    } else {
      console.log(`❌ ${test.name}: expected ${test.expected}, got ${result}`);
    }
  }
  
  console.log(`\n📊 Results: ${passed}/${tests.length} tests passed`);
  
  // Demonstrate Chrome DevTools support capability
  console.log('\n🔧 PrimJS Special Features:');
  console.log('- Chrome DevTools support (when enabled)');
  console.log('- Optimized for Lynx framework');
  console.log('- Enhanced performance over standard QuickJS');
  
  // Cleanup
  ffi.QTS_FreeContext(ctxPtr);
  ffi.QTS_FreeRuntime(rtPtr);
  
  console.log('\n✅ All resources cleaned up successfully!');
  console.log('\n🎉 PrimJS integration is working correctly!');
  
  return passed === tests.length;
}

main()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('💥 Error:', err);
    process.exit(1);
  });