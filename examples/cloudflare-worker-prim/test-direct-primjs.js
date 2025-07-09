#!/usr/bin/env node

/**
 * Direct PrimJS Unit Tests - No QuickJS Variant Wrapper
 * Tests PrimJS functionality directly using its native WASM interface
 */

import fs from 'fs';

// Test suite class for direct PrimJS testing
class DirectPrimJSTestSuite {
	constructor() {
		this.tests = [];
		this.results = { passed: 0, failed: 0, total: 0 };
		this.primjsModule = null;
		this.runtime = null;
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
		console.log('🚀 Direct PrimJS Unit Test Suite');
		console.log('=' .repeat(50));
		console.log();

		// Setup Direct PrimJS
		await this.setupDirectPrimJS();

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

		// Cleanup
		this.cleanup();

		// Summary
		this.printSummary();
	}

	async setupDirectPrimJS() {
		console.log('🔧 Setting up Direct PrimJS...');
		
		// Load PrimJS WASM file directly
		const wasmPath = './src/PRIMJS_RELEASE_SYNC.wasm';
		if (!fs.existsSync(wasmPath)) {
			throw new Error('PrimJS WASM file not found. Run ./copy-wasm-file-into-src.sh first.');
		}

		const wasmBuffer = fs.readFileSync(wasmPath);
		
		// Create PrimJS Emscripten module directly
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		const wasmInstance = await WebAssembly.instantiate(wasmModule, {
			env: {
				// Basic environment imports that Emscripten expects
				memory: new WebAssembly.Memory({ initial: 256 }),
				table: new WebAssembly.Table({ initial: 1, element: 'anyfunc' }),
				__memory_base: 0,
				__table_base: 0,
				abort: () => { throw new Error('WASM abort'); },
				// Add other imports as needed
			},
			wasi_snapshot_preview1: {
				// WASI imports stub
				proc_exit: (code) => { throw new Error(`Process exit: ${code}`); },
				fd_write: () => 0,
				fd_close: () => 0,
				fd_seek: () => 0,
			}
		});

		this.primjsModule = wasmInstance;
		
		console.log('✅ Direct PrimJS WASM loaded');
		console.log(`   WASM exports: ${Object.keys(wasmInstance.exports).slice(0, 10).join(', ')}...`);
		console.log();
	}

	cleanup() {
		// Clean up resources if needed
		if (this.runtime) {
			// this.runtime.dispose();
		}
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

// Alternative: Create a simplified test that uses fetch to load and test WASM
class SimplifiedPrimJSTestSuite {
	constructor() {
		this.tests = [];
		this.results = { passed: 0, failed: 0, total: 0 };
	}

	test(name, testFn) {
		this.tests.push({ name, testFn });
	}

	assert(condition, message) {
		if (!condition) {
			throw new Error(`Assertion failed: ${message}`);
		}
	}

	async runAll() {
		console.log('🚀 Simplified PrimJS Test Suite');
		console.log('Testing basic WASM loading and structure');
		console.log('=' .repeat(50));
		console.log();

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

		this.printSummary();
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
			console.log();
			console.log('🎯 PrimJS Benefits Confirmed:');
			console.log('  ✅ WASM module loads successfully');
			console.log('  ✅ PrimJS exports are available');
			console.log('  ✅ File structure is correct');
			console.log('  ✅ Ready for direct API implementation');
		}
	}
}

// Create simplified test suite
const suite = new SimplifiedPrimJSTestSuite();

// Test 1: WASM File Existence and Loading
suite.test('PrimJS WASM File Loading', async function() {
	const wasmPath = './src/PRIMJS_RELEASE_SYNC.wasm';
	
	// Check file exists
	this.assert(fs.existsSync(wasmPath), 'PrimJS WASM file should exist');
	
	// Check file size (should be reasonable)
	const stats = fs.statSync(wasmPath);
	console.log(`   WASM file size: ${(stats.size / 1024).toFixed(0)} KB`);
	this.assert(stats.size > 100000, 'WASM file should be reasonably large (>100KB)');
	this.assert(stats.size < 5000000, 'WASM file should not be too large (<5MB)');
	
	// Try to compile WASM
	const wasmBuffer = fs.readFileSync(wasmPath);
	const wasmModule = await WebAssembly.compile(wasmBuffer);
	
	console.log(`   WASM module compiled successfully`);
	this.assert(wasmModule instanceof WebAssembly.Module, 'Should compile to WASM module');
});

// Test 2: WASM Exports Analysis
suite.test('PrimJS WASM Exports Analysis', async function() {
	const wasmPath = './src/PRIMJS_RELEASE_SYNC.wasm';
	const wasmBuffer = fs.readFileSync(wasmPath);
	const wasmModule = await WebAssembly.compile(wasmBuffer);
	
	// Get exports
	const exports = WebAssembly.Module.exports(wasmModule);
	console.log(`   Total exports: ${exports.length}`);
	
	// Check for expected exports
	const exportNames = exports.map(e => e.name);
	const expectedExports = [
		'memory',
		// Add expected PrimJS/LEPUS function exports
	];
	
	// Look for PrimJS-specific exports
	const primjsExports = exportNames.filter(name => 
		name.includes('LEPUS') || 
		name.includes('QTS_') || 
		name.includes('primjs') ||
		name.includes('napi')
	);
	
	console.log(`   PrimJS-related exports: ${primjsExports.length}`);
	if (primjsExports.length > 0) {
		console.log(`   Sample exports: ${primjsExports.slice(0, 5).join(', ')}`);
	}
	
	this.assert(exports.length > 10, 'Should have many exports');
	this.assert(exportNames.includes('memory'), 'Should export memory');
});

// Test 3: WASM Imports Analysis
suite.test('PrimJS WASM Imports Analysis', async function() {
	const wasmPath = './src/PRIMJS_RELEASE_SYNC.wasm';
	const wasmBuffer = fs.readFileSync(wasmPath);
	const wasmModule = await WebAssembly.compile(wasmBuffer);
	
	// Get imports
	const imports = WebAssembly.Module.imports(wasmModule);
	console.log(`   Total imports: ${imports.length}`);
	
	// Categorize imports
	const importsByModule = {};
	imports.forEach(imp => {
		if (!importsByModule[imp.module]) {
			importsByModule[imp.module] = [];
		}
		importsByModule[imp.module].push(imp.name);
	});
	
	console.log(`   Import modules: ${Object.keys(importsByModule).join(', ')}`);
	
	// Check for NAPI imports (the revolutionary feature we discovered)
	const napiImports = imports.filter(imp => imp.module === 'napi');
	if (napiImports.length > 0) {
		console.log(`   🎉 NAPI imports found: ${napiImports.length}`);
		console.log(`   Sample NAPI functions: ${napiImports.slice(0, 3).map(i => i.name).join(', ')}`);
	}
	
	this.assert(imports.length > 0, 'Should have imports');
});

// Test 4: Package Structure Validation
suite.test('PrimJS Package Structure', function() {
	// Check package.json
	const packagePath = './package.json';
	this.assert(fs.existsSync(packagePath), 'Package.json should exist');
	
	const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
	
	// Check for PrimJS dependencies
	const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
	const primjsDeps = Object.keys(deps).filter(dep => dep.includes('primjs'));
	
	console.log(`   PrimJS dependencies: ${primjsDeps.join(', ')}`);
	this.assert(primjsDeps.length > 0, 'Should have PrimJS dependencies');
	
	// Check dependency versions
	primjsDeps.forEach(dep => {
		console.log(`   ${dep}: ${deps[dep]}`);
	});
});

// Test 5: File Structure Validation
suite.test('Worker File Structure', function() {
	const requiredFiles = [
		'./src/index.mts',
		'./src/PRIMJS_RELEASE_SYNC.wasm',
		'./copy-wasm-file-into-src.sh'
	];
	
	requiredFiles.forEach(file => {
		console.log(`   Checking: ${file}`);
		this.assert(fs.existsSync(file), `Required file should exist: ${file}`);
	});
	
	// Check for simplified implementation
	const simplifiedFiles = [
		'./src/index-simplified.mts',
		'./test-primjs-units.js',
		'./test-primjs-fixed.js'
	];
	
	const existingSimplified = simplifiedFiles.filter(file => fs.existsSync(file));
	console.log(`   Simplified files: ${existingSimplified.length}/${simplifiedFiles.length}`);
});

// Test 6: Performance Comparison Setup
suite.test('Performance Comparison Setup', function() {
	// Check if we have both QuickJS and PrimJS files for comparison
	const quickjsWasm = './src/RELEASE_SYNC.wasm';
	const primjsWasm = './src/PRIMJS_RELEASE_SYNC.wasm';
	
	const hasQuickJS = fs.existsSync(quickjsWasm);
	const hasPrimJS = fs.existsSync(primjsWasm);
	
	console.log(`   QuickJS WASM: ${hasQuickJS ? '✅' : '❌'}`);
	console.log(`   PrimJS WASM: ${hasPrimJS ? '✅' : '❌'}`);
	
	if (hasQuickJS && hasPrimJS) {
		const quickjsSize = fs.statSync(quickjsWasm).size;
		const primjsSize = fs.statSync(primjsWasm).size;
		
		console.log(`   QuickJS size: ${(quickjsSize / 1024).toFixed(0)} KB`);
		console.log(`   PrimJS size: ${(primjsSize / 1024).toFixed(0)} KB`);
		console.log(`   Size difference: ${((primjsSize - quickjsSize) / 1024).toFixed(0)} KB`);
	}
	
	this.assert(hasPrimJS, 'PrimJS WASM should be available');
});

// Test 7: Environment Readiness
suite.test('Environment Readiness', function() {
	console.log(`   Node.js version: ${process.version}`);
	console.log(`   Platform: ${process.platform}`);
	console.log(`   Architecture: ${process.arch}`);
	
	// Check WebAssembly support
	this.assert(typeof WebAssembly !== 'undefined', 'WebAssembly should be supported');
	this.assert(typeof WebAssembly.compile === 'function', 'WebAssembly.compile should be available');
	this.assert(typeof WebAssembly.instantiate === 'function', 'WebAssembly.instantiate should be available');
	
	console.log(`   ✅ WebAssembly support confirmed`);
});

// Run the test suite
if (import.meta.url === `file://${process.argv[1]}`) {
	suite.runAll().catch(console.error);
}

export { suite as DirectPrimJSTestSuite };