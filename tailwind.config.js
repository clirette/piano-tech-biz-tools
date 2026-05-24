/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#b9cdff',
          300: '#85a9ff',
          400: '#4d7fff',
          500: '#1a56f5',
          600: '#0d3ed6',
          700: '#0c30ae',
          800: '#0f2a8a',
          900: '#112470',
        },
      },
    },
  },
  plugins: [],
}

