import { defineConfig } from 'vite';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';

export default defineConfig({
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
  define: {
    global: {},
    'process.env': {},
  },
  plugins: [
    rollupNodePolyFill(),
  ],
  build: {
    rollupOptions: {
      plugins: [
        rollupNodePolyFill(),
      ],
    },
  },
});
