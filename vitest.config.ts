import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    globals: true,
    isolate: true,
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*'],
      exclude: [
        'src/types/**/*',
        'src/**/*.d.ts',
        'src/app/layout.tsx',
        'src/app/providers.tsx',
        'src/app/globals.css',
        'src/app/(dashboard)/layout.tsx',
        'src/app/(dashboard)/page.tsx',
        'src/middleware.ts',
      ],
    },
  },
});
