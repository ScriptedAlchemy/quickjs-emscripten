/**
 * LEPUS-specific type definitions for PrimJS native API
 * 
 * These types extend the base QuickJS types with LEPUS-specific features:
 * - Native garbage collection
 * - NAPI integration
 * - Chrome DevTools support
 * - Performance monitoring
 */

// LEPUS Runtime pointer types
export type LEPUSRuntimePointer = number
export type LEPUSContextPointer = number
export type LEPUSValuePointer = number
export type LEPUSValueConstPointer = number
export type LEPUSValuePointerPointer = number
export type LEPUSValueConstPointerPointer = number

// LEPUS Garbage Collection types
export interface LEPUSGCConfig {
  threshold?: number
  maxHeapSize?: number
  enableWeakRefs?: boolean
  enableFinalization?: boolean
}

export interface LEPUSGCMetrics {
  heapSize: number
  usedMemory: number
  gcCycles: number
  lastGCDuration: number
  isInGCSweep: boolean
}

// LEPUS NAPI types
export type LEPUSNapiScope = number // void pointer
export type LEPUSNapiValue = number
export type LEPUSNapiCallback = (env: LEPUSNapiScope, info: LEPUSNapiValue) => LEPUSNapiValue

export interface LEPUSNapiConfig {
  enableNAPI?: boolean
  napiVersion?: number
  externalProvider?: string
}

// LEPUS DevTools types
export interface LEPUSDevToolsConfig {
  enabled: boolean
  debuggerPort?: number
  inspectorUrl?: string
  enableProfiler?: boolean
  enableMemoryProfiler?: boolean
}

// LEPUS Performance types
export interface LEPUSPerformanceMetrics {
  executionTime: number
  compilationTime: number
  gcTime: number
  memoryUsage: LEPUSGCMetrics
  functionCalls: number
  objectCreations: number
}

// LEPUS Runtime Configuration
export interface LEPUSRuntimeConfig {
  gc?: LEPUSGCConfig
  napi?: LEPUSNapiConfig
  devtools?: LEPUSDevToolsConfig
  memoryLimit?: number
  stackSize?: number
  enablePerformanceMonitoring?: boolean
}

// LEPUS Context Configuration
export interface LEPUSContextConfig {
  enableDevTools?: boolean
  enableGC?: boolean
  intrinsics?: number
  maxStackDepth?: number
}

// LEPUS Value Creation Options
export interface LEPUSValueOptions {
  /** Whether the value should be managed by GC */
  gcManaged?: boolean
  /** Whether to create a weak reference */
  weak?: boolean
  /** Custom finalizer for the value */
  finalizer?: () => void
}

// LEPUS Error types
export interface LEPUSError {
  name: string
  message: string
  stack?: string
  lepusSpecific?: {
    gcState?: string
    napiError?: boolean
    performanceImpact?: number
  }
}

// LEPUS Module types
export interface LEPUSModule {
  name: string
  exports: Record<string, LEPUSValuePointer>
  napiExports?: Record<string, LEPUSNapiValue>
  isNative?: boolean
}

// LEPUS Evaluation flags (extends base EvalFlags)
export const enum LEPUSEvalFlags {
  /** Standard evaluation */
  STANDARD = 0,
  /** Enable GC during evaluation */
  ENABLE_GC = 1 << 0,
  /** Enable NAPI during evaluation */
  ENABLE_NAPI = 1 << 1,
  /** Enable DevTools debugging */
  ENABLE_DEVTOOLS = 1 << 2,
  /** Enable performance monitoring */
  ENABLE_PERFORMANCE = 1 << 3,
  /** Use template interpreter */
  USE_TEMPLATE_INTERPRETER = 1 << 4,
  /** Enable stack caching */
  ENABLE_STACK_CACHING = 1 << 5,
}

// LEPUS intrinsics flags (extends base IntrinsicsFlags)
export const enum LEPUSIntrinsicsFlags {
  /** Standard intrinsics */
  STANDARD = 0,
  /** Include GC intrinsics */
  GC = 1 << 0,
  /** Include NAPI intrinsics */
  NAPI = 1 << 1,
  /** Include DevTools intrinsics */
  DEVTOOLS = 1 << 2,
  /** Include performance intrinsics */
  PERFORMANCE = 1 << 3,
  /** All LEPUS intrinsics */
  ALL = GC | NAPI | DEVTOOLS | PERFORMANCE,
}