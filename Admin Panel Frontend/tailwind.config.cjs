/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './index.tsx', './App.tsx', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0e7a6f',
        'primary-hover': '#0b635a',
        'admin-bg': '#f2f6f7',
        'admin-surface': '#ffffff',
        'admin-sidebar': '#133235',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Arabic', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
