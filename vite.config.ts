import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths so the build works from any sub-path on a static host.
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      // The conjugation viewer and the conjugation practice page.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        practice: fileURLToPath(new URL('./practice.html', import.meta.url)),
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
