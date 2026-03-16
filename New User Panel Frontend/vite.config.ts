import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Use Laragon SSL certs for local HTTPS (fall back to no HTTPS if not found)
  const keyPath = 'E:/laragon/etc/ssl/laragon.key';
  const certPath = 'E:/laragon/etc/ssl/laragon.crt';
  const httpsConfig = fs.existsSync(keyPath) && fs.existsSync(certPath)
    ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
    : undefined;

  return {
    base: env.VITE_BASE_PATH || '/',
    server: {
      port: 5173,
      host: '0.0.0.0',
      https: httpsConfig,
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            motion: ['framer-motion'],
            icons: ['lucide-react'],
            realtime: ['laravel-echo', 'pusher-js'],
            i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector']
          }
        }
      }
    }
  };
});
