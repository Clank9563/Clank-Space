---
title: 用 docker-compose 管理本機開發環境
description: 用一個 docker-compose.yml 讓新同事第一天就能把整套服務跑起來。這篇的做法已經被 devcontainer 取代，保留作為紀錄。
date: 2025-06-14
category: notes
tags: [Docker, 開發環境]
outdated: true
---

> 範例文章：這篇是網站範本附帶的示範內容，示範「過時文章」的呈現方式。

這篇寫於 2025 年。我們後來改用 devcontainer，所以這裡的做法已經不再使用，但文章保留下來，記錄當時的思路。

## 當時的問題

新同事要花一整天安裝資料庫、快取和訊息佇列，每個人裝出來的版本還都不一樣。

## 做法

把所有相依服務寫進同一個檔案：

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: dev
  cache:
    image: redis:7
```

執行 `docker compose up -d` 就能啟動全部服務。
