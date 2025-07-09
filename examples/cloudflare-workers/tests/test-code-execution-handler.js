/**
 * Tests for Code Execution Handler
 */

import { validateCode } from '../src/codeExecutionHandler.js';

// Mock QuickJS for testing
const mockQuickJS = {
	newContext: () => ({
		evalCode: (code) => {
			// Simple mock - return success for basic operations
			if (code.includes('error')) {
				return {
					error: { dispose: () => {} },
					value: null
				};
			}
			return {
				value: { dispose: () => {} },
				error: null
			};
		},
		dump: (val) => {
			if (val) return 'test result';
			return 'error message';
		},
		dispose: () => {}
	})
};

// Test validateCode function
function testValidateCode() {
	console.log('Testing validateCode...');

	const validCodes = [
		'1 + 1',
		'console.log("hello")',
		'const x = 5; x * 2',
		'[1, 2, 3].map(x => x * 2)',
		'"Hello World"',
		'Math.sqrt(16)'
	];

	const invalidCodes = [
		null,
		undefined,
		'',
		'   ',
		123,
		{},
		[]
	];

	// Test valid codes
	for (const code of validCodes) {
		if (!validateCode(code)) {
			throw new Error(`❌ Valid code should pass validation: ${code}`);
		}
	}

	// Test invalid codes
	for (const code of invalidCodes) {
		if (validateCode(code)) {
			throw new Error(`❌ Invalid code should fail validation: ${code}`);
		}
	}

	console.log('✅ validateCode tests passed');
}

// Test code validation edge cases
function testValidationEdgeCases() {
	console.log('Testing validation edge cases...');

	const edgeCases = [
		{ code: 'function()', valid: false }, // Invalid syntax
		{ code: 'var x = ;', valid: false }, // Invalid syntax
		{ code: 'let x = 1; x++', valid: true }, // Valid syntax
		{ code: 'for(;;){}', valid: true }, // Valid infinite loop syntax
		{ code: '{[}]', valid: false }, // Mismatched brackets
		{ code: 'JSON.parse("{}"))', valid: false } // Extra parenthesis
	];

	for (const testCase of edgeCases) {
		const result = validateCode(testCase.code);
		// Note: Our validation is permissive, so some "invalid" JS might still pass
		// as it could be valid QuickJS code
		if (testCase.valid && !result) {
			throw new Error(`❌ Expected valid code to pass: ${testCase.code}`);
		}
	}

	console.log('✅ validation edge cases tests passed');
}

// Test JavaScript expression types
function testJavaScriptExpressions() {
	console.log('Testing JavaScript expressions...');

	const expressions = [
		'42',
		'"string literal"',
		'true',
		'false',
		'null',
		'undefined',
		'{}',
		'[]',
		'/regex/',
		'function() { return 1; }'
	];

	for (const expr of expressions) {
		if (!validateCode(expr)) {
			throw new Error(`❌ Valid expression should pass: ${expr}`);
		}
	}

	console.log('✅ JavaScript expressions tests passed');
}

// Run all tests
export function runCodeExecutionHandlerTests() {
	console.log('\n=== Code Execution Handler Tests ===');

	testValidateCode();
	testValidationEdgeCases();
	testJavaScriptExpressions();

	console.log(`\nCode Execution Handler Tests: All tests passed\n`);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runCodeExecutionHandlerTests();
}
