import { waitForArenaResult } from './utils/arenaUtils.js';
import { MODULE_FEDERATION, EXECUTION_TIMEOUTS } from './utils/constants.js';
import { validateExecuteModuleInput, createContextualErrorResponse, createErrorResponse, ValidationError } from './utils/responseUtils.js';
import { Logger, LogIcons } from './utils/logger.js';

/**
 * Handle module execution routes
 * @param {Object} context - Request context
 * @param {URL} context.url - Request URL
 * @param {Object} context.env - Environment variables
 * @param {Object} context.corsHeaders - CORS headers
 * @param {Object} context.QuickJS - QuickJS instance
 * @param {Function} context.setupArenaWithFetch - Arena setup function
 * @returns {Promise<Response>}
 */
export async function handleExecuteModuleRoute(context) {
	const { url, env, corsHeaders, QuickJS, setupArenaWithFetch } = context;
	
	// Create logger for this handler
	const logger = new Logger({ name: 'ExecuteModule' });
	const phaseLogger = logger.createPhaseLogger();

	try {
		// Phase 1: Validation
		phaseLogger.startPhase('Input Validation');
		
		// Parse JSON body from POST request
		let requestBody;
		try {
			requestBody = await context.request.json();
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
		
		// Execute module function
		const result = await waitForArenaResult(
			QuickJS,
			remoteEntry,
			setupArenaWithFetch,
			env.MODULE_FEDERATION_ASSETS,
			{
				module,
				func,
				params: parsedParams,
				maxIterations: module === 'FetchUtils' ? EXECUTION_TIMEOUTS.FETCH_UTILS_MAX_ITERATIONS : EXECUTION_TIMEOUTS.DEFAULT_MAX_ITERATIONS,
				delayMs: module === 'FetchUtils' ? EXECUTION_TIMEOUTS.FETCH_UTILS_DELAY_MS : EXECUTION_TIMEOUTS.DEFAULT_DELAY_MS,
			}
		);
		
		phaseLogger.endPhase({
			success: result.success,
			iterations: result.iterations,
			resourceStats: result.resourceStats
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
			module: url.searchParams.get('module'),
			function: url.searchParams.get('function'),
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
						module: url.searchParams.get('module'),
						func: url.searchParams.get('function')
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
					module: url.searchParams.get('module'),
					func: url.searchParams.get('function')
				}
			},
			500,
			corsHeaders
		);
	}
}
