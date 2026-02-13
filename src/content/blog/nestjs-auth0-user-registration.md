---
title: 'NestJSでAuth0 Management APIを使ったユーザー登録'
description: 'Auth0のManagement APIとNestJSを使って、プログラムからAuth0にユーザーを登録する方法を解説します。REST APIとGraphQL両方の実装例を紹介します。'
date: '2022-10-12'
tags:
  - nestjs
  - auth0
  - user-management
---

## Auth0 Management APIとは

Auth0 Management APIは、Auth0のリソース（ユーザー、アプリケーション、接続など）をプログラムから操作するためのREST APIです。

**主な用途**

- ユーザーの作成・更新・削除
- ロールやパーミッションの管理
- ログの取得と分析
- アプリケーション設定の管理

## 事前準備

### 1. パッケージのインストール

```bash
npm install auth0
npm install -D @types/auth0
```

### 2. Auth0でアプリケーションを作成

Auth0ダッシュボードで**Machine to Machine Application**を作成し、以下の情報を取得します：

- **Domain**: `your-tenant.auth0.com`
- **Client ID**: アプリケーションID
- **Client Secret**: シークレットキー

### 3. 必要なスコープを付与

Management APIに対して以下のスコープを付与します：

- `create:users`: ユーザーの作成
- `read:users`: ユーザー情報の取得
- `update:users`: ユーザー情報の更新
- `delete:users`: ユーザーの削除（必要に応じて）

## NestJSでの実装

### 環境変数の設定

```typescript
// config/configuration.ts
export default () => ({
  auth0: {
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
  },
})
```

```bash
# .env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
```

### Auth0モジュールの実装

#### Module

```typescript
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Auth0Service } from './auth0.service'

@Module({
  imports: [ConfigModule],
  providers: [Auth0Service],
  exports: [Auth0Service],
})
export class Auth0Module {}
```

#### Service

```typescript
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ManagementClient, User } from 'auth0'

export interface CreateUserInput {
  email: string
  password: string
  name?: string
}

export interface CreateUserOutput {
  userId: string
  email: string
}

@Injectable()
export class Auth0Service {
  private readonly client: ManagementClient
  private readonly connection = 'Username-Password-Authentication'

  constructor(private configService: ConfigService) {
    this.client = new ManagementClient({
      domain: this.configService.get<string>('auth0.domain')!,
      clientId: this.configService.get<string>('auth0.clientId')!,
      clientSecret: this.configService.get<string>('auth0.clientSecret')!,
      scope: 'create:users read:users update:users',
    })
  }

  async createUser(input: CreateUserInput): Promise<CreateUserOutput> {
    try {
      const user = await this.client.createUser({
        connection: this.connection,
        email: input.email,
        password: input.password,
        name: input.name,
        email_verified: false,
      })

      if (!user.user_id) {
        throw new Error('User ID not returned from Auth0')
      }

      return {
        userId: user.user_id,
        email: user.email!,
      }
    } catch (error) {
      this.handleAuth0Error(error)
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      return await this.client.getUser({ id: userId })
    } catch (error) {
      this.handleAuth0Error(error)
    }
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    try {
      return await this.client.updateUser({ id: userId }, data)
    } catch (error) {
      this.handleAuth0Error(error)
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.client.deleteUser({ id: userId })
    } catch (error) {
      this.handleAuth0Error(error)
    }
  }

  private handleAuth0Error(error: any): never {
    if (error.statusCode === 409) {
      throw new InternalServerErrorException('User already exists')
    }

    if (error.statusCode === 400) {
      throw new InternalServerErrorException(
        `Invalid input: ${error.message}`,
      )
    }

    throw new InternalServerErrorException(
      `Auth0 error: ${error.message || 'Unknown error'}`,
    )
  }
}
```

## REST APIでの実装例

### Controller

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common'
import { Auth0Service, CreateUserInput } from './auth0.service'

export class CreateUserDto {
  email: string
  password: string
  name?: string
}

export class UpdateUserDto {
  name?: string
  email?: string
}

@Controller('users')
export class UsersController {
  constructor(private readonly auth0Service: Auth0Service) {}

  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    return this.auth0Service.createUser(dto)
  }

  @Get(':userId')
  async getUser(@Param('userId') userId: string) {
    return this.auth0Service.getUserById(userId)
  }

  @Put(':userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.auth0Service.updateUser(userId, dto)
  }

  @Delete(':userId')
  async deleteUser(@Param('userId') userId: string) {
    await this.auth0Service.deleteUser(userId)
    return { message: 'User deleted successfully' }
  }
}
```

### DTOのバリデーション

```typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsString()
  @IsOptional()
  name?: string
}
```

```bash
npm install class-validator class-transformer
```

## GraphQL APIでの実装例

### Types

```typescript
import { Field, InputType, ObjectType } from '@nestjs/graphql'

@InputType()
export class CreateUserInput {
  @Field()
  email: string

  @Field()
  password: string

  @Field({ nullable: true })
  name?: string
}

@ObjectType()
export class CreateUserOutput {
  @Field()
  userId: string

  @Field()
  email: string
}
```

### Resolver

```typescript
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { Auth0Service } from '../auth0/auth0.service'
import { CreateUserInput, CreateUserOutput } from './user.types'

@Resolver()
export class UsersResolver {
  constructor(private readonly auth0Service: Auth0Service) {}

  @Mutation(() => CreateUserOutput)
  async createUser(
    @Args('input') input: CreateUserInput,
  ): Promise<CreateUserOutput> {
    return this.auth0Service.createUser(input)
  }

  @Query(() => String)
  async getUserById(@Args('userId') userId: string) {
    const user = await this.auth0Service.getUserById(userId)
    return JSON.stringify(user)
  }
}
```

### GraphQLクエリ例

```graphql
# ユーザー作成
mutation CreateUser {
  createUser(
    input: {
      email: "user@example.com"
      password: "SecurePassword123!"
      name: "John Doe"
    }
  ) {
    userId
    email
  }
}

# ユーザー取得
query GetUser {
  getUserById(userId: "auth0|123456789")
}
```

## セキュリティのベストプラクティス

### 1. パスワードポリシー

Auth0側でパスワードポリシーを設定します：

- 最小8文字以上
- 大文字・小文字・数字・記号を含む
- 一般的なパスワードを禁止

### 2. 環境変数の管理

```typescript
// ❌ ハードコード（危険）
const client = new ManagementClient({
  domain: 'your-tenant.auth0.com',
  clientId: 'hardcoded-id',
  clientSecret: 'hardcoded-secret',
})

// ✅ 環境変数で管理
const client = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
})
```

### 3. エラーハンドリング

```typescript
try {
  await this.auth0Service.createUser(input)
} catch (error) {
  if (error.message.includes('already exists')) {
    // ユーザーが既に存在する場合の処理
    throw new ConflictException('User already exists')
  }
  throw error
}
```

### 4. レート制限

Auth0 Management APIにはレート制限があります：

```typescript
import { Throttle } from '@nestjs/throttler'

@Controller('users')
export class UsersController {
  @Throttle(10, 60) // 60秒間に10リクエストまで
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    return this.auth0Service.createUser(dto)
  }
}
```

## テストの実装

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { Auth0Service } from './auth0.service'

describe('Auth0Service', () => {
  let service: Auth0Service

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'auth0.domain': 'test.auth0.com',
        'auth0.clientId': 'test-client-id',
        'auth0.clientSecret': 'test-secret',
      }
      return config[key]
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Auth0Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<Auth0Service>(Auth0Service)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // 実際のAuth0 APIを呼ばないモックテストを実装
})
```

## まとめ

Auth0 Management APIをNestJSで使うには：

- **認証情報の管理**: 環境変数で安全に管理
- **エラーハンドリング**: 適切なエラー処理とユーザーフィードバック
- **セキュリティ**: パスワードポリシーとレート制限を実装
- **バリデーション**: DTOでの入力検証
- **テスト**: モックを使った単体テスト

REST APIとGraphQL両方で実装できるため、プロジェクトに応じて選択できます。

### 参考リンク

- [Auth0 Management API](https://auth0.com/docs/api/management/v2)
- [auth0 npm package](https://www.npmjs.com/package/auth0)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
