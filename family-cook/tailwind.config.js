/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        warm: {
          50: '#faf7f2',
          100: '#f5f0e8',
          200: '#ede3d4',
          300: '#e0cfb8',
          400: '#c4a882',
          500: '#a8886e',
          600: '#7a5c44',
          700: '#5c4433',
          800: '#3d2c1e',
          900: '#2a1e14',
        },
        accent: {
          light: '#f5e8de',
          DEFAULT: '#c4744a',
          dark: '#b5623a',
        },
      },
    },
  },
  plugins: [],
};
