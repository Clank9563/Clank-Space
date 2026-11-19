# 個人網站

用 Astro 建置的中英雙語個人網站與技術部落格，部署在 GitHub Pages。版面以工程計算紙筆記本為主題：每篇文章都有編號，修訂時劃掉舊的、不刪除。

## 開始使用

```bash
npm install
npm run dev        # 開發模式：http://localhost:4321
npm run build      # 建置到 dist/，並產生搜尋索引
npm run preview    # 預覽建置結果（站內搜尋只在這裡能用）
```

需要 Node.js 22。

## 換成你自己的資料

目前所有個人資料與文章都是**範例內容**，上線前請替換：

| 要改的東西 | 位置 |
| --- | --- |
| 名字、職稱、所在地、Email、社群連結 | `src/site.config.ts` |
| 「範例內容」標記 | 換完資料後把 `src/site.config.ts` 的 `placeholder` 改成 `false` |
| 文章分類 | `src/site.config.ts` 的 `categories`，以及 `src/content.config.ts` 的 `category` 列舉 |
| 首頁標題與簡介 | `src/pages/[...lang]/index.astro` 的 `copy` |
| 關於、現在、工具 | `src/content/pages/zh/*.md`、`src/content/pages/en/*.md` |
| 範例文章與專案 | `src/content/posts/`、`src/content/projects/`（直接刪除範例檔） |

## 寫一篇文章

在 `src/content/posts/zh/`（或 `en/`）新增一個 `.md` 檔，檔名就是網址：

```markdown
---
title: 文章標題
description: 一兩句摘要，會出現在列表、搜尋結果與 RSS
date: 2026-12-01
category: backend          # cloud / backend / frontend / notes
tags: [PostgreSQL, 效能]
translationKey: my-post    # 選填：中英文版本用同一個 key 連結
---

內文用 Markdown。## 二級標題會自動編上 § 號並出現在目次。
```

其他選填欄位：

- `revisions`：修訂紀錄，例如 `- { date: 2026-12-05, note: 補上範例程式 }`。文章會顯示「修訂」日期與修訂紀錄。
- `outdated: true`：標題會被劃線，並提示這篇已過時、保留作為紀錄。
- `draft: true`：草稿，只在開發模式出現。

想加旁註，把副檔名改成 `.mdx`，把被說明的段落包起來：`<Sidenote label="註" note="註記內容">被說明的段落</Sidenote>`。寬螢幕時註記會掛在段落右側。

### 放圖片

文章有圖片時，建一個資料夾，把文章改名成 `index.md`，圖片放在旁邊，用相對路徑引用：

```
src/content/posts/zh/my-post/
├── index.md          ← 網址還是 /posts/my-post/
└── screenshot.png
```

```markdown
![說明文字](./screenshot.png)
```

建置時會自動壓縮：轉成 WebP、寬度最多 1400px，並產生 480 / 800 / 1100 / 1400px 幾種尺寸，手機只會下載小張的。原圖比較小時維持原寸。原圖直接放就好，不用先自己壓縮；但原圖會存進 repo，手機照片這種好幾 MB 的檔案，放之前縮小一點可以讓 repo 不會越來越大。

用 `/` 或 `https://` 開頭的圖片網址不會經過壓縮。

文章列表每頁 10 篇，超過時會自動分頁（`/posts/page/2/`…）。要改每頁篇數，修改 `src/lib/content.ts` 的 `POSTS_PER_PAGE`。

## 部署到 GitHub Pages

1. 把專案推到 GitHub。
2. 到 repo 的 **Settings → Pages**，把 **Source** 設成 **GitHub Actions**。
3. 推到 `main` 分支後，`.github/workflows/deploy.yml` 會自動建置並部署；網址與 `base` 路徑會自動帶入。

## 開啟訪客人次（GoatCounter）

1. 到 <https://www.goatcounter.com> 免費註冊，取一個網站代碼（例如 `myname`，後台網址會是 `https://myname.goatcounter.com`）。
2. 在 GoatCounter 的 **Settings** 勾選 **Allow adding visitor counts on your website**，網站才能讀到公開的次數。
3. 把代碼填進 `src/site.config.ts` 的 `goatcounter.code`。

填好後，頁尾會顯示全站的「翻閱次數」，每篇文章的資料列會顯示「閱讀次數」；完整統計（來源、熱門文章、趨勢）在 GoatCounter 後台看。GoatCounter 不使用 cookie。

## 開啟留言（Giscus）

1. repo 必須是公開的，並在 **Settings → General** 開啟 **Discussions**。
2. 到 <https://giscus.app> 選擇你的 repo，取得 `repoId` 與 `categoryId`。
3. 填進 `src/site.config.ts` 的 `giscus`。兩個值都填好後，文章底部才會出現留言區。
