---
title: 'Nginxで特定パスをリダイレクトする設定'
description: 'Nginxで特定のパスにアクセスされた際に別のURLへリダイレクトさせる方法と、セキュリティヘッダーの設定について解説します。'
date: '2022-01-15'
tags:
  - nginx
  - webserver
  - redirect
---

## 概要

Nginxで特定のパスへのアクセスを別のURLにリダイレクトさせる方法をまとめます。

## 基本的なリダイレクト設定

特定のパスへのアクセスを301リダイレクトさせるには、`location`ブロックで`return`ディレクティブを使用します。

```conf
location /old-path/index.php {
    return 301 https://example.com/new-path;
}
```

### リダイレクトの種類

- **301**: 恒久的なリダイレクト（SEO評価が引き継がれる）
- **302**: 一時的なリダイレクト

## 実践的な設定例

Laravel/PHPアプリケーション向けのNginx設定例です。

```conf
server {
    listen 80;
    server_name example.com;
    root /var/www/html/public;
    index index.php;
    charset utf-8;

    # セキュリティヘッダー
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # メインのルーティング
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # 特定パスのリダイレクト
    location /old-path/index.php {
        return 301 https://example.com/new-path;
    }

    # PHP-FPMの設定
    location ~ \.php$ {
        fastcgi_pass app:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 静的ファイルのログを無効化
    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    # 隠しファイルへのアクセス拒否
    location ~ /\.(?!well-known).* {
        deny all;
    }

    error_page 404 /index.php;
}
```

## 主要な設定項目の説明

### セキュリティヘッダー

```conf
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
```

- **X-Frame-Options**: クリックジャッキング攻撃を防止
- **X-Content-Type-Options**: MIMEタイプスニッフィングを防止

### try_filesディレクティブ

```conf
try_files $uri $uri/ /index.php?$query_string;
```

ファイルの存在を順に確認し、存在しない場合はPHPルーターに処理を委譲します。

1. 静的ファイルとして `$uri` を探す
2. ディレクトリとして `$uri/` を探す
3. どちらも存在しなければ `/index.php` にフォールバック

## まとめ

Nginxでのリダイレクト設定は`location`と`return`を組み合わせることでシンプルに実装できます。セキュリティヘッダーも合わせて設定することで、より安全なWebサーバーを構築できます。
