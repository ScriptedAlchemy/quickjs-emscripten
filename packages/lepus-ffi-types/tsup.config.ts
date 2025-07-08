import { extendConfig } from "@jitl/tsconfig/tsup.base.config.js"
export default extendConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  clean: false,
})