/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fafa',
          100: '#ccedee',
          200: '#9adcde',
          300: '#5fc4c7',
          400: '#2fa8ac',
          500: '#01696f',
          600: '#0c4e54',
          700: '#0f3638',
          800: '#0a2426',
          900: '#051314',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
