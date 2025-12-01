/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        earth: {
          50: '#faf8f5',
          100: '#f4f0e8',
          200: '#e8ddc9',
          300: '#d8c4a0',
          400: '#c7a876',
          500: '#b88f58',
          600: '#a47a4d',
          700: '#886341',
          800: '#6f5239',
          900: '#5c4430',
        },
        sage: {
          50: '#f6f7f4',
          100: '#e8ebe3',
          200: '#d3d9c9',
          300: '#b5c0a5',
          400: '#96a582',
          500: '#7a8b67',
          600: '#5f6f51',
          700: '#4c5941',
          800: '#3f4937',
          900: '#363e30',
        },
        warm: {
          50: '#faf9f7',
          100: '#f5f3f0',
          200: '#e9e5df',
          300: '#d7d0c5',
          400: '#c1b7a8',
          500: '#a89b8a',
          600: '#8d7f6f',
          700: '#73675b',
          800: '#5f564d',
          900: '#504941',
        },
      },
    },
  },
  plugins: [],
};
