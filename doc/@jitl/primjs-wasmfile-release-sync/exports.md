[quickjs-emscripten](../../packages.md) • **@jitl/primjs-wasmfile-release-sync** • [Readme](README.md) \| [Exports](exports.md)

***

[quickjs-emscripten](../../packages.md) / @jitl/primjs-wasmfile-release-sync

# @jitl/primjs-wasmfile-release-sync

## Contents

- [Variables](exports.md#variables)
  - [default](exports.md#default)
  - [@jitl/primjs-wasmfile-release-sync](exports.md#jitlprimjs-wasmfile-release-sync)

## Variables

### default

> **`const`** **default**: `QuickJSSyncVariant`

### @jitl/primjs-wasmfile-release-sync

[Docs](https://github.com/justjake/quickjs-emscripten/blob/main/doc/@jitl/primjs-wasmfile-release-sync/README.md) |
Variant with separate .WASM file. Supports browser ESM, NodeJS ESM, and NodeJS CommonJS.

| Variable            |    Setting                     |    Description    |
| --                  | --                             | --                |
| library             | primjs             | [PrimJS](https://github.com/lynx-family/primjs) is a QuickJS derivative optimized for the Lynx framework with better performance and Chrome DevTools support. Version [2.11.1-rc.1](https://github.com/lynx-family/primjs) as a git submodule. |
| releaseMode         | release         | Optimized for performance; use when building/deploying your application. |
| syncMode            | sync            | The default, normal build. Note that both variants support regular async functions. |
| emscriptenInclusion | wasm | Has a separate .wasm file. May offer better caching in your browser, and reduces the size of your JS bundle. If you have issues, try a 'singlefile' variant. |
| exports             | require import browser workerd                  | Has these package.json export conditions |

#### Source

index.ts:18

***

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)
