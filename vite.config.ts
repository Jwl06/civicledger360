import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';

export default defineConfig({
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    Buffer: ['buffer', 'Buffer'],
  },
  plugins: [
    react(),
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
