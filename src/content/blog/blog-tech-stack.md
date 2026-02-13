---
title: '個人ブログを支える技術'
description: 'Astro 5、Tailwind CSS v4、Content Collectionsなど、このブログを構築している技術スタックについて紹介します。'
date: '2026-02-13'
tags:
  - astro
  - typescript
  - blog
  - tech-stack
---

## 個人ブログを始めました

これまで Zenn などのプラットフォームで記事を書いてきましたが、自分のドメインで自由に発信できる場所が欲しくなり、このブログを立ち上げました。

せっかくなので、このブログを支える技術スタックについて紹介します。

## 全体構成

このブログは以下の技術で構築されています

**コア技術**
- **Astro 5** - 超高速な静的サイトジェネレーター
- **TypeScript** - 型安全な開発環境

**コンテンツ管理**
- **Content Collections** - Zodによる型安全なMarkdown管理
- **@astrojs/mdx** - MDX形式のサポート

**スタイリング**
- **Tailwind CSS v4** - ユーティリティファーストCSS
- **@tailwindcss/typography** - 記事本文の美しいタイポグラフィ
- **CSS変数** - ダークモード対応のテーマシステム

**その他**
- **astro-icon** - Iconifyベースのアイコンシステム
- **@astrojs/sitemap** - SEO最適化
- **@astrojs/rss** - RSSフィード生成
- **Pagefind** - 静的サイト向け高速検索
- **textlint** - 日本語文章の品質チェック
- **satori + sharp** - 動的OGP画像生成
- **wrangler** - Cloudflare Workersへのデプロイ

## Astro 5 + Content Collections

フレームワークとして [Astro 5](https://astro.build) を採用しています。

Astro を選んだ理由は以下のとおりです

- **超高速** - デフォルトでゼロJavaScript、必要な部分だけクライアントサイドJS
- **ファイルベースルーティング** - `pages/` ディレクトリで直感的にルーティングを構築
- **Content Collections** - 型安全なMarkdown/MDX管理
- **柔軟性** - 必要に応じてReact、Vue、Svelteなどを組み合わせ可能
- **優れたDX** - TypeScript完全サポート、高速なHMR

### Content Collections

ブログ記事は `src/content/blog/` ディレクトリで管理しています。Content Collections は Markdown ファイルを型安全に扱えるコンテンツ管理システムです。

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string().transform((str) => new Date(str)),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = {
  blog: blogCollection,
};
```

Zodによる型チェックと、ビルド時のバリデーションで安全な記事管理が可能です。

### 記事の取得

```typescript
import { getCollection } from 'astro:content';

const allPosts = await getCollection('blog');
const sortedPosts = allPosts.sort((a, b) =>
  b.data.date.getTime() - a.data.date.getTime()
);
```

シンプルで直感的なAPIで記事を取得できます。

## Astroコンポーネント

UI実装には Astro コンポーネントを使用しています。

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  post: CollectionEntry<'blog'>;
}

const { post } = Astro.props;

function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
---

<article class="group h-full">
  <a href={`/blog/${post.slug}`}>
    <h3>{post.data.title}</h3>
    <p>{post.data.description}</p>
  </a>
</article>
```

HTMLライクなシンプルな構文で、型安全なコンポーネントを書くことができます。

## Tailwind CSS v4

スタイリングには [Tailwind CSS v4](https://tailwindcss.com) を採用しています。

Tailwind CSS v4 の主な特徴：

- **Viteプラグイン** - PostCSS不要で、Vite統合が簡単に
- **CSS変数ベース** - カスタムプロパティを活用したテーマシステム
- **ゼロコンフィグ** - 設定ファイルなしでも動作

### カスタムカラーテーマ

CSS変数を使って、ライト/ダークモードのカラーテーマを実装しています。

```css
@theme {
  /* Surface Colors */
  --color-surface: #fafafa;
  --color-text-primary: #18181b;

  /* Primary - Purple Gradient */
  --color-primary: #8b5cf6;

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-accent: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

  --container-max: 1400px;
}

.dark {
  --color-surface: #09090b;
  --color-text-primary: #fafafa;
  --color-primary: #a78bfa;
  --gradient-primary: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
}
```

localStorageとMutationObserverを使用して、ユーザーの好みに応じた自動テーマ切り替えを実装しています。

### @tailwindcss/typography

記事本文のスタイリングには `@tailwindcss/typography` プラグインを使用しています。

```astro
<article class="prose dark:prose-invert max-w-none">
  <Content />
</article>
```

`prose` クラスを適用するだけで、見出し、段落、リスト、コードブロックなど、あらゆる要素に美しいタイポグラフィが適用されます。`dark:prose-invert` でダークモードにも自動対応します。

## SEO対策

SEO対策には `@astrojs/sitemap` を使用しています。

```typescript
// astro.config.mjs
export default defineConfig({
  site: 'https://nao-dev.netlify.app/',
  integrations: [
    sitemap(),
  ],
});
```

自動的にsitemap.xmlが生成され、検索エンジンのクローラーがサイトを効率的にインデックスできます。

## RSSフィード - @astrojs/rss

購読者のために、RSSフィードを提供しています。

`@astrojs/rss` を使用することで、簡単にRSSフィードを生成できます。

```javascript
// src/pages/rss.xml.js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');

  const sortedPosts = posts.sort((a, b) =>
    b.data.date.getTime() - a.data.date.getTime()
  );

  return rss({
    title: 'nao.dev',
    description: 'Front-end Developer loving Vue ecosystem',
    site: context.site,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.slug}/`,
    })),
    customData: `<language>ja</language>`,
  });
}
```

Content Collectionsと連携することで、記事の追加・更新時に自動的にRSSフィードも更新されます。

## 動的OGP画像生成 - satori + sharp

各記事ごとに動的にOGP画像を生成しています。

[satori](https://github.com/vercel/satori) はVercelが開発したライブラリで、HTMLとCSSをSVGに変換できます。これと [sharp](https://sharp.pixelplumbing.com/) を組み合わせることで、美しいOGP画像を自動生成できます。

```typescript
// src/pages/og/[...slug].png.ts
import satori from 'satori';
import sharp from 'sharp';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ props }) => {
  const { post } = props;

  // Satoriでデザインを定義
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          // ... スタイル定義
        },
        children: [
          { type: 'div', props: { children: post.data.title } },
        ],
      },
    },
    { width: 1200, height: 630 }
  );

  // SharpでSVGをPNGに変換
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
};
```

記事タイトル、日付、サイト名が含まれたカード型のOGP画像が自動生成され、SNSでのシェア時に美しく表示されます。

## astro-icon

アイコンには `astro-icon` を使用しています。Iconifyの全アイコンセットにアクセスでき、使用するアイコンだけがバンドルされます。

```astro
---
import { Icon } from 'astro-icon/components';
---

<Icon name="lucide:calendar" class="size-4" />
<Icon name="lucide:clock" class="size-4" />
```

設定でlucideアイコンセットを指定：

```typescript
// astro.config.mjs
export default defineConfig({
  integrations: [
    icon({
      include: {
        lucide: ['*'],
      },
    }),
  ],
});
```

## デザインシステム

このブログは**モダン・ミニマリズム + ビビッドアクセント**のコンセプトでデザインされています。

### 主な特徴

- **カードグリッドレイアウト** - 2カラムで整然と配置されたブログ一覧
- **グラデーション多用** - 紫→ピンク系のモダンなグラデーション
- **マイクロインタラクション** - ホバー時の浮き上がり効果、スムーズなトランジション
- **読みやすさ重視** - 広い行間（2.0）、適切なフォントサイズ
- **ダークモード完全対応** - システム設定に応じた自動切り替え

## 全文検索 - Pagefind

ブログ内の記事を高速に検索できるよう、[Pagefind](https://pagefind.app/) を導入しています。

Pagefindは静的サイト向けの全文検索ライブラリで、以下の特徴があります

- **完全静的** - サーバー不要で動作
- **超軽量** - 検索インデックスが自動的に最適化
- **多言語対応** - 日本語検索も完全サポート
- **ゼロ設定** - ビルド時に自動的にインデックス生成

```bash
# ビルド時にインデックス生成
pnpm pagefind --site dist --output-path dist/pagefind
```

検索UIは⌘K（Ctrl+K）で開くモーダル形式で、リアルタイムに検索結果が表示されます。

## 文章品質管理 - textlint

ブログ記事の品質を保つため、[textlint](https://textlint.github.io/) を導入しています。

`@textlint-ja/textlint-rule-preset-ai-writing` プリセットを使用することで、以下をチェックできます

- **重複表現** - 同じ言葉の繰り返しを検出
- **冗長な表現** - 不要な言い回しを指摘
- **ら抜き言葉** - 文法的な誤りをチェック
- **表記ゆれ** - 表記の統一性を確認

```bash
# 記事をチェック
pnpm lint:text

# 自動修正
pnpm lint:text:fix
```

AI技術を活用したルールセットにより、より自然で読みやすい文章を書けるようになります。

## パフォーマンス

Astroの強みを活かし、超高速なブログを実現しています

- **ゼロJavaScript** - デフォルトでクライアントサイドJSなし
- **静的サイト生成** - ビルド時に全ページを事前生成
- **最適化された画像** - 自動的にWebP/AVIF変換
- **Tailwind CSS v4** - PostCSS不要でビルドが高速

## デプロイ - Cloudflare Workers

このブログは [Cloudflare Workers](https://workers.cloudflare.com/) でホストされています。

Cloudflare Workersを選んだ理由は以下のとおりです

- **エッジでの実行** - 世界中のエッジロケーションでコードを実行
- **超高速なレスポンス** - エッジからの直接配信で低レイテンシ
- **無料で使いやすい** - 個人ブログには十分な無料枠
- **柔軟性** - 静的サイトだけでなく、動的な処理も可能

### wranglerでデプロイ

[wrangler](https://developers.cloudflare.com/workers/wrangler/) を使用することで、コマンド一つでデプロイできます。

```bash
# ビルド＆デプロイ
pnpm build && pnpm deploy
```

`wrangler.toml` で設定を管理し、CI/CDパイプラインにも簡単に組み込めます。

## まとめ

Astro 5 と Tailwind CSS v4 の組み合わせにより、超高速でモダンなブログを構築できました。

主な特徴をまとめると：

- **Content Collections** - 型安全な記事管理
- **動的OGP画像生成** - satoriとsharpによる美しいOGP画像
- **RSSフィード** - 購読者のための標準サポート
- **Pagefind** - 静的サイト向け高速検索
- **Cloudflare Workers** - エッジでの超高速配信
- **モダンなデザインシステム** - ダークモード完全対応

これらの技術により、快適な執筆・閲覧体験を実現しています。

今後もこのブログを通じて、技術的な知見や経験を発信していきます！
