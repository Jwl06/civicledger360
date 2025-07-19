import { defineConfig } from 'vite';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';

export default defineConfig({
  define: {
    global: {},
    'process.env': {},
  },
  resolve: {
    alias: {
      events: 'events',
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'events', 'util', 'stream-browserify'],
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
  },
});
