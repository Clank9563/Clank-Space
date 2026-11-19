---
title: Moving my blog to a fully static Astro site
description: Moving a server-rendered blog to Astro and GitHub Pages. The migration steps, the base-path trap, and why the backend was no longer needed.
date: 2026-11-02
category: frontend
tags: [Astro, GitHub Pages, Static sites]
translationKey: astro-static
revisions:
  - date: 2026-11-09
    note: Added the GitHub Actions deployment steps and the base path notes
---

My old blog ran on a small virtual machine. I paid for it every month and had to remember to patch it. Yet it only ever did one thing: turn Markdown into HTML. This entry records how I made it static.

## Why Astro

- Every entry is a Markdown file; drop it in a folder and it appears on the site.
- No JavaScript is shipped to the browser by default.
- Content collections validate every entry's frontmatter, so a typo in a date fails the build.

## Defining the entry format

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

## Deploying to GitHub Pages

| Type | URL | `base` |
| --- | --- | --- |
| User site | `account.github.io` | `/` |
| Project site | `account.github.io/repo` | `/repo` |

Get `base` wrong and the symptom is obvious: the home page loads, but every stylesheet and link returns 404.

## The result

Hosting went from a monthly bill to zero. The price is that comments and search need serverless options: Giscus for comments, Pagefind for search.
