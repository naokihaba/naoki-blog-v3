<script setup lang="ts">
useSeoMeta({
  title: "About | naokihaba blog",
  description: "Naoki Haba のプロフィールと開発環境",
});

interface Tool {
  name: string;
  description: string;
  url?: string;
}

interface ToolCategory {
  category: string;
  tools: Tool[];
}

const toolCategories: ToolCategory[] = [
  {
    category: "ソフトウェア",
    tools: [
      { name: "Visual Studio Code", description: "メインエディタ", url: "https://code.visualstudio.com/" },
      { name: "Google Chrome", description: "メインブラウザ", url: "https://www.google.com/chrome/" },
      { name: "Raycast", description: "ランチャー・生産性ツール", url: "https://www.raycast.com/" },
      { name: "Rectangle", description: "ウィンドウ管理", url: "https://rectangleapp.com/" },
    ],
  },
  {
    category: "開発ツール",
    tools: [
      { name: "Ghostty", description: "GPU アクセラレーテッド ターミナルエミュレータ", url: "https://ghostty.org/" },
      { name: "Starship", description: "クロスシェル対応プロンプト", url: "https://starship.rs/" },
      { name: "mise", description: "ランタイムバージョンマネージャー", url: "https://mise.jdx.dev/" },
    ],
  },
  {
    category: "ハードウェア",
    tools: [
      { name: "MacBook Pro 13インチ M2 (2022)", description: "メイン開発マシン (16GB)" },
      { name: "BenQ RD320UA", description: "モニター" },
      { name: "HHKB Professional HYBRID Type-S", description: "英語配列キーボード" },
      { name: "Anker Soundcore Space One", description: "ノイズキャンセリングヘッドフォン" },
      { name: "BenQ ScreenBar Pro", description: "モニターライト" },
    ],
  },
];
</script>

<template>
  <div class="mx-auto px-6 py-12" style="max-width: 48rem;">
    <!-- Profile -->
    <div class="mb-12">
      <img
        src="/Avatar 381x381.png"
        alt="Naoki Haba"
        width="64"
        height="64"
        class="rounded-full mb-4"
        loading="lazy"
      />
      <h1 class="text-xl font-bold mb-2" style="color: var(--color-text-primary);">Naoki Haba</h1>
      <p class="text-sm mb-4" style="color: var(--color-text-secondary);">
        💚 Front-end Developer loving Vue ecosystem
      </p>
      <div class="flex gap-4 text-sm">
        <a href="https://x.com/naokihaba" target="_blank" rel="noopener noreferrer" style="color: var(--color-text-secondary);">X</a>
        <a href="https://github.com/naokihaba" target="_blank" rel="noopener noreferrer" style="color: var(--color-text-secondary);">GitHub</a>
      </div>
    </div>

    <!-- 開発環境 -->
    <div>
      <h2 class="text-sm font-semibold mb-6" style="color: var(--color-text-secondary);">開発環境</h2>
      <div v-for="cat in toolCategories" :key="cat.category" class="mb-8">
        <h3 class="text-sm font-semibold mb-3" style="color: var(--color-text-primary);">{{ cat.category }}</h3>
        <ul class="list-none space-y-2 p-0">
          <li v-for="tool in cat.tools" :key="tool.name">
            <a
              v-if="tool.url"
              :href="tool.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm hover:underline"
              style="color: var(--color-text-primary);"
            >{{ tool.name }}</a>
            <span v-else class="text-sm" style="color: var(--color-text-primary);">{{ tool.name }}</span>
            <p class="text-sm" style="color: var(--color-text-secondary);">{{ tool.description }}</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
