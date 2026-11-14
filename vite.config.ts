import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // PGlite ships its own WebAssembly files; Vite must not pre-bundle it.
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  },
  // The café database runs in a module Web Worker (src/app/db.worker.ts).
  worker: {
    format: 'es',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
