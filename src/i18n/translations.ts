export const translations = {
  ja: {
    'nav.blog': 'Blog',
    'nav.talks': 'Talks',
    'nav.about': 'About',
    'home.title': 'nao.dev',
    'home.description': 'Front-end Developer loving Vue ecosystem. 技術のこと、日々のこと、思いついたことを綴るブログ',
    'blog.readingTime': '{minutes}分で読めます',
    'blog.backToHome': 'ホームに戻る',
    'blog.scrollToTop': 'トップへ',
    'talks.title': 'Talks',
    'talks.description': '登壇資料やプレゼンテーションのまとめ',
    'talks.noTalks': 'No talks yet. Check back soon!',
    'talks.slides': 'Slides',
    'talks.video': 'Video',
    'about.title': 'About',
    'about.description': 'Naoki Haba のプロフィールと開発環境',
    'about.currentlyReading': '現在読んでいる',
    'about.toolsHardware': '開発環境',
    '404.title': 'ページが見つかりません',
    '404.description': 'お探しのページは存在しないか、移動した可能性があります。',
    '404.home': 'ホーム',
    '404.backButton': '前のページに戻る',
    'search.placeholder': '記事を検索...',
    'search.noResults': '結果が見つかりませんでした',
    'search.searching': '検索中...',
    'search.enterKeyword': 'キーワードを入力して検索',
    'search.button': '検索',
  },
  en: {
    'nav.blog': 'Blog',
    'nav.talks': 'Talks',
    'nav.about': 'About',
    'home.title': 'nao.dev',
    'home.description': 'Front-end Developer loving Vue ecosystem. Sharing technical insights, daily experiences, and random thoughts.',
    'blog.readingTime': '{minutes} min read',
    'blog.backToHome': 'Back to Home',
    'blog.scrollToTop': 'Scroll to Top',
    'talks.title': 'Talks',
    'talks.description': 'Collection of presentations and slides',
    'talks.noTalks': 'No talks yet. Check back soon!',
    'talks.slides': 'Slides',
    'talks.video': 'Video',
    'about.title': 'About',
    'about.description': "Naoki Haba's profile and development environment",
    'about.currentlyReading': 'Currently Reading',
    'about.toolsHardware': 'Development Environment',
    '404.title': 'Page Not Found',
    '404.description': 'The page you are looking for does not exist or has been moved.',
    '404.home': 'Home',
    '404.backButton': 'Go Back',
    'search.placeholder': 'Search articles...',
    'search.noResults': 'No results found',
    'search.searching': 'Searching...',
    'search.enterKeyword': 'Enter keyword to search',
    'search.button': 'Search',
  },
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof (typeof translations)['ja'];

export function t(locale: Locale, key: TranslationKey, params?: Record<string, string | number>): string {
  let text = translations[locale][key] || translations['ja'][key];

  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{${param}}`, String(value));
    });
  }

  return text;
}

export function getLocaleFromUrl(url: URL): Locale {
  const pathname = url.pathname;
  if (pathname.startsWith('/en')) return 'en';
  return 'ja';
}
