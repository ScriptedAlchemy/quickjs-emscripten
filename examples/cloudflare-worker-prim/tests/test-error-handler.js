/**
 * Tests for Error Handler
 */

import { handleError, handleValidationError, formatError } from '../src/errorHandler.js';

// Test handleError function
async function testHandleError() {
	console.log('Testing handleError...');

	const testError = new Error('Test error message');
	const testCode = 'some test code';

	// Test with Error object
	const context1 = { error: testError, code: testCode };
	const response1 = handleError(context1);

	if (!(response1 instanceof Response)) {
		throw new Error('❌ handleError should return a Response object');
	}

	if (response1.status !== 500) {
		throw new Error('❌ Default status should be 500');
	}

	// Check content type
	const contentType = response1.headers.get('Content-Type');
	if (!contentType || !contentType.includes('application/json')) {
		throw new Error('❌ Response should have JSON content type');
	}

	// Check CORS headers
	const corsHeaders = ['Access-Control-Allow-Origin', 'Access-Control-Allow-Methods'];
	for (const header of corsHeaders) {
		if (!response1.headers.has(header)) {
			throw new Error(`❌ Missing CORS header: ${header}`);
		}
	}

	// Test response body
	const responseText = await response1.text();
	let responseData;

	responseData = JSON.parse(responseText);

	if (responseData.error !== 'Test error message') {
		throw new Error('❌ Error message should match');
	}

	if (responseData.code !== testCode) {
		throw new Error('❌ Code should match');
	}

	if (!responseData.timestamp) {
		throw new Error('❌ Should include timestamp');
	}

	// Test with string error and custom status
	const context2 = { error: 'String error', code: testCode };
	const response2 = handleError(context2, 400);
	if (response2.status !== 400) {
		throw new Error('❌ Should use custom status code');
	}

	console.log('✅ handleError tests passed');
}

// Test handleValidationError function
async function testHandleValidationError() {
	console.log('Testing handleValidationError...');

	const message = 'Invalid input';
	const code = 'invalid code';

	const context = { code };
	const response = handleValidationError(context, message);

	if (response.status !== 400) {
		throw new Error('❌ Validation error should have status 400');
	}

	const responseText = await response.text();
	const responseData = JSON.parse(responseText);

	if (!responseData.error.includes('Validation Error:')) {
		throw new Error('❌ Should prefix with "Validation Error:"');
	}

	if (!responseData.error.includes(message)) {
		throw new Error('❌ Should include original message');
	}

	console.log('✅ handleValidationError tests passed');
}

// Test formatError function
function testFormatError() {
	console.log('Testing formatError...');

	// Test with Error object
	const error = new Error('Test message');
	error.stack = 'Test stack trace';

	const formatted1 = formatError(error);

	if (formatted1.message !== 'Test message') {
		throw new Error('❌ Should extract error message');
	}

	if (formatted1.stack !== 'Test stack trace') {
		throw new Error('❌ Should extract stack trace');
	}

	if (formatted1.name !== 'Error') {
		throw new Error('❌ Should extract error name');
	}

	// Test with string
	const formatted2 = formatError('String error');

	if (formatted2.message !== 'String error') {
		throw new Error('❌ Should convert string to message');
	}

	if ('stack' in formatted2) {
		throw new Error('❌ String errors should not have stack');
	}

	// Test with other types
	const formatted3 = formatError(null);
	if (formatted3.message !== 'null') {
		throw new Error('❌ Should convert null to string');
	}

	console.log('✅ formatError tests passed');
}

// Test error response structure
async function testErrorResponseStructure() {
	console.log('Testing error response structure...');

	const context = { error: 'Test', code: 'code' };
	const response = handleError(context);
	const text = await response.text();
	const data = JSON.parse(text);

	const requiredFields = ['code', 'error', 'timestamp'];
	for (const field of requiredFields) {
		if (!(field in data)) {
			throw new Error(`❌ Missing required field: ${field}`);
		}
	}

	// Check timestamp format
	const timestamp = new Date(data.timestamp);
	if (isNaN(timestamp.getTime())) {
		throw new Error('❌ Timestamp should be valid ISO string');
	}

	console.log('✅ error response structure tests passed');
}

// Run all tests
export async function runErrorHandlerTests() {
	console.log('\n=== Error Handler Tests ===');

	await testHandleError();
	await testHandleValidationError();
	testFormatError();
	await testErrorResponseStructure();

	console.log(`\nError Handler Tests: All tests passed\n`);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runErrorHandlerTests();
}
