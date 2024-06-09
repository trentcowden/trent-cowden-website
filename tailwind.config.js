/* eslint-disable import/no-extraneous-dependencies, global-require */
module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,svelte,ts,tsx,vue}',
    './node_modules/astro-boilerplate-components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bd: '#00000044',
        bg1: '#231b16',
        bg2: '#2c231c',
        bg3: '#342a22',
        fg1: '#f4f2f1',
        fg2: '#d8d3cf',
        fg3: '#bcb4ae',
        p1: '#d1a17a',
        p2: '#b88256',
        ph: 'hsla(27, 49%, 65%, 0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
  ],
};
