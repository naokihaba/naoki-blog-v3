---
title: 'docker-compose + GitHub ActionsでE2Eテストを自動化する'
description: 'docker-composeとGitHub Actionsを組み合わせて、E2Eテストを自動実行するCI/CD環境を構築します。TypeORMのsynchronize機能を活用したテスト環境構築の実例も紹介します。'
date: '2021-11-28'
tags:
  - docker
  - githubactions
  - cicd
  - e2e
  - typeorm
---

## はじめに

[前回の記事](/blog/jest-nestjs-e2e-testing)で作成したE2Eテストを、docker-composeで実行できるようにし、GitHub Actionsで自動化します。

## Dockerfileの作成

### E2Eテスト実行用Dockerfile

```dockerfile
# Dockerfile.test
FROM node:14.16.1-alpine as build-stage

WORKDIR /work

COPY . /work/

RUN npm install

CMD ["npm","run","test:e2e"]
```

### マイグレーション実行用Dockerfile

```dockerfile
# Dockerfile.migrate
FROM node:14.16.1-alpine

WORKDIR /work

COPY ./src/databases /work/src/databases
COPY ./package.json ./package-lock.json ./ormconfig.ts ./tsconfig.json /work/

RUN npm install

CMD ["npm", "run", "typeorm", "migration:run"]
```

## docker-compose設定

E2Eテスト用のdocker-compose設定ファイルを作成します。

```yaml
# unit-test.yml
version: '3'

services:
  app:
    build:
      context: "."
      dockerfile: "Dockerfile.test"
    image: app-test
    container_name: app-test
    ports:
      - '3000:3000'
    environment:
      PORT: 3000
      TZ: 'Asia/Tokyo'
      DB_HOST: 'db'
      DB_PORT: '3306'
      DB_USERNAME: 'test_user'
      DB_PASSWORD: 'test_password'
      DB_NAME: 'test_db'
      REDIS_HOST: 'redis'
      REDIS_PORT: '6379'
    depends_on:
      - db
      - redis

  redis:
    image: redis:5.0
    container_name: redis_container-test
    ports:
      - "6379:6379"

  db:
    image: mysql:8.0
    command: mysqld --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    container_name: db_container_test
    ports:
      - 3306:3306
    environment:
      TZ: 'Asia/Tokyo'
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: test_db
      MYSQL_USER: test_user
      MYSQL_PASSWORD: test_password
```

## TypeORM設定

**⚠️ 警告：以下の設定を本番環境で使用するとデータが失われる可能性があります。必ずテスト専用の設定ファイルとして分離してください。**

```typescript
// ormconfig.test.ts
module.exports = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '3306',
  username: process.env.DB_USERNAME || 'test_user',
  password: process.env.DB_PASSWORD || 'test_password',
  database: process.env.DB_NAME || 'test_db',
  // テスト環境のみ有効化：アプリケーション起動時にスキーマを自動同期
  synchronize: true,
  // 実行SQLをログ出力
  logging: true,
  entities: ['src/domain/entities/*.ts'],
  migrations: ['src/databases/migrations/*.ts'],
  seeds: ['src/test/databases/seeders/*.seed.{js,ts}'],
  subscribers: ['src/subscribers/**/*.ts'],
  cli: {
    migrationsDir: 'src/databases/migrations',
    entitiesDir: 'src/domain/entities',
    seedersDir: 'src/databases/seeders',
    subscribersDir: 'src/subscribers',
  },
}
```

TypeORMの`synchronize: true`は、Entity定義からテーブルを自動生成する便利な機能ですが、**本番環境では絶対に使用しないでください**。既存のテーブル構造が上書きされ、データ損失のリスクがあります。

## テスト実行

### ローカルでの実行

```bash
# コンテナをビルド
docker-compose -f unit-test.yml build

# テストを実行（テスト終了後、コンテナを自動停止）
docker-compose -f unit-test.yml up --abort-on-container-exit
```

### 実行結果例

```
Recreating redis_container ... done
Recreating db_container    ... done
Recreating app-test ... done
Attaching to redis_container-test, db_container_test, app-test

app-test |
app-test | > sample@0.0.1 test:e2e /work
app-test | > jest --config ./src/test/e2e/jest-e2e.json
app-test |
app-test | PASS src/test/e2e/contractor-reps.e2e-spec.ts (92.288 s)
app-test   契約担当者(E2E)
app-test     ログインしていない場合は401が返ります
app-test       ✓ OK /contractor-reps (GET) (1471 ms)
...

app-test Test Suites: 1 passed, 1 total
app-test Tests:       38 passed, 38 total
app-test Time:        92.428 s
app-test exited with code 0
```

## GitHub Actions設定

プルリクエストのたびに自動でテストを実行するワークフローを設定します。

```yaml
# .github/workflows/test.yml
name: E2E Tests

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  run-test:
    name: Run E2E Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2
        with:
          ref: ${{ github.event.pull_request.head.sha }}

      - name: Run tests with docker-compose
        run: |
          docker-compose -f ./unit-test.yml build
          docker-compose -f ./unit-test.yml up --abort-on-container-exit
        working-directory: ./
```

## まとめ

docker-composeとGitHub Actionsを組み合わせることで、以下のメリットが得られます：

- **環境の一貫性**：本番環境に近い構成でテストを実行
- **自動化**：プルリクエストごとに自動テスト実行
- **早期発見**：統合不具合を早期に検出

`--abort-on-container-exit`フラグを使用することで、テスト完了後にコンテナが自動停止し、CI/CDパイプラインが効率的に終了します。
