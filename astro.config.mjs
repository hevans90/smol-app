import netlify from '@astrojs/netlify/functions';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
  ],
  server: {
    port: 3001,
  },
  output: 'server',
  adapter: netlify({
    imageCDN: false,
  }),
});
