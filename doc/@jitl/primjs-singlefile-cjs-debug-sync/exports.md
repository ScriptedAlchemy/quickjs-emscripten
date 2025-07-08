[quickjs-emscripten](../../packages.md) • **@jitl/primjs-singlefile-cjs-debug-sync** • [Readme](README.md) \| [Exports](exports.md)

***

[quickjs-emscripten](../../packages.md) / @jitl/primjs-singlefile-cjs-debug-sync

# @jitl/primjs-singlefile-cjs-debug-sync

## Contents

- [Variables](exports.md#variables)
  - [default](exports.md#default)
  - [@jitl/primjs-singlefile-cjs-debug-sync](exports.md#jitlprimjs-singlefile-cjs-debug-sync)

## Variables

### default

> **`const`** **default**: `QuickJSSyncVariant`

### @jitl/primjs-singlefile-cjs-debug-sync

[Docs](https://github.com/justjake/quickjs-emscripten/blob/main/doc/@jitl/primjs-singlefile-cjs-debug-sync/README.md) |
Variant with the WASM data embedded into a universal (Node and Browser compatible) CommonJS module.

| Variable            |    Setting                     |    Description    |
| --                  | --                             | --                |
| library             | primjs             | [PrimJS](https://github.com/lynx-family/primjs) is a QuickJS derivative optimized for the Lynx framework with better performance and Chrome DevTools support. Version [2.11.1-rc.1](https://github.com/lynx-family/primjs) as a git submodule. |
| releaseMode         | debug         | Enables assertions and memory sanitizers. Try to run your tests against debug variants, in addition to your preferred production variant, to catch more bugs. |
| syncMode            | sync            | The default, normal build. Note that both variants support regular async functions. |
| emscriptenInclusion | singlefile | The WASM runtime is included directly in the JS file. Use if you run into issues with missing .wasm files when building or deploying your app. |
| exports             | require                  | Has these package.json export conditions |

#### Source

index.ts:18

***

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)
