import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const keyPath = 'E:/laragon/etc/ssl/laragon.key';
const certPath = 'E:/laragon/etc/ssl/laragon.crt';
const httpsConfig = fs.existsSync(keyPath) && fs.existsSync(certPath)
  ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
  : undefined;

export default defineConfig({
  base: '/admin-panel/',
  server: {
    port: 5174,
    host: '0.0.0.0',
    https: httpsConfig,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    outDir: '../public/admin-panel',
    emptyOutDir: true,
  },
});
