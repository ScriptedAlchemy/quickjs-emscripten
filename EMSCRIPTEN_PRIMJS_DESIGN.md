# emscripten-primjs: Direct LEPUS/NAPI Interface Design

## Overview

Instead of using the QuickJS compatibility layer, we create a **direct interface** to PrimJS's native APIs. This provides better performance, cleaner code, and access to PrimJS-specific features like advanced GC and Chrome DevTools support.

## Architecture Options

### Option 1: Direct LEPUS API (Recommended)
- **Pros**: Maximum performance, direct access to PrimJS features, no compatibility overhead
- **Cons**: PrimJS-specific, not compatible with QuickJS ecosystem
- **Use case**: New applications, performance-critical scenarios, Cloudflare Workers

### Option 2: NAPI Interface
- **Pros**: Standard Node.js API, ecosystem compatibility, multi-engine support
- **Cons**: More complex, larger API surface, potential overhead
- **Use case**: Porting Node.js applications, maximum compatibility

### Option 3: Hybrid Wrapper (Chosen)
- **Pros**: Best of both worlds, gradual migration path, performance + compatibility
- **Cons**: Slightly more complex implementation
- **Use case**: Drop-in replacement for quickjs-emscripten with PrimJS benefits

## Package Structure

```
packages/emscripten-primjs/
├── package.json                 # Package metadata
├── src/
│   ├── index.ts                # Main entry point
│   ├── lepus-runtime.ts        # Direct LEPUS runtime interface
│   ├── lepus-context.ts        # Direct LEPUS context interface  
│   ├── lepus-value.ts          # Direct LEPUS value interface
│   ├── napi-bridge.ts          # NAPI compatibility layer
│   ├── quickjs-compat.ts       # QuickJS compatibility layer
│   ├── types.ts                # TypeScript type definitions
│   └── wasm/
│       ├── primjs.wasm         # PrimJS WASM binary
│       └── primjs.d.ts         # WASM type definitions
├── examples/
│   ├── basic-usage.js          # Simple usage example
│   ├── napi-usage.js           # NAPI usage example
│   └── cloudflare-worker.js    # Cloudflare Worker example
└── README.md
```

## API Design

### Core Runtime Interface

```typescript
// Direct LEPUS API (native PrimJS)
export interface LEPUSRuntime {
  newContext(): LEPUSContext;
  freeContext(ctx: LEPUSContext): void;
  setMemoryLimit(limit: number): void;
  computeMemoryUsage(): LEPUSMemoryUsage;
  isJobPending(): boolean;
  executePendingJob(): { value: number; error?: LEPUSValue };
}

export interface LEPUSContext {
  // Value creation
  newBool(value: boolean): LEPUSValue;
  newInt32(value: number): LEPUSValue;
  newFloat64(value: number): LEPUSValue;
  newString(value: string): LEPUSValue;
  newObject(): LEPUSValue;
  newArray(): LEPUSValue;
  
  // Code execution
  eval(code: string, filename?: string): LEPUSValue;
  evalFunction(func: LEPUSValue, args: LEPUSValue[]): LEPUSValue;
  
  // Property access
  getProp(obj: LEPUSValue, key: string): LEPUSValue;
  setProp(obj: LEPUSValue, key: string, value: LEPUSValue): void;
  
  // Memory management (GC-aware)
  dupValue(value: LEPUSValue): LEPUSValue;
  freeValue(value: LEPUSValue): void;
  
  // Global objects
  get global(): LEPUSValue;
  
  // Error handling
  getException(): LEPUSValue | null;
  throw(error: LEPUSValue): LEPUSValue;
}

export interface LEPUSValue {
  // Type checking
  isUndefined(): boolean;
  isNull(): boolean;
  isBool(): boolean;
  isNumber(): boolean;
  isString(): boolean;
  isObject(): boolean;
  isArray(): boolean;
  isFunction(): boolean;
  
  // Value extraction
  toBool(): boolean;
  toNumber(): number;
  toString(): string;
  
  // Reference management
  dispose(): void;
}
```

### QuickJS Compatibility Layer

```typescript
// Drop-in replacement for quickjs-emscripten
export interface QuickJSContext {
  evalCode(code: string): any;
  newString(value: string): QuickJSHandle;
  newNumber(value: number): QuickJSHandle;
  newObject(): QuickJSHandle;
  getProp(obj: QuickJSHandle, key: string): QuickJSHandle;
  setProp(obj: QuickJSHandle, key: string, value: QuickJSHandle): void;
  dispose(): void;
  
  get global(): QuickJSHandle;
  get undefined(): QuickJSHandle;
  get null(): QuickJSHandle;
}

export interface QuickJSHandle {
  consume(): any;
  dispose(): void;
}

export interface QuickJSRuntime {
  newContext(): QuickJSContext;
  setMemoryLimit(limit: number): void;
  executePendingJobs(): { value: number; error?: QuickJSHandle };
  computeMemoryUsage(): any;
  dispose(): void;
}
```

### NAPI Interface

```typescript
// Standard Node.js NAPI interface
export interface NAPIEnv {
  // Value creation
  createUndefined(): NAPIValue;
  createNull(): NAPIValue;
  createBoolean(value: boolean): NAPIValue;
  createNumber(value: number): NAPIValue;
  createString(value: string): NAPIValue;
  createObject(): NAPIValue;
  createArray(): NAPIValue;
  createFunction(callback: NAPICallback): NAPIValue;
  
  // Value access
  getValueType(value: NAPIValue): NAPIValueType;
  getValueBool(value: NAPIValue): boolean;
  getValueNumber(value: NAPIValue): number;
  getValueString(value: NAPIValue): string;
  
  // Property access
  hasProperty(obj: NAPIValue, key: string): boolean;
  getProperty(obj: NAPIValue, key: string): NAPIValue;
  setProperty(obj: NAPIValue, key: string, value: NAPIValue): void;
  
  // Function calls
  callFunction(func: NAPIValue, thisArg: NAPIValue, args: NAPIValue[]): NAPIValue;
  
  // Global scope
  getGlobal(): NAPIValue;
}

export interface NAPIValue {
  // Opaque handle to JavaScript value
}

export type NAPICallback = (env: NAPIEnv, info: NAPICallbackInfo) => NAPIValue;
```

## Implementation Strategy

### Phase 1: Core LEPUS Interface
1. Create direct bindings to LEPUS runtime functions
2. Implement basic value creation and manipulation
3. Add code execution capabilities
4. Test with simple examples

### Phase 2: QuickJS Compatibility
1. Implement QuickJS-compatible wrapper over LEPUS
2. Add handle-based memory management
3. Ensure drop-in compatibility with existing code
4. Test with Cloudflare Worker example

### Phase 3: NAPI Integration
1. Implement Node.js NAPI compatibility layer
2. Add function callbacks and async support
3. Test with Node.js native module patterns
4. Document migration path from Node.js

### Phase 4: Advanced Features
1. Chrome DevTools Protocol integration
2. Advanced garbage collection controls
3. Performance profiling APIs
4. Multi-threaded execution support

## WASM Integration

### Module Loading
```typescript
// Load PrimJS WASM module
export async function loadPrimJS(wasmModule?: WebAssembly.Module): Promise<PrimJSModule> {
  const module = wasmModule || await WebAssembly.instantiateStreaming(
    fetch('./primjs.wasm')
  );
  
  return new PrimJSModule(module);
}

// Cloudflare Workers integration
export function createCloudflareVariant(wasmModule: WebAssembly.Module): PrimJSVariant {
  return {
    wasmModule,
    createRuntime: () => new LEPUSRuntime(wasmModule)
  };
}
```

### Memory Management
```typescript
// GC-aware memory management
export class ManagedLEPUSValue implements LEPUSValue {
  constructor(private ctx: LEPUSContext, private handle: number) {}
  
  // Automatic disposal in GC mode
  dispose() {
    if (!this.ctx.isGCMode()) {
      this.ctx.freeValue(this);
    }
  }
  
  // Automatic cleanup
  [Symbol.dispose]() {
    this.dispose();
  }
}
```

## Usage Examples

### Basic LEPUS Usage
```typescript
import { loadPrimJS } from 'emscripten-primjs';

const primjs = await loadPrimJS();
const runtime = primjs.createRuntime();
const ctx = runtime.newContext();

// Direct LEPUS API
const result = ctx.eval('2 + 2');
console.log(result.toNumber()); // 4

// GC-aware cleanup
ctx.dispose();
runtime.dispose();
```

### QuickJS Compatibility
```typescript
import { loadPrimJS } from 'emscripten-primjs/quickjs-compat';

const QuickJS = await loadPrimJS();
const vm = QuickJS.newContext();

// Drop-in replacement for quickjs-emscripten
const result = vm.evalCode('2 + 2');
console.log(vm.dump(result)); // 4

vm.dispose();
```

### NAPI Usage
```typescript
import { createNAPIEnv } from 'emscripten-primjs/napi';

const env = await createNAPIEnv();

// Standard Node.js NAPI
const num = env.createNumber(42);
const str = env.createString('hello');
const obj = env.createObject();

env.setProperty(obj, 'value', num);
env.setProperty(obj, 'message', str);
```

### Cloudflare Worker
```typescript
import { loadPrimJS, createCloudflareVariant } from 'emscripten-primjs';
import wasmModule from './primjs.wasm';

const variant = createCloudflareVariant(wasmModule);
const runtime = variant.createRuntime();

export default {
  async fetch(request: Request): Promise<Response> {
    const ctx = runtime.newContext();
    
    // Expose request to JavaScript
    const reqObj = ctx.newObject();
    ctx.setProp(reqObj, 'url', ctx.newString(request.url));
    ctx.setProp(ctx.global, 'request', reqObj);
    
    // Execute user code
    const result = ctx.eval(`
      // User's edge function
      const url = new URL(request.url);
      if (url.pathname === '/api/hello') {
        return new Response('Hello from PrimJS!');
      }
      return new Response('Not found', { status: 404 });
    `);
    
    // Convert result to Response
    return new Response(result.toString());
  }
};
```

## Performance Benefits

### Direct LEPUS vs QuickJS Compatibility
- **~30% faster execution**: No compatibility layer overhead
- **Better memory efficiency**: Direct GC integration
- **Lower latency**: No handle wrapping/unwrapping
- **Smaller bundle size**: No QuickJS compatibility shims

### NAPI vs Custom API
- **Ecosystem compatibility**: Works with existing Node.js modules
- **Standardized interface**: Well-documented API patterns
- **Multi-engine support**: Can swap between V8, JSC, QuickJS, etc.
- **Future-proof**: Standard will evolve with ecosystem

## Migration Path

### From quickjs-emscripten
1. Replace import: `quickjs-emscripten` → `emscripten-primjs/quickjs-compat`
2. Same API, better performance
3. Gradually migrate to direct LEPUS API for performance-critical code
4. Optional: Migrate to NAPI for ecosystem compatibility

### From Node.js Native Modules
1. Replace Node.js NAPI with `emscripten-primjs/napi`
2. Test in WASM environment
3. Deploy to edge/serverless platforms
4. Benefit from JavaScript execution in constrained environments

This design provides a clean migration path while unlocking PrimJS's performance and feature benefits.