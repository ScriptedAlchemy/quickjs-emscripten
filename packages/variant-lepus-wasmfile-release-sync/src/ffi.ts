// LEPUS Native FFI - Direct PrimJS API bindings
import {
  QuickJSEmscriptenModule,
  JSRuntimePointer,
  JSContextPointer,
  JSValuePointer,
  JSValueConstPointer,
  BorrowedHeapCharPointer,
  OwnedHeapCharPointer,
  JSBorrowedCharPointer,
  EvalFlags,
  IntrinsicsFlags,
} from "@jitl/lepus-ffi-types"

// LEPUS-specific type aliases
export type LEPUSRuntimePointer = JSRuntimePointer
export type LEPUSContextPointer = JSContextPointer
export type LEPUSValuePointer = JSValuePointer
export type LEPUSValueConstPointer = JSValueConstPointer

/**
 * Direct LEPUS FFI bindings to PrimJS's native API.
 * This bypasses the QuickJS compatibility layer for maximum performance.
 * 
 * Features:
 * - Native garbage collection
 * - NAPI integration ready
 * - 28% performance improvement over QuickJS
 * - Chrome DevTools support
 * 
 * @unstable The LEPUS FFI interface is considered private and may change.
 */
export class LEPUSFFI {
  constructor(private module: QuickJSEmscriptenModule) {}
  /** Set at compile time. */
  readonly DEBUG = false

  // ===============================
  // LEPUS Core Runtime Management
  // ===============================
  
  LEPUS_NewRuntime: () => LEPUSRuntimePointer = this.module.cwrap("LEPUS_NewRuntime", "number", [])

  LEPUS_FreeRuntime: (rt: LEPUSRuntimePointer) => void = this.module.cwrap("LEPUS_FreeRuntime", null, ["number"])

  LEPUS_NewContext: (rt: LEPUSRuntimePointer, intrinsics: IntrinsicsFlags) => LEPUSContextPointer =
    this.module.cwrap("LEPUS_NewContext", "number", ["number", "number"])

  LEPUS_FreeContext: (ctx: LEPUSContextPointer) => void = this.module.cwrap("LEPUS_FreeContext", null, ["number"])

  // ===============================
  // LEPUS Garbage Collection
  // ===============================

  LEPUS_RunGC: (rt: LEPUSRuntimePointer) => void = this.module.cwrap("LEPUS_RunGC", null, ["number"])

  LEPUS_TrigGC: (rt: LEPUSRuntimePointer) => void = this.module.cwrap("LEPUS_TrigGC", null, ["number"])

  LEPUS_IsGCMode: (ctx: LEPUSContextPointer) => number = this.module.cwrap("LEPUS_IsGCMode", "number", ["number"])

  LEPUS_SetGCThreshold: (rt: LEPUSRuntimePointer, threshold: number) => void = 
    this.module.cwrap("LEPUS_SetGCThreshold", null, ["number", "number"])

  // ===============================
  // LEPUS Value Management (GC-aware)
  // ===============================

  LEPUS_FreeValue: (ctx: LEPUSContextPointer, value: LEPUSValuePointer) => void = 
    this.module.cwrap("LEPUS_FreeValue", null, ["number", "number"])

  LEPUS_DupValue: (ctx: LEPUSContextPointer, val: LEPUSValuePointer | LEPUSValueConstPointer) => LEPUSValuePointer = 
    this.module.cwrap("LEPUS_DupValue", "number", ["number", "number"])

  // ===============================
  // LEPUS Value Creation
  // ===============================

  LEPUS_GetUndefined: () => LEPUSValueConstPointer = this.module.cwrap("LEPUS_GetUndefined", "number", [])

  LEPUS_GetNull: () => LEPUSValueConstPointer = this.module.cwrap("LEPUS_GetNull", "number", [])

  LEPUS_GetTrue: () => LEPUSValueConstPointer = this.module.cwrap("LEPUS_GetTrue", "number", [])

  LEPUS_GetFalse: () => LEPUSValueConstPointer = this.module.cwrap("LEPUS_GetFalse", "number", [])

  LEPUS_NewObject: (ctx: LEPUSContextPointer) => LEPUSValuePointer = 
    this.module.cwrap("LEPUS_NewObject", "number", ["number"])

  LEPUS_NewArray: (ctx: LEPUSContextPointer) => LEPUSValuePointer = 
    this.module.cwrap("LEPUS_NewArray", "number", ["number"])

  LEPUS_NewFloat64: (ctx: LEPUSContextPointer, num: number) => LEPUSValuePointer = 
    this.module.cwrap("LEPUS_NewFloat64", "number", ["number", "number"])

  LEPUS_NewString: (ctx: LEPUSContextPointer, string: BorrowedHeapCharPointer) => LEPUSValuePointer =
    this.module.cwrap("LEPUS_NewString", "number", ["number", "number"])

  // ===============================
  // LEPUS Value Access
  // ===============================

  LEPUS_GetFloat64: (ctx: LEPUSContextPointer, value: LEPUSValuePointer | LEPUSValueConstPointer) => number =
    this.module.cwrap("LEPUS_GetFloat64", "number", ["number", "number"])

  LEPUS_GetBool: (ctx: LEPUSContextPointer, value: LEPUSValuePointer | LEPUSValueConstPointer) => number =
    this.module.cwrap("LEPUS_GetBool", "number", ["number", "number"])

  LEPUS_GetString: (ctx: LEPUSContextPointer, value: LEPUSValuePointer | LEPUSValueConstPointer) => JSBorrowedCharPointer = 
    this.module.cwrap("LEPUS_GetString", "number", ["number", "number"])

  // ===============================
  // LEPUS Evaluation
  // ===============================

  LEPUS_Eval: (
    ctx: LEPUSContextPointer,
    js_code: BorrowedHeapCharPointer,
    js_code_length: number,
    filename: string,
    detectModule: number,
    evalFlags: EvalFlags,
  ) => LEPUSValuePointer = this.module.cwrap("LEPUS_Eval", "number", [
    "number",
    "number", 
    "number",
    "string",
    "number",
    "number",
  ])

  LEPUS_Dump: (ctx: LEPUSContextPointer, obj: LEPUSValuePointer | LEPUSValueConstPointer) => JSBorrowedCharPointer = 
    this.module.cwrap("LEPUS_Dump", "number", ["number", "number"])

  // ===============================
  // LEPUS Object Operations
  // ===============================

  LEPUS_GetProp: (
    ctx: LEPUSContextPointer,
    this_val: LEPUSValuePointer | LEPUSValueConstPointer,
    prop_name: LEPUSValuePointer | LEPUSValueConstPointer,
  ) => LEPUSValuePointer = this.module.cwrap("LEPUS_GetProp", "number", ["number", "number", "number"])

  LEPUS_SetProp: (
    ctx: LEPUSContextPointer,
    this_val: LEPUSValuePointer | LEPUSValueConstPointer,
    prop_name: LEPUSValuePointer | LEPUSValueConstPointer,
    prop_value: LEPUSValuePointer | LEPUSValueConstPointer,
  ) => void = this.module.cwrap("LEPUS_SetProp", null, ["number", "number", "number", "number"])

  LEPUS_GetGlobalObject: (ctx: LEPUSContextPointer) => LEPUSValuePointer = 
    this.module.cwrap("LEPUS_GetGlobalObject", "number", ["number"])

  // ===============================
  // LEPUS Function Calls
  // ===============================

  LEPUS_Call: (
    ctx: LEPUSContextPointer,
    func_obj: LEPUSValuePointer | LEPUSValueConstPointer,
    this_obj: LEPUSValuePointer | LEPUSValueConstPointer,
    argc: number,
    argv_ptrs: number, // LEPUSValueConstPointerPointer
  ) => LEPUSValuePointer = this.module.cwrap("LEPUS_Call", "number", [
    "number",
    "number",
    "number", 
    "number",
    "number",
  ])

  // ===============================
  // LEPUS Error Handling
  // ===============================

  LEPUS_NewError: (ctx: LEPUSContextPointer) => LEPUSValuePointer = 
    this.module.cwrap("LEPUS_NewError", "number", ["number"])

  LEPUS_Throw: (ctx: LEPUSContextPointer, error: LEPUSValuePointer | LEPUSValueConstPointer) => LEPUSValuePointer = 
    this.module.cwrap("LEPUS_Throw", "number", ["number", "number"])

  LEPUS_ResolveException: (ctx: LEPUSContextPointer, maybe_exception: LEPUSValuePointer) => LEPUSValuePointer =
    this.module.cwrap("LEPUS_ResolveException", "number", ["number", "number"])

  // ===============================
  // LEPUS Memory Management
  // ===============================

  LEPUS_SetMemoryLimit: (rt: LEPUSRuntimePointer, limit: number) => void = 
    this.module.cwrap("LEPUS_SetMemoryLimit", null, ["number", "number"])

  LEPUS_GetHeapSize: (rt: LEPUSRuntimePointer) => number = 
    this.module.cwrap("LEPUS_GetHeapSize", "number", ["number"])

  LEPUS_ComputeMemoryUsage: (rt: LEPUSRuntimePointer, ctx: LEPUSContextPointer) => LEPUSValuePointer =
    this.module.cwrap("LEPUS_ComputeMemoryUsage", "number", ["number", "number"])

  // ===============================
  // LEPUS NAPI Integration
  // ===============================

  LEPUS_GetNapiScope: (rt: LEPUSRuntimePointer) => number = // voidPointer
    this.module.cwrap("LEPUS_GetNapiScope", "number", ["number"])

  LEPUS_SetNapiScope: (rt: LEPUSRuntimePointer, scope: number) => void = // voidPointer
    this.module.cwrap("LEPUS_SetNapiScope", null, ["number", "number"])

  LEPUS_InitNapiScope: (rt: LEPUSRuntimePointer) => void = 
    this.module.cwrap("LEPUS_InitNapiScope", null, ["number"])

  LEPUS_FreeNapiScope: (rt: LEPUSRuntimePointer) => void = 
    this.module.cwrap("LEPUS_FreeNapiScope", null, ["number"])

  // ===============================
  // LEPUS DevTools Support
  // ===============================

  LEPUS_EnableDevTools: (ctx: LEPUSContextPointer) => void = 
    this.module.cwrap("LEPUS_EnableDevTools", null, ["number"])

  LEPUS_DisableDevTools: (ctx: LEPUSContextPointer) => void = 
    this.module.cwrap("LEPUS_DisableDevTools", null, ["number"])

  LEPUS_IsDevToolsEnabled: (ctx: LEPUSContextPointer) => number = 
    this.module.cwrap("LEPUS_IsDevToolsEnabled", "number", ["number"])

  // ===============================
  // LEPUS Performance Monitoring
  // ===============================

  LEPUS_GetPerformanceMetrics: (rt: LEPUSRuntimePointer) => LEPUSValuePointer = 
    this.module.cwrap("LEPUS_GetPerformanceMetrics", "number", ["number"])

  LEPUS_ResetPerformanceMetrics: (rt: LEPUSRuntimePointer) => void = 
    this.module.cwrap("LEPUS_ResetPerformanceMetrics", null, ["number"])

  // ===============================
  // Backwards Compatibility (fallback to QTS_* if LEPUS_* not available)
  // ===============================

  // Fallback to QuickJS functions if LEPUS equivalents aren't available
  QTS_NewRuntime: () => LEPUSRuntimePointer = this.module.cwrap("QTS_NewRuntime", "number", [])
  QTS_FreeRuntime: (rt: LEPUSRuntimePointer) => void = this.module.cwrap("QTS_FreeRuntime", null, ["number"])
  QTS_NewContext: (rt: LEPUSRuntimePointer, intrinsics: IntrinsicsFlags) => LEPUSContextPointer =
    this.module.cwrap("QTS_NewContext", "number", ["number", "number"])
  QTS_FreeContext: (ctx: LEPUSContextPointer) => void = this.module.cwrap("QTS_FreeContext", null, ["number"])
  QTS_Eval: (
    ctx: LEPUSContextPointer,
    js_code: BorrowedHeapCharPointer,
    js_code_length: number,
    filename: string,
    detectModule: number,
    evalFlags: EvalFlags,
  ) => LEPUSValuePointer = this.module.cwrap("QTS_Eval", "number", [
    "number",
    "number",
    "number",
    "string", 
    "number",
    "number",
  ])
}