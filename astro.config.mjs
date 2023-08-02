import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

import netlify from '@astrojs/netlify/functions';

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  server: { port: 3001 },
  output: 'server',
  adapter: netlify(),
});
