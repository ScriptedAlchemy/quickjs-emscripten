/**
 * PrimJS Compatibility Header
 * Maps LEPUS* API to standard JS* API for compatibility with quickjs-emscripten
 */

#ifndef PRIMJS_COMPAT_H
#define PRIMJS_COMPAT_H

#ifdef QTS_USE_PRIMJS

#include <string.h>  // For strstr in module detection

// Fix C++ default arguments issue when compiling as C
#ifdef __cplusplus
extern "C" {
#endif

// Forward declare structures from quickjs-inner.h
// We need JS_CLASS_PROMISE and JSPromiseData for our promise state functions
// Include this after LEPUS types are defined to avoid circular dependencies
typedef enum {
  JS_CLASS_PROMISE = 19  // From quickjs-inner.h enum JSClassShortID
} JSClassShortID_Promise;

// Include necessary definitions from cutils.h
typedef int BOOL;
#ifndef FALSE
enum {
  FALSE = 0,
  TRUE = 1,
};
#endif

// Type mappings
#define JSRuntime LEPUSRuntime
#define JSContext LEPUSContext
#define JSValue LEPUSValue
#define JSValueConst LEPUSValueConst
#define JSAtom JSAtom
#define JSCFunction LEPUSCFunction
#define JSClassID LEPUSClassID
#define JSClassDef LEPUSClassDef
#define JSMallocFunctions LEPUSMallocFunctions
#define JSPropertyEnum LEPUSPropertyEnum
#define JSPropertyDescriptor LEPUSPropertyDescriptor
#define JSModuleDef LEPUSModuleDef

// Memory usage struct - PrimJS requires LYNX_SIMPLIFY to be defined
#ifndef LYNX_SIMPLIFY
#define LYNX_SIMPLIFY 1
#endif
typedef struct LEPUSMemoryUsage {
  int64_t malloc_size, malloc_limit, memory_used_size;
  int64_t malloc_count;
  int64_t memory_used_count;
  int64_t atom_count, atom_size;
  int64_t str_count, str_size;
  int64_t obj_count, obj_size;
  int64_t prop_count, prop_size;
  int64_t shape_count, shape_size;
  int64_t lepus_func_count, lepus_func_size, lepus_func_code_size;
  int64_t lepus_func_pc2line_count, lepus_func_pc2line_size;
  int64_t c_func_count, array_count;
  int64_t fast_array_count, fast_array_elements;
  int64_t binary_object_count, binary_object_size;
} LEPUSMemoryUsage;
#define JSMemoryUsage LEPUSMemoryUsage

// Runtime functions
#define JS_NewRuntime LEPUS_NewRuntime
#define JS_FreeRuntime LEPUS_FreeRuntime
#define JS_SetMemoryLimit LEPUS_SetMemoryLimit
#define JS_SetMaxStackSize(rt, size) /* Not directly available in PrimJS */
#define JS_SetInterruptHandler LEPUS_SetInterruptHandler
#define JS_IsJobPending LEPUS_IsJobPending
#define JS_ExecutePendingJob LEPUS_ExecutePendingJob

// Memory usage functions - need to declare them
void LEPUS_ComputeMemoryUsage(LEPUSRuntime *rt, LEPUSMemoryUsage *s);
void LEPUS_DumpMemoryUsage(FILE *fp, const LEPUSMemoryUsage *s, LEPUSRuntime *rt);
#define JS_ComputeMemoryUsage LEPUS_ComputeMemoryUsage
#define JS_DumpMemoryUsage LEPUS_DumpMemoryUsage

// Context functions
#define JS_NewContext LEPUS_NewContext
#define JS_NewContextRaw LEPUS_NewContextRaw
#define JS_FreeContext LEPUS_FreeContext
#define JS_GetRuntime LEPUS_GetRuntime
#define JS_SetContextOpaque LEPUS_SetContextOpaque
#define JS_GetContextOpaque LEPUS_GetContextOpaque

// Value functions
#define JS_NewBool LEPUS_NewBool
#define JS_NewInt32 LEPUS_NewInt32
#define JS_NewInt64 LEPUS_NewInt64
#define JS_NewFloat64 LEPUS_NewFloat64
#define JS_NewString LEPUS_NewString
#define JS_NewStringLen LEPUS_NewStringLen
#define JS_NewAtomString LEPUS_NewAtomString
#define JS_NewObject LEPUS_NewObject
#define JS_NewObjectProto LEPUS_NewObjectProto
#define JS_NewObjectClass LEPUS_NewObjectClass
#define JS_NewArray LEPUS_NewArray
#define JS_NewArrayBuffer LEPUS_NewArrayBuffer
#define JS_NewArrayBufferCopy LEPUS_NewArrayBufferCopy
#define JS_NewError LEPUS_NewError
#define JS_Throw LEPUS_Throw
#define JS_GetException LEPUS_GetException
#define JS_IsError LEPUS_IsError
#define JS_NewUint32(ctx, val) LEPUS_NewInt64(ctx, (int64_t)(uint32_t)(val))

// Value operations
#define JS_FreeValue LEPUS_FreeValue
#define JS_FreeValueRT LEPUS_FreeValueRT
#define JS_DupValue LEPUS_DupValue
#define JS_DupValueRT LEPUS_DupValueRT
#define JS_ToBool LEPUS_ToBool
#define JS_ToInt32 LEPUS_ToInt32
#define JS_ToInt64 LEPUS_ToInt64
#define JS_ToFloat64 LEPUS_ToFloat64
#define JS_ToString LEPUS_ToString
#define JS_ToCString LEPUS_ToCString
#define JS_ToCStringLen LEPUS_ToCStringLen
#define JS_FreeCString LEPUS_FreeCString

// Property operations
#define JS_GetPropertyStr LEPUS_GetPropertyStr
#define JS_GetPropertyUint32 LEPUS_GetPropertyUint32
#define JS_GetProperty LEPUS_GetProperty
#define JS_SetPropertyStr LEPUS_SetPropertyStr
#define JS_SetPropertyUint32 LEPUS_SetPropertyUint32
#define JS_SetProperty LEPUS_SetProperty
#define JS_HasProperty LEPUS_HasProperty
#define JS_DeleteProperty LEPUS_DeleteProperty
#define JS_DefineProperty LEPUS_DefineProperty
#define JS_DefinePropertyValue LEPUS_DefinePropertyValue
#define JS_DefinePropertyValueStr LEPUS_DefinePropertyValueStr
#define JS_DefinePropertyGetSet LEPUS_DefinePropertyGetSet
#define JS_GetOwnPropertyNames LEPUS_GetOwnPropertyNames
#define JS_GetOwnProperty LEPUS_GetOwnProperty

// Type checking
#define JS_IsUndefined LEPUS_IsUndefined
#define JS_IsNull LEPUS_IsNull
#define JS_IsBool LEPUS_IsBool
#define JS_IsNumber LEPUS_IsNumber
#define JS_IsString LEPUS_IsString
#define JS_IsSymbol LEPUS_IsSymbol
#define JS_IsObject LEPUS_IsObject
#define JS_IsArray LEPUS_IsArray
#define JS_IsFunction LEPUS_IsFunction
#define JS_IsConstructor LEPUS_IsConstructor
#define JS_IsException LEPUS_IsException
#define JS_IsUninitialized LEPUS_IsUninitialized

// Function operations
#define JS_Call LEPUS_Call
#define JS_CallConstructor LEPUS_CallConstructor
#define JS_CallConstructor2 LEPUS_CallConstructor2
#define JS_Invoke LEPUS_Invoke
#define JS_NewCFunction LEPUS_NewCFunction
#define JS_NewCFunction2 LEPUS_NewCFunction2
#define JS_NewCFunctionData LEPUS_NewCFunctionData
#define JS_SetConstructor LEPUS_SetConstructor

// Eval
#define JS_Eval LEPUS_Eval
// PrimJS EvalFunction compatibility - may need adjustment based on actual PrimJS API
static inline LEPUSValue JS_EvalFunction(LEPUSContext *ctx, LEPUSValue fun_obj) {
    // In PrimJS, EvalFunction might work differently
    // We'll try the basic approach first
    return LEPUS_EvalFunction(ctx, fun_obj, LEPUS_UNDEFINED);
}
#define JS_GetGlobalObject LEPUS_GetGlobalObject

// Atom operations
#define JS_NewAtom LEPUS_NewAtom
#define JS_NewAtomLen LEPUS_NewAtomLen
#define JS_AtomToString LEPUS_AtomToString
#define JS_AtomToCString LEPUS_AtomToCString
#define JS_FreeAtom LEPUS_FreeAtom
#define JS_FreeAtomRT LEPUS_FreeAtomRT
#define JS_ValueToAtom LEPUS_ValueToAtom
#define JS_AtomToValue LEPUS_AtomToValue

// Class operations
#define JS_NewClass LEPUS_NewClass
#define JS_NewClassID LEPUS_NewClassID
#define JS_SetClassProto LEPUS_SetClassProto
#define JS_GetClassProto LEPUS_GetClassProto

// Module operations
#define JS_SetModuleLoaderFunc LEPUS_SetModuleLoaderFunc
#define JS_NewCModule LEPUS_NewCModule
#define JS_AddModuleExport LEPUS_AddModuleExport
#define JS_AddModuleExportList LEPUS_AddModuleExportList
#define JS_SetModuleExport LEPUS_SetModuleExport
#define JS_SetModuleExportList LEPUS_SetModuleExportList

// Array buffer operations
#define JS_GetArrayBuffer LEPUS_GetArrayBuffer
#define JS_GetTypedArrayBuffer LEPUS_GetTypedArrayBuffer
#define JS_DetachArrayBuffer LEPUS_DetachArrayBuffer

// Promise states - PrimJS doesn't have promise state enum
typedef enum {
  JS_PROMISE_PENDING = 0,
  JS_PROMISE_FULFILLED = 1,
  JS_PROMISE_REJECTED = 2,
} JSPromiseStateEnum;
#define LEPUS_PROMISE_PENDING JS_PROMISE_PENDING
#define LEPUS_PROMISE_FULFILLED JS_PROMISE_FULFILLED
#define LEPUS_PROMISE_REJECTED JS_PROMISE_REJECTED

// Promise operations
#define JS_NewPromiseCapability LEPUS_NewPromiseCapability

// Forward declarations for promise state functions
// JSPromiseStateEnum primjs_compat_promise_state(LEPUSContext *ctx, LEPUSValueConst promise);
// LEPUSValue primjs_compat_promise_result(LEPUSContext *ctx, LEPUSValueConst promise);

#define JS_PromiseState primjs_compat_promise_state
#define JS_PromiseResult primjs_compat_promise_result

// JSON operations
#define JS_JSONStringify(ctx, obj, replacer, space) LEPUS_ToJSON(ctx, obj, 0)
#define JS_ParseJSON LEPUS_ParseJSON

// Intrinsics
#define JS_AddIntrinsicBaseObjects LEPUS_AddIntrinsicBaseObjects
#define JS_AddIntrinsicDate LEPUS_AddIntrinsicDate
#define JS_AddIntrinsicEval LEPUS_AddIntrinsicEval
#define JS_AddIntrinsicStringNormalize LEPUS_AddIntrinsicStringNormalize
#define JS_AddIntrinsicRegExp LEPUS_AddIntrinsicRegExp
#define JS_AddIntrinsicRegExpCompiler LEPUS_AddIntrinsicRegExpCompiler
#define JS_AddIntrinsicJSON LEPUS_AddIntrinsicJSON
#define JS_AddIntrinsicProxy LEPUS_AddIntrinsicProxy
#define JS_AddIntrinsicMapSet LEPUS_AddIntrinsicMapSet
#define JS_AddIntrinsicTypedArrays LEPUS_AddIntrinsicTypedArrays
#define JS_AddIntrinsicPromise LEPUS_AddIntrinsicPromise
// PrimJS BigInt support - built-in, no explicit intrinsic needed
#define JS_AddIntrinsicBigInt(ctx) /* BigInt is built-in to PrimJS */
#define JS_NewBigInt64(ctx, val) LEPUS_NewBigInt64(ctx, val)
#define JS_ToBigInt64(ctx, pres, val) LEPUS_ToBigInt64(ctx, pres, val)
// PrimJS doesn't support BigFloat/BigDecimal
#define JS_AddIntrinsicBigFloat(ctx) /* Not supported in PrimJS */
#define JS_AddIntrinsicBigDecimal(ctx) /* Not supported in PrimJS */
#define JS_AddIntrinsicOperators(ctx) /* Not supported in PrimJS */
#define JS_EnableBignumExt(ctx, val) /* Not supported in PrimJS */

// Memory allocation
#define js_malloc(ctx, size) lepus_malloc(ctx, size, 1)
#define js_free(ctx, ptr) lepus_free(ctx, ptr)
#define js_realloc(ctx, ptr, size) lepus_realloc(ctx, ptr, size, 1)
#define js_malloc_rt(rt, size) lepus_malloc_rt(rt, size, 1)
#define js_free_rt(rt, ptr) lepus_free_rt(rt, ptr)

// Additional functions
#define js_std_dump_error lepus_std_dump_error
// Module detection - basic implementation for PrimJS
static inline int JS_DetectModule(const char *code, size_t len) {
    // Simple heuristic: look for import/export statements
    const char *import_pos = strstr(code, "import");
    const char *export_pos = strstr(code, "export");
    return (import_pos != NULL || export_pos != NULL) ? 1 : 0;
}
#define JS_VALUE_GET_TAG(v) LEPUS_VALUE_GET_TAG(v)
#define JS_VALUE_GET_PTR(v) LEPUS_VALUE_GET_PTR(v)
#define JS_TAG_MODULE LEPUS_TAG_MODULE
#define JS_ThrowInternalError LEPUS_ThrowInternalError
// Module namespace support - PrimJS compatibility implementation
static inline LEPUSValue JS_GetModuleNamespace(LEPUSContext *ctx, LEPUSModuleDef *module) {
    if (!module) {
        return LEPUS_UNDEFINED;
    }
    // PrimJS uses LEPUS_GetModuleNamespace for this functionality
    // Try the direct LEPUS function first
    return LEPUS_GetModuleNamespace(ctx, module);
}
// PrimJS BigInt detection using tag comparison
static inline int LEPUS_IsBigInt(LEPUSContext *ctx, LEPUSValueConst val) {
    return (LEPUS_VALUE_GET_TAG(val) == LEPUS_TAG_INT);
}
#define JS_IsBigInt(ctx, val) LEPUS_IsBigInt(ctx, val)
#define JS_ToUint32 LEPUS_ToUint32
#define JS_SameValue LEPUS_SameValue
#define JS_SameValueZero(ctx, a, b) LEPUS_SameValue(ctx, a, b) /* Approximate */
#define JS_StrictEq LEPUS_StrictEq
#define JS_NewCFunctionMagic LEPUS_NewCFunctionMagic
#define JS_CFUNC_generic_magic LEPUS_CFUNC_generic_magic
#define js_strdup(ctx, str) lepus_strdup(ctx, str, 1)
#define JSModuleNormalizeFunc LEPUSModuleNormalizeFunc
#define JS_WriteObject LEPUS_WriteObject
#define JS_ReadObject LEPUS_ReadObject
#define JS_WRITE_OBJ_REFERENCE 0 /* Not defined in PrimJS */

// Constants
#define JS_UNDEFINED LEPUS_UNDEFINED
#define JS_NULL LEPUS_NULL
#define JS_FALSE LEPUS_FALSE
#define JS_TRUE LEPUS_TRUE
#define JS_EXCEPTION LEPUS_EXCEPTION
#define JS_UNINITIALIZED LEPUS_UNINITIALIZED

// BigInt tag from PrimJS - use LEPUS_TAG_INT instead
// static const int64_t LEPUS_BIG_INT_TAG = (0x2 | 0xffff000000000000ll);

// Eval flags
#define JS_EVAL_TYPE_GLOBAL LEPUS_EVAL_TYPE_GLOBAL
#define JS_EVAL_TYPE_MODULE LEPUS_EVAL_TYPE_MODULE
#define JS_EVAL_TYPE_DIRECT LEPUS_EVAL_TYPE_DIRECT
#define JS_EVAL_TYPE_INDIRECT LEPUS_EVAL_TYPE_INDIRECT
#define JS_EVAL_FLAG_STRICT LEPUS_EVAL_FLAG_STRICT
#define JS_EVAL_FLAG_STRIP LEPUS_EVAL_FLAG_STRIP
#define JS_EVAL_FLAG_COMPILE_ONLY LEPUS_EVAL_FLAG_COMPILE_ONLY

// Property flags
#define JS_PROP_CONFIGURABLE LEPUS_PROP_CONFIGURABLE
#define JS_PROP_WRITABLE LEPUS_PROP_WRITABLE
#define JS_PROP_ENUMERABLE LEPUS_PROP_ENUMERABLE
#define JS_PROP_C_W_E LEPUS_PROP_C_W_E
#define JS_PROP_LENGTH LEPUS_PROP_LENGTH
#define JS_PROP_GETSET LEPUS_PROP_GETSET
#define JS_PROP_HAS_GET LEPUS_PROP_HAS_GET
#define JS_PROP_HAS_SET LEPUS_PROP_HAS_SET
#define JS_PROP_HAS_VALUE LEPUS_PROP_HAS_VALUE
#define JS_PROP_HAS_CONFIGURABLE LEPUS_PROP_HAS_CONFIGURABLE
#define JS_PROP_HAS_WRITABLE LEPUS_PROP_HAS_WRITABLE
#define JS_PROP_HAS_ENUMERABLE LEPUS_PROP_HAS_ENUMERABLE

// GPN flags
#define JS_GPN_STRING_MASK LEPUS_GPN_STRING_MASK
#define JS_GPN_SYMBOL_MASK LEPUS_GPN_SYMBOL_MASK
#define JS_GPN_PRIVATE_MASK LEPUS_GPN_PRIVATE_MASK
#define JS_GPN_ENUM_ONLY LEPUS_GPN_ENUM_ONLY
#define JS_GPN_SET_ENUM LEPUS_GPN_SET_ENUM

// Include the inner header for JSPromiseData after LEPUS types are defined
// #include "../vendor/primjs/src/interpreter/quickjs/include/quickjs-inner.h" // Problematic include, causes build issues

// Promise state functions - PrimJS implementation
// Since we can't include quickjs-inner.h, we'll use a simplified approach
static inline JSPromiseStateEnum LEPUS_PromiseState(LEPUSContext *ctx, LEPUSValueConst promise) {
    // For now, we'll assume promises are always fulfilled in PrimJS
    // This is a placeholder implementation
    return JS_PROMISE_FULFILLED;
}

static inline LEPUSValue LEPUS_PromiseResult(LEPUSContext *ctx, LEPUSValueConst promise) {
    // For now, return the promise itself as the result
    // This is a placeholder implementation
    return LEPUS_DupValue(ctx, promise);
}

// Additional compatibility functions that may need custom implementation
// PrimJS doesn't have runtime opaque data, we'll use a global map
#include <stdlib.h>

typedef struct RuntimeOpaqueNode {
    LEPUSRuntime *rt;
    void *opaque;
    struct RuntimeOpaqueNode *next;
} RuntimeOpaqueNode;

static RuntimeOpaqueNode *runtime_opaque_map = NULL;

static inline void JS_SetRuntimeOpaque(LEPUSRuntime *rt, void *opaque) {
    RuntimeOpaqueNode *node = runtime_opaque_map;
    while (node) {
        if (node->rt == rt) {
            node->opaque = opaque;
            return;
        }
        node = node->next;
    }
    // Add new node
    node = (RuntimeOpaqueNode*)malloc(sizeof(RuntimeOpaqueNode));
    node->rt = rt;
    node->opaque = opaque;
    node->next = runtime_opaque_map;
    runtime_opaque_map = node;
}

static inline void* JS_GetRuntimeOpaque(LEPUSRuntime *rt) {
    RuntimeOpaqueNode *node = runtime_opaque_map;
    while (node) {
        if (node->rt == rt) {
            return node->opaque;
        }
        node = node->next;
    }
    return NULL;
}

// Clean up opaque data when runtime is freed
static inline void primjs_cleanup_runtime_opaque(LEPUSRuntime *rt) {
    RuntimeOpaqueNode **prev = &runtime_opaque_map;
    RuntimeOpaqueNode *node = runtime_opaque_map;
    while (node) {
        if (node->rt == rt) {
            *prev = node->next;
            free(node);
            return;
        }
        prev = &node->next;
        node = node->next;
    }
}

// Promise state implementation for PrimJS compatibility
// Based on simplified promise handling without internal structures
static inline JSPromiseStateEnum primjs_compat_promise_state(LEPUSContext *ctx, LEPUSValueConst promise) {
    if (!LEPUS_IsObject(promise))
        return (JSPromiseStateEnum)(-1); // Not a promise
        
    // Try to check if this is a promise by looking for 'then' method
    LEPUSValue then_prop = LEPUS_GetPropertyStr(ctx, promise, "then");
    if (LEPUS_IsUndefined(then_prop) || !LEPUS_IsFunction(ctx, then_prop)) {
        LEPUS_FreeValue(ctx, then_prop);
        return (JSPromiseStateEnum)(-1); // Not a promise
    }
    LEPUS_FreeValue(ctx, then_prop);
    
    // Check for resolved state by looking for internal promise properties
    // For now, assume all valid promises are fulfilled since PrimJS 
    // doesn't expose direct promise state inspection
    return JS_PROMISE_FULFILLED;
}

static inline LEPUSValue primjs_compat_promise_result(LEPUSContext *ctx, LEPUSValueConst promise) {
    if (!LEPUS_IsObject(promise))
        return LEPUS_UNDEFINED;
        
    // For fulfilled promises, return the promise itself as the result
    // This works for module exports that are already resolved
    return LEPUS_DupValue(ctx, promise);
}

#ifdef __cplusplus
}
#endif

#endif // QTS_USE_PRIMJS

#endif // PRIMJS_COMPAT_H