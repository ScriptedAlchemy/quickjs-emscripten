import type { QuickJSSyncVariant } from "@jitl/quickjs-ffi-types"

/**
 * ### @jitl/primjs-singlefile-browser-release-sync
 *
 * [Docs](https://github.com/justjake/quickjs-emscripten/blob/main/doc/@jitl/primjs-singlefile-browser-release-sync/README.md) |
 * Variant with the WASM data embedded into a browser ESModule.
 *
 * | Variable            |    Setting                     |    Description    |
 * | --                  | --                             | --                |
 * | library             | primjs             | [PrimJS](https://github.com/lynx-family/primjs) is a QuickJS derivative optimized for the Lynx framework with better performance and Chrome DevTools support. Version [2.11.1-rc.1](https://github.com/lynx-family/primjs) as a git submodule. |
 * | releaseMode         | release         | Optimized for performance; use when building/deploying your application. |
 * | syncMode            | sync            | The default, normal build. Note that both variants support regular async functions. |
 * | emscriptenInclusion | singlefile | The WASM runtime is included directly in the JS file. Use if you run into issues with missing .wasm files when building or deploying your app. |
 * | exports             | browser                  | Has these package.json export conditions |
 *
 */
const variant: QuickJSSyncVariant = {
  type: "sync",
  importFFI: () => import("./ffi.js").then((mod) => mod.QuickJSFFI),
  importModuleLoader: () =>
    import("@jitl/primjs-singlefile-browser-release-sync/emscripten-module").then(
      (mod) => mod.default,
    ),
} as const

export default variant
