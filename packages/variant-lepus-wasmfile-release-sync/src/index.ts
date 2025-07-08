import type { QuickJSSyncVariant } from "@jitl/quickjs-ffi-types"

/**
 * ### @jitl/lepus-wasmfile-release-sync
 *
 * [Docs](https://github.com/justjake/quickjs-emscripten/blob/main/doc/@jitl/lepus-wasmfile-release-sync/README.md) |
 * Direct LEPUS API variant for native PrimJS performance.
 *
 * | Variable            |    Setting                     |    Description    |
 * | --                  | --                             | --                |
 * | library             | primjs             | The advanced [lynx-family/lynx](https://github.com/lynx-family/lynx) PrimJS library with 28% better performance, garbage collection, and Chrome DevTools support. |
 * | releaseMode         | release         | Optimized for performance; use when building/deploying your application. |
 * | syncMode            | sync            | The default, normal build. Note that both variants support regular async functions. |
 * | emscriptenInclusion | wasm | Has a separate .wasm file. May offer better caching in your browser, and reduces the size of your JS bundle. If you have issues, try a 'singlefile' variant. |
 * | exports             | require import browser workerd                  | Has these package.json export conditions |
 *
 * This variant provides direct access to PrimJS's native LEPUS API, bypassing the QuickJS compatibility layer for maximum performance and access to PrimJS-specific features like garbage collection and NAPI integration.
 */
const variant: QuickJSSyncVariant = {
  type: "sync",
  importFFI: () => import("./ffi.js").then((mod) => mod.LEPUSFFI),
  importModuleLoader: () =>
    import("@jitl/lepus-wasmfile-release-sync/emscripten-module").then((mod) => mod.default),
} as const

export default variant