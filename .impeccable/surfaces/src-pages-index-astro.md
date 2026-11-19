---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/layouts/Base.astro"]
---

# Personal site — whole-site surface

Scope: every route of the personal site (home, articles list/detail, categories/tags, projects, about, now, uses, contact, search). Visitor mode: **Read**. Articles are the core; home and about present the owner's identity inside the same reading frame.

Audience/job: engineers who land on one article from search or a link, and recruiters/collaborators skimming who the owner is. Constraints: zh-TW + EN, static (Astro → GitHub Pages), Pagefind search, Giscus comments, light + dark. All personal facts stay placeholders until the owner supplies them.

## Direction contract

THESIS: The site is an engineer's bound notebook that never erases. Every entry is dated and numbered, and a revision strikes the old words through rather than deleting them. It refuses the category default of a white page with a soft card grid.

OWN-WORLD: Green engineering computation pad #E4EEDC with a #C6D9BB 24px grid, which stays in the frame only. The reading column is plain sheet without the grid. Graphite ink #1F2A22, ballpoint blue #1E3FA0 only on things you can click, and a red margin rule #B8322A for the margin line and strike-through revisions. Schibsted Grotesk + Noto Sans TC for everything, JetBrains Mono for code only. Square corners and 1–2px ink rules, no shadows, no gradients. Night mode is the same notebook under a desk lamp: a deep green-black pad with chalk ink.

STORY: The visitor sees whose notebook this is and what it holds, reads an entry comfortably, then follows the numbered entries, projects or the sign-off row to more or to contact.

FIRST VIEWPORT: A header row of notebook fields: "Notebook of" + name, "Contents" (bilingual nav, active item underlined in pen blue), "Book / Page" (current page number), then language and theme. Below that, a red vertical margin rule with line numbers in the left gutter. The main column holds the date, a large two-line headline with one struck-through revision, a lede, and a ruled list of the newest entries (E-### number in blue, title, date · minutes). Sticky notes for Now and Projects sit in the right column. A signature row (recorded by / last revised / contact) closes every page. Article: the same header, the entry number and § numbers in the margin gutter, a ~68ch plain-sheet column, and the TOC as a note in the right column.

FORM: Grounded candidate 4 of 7 (engineering lab notebook), assigned by the roll in round 3. seed:94e910a91738feb9. Raises: three inks plus the pad only; state carried by line form (dashed = draft, double underline = revised, strike = outdated); blue only on clickables; strict entry numbering in the margin; sidenotes pinned beside their paragraph. Signature interaction: while reading, the current section's margin § number gets circled in pen, a stroke that draws itself. Motion grammar: that one drawn stroke plus instant state changes, with no fades on content.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Adaptations from the chosen sketch

- Decorative gutter line numbers (01–15) dropped: craft floor refuses section numbers that carry no information. The gutter carries only numbers the reader uses: entry numbers (E-###, P-###) and section numbers (§n).
- No "Home" nav item: the owner's name in the "Notebook of" field links home and carries aria-current, the same way a notebook's cover leads back to page one.
- The language field became three tools (search, theme, language) because Pagefind search and dark mode are confirmed requirements.
- Home adds two buttons (open entries / about me) so the first viewport offers a primary action for both audiences (readers and recruiters), plus a Categories note because categories are a confirmed requirement.
- On narrow screens the TOC moves to a collapsible note at the top of the entry, and sidenotes stack under their paragraph.
- A "Sample content" tag (1px ink frame; red stays reserved for the margin rule, strike-through revisions and the outdated notice) shows wherever placeholder facts appear, until `site.placeholder` is set to false.
