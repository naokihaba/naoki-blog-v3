---
title: 'NestJS + Jest + GitHub ActionsでCI環境を構築する実践ガイド'
description: 'NestJSプロジェクトにJestを使ったE2Eテストを導入し、GitHub Actionsで自動化する手順を解説します。TypeORMとMySQLを使ったCRUDアプリケーションの実装も含む実践的なハンズオン記事です。'
date: '2022-03-29'
tags:
  - githubactions
  - ci
  - jest
  - nestjs
  - e2e
---

## はじめに

NestJSプロジェクトにJestを使ったE2Eテストを導入し、GitHub Actionsで自動化するまでの手順を解説します。

## CIとは

CI（継続的インテグレーション）は、開発者がコード変更を定期的にリポジトリにマージし、自動化されたビルドとテストを実行するDevOps開発手法です。

参考: [AWS - 継続的インテグレーション](https://aws.amazon.com/jp/devops/continuous-integration/)

## ハンズオンのゴール

- NestJSプロジェクトの構築
- Docker + MySQLでの開発環境構築
- TypeORMを使ったCRUD機能の実装
- E2Eテストの実装
- GitHub ActionsでのCI自動化

## 前提条件

- macOS環境（Windows環境では一部動作が異なる可能性あり）
- Docker Desktop v3.4.0以上がインストール済み
- Node.js v14以上がインストール済み

## 技術スタック

- **Node.js**: サーバーサイドJavaScript実行環境
- **NestJS**: スケーラブルなNode.jsフレームワーク
- **TypeORM**: TypeScript用ORマッパー
- **MySQL 8.0**: リレーショナルデータベース
- **Jest**: JavaScriptテストフレームワーク
- **Docker**: コンテナ仮想化プラットフォーム

## プロジェクトセットアップ

### NestJS CLIのインストールとプロジェクト作成

```bash
# グローバルにCLIをインストール
npm install -g @nestjs/cli

# プロジェクトを作成（npmを選択）
nest new meetup-dev

# プロジェクトディレクトリに移動
cd meetup-dev

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run start:dev
```

動作確認：

```bash
curl http://localhost:3000
# "Hello World!" が返ればOK
```

### NestJSの基本構造

NestJSは以下のコンポーネントで構成されます：

#### main.ts - エントリーポイント

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3000)
}
bootstrap()
```

#### Module - 依存関係の管理

```typescript
// src/modules/app.module.ts
import { Module } from '@nestjs/common'
import { AppController } from '../controllers/app.controller'
import { AppService } from '../services/app.service'

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

#### Controller - ルーティング

```typescript
// src/controllers/app.controller.ts
import { Controller, Get } from '@nestjs/common'
import { AppService } from '../services/app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }
}
```

#### Service - ビジネスロジック

```typescript
// src/services/app.service.ts
import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!'
  }
}
```

## MySQL環境の構築

### docker-compose.ymlの作成

```yaml
# docker-compose.yml
version: '3'

services:
  db:
    image: mysql:8.0
    command: mysqld --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    container_name: meetup_db_container
    volumes:
      - mysql-data-volume:/var/lib/mysql
    ports:
      - "3306:3306"
    environment:
      TZ: 'Asia/Tokyo'
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: meetup
      MYSQL_USER: app
      MYSQL_PASSWORD: secret

volumes:
  mysql-data-volume:
```

### コンテナの起動

```bash
docker compose up -d

# 起動確認
docker compose ps

# コンテナに入って接続確認
docker compose exec db bash
mysql -u root -p
# password: password
```

## TypeORMの設定

### 必要なパッケージのインストール

```bash
npm install --save @nestjs/typeorm typeorm@0.2 mysql2
npm install --save @nestjs/config
```

### 設定ファイルの作成

```typescript
// src/config/configuration.ts
export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  server: {
    port: parseInt(process.env.PORT) || 3000,
    hostName: process.env.hostname || 'localhost:3000',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME || 'root',
    pass: process.env.DB_PASSWORD || 'password',
    name: process.env.DB_NAME || 'meetup',
  },
})
```

### AppModuleへの統合

```typescript
// src/modules/app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import configuration from '../config/configuration'
import { join } from 'path'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.user'),
        password: configService.get('database.pass'),
        database: configService.get('database.name'),
        entities: [join(__dirname, '../entities/*.entity.{ts,js}')],
        synchronize: false,
        logging: configService.get('nodeEnv') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
  // ...
})
export class AppModule {}
```

## CRUDアプリケーションの実装

### リソースの生成

```bash
nest generate resource users
# REST APIを選択
# CRUD entry pointsを有効化
```

### Entity定義

```typescript
// src/entities/user.entity.ts
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Timestamp,
  UpdateDateColumn,
} from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({
    name: 'id',
    unsigned: true,
    type: 'bigint',
    comment: 'ユーザーID',
  })
  readonly id: number

  @Column({ type: 'varchar', length: 255, comment: 'ユーザー名' })
  name: string

  @Column({ type: 'varchar', length: 255, comment: 'メールアドレス', unique: true })
  email: string

  @Column({ type: 'varchar', length: 255, comment: 'パスワード' })
  password: string

  @CreateDateColumn({ comment: '登録日時' })
  readonly ins_ts?: Timestamp

  @UpdateDateColumn({ comment: '最終更新日時' })
  readonly upd_ts?: Timestamp

  @DeleteDateColumn({ comment: '削除日時' })
  readonly delete_ts?: Timestamp

  constructor(name: string, email: string, password: string) {
    this.name = name
    this.email = email
    this.password = password
  }
}
```

### TypeORM設定ファイル

```typescript
// ormconfig.ts
module.exports = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '3306',
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'meetup',
  synchronize: false,
  logging: true,
  entities: ['src/entities/*.ts'],
  migrations: ['src/databases/migrations/*.ts'],
  cli: {
    migrationsDir: 'src/databases/migrations',
    entitiesDir: 'src/entities',
  },
}
```

### マイグレーションの実行

```bash
# ビルド
npm run build

# マイグレーションファイルを生成
npx ts-node ./node_modules/.bin/typeorm migration:generate --name user

# マイグレーションを実行
npx ts-node ./node_modules/.bin/typeorm migration:run
```

### DTO定義

```bash
npm install --save class-validator class-transformer
```

```typescript
// src/dto/create-user.dto.ts
import { IsEmail, IsNotEmpty, Matches, MaxLength } from 'class-validator'

export class CreateUserDto {
  @IsNotEmpty({ message: '名前は必ず入力してください' })
  @MaxLength(255, { message: '名前は255文字以内で入力してください' })
  name: string

  @IsNotEmpty({ message: 'Emailは必ず入力してください' })
  @MaxLength(255, { message: 'Emailは255文字以内で入力してください' })
  @IsEmail({}, { message: '正しいEmail形式で入力してください' })
  email: string

  @IsNotEmpty({ message: 'パスワードは必ず入力してください' })
  @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,25}$/, {
    message: 'パスワードは大文字小文字を含む8文字以上25文字以内で設定してください',
  })
  password: string
}
```

### Service実装

```bash
npm install bcrypt
npm install -D @types/bcrypt
```

```typescript
// src/services/users.service.ts
import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { CreateUserDto } from '../dto/create-user.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<{ message: string }> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    })

    if (existingUser) {
      throw new BadRequestException('既に登録済みのメールアドレスです')
    }

    await this.usersRepository.save({
      name: createUserDto.name,
      email: createUserDto.email,
      password: await bcrypt.hash(createUserDto.password, 10),
    })

    return { message: 'ユーザーの登録に成功しました' }
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find()
  }

  async findOne(id: number): Promise<User> {
    return this.usersRepository.findOneOrFail(id)
  }

  // update, removeメソッドも同様に実装
}
```

## E2Eテストの実装

### テスト用TypeORM設定

```typescript
// ormconfig.test.ts
module.exports = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '3306',
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'meetup',
  synchronize: true, // テスト環境のみ有効化
  logging: true,
  dropSchema: true,
  entities: ['src/entities/*.ts'],
  migrations: ['src/databases/migrations/*.ts'],
}
```

### E2Eテストコード

```bash
npm install randomstring typeorm-seeding
```

```typescript
// test/user.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import * as request from 'supertest'
import { useRefreshDatabase } from 'typeorm-seeding'
import { User } from '../src/entities/user.entity'
import { AppModule } from '../src/modules/app.module'
import { CreateUserDto } from '../src/dto/create-user.dto'

describe('UserController (E2E)', () => {
  let app: INestApplication

  beforeEach(async () => {
    await useRefreshDatabase()
  })

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TypeOrmModule.forFeature([User]), AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('ユーザー登録テスト', () => {
    it('正常にユーザーを登録できる', async () => {
      const body: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1234',
      }

      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Accept', 'application/json')
        .send(body)

      expect(res.status).toEqual(201)
      expect(res.body.message).toEqual('ユーザーの登録に成功しました')
    })

    it('重複メールアドレスでエラーになる', async () => {
      const body: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1234',
      }

      await request(app.getHttpServer()).post('/users').send(body)

      const res = await request(app.getHttpServer()).post('/users').send(body)

      expect(res.status).toEqual(400)
    })
  })
})
```

### テストスクリプトの設定

```json
// package.json
{
  "scripts": {
    "test:e2e": "jest --runInBand --forceExit --detectOpenHandles --config ./test/jest-e2e.json"
  }
}
```

テスト実行：

```bash
npm run test:e2e
```

## GitHub Actionsの設定

### テスト用Dockerfile

```dockerfile
# DockerfileTest
FROM node:14.16.1-alpine as build-stage

WORKDIR /work

COPY . /work/

RUN npm install

CMD ["npm","run","test:e2e"]
```

### テスト用docker-compose

```yaml
# unit-test.yml
version: '3'

services:
  app:
    build:
      context: "."
      dockerfile: "DockerfileTest"
    container_name: github-actions-api-test
    ports:
      - '3000:3000'
    environment:
      PORT: 3000
      TZ: 'Asia/Tokyo'
      DB_HOST: 'testdb'
      DB_PORT: '3306'
      DB_USERNAME: 'root'
      DB_PASSWORD: 'password'
      DB_NAME: 'meetup'
    depends_on:
      - testdb

  testdb:
    image: mysql:8.0
    command: mysqld --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    container_name: db_container_e2e_test
    ports:
      - 3306:3306
    environment:
      TZ: 'Asia/Tokyo'
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: meetup
```

### GitHub Actionsワークフロー

```yaml
# .github/workflows/run_test.yml
name: Run E2E Tests

on:
  push:
    branches:
      - main

jobs:
  run-test:
    name: Run E2E Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Run tests with docker-compose
        run: |
          docker-compose -f ./unit-test.yml build
          docker-compose -f ./unit-test.yml up --abort-on-container-exit
        working-directory: ./
```

## まとめ

NestJS + Jest + GitHub ActionsでCI環境を構築する手順を解説しました。

**構築したもの：**
- NestJSを使ったCRUDアプリケーション
- TypeORMとMySQLを使ったデータベース連携
- Jestを使ったE2Eテスト
- GitHub Actionsによる自動テスト実行

**重要なポイント：**
- TypeORMの`synchronize`はテスト環境のみで有効化
- E2Eテストでは`beforeEach`でデータベースをリセット
- docker-composeで本番環境に近い構成でテスト
- GitHub Actionsでプッシュごとに自動テスト実行

このCI環境により、コード変更による不具合を早期に検出できます。
