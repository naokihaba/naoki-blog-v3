<script setup lang="ts">
useSeoMeta({
  title: "naokihaba blog",
  description:
    "Front-end Developer loving Vue ecosystem. 技術のこと、日々のこと、思いついたことを綴るブログ",
});

const { data: posts } = await useAsyncData("blog-posts", () =>
  queryCollection("blog").order("date", "DESC").all()
);

const postsByYear = computed(() => {
  const map = new Map<number, typeof posts.value>();
  for (const post of posts.value ?? []) {
    const year = new Date(post.date).getFullYear();
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(post);
  }
  return map;
});

const sortedYears = computed(() =>
  Array.from(postsByYear.value.keys()).sort((a, b) => b - a)
);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function slugFromPath(path: string) {
  return path.replace("/blog/", "");
}
</script>

<template>
  <div class="mx-auto px-6 py-12" style="max-width: 48rem;">
    <div class="mb-10 flex gap-4">
      <a
        v-for="year in sortedYears"
        :key="year"
        :href="`#${year}`"
        class="text-sm hover:underline"
        style="color: var(--color-text-secondary);"
      >{{ year }}</a>
    </div>

    <section
      v-for="year in sortedYears"
      :id="String(year)"
      :key="year"
      class="mb-12"
    >
      <h2 class="mb-4 text-sm font-semibold" style="color: var(--color-text-secondary);">{{ year }}</h2>
      <ul class="list-none space-y-6 p-0">
        <li v-for="post in postsByYear.get(year)" :key="post.path">
          <NuxtLink
            :to="`/posts/${slugFromPath(post.path)}`"
            class="block text-lg hover:underline"
            style="color: var(--color-text-primary);"
          >
            {{ post.title }}
          </NuxtLink>
          <time
            class="text-sm"
            style="color: var(--color-text-secondary);"
            :datetime="new Date(post.date).toISOString()"
          >
            {{ formatDate(post.date) }}
          </time>
        </li>
      </ul>
    </section>
  </div>
</template>
