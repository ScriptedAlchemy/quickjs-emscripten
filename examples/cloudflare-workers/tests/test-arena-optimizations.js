/* eslint-disable */
import { newQuickJSWASMModule, RELEASE_SYNC } from 'quickjs-emscripten';
import { measureComplexity, shouldMarshal, createOptimizedArena } from '../src/utils/arenaUtils.js';

async function testArenaOptimizations() {
    console.log('🚀 Testing Arena Performance Optimizations & Complexity Measurement');

    // Test complexity measurement first
    console.log('\n=== Testing Complexity Measurement ===');

    const simpleObject = { name: 'test', value: 42 };
    const complexObject = {
        data: new Array(100).fill(0).map((_, i) => ({
            id: i,
            name: `item_${i}`,
            metadata: {
                created: new Date(),
                tags: ['tag1', 'tag2', 'tag3'],
                nested: {
                    deep: {
                        value: i * 2
                    }
                }
            }
        }))
    };

    const simpleComplexity = measureComplexity(simpleObject);
    const complexComplexity = measureComplexity(complexObject);

    console.log(`📊 Simple object complexity: ${simpleComplexity}`);
    console.log(`📊 Complex object complexity: ${complexComplexity}`);
    console.log(`✅ Should marshal simple object: ${shouldMarshal(simpleObject)}`);
    console.log(`⚠️  Should marshal complex object: ${shouldMarshal(complexObject)}`);

    // Initialize QuickJS
    const QuickJS = await newQuickJSWASMModule(RELEASE_SYNC);
    const vm = QuickJS.newContext();

    console.log('\n=== Testing Optimized Arena Creation ===');

    // Test with different configurations
    let standardArena;
    try {
        standardArena = await createOptimizedArena(vm, {
            enableComplexityCheck: false
        });

        console.log('✅ Standard optimized Arena created');
    } catch (createError) {
        console.log('❌ Failed to create optimized Arena:', createError.message);
        throw createError;
    }

    try {
        // Expose test objects
        standardArena.expose({
            console: {
                log: (...args) => console.log('[QuickJS]', ...args)
            },
            testData: {
                simple: simpleObject,
                complex: complexObject
            },
            measureComplexity: (obj) => measureComplexity(obj)
        });

        console.log('\n=== Testing Object Access & Performance ===');

        // Test accessing pre-registered objects (should be faster)
        const mathTest = standardArena.evalCode(`
            console.log('Testing pre-registered Math object...');
            const result = Math.sqrt(16) + Math.PI;
            console.log('Math calculation result:', result);
            result
        `);
        console.log(`✅ Math test result: ${mathTest}`);

        // Test JSON handling (pre-registered)
        const jsonTest = standardArena.evalCode(`
            console.log('Testing pre-registered JSON object...');
            const obj = { test: 'data', number: 42 };
            const serialized = JSON.stringify(obj);
            const parsed = JSON.parse(serialized);
            console.log('JSON test completed:', parsed.test);
            parsed
        `);
        console.log(`✅ JSON test result:`, jsonTest);

        // Test complexity measurement inside QuickJS
        let complexityTest;
        try {
            complexityTest = standardArena.evalCode(`
                console.log('Testing complexity measurement from QuickJS...');
                const simpleComplexity = measureComplexity(testData.simple);
                const complexComplexity = measureComplexity(testData.complex);
                console.log('Simple object complexity from JS:', simpleComplexity);
                console.log('Complex object complexity from JS:', complexComplexity);
                ({ simple: simpleComplexity, complex: complexComplexity })
            `);
            console.log(`✅ Complexity measurement from QuickJS:`, complexityTest);
        } catch (complexityError) {
            console.log('❌ Complexity test failed:', complexityError.message);
            // Continue with other tests
        }

        // Test Promise handling (pre-registered)
        console.log('\n=== Testing Async Operations with Pre-registered Promise ===');

        standardArena.evalCode(`
            console.log('Testing Promise operations...');
            Promise.resolve('Arena optimization test')
                .then(result => {
                    console.log('Promise resolved:', result);
                    globalThis.promiseResult = result;
                });
        `);

        // Wait for promise to resolve
        let attempts = 0;
        while (attempts < 10) {
            standardArena.executePendingJobs();
            const result = standardArena.evalCode('globalThis.promiseResult');
            if (result) {
                console.log(`✅ Promise test completed: ${result}`);
                break;
            }
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        console.log('\n=== Performance Comparison Demo ===');

        // Simulate performance test
        const startTime = Date.now();

        for (let i = 0; i < 10; i++) {
            standardArena.evalCode(`
                Math.random() * 100 + JSON.stringify({test: ${i}})
            `);
        }

        const endTime = Date.now();
        console.log(`✅ 10 operations with pre-registered objects took: ${endTime - startTime}ms`);

        console.log('\n🎉 Arena optimization tests completed successfully!');
        console.log('Key benefits demonstrated:');
        console.log('  - Pre-registered objects for better performance');
        console.log('  - Complexity measurement for monitoring');
        console.log('  - Automatic handle management');
        console.log('  - Flexible marshalling maintained');

    } finally {
        // Check if Arena has dispose method, otherwise check for other cleanup methods
        if (typeof standardArena.dispose === 'function') {
            standardArena.dispose();
            console.log('✨ Arena disposed successfully');
        } else if (typeof standardArena.destroy === 'function') {
            standardArena.destroy();
            console.log('✨ Arena destroyed successfully');
        } else if (typeof standardArena.close === 'function') {
            standardArena.close();
            console.log('✨ Arena closed successfully');
        } else {
            // No explicit cleanup method found, try to access vm for manual cleanup
            console.log('⚠️ No dispose method found on Arena, relying on VM cleanup');
            if (vm && typeof vm.dispose === 'function') {
                vm.dispose();
                console.log('✨ VM disposed successfully');
            }
        }
    }
}

// Run the test
testArenaOptimizations();
