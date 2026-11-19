---
title: Cloud cost dashboard
description: Aggregates daily cloud spend per service and alerts the owning team when a budget is exceeded.
date: 2026-02-01
period: 2026.02 – 2026.05
role: Solo developer
stack: [Python, AWS Cost Explorer, PostgreSQL]
translationKey: cost-dashboard
---

## The problem

We only learned which service overspent when the monthly bill arrived, too late to adjust.

## The approach

Pull Cost Explorer data daily, attribute it to teams by tag, and alert at 80% of budget.

## My part

The whole pipeline, from data extraction to alerts.
