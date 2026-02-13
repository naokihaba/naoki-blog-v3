// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://nao-dev.netlify.app/', // あなたのサイトURLに変更してください
  integrations: [
    mdx(),
    sitemap(),
    icon({
      include: {
        lucide: ['*'], // すべてのlucideアイコンを含める
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        external: ['/pagefind/pagefind.js'],
      },
    },
  },
});
