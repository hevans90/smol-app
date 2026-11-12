import netlify from '@astrojs/netlify/functions';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

const isDevelopment = process.env.NODE_ENV === 'development';

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
  // Pages are built once and served from the CDN; their data loads in the
  // browser. Only the OAuth callbacks (verify*.astro) render per request.
  output: 'hybrid',
  adapter: netlify({
    imageCDN: isDevelopment ? false : true,
  }),
});
