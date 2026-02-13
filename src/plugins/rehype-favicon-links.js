import { visit } from 'unist-util-visit';

/**
 * Rehypeプラグイン: 外部リンクにFaviconを自動追加
 *
 * このプラグインは、Markdown内の外部リンクを検出し、
 * Google Favicon APIを使用してドメインのfaviconを自動的に追加します。
 */
export default function rehypeFaviconLinks() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      // aタグで、hrefプロパティが存在する場合のみ処理
      if (node.tagName === 'a' && node.properties?.href) {
        const href = node.properties.href;

        // 外部リンク（http/https）のみ処理
        if (href.startsWith('http://') || href.startsWith('https://')) {
          try {
            const url = new URL(href);
            const domain = url.hostname;

            // faviconイメージノードを作成
            const faviconNode = {
              type: 'element',
              tagName: 'img',
              properties: {
                src: `https://www.google.com/s2/favicons?domain=${domain}&sz=16`,
                alt: '',
                class: 'inline-favicon',
                width: 16,
                height: 16,
                loading: 'lazy',
                style: 'display: inline; margin: 0 0.25rem 0 0; vertical-align: middle;'
              },
              children: [],
            };

            // リンクの先頭にfaviconを追加
            node.children.unshift(faviconNode);
          } catch (e) {
            // URL解析エラーは無視（内部リンクなど）
            console.warn(`Failed to parse URL for favicon: ${href}`);
          }
        }
      }
    });
  };
}
