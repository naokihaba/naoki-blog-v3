---
title: 'Nuxt.js v2でGoogle Tag Managerを導入する'
description: '廃止された@nuxtjs/google-tag-managerの代替として、@gtm-support/vue2-gtmを使ったGTM導入方法を解説します。Nuxt 3への移行も見据えた実装例を紹介します。'
date: '2023-02-04'
tags:
  - nuxtjs
  - gtm
  - ga4
  - analytics
---

## はじめに

`@nuxtjs/google-tag-manager`は既に廃止されており、代替ライブラリの導入が必要です。本記事では、Nuxt.js v2でGTMを導入する方法を解説します。

## ライブラリの選定

### 調査結果

| ライブラリ | 状態 | 理由 |
|----------|------|------|
| `@nuxtjs/google-tag-manager` | ❌ | [公式に廃止済み](https://www.npmjs.com/package/@nuxtjs/google-tag-manager) |
| `nuxt-community/gtm-module` | ❌ | [Nuxt 3未サポート](https://github.com/nuxt-community/gtm-module/issues/160#issuecomment-1333076308) |
| `@gtm-support/vue2-gtm` | ✅ | Vue 2/3両対応、移行容易 |

### 採用ライブラリ

`@gtm-support/vue2-gtm`を採用します。理由は以下の通りです：

- `@gtm-support/vue-gtm`（Vue 3版）と設定方法が同じ
- Nuxt 3への移行が容易
- アクティブにメンテナンスされている

## 想定読者

- Nuxt.js v2でGTMを導入したい方
- Nuxt.js v3への移行を検討している方
- 既存のGTMライブラリから移行したい方

## 導入手順

### 1. パッケージのインストール

**⚠️ 警告：Webpack 4以上を使用している場合は、バージョン`@1.3.0`を指定してください。`2.0.0`では以下のエラーが発生します。**

```
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file.
```

詳細: [GitHub Issue #280](https://github.com/gtm-support/vue-gtm/issues/280#issuecomment-1402707099)

```bash
npm install @gtm-support/vue2-gtm@1.3.0
```

### 2. Nuxt Pluginの作成

クライアントサイドのみで動作するプラグインを作成します。

```javascript
// plugins/gtm.js
import VueGtm from '@gtm-support/vue2-gtm'
import Vue from 'vue'

export default () => {
  Vue.use(VueGtm, {
    id: 'GTM-XXXXXXX', // GTMコンテナIDを設定
    enabled: true,      // 開発環境では false に設定可能
    debug: process.env.NODE_ENV !== 'production', // 開発時はデバッグモード
  })
}
```

公式ドキュメント: [Nuxt.js Plugins Directory](https://nuxtjs.org/docs/directory-structure/plugins/)

### 3. nuxt.config.jsへの登録

プラグインをクライアントモードで登録します。

```javascript
// nuxt.config.js
export default {
  plugins: [
    { src: '~/plugins/gtm.js', mode: 'client' },
  ],
}
```

`mode: 'client'`を指定することで、サーバーサイドレンダリング時には読み込まれません。

### 4. GTM管理画面での設定

以上でNuxt.js側の設定は完了です。残りの設定（タグ、トリガー、変数など）は、GTM管理画面で行います。

## カスタムイベントの送信

ページ遷移以外のイベントを送信する場合は、以下のように実装します。

```javascript
// コンポーネント内
export default {
  methods: {
    trackButtonClick() {
      this.$gtm.trackEvent({
        event: 'button_click',
        category: 'engagement',
        action: 'click',
        label: 'signup_button',
        value: 1,
      })
    }
  }
}
```

## 環境別の設定

開発環境とプロダクション環境で異なるGTMコンテナを使用する場合：

```javascript
// plugins/gtm.js
import VueGtm from '@gtm-support/vue2-gtm'
import Vue from 'vue'

export default () => {
  const gtmId = process.env.NODE_ENV === 'production'
    ? 'GTM-PROD-XXX'
    : 'GTM-DEV-XXX'

  Vue.use(VueGtm, {
    id: gtmId,
    enabled: true,
    debug: process.env.NODE_ENV !== 'production',
  })
}
```

## Nuxt 3への移行

Nuxt 3に移行する際は、`@gtm-support/vue-gtm`（Vue 3版）に切り替えるだけです。設定方法はほぼ同じなので、スムーズに移行できます。

```javascript
// Nuxt 3の場合（参考）
// plugins/gtm.client.ts
import VueGtm from '@gtm-support/vue-gtm'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueGtm, {
    id: 'GTM-XXXXXXX',
    enabled: true,
    debug: process.env.NODE_ENV !== 'production',
  })
})
```

## まとめ

廃止された`@nuxtjs/google-tag-manager`の代替として、`@gtm-support/vue2-gtm`を使った実装方法を解説しました。

このライブラリを選択するメリット：

- **アクティブメンテナンス**：継続的に更新されている
- **移行容易性**：Nuxt 3への移行がスムーズ
- **柔軟性**：カスタムイベントの送信が容易

GTMの詳細な設定は、GTM管理画面で行うことで、コードを変更せずにタグを管理できます。
