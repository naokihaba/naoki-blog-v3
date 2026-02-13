---
title: 'TypeORMでEntityを定義する - 基礎から実践まで'
description: 'TypeORMでEntityを定義する方法を、基本的なデコレータからリレーション、パフォーマンス最適化まで実践的に解説します。'
date: '2021-11-28'
tags:
  - typeorm
  - typescript
  - database
---

## TypeORMのEntityとは

TypeORMのEntityは、データベーステーブルとTypeScriptクラスをマッピングするためのクラスです。

**Entityの役割**

- データベーステーブルの構造を定義
- カラムの型や制約を指定
- テーブル間のリレーションを表現
- オブジェクト指向のデータ操作を実現

## 基本的なEntity定義

### 最小構成のEntity

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column()
  email: string
}
```

### 主要なデコレータ

| デコレータ | 説明 |
|-----------|------|
| `@Entity()` | クラスがEntityであることを宣言 |
| `@PrimaryGeneratedColumn()` | 自動採番の主キー |
| `@PrimaryColumn()` | 手動設定の主キー |
| `@Column()` | 通常のカラム |
| `@CreateDateColumn()` | 作成日時（自動設定） |
| `@UpdateDateColumn()` | 更新日時（自動更新） |
| `@DeleteDateColumn()` | 削除日時（ソフトデリート用） |

## カラム定義の詳細

### カラムの型指定

```typescript
@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number

  // 文字列型
  @Column('varchar', { length: 255 })
  name: string

  // 数値型（整数）
  @Column('int', { unsigned: true })
  price: number

  // 数値型（小数）
  @Column('decimal', { precision: 10, scale: 2 })
  weight: number

  // 真偽値
  @Column('boolean', { default: true })
  isActive: boolean

  // テキスト
  @Column('text')
  description: string

  // 日付
  @Column('date')
  publishedAt: Date

  // JSON
  @Column('json', { nullable: true })
  metadata: object
}
```

### NULLを許容するカラム

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  // NULLを許容
  @Column({ nullable: true })
  phoneNumber: string | null

  // デフォルト値を設定
  @Column({ default: 'user' })
  role: string

  // NULLの初期値を明示（TypeScript側の型安全性のため）
  @Column({ nullable: true })
  bio: string | null = null
}
```

### タイムスタンプカラム

```typescript
@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  // 作成日時（INSERT時に自動設定）
  @CreateDateColumn()
  readonly createdAt: Date

  // 更新日時（UPDATE時に自動更新）
  @UpdateDateColumn()
  readonly updatedAt: Date

  // 削除日時（ソフトデリート用）
  @DeleteDateColumn()
  readonly deletedAt: Date | null
}
```

## リレーションの定義

### One-to-One（1対1）

```typescript
// User Entity
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: true, // Userを保存時にProfileも自動保存
  })
  @JoinColumn() // 外部キーを持つ側に付ける
  profile: Profile
}

// Profile Entity
@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  bio: string

  @OneToOne(() => User, (user) => user.profile)
  user: User
}
```

### One-to-Many / Many-to-One（1対多）

```typescript
// User Entity（親）
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @OneToMany(() => Post, (post) => post.user, {
    cascade: true, // Userを保存時にPostも自動保存
  })
  posts: Post[]
}

// Post Entity（子）
@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: 'CASCADE', // Userが削除されたらPostも削除
  })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column()
  userId: number // 外部キーのカラム
}
```

### Many-to-Many（多対多）

```typescript
// Student Entity
@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @ManyToMany(() => Course, (course) => course.students)
  @JoinTable({ // 中間テーブルを作成する側に付ける
    name: 'student_courses',
    joinColumn: { name: 'student_id' },
    inverseJoinColumn: { name: 'course_id' },
  })
  courses: Course[]
}

// Course Entity
@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @ManyToMany(() => Student, (student) => student.courses)
  students: Student[]
}
```

## リレーションオプションの詳細

### cascade（カスケード）

親エンティティの操作を子エンティティに伝播させます。

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @OneToMany(() => Post, (post) => post.user, {
    cascade: true, // insert, update, remove すべて
    // または個別に指定
    // cascade: ['insert', 'update']
  })
  posts: Post[]
}

// 使用例
const user = new User()
user.posts = [new Post(), new Post()]
await repository.save(user) // Userと一緒にPostsも保存される
```

### eager / lazy（読み込み方式）

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  // Eager Loading: Userを取得時に自動でPostsも取得
  @OneToMany(() => Post, (post) => post.user, {
    eager: true,
  })
  posts: Post[]
}

// Lazy Loading
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  // Promise型にする
  @OneToMany(() => Post, (post) => post.user)
  posts: Promise<Post[]>
}

// 使用例
const user = await userRepository.findOne({ where: { id: 1 } })
const posts = await user.posts // Promiseをawaitで解決
```

### onDelete / onUpdate（外部キー制約）

```typescript
@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: 'CASCADE',    // Userが削除されたらPostも削除
    // onDelete: 'SET NULL', // Userが削除されたらuser_idをNULLに
    // onDelete: 'RESTRICT', // Postが存在する場合はUserを削除不可
    onUpdate: 'CASCADE',    // UserのIDが変更されたらuser_idも更新
  })
  @JoinColumn({ name: 'user_id' })
  user: User
}
```

## パフォーマンス最適化

### createForeignKeyConstraints

外部キー制約を作成しないことでパフォーマンスを向上させます。

```typescript
@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => User, (user) => user.posts, {
    createForeignKeyConstraints: false, // 外部キー制約を作成しない
  })
  @JoinColumn({ name: 'user_id' })
  user: User
}
```

**注意点**

- データ整合性はアプリケーション側で保証する必要がある
- 高速な書き込みが必要な場合に有効

### persistence

保存時の余分なクエリを抑制します。

```typescript
@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => User, (user) => user.posts, {
    persistence: false, // 保存時にリレーションを永続化しない
  })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column()
  userId: number // 外部キーは直接操作
}

// 使用例
const post = new Post()
post.title = 'Hello'
post.userId = 1 // userオブジェクトではなく、直接IDを設定
await repository.save(post) // 余分なクエリが発生しない
```

## Constructorの定義

オブジェクトの不変条件を満たすために、必須フィールドを受け取るConstructorを定義します。

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  readonly id: number

  @Column()
  name: string

  @Column()
  email: string

  @Column({ default: true })
  isActive: boolean = true

  @CreateDateColumn()
  readonly createdAt: Date

  constructor(name: string, email: string) {
    this.name = name
    this.email = email
  }
}

// 使用例
const user = new User('John Doe', 'john@example.com')
await repository.save(user)
```

## MySQLの型対応表

| TypeScript | MySQL | TypeORMの型 |
|-----------|-------|------------|
| `number` | TINYINT | `'tinyint'` |
| `number` | SMALLINT | `'smallint'` |
| `number` | INT | `'int'` |
| `number` | BIGINT | `'bigint'` |
| `number` | DECIMAL | `'decimal'` |
| `number` | FLOAT | `'float'` |
| `string` | VARCHAR | `'varchar'` |
| `string` | TEXT | `'text'` |
| `boolean` | TINYINT(1) | `'boolean'` |
| `Date` | DATETIME | `'datetime'` |
| `Date` | TIMESTAMP | `'timestamp'` |
| `object` | JSON | `'json'` |

## ベストプラクティス

### 1. readonlyの活用

自動生成されるフィールドや変更されないフィールドには`readonly`を付けます。

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  readonly id: number // 自動生成されるIDは変更不可

  @CreateDateColumn()
  readonly createdAt: Date // 作成日時は変更不可
}
```

### 2. NULLの明示的な初期化

TypeScriptの型安全性のため、NULL許容カラムには初期値を設定します。

```typescript
@Column({ nullable: true })
phoneNumber: string | null = null // 明示的にnullで初期化
```

### 3. Commentの活用

データベースのカラムにコメントを付けることでドキュメント化できます。

```typescript
@Column('varchar', { comment: 'ユーザーのメールアドレス' })
email: string
```

### 4. unsigned属性（MySQL）

負の値を扱わない場合は`unsigned`を指定して範囲を拡大します。

```typescript
@Column('int', { unsigned: true }) // 0 〜 4,294,967,295
price: number
```

## まとめ

TypeORMのEntityを定義する際のポイント：

- **デコレータ**: 適切なデコレータでカラムとリレーションを定義
- **型指定**: TypeScriptとデータベースの型を正しくマッピング
- **リレーション**: cascade、eager、onDeleteなどのオプションを理解
- **パフォーマンス**: 必要に応じて外部キー制約や永続化を制御
- **型安全性**: readonly、NULL初期化、Constructorで型安全なコードを実現

適切なEntity定義により、型安全で保守性の高いデータベース操作が可能になります。

### 参考リンク

- [TypeORM 公式ドキュメント](https://typeorm.io/)
- [Decorator Reference](https://github.com/typeorm/typeorm/blob/master/docs/decorator-reference.md)
- [Relations](https://typeorm.io/relations)
