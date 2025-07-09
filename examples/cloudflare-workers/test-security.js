/**
 * Test security constraints for QuickJS execution
 * This script tests the memory limits, stack limits, and interrupt handlers
 */

import { newQuickJSWASMModule, RELEASE_SYNC as baseVariant, newVariant } from 'quickjs-emscripten';
import { setupArena } from './src/utils/arenaUtils.js';
import fs from 'fs';

// Use same WASM variant as production
const wasmBuffer = fs.readFileSync('./src/RELEASE_SYNC.wasm');
const cloudflareVariant = newVariant(baseVariant, {
    wasmModule: wasmBuffer,
});

async function testSecurityConstraints() {
    console.log('🔒 Testing QuickJS Security Constraints\n');
    
    const QuickJS = await newQuickJSWASMModule(cloudflareVariant);
    
    // Test 1: Infinite loop detection
    console.log('Test 1: Infinite Loop Protection');
    try {
        const { arena, logs, dispose } = setupArena(QuickJS, {
            enableFetch: false,
            enableKv: false,
            maxInterruptCycles: 1000 // Lower limit for testing
        });
        
        const result = arena.evalCode('while(true) { console.log("infinite loop"); }');
        console.log('❌ Infinite loop was NOT terminated');
        dispose();
    } catch (error) {
        console.log('✅ Infinite loop terminated:', error.message);
    }
    
    // Test 2: Memory limit protection
    console.log('\nTest 2: Memory Limit Protection');
    try {
        const { arena, logs, dispose } = setupArena(QuickJS, {
            enableFetch: false,
            enableKv: false,
            memoryLimitBytes: 1024 * 100 // Very small limit for testing
        });
        
        const result = arena.evalCode(`
            let bigArray = [];
            for(let i = 0; i < 100000; i++) {
                bigArray.push("x".repeat(1000));
            }
            bigArray.length;
        `);
        console.log('❌ Memory limit was NOT enforced');
        dispose();
    } catch (error) {
        console.log('✅ Memory limit enforced:', error.message);
    }
    
    // Test 3: Stack limit protection
    console.log('\nTest 3: Stack Limit Protection');
    try {
        const { arena, logs, dispose } = setupArena(QuickJS, {
            enableFetch: false,
            enableKv: false,
            stackLimitBytes: 1024 * 10 // Very small stack for testing
        });
        
        const result = arena.evalCode(`
            function recursiveFunction(n) {
                if (n > 0) {
                    return recursiveFunction(n - 1) + n;
                }
                return 0;
            }
            recursiveFunction(10000);
        `);
        console.log('❌ Stack limit was NOT enforced');
        dispose();
    } catch (error) {
        console.log('✅ Stack limit enforced:', error.message);
    }
    
    // Test 4: Normal code execution (should work)
    console.log('\nTest 4: Normal Code Execution');
    try {
        const { arena, logs, dispose } = setupArena(QuickJS, {
            enableFetch: false,
            enableKv: false
        });
        
        const result = arena.evalCode(`
            let sum = 0;
            for(let i = 1; i <= 100; i++) {
                sum += i;
            }
            sum;
        `);
        console.log('✅ Normal code executed successfully. Result:', result);
        dispose();
    } catch (error) {
        console.log('❌ Normal code failed:', error.message);
    }
    
    console.log('\n🎯 Security constraint testing completed');
}

testSecurityConstraints().catch(console.error);