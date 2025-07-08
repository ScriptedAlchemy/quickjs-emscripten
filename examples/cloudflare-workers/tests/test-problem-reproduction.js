/* eslint-disable */
/* eslint-env node */
// Test to reproduce the exact problem with Module Federation factories and __webpack_require__

import { newQuickJSWASMModule, RELEASE_SYNC } from 'quickjs-emscripten';
import { Arena } from 'quickjs-emscripten-sync';

(async () => {
  console.log('🔥 Reproducing the Module Federation __webpack_require__ problem');

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
    // First evalCode: Simulate remote entry creating __webpack_require__ in deep closure
    console.log('\n=== PROBLEM REPRODUCTION ===');
    arena.evalCode(`
      // Simulate the remote entry IIFE pattern that creates __webpack_require__ in deep closure
      (function() {
        // This simulates the remote entry's deeply nested closure
        (function(modules) {
          var installedModules = {};

          function __webpack_require__(moduleId) {
            if (installedModules[moduleId]) {
              return installedModules[moduleId].exports;
            }

            var module = installedModules[moduleId] = { exports: {} };

            // Execute the module
            if (modules[moduleId]) {
              modules[moduleId](module, module.exports, __webpack_require__);
            }

            return module.exports;
          }

          __webpack_require__.m = modules;

          console.log('Remote entry: __webpack_require__ created in deep closure, type:', typeof __webpack_require__);

          // Simulate Module Federation creating factory functions
          // This factory needs access to __webpack_require__ but will be called later
          var factory = function() {
            console.log('Factory executing: __webpack_require__ type:', typeof __webpack_require__);
            return __webpack_require__(360);
          };

          // Store the factory globally so it can be accessed later
          globalThis.__problematicFactory = factory;

          console.log('Factory stored globally, but __webpack_require__ will not be available when called later');
        })({
          360: function(module, exports, __webpack_require__) {
            exports.helloWorld = function(name) {
              return 'Hello from deep closure, ' + name + '!';
            };
            exports.default = exports.helloWorld;
          }
        });
      })();

      console.log('Remote entry simulation complete');
      console.log('__webpack_require__ available in global scope:', typeof __webpack_require__);
      console.log('Factory available:', typeof globalThis.__problematicFactory);
    `);

    // Second evalCode: Try to execute the factory (this simulates the arena test problem)
    console.log('\n=== EXECUTING FACTORY LATER (PROBLEM) ===');
    arena.evalCode(`
      try {
        console.log('Attempting to execute factory in different evaluation context...');
        console.log('__webpack_require__ available here:', typeof __webpack_require__);
        console.log('Factory type:', typeof globalThis.__problematicFactory);

        if (typeof globalThis.__problematicFactory === 'function') {
          var result = globalThis.__problematicFactory();
          console.log('Factory execution result:', result);
          globalThis.__testResult = result;
        } else {
          globalThis.__testError = 'Factory not available';
        }
      } catch (error) {
        console.log('Factory execution error:', error.message);
        globalThis.__testError = error.message;
      }
    `);

    const testResult = arena.evalCode(`globalThis.__testResult`);
    const testError = arena.evalCode(`globalThis.__testError`);

    console.log('\n=== PROBLEM RESULT ===');
    console.log('Test result:', testResult);
    console.log('Test error:', testError);

    if (testError) {
      console.log('❌ PROBLEM CONFIRMED: Factory cannot access __webpack_require__ from deep closure');
    } else {
      console.log('✅ No problem detected (unexpected)');
    }

    // Show the working solution for comparison
    console.log('\n=== WORKING SOLUTION (for reference) ===');
    arena.evalCode(`
      // Working solution: execute factory in the same evaluation context
      (function() {
        (function(modules) {
          var installedModules = {};

          function __webpack_require__(moduleId) {
            if (installedModules[moduleId]) {
              return installedModules[moduleId].exports;
            }

            var module = installedModules[moduleId] = { exports: {} };

            if (modules[moduleId]) {
              modules[moduleId](module, module.exports, __webpack_require__);
            }

            return module.exports;
          }

          __webpack_require__.m = modules;

          // Create and IMMEDIATELY execute the factory in same context
          var factory = function() {
            console.log('Working factory: __webpack_require__ type:', typeof __webpack_require__);
            return __webpack_require__(360);
          };

          // Execute immediately while __webpack_require__ is in scope
          var workingResult = factory();
          console.log('Working solution result:', workingResult);
          globalThis.__workingResult = workingResult;

        })({
          360: function(module, exports, __webpack_require__) {
            exports.helloWorld = function(name) {
              return 'Hello from working solution, ' + name + '!';
            };
            exports.default = exports.helloWorld;
          }
        });
      })();
    `);

    const workingResult = arena.evalCode(`globalThis.__workingResult`);
    console.log('Working result:', workingResult);

    if (workingResult && workingResult.helloWorld) {
      const greeting = workingResult.helloWorld('Test');
      console.log('Working greeting:', greeting);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    arena.dispose();
    console.log('\n✨ Problem reproduction test completed');
  }
})();
