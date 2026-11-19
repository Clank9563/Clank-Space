import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro:content';

const revision = z.object({ date: z.coerce.date(), note: z.string() });

const posts = defineCollection({
  // 檔案放在 src/content/posts/zh/ 或 src/content/posts/en/，資料夾名稱就是語言
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.enum(['cloud', 'backend', 'frontend', 'notes']),
    tags: z.array(z.string()).default([]),
    /** 同一篇文章的中英文版本用同一個 key 連結 */
    translationKey: z.string().optional(),
    /** 修訂紀錄：每次更新加一筆，舊內容不刪除 */
    revisions: z.array(revision).default([]),
    /** 過時的文章：標題會被劃線，保留作為紀錄 */
    outdated: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    period: z.string(),
    role: z.string(),
    stack: z.array(z.string()).default([]),
    links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
    translationKey: z.string().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updated: z.coerce.date(),
  }),
});

export const collections = { posts, projects, pages };
