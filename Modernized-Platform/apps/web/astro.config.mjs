import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://doctormarriagebureau.com.pk',
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react()
  ],
  output: 'static',
  build: {
    format: 'directory',
    assets: '_astro'
  }
});
