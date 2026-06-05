/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './index.html',
        './App.tsx',
        './components/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
        './utils/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#d41173',
                'primary-hover': '#b00e60',
                'background-light': '#f8f6f7',
                'background-dark': '#221019',
            },
            fontFamily: {
                sans: ['Inter', 'Noto Sans Arabic', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
