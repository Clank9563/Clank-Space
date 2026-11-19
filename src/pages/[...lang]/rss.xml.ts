import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { langParams, url, type Lang } from '../../i18n';
import { getPosts } from '../../lib/content';
import { site } from '../../site.config';

export function getStaticPaths() { return langParams(); }

export async function GET(context: APIContext) {
  const lang = (context.props as { lang: Lang }).lang;
  const posts = await getPosts(lang);
  return rss({
    title: site.title[lang],
    description: lang === 'zh' ? `${site.name.zh} 的工作筆記` : `Working notes by ${site.name.en}`,
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: url(lang, `posts/${p.slug}/`),
      categories: [site.categories[p.data.category][lang], ...p.data.tags],
    })),
    customData: `<language>${lang === 'zh' ? 'zh-TW' : 'en'}</language>`,
  });
}
