#!/usr/bin/env node
/* eslint-disable */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'reset') {
  console.log(colorize(message, color));
}

// Find all test files
function findTestFiles() {
  const testsDir = path.join(__dirname, 'tests');

  // Check if tests directory exists
  if (!fs.existsSync(testsDir)) {
    return [];
  }

  const files = fs.readdirSync(testsDir);

  return files
    .filter(file => file.startsWith('test-') && (file.endsWith('.js') || file.endsWith('.ts')))
    .map(file => path.join('tests', file)) // Include the tests/ prefix in the path
    .sort(); // Sort alphabetically for consistent order
}

// Run a single test file
function runTest(testFile) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    log(`\n${'='.repeat(80)}`, 'cyan');
    log(`🧪 Running: ${testFile}`, 'bright');
    log(`${'='.repeat(80)}`, 'cyan');

    // Choose runner based on file extension
    const runner = testFile.endsWith('.ts') ? 'npx' : 'node';
    const args   = testFile.endsWith('.ts') ? ['tsx', testFile] : [testFile];

    const child = spawn(runner, args, {
      stdio: 'inherit',
      cwd: __dirname
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      const durationStr = `${(duration / 1000).toFixed(2)}s`;

      if (code === 0) {
        log(`✅ PASSED: ${testFile} (${durationStr})`, 'green');
      } else {
        log(`❌ FAILED: ${testFile} (${durationStr}) - Exit code: ${code}`, 'red');
      }

      resolve({
        file: testFile,
        success: code === 0,
        duration,
        exitCode: code
      });
    });

    child.on('error', (error) => {
      const duration = Date.now() - startTime;
      const durationStr = `${(duration / 1000).toFixed(2)}s`;

      log(`💥 ERROR: ${testFile} (${durationStr}) - ${error.message}`, 'red');
      resolve({
        file: testFile,
        success: false,
        duration,
        error: error.message
      });
    });
  });
}

// Main test runner
async function runAllTests() {
  const testFiles = findTestFiles();

  if (testFiles.length === 0) {
    log('❌ No test files found matching pattern: test-*.js in tests/ directory', 'red');
    process.exit(1);
  }

  log(`🚀 QuickJS-Emscripten Test Suite Runner`, 'bright');
  log(`📍 Directory: ${path.join(__dirname, 'tests')}`, 'cyan');
  log(`🧪 Found ${testFiles.length} test files`, 'cyan');
  log(`📋 Test files:`, 'cyan');
  testFiles.forEach((file, index) => {
    log(`   ${index + 1}. ${file}`, 'cyan');
  });

  const startTime = Date.now();
  const results = [];

  // Run tests sequentially
  for (let i = 0; i < testFiles.length; i++) {
    const testFile = testFiles[i];
    log(`\n📊 Progress: ${i + 1}/${testFiles.length}`, 'magenta');

    const result = await runTest(testFile);
    results.push(result);

    // Add a small delay between tests for better readability
    if (i < testFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Generate summary report
  const totalDuration = Date.now() - startTime;
  const passed = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`📊 TEST SUITE SUMMARY`, 'bright');
  log(`${'='.repeat(80)}`, 'cyan');
  log(`✅ Passed: ${passed.length}/${testFiles.length}`, passed.length === testFiles.length ? 'green' : 'yellow');
  log(`❌ Failed: ${failed.length}/${testFiles.length}`, failed.length === 0 ? 'green' : 'red');
  log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`, 'cyan');
  log(`📈 Average Test Duration: ${(totalDuration / testFiles.length / 1000).toFixed(2)}s`, 'cyan');

  if (failed.length > 0) {
    log(`\n❌ FAILED TESTS:`, 'red');
    failed.forEach((result, index) => {
      const durationStr = `${(result.duration / 1000).toFixed(2)}s`;
      if (result.error) {
        log(`   ${index + 1}. ${result.file} (${durationStr}) - Error: ${result.error}`, 'red');
      } else {
        log(`   ${index + 1}. ${result.file} (${durationStr}) - Exit code: ${result.exitCode}`, 'red');
      }
    });
  }

  if (passed.length > 0) {
    log(`\n✅ PASSED TESTS:`, 'green');
    passed.forEach((result, index) => {
      const durationStr = `${(result.duration / 1000).toFixed(2)}s`;
      log(`   ${index + 1}. ${result.file} (${durationStr})`, 'green');
    });
  }

  // Performance insights
  const slowestTest = results.reduce((prev, current) =>
    (prev.duration > current.duration) ? prev : current
  );
  const fastestTest = results.reduce((prev, current) =>
    (prev.duration < current.duration) ? prev : current
  );

  log(`\n⚡ PERFORMANCE INSIGHTS:`, 'yellow');
  log(`   Slowest: ${slowestTest.file} (${(slowestTest.duration / 1000).toFixed(2)}s)`, 'yellow');
  log(`   Fastest: ${fastestTest.file} (${(fastestTest.duration / 1000).toFixed(2)}s)`, 'yellow');

  // Test categories analysis
  const categories = {
    arena: results.filter(r => r.file.includes('arena')),
    fetch: results.filter(r => r.file.includes('fetch')),
    execute: results.filter(r => r.file.includes('execute')),
    async: results.filter(r => r.file.includes('async')),
    integration: results.filter(r => r.file.includes('integration') || r.file.includes('api')),
    scoping: results.filter(r => r.file.includes('scoping') || r.file.includes('problem')),
    other: results.filter(r => !['arena', 'fetch', 'execute', 'async', 'integration', 'api', 'scoping', 'problem'].some(keyword => r.file.includes(keyword)))
  };

  log(`\n📋 TEST CATEGORIES:`, 'blue');
  Object.entries(categories).forEach(([category, tests]) => {
    if (tests.length > 0) {
      const categoryPassed = tests.filter(t => t.success).length;
      const status = categoryPassed === tests.length ? '✅' : categoryPassed > 0 ? '⚠️' : '❌';
      log(`   ${status} ${category.toUpperCase()}: ${categoryPassed}/${tests.length} passed`, 'blue');
    }
  });

  log(`\n${'='.repeat(80)}`, 'cyan');

  // Exit with appropriate code
  if (failed.length === 0) {
    log(`🎉 ALL TESTS PASSED! QuickJS-Emscripten test suite completed successfully.`, 'green');
    process.exit(0);
  } else {
    log(`💥 ${failed.length} TEST(S) FAILED! Please review the failed tests above.`, 'red');
    process.exit(1);
  }
}

// Handle process interruption
process.on('SIGINT', () => {
  log(`\n⚠️  Test suite interrupted by user`, 'yellow');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log(`\n⚠️  Test suite terminated`, 'yellow');
  process.exit(143);
});

// Run the test suite (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    log(`💥 Test runner failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

export { runAllTests, findTestFiles };
