[quickjs-emscripten](../../packages.md) • **@jitl/primjs-wasmfile-debug-sync** • [Readme](README.md) \| [Exports](exports.md)

***

[quickjs-emscripten](../../packages.md) / @jitl/primjs-wasmfile-debug-sync

# @jitl/primjs-wasmfile-debug-sync

## Contents

- [Variables](exports.md#variables)
  - [default](exports.md#default)
  - [@jitl/primjs-wasmfile-debug-sync](exports.md#jitlprimjs-wasmfile-debug-sync)

## Variables

### default

> **`const`** **default**: `QuickJSSyncVariant`

### @jitl/primjs-wasmfile-debug-sync

[Docs](https://github.com/justjake/quickjs-emscripten/blob/main/doc/@jitl/primjs-wasmfile-debug-sync/README.md) |
Variant with separate .WASM file. Supports browser ESM, NodeJS ESM, and NodeJS CommonJS.

| Variable            |    Setting                     |    Description    |
| --                  | --                             | --                |
| library             | primjs             | [PrimJS](https://github.com/lynx-family/primjs) is a QuickJS derivative optimized for the Lynx framework with better performance and Chrome DevTools support. Version [2.11.1-rc.1](https://github.com/lynx-family/primjs) as a git submodule. |
| releaseMode         | debug         | Enables assertions and memory sanitizers. Try to run your tests against debug variants, in addition to your preferred production variant, to catch more bugs. |
| syncMode            | sync            | The default, normal build. Note that both variants support regular async functions. |
| emscriptenInclusion | wasm | Has a separate .wasm file. May offer better caching in your browser, and reduces the size of your JS bundle. If you have issues, try a 'singlefile' variant. |
| exports             | require import browser workerd                  | Has these package.json export conditions |

#### Source

index.ts:18

***

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)
