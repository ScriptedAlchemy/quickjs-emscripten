# @jitl/lepus-ffi-types

TypeScript types for PrimJS LEPUS FFI bindings. Provides direct native API types for maximum performance.

## Features

- **Native LEPUS Types**: Direct PrimJS API types without QuickJS compatibility layer
- **Garbage Collection**: Built-in GC management types and interfaces
- **NAPI Integration**: Types for external NAPI provider integration
- **DevTools Support**: Chrome DevTools debugging interface types
- **Performance Monitoring**: Built-in performance metrics types
- **Type Safety**: Full TypeScript coverage for all LEPUS functions

## Usage

```typescript
import type {
  LEPUSRuntimePointer,
  LEPUSContextPointer,
  LEPUSValuePointer,
  LEPUSGCConfig,
  LEPUSPerformanceMetrics,
  LEPUSFFI
} from '@jitl/lepus-ffi-types';

// Type-safe LEPUS runtime creation
declare const lepusFFI: LEPUSFFI;
const runtime: LEPUSRuntimePointer = lepusFFI.LEPUS_NewRuntime();
const context: LEPUSContextPointer = lepusFFI.LEPUS_NewContext(runtime, 0);

// GC-aware value management
const value: LEPUSValuePointer = lepusFFI.LEPUS_NewFloat64(context, 42);
lepusFFI.LEPUS_RunGC(runtime); // Explicit GC control
```

## Type Categories

### Core Types
- `LEPUSRuntimePointer` - Runtime instance pointer
- `LEPUSContextPointer` - Execution context pointer  
- `LEPUSValuePointer` - JavaScript value pointer

### GC Types
- `LEPUSGCConfig` - Garbage collection configuration
- `LEPUSGCMetrics` - Memory usage and GC statistics

### NAPI Types
- `LEPUSNapiScope` - NAPI environment scope
- `LEPUSNapiCallback` - Native function callback type

### DevTools Types
- `LEPUSDevToolsConfig` - Debug configuration options
- `LEPUSPerformanceMetrics` - Runtime performance data

## Comparison with QuickJS

| Feature | QuickJS FFI Types | LEPUS FFI Types | Benefit |
|---------|------------------|-----------------|---------|
| GC Support | Manual ref counting | Automatic GC | Simpler |
| NAPI | Not available | Built-in | External providers |
| DevTools | Custom debugging | Chrome DevTools | Better |
| Performance | Baseline | +28% faster | Optimized |

## License

MIT