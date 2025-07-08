/* eslint-disable */
/* eslint-env node */
/**
 * Comprehensive Integration Tests for Cloudflare Worker
 * Tests all endpoints with detailed validation and data inspection
 */

import https from 'https';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = 'https://cloudflare-workers-example.federation.workers.dev';
const DEFAULT_TIMEOUT = 30000;
const TESTS_DIR = path.join(__dirname, 'tests');

// Colors for console output
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

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

// HTTP request utility with detailed error handling
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const urlObj = new URL(url);

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'CloudflareWorker-IntegrationTest/1.0',
        ...options.headers
      },
      timeout: timeout
    };

    const req = https.request(requestOptions, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.end();
  });
}

// Function to execute local test files
function executeLocalTest(testPath, timeout = DEFAULT_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [testPath], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Test timeout after ${timeout}ms`));
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

// Function to load test files from tests directory
function loadTestFiles() {
  const testSuites = {};

  if (!fs.existsSync(TESTS_DIR)) {
    console.error(`Tests directory not found: ${TESTS_DIR}`);
    return testSuites;
  }

  const testFiles = fs.readdirSync(TESTS_DIR).filter(file => file.endsWith('.js'));

  for (const file of testFiles) {
    const testPath = path.join(TESTS_DIR, file);
    const testName = path.basename(file, '.js');

        try {
      // All test files are standalone test files, create a test suite that executes the file locally
      testSuites[testName] = {
        name: testName.replace(/test-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        tests: [{
          name: `Execute ${testName}`,
          isLocalTest: true,
          testPath: testPath,
          timeout: 60000,
          validate: (result) => {
            if (result.exitCode !== 0) return `Test failed with exit code ${result.exitCode}: ${result.stderr}`;
            return null;
          }
        }]
      };
    } catch (error) {
      console.warn(`Warning: Could not process test file ${file}:`, error.message);
    }
  }

  return testSuites;
}

// Initialize TEST_SUITES - will be populated in runAllTests()
let TEST_SUITES = {};

// Fallback hardcoded test suites
const FALLBACK_TEST_SUITES = {

  // Basic Endpoint Tests
  basic: {
    name: 'Basic Endpoints',
    tests: [
      {
        name: 'Root - HTML Response',
        path: '/',
        headers: { 'Accept': 'text/html' },
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;
          if (!response.headers['content-type']?.includes('text/html')) return 'Expected HTML content-type';
          if (!response.body.includes('Module Federation')) return 'Missing Module Federation content';
          if (!response.body.includes('Interactive Module Execution')) return 'Missing interactive content';
          if (response.body.length < 10000) return 'HTML response too short';
          return null;
        }
      },
      {
        name: 'Root - JSON Response',
        path: '/',
        headers: { 'Accept': 'application/json' },
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;
          if (!response.headers['content-type']?.includes('application/json')) return 'Expected JSON content-type';

          let data;
          try {
            data = JSON.parse(response.body);
          } catch (e) {
            return `Invalid JSON: ${e.message}`;
          }

          if (!data.message?.includes('QuickJS Cloudflare Worker')) return `Unexpected message: ${data.message}`;
          if (!data.examples) return 'Missing examples object';
          if (!data.usage) return 'Missing usage instructions';
          if (!data.timestamp) return 'Missing timestamp';

          return null;
        }
      },
      {
        name: 'CORS Preflight',
        path: '/',
        method: 'OPTIONS',
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;
          if (response.headers['access-control-allow-origin'] !== '*') return 'Missing CORS allow-origin';
          if (!response.headers['access-control-allow-methods']) return 'Missing CORS allow-methods';
          if (!response.headers['access-control-allow-headers']) return 'Missing CORS allow-headers';
          return null;
        }
      },
      {
        name: 'No Redirects Test (Critical)',
        path: '/arena-test',
        timeout: 10000,
        validate: (response) => {
          // This is a critical test - these endpoints should NEVER redirect
          if (response.statusCode === 302 || response.statusCode === 301) {
            return `CRITICAL: Endpoint is redirecting (${response.statusCode})! This means the Module Federation test buttons are broken.`;
          }
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;
          return null;
        }
      }
    ]
  },

  // Critical No-Redirect Tests (These were the original broken endpoints)
  noRedirects: {
    name: 'No Redirects (Critical Regression Tests)',
    tests: [
      {
        name: 'Arena Test - No Redirect',
        path: '/arena-test',
        timeout: 5000,
        validate: (response) => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            return `CRITICAL FAILURE: /arena-test is redirecting! Module Federation test button is broken.`;
          }
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;
          try {
            const data = JSON.parse(response.body);
            if (!data.test) return 'Response is not a test result - likely redirected to main page';
          } catch (e) {
            return 'Response is not JSON - likely redirected to HTML page';
          }
          return null;
        }
      },
      {
        name: 'Test Module - No Redirect',
        path: '/test-module',
        timeout: 5000,
        validate: (response) => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            return `CRITICAL FAILURE: /test-module is redirecting! Module Federation test button is broken.`;
          }
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;
          try {
            const data = JSON.parse(response.body);
            if (!data.test) return 'Response is not a test result - likely redirected to main page';
          } catch (e) {
            return 'Response is not JSON - likely redirected to HTML page';
          }
          return null;
        }
      },
      {
        name: 'Test Fetch - No Redirect',
        path: '/test-fetch',
        timeout: 5000,
        validate: (response) => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            return `CRITICAL FAILURE: /test-fetch is redirecting! Module Federation test button is broken.`;
          }
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;
          try {
            const data = JSON.parse(response.body);
            if (!data.test) return 'Response is not a test result - likely redirected to main page';
          } catch (e) {
            return 'Response is not JSON - likely redirected to HTML page';
          }
          return null;
        }
      },
      {
        name: 'Test Real Fetch - No Redirect',
        path: '/test-real-fetch',
        timeout: 5000,
        validate: (response) => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            return `CRITICAL FAILURE: /test-real-fetch is redirecting! Module Federation test button is broken.`;
          }
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;
          try {
            const data = JSON.parse(response.body);
            if (!data.test) return 'Response is not a test result - likely redirected to main page';
          } catch (e) {
            return 'Response is not JSON - likely redirected to HTML page';
          }
          return null;
        }
      }
    ]
  },

  // Module Federation Tests
  federation: {
    name: 'Module Federation',
    tests: [
      {
        name: 'Federation Demo Info',
        path: '/federation-demo',
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;

          let data;
          try {
            data = JSON.parse(response.body);
          } catch (e) {
            return `Invalid JSON: ${e.message}`;
          }

          if (!data.message?.includes('Real Module Federation Demo')) return 'Unexpected demo message';
          if (data.assets_available !== true) return 'Assets not available';
          if (!Array.isArray(data.exposed_modules)) return 'Missing exposed_modules array';
          if (data.exposed_modules.length < 5) return `Expected at least 5 modules, got ${data.exposed_modules.length}`;

          const expectedModules = ['HelloWorld', 'DataProcessor', 'ApiUtils', 'WorkerUtils', 'AdvancedExamples', 'FetchUtils'];
          for (const module of expectedModules) {
            if (!data.exposed_modules.some(m => m.includes(module))) {
              return `Missing expected module: ${module}`;
            }
          }

          return null;
        }
      },
      {
        name: 'Arena Test (Simple Module)',
        path: '/arena-test',
        timeout: 15000,
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;

          let data;
          try {
            data = JSON.parse(response.body);
          } catch (e) {
            return `Invalid JSON: ${e.message}`;
          }

          if (data.test !== 'arena-test') return `Expected test=arena-test, got ${data.test}`;
          if (data.success !== true) return `Expected success=true, got ${data.success}. Error: ${data.error}`;
          if (data.module !== 'HelloWorld') return `Expected module=HelloWorld, got ${data.module}`;
          if (data.function !== 'helloWorld') return `Expected function=helloWorld, got ${data.function}`;
          if (!data.result?.includes('Arena Test')) return 'Result should contain Arena Test greeting';
          if (!Array.isArray(data.logs)) return 'Missing logs array';
          if (data.logs.length < 5) return 'Insufficient log entries';

          // Verify specific log entries that indicate proper execution
          const logString = data.logs.join(' ');
          if (!logString.includes('module.exports.init')) return 'Missing init() call in logs';
          if (!logString.includes('Factory received')) return 'Missing factory execution in logs';
          if (!logString.includes('Module executed')) return 'Missing module execution in logs';

          return null;
        }
      },
      {
        name: 'Comprehensive Module Test',
        path: '/test-module',
        timeout: 20000,
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;

          let data;
          try {
            data = JSON.parse(response.body);
          } catch (e) {
            return `Invalid JSON: ${e.message}`;
          }

          if (data.test !== 'comprehensive-module-test') return `Expected test=comprehensive-module-test, got ${data.test}`;
          if (data.success !== true) return `Expected success=true, got ${data.success}. Error: ${data.error}`;
          if (!data.results) return 'Missing results object';
          if (!Array.isArray(data.logs)) return 'Missing logs array';

          // Check for specific test results
          if (!data.results.helloWorld?.includes('Comprehensive Test')) return 'Missing HelloWorld result';
          if (!data.results.dataProcessor?.generated || data.results.dataProcessor.generated < 3) return 'Missing DataProcessor result';
          if (!data.results.workerUtils?.status || data.results.workerUtils.status !== 200) return 'Missing WorkerUtils result';

          // Verify all three modules were tested
          const logString = data.logs.join(' ');
          if (!logString.includes('Testing HelloWorld module')) return 'Missing HelloWorld test in logs';
          if (!logString.includes('Testing DataProcessor module')) return 'Missing DataProcessor test in logs';
          if (!logString.includes('Testing WorkerUtils module')) return 'Missing WorkerUtils test in logs';

          return null;
        }
      },
      {
        name: 'Fetch Test (External API)',
        path: '/test-fetch',
        timeout: 25000,
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;

          let data;
          try {
            data = JSON.parse(response.body);
          } catch (e) {
            return `Invalid JSON: ${e.message}`;
          }

          if (data.test !== 'fetch-test') return `Expected test=fetch-test, got ${data.test}`;
          if (data.success !== true) return `Expected success=true, got ${data.success}. Error: ${data.error}`;
          if (data.module !== 'FetchUtils') return `Expected module=FetchUtils, got ${data.module}`;
          if (data.function !== 'quickFetchDemo') return `Expected function=quickFetchDemo, got ${data.function}`;
          if (!data.result) return 'Missing result object';

          // Verify the fetch result structure
          if (data.result.success !== true) return `FetchUtils result failed: ${data.result.error || 'unknown error'}`;
          if (data.result.demo !== 'quick-fetch') return `Expected demo=quick-fetch, got ${data.result.demo}`;
          if (!data.result.data) return 'Missing data in fetch result';
          if (!data.result.data.id) return 'Missing post id in fetch data';

          return null;
        }
      },
      {
        name: 'Real Fetch Test (Comprehensive API)',
        path: '/test-real-fetch',
        timeout: 30000,
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;

          let data;
          try {
            data = JSON.parse(response.body);
          } catch (e) {
            return `Invalid JSON: ${e.message}`;
          }

          if (data.test !== 'real-fetch-test') return `Expected test=real-fetch-test, got ${data.test}`;
          if (data.success !== true) return `Expected success=true, got ${data.success}. Error: ${data.error}`;
          if (data.module !== 'FetchUtils') return `Expected module=FetchUtils, got ${data.module}`;
          if (data.function !== 'demonstrateFetchCapabilities') return `Expected function=demonstrateFetchCapabilities, got ${data.function}`;
          if (!data.result) return 'Missing result object';

          // Verify the comprehensive fetch result structure
          if (data.result.success !== true) return `Comprehensive fetch failed: ${data.result.error || 'unknown error'}`;
          if (data.result.demo !== 'comprehensive-fetch-capabilities') return `Expected demo=comprehensive-fetch-capabilities, got ${data.result.demo}`;
          if (!data.result.results) return 'Missing results in comprehensive fetch';
          if (!data.result.summary) return 'Missing summary in comprehensive fetch';

          // Check specific API results
          if (!data.result.results.posts) return 'Missing posts results';
          if (!data.result.results.users) return 'Missing users results';
          if (!data.result.results.newPost) return 'Missing newPost results';
          if (data.result.summary.totalRequests < 4) return `Expected at least 4 requests, got ${data.result.summary.totalRequests}`;

          return null;
        }
      }
    ]
  },

  // Module Execution Tests
  execution: {
    name: 'Module Execution',
    tests: [
      {
        name: 'Execute HelloWorld',
        path: '/execute-module?module=HelloWorld&function=helloWorld&params={"name":"IntegrationTest","message":"Testing from"}',
        timeout: 15000,
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;

          let data;
          try {
            data = JSON.parse(response.body);
          } catch (e) {
            return `Invalid JSON: ${e.message}`;
          }

          if (data.success !== true) return `Expected success=true, got ${data.success}. Error: ${data.error}`;
          if (!data.execution) return 'Missing execution object';
          if (data.execution.module !== 'HelloWorld') return `Expected module=HelloWorld, got ${data.execution.module}`;
          if (data.execution.function !== 'helloWorld') return `Expected function=helloWorld, got ${data.execution.function}`;
          if (!data.execution.result?.includes('IntegrationTest')) return 'Result should contain the test name';
          if (!data.execution.result?.includes('Testing from')) return 'Result should contain the test message';
          if (!Array.isArray(data.logs)) return 'Missing logs array';
          if (data.logs.length < 3) return 'Insufficient log entries';

          return null;
        }
      },
      {
        name: 'Execute DataProcessor',
        path: '/execute-module?module=DataProcessor&function=generateSampleData&params=7',
        timeout: 15000,
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;

          let data;
          try {
            data = JSON.parse(response.body);
          } catch (e) {
            return `Invalid JSON: ${e.message}`;
          }

          if (data.success !== true) return `Expected success=true, got ${data.success}. Error: ${data.error}`;
          if (!data.execution) return 'Missing execution object';
          if (data.execution.module !== 'DataProcessor') return `Expected module=DataProcessor, got ${data.execution.module}`;
          if (data.execution.function !== 'generateSampleData') return `Expected function=generateSampleData, got ${data.execution.function}`;
          if (!Array.isArray(data.execution.result)) return 'Expected result to be an array';
          if (data.execution.result.length !== 7) return `Expected 7 items, got ${data.execution.result.length}`;
          if (!Array.isArray(data.logs)) return 'Missing logs array';

          // Validate sample data structure
          const firstItem = data.execution.result[0];
          if (!firstItem.id || typeof firstItem.value !== 'number' || !firstItem.category) {
            return 'Invalid sample data structure - missing id, value, or category';
          }
          if (!firstItem.timestamp || typeof firstItem.timestamp !== 'number') {
            return 'Invalid sample data structure - missing or invalid timestamp';
          }

          return null;
        }
      },
      {
        name: 'Execute WorkerUtils',
        path: '/execute-module?module=WorkerUtils&function=routeHandler&params="/health"',
        timeout: 15000,
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;

          let data;
          try {
            data = JSON.parse(response.body);
          } catch (e) {
            return `Invalid JSON: ${e.message}`;
          }

          if (data.success !== true) return `Expected success=true, got ${data.success}. Error: ${data.error}`;
          if (!data.execution) return 'Missing execution object';
          if (data.execution.module !== 'WorkerUtils') return `Expected module=WorkerUtils, got ${data.execution.module}`;
          if (data.execution.function !== 'routeHandler') return `Expected function=routeHandler, got ${data.execution.function}`;
          if (!data.execution.result) return 'Missing execution result';
          if (typeof data.execution.result.status !== 'number') return 'Expected numeric status';
          if (data.execution.result.status !== 200) return `Expected status 200, got ${data.execution.result.status}`;
          if (!data.execution.result.headers) return 'Missing headers in result';
          if (!data.execution.result.body) return 'Missing body in result';
          if (!Array.isArray(data.logs)) return 'Missing logs array';

          return null;
        }
      }
    ]
  },

  // External API Fetch Tests
  fetch: {
    name: 'External API Fetch',
    tests: [
      {
        name: 'FetchUtils Test',
        path: '/test-fetch',
        timeout: 25000,
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;

          let data;
          try {
            data = JSON.parse(response.body);
          } catch (e) {
            return `Invalid JSON: ${e.message}`;
          }

          if (data.test !== 'fetch-test') return `Expected test=fetch-test, got ${data.test}`;
          if (data.success !== true) return `Expected success=true, got ${data.success}`;
          if (data.module !== 'FetchUtils') return `Expected module=FetchUtils, got ${data.module}`;
          if (!data.result?.demo) return 'Missing result.demo field';
          if (data.result.demo !== 'quick-fetch') return `Expected demo=quick-fetch, got ${data.result.demo}`;
          if (!Array.isArray(data.logs)) return 'Missing logs array';

          return null;
        }
      },
      {
        name: 'Real Fetch Test (Live APIs)',
        path: '/test-real-fetch',
        timeout: 30000,
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;

          let data;
          try {
            data = JSON.parse(response.body);
          } catch (e) {
            return `Invalid JSON: ${e.message}`;
          }

          if (data.test !== 'real-fetch-test') return `Expected test=real-fetch-test, got ${data.test}`;
          if (data.success !== true) return `Expected success=true, got ${data.success}`;
          if (data.module !== 'FetchUtils') return `Expected module=FetchUtils, got ${data.module}`;
          if (!data.result?.demo) return 'Missing result.demo field';
          if (data.result.demo !== 'comprehensive-fetch-capabilities') return `Expected demo=comprehensive-fetch-capabilities, got ${data.result.demo}`;
          if (!Array.isArray(data.logs)) return 'Missing logs array';

          return null;
        }
      },
      {
        name: 'Execute FetchUtils demonstrateFetchCapabilities',
        path: '/execute-module?module=FetchUtils&function=demonstrateFetchCapabilities&params={}',
        timeout: 30000,
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;

          let data;
          try {
            data = JSON.parse(response.body);
          } catch (e) {
            return `Invalid JSON: ${e.message}`;
          }

          if (data.success !== true) return `Expected success=true, got ${data.success}`;
          if (!data.execution) return 'Missing execution object';
          if (data.execution.module !== 'FetchUtils') return `Expected module=FetchUtils, got ${data.execution.module}`;
          if (data.execution.function !== 'demonstrateFetchCapabilities') return 'Unexpected function name';

          // This is the critical test - should have actual result data
          if (!data.execution.result) return 'Missing execution result - this is the main issue!';
          if (data.execution.result.success !== true) return 'Fetch demo execution failed';
          if (!data.execution.result.results) return 'Missing results in fetch demo';
          if (!data.execution.result.results.posts) return 'Missing posts data in fetch demo';

          const posts = data.execution.result.results.posts;
          if (!posts.sample || !Array.isArray(posts.sample)) return 'Missing or invalid posts sample array';
          if (posts.sample.length < 2) return `Expected at least 2 posts in sample, got ${posts.sample.length}`;

          // Validate post structure
          const firstPost = posts.sample[0];
          if (!firstPost.id || !firstPost.title) return 'Invalid post structure in sample';

          return null;
        }
      }
    ]
  },

  // Asset Serving Tests
  assets: {
    name: 'Asset Serving',
    tests: [
      {
        name: 'Remote Entry JS',
        path: '/remoteEntry.js',
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;
          if (!response.headers['content-type']?.includes('application/javascript')) return 'Expected JS content-type';
          if (!response.body.includes('module.exports')) return 'Missing module.exports in remote entry';
          if (!response.body.includes('federation')) return 'Missing federation code';
          if (response.body.length < 10000) return 'Remote entry file too small';
          return null;
        }
      },
      {
        name: 'HelloWorld Module Asset',
        path: '/assets/__federation_expose_HelloWorld.js',
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;
          if (!response.headers['content-type']?.includes('application/javascript')) return 'Expected JS content-type';
          if (!response.body.includes('helloWorld')) return 'Missing helloWorld function in module';
          if (!response.body.includes('function helloWorld')) return 'Missing helloWorld function definition';
          if (response.body.length < 100) return 'Module file too small';
          return null;
        }
      },
      {
        name: 'DataProcessor Module Asset',
        path: '/assets/__federation_expose_DataProcessor.js',
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;
          if (!response.headers['content-type']?.includes('application/javascript')) return 'Expected JS content-type';
          if (!response.body.includes('generateSampleData')) return 'Missing generateSampleData function in module';
          if (!response.body.includes('processData')) return 'Missing processData function in module';
          if (response.body.length < 100) return 'Module file too small';
          return null;
        }
      },
      {
        name: 'FetchUtils Module Asset',
        path: '/assets/__federation_expose_FetchUtils.js',
        validate: (response) => {
          if (response.statusCode !== 200) return `Expected 200, got ${response.statusCode}`;
          if (!response.headers['content-type']?.includes('application/javascript')) return 'Expected JS content-type';
          if (!response.body.includes('demonstrateFetchCapabilities')) return 'Missing demonstrateFetchCapabilities function in module';
          if (!response.body.includes('quickFetchDemo')) return 'Missing quickFetchDemo function in module';
          if (response.body.length < 100) return 'Module file too small';
          return null;
        }
      }
    ]
  }
}; // End of fallback test suites

// Test runner
class IntegrationTestRunner {
  constructor() {
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.results = [];
  }

  async runTest(test, suiteName) {
    const startTime = Date.now();

    console.log(`  ${colorize('cyan', '🧪')} ${test.name}`);

    try {
      let result;

      if (test.isLocalTest) {
        // Execute local test file
        console.log(`    ${colorize('blue', '→')} ${test.testPath}`);
        result = await executeLocalTest(test.testPath, test.timeout || DEFAULT_TIMEOUT);

        const duration = Date.now() - startTime;

        // Run validation
        const validationError = test.validate ? test.validate(result) : null;

        if (validationError) {
          console.log(`    ${colorize('red', '❌')} FAILED (${duration}ms): ${validationError}`);
          this.failedTests++;
          this.results.push({
            suite: suiteName,
            name: test.name,
            success: false,
            duration,
            error: validationError,
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr
          });
        } else {
          console.log(`    ${colorize('green', '✅')} PASSED (${duration}ms)`);
          this.passedTests++;
          this.results.push({
            suite: suiteName,
            name: test.name,
            success: true,
            duration,
            exitCode: result.exitCode,
            outputSize: result.stdout.length
          });

          // Show sample output for local tests
          if (result.stdout && result.stdout.length > 0) {
            const outputLines = result.stdout.split('\n').slice(0, 3);
            console.log(`    ${colorize('magenta', '📄')} Output: ${outputLines.join('; ')}`);
          }
        }
      } else {
        // Execute HTTP test
        const url = BASE_URL + test.path;
        console.log(`    ${colorize('blue', '→')} ${test.path}`);

        const response = await makeRequest(url, {
          method: test.method || 'GET',
          headers: test.headers || {},
          timeout: test.timeout || DEFAULT_TIMEOUT
        });

        const duration = Date.now() - startTime;

        // Run validation
        const validationError = test.validate ? test.validate(response) : null;

        if (validationError) {
          console.log(`    ${colorize('red', '❌')} FAILED (${duration}ms): ${validationError}`);
          this.failedTests++;
          this.results.push({
            suite: suiteName,
            name: test.name,
            success: false,
            duration,
            error: validationError,
            statusCode: response.statusCode
          });
        } else {
          console.log(`    ${colorize('green', '✅')} PASSED (${duration}ms)`);
          this.passedTests++;
          this.results.push({
            suite: suiteName,
            name: test.name,
            success: true,
            duration,
            statusCode: response.statusCode,
            responseSize: response.body.length
          });

          // Show sample data for critical tests
          if (test.name.includes('demonstrateFetchCapabilities') && response.body) {
            try {
              const data = JSON.parse(response.body);
              if (data.execution?.result?.results?.posts?.sample) {
                console.log(`    ${colorize('magenta', '📄')} Posts found: ${data.execution.result.results.posts.sample.map(p => p.title?.substring(0, 30) + '...').join(', ')}`);
              }
            } catch (e) {
              // Ignore parsing errors for sample display
            }
          }
        }
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`    ${colorize('red', '❌')} ERROR (${duration}ms): ${error.message}`);
      this.failedTests++;
      this.results.push({
        suite: suiteName,
        name: test.name,
        success: false,
        duration,
        error: error.message
      });
    }

    this.totalTests++;
  }

  async runSuite(suiteName, suite) {
    console.log(`\n${colorize('bright', '📦')} ${colorize('yellow', suite.name)} (${suite.tests.length} tests)`);
    console.log('─'.repeat(60));

    for (const test of suite.tests) {
      await this.runTest(test, suiteName);
    }
  }

  async runAllTests() {
    console.log(colorize('bright', '🚀 Comprehensive Integration Test Suite'));
    console.log(`${colorize('blue', '📍')} Base URL: ${BASE_URL}`);
    console.log(`${colorize('blue', '⏱️')} Default Timeout: ${DEFAULT_TIMEOUT}ms`);
    console.log(`${colorize('blue', '📁')} Tests Directory: ${TESTS_DIR}`);

    // Load both local test files AND HTTP endpoint tests
    const dynamicTestSuites = loadTestFiles();
    if (Object.keys(dynamicTestSuites).length > 0) {
      console.log(`${colorize('green', '✅')} Loaded ${Object.keys(dynamicTestSuites).length} test suites from tests/ directory`);
      console.log(`${colorize('green', '✅')} Adding ${Object.keys(FALLBACK_TEST_SUITES).length} HTTP endpoint test suites`);

      // Combine both local tests and HTTP endpoint tests
      TEST_SUITES = { ...dynamicTestSuites, ...FALLBACK_TEST_SUITES };
    } else {
      console.log(`${colorize('yellow', '⚠️')} No test files found in tests/ directory, using hardcoded test suites only`);
      TEST_SUITES = FALLBACK_TEST_SUITES;
    }

    const startTime = Date.now();

    // Run local test suites first
    console.log(colorize('bright', '\n🧪 RUNNING LOCAL UNIT TESTS'));
    console.log('═'.repeat(50));
    for (const [suiteName, suite] of Object.entries(dynamicTestSuites)) {
      await this.runSuite(suiteName, suite);
    }

    // Run HTTP endpoint tests second
    console.log(colorize('bright', '\n🌐 RUNNING HTTP ENDPOINT TESTS'));
    console.log('═'.repeat(50));
    for (const [suiteName, suite] of Object.entries(FALLBACK_TEST_SUITES)) {
      await this.runSuite(suiteName, suite);
    }

    const totalDuration = Date.now() - startTime;

    // Generate report
    this.generateReport(totalDuration);
  }

  generateReport(totalDuration) {
    console.log('\n' + '═'.repeat(80));
    console.log(colorize('bright', '📊 COMPREHENSIVE TEST RESULTS'));
    console.log('═'.repeat(80));

    console.log(`${colorize('green', '✅')} Passed: ${this.passedTests}/${this.totalTests}`);
    console.log(`${colorize('red', '❌')} Failed: ${this.failedTests}/${this.totalTests}`);
    console.log(`${colorize('blue', '⏱️')} Total Duration: ${totalDuration}ms`);
    console.log(`${colorize('blue', '📈')} Average Test Duration: ${Math.round(totalDuration / this.totalTests)}ms`);

    // Failed tests summary
    if (this.failedTests > 0) {
      console.log(`\n${colorize('red', '❌ FAILED TESTS:')}`);
      const failedResults = this.results.filter(r => !r.success);
      failedResults.forEach(result => {
        console.log(`  ${colorize('red', '•')} [${result.suite}] ${result.name}: ${result.error}`);
        if (result.stderr) {
          console.log(`    ${colorize('red', 'stderr:')} ${result.stderr}`);
        }
      });
    }

    // Performance insights
    const slowestTest = this.results.reduce((prev, current) =>
      (prev.duration > current.duration) ? prev : current
    );
    const fastestTest = this.results.reduce((prev, current) =>
      (prev.duration < current.duration) ? prev : current
    );

    console.log(`\n${colorize('cyan', '⚡ PERFORMANCE INSIGHTS:')}`);
    console.log(`  Slowest: ${slowestTest.name} (${slowestTest.duration}ms)`);
    console.log(`  Fastest: ${fastestTest.name} (${fastestTest.duration}ms)`);

    // Suite-by-suite breakdown
    console.log(`\n${colorize('yellow', '📦 SUITE BREAKDOWN:')}`);
    for (const [suiteName, suite] of Object.entries(TEST_SUITES)) {
      const suiteResults = this.results.filter(r => r.suite === suiteName);
      const suitePassed = suiteResults.filter(r => r.success).length;
      const suiteFailed = suiteResults.filter(r => !r.success).length;
      const suiteIcon = suiteFailed === 0 ? '✅' : '❌';
      console.log(`  ${suiteIcon} ${suite.name}: ${suitePassed}/${suiteResults.length} passed`);
    }

    // Critical test analysis
    console.log(`\n${colorize('magenta', '🎯 CRITICAL TEST ANALYSIS:')}`);
    const fetchTest = this.results.find(r => r.name.includes('demonstrateFetchCapabilities'));
    if (fetchTest) {
      if (fetchTest.success) {
        console.log(`  ${colorize('green', '✅')} FetchUtils data capture: WORKING`);
        console.log(`  ${colorize('green', '✅')} External API integration: FUNCTIONAL`);
      } else {
        console.log(`  ${colorize('red', '❌')} FetchUtils data capture: BROKEN`);
        console.log(`  ${colorize('red', '❌')} Error: ${fetchTest.error}`);
      }
    }

    console.log('\n' + '═'.repeat(80));

    // Exit code
    if (this.failedTests === 0) {
      console.log(colorize('green', '🎉 ALL TESTS PASSED! Cloudflare Worker is fully functional.'));
      process.exit(0);
    } else {
      console.log(colorize('red', `💥 ${this.failedTests} TESTS FAILED! Worker needs attention.`));
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const runner = new IntegrationTestRunner();
  await runner.runAllTests();
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run tests
main().catch(error => {
  console.error(colorize('red', '💥 Test runner failed:'), error);
  process.exit(1);
});
