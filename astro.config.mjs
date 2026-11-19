// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// GitHub Pages 設定：
// - 使用者站台（<帳號>.github.io）：SITE=https://<帳號>.github.io，BASE 留空
// - 專案站台（<帳號>.github.io/<repo>）：另外設定 BASE=/<repo>
// 部署用的 GitHub Actions 會自動帶入這兩個值，見 .github/workflows/deploy.yml
const site = process.env.SITE || 'https://example.github.io';
const base = process.env.BASE || '/';

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
  markdown: {
    shikiConfig: { theme: 'css-variables', wrap: false },
  },
});
