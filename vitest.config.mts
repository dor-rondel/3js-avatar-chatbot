import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const fileUrl = fileURLToPath(import.meta.url);
const dirName = dirname(fileUrl);

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(dirName, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
