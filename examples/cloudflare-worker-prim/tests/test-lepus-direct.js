#!/usr/bin/env node
/* eslint-disable */
import { createLEPUSModule } from '@jitl/primjs-emscripten';

async function testLEPUSDirect() {
    console.log('🚀 Testing Direct LEPUS/PrimJS API');
    
    try {
        // Initialize LEPUS module
        const lepus = await createLEPUSModule();
        
        console.log('✅ LEPUS module created');
        console.log('🔍 Testing evalCode...');
        
        // Test simple evaluation
        const result1 = lepus.evalCode('2 + 2');
        console.log('✅ Simple math: 2 + 2 =', result1);
        
        // Test function creation
        const result2 = lepus.evalCode(`
            function greet(name) {
                return 'Hello, ' + name + '!';
            }
            greet('LEPUS')
        `);
        console.log('✅ Function execution:', result2);
        
        // Test object creation
        const result3 = lepus.evalCode(`
            const obj = {
                name: 'PrimJS',
                version: '2.11.1',
                features: ['GC', 'Performance', 'Chrome DevTools']
            };
            JSON.stringify(obj)
        `);
        console.log('✅ Object creation:', result3);
        
        // Test error handling
        try {
            lepus.evalCode('throw new Error("Test error")');
        } catch (error) {
            console.log('✅ Error handling works:', error.message);
        }
        
        // Test GC mode
        console.log('✅ Is GC mode:', lepus.isGCMode());
        
        // Run garbage collection
        lepus.runGC();
        console.log('✅ Garbage collection executed');
        
        // Cleanup
        lepus.dispose();
        console.log('✅ LEPUS module disposed');
        
        console.log('\n🎉 LEPUS Direct API Test PASSED!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test
testLEPUSDirect().catch(console.error);