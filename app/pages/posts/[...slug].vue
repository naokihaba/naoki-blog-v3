<script setup lang="ts">
const route = useRoute();
const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join("/")
  : route.params.slug;

const { data: post } = await useAsyncData(`post-${slug}`, () =>
  queryCollection("blog").path(`/blog/${slug}`).first()
);

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found", fatal: true });
}

useSeoMeta({
  title: () => `${post.value?.title} | naokihaba blog`,
  description: () => post.value?.description,
  ogTitle: () => `${post.value?.title} | naokihaba blog`,
  ogDescription: () => post.value?.description,
  twitterTitle: () => `${post.value?.title} | naokihaba blog`,
  twitterDescription: () => post.value?.description,
});

defineOgImage("BlogCard");

const tocLinks = computed(() => post.value?.body?.toc?.links ?? []);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

onMounted(() => {
  // Reading progress bar
  const progressBar = document.createElement("div");
  progressBar.id = "reading-progress";
  Object.assign(progressBar.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "0%",
    height: "3px",
    background: "var(--gradient-primary)",
    zIndex: "9999",
    transition: "width 0.1s ease-out",
  });
  document.body.appendChild(progressBar);

  let ticking = false;
  const updateProgress = () => {
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (window.scrollY / documentHeight) * 100;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Code copy buttons
  document.querySelectorAll<HTMLElement>("pre").forEach((pre) => {
    const container = document.createElement("div");
    container.className = "code-copy-button-container";

    const button = document.createElement("button");
    button.className = "code-copy-button";
    button.setAttribute("aria-label", "Copy code");
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>`;

    button.addEventListener("click", async () => {
      const code = pre.querySelector("code");
      if (!code) return;
      await navigator.clipboard.writeText(code.textContent || "");
      button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>`;
      button.classList.add("copied");
      setTimeout(() => {
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>`;
        button.classList.remove("copied");
      }, 2000);
    });

    container.appendChild(button);
    pre.appendChild(container);
  });
});

onUnmounted(() => {
  document.getElementById("reading-progress")?.remove();
});
</script>

<template>
  <article class="mx-auto px-6 py-12" style="max-width: 48rem;">
    <header class="mb-10">
      <p class="mb-3 text-sm" style="color: var(--color-text-secondary);">
        <time :datetime="new Date(post!.date).toISOString()">
          {{ formatDate(post!.date) }}
        </time>
      </p>
      <h1 class="text-2xl font-bold leading-snug" style="color: var(--color-text-primary);">
        {{ post!.title }}
      </h1>
      <p v-if="post!.description" class="mt-3 text-base" style="color: var(--color-text-secondary);">
        {{ post!.description }}
      </p>
    </header>

    <TableOfContents :links="tocLinks" />

    <div class="prose">
      <ContentRenderer :value="post!" />
    </div>

    <footer class="mt-16 space-y-8">
      <div class="flex items-center justify-between pt-6" style="border-top: 1px solid var(--color-border);">
        <NuxtLink to="/" class="text-sm no-underline hover:underline" style="color: var(--color-text-secondary);">
          ← ホームに戻る
        </NuxtLink>
        <a
          :href="`https://twitter.com/intent/tweet?text=${encodeURIComponent(post!.title)}&url=${encodeURIComponent(`https://blog.naokihaba.com/posts/${slug}`)}`"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium no-underline transition-opacity hover:opacity-80"
          style="background-color: #000; color: #fff;"
        >
          <svg width="14" height="14" viewBox="0 0 1200 1227" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" fill="white"/>
          </svg>
          Xでシェア
        </a>
      </div>
      <UtterancesComments />
    </footer>
  </article>
</template>
