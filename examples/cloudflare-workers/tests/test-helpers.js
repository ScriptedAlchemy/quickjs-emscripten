/**
 * Helper utilities for handling PrimJS variant differences
 */

/**
 * Unwrap evalCode result from PrimJS variant
 * PrimJS returns DisposableSuccess/DisposableFail objects
 * @param {Object} result - The result from vm.evalCode
 * @returns {Object} - { success: boolean, value?: any, error?: any }
 */
export function unwrapEvalResult(result) {
  if (!result) {
    return { success: false, error: 'No result' };
  }

  // Handle DisposableFail
  if ('error' in result && result.error) {
    return { success: false, error: result.error };
  }

  // Handle DisposableSuccess
  if ('value' in result && result.value) {
    return { success: true, value: result.value };
  }

  // Fallback for direct handle (non-PrimJS variants)
  return { success: true, value: result };
}

/**
 * Safe dispose for evalCode results
 * Handles both PrimJS and standard variants
 * @param {Object} result - The result from vm.evalCode
 */
export function safeDispose(result) {
  if (!result) return;

  // Handle DisposableFail
  if ('error' in result && result.error && typeof result.error.dispose === 'function') {
    result.error.dispose();
  }

  // Handle DisposableSuccess
  if ('value' in result && result.value && typeof result.value.dispose === 'function') {
    result.value.dispose();
  }

  // Handle direct handle
  if (!('error' in result) && !('value' in result) && typeof result.dispose === 'function') {
    result.dispose();
  }
}

/**
 * Evaluate code and get the unwrapped result
 * @param {Object} vm - QuickJS context
 * @param {string} code - Code to evaluate
 * @returns {Object} - { success: boolean, value?: any, error?: string }
 */
export function evalCodeAndUnwrap(vm, code) {
  const result = vm.evalCode(code);
  const unwrapped = unwrapEvalResult(result);
  
  if (unwrapped.success && unwrapped.value) {
    const dumpedValue = vm.dump(unwrapped.value);
    safeDispose(result);
    return { success: true, value: dumpedValue };
  } else if (unwrapped.error) {
    const errorMessage = typeof unwrapped.error === 'string' 
      ? unwrapped.error 
      : vm.dump(unwrapped.error);
    safeDispose(result);
    return { success: false, error: errorMessage };
  }
  
  safeDispose(result);
  return { success: false, error: 'Unknown error' };
}