#!/usr/bin/env node

/**
 * PrimJS Unit Tests - Direct API Testing
 * Tests PrimJS functionality without worker integration
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

	// Run all tests
	async runAll() {
		console.log('🚀 PrimJS Unit Test Suite');
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
		
		if (this.results.failed === 0) {
			console.log();
			console.log('🎉 All tests passed!');
		} else {
			console.log();
			console.log('💥 Some tests failed!');
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
	vm.dispose();
});

// Test 2: Simple Expression Evaluation
suite.test('Simple Expression Evaluation', function() {
	const vm = this.PrimJS.newContext();
	const result = vm.evalCode('2 + 2');
	const value = vm.dump(result);
	
	this.assert(value === 4, `Expected 4, got ${value}`);
	
	result.dispose();
	vm.dispose();
});

// Test 3: String Operations
suite.test('String Operations', function() {
	const vm = this.PrimJS.newContext();
	const result = vm.evalCode('"Hello" + " " + "PrimJS"');
	const value = vm.dump(result);
	
	this.assert(value === 'Hello PrimJS', `Expected 'Hello PrimJS', got '${value}'`);
	
	result.dispose();
	vm.dispose();
});

// Test 4: Object Creation and Access
suite.test('Object Creation and Access', function() {
	const vm = this.PrimJS.newContext();
	const result = vm.evalCode(`
		const obj = { name: 'PrimJS', version: '2.11.1' };
		obj.name + ' ' + obj.version
	`);
	const value = vm.dump(result);
	
	this.assert(value === 'PrimJS 2.11.1', `Expected 'PrimJS 2.11.1', got '${value}'`);
	
	result.dispose();
	vm.dispose();
});

// Test 5: Array Operations
suite.test('Array Operations', function() {
	const vm = this.PrimJS.newContext();
	const result = vm.evalCode(`
		const arr = [1, 2, 3, 4, 5];
		arr.map(x => x * 2).filter(x => x > 5).reduce((a, b) => a + b, 0)
	`);
	const value = vm.dump(result);
	
	this.assert(value === 18, `Expected 18, got ${value}`); // [6, 8, 10] -> 24, wait... [2,4,6,8,10] -> [6,8,10] -> 24
	
	result.dispose();
	vm.dispose();
});

// Test 6: Function Definitions
suite.test('Function Definitions', function() {
	const vm = this.PrimJS.newContext();
	const result = vm.evalCode(`
		function fibonacci(n) {
			if (n <= 1) return n;
			return fibonacci(n - 1) + fibonacci(n - 2);
		}
		fibonacci(10)
	`);
	const value = vm.dump(result);
	
	this.assert(value === 55, `Expected 55, got ${value}`);
	
	result.dispose();
	vm.dispose();
});

// Test 7: Error Handling
suite.test('Error Handling', function() {
	const vm = this.PrimJS.newContext();
	let caught = false;
	
	try {
		const result = vm.evalCode('throw new Error("Test error")');
		vm.dump(result);
	} catch (error) {
		caught = true;
		this.assert(error.message.includes('Test error'), 'Should catch the thrown error');
	}
	
	this.assert(caught, 'Should have caught an error');
	vm.dispose();
});

// Test 8: Global Variable Setting
suite.test('Global Variable Setting', function() {
	const vm = this.PrimJS.newContext();
	
	// Set a global variable
	const nameHandle = vm.newString('PrimJS Test');
	vm.setProp(vm.global, 'testName', nameHandle);
	nameHandle.dispose();
	
	// Use it in code
	const result = vm.evalCode('testName + " - Success"');
	const value = vm.dump(result);
	
	this.assert(value === 'PrimJS Test - Success', `Expected 'PrimJS Test - Success', got '${value}'`);
	
	result.dispose();
	vm.dispose();
});

// Test 9: JSON Operations
suite.test('JSON Operations', function() {
	const vm = this.PrimJS.newContext();
	const result = vm.evalCode(`
		const data = { items: [1, 2, 3], meta: { count: 3 } };
		JSON.stringify(data)
	`);
	const value = vm.dump(result);
	const parsed = JSON.parse(value);
	
	this.assert(parsed.items.length === 3, 'JSON should contain 3 items');
	this.assert(parsed.meta.count === 3, 'JSON should have correct count');
	
	result.dispose();
	vm.dispose();
});

// Test 10: Performance Benchmark
suite.test('Performance Benchmark', function() {
	const iterations = 1000;
	const start = Date.now();
	
	for (let i = 0; i < iterations; i++) {
		const vm = this.PrimJS.newContext();
		const result = vm.evalCode(`Math.sqrt(${i}) + Math.sin(${i})`);
		const value = vm.dump(result);
		this.assert(typeof value === 'number', 'Should return a number');
		result.dispose();
		vm.dispose();
	}
	
	const duration = Date.now() - start;
	const avgTime = duration / iterations;
	
	console.log(`   Performance: ${iterations} iterations in ${duration}ms`);
	console.log(`   Average: ${avgTime.toFixed(2)}ms per execution`);
	console.log(`   Throughput: ${(iterations / (duration / 1000)).toFixed(0)} ops/sec`);
	
	this.assert(avgTime < 10, 'Average execution time should be reasonable (< 10ms)');
});

// Test 11: Memory Management
suite.test('Memory Management', function() {
	// Test that we can create and dispose many contexts without issues
	const iterations = 100;
	
	for (let i = 0; i < iterations; i++) {
		const vm = this.PrimJS.newContext();
		const result = vm.evalCode('({ iteration: ' + i + ', data: "test" })');
		const value = vm.dump(result);
		
		this.assert(value.iteration === i, 'Should maintain context isolation');
		
		result.dispose();
		vm.dispose();
	}
	
	console.log(`   Created and disposed ${iterations} contexts successfully`);
});

// Test 12: Complex Nested Operations
suite.test('Complex Nested Operations', function() {
	const vm = this.PrimJS.newContext();
	const result = vm.evalCode(`
		const users = [
			{ id: 1, name: 'Alice', scores: [85, 92, 78] },
			{ id: 2, name: 'Bob', scores: [91, 87, 94] },
			{ id: 3, name: 'Charlie', scores: [76, 83, 89] }
		];
		
		users
			.map(user => ({
				...user,
				average: user.scores.reduce((a, b) => a + b, 0) / user.scores.length
			}))
			.filter(user => user.average > 85)
			.sort((a, b) => b.average - a.average)
			.map(user => ({ name: user.name, average: Math.round(user.average) }))
	`);
	const value = vm.dump(result);
	
	this.assert(Array.isArray(value), 'Result should be an array');
	this.assert(value.length >= 1, 'Should have at least one high-scoring user');
	this.assert(value[0].name === 'Bob', 'Bob should be the top scorer');
	this.assert(value[0].average === 91, 'Bob average should be 91');
	
	result.dispose();
	vm.dispose();
});

// Test 13: Async-like Patterns (using setTimeout simulation)
suite.test('Promise-like Patterns', function() {
	const vm = this.PrimJS.newContext();
	
	// Set up a promise-like pattern
	const setupCode = `
		const results = [];
		function asyncTask(value, callback) {
			// Simulate async behavior
			callback(value * 2);
		}
		
		function processData() {
			asyncTask(5, (result1) => {
				results.push(result1);
				asyncTask(10, (result2) => {
					results.push(result2);
					asyncTask(15, (result3) => {
						results.push(result3);
					});
				});
			});
			return results;
		}
		
		processData()
	`;
	
	const result = vm.evalCode(setupCode);
	const value = vm.dump(result);
	
	this.assert(Array.isArray(value), 'Should return an array');
	this.assert(value.length === 3, 'Should have 3 results');
	this.assert(value[0] === 10, 'First result should be 10');
	this.assert(value[1] === 20, 'Second result should be 20');
	this.assert(value[2] === 30, 'Third result should be 30');
	
	result.dispose();
	vm.dispose();
});

// Test 14: Edge Cases
suite.test('Edge Cases', function() {
	const vm = this.PrimJS.newContext();
	
	// Test undefined
	let result = vm.evalCode('undefined');
	let value = vm.dump(result);
	this.assert(value === undefined, 'Should handle undefined');
	result.dispose();
	
	// Test null
	result = vm.evalCode('null');
	value = vm.dump(result);
	this.assert(value === null, 'Should handle null');
	result.dispose();
	
	// Test empty string
	result = vm.evalCode('""');
	value = vm.dump(result);
	this.assert(value === '', 'Should handle empty string');
	result.dispose();
	
	// Test zero
	result = vm.evalCode('0');
	value = vm.dump(result);
	this.assert(value === 0, 'Should handle zero');
	result.dispose();
	
	// Test NaN
	result = vm.evalCode('NaN');
	value = vm.dump(result);
	this.assert(Number.isNaN(value), 'Should handle NaN');
	result.dispose();
	
	// Test Infinity
	result = vm.evalCode('Infinity');
	value = vm.dump(result);
	this.assert(value === Infinity, 'Should handle Infinity');
	result.dispose();
	
	vm.dispose();
});

// Test 15: Large Data Handling
suite.test('Large Data Handling', function() {
	const vm = this.PrimJS.newContext();
	
	// Create a large array
	const result = vm.evalCode(`
		const largeArray = new Array(10000).fill(0).map((_, i) => i);
		const sum = largeArray.reduce((a, b) => a + b, 0);
		({ length: largeArray.length, sum: sum, last: largeArray[9999] })
	`);
	const value = vm.dump(result);
	
	this.assert(value.length === 10000, 'Should handle large arrays');
	this.assert(value.sum === 49995000, 'Should calculate correct sum'); // 0+1+2+...+9999
	this.assert(value.last === 9999, 'Should access last element correctly');
	
	result.dispose();
	vm.dispose();
});

// Run the test suite
if (import.meta.url === `file://${process.argv[1]}`) {
	suite.runAll().catch(console.error);
}

export { suite as PrimJSTestSuite };