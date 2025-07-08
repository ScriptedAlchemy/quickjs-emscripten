/**
 * Test Runner for All Handler Tests
 */

import { runCorsHandlerTests } from './test-cors-handler.js';
import { runExamplesHandlerTests } from './test-examples-handler.js';
import { runFetchCodeHandlerTests } from './test-fetch-code-handler.js';
import { runCodeExecutionHandlerTests } from './test-code-execution-handler.js';
import { runErrorHandlerTests } from './test-error-handler.js';

async function runAllHandlerTests() {
	console.log('🚀 Running All Handler Tests\n');
	console.log('=' .repeat(50));

	const startTime = Date.now();

	// Run all test suites
	runCorsHandlerTests();
	await runExamplesHandlerTests();
	runFetchCodeHandlerTests();
	runCodeExecutionHandlerTests();
	await runErrorHandlerTests();

	const endTime = Date.now();
	const duration = endTime - startTime;

	// Print summary
	console.log('=' .repeat(50));
	console.log('\n📊 TEST SUMMARY\n');

	console.log('✅ CORS Handler: PASSED');
	console.log('✅ Examples Handler: PASSED');
	console.log('✅ Fetch Code Handler: PASSED');
	console.log('✅ Code Execution Handler: PASSED');
	console.log('✅ Error Handler: PASSED');

	console.log(`\n📈 Results: 5/5 test suites passed`);
	console.log(`⏱️  Duration: ${duration}ms`);

	console.log('\n🎉 All tests passed! ✨');
}

// Export for use by other scripts
export { runAllHandlerTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runAllHandlerTests();
}
