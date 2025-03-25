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
        bg1: '#15120f',
        bg2: '#1b1613',
        bg3: '#201b18',
        fg1: '#e8e5e3',
        fg2: '#ba887d',
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
