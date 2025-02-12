const plugin = require('tailwindcss/plugin');

const screens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '2560px',
  '3xl': '3500px',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          300: '#f2ecd6',
          400: '#dfcf79',
          500: '#dfcf99',
          600: '#b1a478',
          800: '#a38d6d',
          900: '#6c542e',
        },
        discord: {
          300: '#a2a6f8',
          400: '#7983f5',
          500: '#5865F2',
        },
        poeItem: {
          gem: '#1ba29b',
          unique: '#af6025',
          rare: '#ffff77',
          magic: '#8888ff',
          enchant: '#b4b4ff',
          darkGrey: '#7f7f7f',
          corrupted: '#ff0000',

          fire: '#ca2424',
          cold: '#4179b1',
          lightning: '#ffd900',
        },
      },
      fontFamily: {
        fontin: ['fontin', 'sans-serif'],
        fontinSmallcaps: ['fontin-smallcaps', 'sans-serif'],
      },
    },
    screens,
  },
  plugins: [
    plugin(({ addBase, theme }) => {
      addBase({
        html: { color: theme('colors.primary.800'), fontFamily: 'fontin' },
      });
    }),
  ],
};
