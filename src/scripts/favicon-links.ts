/**
 * クライアントサイドスクリプト: 外部リンクにFaviconを自動追加
 *
 * このスクリプトは、ページ内の外部リンクを検出し、
 * Google Favicon APIを使用してドメインのfaviconを自動的に追加します。
 */

function addFaviconToLinks() {
  // すべてのリンクを取得
  const links = document.querySelectorAll('a[href]');

  links.forEach((link) => {
    const href = link.getAttribute('href');

    // 外部リンク（http/https）のみ処理
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      try {
        const url = new URL(href);
        const domain = url.hostname;

        // すでにfaviconが追加されているか確認
        const existingFavicon = link.querySelector('.inline-favicon');
        if (existingFavicon) {
          return; // すでに追加済みならスキップ
        }

        // faviconイメージ要素を作成
        const faviconImg = document.createElement('img');
        faviconImg.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
        faviconImg.alt = '';
        faviconImg.className = 'inline-favicon';
        faviconImg.width = 16;
        faviconImg.height = 16;
        faviconImg.loading = 'lazy';
        faviconImg.style.cssText = 'display: inline; margin: 0 0.25rem 0 0; vertical-align: middle;';

        // リンクの先頭にfaviconを追加
        link.insertBefore(faviconImg, link.firstChild);
      } catch (e) {
        // URL解析エラーは無視（内部リンクなど）
        console.warn(`Failed to parse URL for favicon: ${href}`);
      }
    }
  });
}

// DOM読み込み完了後に実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addFaviconToLinks);
} else {
  addFaviconToLinks();
}

// 動的に追加されるリンクにも対応（オプション）
// MutationObserverで新しく追加されたリンクを監視
const observer = new MutationObserver((mutations) => {
  let hasNewLinks = false;

  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          // 追加されたノード自体がリンクか、子孫にリンクがあるか確認
          if (element.tagName === 'A' || element.querySelector('a[href]')) {
            hasNewLinks = true;
          }
        }
      });
    }
  });

  if (hasNewLinks) {
    addFaviconToLinks();
  }
});

// body全体を監視
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
