---
title: 'TypeORMのTransformer機能でマスターデータを扱う'
description: 'TypeORMのTransformer機能を使って、データベースの数値IDとアプリケーションのマスターオブジェクトを相互変換する実装パターンを紹介します。'
date: '2021-11-28'
tags:
  - typescript
  - typeorm
  - database
---

## 課題

データベースには数値IDで保存されているマスターデータ（都道府県、ステータスなど）を、アプリケーション層ではIDと名前を持つオブジェクトとして扱いたい場合があります。

TypeORMの**Transformer機能**を使うことで、この変換を自動化できます。

## 実装例：都道府県マスター

### 1. 汎用的なMasterクラスを定義

IDと名前を持つマスターデータを管理する基底クラスを作成します。

```ts
export interface IMaster {
  id: number
  name: string
}

export class Master {
  private readonly masters: IMaster[]

  constructor(masters: IMaster[]) {
    this.masters = masters
  }

  findById(id: number): IMaster | undefined {
    return this.masters.find((v) => v.id === Number(id))
  }

  findByName(name: string): IMaster | undefined {
    return this.masters.find((v) => v.name === name)
  }
}
```

### 2. 都道府県マスターを実装

```ts
import { IMaster, Master } from './master'

const PREFECTURES: IMaster[] = [
  { id: 1, name: '北海道' },
  { id: 2, name: '青森県' },
  { id: 3, name: '岩手県' },
  // ...
  { id: 47, name: '沖縄県' },
]

class PrefectureMaster extends Master {
  constructor() {
    super(PREFECTURES)
  }
}

export const Prefecture = new PrefectureMaster()
```

### 3. EntityでTransformerを使用

`transformer`オプションを指定することで、データベースとアプリケーション間の変換を自動化できます。

```ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'
import { Prefecture } from './prefecture.master'
import { IMaster } from './master'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column('varchar')
  name: string

  @Column('tinyint', {
    unsigned: true,
    comment: '都道府県ID',
    transformer: {
      // DB → アプリケーション: IDからIMasterオブジェクトへ
      from(id: number): IMaster | undefined {
        return Prefecture.findById(id)
      },
      // アプリケーション → DB: IMasterオブジェクトからIDへ
      to(value: IMaster): number {
        return value.id
      },
    },
  })
  prefecture: IMaster
}
```

## 使用例

### データの取得

```ts
const user = await userRepository.findOne({ where: { id: 1 } })

console.log(user.prefecture)
// { id: 13, name: '東京都' }
```

### データの保存

```ts
const newUser = userRepository.create({
  name: '山田太郎',
  prefecture: { id: 13, name: '東京都' },
})

await userRepository.save(newUser)
// DBには prefecture = 13 として保存される
```

## Transformerのメリット

### 1. 型安全性

IDを直接扱うのではなく、オブジェクトとして扱うことで型安全性が向上します。

```ts
// ❌ IDだけでは何のIDか不明
user.prefecture_id = 13

// ✅ オブジェクトなので明確
user.prefecture = { id: 13, name: '東京都' }
```

### 2. コードの可読性

マスターデータの名前に直接アクセスできます。

```ts
// ❌ 別途マスターを参照する必要がある
const prefectureName = Prefecture.findById(user.prefecture_id)?.name

// ✅ 直接アクセス可能
const prefectureName = user.prefecture.name
```

### 3. ビジネスロジックの簡素化

データの変換処理がEntity層で完結するため、ビジネスロジックがシンプルになります。

## 注意点

### Null/Undefinedの扱い

データベースでNULL許可する場合は、Transformerでもそれを考慮する必要があります。

```ts
@Column('tinyint', {
  nullable: true,
  transformer: {
    from(id: number | null): IMaster | null {
      return id ? Prefecture.findById(id) ?? null : null
    },
    to(value: IMaster | null): number | null {
      return value?.id ?? null
    },
  },
})
prefecture: IMaster | null
```

### クエリビルダーでの使用

クエリビルダーを使う場合は、変換が自動で行われないため注意が必要です。

```ts
// IDで検索する必要がある
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.prefecture = :prefectureId', { prefectureId: 13 })
  .getMany()
```

## まとめ

TypeORMのTransformer機能を使うことで：

- データベースとアプリケーション間のデータ変換を自動化
- 型安全性とコードの可読性が向上
- マスターデータの扱いがシンプルに

マスターデータを多く扱うアプリケーションで特に有効な機能です。
