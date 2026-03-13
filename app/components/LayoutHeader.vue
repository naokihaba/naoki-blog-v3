<script setup lang="ts">
const route = useRoute();

const navLinks = [
  { label: "Talks", href: "/talks" },
  { label: "About", href: "/about" },
];

function isActive(href: string) {
  return route.path === href || (href !== "/" && route.path.startsWith(href));
}
</script>

<template>
  <header style="border-bottom: 1px solid var(--color-border);">
    <div class="mx-auto flex items-center justify-between px-6 py-4" style="max-width: 48rem;">
      <NuxtLink to="/" class="text-base font-bold" style="color: var(--color-text-primary);">
        naokihaba blog
      </NuxtLink>
      <nav class="flex items-center gap-6">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.href"
          :to="link.href"
          class="text-sm"
          :style="isActive(link.href)
            ? 'color: var(--color-text-primary); font-weight: 600;'
            : 'color: var(--color-text-secondary);'"
        >
          {{ link.label }}
        </NuxtLink>
        <a
          href="https://github.com/naokihaba"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm"
          style="color: var(--color-text-secondary);"
        >GitHub</a>
      </nav>
    </div>
  </header>
</template>
