---
title: 用 Astro 把部落格改成純靜態
description: 把原本跑在伺服器上的部落格搬到 Astro，部署到 GitHub Pages。記錄搬遷步驟、踩到的路徑問題，以及為什麼不再需要後端。
date: 2026-11-02
category: frontend
tags: [Astro, GitHub Pages, 靜態網站]
translationKey: astro-static
revisions:
  - date: 2026-11-09
    note: 補上 GitHub Actions 部署步驟與 base 路徑說明
---

原本的部落格跑在一台小型虛擬機上，每個月要付主機費，還要記得更新系統套件。但它做的事其實只有一件：把 Markdown 變成 HTML。這篇記錄我怎麼把它改成純靜態網站。

## 為什麼選 Astro

靜態網站產生器很多，我挑 Astro 的理由有三個：

- 文章就是 Markdown 檔，放進資料夾就會出現在網站上。
- 預設不送任何 JavaScript 到瀏覽器，頁面很輕。
- 內容集合（content collections）會檢查每篇文章的 frontmatter，日期打錯會在建置時就報錯。

## 定義文章的格式

每篇文章的欄位在 `src/content.config.ts` 定義，建置時會逐篇檢查：

```ts
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});
```

## 部署到 GitHub Pages

GitHub Pages 有兩種網址形式，設定不同：

| 類型 | 網址 | `base` 設定 |
| --- | --- | --- |
| 使用者站台 | `帳號.github.io` | `/` |
| 專案站台 | `帳號.github.io/repo` | `/repo` |

搞錯 `base` 的症狀很明顯：首頁打得開，但 CSS 和所有連結都 404。

### 用 GitHub Actions 自動部署

推到 `main` 分支後，Actions 會自動建置並發佈：

```yaml
- uses: actions/checkout@v4
- run: npm ci && npm run build
- uses: actions/upload-pages-artifact@v3
  with:
    path: dist
```

## 結果

主機費從每月一筆變成零，頁面載入時間也短了很多。代價是留言和搜尋都要改用不需要伺服器的方案：留言用 Giscus，搜尋用 Pagefind。
