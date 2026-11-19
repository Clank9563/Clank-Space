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
    category: z.enum(['cloud', 'backend', 'frontend', 'network', 'devops', 'database', 'security', 'ai']),
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

const essays = defineCollection({
  // 隨筆（金融、哲學等非技術雜記）：src/content/essays/zh/ 或 src/content/essays/en/
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/essays' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    /** 主題，例如「金融」「哲學」，顯示在列表與文章開頭 */
    topic: z.string().optional(),
    translationKey: z.string().optional(),
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
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    updated: z.coerce.date(),
    /** 選填：大頭照，相對於這個 .md 檔的路徑，例如 ../photo.jpg。建置時會自動壓縮 */
    photo: image().optional(),
    /** 照片的替代文字，給螢幕閱讀器與圖片載入失敗時使用 */
    photoAlt: z.string().optional(),
  }),
});

export const collections = { posts, essays, projects, pages };
