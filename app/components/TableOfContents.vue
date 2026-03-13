<script setup lang="ts">
interface TocLink {
  id: string;
  text: string;
  depth: number;
  children?: TocLink[];
}

const props = defineProps<{
  links: TocLink[];
}>();

// H2とH3のみ表示、childrenをフラットに展開
const flatLinks = computed(() => {
  const result: TocLink[] = [];
  for (const link of props.links) {
    result.push({ ...link, depth: 2 });
    if (link.children) {
      for (const child of link.children) {
        result.push({ ...child, depth: 3 });
      }
    }
  }
  return result;
});
</script>

<template>
  <nav
    v-if="flatLinks.length > 0"
    class="rounded-xl p-6 mb-8"
    style="background-color: var(--color-surface-elevated); border: 1px solid var(--color-border);"
  >
    <h2 class="text-lg font-bold mb-4" style="color: var(--color-text-primary);">目次</h2>
    <ul class="space-y-2">
      <li
        v-for="heading in flatLinks"
        :key="heading.id"
        :style="heading.depth === 3 ? 'margin-left: 1rem;' : ''"
      >
        <a
          :href="`#${heading.id}`"
          class="block text-sm hover:underline transition-colors"
          :style="`color: ${heading.depth === 2 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'};`"
        >
          {{ heading.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>
