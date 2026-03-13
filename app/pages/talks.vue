<script setup lang="ts">
useSeoMeta({
  title: "Talks | naokihaba blog",
  description: "登壇資料やプレゼンテーションのまとめ",
});

const { data: talks } = await useAsyncData("talks", () =>
  queryCollection("talks").order("date", "DESC").all()
);

const talksByYear = computed(() => {
  const map = new Map<number, typeof talks.value>();
  for (const talk of talks.value ?? []) {
    const year = new Date(talk.date).getFullYear();
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(talk);
  }
  return map;
});

const sortedYears = computed(() =>
  Array.from(talksByYear.value.keys()).sort((a, b) => b - a)
);

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
  });
}
</script>

<template>
  <div class="mx-auto px-6 py-12" style="max-width: 48rem;">
    <p v-if="!talks?.length" class="text-sm" style="color: var(--color-text-secondary);">No talks yet.</p>

    <section
      v-for="year in sortedYears"
      :key="year"
      class="mb-12"
    >
      <h2 class="mb-4 text-sm font-semibold" style="color: var(--color-text-secondary);">{{ year }}</h2>
      <ul class="list-none space-y-8 p-0">
        <li v-for="talk in talksByYear.get(year)" :key="talk.path">
          <div
            v-if="talk.slidesEmbedUrl"
            class="mb-3 w-full overflow-hidden rounded-lg"
            style="aspect-ratio: 16/9;"
          >
            <iframe
              :src="talk.slidesEmbedUrl"
              class="size-full"
              allowfullscreen
              loading="lazy"
              style="border: 0;"
            />
          </div>
          <div class="flex items-baseline justify-between gap-4">
            <div>
              <p class="text-base font-medium" style="color: var(--color-text-primary);">{{ talk.title }}</p>
              <p v-if="talk.event" class="text-sm mt-0.5" style="color: var(--color-text-secondary);">{{ talk.event }}</p>
              <div class="flex gap-3 mt-1 text-sm">
                <a
                  v-if="talk.slidesUrl"
                  :href="talk.slidesUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="color: var(--color-primary);"
                >Slides</a>
                <a
                  v-if="talk.videoUrl"
                  :href="talk.videoUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="color: var(--color-primary);"
                >Video</a>
              </div>
            </div>
            <time
              class="shrink-0 text-sm tabular-nums"
              style="color: var(--color-text-secondary);"
              :datetime="new Date(talk.date).toISOString()"
            >
              {{ formatShortDate(talk.date) }}
            </time>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
