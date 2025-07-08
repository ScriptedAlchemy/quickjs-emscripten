[quickjs-emscripten](../../packages.md) • **@jitl/primjs-singlefile-cjs-release-asyncify** • [Readme](README.md) \| [Exports](exports.md)

***

[quickjs-emscripten](../../packages.md) / @jitl/primjs-singlefile-cjs-release-asyncify

# @jitl/primjs-singlefile-cjs-release-asyncify

## Contents

- [Variables](exports.md#variables)
  - [default](exports.md#default)
  - [@jitl/primjs-singlefile-cjs-release-asyncify](exports.md#jitlprimjs-singlefile-cjs-release-asyncify)

## Variables

### default

> **`const`** **default**: `QuickJSAsyncVariant`

### @jitl/primjs-singlefile-cjs-release-asyncify

[Docs](https://github.com/justjake/quickjs-emscripten/blob/main/doc/@jitl/primjs-singlefile-cjs-release-asyncify/README.md) |
Variant with the WASM data embedded into a universal (Node and Browser compatible) CommonJS module.

| Variable            |    Setting                     |    Description    |
| --                  | --                             | --                |
| library             | primjs             | [PrimJS](https://github.com/lynx-family/primjs) is a QuickJS derivative optimized for the Lynx framework with better performance and Chrome DevTools support. Version [2.11.1-rc.1](https://github.com/lynx-family/primjs) as a git submodule. |
| releaseMode         | release         | Optimized for performance; use when building/deploying your application. |
| syncMode            | asyncify            | Build run through the ASYNCIFY WebAssembly transform. This imposes substantial size (2x the size of sync) and speed penalties (40% the speed of sync). In return, allows synchronous calls from the QuickJS WASM runtime to async functions on the host. The extra magic makes this variant slower than sync variants. Note that both variants support regular async functions. Only adopt ASYNCIFY if you need to! The [QuickJSAsyncRuntime](https://github.com/justjake/quickjs-emscripten/blob/main/doc/quickjs-emscripten/classes/QuickJSAsyncRuntime.md) and [QuickJSAsyncContext](https://github.com/justjake/quickjs-emscripten/blob/main/doc/quickjs-emscripten/classes/QuickJSAsyncContext.md) classes expose the ASYNCIFY-specific APIs. |
| emscriptenInclusion | singlefile | The WASM runtime is included directly in the JS file. Use if you run into issues with missing .wasm files when building or deploying your app. |
| exports             | require                  | Has these package.json export conditions |

#### Source

index.ts:18

***

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)
