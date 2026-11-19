// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import path from 'node:path';
import sharp from 'sharp';

// GitHub Pages 設定：
// - 使用者站台（<帳號>.github.io）：SITE=https://<帳號>.github.io，BASE 留空
// - 專案站台（<帳號>.github.io/<repo>）：另外設定 BASE=/<repo>
// 部署用的 GitHub Actions 會自動帶入這兩個值，見 .github/workflows/deploy.yml
const site = process.env.SITE || 'https://example.github.io';
const base = process.env.BASE || '/';

// 文章圖片自動壓縮：
// Markdown 裡用相對路徑放的圖（例如 ![說明](./photo.jpg)），建置時會自動轉成 WebP。
// 這裡再把寬度限制在 1400px（內文欄約 700px 的兩倍，高解析螢幕也清楚），
// 並產生 480/800/1100/1400 幾種尺寸，手機只會下載小張的。原圖比較小時維持原寸，不會放大。
const IMAGE_MAX = 1400;
const IMAGE_WIDTHS = [480, 800, 1100, 1400];
function rehypeArticleImages() {
  return async (tree, file) => {
    const imgs = [];
    const walk = (node) => {
      if (node.type === 'element' && node.tagName === 'img') imgs.push(node);
      node.children?.forEach(walk);
    };
    walk(tree);
    await Promise.all(imgs.map(async (node) => {
      const src = String(node.properties?.src ?? '');
      // 只處理相對路徑的本地圖片；網址開頭（/、http）的圖不經過 Astro，維持原樣
      if (!src || /^(\/|[a-z]+:)/i.test(src) || !file.path) return;
      let natural;
      try {
        natural = (await sharp(path.resolve(path.dirname(file.path), decodeURI(src))).metadata()).width;
      } catch { return; }
      if (!natural) return;
      const width = Math.min(natural, IMAGE_MAX);
      node.properties.width = width;
      node.properties.widths = [...IMAGE_WIDTHS.filter((w) => w < width), width];
      node.properties.sizes = `(min-width: 760px) ${Math.min(width, 700)}px, 100vw`;
      node.properties.loading = 'lazy';
      node.properties.decoding = 'async';
    }));
  };
}

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  image: {
    // constrained：依原圖與上限寬度產生多種尺寸的 srcset，不會放大小圖
    layout: 'constrained',
  },
  markdown: {
    shikiConfig: { theme: 'css-variables', wrap: false },
    rehypePlugins: [rehypeArticleImages],
  },
});
