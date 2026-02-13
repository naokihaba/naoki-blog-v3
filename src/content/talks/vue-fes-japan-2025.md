---
title: 'Nuxt 4 の Singleton Data Fetching Layer で何が変わるのか'
description: 'Nuxt 3.17で導入されたSingleton Data Fetching Layerによって、useAsyncData/useFetchのデータ取得の仕組みがどう改善されたのかを5分間のLTで解説しました。'
date: '2025-10-25'
event: 'Vue Fes Japan 2025'
location: '東京'
slidesUrl: 'https://speakerdeck.com/naokihaba/nuxt-4-no-singleton-data-fetching-layer-de-he-gabian-warunoka'
slidesEmbedUrl: 'https://speakerdeck.com/player/1ee1a1dd203341b3a2d238df0b347ed0'
---

## 概要

Vue Fes Japan 2025 で「Nuxt 4 の Singleton Data Fetching Layer で何が変わるのか」というタイトルで登壇しました。

Singleton Data Fetching Layer は Nuxt 3.17 で導入された機能で、`useAsyncData` / `useFetch` のデータ取得の仕組みが大きく改善されました。

## トピック

- Nuxt 3.17以前の問題点：データは共有されるが、fetcherが重複実行される
- Singleton Data Fetching Layer による改善
- Reactiveな値を key に指定できるようになった

詳細は [Speaker Deck](https://speakerdeck.com/naokihaba) の資料をご覧ください。
