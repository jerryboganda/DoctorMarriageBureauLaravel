import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [react()],
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        },
        resolve: {
            alias: [
                { find: '@', replacement: path.resolve(__dirname, '.') },
                {
                    find: /^react-native$/,
                    replacement: path.resolve(__dirname, 'src/web/react-native-web-shim.ts'),
                },
                {
                    find: 'react-native/Libraries/Utilities/codegenNativeComponent',
                    replacement: path.resolve(__dirname, 'src/web/codegenNativeComponent.tsx'),
                },
                {
                    find: 'react-native/Libraries/Utilities/codegenNativeCommands',
                    replacement: path.resolve(__dirname, 'src/web/codegenNativeCommands.ts'),
                },
                {
                    find: 'react-native/Libraries/Image/resolveAssetSource',
                    replacement: path.resolve(__dirname, 'src/web/resolveAssetSource.ts'),
                },
                {
                    find: 'nativewind/dist/doctor',
                    replacement: path.resolve(__dirname, 'src/web/nativewind-doctor-stub.ts'),
                },
                {
                    find: 'react-native-css-interop/dist/doctor',
                    replacement: path.resolve(__dirname, 'src/web/nativewind-doctor-stub.ts'),
                },
                {
                    find: /^nativewind$/,
                    replacement: path.resolve(__dirname, 'src/web/nativewind-doctor-stub.ts'),
                },
                {
                    find: /^react-native-css-interop$/,
                    replacement: path.resolve(__dirname, 'src/web/nativewind-doctor-stub.ts'),
                },
                {
                    find: 'expo-linear-gradient',
                    replacement: path.resolve(__dirname, 'src/web/expo-linear-gradient.tsx'),
                },
                {
                    find: '@shopify/react-native-skia',
                    replacement: path.resolve(__dirname, 'src/web/skia-stub.tsx'),
                },
            ],
        },
    };
});
