import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getAutoVersion } from './scripts/version.mjs';

const appVersion = getAutoVersion();

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('generatedCatalog.json')) {
            return 'catalog';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
