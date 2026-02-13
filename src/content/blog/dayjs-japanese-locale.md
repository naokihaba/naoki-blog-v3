---
title: 'Day.jsで日本語ロケールとプラグインを設定する'
description: 'Day.jsで日本語ロケールの設定方法と、よく使うプラグインの導入・活用方法について解説します。'
date: '2021-11-29'
tags:
  - dayjs
  - javascript
  - datetime
---

## Day.jsとは

[Day.js](https://day.js.org/)は、日付・時刻を扱うための軽量なJavaScriptライブラリです。

**主な特徴**

- **軽量**: わずか2KBのサイズ
- **Moment.js互換**: APIが似ているため移行が容易
- **プラグインシステム**: 必要な機能だけを追加可能
- **イミュータブル**: 元のオブジェクトを変更しない

## ロケール設定

Day.jsのデフォルトロケールは英語（en）です。日本語表示にするには、ロケールを設定する必要があります。

### 基本的な設定

```ts
import dayjs from 'dayjs'
import 'dayjs/locale/ja'

// 日本語ロケールを設定
dayjs.locale('ja')

console.log(dayjs().format('YYYY年M月D日(ddd)'))
// 出力: 2021年11月29日(月)
```

### グローバル vs ローカル設定

```ts
import dayjs from 'dayjs'
import 'dayjs/locale/ja'
import 'dayjs/locale/en'

// グローバルに日本語を設定
dayjs.locale('ja')
console.log(dayjs().format('MMMM'))
// 出力: 11月

// 特定のインスタンスだけ英語にする
console.log(dayjs().locale('en').format('MMMM'))
// 出力: November
```

## よく使うプラグイン

Day.jsはプラグインシステムで機能を拡張できます。

### 1. MinMax - 最大・最小値の取得

```ts
import dayjs from 'dayjs'
import minMax from 'dayjs/plugin/minMax'

dayjs.extend(minMax)

const dates = [
  dayjs('2021-11-01'),
  dayjs('2021-11-15'),
  dayjs('2021-11-30'),
]

console.log(dayjs.max(dates).format('YYYY-MM-DD'))
// 出力: 2021-11-30

console.log(dayjs.min(dates).format('YYYY-MM-DD'))
// 出力: 2021-11-01
```

### 2. Timezone - タイムゾーン対応

```ts
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

// 日本時間を明示的に指定
const jst = dayjs.tz('2021-11-29 12:00', 'Asia/Tokyo')
console.log(jst.format())
// 出力: 2021-11-29T12:00:00+09:00

// 別のタイムゾーンに変換
console.log(jst.tz('America/New_York').format())
// 出力: 2021-11-28T22:00:00-05:00
```

### 3. RelativeTime - 相対時間の表示

```ts
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ja'

dayjs.extend(relativeTime)
dayjs.locale('ja')

console.log(dayjs().from(dayjs().add(7, 'day')))
// 出力: 7日後

console.log(dayjs().from(dayjs().subtract(2, 'hour')))
// 出力: 2時間前
```

### 4. CustomParseFormat - カスタムフォーマットのパース

```ts
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

const date = dayjs('2021/11/29', 'YYYY/MM/DD')
console.log(date.format('YYYY-MM-DD'))
// 出力: 2021-11-29

// 厳密なパース（形式が一致しない場合はInvalid Date）
const strictDate = dayjs('2021-13-01', 'YYYY-MM-DD', true)
console.log(strictDate.isValid())
// 出力: false (13月は存在しない)
```

### 5. IsSameOrAfter / IsSameOrBefore - 日付比較

```ts
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

const start = dayjs('2021-11-01')
const end = dayjs('2021-11-30')
const target = dayjs('2021-11-15')

// 期間内かチェック
if (target.isSameOrAfter(start) && target.isSameOrBefore(end)) {
  console.log('期間内です')
}
```

## 実践的な設定例

プロジェクト全体で使うDay.jsの設定をモジュール化します。

```ts
import dayjs from 'dayjs'

// ロケール
import 'dayjs/locale/ja'

// プラグイン
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import minMax from 'dayjs/plugin/minMax'
import relativeTime from 'dayjs/plugin/relativeTime'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// プラグインを登録
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(minMax)
dayjs.extend(relativeTime)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(customParseFormat)

// 日本語ロケールを設定
dayjs.locale('ja')

// デフォルトタイムゾーンを日本時間に設定
dayjs.tz.setDefault('Asia/Tokyo')

export default dayjs
```

## よくあるユースケース

### 営業日の計算

```ts
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

function isBusinessDay(date: dayjs.Dayjs): boolean {
  const dayOfWeek = date.isoWeekday()
  return dayOfWeek >= 1 && dayOfWeek <= 5 // 月曜(1)〜金曜(5)
}

const today = dayjs()
console.log(isBusinessDay(today) ? '営業日' : '休日')
```

### 年齢計算

```ts
import dayjs from 'dayjs'

function calculateAge(birthDate: string): number {
  const birth = dayjs(birthDate)
  const today = dayjs()
  return today.diff(birth, 'year')
}

console.log(calculateAge('1990-01-01'))
// 出力: 31 (2021年時点)
```

### 期間の重複チェック

```ts
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

function isOverlapping(
  start1: dayjs.Dayjs,
  end1: dayjs.Dayjs,
  start2: dayjs.Dayjs,
  end2: dayjs.Dayjs
): boolean {
  return start1.isSameOrBefore(end2) && end1.isSameOrAfter(start2)
}

const period1Start = dayjs('2021-11-01')
const period1End = dayjs('2021-11-15')
const period2Start = dayjs('2021-11-10')
const period2End = dayjs('2021-11-20')

console.log(isOverlapping(period1Start, period1End, period2Start, period2End))
// 出力: true (重複している)
```

## TypeScriptでの型定義

```ts
import dayjs, { Dayjs } from 'dayjs'

interface DateRange {
  start: Dayjs
  end: Dayjs
}

function formatDateRange(range: DateRange): string {
  return `${range.start.format('YYYY/MM/DD')} 〜 ${range.end.format('YYYY/MM/DD')}`
}

const range: DateRange = {
  start: dayjs('2021-11-01'),
  end: dayjs('2021-11-30'),
}

console.log(formatDateRange(range))
// 出力: 2021/11/01 〜 2021/11/30
```

## まとめ

Day.jsを効果的に使うために：

- **ロケール設定**: 日本語表示にするために`dayjs.locale('ja')`を設定
- **プラグイン**: 必要な機能だけをインポートして軽量に保つ
- **タイムゾーン**: UTC/Timezoneプラグインで正確な時刻を扱う
- **型安全性**: TypeScriptと組み合わせて型安全な日付処理を実現

軽量かつ強力なDay.jsで、日付・時刻の処理を効率化できます。

### 参考リンク

- [Day.js 公式ドキュメント](https://day.js.org/)
- [プラグイン一覧](https://day.js.org/docs/en/plugin/plugin)
- [ロケール一覧](https://github.com/iamkun/dayjs/tree/dev/src/locale)
