---
title: Postgres 索引：我以為懂了的部分
description: 加了索引查詢卻沒有變快。從 EXPLAIN 的輸出開始，重新理解複合索引的欄位順序與部分索引。
date: 2026-09-30
category: backend
tags: [PostgreSQL, 效能]
---

有一支查詢很慢，我在 `user_id` 上加了索引，結果時間幾乎沒變。這篇記錄我怎麼找出原因。

## 先看 EXPLAIN

不要猜，直接看資料庫實際怎麼執行：

```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE status = 'paid' AND user_id = 42
ORDER BY created_at DESC
LIMIT 20;
```

輸出顯示它用了索引，但還是掃了好幾萬列，因為排序要在取出資料之後才做。

## 複合索引的欄位順序

把篩選和排序的欄位放進同一個索引，順序是「等號條件在前、排序欄位在後」：

```sql
CREATE INDEX orders_user_status_created
  ON orders (user_id, status, created_at DESC);
```

這樣資料庫可以直接依照索引的順序讀出前 20 筆，不需要另外排序。

## 部分索引

如果查詢幾乎都只看 `status = 'paid'`，可以只為這些資料建索引，索引會小很多：

```sql
CREATE INDEX orders_paid_user_created
  ON orders (user_id, created_at DESC)
  WHERE status = 'paid';
```

## 結論

索引不是加了就會快。先用 `EXPLAIN ANALYZE` 看實際的執行計畫，再決定索引要怎麼設計。
