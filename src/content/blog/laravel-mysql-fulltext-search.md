---
title: 'LaravelでMySQL全文検索を実装する'
description: 'MySQLのN-gram全文検索インデックスを使って、Laravelアプリケーションに高速な全文検索機能を実装する方法を解説します。'
date: '2022-01-02'
tags:
  - laravel
  - mysql
  - fulltext-search
---

## LIKE検索の課題

`LIKE '%keyword%'` を使った部分一致検索は、データ量が増えるとパフォーマンスが低下します。

```sql
-- インデックスが使えない
SELECT * FROM shops WHERE name LIKE '%太郎%'
```

MySQLの**全文検索インデックス（Fulltext Index）**を使うことで、この問題を解決できます。

## N-gramパーサーとは

MySQLの全文検索では、**N-gramパーサー**を使用することで日本語にも対応できます。

N-gramは文字列をN文字ずつに分割してインデックスを作成する方法です：

```
"サンプル太郎" → ["サン", "ンプ", "プル", "ル太", "太郎"]（2-gram/Bigram）
```

これにより、部分一致検索でもインデックスを活用できます。

## 実装手順

### 1. Modelとmigrationを生成

```bash
php artisan make:model Shop --migration
```

### 2. Modelを定義

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shop extends Model
{
    use HasFactory;

    protected $table = 'shops';

    protected $fillable = ['name', 'age', 'gender_id'];
}
```

### 3. 全文検索用のmigrationを作成

仮想カラムと全文検索インデックスを定義します。

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CreateShopsTable extends Migration
{
    public function up()
    {
        Schema::create('shops', function (Blueprint $table) {
            $table->bigIncrements('id')->comment('店舗ID');
            $table->string('name', 255)->comment('店舗名');
            $table->unsignedInteger('age')->comment('設立年数');
            $table->smallInteger('gender_id')->comment('対象性別');
            $table->timestamps();
        });

        // 検索用の仮想カラムを追加
        DB::statement("
            ALTER TABLE shops
            ADD free_word TEXT AS (
                CONCAT(
                    IFNULL(age, ''), ' ',
                    IFNULL(name, ''), ' ',
                    CASE gender_id
                        WHEN 1 THEN '男性'
                        WHEN 2 THEN '女性'
                        ELSE ''
                    END
                )
            ) STORED
        ");

        // N-gram全文検索インデックスを作成
        DB::statement("
            ALTER TABLE shops
            ADD FULLTEXT INDEX ftx_free_word (free_word)
            WITH PARSER ngram
        ");
    }

    public function down()
    {
        Schema::dropIfExists('shops');
    }
}
```

### migrationの解説

#### 仮想カラム（Generated Column）

```sql
ALTER TABLE shops ADD free_word TEXT AS (...) STORED
```

- **仮想カラム**: 他のカラムから自動生成されるカラム
- **STORED**: 物理的に保存される（検索インデックスを作成可能）
- 複数のカラムを結合して検索対象を作成

#### CONCAT関数

```sql
CONCAT(IFNULL(age, ''), ' ', IFNULL(name, ''), ' ', ...)
```

- 複数の文字列を連結
- `IFNULL`: NULL値を空文字列に変換

#### CASE式

```sql
CASE gender_id
    WHEN 1 THEN '男性'
    WHEN 2 THEN '女性'
    ELSE ''
END
```

- IDを日本語の名称に変換
- 日本語でも検索可能にする

### 4. Seederでテストデータを作成

```php
<?php

namespace Database\Seeders;

use App\Models\Shop;
use Illuminate\Database\Seeder;

class DummyShopsSeeder extends Seeder
{
    public function run()
    {
        $data = [
            ['name' => 'サンプル太郎', 'age' => 25, 'gender_id' => 1],
            ['name' => 'サンプル花子', 'age' => 30, 'gender_id' => 2],
            ['name' => 'サンプル二郎', 'age' => 20, 'gender_id' => 1],
        ];

        Shop::query()->insert($data);
    }
}
```

```bash
php artisan migrate
php artisan db:seed --class=DummyShopsSeeder
```

### 5. Controllerで全文検索を実装

```php
<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    public function index(Request $request)
    {
        $query = Shop::query();
        $freeWord = $request->input('free_word');

        if ($freeWord) {
            // 全文検索を実行
            $query->whereRaw(
                "MATCH(free_word) AGAINST (? IN BOOLEAN MODE)",
                [$freeWord]
            );
        }

        $shops = $query
            ->select(['id', 'name', 'age', 'gender_id'])
            ->paginate(20);

        return view('index', [
            'shops' => $shops,
            'parameters' => $request->all(),
        ]);
    }
}
```

### 全文検索の解説

#### MATCH ... AGAINST構文

```sql
MATCH(free_word) AGAINST ('検索キーワード' IN BOOLEAN MODE)
```

- **MATCH**: 全文検索インデックスを使用
- **AGAINST**: 検索キーワードを指定
- **BOOLEAN MODE**: 演算子を使った詳細な検索が可能

#### BOOLEANモードの演算子

```php
// AND検索
$query->whereRaw("MATCH(free_word) AGAINST ('+太郎 +男性' IN BOOLEAN MODE)");

// OR検索
$query->whereRaw("MATCH(free_word) AGAINST ('太郎 花子' IN BOOLEAN MODE)");

// NOT検索
$query->whereRaw("MATCH(free_word) AGAINST ('+サンプル -花子' IN BOOLEAN MODE)");
```

### 6. Viewの実装

```php
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>全文検索デモ</title>
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">
</head>
<body>
<div class="container">
    <div class="card">
        <div class="card-header">全文検索</div>
        <div class="card-body">
            <form action="/admin" method="GET">
                <div class="mb-2">
                    <label for="free_word" class="form-label">キーワード</label>
                    <input type="text"
                           class="form-control"
                           name="free_word"
                           id="free_word"
                           value="{{ $parameters['free_word'] ?? '' }}">
                </div>
                <button type="submit" class="btn btn-primary">検索</button>
                <a href="/admin" class="btn btn-secondary">クリア</a>
            </form>
        </div>
    </div>

    <div class="mt-3">
        <p>検索結果: {{ $shops->total() }}件</p>
        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>名前</th>
                    <th>年齢</th>
                    <th>性別</th>
                </tr>
            </thead>
            <tbody>
                @foreach($shops as $shop)
                    <tr>
                        <td>{{ $shop->id }}</td>
                        <td>{{ $shop->name }}</td>
                        <td>{{ $shop->age }}</td>
                        <td>{{ $shop->gender_id === 1 ? '男性' : '女性' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
        {{ $shops->links() }}
    </div>
</div>
</body>
</html>
```

## セキュリティ上の注意点

### プリペアドステートメントの使用

`whereRaw`を使う場合、必ずプレースホルダー（`?`）を使用してSQLインジェクション対策を行います。

```php
// ❌ 危険: SQLインジェクションのリスク
$query->whereRaw("MATCH(free_word) AGAINST ('$freeWord' IN BOOLEAN MODE)");

// ✅ 安全: プリペアドステートメント
$query->whereRaw("MATCH(free_word) AGAINST (? IN BOOLEAN MODE)", [$freeWord]);
```

### 入力値のバリデーション

```php
$validated = $request->validate([
    'free_word' => 'nullable|string|max:255',
]);
```

## LIKE検索との比較

### LIKE検索

```php
// インデックスが使えない
$query->where('name', 'LIKE', "%{$keyword}%");
```

- **メリット**: シンプルな実装
- **デメリット**: データ量が増えると遅い、インデックスが使えない

### 全文検索

```php
// 全文検索インデックスを使用
$query->whereRaw("MATCH(free_word) AGAINST (? IN BOOLEAN MODE)", [$keyword]);
```

- **メリット**: 高速、大量データでも性能が安定
- **デメリット**: セットアップが必要、ストレージ使用量が増える

## まとめ

MySQLの全文検索を使うことで：

- **高速な検索**: インデックスを活用した効率的な検索
- **日本語対応**: N-gramパーサーで日本語の部分一致検索が可能
- **柔軟な検索**: BOOLEANモードでAND/OR/NOT検索に対応

大量のテキストデータを検索する必要がある場合、全文検索の導入を検討する価値があります。

### 参考リンク

- [MySQL 全文検索](https://dev.mysql.com/doc/refman/8.0/ja/fulltext-search.html)
- [N-gramパーサー](https://dev.mysql.com/doc/refman/8.0/ja/fulltext-search-ngram.html)
- [Laravel クエリビルダ](https://laravel.com/docs/queries)
