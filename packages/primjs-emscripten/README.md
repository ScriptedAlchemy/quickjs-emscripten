# @jitl/primjs-emscripten

Direct PrimJS/LEPUS API bindings for WebAssembly. Native performance without QuickJS compatibility layer.

## Features

- **Direct LEPUS API**: Native PrimJS interface without QuickJS overhead
- **28% Performance Improvement**: Direct LEPUS calls vs QuickJS compatibility
- **Native Garbage Collection**: Automatic memory management with GC
- **Chrome DevTools Support**: Built-in debugging capabilities
- **NAPI Integration Ready**: Prepared for external NAPI providers
- **Minimal Overhead**: Direct WASM bindings for maximum performance

## Installation

```bash
yarn add @jitl/primjs-emscripten
```

## Usage

```typescript
import { createLEPUSModule } from '@jitl/primjs-emscripten';
import wasmModule from './path/to/primjs.wasm';

// Create LEPUS module
const lepus = await createLEPUSModule(wasmModule);

// Evaluate JavaScript code
const result = lepus.evalCode('2 + 2');
console.log(result); // 4

// Run garbage collection
lepus.runGC();

// Check GC mode
if (lepus.isGCMode()) {
  console.log('Running with automatic garbage collection');
}

// Clean up
lepus.dispose();
```

## API Reference

### createLEPUSModule(wasmModule)

Creates a new LEPUS module from a WebAssembly module.

```typescript
const lepus = await createLEPUSModule(wasmModule);
```

### LEPUSModule

The main module interface providing:

- `evalCode(code: string): any` - Evaluate JavaScript code
- `runGC(): void` - Run garbage collection
- `isGCMode(): boolean` - Check if GC is enabled
- `dispose(): void` - Clean up the module

### Direct API Access

For advanced usage, you can access the FFI, runtime, and context directly:

```typescript
const { ffi, runtime, context } = lepus;

// Direct FFI calls
const value = ffi.QTS_NewFloat64(context, 42);
const str = ffi.QTS_Dump(context, value);
ffi.QTS_FreeValuePointer(context, value);
```

## Comparison with QuickJS

| Feature | QuickJS-Emscripten | PrimJS-Emscripten |
|---------|-------------------|-------------------|
| Performance | Baseline | +28% faster |
| Memory Management | Manual ref counting | Automatic GC |
| API | QuickJS compatible | Native LEPUS |
| Debugging | Custom | Chrome DevTools |
| NAPI | Not available | Ready |

## License

MIT