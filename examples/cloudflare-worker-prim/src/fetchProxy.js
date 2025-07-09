/**
 * Fetch Proxy - LEPUS-native fetch implementation
 * Provides native fetch capabilities directly to LEPUS JavaScript execution
 */

/**
 * Create a fetch bridge for LEPUS context
 * Provides native fetch capabilities to LEPUS JavaScript execution
 */
export function createLEPUSFetchBridge() {
    return {
        /**
         * Make an HTTP request from LEPUS context
         * @param {string} url - The URL to fetch
         * @param {Object} options - Fetch options (method, headers, body, etc.)
         * @returns {Promise<Object>} - Response object
         */
        async request(url, options = {}) {
            try {
                // Make native fetch request
                const response = await fetch(url, {
                    method: options.method || 'GET',
                    headers: options.headers || {},
                    body: options.body,
                    ...options
                });

                // Read response body
                const body = await response.text();

                // Return structured response
                return {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    url: response.url,
                    ok: response.ok,
                    body: body
                };
            } catch (error) {
                // Return error response
                return {
                    status: 0,
                    statusText: 'Network Error',
                    headers: {},
                    url: url,
                    ok: false,
                    body: error.message,
                    error: true
                };
            }
        }
    };
}

/**
 * Setup fetch capabilities in LEPUS context
 * @param {Object} lepusContext - The LEPUS context object with ffi and context
 * @returns {Object} - The fetch bridge instance
 */
export async function setupLEPUSFetch(lepusContext) {
    const { ffi, context } = lepusContext;
    
    // Create fetch bridge
    const fetchBridge = createLEPUSFetchBridge();
    
    // Create a native function that can be called from LEPUS
    const nativeFetchFunction = async (url, options) => {
        return await fetchBridge.request(url, options);
    };
    
    // Inject fetch directly into LEPUS context
    const fetchSetupCode = `
        // Implement fetch API for LEPUS
        globalThis.fetch = async (input, init) => {
            const url = typeof input === 'string' ? input : input.url;
            const options = init || {};
            
            // Call the native fetch bridge
            const responseData = await globalThis.__nativeFetch(url, options);
            
            // Create Response-like object
            return {
                status: responseData.status,
                statusText: responseData.statusText,
                headers: new Map(Object.entries(responseData.headers)),
                url: responseData.url,
                ok: responseData.ok,
                text: async () => responseData.body,
                json: async () => {
                    try {
                        return JSON.parse(responseData.body);
                    } catch (e) {
                        throw new Error('Failed to parse JSON: ' + e.message);
                    }
                },
                arrayBuffer: async () => {
                    throw new Error('arrayBuffer() not supported in LEPUS fetch');
                },
                blob: async () => {
                    throw new Error('blob() not supported in LEPUS fetch');
                }
            };
        };
        
        // Response constructor for compatibility
        globalThis.Response = class Response {
            constructor(body, init = {}) {
                this.body = body;
                this.status = init.status || 200;
                this.statusText = init.statusText || 'OK';
                this.headers = new Map(Object.entries(init.headers || {}));
                this.ok = this.status >= 200 && this.status < 300;
                this.url = '';
            }
            
            async text() {
                return String(this.body);
            }
            
            async json() {
                return JSON.parse(this.body);
            }
        };
    `;
    
    // First, inject the native fetch function reference
    // This would need to be implemented via the LEPUS FFI bridge
    // For now, we'll set up the JavaScript side and the native side would be wired up separately
    
    // Execute setup code in LEPUS
    const codePtr = ffi.module.stringToNewUTF8(fetchSetupCode);
    try {
        const resultPtr = ffi.LEPUS_Eval(
            context,
            codePtr,
            fetchSetupCode.length,
            'fetch-setup.js',
            0,
            0
        );
        
        // Check for exceptions
        const exceptionPtr = ffi.LEPUS_ResolveException(context, resultPtr);
        if (exceptionPtr !== resultPtr) {
            const errorStr = ffi.module.UTF8ToString(
                ffi.LEPUS_GetString(context, exceptionPtr)
            );
            ffi.LEPUS_FreeValue(context, exceptionPtr);
            throw new Error('Failed to setup fetch: ' + errorStr);
        }
        
        ffi.LEPUS_FreeValue(context, resultPtr);
    } finally {
        ffi.module._free(codePtr);
    }
    
    // Store the native fetch function for the bridge
    lepusContext.nativeFetch = nativeFetchFunction;
    
    return fetchBridge;
}

/**
 * Inject native fetch function into LEPUS context
 * This should be called after setupLEPUSFetch to wire up the native bridge
 * @param {Object} lepusContext - The LEPUS context object
 * @param {Function} nativeFetchFn - The native fetch function to inject
 */
export async function injectNativeFetch(lepusContext, nativeFetchFn) {
    const { ffi, context } = lepusContext;
    
    // Store the native fetch function on the context for access from LEPUS
    lepusContext.nativeFetch = nativeFetchFn;
    
    // The actual bridging would be done through LEPUS FFI mechanisms
    // This is a placeholder for the native function injection
    return true;
}