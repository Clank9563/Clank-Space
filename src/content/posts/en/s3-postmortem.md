---
title: Postmortem of an S3 permissions mistake
description: A test bucket was left publicly readable for three days. A timeline of what happened, why nothing stopped it, and what we changed.
date: 2026-10-18
category: cloud
tags: [AWS, S3, Postmortem]
translationKey: s3-postmortem
---

A postmortem is not about finding someone to blame. It is about finding the gap in the process that let the mistake happen.

## Timeline

| Time | Event |
| --- | --- |
| Day 1 10:20 | A new bucket is created to test an export feature |
| Day 1 10:35 | Block Public Access is turned off so the frontend can read files |
| Day 4 09:10 | The routine permissions scan raises a warning |
| Day 4 09:25 | Block Public Access is restored; no external access is found |

## Why nothing stopped it

Account-level Block Public Access was off, so every bucket could decide for itself. The scan ran once a day, and its alerts went to an inbox almost nobody read.

## What changed

1. Block Public Access is now enabled at the account level.
2. Anything public is served through CloudFront, never straight from a bucket.
3. Scan alerts go to the team's on-call channel.

## What I learned

"Temporary" settings are the dangerous ones, because nobody remembers to undo them. Every temporary exception now needs a written end date on its ticket.
