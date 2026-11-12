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
          foulborn: '#cd2285',

          fire: '#ca2424',
          cold: '#4179b1',
          lightning: '#ffd900',
        },
      },
      fontFamily: {
        fontin: ['fontin', 'sans-serif'],
        fontinSmallcaps: ['fontin-smallcaps', 'sans-serif'],
      },
      keyframes: {
        'countdown-flip': {
          '0%': { opacity: '0.2', transform: 'translateY(-0.15em) scale(1.08)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'countdown-glow': {
          '0%, 100%': { opacity: '0.75', transform: 'translate(-50%, -50%) scale(1)' },
          '50%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1.08)' },
        },
        'countdown-heartbeat': {
          '0%, 100%': { opacity: '0.7', transform: 'translate(-50%, -50%) scale(1)' },
          '15%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1.15)' },
        },
        'ember-rise': {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translateY(-28rem)', opacity: '0' },
        },
        // Dark -> slightly-lighter green, low opacity throughout so row text
        // stays readable at every point in the cycle. Used to flag orders a
        // "Stash check" found without adding a text badge on every row.
        'stash-found': {
          '0%, 100%': { backgroundColor: 'rgb(6 78 59 / 0.2)' },
          '50%': { backgroundColor: 'rgb(16 185 129 / 0.22)' },
        },
      },
      animation: {
        'stash-found': 'stash-found 2.5s ease-in-out infinite',
        // the ladder's league countdown
        'countdown-flip': 'countdown-flip 0.35s ease-out',
        'countdown-glow': 'countdown-glow 6s ease-in-out infinite',
        'countdown-heartbeat': 'countdown-heartbeat 1s ease-in-out infinite',
        'ember-rise': 'ember-rise 8s linear infinite',
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
