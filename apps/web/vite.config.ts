import babelPlugin from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';

export default defineConfig({
  plugins: [
    react(),
    babelPlugin({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
    devtools(),
  ],
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
  server: {
    host: true,
    strictPort: true,
    proxy: {
      '/work-items': 'http://localhost:3000',
      '/ai-config': 'http://localhost:3000',
      '/reference': 'http://localhost:3000',
      '/reference-json': 'http://localhost:3000',
    },
  },
});