<script setup lang="ts">
const el = ref<HTMLElement | null>(null);
onMounted(() => {
  const script = document.createElement("script");
  script.src = "https://utteranc.es/client.js";
  script.setAttribute("repo", "naokihaba/naoki-blog-v3");
  script.setAttribute("issue-term", "pathname");
  script.setAttribute("theme", "github-dark");
  script.crossOrigin = "anonymous";
  script.async = true;
  el.value?.appendChild(script);
});
</script>

<template>
  <div ref="el" class="mt-8" />
</template>
