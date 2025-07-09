/* eslint-disable */
import { newQuickJSWASMModule, RELEASE_SYNC } from 'quickjs-emscripten';
import { Arena } from 'quickjs-emscripten-sync';

(async () => {
  console.log('🧪 Testing QuickJS scoping behavior');

  const QuickJS = await newQuickJSWASMModule(RELEASE_SYNC);
  const vm = QuickJS.newContext();
  const arena = new Arena(vm, { isMarshalable: () => true });

  // Add console support
  arena.expose({
    console: {
      log: (...args) => console.log('[QuickJS]', ...args)
    }
  });

  try {
    // Test 1: Simple variable scoping
    console.log('\n=== Test 1: Simple variable scoping ===');
    try {
      arena.evalCode(`
        var globalVar = 'I am global';
        function testFunc() {
          var innerVar = 'I am inner';
          function innerFunc() {
            console.log('innerFunc can access globalVar:', typeof globalVar);
            console.log('innerFunc can access innerVar:', typeof innerVar);
            return innerVar + ' from innerFunc';
          }
          return innerFunc;
        }
      `);

      const result1 = arena.evalCode(`testFunc()()`);
      console.log('Test 1 result:', result1);
    } catch (error) {
      console.log('Test 1 error:', error.message);
    }

    // Test 2: Function closure with factory pattern
    console.log('\n=== Test 2: Function closure with factory pattern ===');
    arena.evalCode(`
      function createFactory() {
        var factoryVar = 'I am in factory scope';

        function __test_require__(id) {
          console.log('__test_require__ called with:', id);
          return { message: factoryVar + ' - module ' + id };
        }

        function factory() {
          console.log('Factory executing, __test_require__ type:', typeof __test_require__);
          return __test_require__(123);
        }

        return factory;
      }

      globalThis.factoryFunction = createFactory();
    `);

    const result2 = arena.evalCode(`factoryFunction()`);
    console.log('Test 2 result:', result2);

    // Test 3: Simulate webpack-like scenario
    console.log('\n=== Test 3: Webpack-like scenario ===');
    arena.evalCode(`
      (function(modules) {
        var installedModules = {};

        function __webpack_require__(moduleId) {
          if(installedModules[moduleId]) {
            return installedModules[moduleId].exports;
          }
          var module = installedModules[moduleId] = {
            exports: {}
          };
          modules[moduleId](module, module.exports, __webpack_require__);
          return module.exports;
        }

        // Create a factory function that uses __webpack_require__
        globalThis.webpackFactory = function() {
          console.log('webpackFactory executing, __webpack_require__ type:', typeof __webpack_require__);
          return __webpack_require__(42);
        };

        // Store modules
        globalThis.testModules = modules;

      })({
        42: function(module, exports, __webpack_require__) {
          exports.hello = function(name) {
            return 'Hello from webpack module, ' + name + '!';
          };
        }
      });
    `);

    const result3 = arena.evalCode(`webpackFactory()`);
    console.log('Test 3 result:', result3);

    if (result3 && result3.hello) {
      const greeting = arena.evalCode(`webpackFactory().hello('Scoping Test')`);
      console.log('Test 3 greeting:', greeting);
    }

    // Test 4: Test what happens when we try to execute a function directly
    console.log('\n=== Test 4: Direct function execution ===');

    try {
      const result4 = arena.evalCode(`webpackFactory()`);
      console.log('Test 4 result:', result4);
    } catch (error) {
      console.log('Test 4 error:', error.message);
    }

    // Test 5: Module Federation simulation - correct pattern
    console.log('\n=== Test 5: Module Federation simulation ===');
    arena.evalCode(`
      // Simulate a more realistic Module Federation scenario
      (function() {
        var moduleCache = {};
        var chunkCache = {};

        function __webpack_require__(moduleId) {
          if (moduleCache[moduleId]) {
            return moduleCache[moduleId].exports;
          }

          var module = moduleCache[moduleId] = { exports: {} };

          // Simulate the HelloWorld module
          if (moduleId === 360) {
            module.exports.helloWorld = function(options) {
              var name = (options && options.name) || 'World';
              return 'Hello, ' + name + '!';
            };
            module.exports.default = module.exports.helloWorld;
          }

          return module.exports;
        }

        // Create a get function that returns a factory, but execute the factory in the same context
        globalThis.mockModuleFederation = {
          get: function(moduleName) {
            console.log('Mock get called for:', moduleName);

            // Return a promise that resolves to a factory
            return Promise.resolve(function factory() {
              console.log('Factory executing, __webpack_require__ type:', typeof __webpack_require__);
              // This factory has access to __webpack_require__ because it's in the same closure
              return __webpack_require__(360);
            });
          },

          // Correct pattern: get and execute the factory in the same context
          getAndExecute: async function(moduleName) {
            console.log('GetAndExecute called for:', moduleName);

            // Get the factory
            const factory = await this.get(moduleName);

            // Execute the factory immediately in the same context where __webpack_require__ is available
            if (typeof factory === 'function') {
              console.log('Executing factory in same context...');
              const moduleExports = factory();
              console.log('Module executed, type:', typeof moduleExports);
              console.log('Module keys:', Object.keys(moduleExports || {}));
              return moduleExports;
            }

            return factory;
          }
        };
      })();
    `);

    // Test the correct pattern
    console.log('Testing correct Module Federation pattern...');
    const correctResult = arena.evalCode(`
      (async function() {
        try {
          const moduleExports = await mockModuleFederation.getAndExecute('./HelloWorld');
          console.log('Got module exports:', typeof moduleExports);

          if (moduleExports && typeof moduleExports.helloWorld === 'function') {
            const greeting = moduleExports.helloWorld({ name: 'Scoping Test' });
            console.log('Greeting result:', greeting);
            return greeting;
          } else {
            return 'No helloWorld function found';
          }
        } catch (error) {
          console.log('Error in test:', error.message);
          return 'Error: ' + error.message;
        }
      })()
    `);

    console.log('Test 5 result (should be a promise):', typeof correctResult);

    // Handle the promise result
    if (correctResult && typeof correctResult.then === 'function') {
      console.log('Waiting for promise to resolve...');

      // Execute pending jobs to resolve the promise
      for (let i = 0; i < 10; i++) {
        const jobs = arena.executePendingJobs();
        if (jobs > 0) {
          console.log(`Executed ${jobs} jobs in iteration ${i + 1}`);
        } else {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      console.log('Test 5 completed successfully');
    }

    // Test 6: Test immediate execution in same context (no globalThis)
    console.log('\n=== Test 6: Immediate execution in same context ===');
    console.log('Starting Test 6...');
    arena.evalCode(`
      // Create webpack runtime in one evaluation
      (function() {
        var moduleCache = {};

        function __webpack_require__(moduleId) {
          if (moduleCache[moduleId]) {
            return moduleCache[moduleId].exports;
          }

          var module = moduleCache[moduleId] = { exports: {} };

          // Simulate the HelloWorld module
          if (moduleId === 360) {
            module.exports.helloWorld = function(options) {
              var name = (options && options.name) || 'World';
              return 'Hello, ' + name + '!';
            };
            module.exports.default = module.exports.helloWorld;
          }

          return module.exports;
        }

        // Create global module.exports with get method
        if (typeof globalThis.module === 'undefined') {
          globalThis.module = { exports: {} };
        }

        globalThis.module.exports.get = function(moduleName) {
          console.log('get called for:', moduleName);
          // Return a factory that uses __webpack_require__
          return Promise.resolve(function factory() {
            console.log('Factory executing, __webpack_require__ available:', typeof __webpack_require__);
            return __webpack_require__(360);
          });
        };
      })();
    `);

    // Now immediately test if we can access and use the get method
    arena.evalCode(`
      (async function testImmediateAccess() {
        try {
          console.log('Testing immediate access to module.exports.get...');
          console.log('module.exports.get type:', typeof module.exports.get);

          const factory = await module.exports.get('./HelloWorld');
          console.log('Factory type:', typeof factory);

          const moduleExports = factory();
          console.log('Module exports type:', typeof moduleExports);
          console.log('Module keys:', Object.keys(moduleExports || {}));

          if (moduleExports && typeof moduleExports.helloWorld === 'function') {
            const greeting = moduleExports.helloWorld({ name: 'Immediate Test' });
            console.log('Greeting:', greeting);
            globalThis.__immediateTestResult = greeting;
          } else {
            console.log('No helloWorld function found');
            globalThis.__immediateTestResult = 'No helloWorld function';
          }
        } catch (error) {
          console.log('Immediate test error:', error.message);
          globalThis.__immediateTestResult = 'Error: ' + error.message;
        }
      })();
    `);

    // Execute pending jobs
    for (let i = 0; i < 5; i++) {
      const jobs = arena.executePendingJobs();
      if (jobs > 0) {
        console.log(`Executed ${jobs} jobs in iteration ${i + 1}`);
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Check the result
    const immediateResult = arena.evalCode(`globalThis.__immediateTestResult`);
    console.log('Test 6 result:', immediateResult);

    // Test 7: Webpack chunk loading simulation - eval chunk string
    console.log('\n=== Test 7: Webpack chunk loading simulation ===');

    // First, set up the webpack runtime
    arena.evalCode(`
      (function() {
        var moduleCache = {};
        var installedChunks = {};

        function __webpack_require__(moduleId) {
          if (moduleCache[moduleId]) {
            return moduleCache[moduleId].exports;
          }

          var module = moduleCache[moduleId] = { exports: {} };

          // This will be populated by loaded chunks
          if (__webpack_require__.m[moduleId]) {
            __webpack_require__.m[moduleId](module, module.exports, __webpack_require__);
          }

          return module.exports;
        }

        __webpack_require__.m = {}; // Module cache

        // Simulate chunk loading function
        globalThis.loadChunk = function(chunkContent) {
          console.log('Loading chunk content:', chunkContent.substring(0, 100) + '...');

          // Eval the chunk content in the same context where __webpack_require__ is available
          eval(chunkContent);

          console.log('Chunk loaded successfully');
        };

        // Create federation get method
        globalThis.module = { exports: {} };
        globalThis.module.exports.get = function(moduleName) {
          console.log('Federation get called for:', moduleName);

          // Simulate loading a chunk that contains the requested module
          var chunkContent = \`
            // Webpack chunk content as string
            __webpack_require__.m[360] = function(module, exports, __webpack_require__) {
              exports.helloWorld = function(options) {
                var name = (options && options.name) || 'World';
                return 'Hello from chunk, ' + name + '!';
              };
              exports.default = exports.helloWorld;
            };

            // Return a factory function that uses __webpack_require__
            globalThis.__tempFactory = function() {
              console.log('Chunk factory executing, __webpack_require__ available:', typeof __webpack_require__);
              return __webpack_require__(360);
            };
          \`;

          // Load the chunk
          loadChunk(chunkContent);

          // Return the factory from the chunk
          return Promise.resolve(globalThis.__tempFactory);
        };
      })();
    `);

    // Now test the chunk loading pattern
    arena.evalCode(`
      (async function testChunkLoading() {
        try {
          console.log('Testing chunk loading pattern...');

          const factory = await module.exports.get('./HelloWorld');
          console.log('Factory from chunk:', typeof factory);

          const moduleExports = factory();
          console.log('Module exports from chunk:', typeof moduleExports);
          console.log('Module keys from chunk:', Object.keys(moduleExports || {}));

          if (moduleExports && typeof moduleExports.helloWorld === 'function') {
            const greeting = moduleExports.helloWorld({ name: 'Chunk Test' });
            console.log('Greeting from chunk:', greeting);
            globalThis.__chunkTestResult = greeting;
          } else {
            console.log('No helloWorld function in chunk');
            globalThis.__chunkTestResult = 'No helloWorld function';
          }
        } catch (error) {
          console.log('Chunk test error:', error.message);
          globalThis.__chunkTestResult = 'Error: ' + error.message;
        }
      })();
    `);

    // Execute pending jobs
    for (let i = 0; i < 5; i++) {
      const jobs = arena.executePendingJobs();
      if (jobs > 0) {
        console.log(`Executed ${jobs} jobs in iteration ${i + 1}`);
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Check the result
    const chunkResult = arena.evalCode(`globalThis.__chunkTestResult`);
    console.log('Test 7 result:', chunkResult);

    // Test 8: eval() inside evalCode context access
    console.log('\n=== Test 8: eval() inside evalCode context access ===');

    arena.evalCode(`
      // Set up variables and functions in evalCode context
      var contextVar = 'I am in evalCode context';
      var contextNumber = 42;

      function contextFunction() {
        return 'Hello from context function!';
      }

      function __test_require__(id) {
        return { id: id, message: 'Loaded module ' + id };
      }

      console.log('Before eval - contextVar:', typeof contextVar);
      console.log('Before eval - contextFunction:', typeof contextFunction);
      console.log('Before eval - __test_require__:', typeof __test_require__);

      // Test 1: Direct eval access
      try {
        var evalResult1 = eval('contextVar + " - accessed via eval"');
        console.log('Eval result 1:', evalResult1);
      } catch (error) {
        console.log('Eval test 1 error:', error.message);
      }

      // Test 2: Function call via eval
      try {
        var evalResult2 = eval('contextFunction()');
        console.log('Eval result 2:', evalResult2);
      } catch (error) {
        console.log('Eval test 2 error:', error.message);
      }

      // Test 3: Complex function access via eval
      try {
        var evalResult3 = eval('__test_require__(123)');
        console.log('Eval result 3:', evalResult3);
      } catch (error) {
        console.log('Eval test 3 error:', error.message);
      }

      // Test 4: eval with function that returns another function
      try {
        var factoryCode = 'function() { return __test_require__(360); }';
        var factory = eval('(' + factoryCode + ')');
        console.log('Factory type:', typeof factory);

        var factoryResult = factory();
        console.log('Factory result:', factoryResult);
      } catch (error) {
        console.log('Eval test 4 error:', error.message);
      }

      // Test 5: Simulating webpack chunk eval pattern
      try {
        var chunkCode = \`
          var chunkModule = { exports: {} };
          chunkModule.exports.test = function() {
            return __test_require__(999);
          };
          chunkModule.exports;
        \`;

        console.log('About to eval chunk code...');
        var chunkResult = eval(chunkCode);
        console.log('Chunk result type:', typeof chunkResult);
        console.log('Chunk result keys:', Object.keys(chunkResult || {}));

        if (chunkResult && typeof chunkResult.test === 'function') {
          var testResult = chunkResult.test();
          console.log('Chunk test result:', testResult);
        }
      } catch (error) {
        console.log('Eval test 5 error:', error.message);
      }

      globalThis.__evalTestResults = {
        test1: evalResult1,
        test2: evalResult2,
        test3: evalResult3,
        test4: factoryResult,
        test5: chunkResult
      };
    `);

    const evalResults = arena.evalCode(`globalThis.__evalTestResults`);
    console.log('Test 8 results:', evalResults);

    // Test 9: Recreate the CloudflarePlugin problem - eval() in wrapped function
    console.log('\n=== Test 9: CloudflarePlugin problem recreation ===');

    arena.evalCode(`
      // Simulate the remote entry creating __webpack_require__ in a closure
      (function remoteEntrySimulation() {
        var moduleCache = {};
        var installedChunks = {};

        function __webpack_require__(moduleId) {
          if (moduleCache[moduleId]) {
            return moduleCache[moduleId].exports;
          }

          var module = moduleCache[moduleId] = { exports: {} };

          // Simulate module 360 - HelloWorld
          if (moduleId === 360) {
            module.exports.helloWorld = function(options) {
              var name = (options && options.name) || 'World';
              return 'Hello from webpack, ' + name + '!';
            };
            module.exports.default = module.exports.helloWorld;
          }

          return module.exports;
        }

        __webpack_require__.m = {}; // Module cache

        console.log('Remote entry: __webpack_require__ created, type:', typeof __webpack_require__);

        // Simulate the CloudflarePlugin loadChunkFromKV pattern
        function loadChunkFromKV(chunkContent, callback) {
          console.log('CloudflarePlugin: Loading chunk...');
          console.log('CloudflarePlugin: __webpack_require__ available:', typeof __webpack_require__);

          var chunk = {
            modules: {},
            ids: [],
            runtime: null
          };

          try {
            // This is the EXACT pattern from CloudflarePlugin - wrappedCode with eval
            var wrappedCode = \`
              (function(exports, require, __dirname, __filename) {
                \${chunkContent}

                // Extract webpack chunk data (simplified)
                if (typeof __webpack_modules__ !== 'undefined') {
                  exports.modules = __webpack_modules__;
                }
              })
            \`;

            console.log('CloudflarePlugin: About to eval wrappedCode...');
            console.log('CloudflarePlugin: __webpack_require__ before eval:', typeof __webpack_require__);

            // Execute the wrapped code using eval - THIS IS WHERE THE PROBLEM OCCURS
            eval(wrappedCode)(
              chunk,
              function() {}, // Mock require
              '/', // Mock __dirname
              'test.js' // Mock __filename
            );

            console.log('CloudflarePlugin: Chunk loaded, modules:', Object.keys(chunk.modules || {}));
            callback(null, chunk);
          } catch (error) {
            console.log('CloudflarePlugin: Error loading chunk:', error.message);
            callback(error, null);
          }
        }

        // Simulate Module Federation get method
        globalThis.module = { exports: {} };
        globalThis.module.exports.get = function(moduleName) {
          console.log('ModuleFederation: get called for:', moduleName);

          // Simulate chunk content that contains a factory
          var chunkContent = \`
            // This is the chunk content - it should be evaluated where __webpack_require__ is available
            console.log('Chunk: Executing chunk content...');
            console.log('Chunk: __webpack_require__ available:', typeof __webpack_require__);

            var __webpack_modules__ = {
              'factory_for_360': function() {
                console.log('Factory: Executing, __webpack_require__ available:', typeof __webpack_require__);
                return __webpack_require__(360);
              }
            };
          \`;

          return new Promise(function(resolve, reject) {
            loadChunkFromKV(chunkContent, function(error, chunk) {
              if (error) {
                reject(error);
                return;
              }

              console.log('ModuleFederation: Chunk loaded, looking for factory...');
              var factory = chunk.modules && chunk.modules['factory_for_360'];
              if (factory) {
                console.log('ModuleFederation: Found factory, type:', typeof factory);
                resolve(factory);
              } else {
                reject(new Error('Factory not found'));
              }
            });
          });
        };

        console.log('Remote entry simulation complete');
      })();

      // Test the problematic pattern
      globalThis.__testResult = null;
      globalThis.__testError = null;

      (async function testProblem() {
        try {
          console.log('Testing the problematic pattern...');

          var factory = await module.exports.get('./HelloWorld');
          console.log('Got factory:', typeof factory);

          if (typeof factory === 'function') {
            console.log('Attempting to execute factory...');
            var result = factory();
            console.log('Factory result:', result);
            globalThis.__testResult = result;
          } else {
            globalThis.__testError = 'Factory is not a function';
          }
        } catch (error) {
          console.log('Test error:', error.message);
          globalThis.__testError = error.message;
        }
      })();
    `);

    // Execute pending jobs
    for (let i = 0; i < 5; i++) {
      const jobs = arena.executePendingJobs();
      if (jobs > 0) {
        console.log(`Executed ${jobs} jobs in iteration ${i + 1}`);
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Check results
    const testResult = arena.evalCode(`globalThis.__testResult`);
    const testError = arena.evalCode(`globalThis.__testError`);

    console.log('Test 9 result:', testResult);
    console.log('Test 9 error:', testError);

    // Test 10: Test the pattern with separate evalCode calls (like arena test)
    console.log('\n=== Test 10: Separate evalCode calls (arena test pattern) ===');

    // First evalCode: Set up the simulation
    arena.evalCode(`
      // Simulate the remote entry creating __webpack_require__ in a closure
      (function remoteEntrySimulation() {
        var moduleCache = {};

        function __webpack_require__(moduleId) {
          if (moduleCache[moduleId]) {
            return moduleCache[moduleId].exports;
          }

          var module = moduleCache[moduleId] = { exports: {} };

          if (moduleId === 360) {
            module.exports.helloWorld = function(options) {
              var name = (options && options.name) || 'World';
              return 'Hello from separate eval, ' + name + '!';
            };
            module.exports.default = module.exports.helloWorld;
          }

          return module.exports;
        }

        console.log('Separate test: __webpack_require__ created, type:', typeof __webpack_require__);

        // Store a factory in global scope
        globalThis.__separateTestFactory = function() {
          console.log('Separate factory: __webpack_require__ available:', typeof __webpack_require__);
          return __webpack_require__(360);
        };

        console.log('Separate test: Factory stored globally');
      })();
    `);

    // Second evalCode: Try to execute the factory (simulating arena test pattern)
    arena.evalCode(`
      globalThis.__separateTestResult = null;
      globalThis.__separateTestError = null;

      try {
        console.log('Separate test: Attempting to execute factory from different evalCode...');
        console.log('Separate test: __webpack_require__ available here:', typeof __webpack_require__);
        console.log('Separate test: Factory type:', typeof globalThis.__separateTestFactory);

        if (typeof globalThis.__separateTestFactory === 'function') {
          var result = globalThis.__separateTestFactory();
          console.log('Separate test: Factory executed, result:', result);
          globalThis.__separateTestResult = result;
        } else {
          globalThis.__separateTestError = 'Factory not found';
        }
      } catch (error) {
        console.log('Separate test: Error executing factory:', error.message);
        globalThis.__separateTestError = error.message;
      }
    `);

    const separateResult = arena.evalCode(`globalThis.__separateTestResult`);
    const separateError = arena.evalCode(`globalThis.__separateTestError`);

    console.log('Test 10 result:', separateResult);
    console.log('Test 10 error:', separateError);

    console.log('\n✅ All scoping tests completed');

  } catch (error) {
    console.log('❌ Scoping test failed:', error);
  } finally {
    arena.dispose();
    console.log('✨ Scoping test completed & VM disposed');
  }
})();
