import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const keyPath = 'E:/laragon/etc/ssl/laragon.key';
const certPath = 'E:/laragon/etc/ssl/laragon.crt';
const httpsConfig =
    fs.existsSync(keyPath) && fs.existsSync(certPath)
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
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return undefined;
                    if (id.includes('/react/') || id.includes('/react-dom/')) return 'react';
                    if (id.includes('/react-router-dom/')) return 'router';
                    if (id.includes('/lucide-react/')) return 'icons';
                    if (id.includes('/zustand/')) return 'state';
                    if (id.includes('/react-hook-form/')) return 'forms';
                    if (id.includes('/react-hot-toast/')) return 'notifications';
                    return undefined;
                },
            },
        },
    },
});
