---
title: 'vuejs/language-tools の PR を読み解く：DiffWindow のハイライト問題'
description: 'Vue - Official 拡張機能 v3.1.7 で修正された Git 差分表示のハイライト問題について、PR を追いながら原因と解決策を解説します。'
date: '2025-12-08'
tags:
  - vue
  - vscode
  - oss
---

## はじめに

この記事は、📅 **[Vue Advent Calendar 2025](https://qiita.com/advent-calendar/2025/vue)** の 8 日目の記事です。

Visual Studio Code（以下、VS Code）で Vue.js を開発する際に便利な拡張機能である Vue (Official) を利用される場合が多いのではないでしょうか。

本日リリースされた `v3.1.7` で気になる修正があったので、再現確認とコミットを追ってみました。

https://github.com/vuejs/language-tools/releases/tag/v3.1.7

https://github.com/vuejs/language-tools/pull/5811

## vuejs/language-tools とは

まず、vuejs/language-tools について簡単に紹介します。

Vue.js の公式ドキュメントでは、IDE サポートについて以下のように説明されています。

> The recommended IDE setup is VS Code + the Vue - Official extension (previously Volar). The extension provides syntax highlighting, TypeScript support, and intellisense for template expressions and component props.

https://vuejs.org/guide/scaling-up/tooling.html#ide-support

この Vue - Official 拡張機能の中核となるのが [vuejs/language-tools](https://github.com/vuejs/language-tools) です。

以下の図のように、複数のパッケージで構成されています。今回の修正は `@vue/language-core` に関するものです。

![vuejs/language-tools のアーキテクチャ](https://i.gyazo.com/28ab68ee0e3ce23708c51c8522e7050c.png)
_[Community Integration - vuejs/language-tools](https://github.com/vuejs/language-tools/blob/master/README.md#community-integration) より_

## 問題：Git 差分表示で色がおかしくなる

https://github.com/vuejs/language-tools/issues/5572

Git の差分表示（DiffWindow）で Vue ファイルを開くと、Semantic Highlighting が正しく適用されず、シンタックスハイライトの色が壊れてしまう現象が発生していました。

手元でも再現確認を行ったところ再現しました。参考までに環境は以下の通りです。

- VS Code: 1.106.3 (Universal)
- Vue - Official (vue.volar): 3.0.7 より前のバージョン
- Vue: 3.5.25
- vue-tsc: 3.0.2

PR を見るだけだと理解が深まらないので、フォークして実際のコードをいじりながらテストを回していくことにしました。

以下は検証に利用したコードなので、興味ある方は手元でも試して読んでみてください。

## 原因：キャッシュキーの競合

原因は、仮想コードのキャッシュキーに `fileName`（ファイルパスのみ）を使用していたことにあります。

```typescript
// 変更前：fileName をキーに使用
fileRegistry.get(fileName)
fileRegistry.set(fileName, code)

// disposeVirtualCode も同様
disposeVirtualCode(scriptId) {
    const fileName = asFileName(scriptId);
    fileRegistry.delete(fileName);
}
// キー例: '/path/to/App.vue'
```

通常のファイルは `file://` スキームでアクセスされますが、Git の差分表示では `git://` スキームが使われます。

- 通常: `file:///path/to/App.vue`
- Git差分: `git:/path/to/App.vue`

`fileName` だけをキーにすると、両者が同じキャッシュエントリを参照してしまい、Git diff バッファが通常ファイルのスナップショットを上書きしてしまいます。

### 解決策：scriptId によるキャッシュ分離

PR #5811 では、キャッシュキーを `scriptId`（URI 全体）に変更することで、スキームごとに独立したキャッシュを保持するようにしました。

```typescript
// 変更後：scriptId をキーに使用
fileRegistry.get(String(scriptId))
fileRegistry.set(String(scriptId), code)

disposeVirtualCode(scriptId) {
    fileRegistry.delete(String(scriptId));
}
// キー例: 'file:///path/to/App.vue' または 'git:/path/to/App.vue'
```

## おわりに

日々お世話になっている Vue - Official 拡張機能の中核である vuejs/language-tools の改善により、Git 差分表示での Semantic Highlighting 問題が解決されました。

VS Code で Vue.js を開発されている方は、ぜひ最新バージョン（v3.1.7 以降）へアップデートしてみてください。

## 参考リンク

- [PR #5811: feat(language-core): cache virtual code by scriptId](https://github.com/vuejs/language-tools/pull/5811)
- [Issue #5572: Different font colors in DiffWindow](https://github.com/vuejs/language-tools/issues/5572)
