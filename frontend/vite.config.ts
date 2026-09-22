import babelPlugin from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babelPlugin({
      presets: [reactCompilerPreset()],
    }),
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
  },
});
