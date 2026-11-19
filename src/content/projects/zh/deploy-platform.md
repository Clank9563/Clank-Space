---
title: 內部部署平台
description: 讓團隊用一個指令把服務部署到測試與正式環境，取代原本手動執行的腳本。
date: 2025-03-01
period: 2025.03 – 2025.12
role: 後端設計與實作
stack: [Go, AWS ECS, Terraform, GitHub Actions]
translationKey: deploy-platform
links:
  - label: 原始碼
    href: https://github.com/your-account/deploy-platform
---

## 要解決的問題

原本的部署靠一份很長的腳本，只有兩個人知道怎麼執行，出錯時也很難回復。

## 做法

- 每個服務用同一份 Terraform 模組描述，差異只寫在設定檔裡。
- 部署由 GitHub Actions 觸發，每次部署都留下紀錄，可以一鍵回到上一版。

## 我負責的部分

API 設計、部署狀態的追蹤，以及回復機制。
