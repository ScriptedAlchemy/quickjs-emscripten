/**
 * Tests for CORS Handler
 */

import { handleCors, addCorsHeaders, corsHeaders } from '../src/corsHandler.js';

// Test handleCors function
function testHandleCors() {
	console.log('Testing handleCors...');

	// Test OPTIONS request
	const optionsRequest = new Request('http://example.com', { method: 'OPTIONS' });
	const context = { request: optionsRequest };
	const corsResponse = handleCors(context);

	if (!corsResponse) {
		throw new Error('❌ OPTIONS request should return CORS response');
	}

	if (corsResponse.status !== 200) {
		throw new Error('❌ CORS response should have status 200');
	}

	// Check CORS headers
	const expectedHeaders = Object.keys(corsHeaders);
	for (const header of expectedHeaders) {
		if (!corsResponse.headers.has(header.toLowerCase())) {
			throw new Error(`❌ Missing CORS header: ${header}`);
		}
	}

	// Test non-OPTIONS request
	const getRequest = new Request('http://example.com', { method: 'GET' });
	const getContext = { request: getRequest };
	const nullResponse = handleCors(getContext);

	if (nullResponse !== null) {
		throw new Error('❌ Non-OPTIONS request should return null');
	}

	console.log('✅ handleCors tests passed');
}

// Test addCorsHeaders function
function testAddCorsHeaders() {
	console.log('Testing addCorsHeaders...');

	const originalResponse = new Response('test body', {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});

	const responseWithCors = addCorsHeaders(originalResponse);

	// Check that all CORS headers are present
	const expectedHeaders = Object.keys(corsHeaders);
	for (const header of expectedHeaders) {
		if (!responseWithCors.headers.has(header.toLowerCase())) {
			throw new Error(`❌ Missing CORS header: ${header}`);
		}
	}

	// Check that original headers are preserved
	if (responseWithCors.headers.get('Content-Type') !== 'application/json') {
		throw new Error('❌ Original headers should be preserved');
	}

	console.log('✅ addCorsHeaders tests passed');
}

// Run all tests
export function runCorsHandlerTests() {
	console.log('\n=== CORS Handler Tests ===');

	testHandleCors();
	testAddCorsHeaders();

	console.log(`\nCORS Handler Tests: All tests passed\n`);
	return true;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runCorsHandlerTests();
}
