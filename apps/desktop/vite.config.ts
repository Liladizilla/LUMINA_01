import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: __dirname,
  build: {
    outDir: '../../dist/desktop',
    emptyOutDir: false
  },
  server: {
    port: 1420,
    strictPort: true
  }
});

