---
title: 'NestJS + JestでE2Eテスト環境を構築する'
description: 'NestJSとJestを使ったE2Eテストの実践的な導入方法を解説します。Test.createTestingModuleを使った統合テストの書き方から、TypeORMのsynchronize機能を活用したテスト環境構築まで詳しく紹介します。'
date: '2021-11-28'
tags:
  - githubactions
  - jest
  - nestjs
  - cicd
  - typeorm
---

## はじめに

NestJSでJestを使ったE2Eテストを導入した際の知見をまとめます。

## ディレクトリ構造

```
e2e/
├── users.e2e-spec.ts
├── jest-e2e.json
├── mocks/
│   └── contractorReps/
│       └── mock.ts
└── utilities/
    ├── common.utility.ts
    └── master.utility.ts
```

## Jest設定

### 設定ファイルの作成

E2Eテスト用のJest設定を作成します。

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "moduleNameMapper": {
    "^src/(.*)$": "<rootDir>/../../$1"
  }
}
```

主な設定項目：

- `moduleFileExtensions`: 使用するファイル拡張子
- `testEnvironment`: テスト実行環境
- `testRegex`: テストファイルの検出パターン
- `moduleNameMapper`: パスエイリアスの解決

詳細は[Jest公式ドキュメント](https://jestjs.io/ja/docs/configuration#modulenamemapper-objectstring-string--arraystring)を参照してください。

## TypeORM設定

**⚠️ 警告：`synchronize: true`は本番環境で使用しないでください。既存データが失われる可能性があります。**

```typescript
// ormconfig.test.ts
module.exports = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '3306',
  username: process.env.DB_USERNAME || 'test_user',
  password: process.env.DB_PASSWORD || 'test_password',
  database: process.env.DB_NAME || 'test_db',
  // テスト環境のみ有効化：Entity定義からテーブルを自動生成
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

`synchronize`オプションは、アプリケーション起動時にEntity定義からテーブルを自動生成する便利な機能ですが、既存のテーブル構造を上書きするため、**テスト環境専用**としてください。

詳細は[TypeORM FAQ](https://github.com/typeorm/typeorm/blob/master/docs/faq.md)を参照してください。

## 必要なパッケージのインストール

```bash
npm install --save-dev @nestjs/testing
```

公式ドキュメント: [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

## テスト対象のAPI仕様

以下のユーザー情報取得APIをテストします。

### リクエスト例

```
GET http://localhost:3000/users?name=テスト
Authorization: Bearer <token>
```

### レスポンス例

```json
{
  "statusCode": 200,
  "message": "SUCCESS",
  "data": [
    {
      "id": 1,
      "name": "テスト",
      "ins_ts": "2021/11/29 13:47"
    }
  ]
}
```

## E2Eテストコード

### テストモジュールのセットアップ

```typescript
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import * as request from 'supertest'

describe('ユーザーAPI (E2E)', () => {
  let app: INestApplication

  // 各テスト実行前にデータをリセット
  beforeEach(async () => {
    await useRefreshDatabase()
    await runTestDataSeeder()
  })

  // テスト開始前に1回だけ実行
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([User]),
        ConfigModule.forRoot({
          envFilePath: ENV_FILE_PATH,
        }),
        AppModule,
      ],
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: APP_GUARD,
          useExisting: RoleGuard,
        },
        RoleGuard,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    await app.init()
  })

  // テスト終了後にクリーンアップ
  afterAll(async () => {
    await app.close()
    await tearDownDatabase()
  })

  // ... テストケース
})
```

### ヘルパー関数

```typescript
/**
 * ユーザー一覧を取得
 */
const index = async (account?: E2eLoginData): Promise<request.Response> => {
  const req = request(app.getHttpServer()).get(API_END_POINTS.USER)

  if (account) {
    req.set('Authorization', `Bearer ${await getJwtToken(request, app, account)}`)
  }

  return await req
}

/**
 * ユーザーを取得
 */
const show = async (
  id: number,
  account?: E2eLoginData
): Promise<request.Response> => {
  const req = request(app.getHttpServer()).get(`${API_END_POINTS.USER}/${id}`)

  if (account) {
    req.set('Authorization', `Bearer ${await getJwtToken(request, app, account)}`)
  }

  return await req
}

/**
 * ユーザーを作成
 */
const create = async (
  dto: CreateUserDto,
  account?: E2eLoginData
): Promise<request.Response> => {
  const req = request(app.getHttpServer())
    .post(API_END_POINTS.USER)
    .set('Accept', 'application/json')
    .send(dto)

  if (account) {
    req.set('Authorization', `Bearer ${await getJwtToken(request, app, account)}`)
  }

  return await req
}
```

### テストケース

```typescript
describe('ユーザー一覧取得', () => {
  it('認証済みユーザーがユーザー一覧を取得できる', async () => {
    const res = await index(LOGIN_DATA.SERVICE_ADMIN)

    expect(res.status).toEqual(HTTP_STATUS_CODES.OK)
    expect(res.body).toEqual(INDEX_USERS)
  })
})

describe('ユーザー詳細取得', () => {
  it('認証済みユーザーがユーザー詳細を取得できる', async () => {
    const users = (await index(LOGIN_DATA.SERVICE_ADMIN)).body
    const id = users[0].id

    const res = await show(id, LOGIN_DATA.SERVICE_ADMIN)

    expect(res.status).toEqual(HTTP_STATUS_CODES.OK)
    expect(res.body).toEqual(SHOW_USER_DATA)
  })
})

describe('ユーザー作成', () => {
  it('認証済みユーザーがユーザーを作成できる', async () => {
    const body: CreateUserDto = {
      name: '新規ユーザー',
      password: 'password',
      password_confirm: 'password',
    }

    const res = await create(body, LOGIN_DATA.SERVICE_ADMIN)

    expect(res.status).toEqual(HTTP_STATUS_CODES.CREATED)
    expect(res.body.message).toEqual(RESPONSE_MESSAGES.USER_CREATED)
  })
})
```

## テスト実行

```bash
npm run test:e2e
```

### 実行結果例

```
PASS  src/test/e2e/user.e2e-spec.ts (33.623 s)
  ユーザーAPI (E2E)
    ユーザー一覧取得
      ✓ 認証済みユーザーがユーザー一覧を取得できる (1748 ms)
    ユーザー詳細取得
      ✓ 認証済みユーザーがユーザー詳細を取得できる (1735 ms)
    ユーザー作成
      ✓ 認証済みユーザーがユーザーを作成できる (1493 ms)
```

## CI/CD環境での実行

[docker-compose + GitHub ActionsでCI/CD環境を構築する方法はこちら](/blog/docker-compose-github-actions-cicd)

## まとめ

NestJSとJestを使ったE2Eテスト環境を構築することで、以下のメリットが得られます：

- **統合テスト**：`Test.createTestingModule()`で本番環境と同じDIコンテナを再現
- **独立性**：`beforeEach`でデータベースをリセットし、テスト間の依存を排除
- **実用性**：supertestでHTTPリクエストをプログラマティックにテスト

TypeORMのsynchronize機能を活用することで、テスト環境のセットアップも自動化できます。
