# PrimJS Integration into quickjs-emscripten

This document describes the integration of PrimJS (a QuickJS derivative optimized for the Lynx framework) into the quickjs-emscripten project.

## What was done

1. **Added PrimJS as a git submodule**
   ```bash
   git submodule add https://github.com/lynx-family/primjs.git vendor/primjs
   ```

2. **Updated build configuration**
   - Modified `scripts/prepareVariants.ts` to add PrimJS as a new library option alongside QuickJS and QuickJS-NG
   - Added PrimJS to the build matrix to generate all variant combinations

3. **Updated Makefile template**
   - Modified `templates/Variant.mk` to handle PrimJS-specific build settings:
     - PrimJS uses `.cc` files instead of `.c` files
     - Added PrimJS-specific compiler flags (`-DEMSCRIPTEN`, `-DQTS_USE_PRIMJS`)
     - Added additional object files required by PrimJS (`quickjs_gc.o`, `primjs_monitor.o`, `quickjs_queue.o`, `quickjs_version.o`)
     - Added build rules for compiling `.cc` files with proper include paths

4. **Generated PrimJS variants**
   - Running `yarn build:codegen` now generates all PrimJS variants:
     - `variant-primjs-wasmfile-*` (with separate WASM files)
     - `variant-primjs-singlefile-*` (with embedded WASM)
     - Each in debug/release and sync/asyncify modes

## PrimJS Features

PrimJS offers several advantages over standard QuickJS:
- **Optimized Interpreter**: Template interpreter with stack caching and register optimizations
- **Better Object Model Integration**: Seamless integration with the Lynx object model
- **Advanced Memory Management**: Uses Garbage Collector instead of Reference Counting
- **Chrome DevTools Support**: Full implementation of Chrome DevTools Protocol for debugging
- **~28% Better Performance**: Based on Octane Benchmark suite

## Building PrimJS Variants

To build a PrimJS variant:
```bash
cd packages/variant-primjs-wasmfile-release-sync
yarn build
```

## Using PrimJS Variants

Once built, PrimJS variants can be used just like any other quickjs-emscripten variant:

```typescript
import variant from '@jitl/primjs-wasmfile-release-sync'
import { newQuickJSWASMModuleFromVariant } from 'quickjs-emscripten-core'

const QuickJS = await newQuickJSWASMModuleFromVariant(variant)
```

## Notes

- PrimJS is API-compatible with QuickJS, so the same interface.c wrapper works
- The integration maintains all existing functionality while adding PrimJS as an additional engine option
- All variant types (wasmfile, singlefile, browser, etc.) are supported with PrimJS