---
title: 'Vue Fes Japan 2025 に登壇しました！'
description: 'Vue Fes Japan 2025で「Nuxt 4 の Singleton Data Fetching Layer で何が変わるのか」というタイトルで登壇しました。CFP応募から当日までの振り返りです。'
date: '2025-12-18'
tags:
  - vue
  - nuxt
  - conference
---

## はじめに

この記事は、📅 **[Vue Advent Calendar 2025](https://qiita.com/advent-calendar/2025/vue)** の 18 日目の記事です。

登壇ブログを書くのが遅くなってしまいましたが、2025 年 10 月 25 日に開催された Vue Fes Japan 2025 で登壇しました。タイトルは「Nuxt 4 の Singleton Data Fetching Layer で何が変わるのか」です。

https://vuefes.jp/2025/speaker/NaokiHaba

技術的な部分は Speaker Deck の資料をご覧いただく方が良いかと思いますので、この記事では登壇までの準備や当日の様子を中心にお伝えします。

### なぜこのテーマを選んだのか

Singleton Data Fetching Layer は Nuxt 3.17 で導入された機能で、`useAsyncData` / `useFetch` のデータ取得の仕組みが大きく改善されました。私自身、業務で複数コンポーネントから同じ API を呼び出す場面で fetcher の重複実行に悩まされた経験があり、この改善がどれほど嬉しいものか身をもって知っていました。

「自分が困っていたことが解決された」という実体験をもとに話せるテーマであり、かつ Nuxt 4 に向けた重要な変更点でもあるため、5 分間の LT で伝える価値があると考えました。

## CFP 応募から登壇まで

### CFP を書く

Dan Abramov さんのブログ記事を参考にしつつ、"なぜこの話をするのか"・"聞き手にとってどんな価値があるのか" を意識して CFP を書きました。

特に意識したのは「問題提起 → 解決策 → 持ち帰れる具体的な知識」という流れです。単に「こんな機能があります」ではなく、「こんな問題がありました → こう解決されました」という構成を意識しました。聞き手が自分のプロジェクトでも活かせる内容になるといいなぁと考えていました。

### アウトラインの作成

最終形はこんな感じですが、最初は色々追加しては「絶対 5 分無理やろ…」という感じで削っては調整を繰り返しました。

```md
- intro
  - hi, I'm Naoki Haba
- problems（問題提起）
  - 同一 `key` での `useAsyncData/useFetch` はデータを共有する仕組み
  - Nuxt 3.17以前：データは共有されるが、fetcherが重複実行される
    - 複数コンポーネントで同じAPIを呼ぶECサイト等
  - `key` には `string` だけしか指定できない
    - Reactiveな値を指定できない
- crossroads（転換点）
  - Nuxt 3.17で `useAsyncData/useFetch` のデータ取得が再編成された
    - Singleton Data Fetching Layer
- demo（実演）
  - Nuxt 3.16以前の挙動
    - fetcherが重複実行される
  - Nuxt 3.17以降の挙動
    - fetcherは一度だけ実行され、データは共有される
    - Reactiveな値を `key` に指定できる
- recap（まとめ）
  - Nuxt 3.17で `useAsyncData/useFetch` のデータ取得が改善された
- outro（締め）
  - Thank you for listening!
```

5 分間の LT ということで、伝えたいことを絞り込むのに苦労しました。最初は全部詰め込みたくなります。

そんなときに参考にしたのが Dan Abramov さんの記事です。

> What is the one thing that you want people to take away from your talk? I try to formulate it as a sentence early on. This idea shouldn't be longer than a dozen words. People will forget most of what you say so you need to pick carefully what you want to stick. It's the seed you want to plant in their heads.

「聴衆に持ち帰ってほしい 1 つのことは何か」を意識して、Singleton Data Fetching Layer の「重複実行の解消」と「Reactive な key のサポート」に焦点を絞りました。

## 当日の様子

今年はコアスタッフとしてスポンサーチームのリーダーを務めながら、学生支援プログラムの司会進行と自分の登壇準備を並行して行いました。カンファレンスを「作る側」として関わるのは初めてで、貴重な経験となりました。

登壇は緊張しましたが、リハーサルを重ねたおかげで無事に時間内に収められました。他のスピーカーの方々のセッションも刺激的で、学びの多い 1 日でした。

## おわりに

コアスタッフと登壇者、両方の立場で Vue Fes Japan 2025 に関われたのは貴重な経験でした。準備は大変でしたが、登壇後にいただいた反応がとても嬉しかったです。

改めて、一緒に準備を進めてくれたスタッフの皆さん、当日参加してくださった皆さん、そして Vue.js コミュニティに感謝します。来年もまた会場でお会いできることを楽しみにしています。

明日は @hiro_xre さんによる「スタイルガイドを意識して Vue.js を書く」が予定されています。お楽しみに！
