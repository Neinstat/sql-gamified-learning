import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // PGlite ships its own WebAssembly files; Vite must not pre-bundle it.
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  },
  // The database runs in a module Web Worker (src/app/db.worker.ts).
  worker: {
    format: 'es',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
    // Most test files build their own PGlite database in beforeAll. They run in parallel, and on a
    // busy machine (e.g. with the 3D game open) that can take longer than the default 10 s.
    hookTimeout: 60_000,
  },
});
