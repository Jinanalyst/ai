/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Apple Color Emoji', 'Segoe UI Emoji'],
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            color: theme('colors.slate.900'),
            a: {
              color: theme('colors.blue.600'),
              textDecoration: 'none',
              fontWeight: '600',
            },
            'a:hover': { textDecoration: 'underline' },
            code: {
              color: theme('colors.slate.900'),
              backgroundColor: theme('colors.slate.100'),
              paddingLeft: '0.35em',
              paddingRight: '0.35em',
              paddingTop: '0.15em',
              paddingBottom: '0.15em',
              borderRadius: '0.5em',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
          },
        },
        invert: {
          css: {
            color: theme('colors.slate.100'),
            a: { color: theme('colors.blue.400') },
            code: {
              color: theme('colors.slate.100'),
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};
