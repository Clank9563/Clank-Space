---
title: 雲端成本儀表板
description: 每天彙整各服務的雲端花費，超過預算時通知負責的團隊。
date: 2026-02-01
period: 2026.02 – 2026.05
role: 獨立開發
stack: [Python, AWS Cost Explorer, PostgreSQL]
translationKey: cost-dashboard
---

> 範例專案：這是網站範本附帶的示範內容，請換成你自己的專案。

## 要解決的問題

月底收到帳單才知道哪個服務花太多錢，已經來不及調整。

## 做法

每天從 Cost Explorer 拉資料，依標籤歸到各團隊，超過預算的八成就發通知。

## 我負責的部分

從資料擷取到通知的整條流程。
