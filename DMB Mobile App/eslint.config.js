import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['.expo', 'android', 'dist', 'node_modules'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'unused-imports': unusedImports,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            ...react.configs.flat.recommended.rules,
            ...react.configs.flat['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/static-components': 'off',
            'react/display-name': 'off',
            'react/no-unescaped-entities': 'off',
        },
    },
    prettier,
);
