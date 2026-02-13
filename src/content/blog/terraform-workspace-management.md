---
title: 'Terraform workspaceで個人ごとのAWSリソースを効率管理'
description: 'Terraform workspaceを活用すれば、10名規模のチームでも定義ファイルを分けずに個人ごとのAWSリソースを効率的に管理できます。実践的な設定例とともに解説します。'
date: '2023-04-01'
tags:
  - aws
  - terraform
  - infrastructure
---

## はじめに

Terraformのworkspace機能を使うと、同じ定義ファイルで複数の独立した環境を管理できます。

個人ごとに定義ファイルを分ける運用は、1〜2名なら問題ありませんが、10名規模になると管理が煩雑になります。workspaceを使えば、この問題を解決できます。

## workspace機能とは

workspaceは、同じTerraform定義で異なる状態ファイル（tfstate）を管理する機能です。各workspaceは独立したリソースセットを持つため、個人開発環境の分離に最適です。

詳細は[公式ドキュメント](https://developer.hashicorp.com/terraform/language/state/workspaces)を参照してください。

## 環境構築

### 前提条件

- AWS CLIがインストール済み
- IAMユーザーが作成済み（[IAMユーザー作成手順](https://docs.aws.amazon.com/ja_jp/IAM/latest/UserGuide/id_users_create.html)）
- Terraformがインストール済み（tfenv推奨: [tfenv](https://github.com/tfutils/tfenv)）

### AWS CLIの設定

```shell
aws configure --profile <profile名>

# 以下を入力
# AWS Access Key ID: アクセスキー ID
# AWS Secret Access Key: シークレットアクセスキー
# Default region name: ap-northeast-1
# Default output format: json
```

## workspaceの作成

新しいworkspaceを作成します。

```shell
terraform workspace new test

# 出力例
# Created and switched to workspace "test"!

# workspace一覧を確認
terraform workspace list
#   default
# * test
```

詳細コマンドは[公式ドキュメント](https://developer.hashicorp.com/terraform/cli/commands/workspace)を参照してください。

## Terraform定義の作成

### プロバイダー設定

作業ディレクトリを作成し、AWSプロバイダーを設定します。

```shell
mkdir terraform && cd terraform
touch main.tf
```

```terraform
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region  = "ap-northeast-1"
  profile = "default"
}
```

### リソース定義

VPCと個人ごとのALB target groupを作成します。

```shell
touch vpc.tf alb.tf
```

```terraform
# vpc.tf
resource "aws_vpc" "test" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "test"
  }
}
```

```terraform
# alb.tf
variable "personal_name_prefix" {
  type        = string
  description = <<-EOF
    個人環境ごとのPrefixを指定してください。
    指定方法：[firstname]-[lastname]
    注意：ALBの名前は32文字以内
  EOF
}

resource "aws_alb_target_group" "test" {
  name     = var.personal_name_prefix
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.test.id
}
```

## 実行

### 実行計画の確認

```shell
terraform plan -var personal_name_prefix=test

# 出力例
# Terraform will perform the following actions:
#   # aws_alb_target_group.test will be created
#   # aws_vpc.test will be created
# Plan: 2 to add, 0 to change, 0 to destroy.
```

### リソースの作成

```shell
terraform apply -var personal_name_prefix=test

# 確認後、yesを入力
# Apply complete! Resources: 2 added, 0 changed, 0 destroyed.
```

### 結果確認

各workspaceの状態ファイルは `terraform.tfstate.d` ディレクトリに分離されます。

```shell
terraform workspace list
#   default
# * test

ls terraform.tfstate.d/
# test
```

### リソースの削除

```shell
terraform destroy -var personal_name_prefix=test

# Destroy complete! Resources: 1 destroyed.
```

## まとめ

Terraform workspaceを使うことで、以下のメリットがあります：

- 定義ファイルの重複を防ぎ、メンテナンスコストを削減
- 個人ごとの環境を独立して管理
- チームスケールに応じた柔軟な運用

EC2やRDSなど、他のリソースにも同様のパターンを適用できます。
