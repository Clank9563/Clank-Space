import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n';

export type Post = CollectionEntry<'posts'>;
export type Project = CollectionEntry<'projects'>;

/** id 形如 "zh/astro-static"，第一段是語言、其餘是網址代稱 */
export const langOf = (id: string) => id.split('/')[0] as Lang;
export const slugOf = (id: string) => id.split('/').slice(1).join('/');

const byDateDesc = (a: { data: { date: Date } }, b: { data: { date: Date } }) =>
  b.data.date.valueOf() - a.data.date.valueOf();

/**
 * 文章編號：所有語言一起依初稿日期排序後連號（E-001 起），
 * 同一篇的中英文版本（同 translationKey）共用一個編號。
 */
async function entryNumbers(): Promise<Map<string, number>> {
  const all = (await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft))
    .sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());
  const keyNo = new Map<string, number>();
  const idNo = new Map<string, number>();
  for (const p of all) {
    const key = p.data.translationKey ?? p.id;
    if (!keyNo.has(key)) keyNo.set(key, keyNo.size + 1);
    idNo.set(p.id, keyNo.get(key)!);
  }
  return idNo;
}

export const entryLabel = (n: number, prefix = 'E') => `${prefix}-${String(n).padStart(3, '0')}`;

export async function getPosts(lang: Lang) {
  const numbers = await entryNumbers();
  return (await getCollection('posts', ({ id, data }) => langOf(id) === lang && (import.meta.env.DEV || !data.draft)))
    .sort(byDateDesc)
    .map((p) => ({ ...p, no: numbers.get(p.id)!, slug: slugOf(p.id) }));
}
export type NumberedPost = Awaited<ReturnType<typeof getPosts>>[number];

export async function getProjects(lang: Lang) {
  const all = (await getCollection('projects')).sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());
  const keyNo = new Map<string, number>();
  for (const p of all) {
    const key = p.data.translationKey ?? p.id;
    if (!keyNo.has(key)) keyNo.set(key, keyNo.size + 1);
  }
  return all
    .filter((p) => langOf(p.id) === lang)
    .sort(byDateDesc)
    .map((p) => ({ ...p, no: keyNo.get(p.data.translationKey ?? p.id)!, slug: slugOf(p.id) }));
}

/** 找另一個語言的對應版本 */
export async function findTranslation(collection: 'posts' | 'projects', key: string | undefined, target: Lang) {
  if (!key) return undefined;
  const all = await getCollection(collection);
  const hit = all.find((e) => e.data.translationKey === key && langOf(e.id) === target);
  return hit ? slugOf(hit.id) : undefined;
}

/** 最後修訂日期：有修訂紀錄就取最新一筆，否則是初稿日期 */
export const lastRevised = (p: Post) =>
  p.data.revisions.reduce((d, r) => (r.date > d ? r.date : d), p.data.date);

/** 閱讀時間：中文以每分鐘 400 字、英文以每分鐘 220 字估算 */
export function readingMinutes(body = ''): number {
  const text = body.replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]+>/g, ' ');
  const cjk = (text.match(/[㐀-鿿豈-﫿]/g) || []).length;
  const words = (text.replace(/[㐀-鿿豈-﫿]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 220));
}

export const tagSlug = (tag: string) => tag.toLowerCase().replace(/\s+/g, '-');
