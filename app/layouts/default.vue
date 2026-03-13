<template>
  <div class="flex min-h-screen flex-col" style="background-color: var(--color-surface);">
    <LayoutHeader />
    <main class="flex-1">
      <slot />
    </main>
    <LayoutFooter />
  </div>
</template>
