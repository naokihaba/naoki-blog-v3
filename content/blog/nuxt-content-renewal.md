---
title: '個人ブログを Nuxt Content でリニューアルした話'
description: 'Astro 5 から Nuxt Content v3 + UnoCSS + Vite+ に移行した経緯と技術スタックの紹介です。'
date: '2026-03-14'
---

## はじめに

これまで Astro 5 で構築していた個人ブログを、Nuxt Content v3 を中心とした構成にリニューアルしました。

Astro は素晴らしいフレームワークですが、Vue エコシステムが好きな自分にとって、Vue コンポーネントを自然に書ける環境に移行したいと思っていました。

## 新しい技術スタック

**コア**
- **Nuxt 4** - Vue フルスタックフレームワーク
- **Nuxt Content v3** - SQLite ベースのコンテンツ管理
- **Vite+** - Vite / Rolldown / Vitest / Oxlint を統合したツールチェーン

**スタイリング**
- **UnoCSS** - Tailwind 互換のオンデマンド CSS エンジン

**デプロイ**
- **Cloudflare Workers** - エッジでの SSR / 静的配信

## Astro から Nuxt Content v3 への移行

### コンテンツコレクションの違い

Astro の `defineCollection` と Nuxt Content v3 の `defineCollection` は似ていますが、スキーマ定義と取得 API が異なります。

**Astro の場合**
```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string().transform((str) => new Date(str)),
  }),
});
```

**Nuxt Content v3 の場合**
```typescript
// content.config.ts
import { defineContentConfig, defineCollection, z } from '@nuxt/content';

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**',
      schema: z.object({
        title: z.string(),
        date: z.string(),
      }),
    }),
  },
});
```

Nuxt Content v3 はコレクションを SQLite に保存します。ビルド時にコンテンツを処理してデータベースを構築し、クエリを高速化しています。

### コンテンツの取得

Astro の `getCollection` に対応するのが、Nuxt Content v3 の `queryCollection` です。

```typescript
// Nuxt Content v3
const posts = await queryCollection('blog')
  .order('date', 'DESC')
  .all();
```

Vue ページ内では auto-import されるため、import 文が不要です。

### ルーティング

Astro のファイルベースルーティングと同様に、Nuxt も `pages/` ディレクトリでルーティングを管理します。

ブログ記事の詳細ページは `pages/posts/[...slug].vue` として定義し、パスからスラッグを取得してコンテンツをクエリしています。

```typescript
// app/pages/posts/[...slug].vue
const route = useRoute();
const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : route.params.slug;

const { data: post } = await useAsyncData(`post-${slug}`, () =>
  queryCollection('blog').path(`/blog/${slug}`).first()
);
```

## UnoCSS への移行

Astro では Tailwind CSS v4 を使っていましたが、Nuxt への移行にあわせて UnoCSS に変更しました。

UnoCSS はオンデマンドで CSS を生成するため、使用したユーティリティクラスだけがバンドルに含まれます。`presetWind4` で Tailwind v4 互換のユーティリティが使えます。

```typescript
// uno.config.ts
import { defineConfig, presetWind4 } from 'unocss';

export default defineConfig({
  presets: [presetWind4()],
});
```

Nuxt への組み込みは `@unocss/nuxt` モジュールで完結します。

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@unocss/nuxt', '@nuxt/content'],
});
```

## Vite+ ツールチェーン

このプロジェクトでは [Vite+](https://viteplus.dev) を使っています。Vite+は Vite / Rolldown / Vitest / Oxlint / Oxfmt を統合した `vp` コマンド 1 つで全てのツールを扱えるツールチェーンです。

```bash
# 開発サーバー起動
vp dev

# チェック（フォーマット・Lint・型チェック）
vp check

# テスト実行
vp test
```

個別にツールをインストール・設定する必要がなく、統一されたインターフェースでプロジェクトを管理できます。

## RSS フィードの実装

Astro では `@astrojs/rss` パッケージが RSS を簡単に生成してくれました。Nuxt では Server Routes を使って自前で実装しています。

`server/routes/rss.xml.ts` として配置することで、自動的に `/rss.xml` のエンドポイントになります。

```typescript
// server/routes/rss.xml.ts
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export default defineEventHandler(async (event) => {
  const files = await readdir(join(process.cwd(), 'content/blog'));
  // markdown を読んで RSS XML を生成...
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
  return rss;
});
```

## ダークモード

システムの color-scheme に合わせた自動ダークモードを実装しています。

FOUC（コンテンツのちらつき）を防ぐため、インライン script を `<head>` 内で実行しています。

```typescript
// nuxt.config.ts
app: {
  head: {
    script: [{
      innerHTML: `
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList[isDark ? 'add' : 'remove']('dark');
      `,
      tagPosition: 'head',
    }],
  },
},
```

## まとめ

Astro から Nuxt Content v3 への移行で、Vue エコシステムに統一された環境を構築できました。

- **Nuxt Content v3** の SQLite ベースのクエリは高速で型安全
- **UnoCSS** のオンデマンド生成で CSS バンドルが最小化
- **Vite+** で複数ツールの設定を一元管理

Vue が好きな方には Nuxt Content の組み合わせを強くおすすめします。
