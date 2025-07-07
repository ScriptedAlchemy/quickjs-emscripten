# @jitl/primjs-singlefile-cjs-debug-sync

Variant with the WASM data embedded into a universal (Node and Browser compatible) CommonJS module.

This generated package is part of [quickjs-emscripten](https://github.com/justjake/quickjs-emscripten).
It contains a variant of the quickjs WASM library, and can be used with quickjs-emscripten-core.

```typescript
import variant from "@jitl/primjs-singlefile-cjs-debug-sync"
import { newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core"
const QuickJS = await newQuickJSWASMModuleFromVariant(variant)
```

This variant was built with the following settings:

## Library: primjs

[PrimJS](https://github.com/lynx-family/primjs) is a QuickJS derivative optimized for the Lynx framework with better performance and Chrome DevTools support.

Version [2.11.1-rc.1](https://github.com/lynx-family/primjs) as a git submodule.

## Release mode: debug

Enables assertions and memory sanitizers. Try to run your tests against debug variants, in addition to your preferred production variant, to catch more bugs.

## Exports: require

Exports the following in package.json for the package entrypoint:

- Exports a NodeJS-compatible CommonJS module, which is faster to load and run compared to an ESModule.

## Extra async magic? No

The default, normal build. Note that both variants support regular async functions.

## Single-file, or separate .wasm file? singlefile

The WASM runtime is included directly in the JS file. Use if you run into issues with missing .wasm files when building or deploying your app.

## More details

Full variant JSON description:

```json
{
  "library": "primjs",
  "releaseMode": "debug",
  "syncMode": "sync",
  "description": "Variant with the WASM data embedded into a universal (Node and Browser compatible) CommonJS module.",
  "emscriptenInclusion": "singlefile",
  "exports": {
    "require": {
      "emscriptenEnvironment": ["web", "worker", "node"]
    }
  }
}
```

Variant-specific Emscripten build flags:

```json
[
  "-O0",
  "-DQTS_DEBUG_MODE",
  "-DDUMP_LEAKS=1",
  "-gsource-map",
  "-s ASSERTIONS=1",
  "--pre-js $(TEMPLATES)/pre-extension.js",
  "--pre-js $(TEMPLATES)/pre-sourceMapJson.js",
  "--pre-js $(TEMPLATES)/pre-wasmOffsetConverter.js",
  "--pre-js $(TEMPLATES)/pre-wasmMemory.js",
  "-s SINGLE_FILE=1",
  "-DQTS_SANITIZE_LEAK",
  "-fsanitize=leak",
  "-g2"
]
```
