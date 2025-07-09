#!/usr/bin/env node
/* eslint-disable */
import { createLEPUSModule } from '@jitl/primjs-emscripten';
import { handleCodeExecution } from './src/codeExecutionHandlerLepus.js';

async function testLEPUSHandlers() {
    console.log('🚀 Testing LEPUS Handlers');
    
    try {
        // Initialize LEPUS module
        const LEPUS = await createLEPUSModule();
        console.log('✅ LEPUS module created');
        
        // Test 1: Basic code execution
        console.log('\n🔍 Test 1: Basic code execution');
        const mockRequest1 = {
            json: async () => ({ code: '2 + 2' })
        };
        const context1 = {
            request: mockRequest1,
            LEPUS,
            corsHeaders: { 'Access-Control-Allow-Origin': '*' }
        };
        
        const response1 = await handleCodeExecution(context1);
        const result1 = await response1.json();
        
        if (result1.success && result1.result === 4) {
            console.log('✅ Basic code execution works:', result1);
        } else {
            throw new Error('Basic code execution failed');
        }
        
        // Test 2: Function execution
        console.log('\n🔍 Test 2: Function execution');
        const mockRequest2 = {
            json: async () => ({ 
                code: `
                    function greet(name) {
                        return 'Hello, ' + name + ' from LEPUS!';
                    }
                    greet('PrimJS')
                ` 
            })
        };
        const context2 = {
            request: mockRequest2,
            LEPUS,
            corsHeaders: { 'Access-Control-Allow-Origin': '*' }
        };
        
        const response2 = await handleCodeExecution(context2);
        const result2 = await response2.json();
        
        if (result2.success && result2.result === 'Hello, PrimJS from LEPUS!') {
            console.log('✅ Function execution works:', result2);
        } else {
            throw new Error('Function execution failed');
        }
        
        // Test 3: Error handling
        console.log('\n🔍 Test 3: Error handling');
        const mockRequest3 = {
            json: async () => ({ code: 'throw new Error("Test error")' })
        };
        const context3 = {
            request: mockRequest3,
            LEPUS,
            corsHeaders: { 'Access-Control-Allow-Origin': '*' }
        };
        
        const response3 = await handleCodeExecution(context3);
        const result3 = await response3.json();
        
        if (!result3.success && result3.error) {
            console.log('✅ Error handling works:', result3);
        } else {
            throw new Error('Error handling failed');
        }
        
        // Test 4: Invalid code validation
        console.log('\n🔍 Test 4: Code validation');
        const mockRequest4 = {
            json: async () => ({ code: '' })
        };
        const context4 = {
            request: mockRequest4,
            LEPUS,
            corsHeaders: { 'Access-Control-Allow-Origin': '*' }
        };
        
        const response4 = await handleCodeExecution(context4);
        const result4 = await response4.json();
        
        if (response4.status === 400 && result4.error) {
            console.log('✅ Code validation works:', result4);
        } else {
            throw new Error('Code validation failed');
        }
        
        // Test 5: GC mode check
        console.log('\n🔍 Test 5: GC mode check');
        if (LEPUS.isGCMode()) {
            console.log('✅ GC mode is enabled');
            LEPUS.runGC();
            console.log('✅ Garbage collection executed');
        }
        
        // Cleanup
        LEPUS.dispose();
        console.log('✅ LEPUS module disposed');
        
        console.log('\n🎉 All LEPUS Handler Tests PASSED!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the tests
testLEPUSHandlers().catch(console.error);