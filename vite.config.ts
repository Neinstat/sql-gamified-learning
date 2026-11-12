import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // PGlite ships its own WebAssembly files; Vite must not pre-bundle it.
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
