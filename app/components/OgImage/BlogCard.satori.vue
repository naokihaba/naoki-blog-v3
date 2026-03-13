<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div
    class="h-full w-full flex items-center justify-between"
    style="background: #09090b; padding: 60px 80px; font-family: sans-serif;"
  >
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <p style="color: #71717a; font-size: 28px; margin: 0;">naokihaba blog</p>
      <p style="color: #fafafa; font-size: 52px; font-weight: 700; margin: 0; max-width: 800px; line-height: 1.2;">
        naokihaba blog
      </p>
    </div>
    <div
      style="width: 120px; height: 120px; border-radius: 16px; background: #18181b; border: 1px solid #3f3f46; display: flex; align-items: center; justify-content: center;"
    >
      <p style="color: #fafafa; font-size: 48px; font-weight: 700; margin: 0;">N</p>
    </div>
  </div>
</template>
