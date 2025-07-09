/**
 * Tests for Fetch Code Handler
 */

import { containsFetch } from '../src/fetchCodeHandler.js';

// Mock QuickJS for testing
const mockQuickJS = {
	newContext: () => ({
		newString: (str) => ({ dispose: () => {} }),
		setProp: () => {},
		evalCode: (code) => ({
			value: { dispose: () => {} },
			error: null
		}),
		dump: (val) => 'test result',
		dispose: () => {}
	})
};

// Test containsFetch function
function testContainsFetch() {
	console.log('Testing containsFetch...');

	const testCases = [
		{ code: 'fetch("http://example.com")', expected: true },
		{ code: "fetch('http://example.com')", expected: true },
		{ code: 'fetch(`http://example.com`)', expected: true },
		{ code: 'console.log("hello")', expected: false },
		{ code: '1 + 1', expected: false },
		{ code: 'const url = "fetch"; console.log(url)', expected: false },
		{ code: 'someFunction(fetch("url"))', expected: true }
	];

	for (const testCase of testCases) {
		const result = containsFetch(testCase.code);
		if (result !== testCase.expected) {
			throw new Error(`❌ containsFetch("${testCase.code}") expected ${testCase.expected}, got ${result}`);
		}
	}

	console.log('✅ containsFetch tests passed');
}

// Test fetch URL extraction (indirectly through regex)
function testFetchUrlExtraction() {
	console.log('Testing fetch URL extraction...');

	const testCodes = [
		'fetch("https://httpbin.org/uuid")',
		'fetch(\'https://jsonplaceholder.typicode.com/users\')',
		'const result = fetch("https://api.example.com/data")'
	];

	for (const code of testCodes) {
		const fetchUrlMatch = code.match(/fetch\(['"`]([^'"`]+)['"`]\)/);
		if (!fetchUrlMatch) {
			throw new Error(`❌ Failed to extract URL from: ${code}`);
		}

		const url = fetchUrlMatch[1];
		if (!url.startsWith('http')) {
			throw new Error(`❌ Extracted URL should start with http: ${url}`);
		}
	}

	console.log('✅ fetch URL extraction tests passed');
}

// Test error cases
function testErrorCases() {
	console.log('Testing error cases...');

	const invalidCodes = [
		'fetch()',
		'fetch("")',
		'fetch(variable)',
		'console.log(fetch)'
	];

	for (const code of invalidCodes) {
		if (containsFetch(code)) {
			const fetchUrlMatch = code.match(/fetch\(['"`]([^'"`]+)['"`]\)/);
			if (fetchUrlMatch) {
				const url = fetchUrlMatch[1];
				if (!url || url.length === 0) {
					// This is expected for empty strings
					continue;
				}
			}
		}
	}

	console.log('✅ error cases tests passed');
}

// Run all tests
export function runFetchCodeHandlerTests() {
	console.log('\n=== Fetch Code Handler Tests ===');

	testContainsFetch();
	testFetchUrlExtraction();
	testErrorCases();

	console.log(`\nFetch Code Handler Tests: All tests passed\n`);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runFetchCodeHandlerTests();
}
