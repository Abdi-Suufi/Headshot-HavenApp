import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // three.js alone is ~550 kB minified; it lives in its own lazily-loaded chunk.
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'node',
  },
});
