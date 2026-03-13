import { defineNuxtConfig } from "nuxt/config"

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@unocss/nuxt", "@nuxt/content"],
  routeRules: {
    "/blog/**": { redirect: { to: "/posts/**", statusCode: 301 } },
  },
  devtools: { enabled: true },
  compatibilityDate: "2024-04-03",
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width",
      htmlAttrs: { lang: "ja" },
      meta: [
        {
          name: "description",
          content:
            "Front-end Developer loving Vue ecosystem. 技術のこと、日々のこと、思いついたことを綴るブログ",
        },
        { property: "og:site_name", content: "naokihaba blog" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@naokihaba" },
        { name: "twitter:creator", content: "@naokihaba" },
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
      script: [
        {
          innerHTML: `
            const getThemePreference = () => {
              if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
                return localStorage.getItem('theme');
              }
              return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            };
            const isDark = getThemePreference() === 'dark';
            document.documentElement.classList[isDark ? 'add' : 'remove']('dark');
            if (typeof localStorage !== 'undefined') {
              const observer = new MutationObserver(() => {
                const isDark = document.documentElement.classList.contains('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
              });
              observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
            }
          `,
          tagPosition: "head",
        },
      ],
    },
  },
});
