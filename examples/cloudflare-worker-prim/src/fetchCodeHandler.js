/**
 * Fetch Code Handler - Executes JavaScript code with fetch support
 * Updated to use LEPUS directly without Arena or QuickJS
 */

import { createJsonResponse, createErrorResponse } from './utils/responseUtils.js';

/**
 * Execute code in LEPUS context
 */
async function executeLEPUSCode(lepusContext, code) {
    const { ffi, context } = lepusContext;
    
    // Convert code to heap string
    const codePtr = ffi.module.stringToNewUTF8(code);
    
    try {
        // Direct LEPUS evaluation
        const resultPtr = ffi.LEPUS_Eval(
            context,
            codePtr,
            code.length,
            'fetch-code.js',
            0, // detectModule
            0  // evalFlags
        );
        
        // Check for exceptions
        const exceptionPtr = ffi.LEPUS_ResolveException(context, resultPtr);
        if (exceptionPtr !== resultPtr) {
            const errorStr = ffi.module.UTF8ToString(
                ffi.LEPUS_GetString(context, exceptionPtr)
            );
            ffi.LEPUS_FreeValue(context, exceptionPtr);
            throw new Error(errorStr);
        }
        
        // Convert result to JavaScript value
        const resultStr = ffi.module.UTF8ToString(
            ffi.LEPUS_Dump(context, resultPtr)
        );
        
        // Cleanup handled by GC
        return JSON.parse(resultStr);
    } finally {
        // Free the code string
        ffi.module._free(codePtr);
    }
}

/**
 * Handle code execution that includes fetch calls
 * @param {Object} context - Handler context object
 * @param {string} context.code - The JavaScript code to execute
 * @param {Object} context.LEPUS - The LEPUS context instance
 * @returns {Promise<Response>} - Response with execution results
 */
export async function handleFetchCode(context) {
    const { code, LEPUS } = context;

    // Extract fetch URLs and execute them first
    const fetchUrlMatch = code.match(/fetch\(['"`]([^'"`]+)['"`]\)/);
    if (!fetchUrlMatch) {
        throw new Error('No valid fetch URL found in code');
    }

    const fetchUrl = fetchUrlMatch[1];

    try {
        // Pre-fetch the data using native fetch
        const response = await fetch(fetchUrl);
        const data = await response.json();

        // Inject the fetched data into LEPUS context
        const setupCode = `
            globalThis.fetchedData = ${JSON.stringify(data)};
        `;
        await executeLEPUSCode(LEPUS, setupCode);

        // Replace fetch call with the fetched data in the code
        const modifiedCode = code.replace(/fetch\(['"`][^'"`]+['"`]\)(?:\.then\([^)]*\))*/, 'Promise.resolve(fetchedData)');

        // Execute the modified code in LEPUS
        const result = await executeLEPUSCode(LEPUS, modifiedCode);

        return createJsonResponse({
            code: modifiedCode,
            original_code: code,
            fetched_from: fetchUrl,
            result: result
        });
    } catch (fetchError) {
        return createErrorResponse(
            `Fetch failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
            { code },
            500
        );
    }
}

/**
 * Check if code contains fetch calls
 * @param {string} code - The JavaScript code to check
 * @returns {boolean} - True if code contains fetch calls
 */
export function containsFetch(code) {
    return code.includes('fetch(');
}