#!/usr/bin/env node

/**
 * Test script for LEPUS/PrimJS module federation handlers
 */

const BASE_URL = 'http://localhost:8787';

async function testEndpoint(name, method, path, body = null) {
    console.log(`\n=== Testing ${name} ===`);
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${BASE_URL}${path}`, options);
        const data = await response.json();
        
        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        return { success: response.ok, data };
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('Starting LEPUS/PrimJS Module Federation Tests...\n');
    
    // Test 1: Federation Demo
    await testEndpoint('Federation Demo', 'GET', '/federation-demo');
    
    // Test 2: Execute Module - HelloWorld.greet
    await testEndpoint('Execute Module - HelloWorld.greet', 'POST', '/execute-module', {
        module: 'HelloWorld',
        function: 'greet',
        params: { name: 'LEPUS' }
    });
    
    // Test 3: Execute Module - DataProcessor.processData
    await testEndpoint('Execute Module - DataProcessor.processData', 'POST', '/execute-module', {
        module: 'DataProcessor',
        function: 'processData',
        params: {
            data: [1, 2, 3, 4, 5],
            operation: 'sum'
        }
    });
    
    // Test 4: Execute Code
    await testEndpoint('Execute Code', 'POST', '/code', {
        code: `
            const result = { 
                engine: 'LEPUS/PrimJS',
                calculation: 10 + 20,
                features: ['GC', 'Native Performance']
            };
            JSON.stringify(result);
        `
    });
    
    // Test 5: Assets endpoint
    await testEndpoint('Remote Entry Asset', 'GET', '/remoteEntry.js');
    
    console.log('\n=== Tests Complete ===');
}

// Run tests
runTests().catch(console.error);