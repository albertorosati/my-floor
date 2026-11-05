import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' garantisce il funzionamento immediato su qualsiasi repository GitHub Pages
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
