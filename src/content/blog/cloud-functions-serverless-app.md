---
title: 'Google Cloud FunctionsとCloud SQLの連携'
description: 'GCPのCloud Functionsを使ったサーバーレスアプリケーションの構築方法と、Cloud SQLとの連携パターンについて解説します。'
date: '2022-01-31'
tags:
  - gcp
  - serverless
  - cloud-functions
---

## Cloud Functionsとは

Google Cloud FunctionsはGCPが提供するサーバーレス実行環境です。

**主な特徴**

- **サーバー管理不要**: インフラの管理や運用が不要
- **自動スケーリング**: 負荷に応じて自動的にスケール
- **従量課金**: 実行時間に応じた課金モデル
- **イベント駆動**: HTTPリクエストやCloud Storageの変更などをトリガーに実行

## 基本的なHTTP関数

最もシンプルなHTTPトリガーの例です。

```js
exports.helloWorld = (req, res) => {
  const message = req.query.message || req.body.message || 'Hello GCP!';
  res.status(200).send(message);
};
```

デプロイ後、トリガーURLにアクセスすることで関数が実行されます。

```bash
curl https://REGION-PROJECT_ID.cloudfunctions.net/helloWorld?message=こんにちは
```

## Cloud SQLとの連携

Cloud FunctionsからCloud SQLに接続する方法を紹介します。

### 接続設定

Cloud SQLへの接続には、Unix Domainソケットを使用します。

```js
const mysql = require('mysql');

const connection = mysql.createConnection({
  socketPath: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
```

### データ取得の実装例

```js
exports.getUsers = async (req, res) => {
  const connection = mysql.createConnection({
    socketPath: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  connection.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json(results);
  });

  connection.end();
};
```

### データ登録の実装例

```js
exports.createUser = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  const connection = mysql.createConnection({
    socketPath: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  connection.query(
    'INSERT INTO users (name) VALUES (?)',
    [name],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
      res.json({ id: result.insertId, name });
    }
  );

  connection.end();
};
```

## 環境変数の設定

機密情報は環境変数で管理します。

```bash
gcloud functions deploy myFunction \
  --runtime nodejs18 \
  --trigger-http \
  --set-env-vars CLOUD_SQL_CONNECTION_NAME=project:region:instance \
  --set-env-vars DB_USER=myuser \
  --set-env-vars DB_PASSWORD=mypassword \
  --set-env-vars DB_NAME=mydatabase
```

## セキュリティのベストプラクティス

### 1. プリペアドステートメントの使用

SQLインジェクション対策として、必ずプリペアドステートメントを使用します。

```js
// ❌ 危険: SQLインジェクションのリスク
connection.query(`INSERT INTO users (name) VALUES('${name}')`)

// ✅ 安全: プリペアドステートメント
connection.query('INSERT INTO users (name) VALUES (?)', [name])
```

### 2. 環境変数の活用

データベース接続情報はコードに直接記述せず、環境変数で管理します。

### 3. Cloud SQL Proxyの利用

本番環境では、Cloud SQL Proxyを使用して安全に接続します。

## まとめ

Cloud FunctionsとCloud SQLを組み合わせることで、サーバーレスなデータベースアプリケーションを構築できます。

**メリット**

- インフラ管理が不要
- 自動スケーリングで可用性向上
- 従量課金でコスト最適化

**注意点**

- コールドスタート時のレイテンシ
- 実行時間の制限（最大540秒）
- 同時実行数の上限
