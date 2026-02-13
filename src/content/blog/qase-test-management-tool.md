---
title: 'Qaseでテスト管理をスプレッドシートから脱却する'
description: 'テスト管理ツールQaseを導入して、スプレッドシートによるテスト管理から脱却した経験と、その導入方法・活用方法について解説します。'
date: '2022-02-20'
tags:
  - testing
  - test-management
  - qase
---

## スプレッドシートでのテスト管理の課題

多くのチームがスプレッドシートでテストケースを管理していますが、以下のような課題があります：

- **バージョン管理が困難**: 複数人で編集すると履歴追跡が難しい
- **テスト結果の集計が手作業**: テスト進捗の可視化に時間がかかる
- **品質のばらつき**: フォーマットが統一されず、属人化しやすい
- **自動テストとの連携が困難**: 手動テストと自動テストの結果を統合しにくい
- **検索性の低さ**: 過去のテストケースを探すのが大変

## Qaseとは

[Qase](https://qase.io/)は、テストケース管理とテスト実行を一元管理できるクラウドベースのテスト管理ツールです。

**主な特徴**

- **無料プラン**: 3ユーザーまで無料
- **手動・自動テスト対応**: 両方のテスト結果を一元管理
- **API連携**: CI/CDパイプラインと統合可能
- **エクスポート機能**: テスト計画・結果をCSV/PDFでエクスポート
- **テンプレート**: テストケースの品質を標準化

## Qaseを選んだ理由

### 1. 無料で始められる

3ユーザーまで無料で利用できるため、小〜中規模のチームでも導入しやすい。

### 2. テストケースの標準化

入力項目が整理されており、テストケースの品質を一定に保てる。

**標準項目**

- Title（タイトル）
- Severity（重大度）: Trivial / Minor / Normal / Major / Critical / Blocker
- Priority（優先度）: Low / Medium / High
- Type（種類）: Functional / Smoke / Regression / Security など
- Automation Status（自動化状況）: Automated / To be automated / Not automated

### 3. 自動テストとの連携

APIを使ってCI/CDパイプラインから自動的にテスト結果を反映できる。

```bash
# Qase Reporter for Jest
npm install -D jest-qase-reporter
```

```javascript
// jest.config.js
module.exports = {
  reporters: [
    'default',
    [
      'jest-qase-reporter',
      {
        apiToken: process.env.QASE_API_TOKEN,
        projectCode: 'YOUR_PROJECT_CODE',
        runId: process.env.QASE_RUN_ID,
      },
    ],
  ],
}
```

### 4. テスト結果の可視化

ダッシュボードでテストの進捗状況を一目で確認できる。

- 全体の進捗率
- Passed / Failed / Skipped の割合
- 重大度別の不具合数
- テスト実行履歴

## 基本的な使い方

### 1. プロジェクトの作成

新しいプロジェクトを作成します。

```
Project Name: プロジェクト名（例: My Application）
Project Code: 短縮コード（例: MA）※テストケースIDのプレフィックスになる
Description: プロジェクトの説明
Access Type: Private（推奨）
```

### 2. テストスイートの作成

テストケースをグループ化するためのスイート（フォルダのようなもの）を作成します。

**階層構造の例**

```
📁 ユーザー管理
  📁 ログイン
  📁 ユーザー登録
  📁 パスワードリセット
📁 商品管理
  📁 商品一覧
  📁 商品詳細
  📁 商品検索
```

### 3. テストケースの作成

テストケースを作成します。

**必須項目**

- **Title**: テストケースの名前
- **Steps**: テスト手順
  1. ログインページにアクセス
  2. メールアドレスとパスワードを入力
  3. ログインボタンをクリック
- **Expected Result**: 期待される結果
  - ダッシュボードに遷移する
  - ユーザー名が表示される

**オプション項目**

- **Preconditions**: テスト実行前の条件（例: ユーザーが登録済み）
- **Severity**: 重大度
- **Priority**: 優先度
- **Type**: テストタイプ
- **Automation Status**: 自動化状況

### 4. テスト計画の作成

テスト計画（Test Plan）を作成して、どのテストケースを実行するか定義します。

```
Plan Name: リリース v1.2.0 テスト計画
Description: v1.2.0リリースに向けたテスト
Test Cases: 対象のテストケースを選択
```

### 5. テスト実行の作成

テスト計画からテスト実行（Test Run）を作成します。

```
Run Title: v1.2.0 第1回テスト実行
Environment: Staging
Assigned to: テスト担当者
```

### 6. テストの実行と結果記録

各テストケースを実行し、結果を記録します。

**結果の種類**

- ✅ **Passed**: テスト成功
- ❌ **Failed**: テスト失敗
- ⏭️ **Skipped**: スキップ
- 🚫 **Blocked**: ブロックされた（依存関係により実行不可）
- ⚠️ **Invalid**: 無効（テストケース自体に問題がある）

**コメント例**

```
結果: Failed
コメント:
- ログインボタンをクリック後、エラーメッセージが表示される
- エラー内容: "Invalid credentials"
- 再現手順:
  1. メールアドレス: test@example.com
  2. パスワード: Test1234
  3. ログインボタンをクリック
- 添付: スクリーンショット（error.png）
```

## CI/CDとの連携

### GitHub Actionsとの統合例

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run E2E tests
        env:
          QASE_API_TOKEN: ${{ secrets.QASE_API_TOKEN }}
          QASE_PROJECT_CODE: MA
          QASE_RUN_ID: ${{ github.event.number }}
        run: npm run test:e2e
```

### Playwright with Qase

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  reporter: [
    ['list'],
    [
      'playwright-qase-reporter',
      {
        apiToken: process.env.QASE_API_TOKEN,
        projectCode: process.env.QASE_PROJECT_CODE,
        runComplete: true,
        basePath: 'https://api.qase.io/v1',
        uploadAttachments: true,
      },
    ],
  ],
})
```

```typescript
// tests/login.spec.ts
import { test, expect } from '@playwright/test'
import { qase } from 'playwright-qase-reporter'

test.describe('Login', () => {
  qase(1, test('successful login', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('.user-name')).toBeVisible()
  }))

  qase(2, test('failed login with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'invalid@example.com')
    await page.fill('[name="password"]', 'wrongpassword')
    await page.click('[type="submit"]')

    await expect(page.locator('.error-message')).toContainText('Invalid credentials')
  }))
})
```

## 実践的な活用Tips

### 1. テストケースのタグ付け

タグを活用して、テストケースを柔軟に分類できます。

```
Tags: #smoke, #critical, #api, #authentication
```

フィルタリング例：
- スモークテストだけを実行
- 重要度の高いテストだけを選択
- API関連のテストケースを検索

### 2. カスタムフィールドの活用

プロジェクト固有の情報を追加できます。

```
Custom Fields:
- Test Data Set: Dataset A
- Browser: Chrome, Firefox, Safari
- API Version: v2.0
```

### 3. テストケースの再利用

共通のテストケースをShared Stepsとして定義し、複数のテストケースで再利用できます。

```
Shared Step: ログイン処理
1. ログインページにアクセス
2. 認証情報を入力
3. ログインボタンをクリック
4. ダッシュボードに遷移することを確認
```

### 4. ミルストーンの設定

リリースやスプリントごとにミルストーンを設定し、テストケースを紐付けます。

```
Milestones:
- v1.0.0 (2024/01/15)
- v1.1.0 (2024/02/15)
- v2.0.0 (2024/03/31)
```

## スプレッドシート vs Qase

| 項目 | スプレッドシート | Qase |
|------|-----------------|------|
| 初期コスト | 無料 | 3ユーザーまで無料 |
| バージョン管理 | 手動、履歴追跡が困難 | 自動、変更履歴を完全追跡 |
| テスト結果の集計 | 手作業、時間がかかる | 自動集計、リアルタイム更新 |
| 自動テスト連携 | 困難 | API連携で自動化可能 |
| 検索性 | 低い | 高度な検索・フィルタ機能 |
| テストケースの品質 | ばらつきあり | テンプレートで標準化 |
| 複数人での同時編集 | 可能だが競合しやすい | 競合なく同時編集可能 |

## 導入時の注意点

### 1. 既存テストケースの移行

スプレッドシートからQaseへの移行には時間がかかります。

**推奨アプローチ**

1. 重要度の高いテストケースから移行
2. 新しいテストケースはQaseで作成
3. 段階的に移行を進める

### 2. チームへの浸透

新しいツールの導入には学習コストがあります。

**対策**

- 導入説明会を実施
- マニュアルを作成
- スモールスタートで効果を実感してもらう

### 3. 自動化の計画

すぐにすべてを自動化する必要はありません。

**段階的なアプローチ**

1. 手動テストをQaseで管理
2. 重要なテストケースから自動化
3. CI/CDと連携

## まとめ

Qaseを導入することで：

- **テスト管理の効率化**: テストケースの作成・実行・結果集計が容易に
- **品質の標準化**: テンプレートによりテストケースの品質を一定に保つ
- **自動化の促進**: CI/CDとの連携で自動テストを効果的に管理
- **可視化の向上**: ダッシュボードでテストの進捗を一目で把握

スプレッドシートでのテスト管理に限界を感じているチームには、Qaseの導入を強くおすすめします。

### 参考リンク

- [Qase 公式サイト](https://qase.io/)
- [Qase Documentation](https://help.qase.io/)
- [Qase Reporters](https://github.com/qase-tms)
