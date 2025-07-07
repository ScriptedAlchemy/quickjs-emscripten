# How to Use PrimJS with quickjs-emscripten

## Table of Contents
- [Introduction](#introduction)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Available Variants](#available-variants)
- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
- [API Differences](#api-differences)
- [Performance Considerations](#performance-considerations)
- [Chrome DevTools Support](#chrome-devtools-support)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)

## Introduction

PrimJS is a QuickJS derivative optimized for the Lynx framework, offering better performance and Chrome DevTools support. It has been integrated into quickjs-emscripten as a third JavaScript engine option alongside QuickJS and QuickJS-NG.

### Key Features
- ✅ Full ES2020+ support
- ✅ Chrome DevTools integration capability
- ✅ Optimized garbage collector
- ✅ Better performance for Lynx framework
- ✅ 100% compatible with quickjs-emscripten API

## Quick Start

The easiest way to get started with PrimJS is using the quickstart script:

```bash
# Clone the repository
git clone https://github.com/justjake/quickjs-emscripten.git
cd quickjs-emscripten

# Run the quickstart script
./primjs-quickstart.sh

# Select option 1 for full setup
```

## Installation

### Using npm/yarn

```bash
# Install a specific PrimJS variant
npm install @jitl/primjs-wasmfile-release-sync

# Or with yarn
yarn add @jitl/primjs-wasmfile-release-sync
```

### Building from Source

```bash
# Install dependencies
yarn install

# Initialize submodules (including PrimJS)
git submodule update --init --recursive

# Generate build configurations
yarn generate

# Build all variants
yarn build

# Or build specific PrimJS variants
yarn workspace @jitl/primjs-wasmfile-release-sync build
```

## Available Variants

PrimJS comes in 16 different variants to suit various use cases:

### WASM File Variants (Recommended for Web)
- `@jitl/primjs-wasmfile-release-sync` - Production, synchronous
- `@jitl/primjs-wasmfile-release-asyncify` - Production, with async/await support
- `@jitl/primjs-wasmfile-debug-sync` - Debug build, synchronous
- `@jitl/primjs-wasmfile-debug-asyncify` - Debug build, with async/await

### Single File Variants (CommonJS)
- `@jitl/primjs-singlefile-cjs-release-sync`
- `@jitl/primjs-singlefile-cjs-release-asyncify`
- `@jitl/primjs-singlefile-cjs-debug-sync`
- `@jitl/primjs-singlefile-cjs-debug-asyncify`

### Single File Variants (ES Modules)
- `@jitl/primjs-singlefile-mjs-release-sync`
- `@jitl/primjs-singlefile-mjs-release-asyncify`
- `@jitl/primjs-singlefile-mjs-debug-sync`
- `@jitl/primjs-singlefile-mjs-debug-asyncify`

### asm.js Variants (No WASM required)
- `@jitl/primjs-asmjs-mjs-release-sync`
- `@jitl/primjs-asmjs-mjs-debug-sync`
- `@jitl/primjs-asmjs-cjs-release-sync`
- `@jitl/primjs-asmjs-cjs-debug-sync`

## Basic Usage

### Using with quickjs-emscripten High-Level API

```javascript
import { getQuickJS } from 'quickjs-emscripten';
import primjsVariant from '@jitl/primjs-wasmfile-release-sync';

async function main() {
  // Load PrimJS instead of default QuickJS
  const QuickJS = await getQuickJS(primjsVariant);
  
  // Create a runtime
  const vm = QuickJS.createVm();
  
  // Evaluate some code
  const result = vm.evalCode(`
    const fibonacci = (n) => {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    };
    fibonacci(10);
  `);
  
  if (result.error) {
    console.error('Error:', vm.dump(result.error));
    result.error.dispose();
  } else {
    console.log('Result:', vm.dump(result.value)); // 55
    result.value.dispose();
  }
  
  // Clean up
  vm.dispose();
}

main();
```

### Using the Low-Level FFI API

```javascript
import primjsVariant from '@jitl/primjs-wasmfile-release-sync';

async function lowLevelExample() {
  // Import FFI and module loader
  const FFI = await primjsVariant.importFFI();
  const loadModule = await primjsVariant.importModuleLoader();
  
  // Load WASM module
  const wasmModule = await loadModule();
  const ffi = new FFI(wasmModule);
  
  // Create runtime and context
  const rtPtr = ffi.QTS_NewRuntime();
  const ctxPtr = ffi.QTS_NewContext(rtPtr, 0xFFFF); // Enable all intrinsics
  
  // Evaluate code
  const code = '1 + 2 * 3';
  const codePtr = wasmModule.allocateUTF8(code);
  const resultPtr = ffi.QTS_Eval(ctxPtr, codePtr, code.length, 'eval.js', 0, 0);
  wasmModule._free(codePtr);
  
  // Get result
  const resultStrPtr = ffi.QTS_Dump(ctxPtr, resultPtr);
  const result = wasmModule.UTF8ToString(resultStrPtr);
  console.log('Result:', result); // 7
  
  // Cleanup
  ffi.QTS_FreeCString(ctxPtr, resultStrPtr);
  ffi.QTS_FreeValuePointer(ctxPtr, resultPtr);
  ffi.QTS_FreeContext(ctxPtr);
  ffi.QTS_FreeRuntime(rtPtr);
}

lowLevelExample();
```

## Advanced Usage

### Working with Objects and Functions

```javascript
import { getQuickJS } from 'quickjs-emscripten';
import primjsVariant from '@jitl/primjs-wasmfile-release-sync';

async function advancedExample() {
  const QuickJS = await getQuickJS(primjsVariant);
  const vm = QuickJS.createVm();
  
  // Create a native function
  const consoleLog = vm.newFunction('log', (...args) => {
    const nativeArgs = args.map(arg => vm.dump(arg));
    console.log('[PrimJS]:', ...nativeArgs);
  });
  
  // Add to global object
  vm.setProp(vm.global, 'console', vm.newObject());
  vm.setProp(vm.getProp(vm.global, 'console'), 'log', consoleLog);
  consoleLog.dispose();
  
  // Use it from JavaScript
  vm.evalCode(`
    console.log('Hello from PrimJS!');
    
    class Person {
      constructor(name) {
        this.name = name;
      }
      
      greet() {
        console.log(\`Hi, I'm \${this.name}\`);
      }
    }
    
    const person = new Person('Alice');
    person.greet();
  `);
  
  vm.dispose();
}

advancedExample();
```

### Memory Management

```javascript
import { getQuickJS } from 'quickjs-emscripten';
import primjsVariant from '@jitl/primjs-wasmfile-release-sync';

async function memoryExample() {
  const QuickJS = await getQuickJS(primjsVariant);
  const vm = QuickJS.createVm();
  
  // Set memory limit (in bytes)
  vm.runtime.setMemoryLimit(1024 * 1024 * 50); // 50MB
  
  // Set max stack size
  vm.runtime.setMaxStackSize(1024 * 512); // 512KB
  
  // Monitor memory usage
  const checkMemory = () => {
    const usage = vm.runtime.computeMemoryUsage();
    console.log('Memory usage:', usage);
  };
  
  // Create some objects
  vm.evalCode(`
    const bigArray = new Array(10000).fill(0).map((_, i) => ({
      index: i,
      data: 'x'.repeat(100)
    }));
  `);
  
  checkMemory();
  
  // Force garbage collection (if available in debug builds)
  vm.evalCode(`
    if (typeof gc === 'function') gc();
  `);
  
  checkMemory();
  
  vm.dispose();
}

memoryExample();
```

## API Differences

PrimJS is designed to be a drop-in replacement for QuickJS in quickjs-emscripten. The high-level API is identical. At the low-level:

### PrimJS Native API (C/C++)
- Uses `LEPUS_` prefix instead of `JS_` 
- Example: `LEPUS_NewContext` vs `JS_NewContext`

### quickjs-emscripten FFI
- The FFI layer automatically handles the mapping
- You still use `QTS_` prefixed functions
- No code changes needed when switching engines

## Performance Considerations

PrimJS offers several performance improvements:

1. **Optimized GC**: Better garbage collection for long-running applications
2. **Lynx Framework**: Specifically optimized for Lynx use cases
3. **Chrome DevTools**: When enabled, provides profiling capabilities

### Benchmark Example

```javascript
import { getQuickJS } from 'quickjs-emscripten';
import quickjsVariant from '@jitl/quickjs-wasmfile-release-sync';
import primjsVariant from '@jitl/primjs-wasmfile-release-sync';

async function benchmark() {
  const iterations = 100000;
  const code = `
    let sum = 0;
    for (let i = 0; i < ${iterations}; i++) {
      sum += i;
    }
    sum;
  `;
  
  // Test QuickJS
  const QuickJS = await getQuickJS(quickjsVariant);
  const vm1 = QuickJS.createVm();
  
  console.time('QuickJS');
  vm1.evalCode(code);
  console.timeEnd('QuickJS');
  vm1.dispose();
  
  // Test PrimJS
  const PrimJS = await getQuickJS(primjsVariant);
  const vm2 = PrimJS.createVm();
  
  console.time('PrimJS');
  vm2.evalCode(code);
  console.timeEnd('PrimJS');
  vm2.dispose();
}

benchmark();
```

## Chrome DevTools Support

PrimJS includes Chrome DevTools support (when enabled in build). This allows for:
- JavaScript debugging
- Performance profiling
- Memory profiling

Note: DevTools support requires additional setup and is primarily useful during development.

## Migration Guide

### From QuickJS to PrimJS

1. **Change your import**:
   ```javascript
   // Before
   import variant from '@jitl/quickjs-wasmfile-release-sync';
   
   // After
   import variant from '@jitl/primjs-wasmfile-release-sync';
   ```

2. **No other code changes needed!** The API is identical.

### Choosing the Right Variant

- **For production web apps**: Use `primjs-wasmfile-release-sync`
- **For Node.js servers**: Use `primjs-singlefile-cjs-release-sync`
- **For debugging**: Use any `debug` variant
- **For async/await support**: Use any `asyncify` variant

## Troubleshooting

### Common Issues

1. **Module not found**
   ```bash
   # Make sure you've built the variants
   yarn generate
   yarn build
   ```

2. **WASM file not loading**
   - Ensure your web server serves `.wasm` files with correct MIME type
   - Check CORS settings if loading from different domain

3. **Memory errors**
   - Increase memory limit: `vm.runtime.setMemoryLimit(bytes)`
   - Check for memory leaks - always dispose objects

4. **Performance issues**
   - Use release builds for production
   - Consider asyncify variants for I/O heavy operations
   - Profile with Chrome DevTools (debug builds)

### Getting Help

- Check the [quickjs-emscripten documentation](https://github.com/justjake/quickjs-emscripten)
- Report PrimJS-specific issues on the [PrimJS repository](https://github.com/lynx-family/primjs)
- Join the community discussions

## Example Projects

### Simple REPL

```javascript
import { getQuickJS } from 'quickjs-emscripten';
import primjsVariant from '@jitl/primjs-wasmfile-release-sync';
import * as readline from 'readline';

async function createRepl() {
  const QuickJS = await getQuickJS(primjsVariant);
  const vm = QuickJS.createVm();
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'primjs> '
  });
  
  console.log('PrimJS REPL - Type ".exit" to quit');
  rl.prompt();
  
  rl.on('line', (line) => {
    if (line.trim() === '.exit') {
      rl.close();
      vm.dispose();
      return;
    }
    
    const result = vm.evalCode(line);
    if (result.error) {
      console.error('Error:', vm.dump(result.error));
      result.error.dispose();
    } else {
      console.log(vm.dump(result.value));
      result.value.dispose();
    }
    
    rl.prompt();
  });
}

createRepl();
```

### Web Worker Example

```javascript
// worker.js
import { getQuickJS } from 'quickjs-emscripten';
import primjsVariant from '@jitl/primjs-wasmfile-release-sync';

let vm;

self.addEventListener('message', async (event) => {
  if (!vm) {
    const QuickJS = await getQuickJS(primjsVariant);
    vm = QuickJS.createVm();
  }
  
  const { code, id } = event.data;
  const result = vm.evalCode(code);
  
  if (result.error) {
    self.postMessage({
      id,
      error: vm.dump(result.error)
    });
    result.error.dispose();
  } else {
    self.postMessage({
      id,
      result: vm.dump(result.value)
    });
    result.value.dispose();
  }
});
```

## Conclusion

PrimJS provides a powerful, performant alternative to QuickJS within the quickjs-emscripten ecosystem. With its Chrome DevTools support and Lynx framework optimizations, it's an excellent choice for applications requiring advanced debugging capabilities or specific performance characteristics.

Start with the quickstart script and explore the various variants to find the best fit for your use case!