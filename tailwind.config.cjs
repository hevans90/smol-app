const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#dfcf99',
          800: '#a38d6d',
        },
      },
      fontFamily: {
        fontin: ['fontin', 'sans-serif'],
      },
    },
  },
  plugins: [
    plugin(({ addBase, theme }) => {
      addBase({
        html: { color: theme('colors.primary.800'), fontFamily: 'fontin' },
      });
    }),
  ],
};
