/**
 * Tests for Examples Handler
 */

import { handleExamples, getExamples } from '../src/examplesHandler.js';

// Test handleExamples function
async function testHandleExamples() {
	console.log('Testing handleExamples...');

	const context = {
		corsHeaders: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	};
	const response = handleExamples(context);

	if (!(response instanceof Response)) {
		throw new Error('❌ handleExamples should return a Response object');
	}

	if (response.status !== 200) {
		throw new Error('❌ Response should have status 200');
	}

	// Check content type
	const contentType = response.headers.get('Content-Type');
	if (!contentType || !contentType.includes('application/json')) {
		throw new Error('❌ Response should have JSON content type');
	}

	// Check CORS headers
	const corsHeaders = ['Access-Control-Allow-Origin', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Headers'];
	for (const header of corsHeaders) {
		if (!response.headers.has(header)) {
			throw new Error(`❌ Missing CORS header: ${header}`);
		}
	}

	// Check response body
	const responseText = await response.text();
	let responseData;

	responseData = JSON.parse(responseText);

	// Check required fields
	const requiredFields = ['message', 'examples', 'usage', 'fetch_note'];
	for (const field of requiredFields) {
		if (!(field in responseData)) {
			throw new Error(`❌ Missing required field: ${field}`);
		}
	}

	// Check examples structure
	if (typeof responseData.examples !== 'object') {
		throw new Error('❌ Examples should be an object');
	}

	console.log('✅ handleExamples tests passed');
}

// Test getExamples function
function testGetExamples() {
	console.log('Testing getExamples...');

	const examples = getExamples();

	if (typeof examples !== 'object' || examples === null) {
		throw new Error('❌ getExamples should return an object');
	}

	// Check for expected example types
	const expectedExamples = ['basic', 'string', 'array', 'fetch_simple', 'fetch_json'];
	for (const example of expectedExamples) {
		if (!(example in examples)) {
			throw new Error(`❌ Missing example: ${example}`);
		}

		if (typeof examples[example] !== 'string') {
			throw new Error(`❌ Example ${example} should be a string`);
		}
	}

	console.log('✅ getExamples tests passed');
}

// Test examples content validation
function testExamplesContent() {
	console.log('Testing examples content...');

	const examples = getExamples();

	// Test basic math example
	if (!examples.basic.includes('+')) {
		throw new Error('❌ Basic example should contain arithmetic');
	}

	// Test fetch examples contain fetch
	if (!examples.fetch_simple.includes('fetch(')) {
		throw new Error('❌ fetch_simple should contain fetch call');
	}

	// Test string example contains quotes
	if (!examples.string.includes('"') && !examples.string.includes("'")) {
		throw new Error('❌ String example should contain quotes');
	}

	console.log('✅ examples content tests passed');
}

// Run all tests
export async function runExamplesHandlerTests() {
	console.log('\n=== Examples Handler Tests ===');

	await testHandleExamples();
	testGetExamples();
	testExamplesContent();

	console.log(`\nExamples Handler Tests: All tests passed\n`);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runExamplesHandlerTests();
}
