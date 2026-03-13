---
title: 'Linear Clipper 拡張機能を作ってみた'
description: '現在のページURLをLinearイシューにクリップするChrome拡張機能を作成しました。Manifest V3、GraphQL API、Chrome Storage APIの使い方を解説します。'
date: '2026-01-04'
tags:
  - chrome-extension
  - linear
  - javascript
---

## はじめに

タスク管理ツールとして [Linear](https://linear.app) を使っているのですが、ブラウジング中に見つけた記事やドキュメントをイシューに紐付けたいことがよくあります。毎回 Linear を開いてURLをコピペするのは面倒なので、Chrome 拡張機能を作ってみました。

## 参考リンク

- [マニフェスト ファイル形式 | Manifest | Chrome for Developers](https://developer.chrome.com/docs/extensions/reference/manifest?hl=ja#register-a-content-script)
- [Schema | Linear API@current | Studio](https://studio.apollographql.com/public/Linear-API/variant/current/schema/reference/objects/AttachmentPayload)

## manifest.json

Chrome 拡張機能のメタデータと設定を定義する JSON ファイルです。拡張機能のルートディレクトリに必須です。

```json
{
  "manifest_version": 3,
  "name": "Linear Clipper",
  "version": "1.0.0",
  "description": "現在のページURLをLinearイシューにクリップする",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://api.linear.app/*"
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_ui": {
    "page": "options/options.html",
    "open_in_tab": true
  },
  "background": {
    "service_worker": "scripts/background.js",
    "type": "module"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### permissions と host_permissions の説明

- `"storage"`: API キーやチーム ID を拡張機能のストレージに保存するために必要
- `"activeTab"`: 現在のタブの URL とタイトルを取得するために必要
- `"host_permissions": ["https://api.linear.app/*"]`: Linear API への fetch を許可し、CORS 制限を回避する

### 各設定項目

- `"default_popup"`: 拡張機能のアイコンをクリックしたときに表示されるポップアップの HTML
- `"options_ui"`: 拡張機能のオプションページ。`open_in_tab: true` で新しいタブで開く
- `"background"`: Service Worker として動作するバックグラウンドスクリプト。アイドル時は自動停止する

## options/options.js

拡張機能のオプションページです。API キーとチーム ID を設定できるようにします。

```javascript
async function init() {
  // 既存の設定を読み込む
  const { apiKey, teamId } = await chrome.storage.sync.get(['apiKey', 'teamId']);

  if (apiKey) {
    apiKeyInput.value = apiKey;
    await loadTeams(apiKey, teamId);
  }
}

async function loadTeams(apiKey, selectedTeamId = null) {
  teamSelect.disabled = true;
  teamSelect.innerHTML = '<option value="">読み込み中...</option>';

  try {
    // background.jsにメッセージを送信してチーム一覧を取得
    const response = await chrome.runtime.sendMessage({
      action: 'fetchTeams',
    });

    if (response.error) {
      throw new Error(response.error);
    }

    teamSelect.innerHTML = '<option value="">-- チームを選択 --</option>';

    response.teams.forEach((team) => {
      const option = document.createElement('option');
      option.value = team.id;
      option.textContent = team.name;
      if (team.id === selectedTeamId) {
        option.selected = true;
      }
      teamSelect.appendChild(option);
    });

    teamSelect.disabled = false;
  } catch (error) {
    teamSelect.innerHTML = '<option value="">エラー: ' + error.message + '</option>';
    showStatus('チームの取得に失敗しました: ' + error.message, 'error');
  }
}

// debounce: 入力のたびにAPIを叩かないよう500ms待機
apiKeyInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      await chrome.storage.sync.set({ apiKey });
      await loadTeams(apiKey);
    }
  }, 500);
});

saveBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const teamId = teamSelect.value;

  if (!apiKey) {
    showStatus('APIキーを入力してください', 'error');
    return;
  }

  if (!teamId) {
    showStatus('チームを選択してください', 'error');
    return;
  }

  try {
    await chrome.storage.sync.set({ apiKey, teamId });
    showStatus('設定を保存しました', 'success');
  } catch (error) {
    showStatus('保存に失敗しました: ' + error.message, 'error');
  }
});
```

### 処理の流れ

1. ページ読み込み時に `init` 関数が呼ばれ、`chrome.storage.sync.get` で保存されている API キーとチーム ID を取得
2. background.js に `{ action: 'fetchTeams' }` を送信
3. レスポンスで `<select>` を構築
4. 保存ボタンがクリックされたときに API キーとチーム ID を保存

## popup/popup.js

ツールバーアイコンをクリックしたときに表示されるポップアップのロジックです。

```javascript
// 5つのView（状態）を切り替える
function showView(view) {
  [setupView, mainView, successView, loadingView, errorView].forEach((v) => {
    v.style.display = 'none';
  });
  view.style.display = 'flex';
}

async function init() {
  // 設定が未完了なら setupView を表示
  const { apiKey, teamId } = await chrome.storage.sync.get(['apiKey', 'teamId']);
  if (!apiKey || !teamId) {
    showView(setupView);
    return;
  }

  // 現在のタブ情報を取得（activeTab権限で許可）
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  titleInput.value = tab.title || '';
  urlDisplay.textContent = tab.url || '';
  showView(mainView);
}

// 設定画面を開く
openOptionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// 「Linearに追加」ボタン
clipBtn.addEventListener('click', async () => {
  const title = titleInput.value.trim();

  if (!title) {
    errorMessage.textContent = 'タイトルを入力してください';
    showView(errorView);
    return;
  }

  showView(loadingView);

  try {
    const { teamId } = await chrome.storage.sync.get('teamId');

    const response = await chrome.runtime.sendMessage({
      action: 'createIssue',
      teamId,
      title,
      url: currentTab.url,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    issueLink.textContent = response.issue.identifier;
    issueLink.href = response.issue.url;
    showView(successView);
  } catch (error) {
    errorMessage.textContent = error.message;
    showView(errorView);
  }
});

retryBtn.addEventListener('click', () => {
  showView(mainView);
});
```

### 処理の流れ

1. ポップアップ表示時に `init` が呼ばれる
2. `chrome.storage.sync.get` で設定済みか確認
3. 未設定なら setupView、設定済みなら `chrome.tabs.query` で現在タブの情報を取得
4. 「Linear に追加」クリックで background.js に `{ action: 'createIssue' }` を送信
5. 結果に応じて successView / errorView を表示

## scripts/background.js

popup.js や options.js からのメッセージを受け取り、API 通信を実行するメッセージハブです。

```javascript
import { fetchTeams, createIssueWithLink } from './linear-api.js';

// メッセージを受信するリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request)
    .then(sendResponse)
    .catch((error) => sendResponse({ error: error.message }));
  return true; // 非同期でレスポンスを返すために必要
});

async function handleMessage(request) {
  const { apiKey } = await chrome.storage.sync.get('apiKey');

  if (!apiKey) {
    throw new Error('APIキーが設定されていません。設定画面で設定してください。');
  }

  switch (request.action) {
    case 'fetchTeams':
      return { teams: await fetchTeams(apiKey) };

    case 'createIssue': {
      const { teamId, title, url } = request;
      const issue = await createIssueWithLink(apiKey, teamId, title, url);
      return { issue };
    }

    default:
      throw new Error(`Unknown action: ${request.action}`);
  }
}
```

### 重要なポイント

- `return true` が重要。これがないと `sendResponse` が非同期で呼ばれる前に接続が切れる
- API キーは storage から取得（popup/options から渡さない設計）
- 実際の API 通信は `linear-api.js` に委譲

## scripts/linear-api.js

Linear GraphQL API との通信を担当するモジュールです。

```javascript
const LINEAR_API_ENDPOINT = 'https://api.linear.app/graphql';

// GraphQLリクエストの共通処理
export async function linearFetch(apiKey, query, variables = {}) {
  const response = await fetch(LINEAR_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,  // Bearerなしで直接APIキー
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

// チーム一覧を取得
export async function fetchTeams(apiKey) {
  const query = `
    query Teams {
      teams {
        nodes {
          id
          name
        }
      }
    }
  `;

  const data = await linearFetch(apiKey, query);
  return data.teams.nodes;
}

// イシューを作成
export async function createIssue(apiKey, teamId, title) {
  const mutation = `
    mutation IssueCreate($title: String!, $teamId: String!) {
      issueCreate(input: { title: $title, teamId: $teamId }) {
        success
        issue {
          id
          identifier
          url
        }
      }
    }
  `;

  const data = await linearFetch(apiKey, mutation, { title, teamId });

  if (!data.issueCreate.success) {
    throw new Error('Failed to create issue');
  }

  return data.issueCreate.issue;
}

// イシューにURLを添付
export async function addLinkToIssue(apiKey, issueId, url, title) {
  const mutation = `
    mutation AttachmentLinkURL($issueId: String!, $url: String!, $title: String) {
      attachmentLinkURL(issueId: $issueId, url: $url, title: $title) {
        success
        attachment {
          id
        }
      }
    }
  `;

  const data = await linearFetch(apiKey, mutation, { issueId, url, title });

  if (!data.attachmentLinkURL.success) {
    throw new Error('Failed to add link to issue');
  }

  return data.attachmentLinkURL.attachment;
}

// イシュー作成 + URL添付をまとめて実行
export async function createIssueWithLink(apiKey, teamId, title, url) {
  const issue = await createIssue(apiKey, teamId, title);
  await addLinkToIssue(apiKey, issue.id, url, title);
  return issue;
}
```

## 全体のアーキテクチャ

```
popup.js / options.js
    ↓ chrome.runtime.sendMessage()
background.js (メッセージハブ)
    ↓ import
linear-api.js (API通信)
    ↓ fetch
Linear GraphQL API
```

この設計により、UI 層（popup/options）と API 通信層（linear-api.js）が分離され、保守性が高くなっています。また、background.js がメッセージハブとして機能することで、API キーの管理を一元化できています。

## まとめ

Chrome 拡張機能 Manifest V3 の基本的な構成と、Linear GraphQL API を使ったイシュー作成の実装を紹介しました。Service Worker ベースの background.js を使ったメッセージパッシングのパターンは、他の API 連携にも応用できるかと思います。
