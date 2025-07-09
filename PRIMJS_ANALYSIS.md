# PrimJS Analysis and API Discovery

## Overview

PrimJS is a high-performance JavaScript engine built by the Lynx cross-platform framework team as an enhanced derivative of QuickJS. It provides significant performance improvements, better development experience, and Chrome DevTools Protocol (CDP) support for debugging.

## Key Features and Improvements

### Performance Enhancements
- **Template Interpreter**: Leverages stack caching and register optimizations
- **28% Performance Improvement**: Outperforms QuickJS by approximately 28% overall (3735 vs 2904 on Octane Benchmark)
- **Garbage Collection**: Uses GC instead of QuickJS's reference counting for better memory management and reduced leak risk

### Development Experience
- **Chrome DevTools Support**: Full CDP implementation for seamless Chrome debugger integration
- **Better Memory Analysis**: Enhanced memory analyzability through GC-based memory management
- **ES2019 Support**: Full compliance with ES2019 specifications

## API Architecture and Compatibility

### LEPUS API vs QuickJS API

PrimJS introduces the **LEPUS** API as its native interface, with a comprehensive compatibility layer for QuickJS:

```c
// Native PrimJS/LEPUS Types
typedef struct LEPUSRuntime LEPUSRuntime;
typedef struct LEPUSContext LEPUSContext;
typedef struct LEPUSValue LEPUSValue;
typedef struct LEPUSObject LEPUSObject;

// QuickJS Compatibility Layer (via primjs-compat.h)
#define JSRuntime LEPUSRuntime
#define JSContext LEPUSContext
#define JSValue LEPUSValue
#define JSValueConst LEPUSValueConst
```

### API Mapping Pattern

The compatibility layer systematically maps QuickJS `JS_*` functions to PrimJS `LEPUS_*` functions:

```c
// Runtime Functions
#define JS_NewRuntime LEPUS_NewRuntime
#define JS_FreeRuntime LEPUS_FreeRuntime
#define JS_SetMemoryLimit LEPUS_SetMemoryLimit

// Context Functions
#define JS_NewContext LEPUS_NewContext
#define JS_FreeContext LEPUS_FreeContext
#define JS_GetRuntime LEPUS_GetRuntime

// Value Functions
#define JS_NewBool LEPUS_NewBool
#define JS_NewInt32 LEPUS_NewInt32
#define JS_NewFloat64 LEPUS_NewFloat64
#define JS_NewString LEPUS_NewString
```

## Integration in quickjs-emscripten

### Variant Package Structure

The quickjs-emscripten repository includes **16 PrimJS variant packages** that mirror QuickJS variants:

```
packages/variant-primjs-{packaging}-{platform}-{mode}-{sync}
```

**Available Variants:**
- **Packaging**: `singlefile`, `wasmfile`
- **Platform**: `browser`, `cjs`, `mjs`
- **Mode**: `debug`, `release`
- **Sync**: `sync`, `asyncify`

### Build System Differences

PrimJS variants use different build configurations:

```makefile
# PrimJS-specific configuration
QUICKJS_LIB=primjs
QUICKJS_DEFINES:=-D_GNU_SOURCE -DEMSCRIPTEN -DLYNX_SIMPLIFY=1
CFLAGS_WASM+=-DQTS_USE_PRIMJS -fno-exceptions
QUICKJS_SRC_EXT=cc  # C++ instead of C

# Additional PrimJS object files
QUICKJS_OBJS+=quickjs_gc.o primjs_monitor.o quickjs_queue.o quickjs_version.o
# GC-related object files
QUICKJS_OBJS+=qjsvaluevalue-space.o global-handles.o allocator.o collector.o sweeper.o thread_pool.o
# Link with C++ standard library
CFLAGS_WASM+=-lc++ -lc++abi
```

### Package Naming Convention

PrimJS packages use the `@jitl/primjs-*` namespace instead of `@jitl/quickjs-*`:

```json
{
  "dependencies": {
    "@jitl/primjs-wasmfile-release-sync": "^0.31.0",
    "@jitl/primjs-singlefile-browser-debug-asyncify": "^0.31.0"
  }
}
```

## NAPI Implementation: Deep Dive

### Multi-Engine NAPI Architecture

PrimJS implements a sophisticated **Node.js API (NAPI)** system that provides a universal interface across multiple JavaScript engines:

- **V8**: Native V8 integration (`v8/js_native_api_v8.cc`)
- **JavaScriptCore**: Apple's JS engine (`jsc/js_native_api_JavaScriptCore.cc`)
- **QuickJS**: LEPUS-based QuickJS implementation (`quickjs/js_native_api_QuickJS.cc`)
- **Harmony**: Alternative JS engine support (`harmony/js_native_api_harmony.cc`)

### WASM Module Import Architecture

**Critical Discovery**: PrimJS explicitly supports **WASM module imports** for NAPI functions:

```c
// From js_native_api.h
#ifndef NAPI_EXTERN
#ifdef _WIN32
#define NAPI_EXTERN __declspec(dllexport)
#elif defined(__wasm32__)
#define NAPI_EXTERN                      \
  __attribute__((visibility("default"))) \
  __attribute__((__import_module__("napi")))
#else
#define NAPI_EXTERN __attribute__((visibility("default")))
#endif
#endif
```

This means **when compiled for WASM, all NAPI functions become WASM imports** from a module named `"napi"`. This is revolutionary because:

1. **External NAPI Host**: A WASM host environment can provide NAPI functions
2. **Runtime Flexibility**: Different WASM environments can implement different NAPI backends
3. **Performance**: Direct WASM imports avoid FFI overhead
4. **Standardization**: Creates a standardized NAPI interface for WASM

### Function Pointer Dispatch System

The NAPI environment (`napi_env`) uses function pointers for **all** NAPI operations:

```c
// From adapter pattern in js_native_api_adapter.cc
napi_status napi_get_version_primjs(napi_env env, uint32_t* result) {
  return env->napi_get_version(env, result);  // Dispatch through function pointer
}

napi_status napi_get_undefined_primjs(napi_env env, napi_value* result) {
  return env->napi_get_undefined(env, result);  // Dispatch through function pointer
}
```

**Every NAPI call goes through the environment's function pointer table**, enabling:
- **Runtime engine swapping**: Change JS engine without recompilation
- **Plugin architecture**: Load different NAPI implementations dynamically
- **Testing and mocking**: Easy to substitute NAPI implementations for testing

### PrimJS-Specific NAPI Namespace

PrimJS implements a **namespace isolation system** for NAPI to avoid conflicts:

```c
// From primjs_napi_defines.h - Comprehensive namespace remapping
#define napi_env napi_env_primjs
#define napi_value napi_value_primjs  
#define napi_ref napi_ref_primjs
#define napi_callback napi_callback_primjs
#define napi_create_string_utf8 napi_create_string_utf8_primjs
// ... 150+ function/type redefinitions
```

This allows:
- **Multiple NAPI implementations** in the same process
- **Version isolation**: Different NAPI versions can coexist
- **Conflict prevention**: No symbol clashes between different NAPI providers

### Value Conversion Layer

PrimJS implements efficient **value conversion** between NAPI and LEPUS types:

```c
// From js_native_api_QuickJS.h
inline napi_value ToNapi(LEPUSValueConst* v) {
  return reinterpret_cast<napi_value>(v);
}

inline LEPUSValueConst ToJSValue(napi_value v) {
  return *reinterpret_cast<LEPUSValueConst*>(v);
}

// GC-aware value management
inline LEPUSValue JS_DupValue_Comp(LEPUSContext* ctx, LEPUSValueConst v) {
  if (!LEPUS_IsGCMode(ctx)) {
    return LEPUS_DupValue(ctx, v);
  }
  return v;  // In GC mode, no reference counting needed
}
```

**Key insights:**
- **Zero-copy conversion**: NAPI values are direct pointers to LEPUS values
- **GC-aware**: Automatically adapts to reference counting vs garbage collection
- **Performance optimized**: Minimal overhead for value passing

### Persistent Handle Management

PrimJS implements sophisticated **persistent reference** management:

```c
// From js_native_api_QuickJS.h
class NAPIPersistent : public PersistentBase {
public:
  NAPIPersistent(napi_env env, LEPUSValueConst value, 
                 NativeInfo* native_info, LEPUSContext* ctx, 
                 bool is_weak = false);
  
  void SetWeak(void* data, void (*cb)(void*));  // Weak reference callbacks
  void Reset(bool for_gc = false);               // Manual cleanup
  
  LEPUSValue Value() const;                      // Access the wrapped value
  bool IsEmpty();                                // Check validity
};
```

**Advanced features:**
- **Weak references**: Automatic cleanup when objects are garbage collected
- **Callback system**: Finalization callbacks for resource cleanup
- **GC integration**: Works with both reference counting and garbage collection

### Environment Lifecycle Management

The NAPI environment includes comprehensive **cleanup management**:

```c
// From napi_env.cc
struct napi_env_data__ {
  void AddCleanupHook(void (*fun)(void* arg), void* arg);
  void RemoveCleanupHook(void (*fun)(void* arg), void* arg);
  ~napi_env_data__() { RunCleanup(); }  // Automatic cleanup on destruction
  
private:
  struct CleanupHook {
    void (*fun)(void*);
    void* arg;
    uint64_t insertion_order_counter;  // Ordered cleanup
  };
  
  std::unordered_set<CleanupHook, CleanupHook::Hash, CleanupHook::Equal> cleanup_hooks;
};
```

**Cleanup features:**
- **Deterministic cleanup**: Hooks run in reverse registration order
- **Exception safety**: Cleanup continues even if individual hooks fail
- **Resource tracking**: Prevents memory leaks in long-running applications

### Implications for WASM/Emscripten Usage

The PrimJS NAPI implementation reveals a **revolutionary approach** to WASM JavaScript engine integration:

1. **WASM Host Integration**: A WASM host can implement the `"napi"` import module to provide JavaScript runtime services
2. **Pluggable Runtimes**: Different WASM applications can use different JS engines through the same NAPI interface
3. **Performance**: Direct WASM imports eliminate FFI marshalling overhead
4. **Ecosystem Compatibility**: Existing Node.js native modules could potentially work in WASM environments
5. **Debugging Support**: The CDP integration works through NAPI, enabling debugging across WASM boundaries

This suggests that **Emscripten-compiled applications using PrimJS could integrate with external NAPI providers**, potentially enabling advanced use cases like:
- Cloudflare Workers with external NAPI support
- Browser extensions with NAPI compatibility
- Server-side WASM with full Node.js API compatibility

## Technical Architecture

### C++ Foundation

Unlike QuickJS's C implementation, PrimJS is built on C++:
- **Source files**: `.cc` extensions instead of `.c`
- **Object-oriented design**: Enhanced garbage collection capabilities
- **Standard library**: Links with `libc++` and `libc++abi`

### Garbage Collection System

PrimJS implements a sophisticated GC system with multiple components:

```
gc/
├── allocator.h/cc          # Memory allocation strategies
├── collector.h/cc          # Main garbage collector
├── global-handles.h/cc     # Global object handle management
├── persistent-handle.h/cc  # Persistent object references
├── sweeper.h/cc           # Memory sweeping algorithms
├── thread_pool.h/cc       # Multi-threaded GC support
└── trace-gc.h/cc          # GC tracing and debugging
```

### Inspector and Debugging

Comprehensive debugging infrastructure:

```
inspector/
├── debugger/              # Chrome DevTools Protocol implementation
├── cpuprofiler/          # CPU profiling capabilities
├── heapprofiler/         # Heap profiling and analysis
└── runtime/              # Runtime inspection APIs
```

## Usage Patterns

### Drop-in Replacement

PrimJS is designed as a **drop-in replacement** for QuickJS:

```javascript
// Before (QuickJS)
import { newQuickJSWASMModule, RELEASE_SYNC } from 'quickjs-emscripten';

// After (PrimJS)
import { newQuickJSWASMModule } from 'quickjs-emscripten';
import { RELEASE_SYNC } from '@jitl/primjs-wasmfile-release-sync';
```

### Cloudflare Workers Integration

For Cloudflare Workers, the integration follows the same pattern:

```javascript
import { newQuickJSWASMModule, newVariant } from 'quickjs-emscripten';
import { RELEASE_SYNC as baseVariant } from '@jitl/primjs-wasmfile-release-sync';
import cloudflareWasmModule from './RELEASE_SYNC.wasm';

const cloudflareVariant = newVariant(baseVariant, {
  wasmModule: cloudflareWasmModule,
});

const PrimJS = await newQuickJSWASMModule(cloudflareVariant);
```

## Performance Considerations

### Benchmarks

- **Octane Benchmark**: PrimJS scores 3735 vs QuickJS's 2904 (~28% improvement)
- **Memory efficiency**: GC-based memory management reduces fragmentation
- **Template interpreter**: Optimized bytecode execution with stack caching

### Optimization Features

1. **Stack Caching**: Reduces stack frame allocation overhead
2. **Register Optimization**: Better register allocation in the interpreter
3. **Garbage Collection**: Eliminates reference counting overhead
4. **Template Interpretation**: Pre-compiled execution patterns

## Development and Debugging

### Chrome DevTools Integration

Full CDP implementation enables:
- **Breakpoint debugging**: Set breakpoints in JavaScript code
- **Variable inspection**: Examine variable values and scope
- **Call stack analysis**: Navigate execution flow
- **Performance profiling**: CPU and heap profiling capabilities

### Memory Analysis

Enhanced memory debugging tools:
- **Heap snapshots**: Detailed memory usage analysis
- **Leak detection**: GC-based leak detection and prevention
- **Memory usage tracking**: Comprehensive memory statistics

## Conclusion

PrimJS represents a significant evolution of QuickJS, providing:
- **Performance improvements** through template interpretation and GC
- **Enhanced debugging** via Chrome DevTools Protocol
- **API compatibility** through comprehensive wrapper layers
- **WASM-first design** with NAPI integration possibilities
- **Production-ready** garbage collection and memory management

The architecture demonstrates a thoughtful approach to JavaScript engine design, balancing performance, compatibility, and developer experience. For applications requiring high-performance JavaScript execution in constrained environments (like Cloudflare Workers), PrimJS offers substantial benefits over the base QuickJS implementation.

## References

- [PrimJS Repository](https://github.com/lynx-family/primjs)
- [Lynx Framework Documentation](https://lynxjs.org/guide/scripting-runtime/main-thread-runtime.html#primjs)
- [QuickJS Emscripten Integration](https://github.com/justjake/quickjs-emscripten)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)