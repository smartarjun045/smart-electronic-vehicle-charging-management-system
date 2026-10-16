/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefdf6',
          100: '#d6fbe9',
          400: '#22c58b',
          500: '#0fa870',
          600: '#0a8a5c',
          700: '#096f4b',
          900: '#0a3f2d',
        },
      },
    },
  },
  plugins: [],
};
