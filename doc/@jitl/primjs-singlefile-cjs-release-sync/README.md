[quickjs-emscripten](../../packages.md) • **@jitl/primjs-singlefile-cjs-release-sync** • [Readme](README.md) \| [Exports](exports.md)

***

# @jitl/primjs-singlefile-cjs-release-sync

Variant with the WASM data embedded into a universal (Node and Browser compatible) CommonJS module.

This generated package is part of [quickjs-emscripten](https://github.com/justjake/quickjs-emscripten).
It contains a variant of the quickjs WASM library, and can be used with quickjs-emscripten-core.

```typescript
import variant from "@jitl/primjs-singlefile-cjs-release-sync"
import { newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core"
const QuickJS = await newQuickJSWASMModuleFromVariant(variant)
```

This variant was built with the following settings:

## Contents

- [Library: primjs](README.md#library-primjs)
- [Release mode: release](README.md#release-mode-release)
- [Exports: require](README.md#exports-require)
- [Extra async magic? No](README.md#extra-async-magic-no)
- [Single-file, or separate .wasm file? singlefile](README.md#single-file-or-separate-wasm-file-singlefile)
- [More details](README.md#more-details)

## Library: primjs

[PrimJS](https://github.com/lynx-family/primjs) is a QuickJS derivative optimized for the Lynx framework with better performance and Chrome DevTools support.

Version [2.11.1-rc.1](https://github.com/lynx-family/primjs) as a git submodule.

## Release mode: release

Optimized for performance; use when building/deploying your application.

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
  "releaseMode": "release",
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
  "-Oz",
  "-flto",
  "--closure 1",
  "-s FILESYSTEM=0",
  "--pre-js $(TEMPLATES)/pre-extension.js",
  "--pre-js $(TEMPLATES)/pre-wasmMemory.js",
  "-s SINGLE_FILE=1"
]
```

***

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)
