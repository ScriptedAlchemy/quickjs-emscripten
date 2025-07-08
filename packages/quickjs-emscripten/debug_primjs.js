import { newQuickJSAsyncWASMModule, PRIMJS_RELEASE_ASYNC } from './src/index.js';

async function test() {
  console.log('Loading PrimJS...');
  const mod = await newQuickJSAsyncWASMModule(PRIMJS_RELEASE_ASYNC);
  console.log('Creating context...');
  const ctx = mod.newContext();
  
  try {
    console.log('Creating bigint...');
    const int = 2n ** 64n;
    console.log('Calling newBigInt...');
    const numHandle = ctx.newBigInt(int);
    console.log('Getting bigint value...');
    const result = ctx.getBigInt(numHandle);
    console.log('Result:', result);
    console.log('Disposing handle...');
    numHandle.dispose();
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    console.error(error.stack);
  } finally {
    ctx.dispose();
    mod.dispose();
  }
}

test().catch(console.error);