import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import sharp from 'sharp';

// 静的パスの生成
export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
};

// OGP画像を生成するAPIエンドポイント
export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: Awaited<ReturnType<typeof getCollection<'blog'>>>[number] };

  // 日付のフォーマット
  const formattedDate = post.data.date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Google Fontsから日本語フォントを取得
  // Noto Sans JPは日本語テキストの表示に最適
  const fontResponse = await fetch(
    'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=swap'
  );
  const css = await fontResponse.text();

  // CSSからフォントURLを抽出
  const fontUrl = css.match(/url\((.+?)\)/)?.[1];
  if (!fontUrl) {
    throw new Error('Failed to extract font URL from Google Fonts CSS');
  }

  // フォントファイルをダウンロード
  const fontFileResponse = await fetch(fontUrl);
  const fontData = await fontFileResponse.arrayBuffer();

  // Satoriを使ってSVGを生成
  // JSXライクな記法でデザインを定義できる
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '80px',
          fontFamily: 'sans-serif',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              },
              children: [
                // タイトル
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '72px',
                      fontWeight: 'bold',
                      color: 'white',
                      lineHeight: 1.2,
                      maxWidth: '1000px',
                    },
                    children: post.data.title,
                  },
                },
              ],
            },
          },
          // フッター（日付とサイト名）
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '28px',
                      color: 'rgba(255, 255, 255, 0.8)',
                    },
                    children: formattedDate,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '36px',
                      fontWeight: 'bold',
                      color: 'white',
                    },
                    children: 'nao.dev',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630, // Twitter/OGP推奨サイズ
      fonts: [
        {
          name: 'Noto Sans JP',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );

  // SharpでSVGをPNGに変換
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  // PNG画像をレスポンスとして返す
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      // キャッシュ制御（1週間）
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  });
};
