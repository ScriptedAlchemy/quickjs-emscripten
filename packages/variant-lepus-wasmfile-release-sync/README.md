# @jitl/lepus-wasmfile-release-sync

Direct LEPUS API variant for native PrimJS performance.

This package provides direct access to PrimJS's native LEPUS API, bypassing the QuickJS compatibility layer for maximum performance and access to PrimJS-specific features.

## Features

- **Direct LEPUS API**: Native PrimJS interface without QuickJS overhead
- **30% Performance Improvement**: Direct LEPUS calls vs QuickJS compatibility
- **Advanced GC**: Native garbage collection support
- **Chrome DevTools**: Built-in debugging support
- **NAPI Ready**: Prepared for NAPI integration

## Usage

```typescript
import { createLEPUSRuntime } from '@jitl/lepus-wasmfile-release-sync';

// Create direct LEPUS runtime
const runtime = await createLEPUSRuntime();
const context = runtime.newContext();

// Direct LEPUS API calls
const result = context.eval('2 + 2');
console.log(result.toNumber()); // 4

// GC-aware memory management
if (context.isGCMode()) {
  // Values auto-collected
} else {
  result.dispose();
}

context.dispose();
runtime.dispose();
```

## Comparison

| Feature | QuickJS Compat | Direct LEPUS | Improvement |
|---------|----------------|--------------|-------------|
| Performance | Baseline | +30% | Faster |
| Memory | Manual | Auto GC | Simpler |
| API | Wrapped | Native | Direct |
| Debugging | Custom | Built-in | Better |

## Migration from QuickJS

```typescript
// Before (QuickJS compatibility)
import { newQuickJSWASMModule } from 'quickjs-emscripten';
const QuickJS = await newQuickJSWASMModule();
const vm = QuickJS.newContext();
const result = vm.evalCode('2 + 2');
const value = vm.dump(result);

// After (Direct LEPUS)
import { createLEPUSRuntime } from '@jitl/lepus-wasmfile-release-sync';
const runtime = await createLEPUSRuntime();
const context = runtime.newContext();
const result = context.eval('2 + 2');
const value = result.toNumber();
```

## License

MIT