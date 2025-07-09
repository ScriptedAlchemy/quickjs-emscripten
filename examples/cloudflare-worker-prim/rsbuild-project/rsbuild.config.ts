import { defineConfig } from '@rsbuild/core';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';

export default defineConfig({
  dev:{
    writeToDisk: true
  },

  tools: {
    rspack: {
      resolve: {
        conditionNames: [
          'workerd',
          'worker',
          'browser',
          'import',
          'require'
        ]
      },
      plugins: [
        new ModuleFederationPlugin({
          name: 'cloudflare_worker_host',
          filename: 'remoteEntry.js',
          exposes: {
            './HelloWorld': './src/components/HelloWorld.ts',
            './DataProcessor': './src/components/DataProcessor.ts',
            './ApiUtils': './src/components/ApiUtils.ts',
            './WorkerUtils': './src/components/WorkerUtils.ts',
            './AdvancedExamples': './src/components/AdvancedExamples.ts',
            './FetchUtils': './src/components/FetchUtils.ts',
          },
          shared: {},
          library: { type: 'commonjs2' },
          runtimePlugins: ['./src/cloudflare-runtime-plugin.ts'],
        }),
      ],
      output: {
        module: false,
        library: { type: 'commonjs2' },
        chunkFormat: 'commonjs',
        chunkLoading: 'async-node',
      },
      target: 'async-node',
    },
  },
  output: {
    target: 'node',
  },
  server: {
    port: 3001,
  },
});
