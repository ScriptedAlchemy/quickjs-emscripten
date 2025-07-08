import { MODULE_FEDERATION, EXECUTION_TIMEOUTS } from './utils/constants.js';
import { validateExecuteModuleInput, createContextualErrorResponse, createErrorResponse, ValidationError } from './utils/responseUtils.js';
import { Logger, LogIcons } from './utils/logger.js';

/**
 * Handle module execution routes
 * @param {Object} context - Request context
 * @param {URL} context.url - Request URL
 * @param {Object} context.env - Environment variables
 * @param {Object} context.corsHeaders - CORS headers
 * @param {Object} context.LEPUS - LEPUS instance with ffi, runtime, and context
 * @returns {Promise<Response>}
 */
export async function handleExecuteModuleRoute(context) {
	const { url, env, corsHeaders, LEPUS, request } = context;
	
	// Create logger for this handler
	const logger = new Logger({ name: 'ExecuteModule' });
	const phaseLogger = logger.createPhaseLogger();
	
	let requestBody = null;

	try {
		// Phase 1: Validation
		phaseLogger.startPhase('Input Validation');
		
		// Parse JSON body from POST request
		try {
			requestBody = await request.json();
		} catch (e) {
			throw new ValidationError('Invalid JSON in request body', ['Request body must be valid JSON']);
		}

		const { module, function: func, params } = requestBody;

		// Validate environment
		if (!env) {
			throw new ValidationError('Missing environment object', ['Environment is required']);
		} else if (!env.MODULE_FEDERATION_ASSETS) {
			throw new ValidationError('Missing MODULE_FEDERATION_ASSETS in environment', ['KV namespace is required']);
		}

		// Validate required fields
		if (!module || typeof module !== 'string') {
			throw new ValidationError('Missing or invalid module parameter', ['module must be a non-empty string']);
		}
		if (!func || typeof func !== 'string') {
			throw new ValidationError('Missing or invalid function parameter', ['function must be a non-empty string']);
		}

		// Validate module is in allowed list
		const validModules = ['HelloWorld', 'DataProcessor', 'WorkerUtils', 'FetchUtils', 'AdvancedExamples', 'ApiUtils'];
		if (!validModules.includes(module)) {
			throw new ValidationError(`Invalid module: ${module}`, [`Valid modules: ${validModules.join(', ')}`]);
		}

		// Validate that params is defined (can be any type)
		const parsedParams = params !== undefined ? params : {};
		
		phaseLogger.endPhase({ module, function: func });

		// Phase 2: Load Remote Entry
		phaseLogger.startPhase('Load Remote Entry');
		
		const remoteEntry = await env.MODULE_FEDERATION_ASSETS.get('remoteEntry.js');
		if (!remoteEntry) {
			logger.error('Remote entry not found in KV storage', { module, func });
			return createContextualErrorResponse(
				new Error('Remote entry not found in KV storage'),
				{
					handler: 'executeModuleHandler',
					operation: 'loadRemoteEntry',
					inputs: { module, func }
				},
				404,
				corsHeaders
			);
		}
		
		phaseLogger.endPhase({ 
			remoteEntrySize: remoteEntry.length,
			found: true 
		});

		// Phase 3: Execute Module
		phaseLogger.startPhase('Execute Module Function');
		
		logger.network(`Executing ${module}.${func}`, { params: parsedParams });
		
		// Execute module function using LEPUS
		const result = await executeLEPUSModule(
			LEPUS,
			remoteEntry,
			env.MODULE_FEDERATION_ASSETS,
			{
				module,
				func,
				params: parsedParams
			}
		);
		
		phaseLogger.endPhase({
			success: result.success,
			hasResult: !!result.result
		});

		// Phase 4: Prepare Response
		phaseLogger.startPhase('Prepare Response');
		
		const response = new Response(JSON.stringify(result, null, 2), {
			headers: {
				'Content-Type': 'application/json',
				...corsHeaders
			}
		});
		
		phaseLogger.endPhase({ 
			responseSize: JSON.stringify(result).length 
		});
		
		// Log phase summary
		phaseLogger.logSummary();
		
		logger.success(`Module execution completed: ${module}.${func}`, {
			totalDuration: phaseLogger.getSummary().totalDuration
		});

		return response;

	} catch (error) {
		// Log error with context
		logger.error(`Module execution failed: ${error.message}`, {
			module: requestBody?.module,
			function: requestBody?.func,
			errorType: error.constructor.name
		});
		
		// Handle validation errors with 400 status
		if (error instanceof ValidationError) {
			return createContextualErrorResponse(
				error,
				{
					handler: 'executeModuleHandler',
					operation: 'validation',
					inputs: { 
						module: requestBody?.module,
						func: requestBody?.func
					}
				},
				400,
				corsHeaders
			);
		}

		// Handle other errors
		return createContextualErrorResponse(
			error,
			{
				handler: 'executeModuleHandler',
				operation: 'executeModule',
				inputs: { 
					module: requestBody?.module,
					func: requestBody?.func
				}
			},
			500,
			corsHeaders
		);
	}
}

/**
 * Execute a module function using LEPUS runtime
 * @param {Object} LEPUS - LEPUS instance with ffi, runtime, and context
 * @param {string} remoteEntry - Remote entry JavaScript code
 * @param {Object} kvNamespace - KV namespace for asset loading
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} - Execution result
 */
async function executeLEPUSModule(LEPUS, remoteEntry, kvNamespace, options) {
	const { ffi, context } = LEPUS;
	const { module, func, params } = options;
	
	try {
		// Create a module loader function that can fetch dependencies
		const moduleLoaderCode = `
			// Module cache
			const moduleCache = {};
			
			// Asset loader function
			globalThis.__loadAsset = async (path) => {
				// This will be replaced with actual implementation
				throw new Error('Asset loading not implemented in sync context');
			};
			
			// Execute remote entry
			${remoteEntry}
			
			// Access the exposed module
			if (typeof __remoteEntry !== 'undefined' && __remoteEntry.get) {
				const exposedModule = __remoteEntry.get('./${module}');
				if (exposedModule && exposedModule.${func}) {
					const result = exposedModule.${func}(${JSON.stringify(params)});
					JSON.stringify({ success: true, result });
				} else {
					JSON.stringify({ 
						success: false, 
						error: 'Function not found: ' + '${module}.${func}' 
					});
				}
			} else {
				JSON.stringify({ 
					success: false, 
					error: 'Remote entry not properly initialized' 
				});
			}
		`;
		
		// Convert code to heap string
		const codePtr = ffi.module.stringToNewUTF8(moduleLoaderCode);
		
		try {
			// Execute using LEPUS
			const resultPtr = ffi.LEPUS_Eval(
				context,
				codePtr,
				moduleLoaderCode.length,
				'module-loader.js',
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
			
			// Get result string
			const resultStr = ffi.module.UTF8ToString(
				ffi.LEPUS_GetString(context, resultPtr)
			);
			
			// Parse and return result
			const result = JSON.parse(resultStr);
			
			// Cleanup (GC will handle most of it)
			if (!ffi.LEPUS_IsGCMode(context)) {
				ffi.LEPUS_FreeValue(context, resultPtr);
			}
			
			// Run GC to clean up
			ffi.LEPUS_RunGC(ffi.LEPUS_GetRuntime(context));
			
			return result;
			
		} finally {
			// Free the code string
			ffi.module._free(codePtr);
		}
		
	} catch (error) {
		return {
			success: false,
			error: error.message || 'Unknown error during module execution'
		};
	}
}
