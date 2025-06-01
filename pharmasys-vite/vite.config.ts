import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [
    laravel({
      input: 'resources/js/app.tsx',
      ssr: 'resources/js/ssr.tsx',
      refresh: true,
    }),
    react(),
  ],
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, 'resources/js') },
      { find: 'ziggy-js', replacement: resolve(__dirname, 'vendor/tightenco/ziggy') },
    ],
  },

  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(), // ✅ Sudah aman digunakan dengan import
      ],
    },
  },
  build: {
    // Optimize chunks
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Optimize CSS
    cssMinify: true,
    // Source maps only in development
    sourcemap: process.env.NODE_ENV === 'development',
  },
  server: {
    hmr: {
      overlay: false,
    },
    watch: {
      usePolling: false,
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-chartjs-2',
      'chart.js',
      'lucide-react',
      'resources/js/hooks/useKeyboardShortcut',
    ],
  },
});