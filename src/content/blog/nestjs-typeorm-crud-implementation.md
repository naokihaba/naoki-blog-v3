---
title: 'NestJS + TypeORM 0.3でCRUD APIを構築する'
description: 'NestJS V.9とTypeORM 0.3を使った最新のREST API構築方法を解説します。マイグレーション管理、バリデーション、CRUD操作の実装を含む実践的なガイドです。'
date: '2021-12-19'
tags:
  - typescript
  - nestjs
  - typeorm
  - api
---

## はじめに

NestJS V.9とTypeORM 0.3系を使った、最新のREST API構築方法を解説します。

GitHubリポジトリ: [nestjs-demo-rest-api](https://github.com/naoki-haba/nestjs-demo-rest-api)

## 環境

```bash
nest -v
# 9.1.4

# package.json
"@nestjs/typeorm": "^9.0.1"
"typeorm": "^0.3.10"
```

**注意**: Windows環境での動作確認は行っていません。

## NestJSとは

[NestJS](https://nestjs.com/)は、効率的でスケーラブルなNode.jsサーバーサイドアプリケーションを構築するためのフレームワークです。

主な特徴：
- TypeScriptを完全サポート
- OOP（オブジェクト指向）、FP（関数型）、FRP（関数型リアクティブ）の要素を統合
- Angular風のアーキテクチャ
- 依存性注入（DI）によるテスタビリティの向上

## プロジェクトセットアップ

### NestJS CLIのインストール

```bash
# 作業ディレクトリを作成
mkdir nestjs-sample
cd nestjs-sample

# NestJS CLIをグローバルにインストール
npm install -g @nestjs/cli

# プロジェクトを作成（npmを選択）
nest new sample

# 依存関係をインストール
cd sample
npm install
```

### ポート番号の変更（オプション）

デフォルトの3000番ポートを変更する場合：

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3001) // ポート番号を変更
}
bootstrap()
```

### アプリケーションの起動

```bash
npm run start:dev

# 以下のログが表示されればOK
# [Nest] Starting Nest application...
# [Nest] Nest application successfully started
```

動作確認：

```bash
curl http://localhost:3001
# "Hello World!" が返ればOK
```

## CRUDリソースの生成

NestJS CLIを使って、CRUD操作の雛形を自動生成します。

```bash
# --no-specでテストファイルを生成しない
nest generate resource users --no-spec

# REST APIを選択
? What transport layer do you use? REST API

# CRUD entry pointsを有効化
? Would you like to generate CRUD entry points? Yes

# 以下のファイルが生成される
# src/users/users.controller.ts
# src/users/users.service.ts
# src/users/users.module.ts
# src/users/dto/create-user.dto.ts
# src/users/dto/update-user.dto.ts
# src/users/entities/user.entity.ts
```

公式ドキュメント: [CRUD Generator](https://docs.nestjs.com/recipes/crud-generator)

## TypeORMのセットアップ

### パッケージのインストール

```bash
npm install --save @nestjs/typeorm typeorm sqlite3
```

今回は開発環境の簡便さのためSQLiteを使用しますが、本番環境ではMySQL、PostgreSQLなどの使用を推奨します。

参考: [NestJS Database](https://docs.nestjs.com/techniques/database)

### TypeORM設定ファイルの作成

**⚠️ 警告：本番環境では環境変数から接続情報を取得してください。ハードコーディングは避けてください。**

```typescript
// typeOrm.config.ts
import { DataSource } from 'typeorm'

export default new DataSource({
  type: 'sqlite',
  database: 'data/dev.sqlite',
  entities: ['dist/**/entities/**/*.entity.js'],
  migrations: ['dist/**/migrations/**/*.js'],
  logging: true,
})
```

参考記事: [API with NestJS - Database migrations with TypeORM](https://wanago.io/2022/07/25/api-nestjs-database-migrations-typeorm/)

### TypeORMコマンドの追加

```json
// package.json
{
  "scripts": {
    "start:dev": "nest build && nest start --watch",
    "typeorm": "ts-node ./node_modules/typeorm/cli",
    "typeorm:run-migrations": "npm run typeorm migration:run -- -d ./typeOrm.config.ts",
    "typeorm:generate-migration": "npm run typeorm -- -d ./typeOrm.config.ts migration:generate ./migrations/$npm_config_name",
    "typeorm:create-migration": "npm run typeorm -- migration:create ./migrations/$npm_config_name",
    "typeorm:revert-migration": "npm run typeorm -- -d ./typeOrm.config.ts migration:revert"
  }
}
```

**Windows環境の場合**: `$npm_config_name`を`%npm_config_name%`に変更してください。

### AppModuleへの統合

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/dev.sqlite',
      logging: true,
      entities: ['dist/**/entities/**/*.entity.js'],
      migrations: ['dist/**/migrations/**/*.js'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## Entity定義

```typescript
// src/users/entities/user.entity.ts
import { Column, PrimaryGeneratedColumn, Entity } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ comment: 'アカウントID' })
  readonly id: number

  @Column('varchar', { comment: 'アカウント名' })
  name: string

  constructor(name: string) {
    this.name = name
  }
}
```

公式ドキュメント: [NestJS Database - Entities](https://docs.nestjs.com/techniques/database#repository-pattern)

## マイグレーション

### マイグレーションファイルの生成

```bash
npm run typeorm:generate-migration --name=CreateUser

# Migration ./migrations/1665664827418-CreateUser.ts has been generated successfully.
```

### マイグレーションの実行

```bash
npm run typeorm:run-migrations

# Migration CreateUser1665664827418 has been executed successfully.
```

マイグレーション実行後、`data/dev.sqlite`ファイルが作成され、`users`テーブルが生成されます。

## バリデーションの実装

### パッケージのインストール

```bash
npm install --save class-validator class-transformer
```

### DTOへのバリデーション追加

```typescript
// src/users/dto/create-user.dto.ts
import { IsNotEmpty, MaxLength } from 'class-validator'

export class CreateUserDto {
  @IsNotEmpty({ message: 'アカウント名は必須です' })
  @MaxLength(255, { message: 'アカウント名は255文字以内で入力してください' })
  name: string
}
```

### グローバルバリデーションの有効化

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe())
  await app.listen(3001)
}
bootstrap()
```

公式ドキュメント: [NestJS Validation](https://docs.nestjs.com/techniques/validation)

## CRUD機能の実装

### UsersModuleへのTypeORM統合

```typescript
// src/users/users.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { User } from './entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

### Service実装

```typescript
// src/users/users.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<{ message: string }> {
    await this.userRepository
      .save({ name: createUserDto.name })
      .catch((e) => {
        throw new InternalServerErrorException(
          `[${e.message}]アカウントの登録に失敗しました。`,
        )
      })

    return { message: 'アカウントの登録に成功しました' }
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find()
  }

  async findOne(id: number): Promise<User> {
    return await this.userRepository.findOneBy({ id })
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<{ message: string }> {
    await this.userRepository
      .update(id, { name: updateUserDto.name })
      .catch((e) => {
        throw new InternalServerErrorException(
          `[${e.message}]アカウントID「${id}」の更新に失敗しました。`,
        )
      })

    return { message: `アカウントID「${id}」の更新に成功しました。` }
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.userRepository.delete(id).catch((e) => {
      throw new InternalServerErrorException(
        `[${e.message}]アカウントID「${id}」の削除に失敗しました。`,
      )
    })

    return { message: `アカウントID「${id}」の削除に成功しました。` }
  }
}
```

### Controller実装

```typescript
// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { User } from './entities/user.entity'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<{ message: string }> {
    return await this.usersService.create(createUserDto)
  }

  @Get()
  async findAll(): Promise<User[]> {
    return await this.usersService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return await this.usersService.findOne(+id)
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<{ message: string }> {
    return await this.usersService.update(+id, updateUserDto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return await this.usersService.remove(+id)
  }
}
```

## APIのテスト

### 登録

```bash
curl -X POST -H "Content-Type:application/json" \
  http://localhost:3001/users \
  -d '{"name":"サンプル太郎"}'

# {"message":"アカウントの登録に成功しました"}
```

### 全件取得

```bash
curl http://localhost:3001/users

# [{"name":"サンプル太郎","id":1}]
```

### 更新

```bash
curl -X PATCH -H "Content-Type:application/json" \
  http://localhost:3001/users/1 \
  -d '{"name":"更新したよ"}'

# {"message":"アカウントID「1」の更新に成功しました。"}
```

### 個別取得

```bash
curl http://localhost:3001/users/1

# {"name":"更新したよ","id":1}
```

### 削除

```bash
curl -X DELETE http://localhost:3001/users/1

# {"message":"アカウントID「1」の削除に成功しました。"}
```

## まとめ

NestJS V.9とTypeORM 0.3を使った、最新のREST API構築方法を解説しました。

**実装したもの：**
- TypeORMを使ったEntity定義
- マイグレーション管理
- class-validatorを使ったバリデーション
- CRUD操作の完全実装

**重要なポイント：**
- TypeORM 0.3系では、Repository APIが大幅に変更されている
- 本番環境では環境変数で設定を管理
- グローバルバリデーションで一貫したエラーハンドリング
- マイグレーションでスキーマをバージョン管理

この実装パターンは、スケーラブルなAPIの基礎として活用できます。
