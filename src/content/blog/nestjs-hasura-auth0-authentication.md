---
title: 'NestJSとHasuraをAuth0で認証する実装ガイド'
description: 'NestJSのAPIエンドポイントとHasuraのGraphQLをAuth0で統一的に認証する方法を解説します。Guardパターンを使った実装例とJWT検証の実践的なコード例を紹介します。'
date: '2022-08-20'
tags:
  - graphql
  - hasura
  - nestjs
  - auth0
---

## はじめに

NestJSのAPIエンドポイントとHasuraのGraphQLに対する認証基盤としてAuth0を採用した際の実装方法を解説します。

[Auth0公式サイト](https://auth0.com/jp/authentication)

## アーキテクチャ

- **Hasura**: GraphQLエンドポイントを提供。シンプルなCRUD操作を担当
- **NestJS**: Hasuraで吸収できない複雑なビジネスロジックを担当
- **Auth0**: 両方のエンドポイントを統一的に認証

## Hasuraの認証設定

### 基本設定

Hasuraの公式チュートリアルに従って設定を進めます。

- [Hasura認証チュートリアル](https://hasura.io/learn/ja/graphql/hasura/introduction/)
- [Hasura Docker Hub](https://hub.docker.com/r/hasura/graphql-engine)

### Auth0公開鍵の設定

Docker環境の場合、Auth0から公開鍵を取得し、環境変数に設定する必要があります。

#### 公開鍵の取得

[公開鍵取得手順](https://hasura.io/learn/ja/graphql/hasura/authentication/3-setup-env-vars-hasura/)に従って公開鍵を発行します。

#### docker-compose設定

```yaml
# docker-compose.yml
version: '3.6'
services:
  postgres:
    image: postgres
    restart: always
    volumes:
      - db_data:/var/lib/postgresql/data

  graphql-engine:
    image: hasura/graphql-engine:v1.0.0-beta.6
    ports:
      - "8080:8080"
    depends_on:
      - "postgres"
    restart: always
    environment:
      HASURA_GRAPHQL_DATABASE_URL: postgres://postgres:@postgres:5432/postgres
      HASURA_GRAPHQL_ENABLE_CONSOLE: "true"
      # HASURA_GRAPHQL_ADMIN_SECRET: myadminsecretkey
      HASURA_GRAPHQL_JWT_SECRET: '取得した公開鍵を設定'

volumes:
  db_data:
```

## NestJSの認証実装

NestJS側のAPIエンドポイントを直接呼び出されないよう、Auth0で保護します。

### 環境変数の設定

```env
# .env
# Auth0 Domain
AUTH0_ISSUER_URL="https://your-domain.auth0.com/"

# Auth0 Identifier
AUTH0_AUDIENCE="your-api-identifier"
```

本番環境では、`.env`ファイルではなく、Cloud Run Secretsなどのシークレット管理サービスを使用することを推奨します。

### AuthGuardの実装

NestJSの[Guard](https://docs.nestjs.com/guards)機能を使って、リクエストの認証を検証します。

#### Guardの作成

```bash
nest g guard auth/auth-guard
```

#### Guardの実装

```typescript
// src/common/guard/auth/auth-guard.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { GqlContextType } from '@nestjs/graphql'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { Reflector } from '@nestjs/core'
import { expressjwt, GetVerificationKey } from 'express-jwt'
import { expressJwtSecret } from 'jwks-rsa'
import { ConfigService } from '@nestjs/config'
import { promisify } from 'util'

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly AUTH0_AUDIENCE: string
  private readonly AUTH0_ISSUER_URL: string

  constructor(
    @InjectPinoLogger(AuthGuard.name) private readonly logger: PinoLogger,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.AUTH0_AUDIENCE = this.configService.get('AUTH0_AUDIENCE')
    this.AUTH0_ISSUER_URL = this.configService.get('AUTH0_ISSUER_URL')
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // GraphQLリクエストはスキップ（Hasura経由の場合）
    if (context.getType<GqlContextType>() === 'graphql') {
      return true
    }

    // Auth0に対してJWT Tokenの検証を実行
    const checkJwtToken = await promisify(
      expressjwt({
        secret: expressJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: `${process.env.AUTH0_ISSUER_URL}.well-known/jwks.json`,
        }) as GetVerificationKey,
        audience: this.AUTH0_AUDIENCE,
        issuer: this.AUTH0_ISSUER_URL,
        algorithms: ['RS256'],
      }),
    )

    try {
      await checkJwtToken(
        context.switchToHttp().getRequest(),
        context.switchToHttp().getResponse(),
      )
      return true
    } catch (e: unknown) {
      throw new UnauthorizedException(e)
    }
  }
}
```

### エンドポイントへの適用

```typescript
// src/app.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common'
import { AppService } from './app.service'
import { AuthGuard } from './common/guard/auth/auth-guard.guard'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @UseGuards(AuthGuard)
  @Get('/private')
  async private() {
    return { message: '認証成功' }
  }
}
```

### CORS設定

```typescript
// src/main.ts
import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { Logger } from 'nestjs-pino'
import { AllExceptionsFilter } from './common/filter/all-exceptions.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))

  const adapterHost = app.get(HttpAdapterHost)
  const httpAdapter = adapterHost.httpAdapter
  const instance = httpAdapter.getInstance()
  app.useGlobalFilters(new AllExceptionsFilter(instance))

  app.enableCors({
    origin: '*',
    allowedHeaders:
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  })

  await app.listen(3000)
}
bootstrap()
```

## 動作確認

### トークン取得スクリプト

Auth0からアクセストークンを取得します。

参考: [Auth0 + NestJS バックエンドサンプル](https://dev.classmethod.jp/articles/auth0-nestjs-backend-sample/)

```bash
#!/usr/bin/env bash

auth_url=https://your-domain.auth0.com
client_id=your_client_id
client_secret=your_client_secret
username="user@example.com"
password="password"

echo "🎁 id_tokenを取得中..."

curl -s --request POST \
  --url ${auth_url}/oauth/token \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data grant_type=password \
  --data username=${username} \
  --data password=${password} \
  --data client_id=${client_id} \
  --data client_secret=${client_secret}

echo "\n"
```

### APIテスト

取得した`id_token`を使ってAPIをテストします。

```bash
# 認証成功
curl -i -X GET 'http://localhost:3000/private' \
  -H 'Authorization: Bearer <id_token>'

# レスポンス例
# HTTP/1.1 200 OK
# Content-Type: application/json; charset=utf-8
#
# {"message":"認証成功"}

# 認証失敗（不正なトークン）
curl -i -X GET 'http://localhost:3000/private' \
  -H 'Authorization: Bearer invalid_token'

# レスポンス例
# HTTP/1.1 401 Unauthorized
```

## まとめ

Auth0を使ってNestJSとHasuraの認証を統一することで、以下のメリットが得られます：

- **一貫性**: 単一の認証基盤でマイクロサービス全体を保護
- **セキュリティ**: JWT検証により、改ざんされたトークンを検出
- **柔軟性**: Auth0の豊富な機能（MFA、ソーシャルログインなど）を活用

この実装パターンは、マイクロサービスアーキテクチャにおける認証のベストプラクティスの一つです。
