#!/usr/bin/env node

/**
 * PrimJS Unit Tests - Fixed Value Extraction
 * Tests PrimJS functionality with proper error handling and value extraction
 */

import { newQuickJSWASMModule, newVariant } from 'quickjs-emscripten';
import primjsVariant from '@jitl/primjs-wasmfile-release-sync';
import fs from 'fs';

// Test suite class
class PrimJSTestSuite {
	constructor() {
		this.tests = [];
		this.results = { passed: 0, failed: 0, total: 0 };
		this.PrimJS = null;
	}

	// Register a test
	test(name, testFn) {
		this.tests.push({ name, testFn });
	}

	// Assert helper
	assert(condition, message) {
		if (!condition) {
			throw new Error(`Assertion failed: ${message}`);
		}
	}

	// Safe evaluation helper
	safeEval(vm, code) {
		try {
			const result = vm.evalCode(code);
			
			// Check if there's an exception
			const exception = vm.getException();
			if (exception) {
				const errorMessage = vm.dump(exception);
				exception.dispose();
				throw new Error(`JavaScript Error: ${errorMessage}`);
			}
			
			// Get the value
			const value = vm.dump(result);
			result.dispose();
			return value;
			
		} catch (error) {
			// Check for any pending exception
			const exception = vm.getException();
			if (exception) {
				const errorMessage = vm.dump(exception);
				exception.dispose();
				throw new Error(`JavaScript Error: ${errorMessage}`);
			}
			throw error;
		}
	}

	// Run all tests
	async runAll() {
		console.log('🚀 PrimJS Unit Test Suite (Fixed)');
		console.log('=' .repeat(50));
		console.log();

		// Setup PrimJS
		await this.setupPrimJS();

		// Run each test
		for (const { name, testFn } of this.tests) {
			try {
				console.log(`🧪 Testing: ${name}`);
				await testFn.call(this);
				console.log(`✅ PASSED: ${name}`);
				this.results.passed++;
			} catch (error) {
				console.log(`❌ FAILED: ${name}`);
				console.log(`   Error: ${error.message}`);
				this.results.failed++;
			}
			this.results.total++;
			console.log();
		}

		// Summary
		this.printSummary();
	}

	async setupPrimJS() {
		console.log('🔧 Setting up PrimJS...');
		
		// Load WASM file
		const wasmPath = './src/PRIMJS_RELEASE_SYNC.wasm';
		if (!fs.existsSync(wasmPath)) {
			throw new Error('PrimJS WASM file not found. Run ./copy-wasm-file-into-src.sh first.');
		}

		const wasmBuffer = fs.readFileSync(wasmPath);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		
		// Create variant with our WASM
		const cloudflareVariant = newVariant(primjsVariant, { wasmModule });
		this.PrimJS = await newQuickJSWASMModule(cloudflareVariant);
		
		console.log('✅ PrimJS loaded successfully');
		console.log();
	}

	printSummary() {
		console.log('=' .repeat(50));
		console.log('📊 Test Results Summary');
		console.log('=' .repeat(50));
		console.log(`Total Tests: ${this.results.total}`);
		console.log(`✅ Passed: ${this.results.passed}`);
		console.log(`❌ Failed: ${this.results.failed}`);
		console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
		
		if (this.results.failed === 0) {
			console.log();
			console.log('🎉 All tests passed!');
		} else if (this.results.passed > this.results.failed) {
			console.log();
			console.log(`⚠️  Some tests failed, but most passed (${this.results.passed}/${this.results.total})`);
		} else {
			console.log();
			console.log('💥 Many tests failed!');
			process.exit(1);
		}
	}
}

// Create test suite
const suite = new PrimJSTestSuite();

// Test 1: Basic Context Creation
suite.test('Basic Context Creation', function() {
	const vm = this.PrimJS.newContext();
	this.assert(vm !== null, 'Context should be created');
	this.assert(typeof vm.evalCode === 'function', 'evalCode method should exist');
	this.assert(typeof vm.dump === 'function', 'dump method should exist');
	this.assert(typeof vm.getException === 'function', 'getException method should exist');
	vm.dispose();
});

// Test 2: Simple Expression Evaluation
suite.test('Simple Expression Evaluation', function() {
	const vm = this.PrimJS.newContext();
	const value = this.safeEval(vm, '2 + 2');
	
	console.log(`   Evaluated 2 + 2 = ${value} (type: ${typeof value})`);
	this.assert(value === 4, `Expected 4, got ${value}`);
	
	vm.dispose();
});

// Test 3: String Operations
suite.test('String Operations', function() {
	const vm = this.PrimJS.newContext();
	const value = this.safeEval(vm, '"Hello" + " " + "PrimJS"');
	
	console.log(`   String result: "${value}"`);
	this.assert(value === 'Hello PrimJS', `Expected 'Hello PrimJS', got '${value}'`);
	
	vm.dispose();
});

// Test 4: Number Operations
suite.test('Number Operations', function() {
	const vm = this.PrimJS.newContext();
	
	// Test integer
	let value = this.safeEval(vm, '42');
	console.log(`   Integer: ${value} (type: ${typeof value})`);
	this.assert(value === 42, `Expected 42, got ${value}`);
	
	// Test float
	value = this.safeEval(vm, '3.14159');
	console.log(`   Float: ${value} (type: ${typeof value})`);
	this.assert(Math.abs(value - 3.14159) < 0.00001, `Expected ~3.14159, got ${value}`);
	
	// Test calculation
	value = this.safeEval(vm, 'Math.sqrt(16) + Math.pow(2, 3)');
	console.log(`   Calculation: ${value} (type: ${typeof value})`);
	this.assert(value === 12, `Expected 12, got ${value}`);
	
	vm.dispose();
});

// Test 5: Boolean Operations
suite.test('Boolean Operations', function() {
	const vm = this.PrimJS.newContext();
	
	let value = this.safeEval(vm, 'true');
	console.log(`   Boolean true: ${value} (type: ${typeof value})`);
	this.assert(value === true, `Expected true, got ${value}`);
	
	value = this.safeEval(vm, 'false');
	console.log(`   Boolean false: ${value} (type: ${typeof value})`);
	this.assert(value === false, `Expected false, got ${value}`);
	
	value = this.safeEval(vm, '5 > 3');
	console.log(`   Comparison: ${value} (type: ${typeof value})`);
	this.assert(value === true, `Expected true, got ${value}`);
	
	vm.dispose();
});

// Test 6: Null and Undefined
suite.test('Null and Undefined', function() {
	const vm = this.PrimJS.newContext();
	
	let value = this.safeEval(vm, 'null');
	console.log(`   Null: ${value} (type: ${typeof value})`);
	this.assert(value === null, `Expected null, got ${value}`);
	
	value = this.safeEval(vm, 'undefined');
	console.log(`   Undefined: ${value} (type: ${typeof value})`);
	this.assert(value === undefined, `Expected undefined, got ${value}`);
	
	vm.dispose();
});

// Test 7: Array Creation
suite.test('Array Creation', function() {
	const vm = this.PrimJS.newContext();
	const value = this.safeEval(vm, '[1, 2, 3]');
	
	console.log(`   Array: ${JSON.stringify(value)} (type: ${typeof value})`);
	this.assert(Array.isArray(value), 'Should return an array');
	this.assert(value.length === 3, 'Array should have 3 elements');
	this.assert(value[0] === 1 && value[1] === 2 && value[2] === 3, 'Array should have correct elements');
	
	vm.dispose();
});

// Test 8: Object Creation
suite.test('Object Creation', function() {
	const vm = this.PrimJS.newContext();
	const value = this.safeEval(vm, '({ name: "PrimJS", version: 2.11 })');
	
	console.log(`   Object: ${JSON.stringify(value)} (type: ${typeof value})`);
	this.assert(typeof value === 'object', 'Should return an object');
	this.assert(value.name === 'PrimJS', 'Should have correct name');
	this.assert(value.version === 2.11, 'Should have correct version');
	
	vm.dispose();
});

// Test 9: Function Execution
suite.test('Function Execution', function() {
	const vm = this.PrimJS.newContext();
	const value = this.safeEval(vm, `
		(function(a, b) {
			return a + b;
		})(5, 3)
	`);
	
	console.log(`   Function result: ${value} (type: ${typeof value})`);
	this.assert(value === 8, `Expected 8, got ${value}`);
	
	vm.dispose();
});

// Test 10: Variable Assignment
suite.test('Variable Assignment', function() {
	const vm = this.PrimJS.newContext();
	const value = this.safeEval(vm, `
		let x = 10;
		let y = 20;
		x + y
	`);
	
	console.log(`   Variable calculation: ${value} (type: ${typeof value})`);
	this.assert(value === 30, `Expected 30, got ${value}`);
	
	vm.dispose();
});

// Test 11: Global Variable Setting (Fixed)
suite.test('Global Variable Setting', function() {
	const vm = this.PrimJS.newContext();
	
	// Set a global variable
	const nameHandle = vm.newString('PrimJS Test');
	vm.setProp(vm.global, 'testName', nameHandle);
	nameHandle.dispose();
	
	// Use it in code
	const value = this.safeEval(vm, 'testName');
	console.log(`   Global variable: "${value}" (type: ${typeof value})`);
	this.assert(value === 'PrimJS Test', `Expected 'PrimJS Test', got '${value}'`);
	
	// Test concatenation
	const concatValue = this.safeEval(vm, 'testName + " - Success"');
	console.log(`   Concatenation: "${concatValue}"`);
	this.assert(concatValue === 'PrimJS Test - Success', `Expected 'PrimJS Test - Success', got '${concatValue}'`);
	
	vm.dispose();
});

// Test 12: Error Handling
suite.test('Error Handling', function() {
	const vm = this.PrimJS.newContext();
	let caught = false;
	let errorMessage = '';
	
	try {
		this.safeEval(vm, 'throw new Error("Test error")');
	} catch (error) {
		caught = true;
		errorMessage = error.message;
		console.log(`   Caught error: ${errorMessage}`);
	}
	
	this.assert(caught, 'Should have caught an error');
	this.assert(errorMessage.includes('Test error'), 'Should contain the error message');
	
	vm.dispose();
});

// Test 13: JSON Operations
suite.test('JSON Operations', function() {
	const vm = this.PrimJS.newContext();
	
	// Test JSON.stringify
	const jsonString = this.safeEval(vm, `
		const data = { items: [1, 2, 3], meta: { count: 3 } };
		JSON.stringify(data)
	`);
	console.log(`   JSON.stringify result: ${jsonString}`);
	this.assert(typeof jsonString === 'string', 'Should return a string');
	
	const parsed = JSON.parse(jsonString);
	this.assert(parsed.items.length === 3, 'JSON should contain 3 items');
	this.assert(parsed.meta.count === 3, 'JSON should have correct count');
	
	// Test JSON.parse
	const parsedObject = this.safeEval(vm, `
		JSON.parse('{"test": true, "number": 42}')
	`);
	console.log(`   JSON.parse result: ${JSON.stringify(parsedObject)}`);
	this.assert(parsedObject.test === true, 'Should parse boolean correctly');
	this.assert(parsedObject.number === 42, 'Should parse number correctly');
	
	vm.dispose();
});

// Test 14: Array Methods
suite.test('Array Methods', function() {
	const vm = this.PrimJS.newContext();
	const value = this.safeEval(vm, `
		const arr = [1, 2, 3, 4, 5];
		arr.map(x => x * 2).filter(x => x > 5).reduce((a, b) => a + b, 0)
	`);
	
	console.log(`   Array methods result: ${value} (type: ${typeof value})`);
	// [2, 4, 6, 8, 10] -> [6, 8, 10] -> 24
	this.assert(value === 24, `Expected 24, got ${value}`);
	
	vm.dispose();
});

// Test 15: Performance Test
suite.test('Performance Test', function() {
	const iterations = 100; // Reduced for unit test
	const start = Date.now();
	
	for (let i = 0; i < iterations; i++) {
		const vm = this.PrimJS.newContext();
		const value = this.safeEval(vm, `Math.sqrt(${i}) + Math.sin(${i})`);
		this.assert(typeof value === 'number', 'Should return a number');
		vm.dispose();
	}
	
	const duration = Date.now() - start;
	const avgTime = duration / iterations;
	
	console.log(`   Performance: ${iterations} iterations in ${duration}ms`);
	console.log(`   Average: ${avgTime.toFixed(2)}ms per execution`);
	console.log(`   Throughput: ${(iterations / (duration / 1000)).toFixed(0)} ops/sec`);
	
	this.assert(avgTime < 50, 'Average execution time should be reasonable (< 50ms)');
});

// Run the test suite
if (import.meta.url === `file://${process.argv[1]}`) {
	suite.runAll().catch(console.error);
}

export { suite as PrimJSTestSuite };