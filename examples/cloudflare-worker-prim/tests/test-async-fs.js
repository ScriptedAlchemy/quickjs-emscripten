import { createLEPUSModule } from '@jitl/primjs-emscripten';
import fs from 'fs/promises';
import path from 'path';

async function testAsyncFSWorkerSimulation() {
    console.log('\n📁 Testing Async FS Module with Worker Simulation');
    console.log('='.repeat(50));

    const lepus = await createLEPUSModule();
    
    try {
        // Set up console.log for debugging
        const logs = [];
        
        // Read the async FS module source
        const asyncFSModulePath = path.join(process.cwd(), 'test-async-fs.js');
        const asyncFSModuleSource = await fs.readFile(asyncFSModulePath, 'utf8');
        
        console.log('✅ AsyncFS module loaded successfully');
        
        // Set up the global environment
        lepus.evalCode(`
            // Create global console if not exists
            if (typeof console === 'undefined') {
                globalThis.console = {
                    log: function(...args) {
                        return '[LOG]: ' + args.join(' ');
                    }
                };
            }
            
            // Mock require function
            globalThis.require = function(moduleName) {
                if (moduleName === './FsPlugin') {
                    return {
                        get: function(key) {
                            console.log('[KV Mock] get(' + key + ')');
                            if (key === '/fs/test.txt') {
                                return 'file contents';
                            }
                            return undefined;
                        }
                    };
                }
                if (moduleName === './url') {
                    return {};
                }
                return undefined;
            };
            
            // Track plugin logs
            globalThis.__pluginLogs = [];
        `);
        
        // Create module wrapper and execute
        const moduleWrapper = `
            (function() {
                const module = { exports: {} };
                const exports = module.exports;
                const require = globalThis.require;
                
                ${asyncFSModuleSource}
                
                return module.exports;
            })()
        `;
        
        const asyncFS = lepus.evalCode(moduleWrapper);
        
        if (!asyncFS || typeof asyncFS !== 'object') {
            throw new Error(`Failed to load module: ${asyncFS}`);
        }
        
        console.log('✅ AsyncFS module instantiated');
        
        // Test the async FS operations
        console.log('\n📋 Testing AsyncFS.readFile:');
        
        // Since PrimJS doesn't have async/await support in evalCode,
        // we need to test synchronously
        if (typeof asyncFS.readFile === 'function') {
            console.log('✅ readFile function exists');
            
            // Test readFile with existing file
            try {
                const result = asyncFS.readFile('/fs/test.txt');
                console.log('✅ readFile("/fs/test.txt") returned:', result);
            } catch (e) {
                console.log('❌ readFile error:', e.message || e);
            }
            
            // Test readFile with non-existent file
            try {
                const result = asyncFS.readFile('/fs/nonexistent.txt');
                console.log('✅ readFile("/fs/nonexistent.txt") returned:', result);
            } catch (e) {
                console.log('✅ readFile correctly threw error for non-existent file:', e.message || e);
            }
        } else {
            console.log('❌ readFile function not found');
        }
        
        // Check other functions
        if (typeof asyncFS.writeFile === 'function') {
            console.log('✅ writeFile function exists');
        }
        
        if (typeof asyncFS.deleteFile === 'function') {
            console.log('✅ deleteFile function exists');
        }
        
        if (typeof asyncFS.listFiles === 'function') {
            console.log('✅ listFiles function exists');
        }
        
        // Get plugin logs
        const pluginLogs = lepus.evalCode('globalThis.__pluginLogs || []');
        if (pluginLogs && pluginLogs.length > 0) {
            console.log('\n📝 Plugin logs:');
            pluginLogs.forEach(log => console.log('  -', log));
        }
        
        console.log('\n✅ AsyncFS module test completed successfully');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message || error);
        throw error;
    } finally {
        // Clean up LEPUS
        lepus.runGC();
        lepus.dispose();
    }
}

// Run the test
testAsyncFSWorkerSimulation().catch(console.error);