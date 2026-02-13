// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import rehypeFaviconLinks from './src/plugins/rehype-favicon-links.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://nao-dev.netlify.app/', // あなたのサイトURLに変更してください
  integrations: [
    mdx({
      rehypePlugins: [rehypeFaviconLinks],
    }),
    sitemap(),
    icon({
      include: {
        lucide: ['*'], // すべてのlucideアイコンを含める
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
