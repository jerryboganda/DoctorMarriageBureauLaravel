/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF0F5',
          100: '#FFE1EC',
          200: '#FFC2D9',
          300: '#FFA3C6',
          400: '#FF649F',
          500: '#FF206E', // Primary Matrimonial Rose
          600: '#E60B5B',
          700: '#BF0047',
          800: '#990039',
          900: '#73002B',
          950: '#4D001C',
        },
        navy: {
          50: '#F4F4F8',
          100: '#E8E7F0',
          200: '#D1CFE2',
          300: '#B0ADC9',
          400: '#8580A9',
          500: '#615C8C',
          600: '#494473',
          700: '#3A365D',
          800: '#322F56', // Brand Deep Navy
          900: '#1E1B38', // Brand Dark Background
          950: '#110F22',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F4E295',
          dark: '#997D1A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        arabic: ['Amiri', 'Traditional Arabic', 'serif'],
      },
      boxShadow: {
        'glow-brand': '0 0 25px rgba(255, 32, 110, 0.25)',
        'luxury': '0 10px 30px -5px rgba(50, 47, 86, 0.08), 0 0 0 1px rgba(255, 32, 110, 0.06)',
        'luxury-hover': '0 20px 40px -10px rgba(50, 47, 86, 0.15), 0 0 0 1px rgba(255, 32, 110, 0.15)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-luxury': 'linear-gradient(135deg, #FFF0F5 0%, #FFFFFF 50%, #F4F4F8 100%)',
        'gradient-hero': 'linear-gradient(180deg, rgba(30, 27, 56, 0.75) 0%, rgba(17, 15, 34, 0.92) 100%)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        // Mirrors FADE_UP_ITEM + TRANSITION_EASE from src/utils/motion.ts
        fadeIn: 'fadeIn 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) both',
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) both',
      }
    },
  },
  plugins: [],
};
