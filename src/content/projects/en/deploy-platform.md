---
title: Internal deployment platform
description: One command for the team to deploy services to staging and production, replacing a hand-run script.
date: 2025-03-01
period: 2025.03 – 2025.12
role: Backend design and implementation
stack: [Go, AWS ECS, Terraform, GitHub Actions]
translationKey: deploy-platform
links:
  - label: Source
    href: https://github.com/your-account/deploy-platform
---

> Sample project: demo content that ships with the site template. Replace it with your own.

## The problem

Deploys depended on a long script only two people knew how to run, and failures were hard to roll back.

## The approach

- Every service is described by the same Terraform module; only the config differs.
- GitHub Actions triggers each deploy and keeps a record, so rolling back is one click.

## My part

API design, deploy status tracking, and the rollback mechanism.
