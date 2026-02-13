---
title: 'create-cloudflare(C3)でHonoアプリをデプロイする'
description: 'Cloudflareの公式CLIツールC3を使って、HonoアプリケーションをCloudflare Workersにセットアップ・デプロイする手順を解説します。'
date: '2023-12-27'
tags:
  - cloudflare
  - hono
  - deployment
---

## C3とは

[create-cloudflare(C3)](https://developers.cloudflare.com/pages/get-started/c3/)は、Cloudflare公式のプロジェクト作成CLIツールです。

**主な特徴**

- 対話形式でプロジェクトをセットアップ
- Hono、Nuxt、React、Vue、Svelteなど主要フレームワークをサポート
- GitHub連携による自動デプロイに対応
- Cloudflare WorkersまたはPagesにすぐにデプロイ可能

## Honoプロジェクトのセットアップ

C3を使ってHonoプロジェクトを作成します。

```shell
npm create cloudflare@latest
```

対話形式で以下の質問に答えます：

1. **ディレクトリ名**: プロジェクトの作成先
2. **アプリケーションタイプ**: "Website or web app" を選択
3. **フレームワーク**: "Hono" を選択
4. **Gitバージョン管理**: "yes" を選択
5. **デプロイ**: GitHub連携を使うため "no" を選択

これだけでHonoプロジェクトのセットアップが完了します。

## ローカルでの動作確認

開発サーバーを起動して動作を確認します。

```shell
cd hono-cloudflare-c3-sample
npm run dev
```

`http://localhost:8787` にアクセスすると、Hello World! が表示されます。

## GitHub連携によるデプロイ

### リポジトリへのプッシュ

作成したプロジェクトをGitHubにプッシュします。

```shell
git remote add origin https://github.com/<username>/<repository>
git push -u origin main
```

### Cloudflare Pagesでの設定

1. [Cloudflare Pagesダッシュボード](https://dash.cloudflare.com/)にアクセス
2. "Workers & Pages" → "Create application" → "Pages" → "Connect to Git"
3. GitHubリポジトリを選択
4. ビルド設定はC3が自動で設定済みなので、そのままデプロイ

これでGitHubへのプッシュのたびに自動デプロイされるようになります。

## まとめ

C3を使うことで、以下のメリットがあります：

- **セットアップが簡単**: 対話形式で必要な設定を自動生成
- **即座にデプロイ可能**: Wranglerの設定がすでに完了
- **CI/CD対応**: GitHub連携で自動デプロイを実現

Cloudflare WorkersでHonoアプリを試したい方におすすめのツールです。
