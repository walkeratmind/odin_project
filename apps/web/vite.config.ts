import babelPlugin from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';

// in dev-in-docker the api is a compose service, not localhost
const API_PROXY_TARGET = process.env.API_PROXY_TARGET?.trim() || 'http://localhost:3000';

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
      '/work-items': API_PROXY_TARGET,
      '/ai-config': API_PROXY_TARGET,
      '/admin': API_PROXY_TARGET,
      '/reference': API_PROXY_TARGET,
      '/reference-json': API_PROXY_TARGET,
    },
  },
});