---
title: 'ZeroSSLで無料SSL証明書を取得してGCPに適用する'
description: Let's Encryptの代替として注目されるZeroSSLを使った無料SSL証明書の取得方法を解説します。GCP Cloud Load BalancingへのSSL証明書適用手順も紹介します。
date: '2022-01-30'
tags:
  - gcp
  - ssl
  - security
  - cloud
---

## はじめに

[ZeroSSL](https://zerossl.com/)を使って無料のSSL証明書を発行し、GCP環境にHTTPSを導入する方法を解説します。

## ZeroSSLとは

ZeroSSLは、Let's Encryptと同様に無料でSSL証明書を発行できるサービスです。

### Let's Encryptとの違い

[Scott Helme氏の記事](https://scotthelme.co.uk/introducing-another-free-ca-as-an-alternative-to-lets-encrypt/)では、以下のように述べられています：

> Let's Encryptは、証明書を無料で大規模に提供することで、素晴らしい活動をしている素晴らしい組織です。しかし、問題は、長い間、そのような組織は彼らだけだったということです。他の選択肢を持つことは常に良いアイデアです。

参考記事: [ZeroSSL を使ってみた](https://zenn.dev/mattn/articles/b2c4c92c9116b1)

### 主な特徴

- 無料プランで90日間有効な証明書を発行可能
- Webブラウザベースで証明書を管理
- DNS（CNAME）、HTTP、メールの3つの認証方法に対応
- 複数ドメインの証明書を一元管理

## 前提条件

- GCPプロジェクトが作成済み
- ドメインを取得済み
- Cloud Load Balancingが設定済み

## SSL証明書の発行手順

### 1. ZeroSSLにアカウント登録

[ZeroSSL公式サイト](https://zerossl.com/)にアクセスし、アカウントを作成します。

### 2. 証明書の新規作成

1. ダッシュボードから「Create Free SSL Certificate」をクリック
2. 証明書を発行したいドメイン名を入力（例：`example.com`）
3. 「Next Step」をクリック

### 3. 証明書の有効期間を選択

1. 無料プランの場合は「90-Day Certificate」を選択
2. 「Next Step」をクリック

### 4. プランの選択

1. 「Free」プランを選択
2. 「Next Step」をクリック

### 5. ドメイン認証方法の選択

3つの認証方法から選択できます：

#### DNS認証（CNAME）- 推奨

最も確実な方法です。ZeroSSLが提供するCNAMEレコードをDNSに追加します。

**手順：**
1. 「DNS (CNAME)」を選択
2. 表示されたCNAMEレコードをメモ
3. Cloud DNSまたは使用中のDNSサービスに以下を追加：
   - **名前**: `_acme-challenge.example.com`
   - **タイプ**: CNAME
   - **値**: ZeroSSLが提供した値
4. DNSの反映を待つ（数分〜最大48時間）
5. 「Verify Domain」をクリック

#### HTTP認証

Webサーバーに検証ファイルを配置する方法です。

#### メール認証

ドメインの管理者メールアドレスに送信される認証リンクをクリックする方法です。

### 6. 証明書のダウンロード

認証が完了すると、以下のファイルをダウンロードできます：

- `certificate.crt` - 証明書本体
- `ca_bundle.crt` - 中間証明書
- `private.key` - 秘密鍵

## GCP Cloud Load Balancingへの適用

### 1. 証明書のアップロード

1. GCPコンソールで「ネットワークサービス > Load Balancing」を開く
2. 対象のロードバランサーを選択
3. 「編集」をクリック
4. 「フロントエンド構成」セクションで「証明書を追加」をクリック
5. 以下を入力：
   - **名前**: 任意の証明書名
   - **証明書**: `certificate.crt`と`ca_bundle.crt`を結合した内容
   - **秘密鍵**: `private.key`の内容

**証明書の結合方法：**

```bash
cat certificate.crt ca_bundle.crt > fullchain.crt
```

6. 「作成」をクリック

### 2. Cloud DNSの設定

1. 「ネットワークサービス > Cloud DNS」を開く
2. 対象のDNSゾーンを選択
3. Aレコードを追加：
   - **名前**: `example.com`
   - **タイプ**: A
   - **データ**: Cloud Load BalancingのIPアドレス

### 3. 動作確認

ブラウザで`https://example.com`にアクセスし、SSL証明書が正しく適用されていることを確認します。

## 自動更新の設定

無料証明書は90日間で期限切れになるため、定期的な更新が必要です。

### 更新方法

1. ZeroSSLダッシュボードで期限切れ前の証明書を確認
2. 「Renew」ボタンをクリック
3. 同じ手順で新しい証明書を発行
4. Cloud Load Balancingの証明書を更新

### 更新の自動化

ZeroSSLは[API](https://zerossl.com/documentation/api/)を提供しているため、スクリプトで自動化することも可能です。

```bash
# 例：証明書の有効期限を確認するスクリプト
curl -X GET "https://api.zerossl.com/certificates?access_key=YOUR_API_KEY"
```

## 注意点とデメリット

### 証明書の有効期間

- 無料プランは90日間のみ
- 有料プランでは1年間の証明書を発行可能
- 更新を忘れると証明書が失効し、サイトにアクセスできなくなる

### 管理の手間

- 自動更新機能がないため、手動更新が必要
- 複数ドメインがある場合、個別に管理が必要

### 推奨される運用

- カレンダーに更新日をリマインダー設定
- 証明書の有効期限を監視するスクリプトを作成
- 本番環境では、証明書の自動更新に対応したサービスの検討も推奨

## まとめ

ZeroSSLを使った無料SSL証明書の発行とGCPへの適用方法を解説しました。

**メリット：**
- 無料でSSL証明書を取得可能
- Webブラウザで簡単に管理
- Let's Encryptの代替選択肢

**デメリット：**
- 90日ごとの手動更新が必要
- 自動更新機能がない

小規模プロジェクトや検証環境には最適ですが、本番環境で長期運用する場合は、自動更新に対応したサービスやマネージドSSL証明書の利用も検討してください。
