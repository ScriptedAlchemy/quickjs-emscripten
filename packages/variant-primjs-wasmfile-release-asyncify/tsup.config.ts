import { extendConfig } from "@jitl/tsconfig/tsup.base.config.js"
export default extendConfig({
  entry: ["src/index.ts", "src/ffi.ts"],
  external: ["@jitl/primjs-wasmfile-release-asyncify/emscripten-module"],
  format: ["esm", "cjs"],
  clean: false,
})
