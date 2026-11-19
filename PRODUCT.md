# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro (static output), deployed to GitHub Pages via GitHub Actions. Articles authored in Markdown/MDX content collections.

## Users

- Primary owner: an engineer / technical professional who publishes articles and presents their professional identity.
- Primary visitors: fellow engineers reading technical articles (often arriving from search or a shared link, landing directly on one article), and recruiters / collaborators evaluating the owner's experience and projects.

## Product Purpose

A personal identity site and technical blog. Success means visitors can read articles comfortably, understand who the owner is and what they have built, and find a way to get in touch. The owner must be able to publish a new article by adding one Markdown file.

## Positioning

The owner's own voice, writing, and work. Nothing on the site may claim experience, employers, clients, or results the owner has not supplied.

## Capabilities and Constraints

- Bilingual: Traditional Chinese (zh-TW) and English, with a language switcher. An article may exist in only one language.
- Pages: home, about / experience, projects (list + detail), articles (list + detail), categories / tags, contact (email + social links; no server-side form), /now, /uses.
- Articles: categories and tags, RSS feed, table of contents, estimated reading time, code syntax highlighting with copy button, previous / next navigation.
- Site search: Pagefind (static, no backend).
- Light and dark themes.
- Comments: Giscus (GitHub Discussions); needs a public GitHub repo and its repo / category IDs, which are not yet provided.
- Fully static; GitHub Pages means the `base` path depends on whether it is a user site or a project site (undecided).

## Evidence on Hand

None yet. The owner's name, title, bio, experience, projects, articles, and social links are not provided. All such content is placeholder and must be clearly marked as such; do not invent realistic-looking employers, metrics, or testimonials.

## Product Principles

1. Reading comes first: an article page must be excellent on its own, because most visitors arrive there directly.
2. Publishing must stay cheap: one Markdown file per article, no manual wiring.
3. Truthful identity: only real, owner-supplied facts about the person.
4. Small and maintainable: no features or dependencies beyond the confirmed list.

## Accessibility & Inclusion

WCAG 2.2 AA as a baseline; CJK and Latin typography both need to read well; respect `prefers-reduced-motion` and `prefers-color-scheme`.
