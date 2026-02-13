---
title: 'PostgreSQL接続エラー「SSL is not enabled」の対処方法'
description: 'golang-migrateでPostgreSQLに接続する際のSSLエラーの原因と、開発環境・本番環境それぞれでの適切な対処方法を解説します。'
date: '2022-10-30'
tags:
  - postgresql
  - golang
  - ssl
---

## エラーの概要

golang-migrateでPostgreSQLに接続しようとすると、以下のエラーが発生する場合があります。

```bash
migrate -path db/migration \
  -database "postgresql://username:password@localhost:5432/dbname" \
  -verbose up

# エラー
error: pq: SSL is not enabled on the server
```

このエラーは、PostgreSQLクライアントがデフォルトでSSL接続を試みるのに対し、サーバー側でSSLが有効になっていないために発生します。

## 原因

PostgreSQLの公式Dockerイメージは、デフォルトで**SSLが無効**になっています。

一方、多くのPostgreSQLクライアントライブラリ（`pq`など）は、セキュリティのためデフォルトで**SSL接続を要求**します。

この設定の不一致がエラーの原因です。

## 開発環境での対処方法

### SSLモードを無効化する

接続文字列に`?sslmode=disable`を追加します。

```bash
migrate -path db/migration \
  -database "postgresql://username:password@localhost:5432/dbname?sslmode=disable" \
  -verbose up
```

### Goコードでの設定

```go
import (
    "database/sql"
    _ "github.com/lib/pq"
)

func main() {
    connStr := "postgres://username:password@localhost:5432/dbname?sslmode=disable"
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()
}
```

### 環境変数での管理

```bash
# .env
DATABASE_URL=postgresql://username:password@localhost:5432/dbname?sslmode=disable
```

```go
import (
    "os"
    "github.com/joho/godotenv"
)

func main() {
    godotenv.Load()
    connStr := os.Getenv("DATABASE_URL")
    db, err := sql.Open("postgres", connStr)
    // ...
}
```

## SSLモードの種類

PostgreSQLは複数のSSLモードをサポートしています。

| モード | 説明 | セキュリティレベル |
|--------|------|-------------------|
| `disable` | SSL接続を使用しない | ❌ 低 |
| `allow` | SSL接続を試み、失敗したら非SSL | ⚠️ 低〜中 |
| `prefer` | SSL接続を優先（デフォルト） | ⚠️ 中 |
| `require` | SSL接続を要求するが証明書は検証しない | ✅ 中〜高 |
| `verify-ca` | SSL接続とCA証明書を検証 | ✅ 高 |
| `verify-full` | SSL接続とホスト名も検証 | ✅✅ 最高 |

### 各モードの使い分け

```bash
# 開発環境: SSL無効
postgresql://user:pass@localhost:5432/db?sslmode=disable

# ステージング: SSL必須だが証明書検証なし
postgresql://user:pass@staging-db:5432/db?sslmode=require

# 本番環境: 完全な証明書検証
postgresql://user:pass@prod-db:5432/db?sslmode=verify-full
```

## 本番環境での推奨設定

本番環境では、セキュリティのため**必ずSSLを有効化**することを推奨します。

### PostgreSQLサーバーでSSLを有効化

#### 1. SSL証明書の準備

```bash
# 自己署名証明書を生成（開発・テスト用）
openssl req -new -x509 -days 365 -nodes -text \
  -out server.crt \
  -keyout server.key \
  -subj "/CN=localhost"

# パーミッション設定
chmod 600 server.key
chown postgres:postgres server.key server.crt
```

#### 2. PostgreSQLの設定

```conf
# postgresql.conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
```

#### 3. Docker Composeでの設定例

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
    volumes:
      - ./certs/server.crt:/var/lib/postgresql/server.crt
      - ./certs/server.key:/var/lib/postgresql/server.key
    command: >
      -c ssl=on
      -c ssl_cert_file=/var/lib/postgresql/server.crt
      -c ssl_key_file=/var/lib/postgresql/server.key
```

### クライアント側の接続設定

```bash
# SSL必須で接続
migrate -path db/migration \
  -database "postgresql://user:pass@db:5432/mydb?sslmode=require" \
  -verbose up
```

## セキュリティ上の考慮事項

### ローカル開発環境

- `sslmode=disable`でも問題ない
- ネットワークが信頼できる環境（localhost）

### ステージング/本番環境

- 最低でも`sslmode=require`を使用
- 可能であれば`sslmode=verify-full`を推奨
- Let's Encryptなどで正式な証明書を取得

### 接続文字列の管理

```go
// ❌ ハードコード（危険）
connStr := "postgres://admin:password123@prod-db/mydb"

// ✅ 環境変数で管理
connStr := os.Getenv("DATABASE_URL")

// ✅ シークレット管理ツールを使用
// AWS Secrets Manager, Google Secret Manager, HashiCorp Vault など
```

## トラブルシューティング

### エラー: certificate verify failed

```bash
error: x509: certificate signed by unknown authority
```

**対処法**: CA証明書を指定する

```bash
postgresql://user:pass@db:5432/mydb?sslmode=verify-ca&sslrootcert=/path/to/ca.crt
```

### エラー: server does not support SSL

PostgreSQLサーバーでSSLが無効になっています。

```conf
# postgresql.conf
ssl = on  # この設定を確認
```

### Docker環境での証明書パス問題

コンテナ内のパスを正しく指定します。

```yaml
volumes:
  - ./certs:/certs:ro

command: >
  -c ssl=on
  -c ssl_cert_file=/certs/server.crt
  -c ssl_key_file=/certs/server.key
```

## まとめ

PostgreSQL接続でのSSLエラーを解決するには：

- **開発環境**: `sslmode=disable`で問題なし
- **本番環境**: 必ずSSLを有効化し、`sslmode=require`以上を使用
- **セキュリティ**: 接続文字列は環境変数やシークレット管理ツールで管理
- **証明書**: 本番環境では正式な証明書を使用

環境に応じて適切なSSLモードを選択することが重要です。

### 参考リンク

- [PostgreSQL SSL サポート](https://www.postgresql.jp/document/current/html/libpq-ssl.html)
- [golang-migrate](https://github.com/golang-migrate/migrate)
- [pq ドライバー](https://github.com/lib/pq)
