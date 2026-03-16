import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { analyzer } from 'vite-bundle-analyzer';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
