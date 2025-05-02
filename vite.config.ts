import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer'; // ✅ Ubah require menjadi import

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
    alias: {
      '@': '/resources/js',
      'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
    },
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
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor dependencies into separate chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-components': [
            '@/components/ui/button',
            '@/components/ui/card',
            '@/components/ui/input',
            '@/components/ui/avatar',
            '@/components/ui/select',
            '@/components/ui/dropdown-menu',
            '@/components/ui/tooltip',
            '@/components/ui/badge',
          ],
          // Chart.js is pretty heavy, so split it
          'chart': ['chart.js', 'react-chartjs-2'],
          // Common utilities
          'utils': ['@/lib/utils', '@/hooks'],
        },
      },
    },
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
    ],
  },
});