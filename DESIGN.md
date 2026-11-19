---
name: Engineering Notebook
description: A personal site and technical blog kept as an engineer's bound notebook that never erases.
colors:
  pad: "#e4eedc"
  grid: "#c6d9bb"
  sheet: "#eef4e9"
  ink: "#1f2a22"
  ink-2: "#4a574d"
  hair: "#a9bfa0"
  pen: "#1e3fa0"
  pen-wash: "#c9d4f2"
  red: "#b8322a"
  code-bg: "#f6f9f3"
  tok-keyword: "#7b2d5b"
  tok-string: "#2b6a3c"
  tok-number: "#8a4a12"
  tok-comment: "#5c6a5f"
  tok-function: "#5a2f86"
  pad-night: "#121a15"
  grid-night: "#1d2a21"
  sheet-night: "#17211b"
  ink-night: "#dbe6d6"
  ink-2-night: "#a3b3a5"
  hair-night: "#34463a"
  pen-night: "#9db2ff"
  pen-wash-night: "#2c3d78"
  red-night: "#ec7b70"
  code-bg-night: "#0e1511"
  tok-keyword-night: "#e8a6cb"
  tok-string-night: "#9fd8a6"
  tok-number-night: "#f0b27a"
  tok-comment-night: "#8a9b8d"
  tok-function-night: "#d4b0ff"
typography:
  display:
    fontFamily: "'Schibsted Grotesk Variable', 'Noto Sans TC', system-ui, sans-serif"
    fontSize: "clamp(34px, 4.6vw, 60px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "'Schibsted Grotesk Variable', 'Noto Sans TC', system-ui, sans-serif"
    fontSize: "clamp(30px, 3.8vw, 46px)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.005em"
  title:
    fontFamily: "'Schibsted Grotesk Variable', 'Noto Sans TC', system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  entry-title:
    fontFamily: "'Schibsted Grotesk Variable', 'Noto Sans TC', system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.45
  body:
    fontFamily: "'Schibsted Grotesk Variable', 'Noto Sans TC', system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.8
  body-small:
    fontFamily: "'Schibsted Grotesk Variable', 'Noto Sans TC', system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.65
  note-heading:
    fontFamily: "'Schibsted Grotesk Variable', 'Noto Sans TC', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.12em"
  label:
    fontFamily: "'Schibsted Grotesk Variable', 'Noto Sans TC', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
  margin-mark:
    fontFamily: "'Schibsted Grotesk Variable', 'Noto Sans TC', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    letterSpacing: "0.02em"
    fontFeature: "'tnum' 1"
  code:
    fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace"
    fontSize: "14.5px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  none: "0px"
spacing:
  gutter: "104px"
  gutter-narrow: "44px"
  column-gap: "48px"
  aside: "300px"
  measure: "68ch"
  page-top: "44px"
  page-bottom: "64px"
  section-gap: "56px"
components:
  button-primary:
    backgroundColor: "{colors.pen}"
    textColor: "{colors.pad}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.pad}"
    textColor: "{colors.pen}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.pen}"
  tool-button:
    backgroundColor: "transparent"
    textColor: "{colors.pen}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "40px"
    width: "40px"
  filter-chip:
    backgroundColor: "{colors.pad}"
    textColor: "{colors.pen}"
    rounded: "{rounded.none}"
    padding: "5px 12px"
  filter-chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.pad}"
  note:
    backgroundColor: "{colors.pad}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "18px 20px 20px"
  article-sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "40px clamp(20px, 4vw, 56px) 56px"
  code-block:
    backgroundColor: "{colors.code-bg}"
    textColor: "{colors.ink}"
    typography: "{typography.code}"
    rounded: "{rounded.none}"
    padding: "18px 20px"
  copy-button:
    backgroundColor: "{colors.pad}"
    textColor: "{colors.pen}"
    rounded: "{rounded.none}"
    padding: "4px 10px"
    height: "30px"
---

# Design System: Engineering Notebook

## Overview

**Creative North Star: "The Notebook That Never Erases"**

The site is an engineer's bound lab notebook. The frame is a green computation pad ruled with a 24px grid; the reading column is a plain sheet laid on top of it, with no grid behind the words. Every entry carries a number in the left margin (E-### for writing, P-### for projects, §n for sections), every page carries a dated signature row, and a revision is shown by striking the old words through in red rather than deleting them.

The system is three inks on one paper: graphite for text and rules, ballpoint blue for what the reader can act on and where the reader is, and a red margin rule that also does strike-through revisions. Everything else is built from square-cornered boxes and 1 to 2px ink lines. There are no rounded corners and no fills beyond the pad, the sheet, and the code panel; the only shadows belong to paper that physically lifts off the pad (taped notes, the article sheet, the pen on the desk). Night mode is the same notebook under a desk lamp: a deep green-black pad with chalk-pale ink, the same structure, the same three roles.

Density is moderate and reading-first: 17px body at 1.8 line height on a 68ch measure, with the furniture (field labels, entry metadata, notes) set smaller and quieter around it. State is carried by line form, not by color or badges: dashed underline means draft, double underline means revised, red strike means outdated.

**Key Characteristics:**
- Green grid pad in the frame only; the reading column is gridless sheet.
- A single red vertical margin rule at the gutter edge, the only vertical color line on any page.
- Margin gutter holds only numbers the reader uses: entry numbers and § section numbers.
- Square corners everywhere; borders of 1px (hairline/rule) to 2px (section rules).
- Paper, not chrome: no decorative gradients; shadows only where a piece of paper or the pen lifts off the pad.
- Motion belongs to the notebook and lives in `src/styles/motion.css`: the pen ring, a page turn between pages, the page number rolling like a counter, the live strike-through on the home headline, rows being written in, a pen underline on hover, and the red margin rule inking in as reading progress. Everything else changes instantly.

## Colors

Three inks on a green engineering pad, re-inked for night under the `-night` tokens with the same roles.

### Primary
- **Ballpoint Blue** (pen): links, buttons, tool buttons, the active nav item, list-row entry numbers, the current TOC item, and the pen ring around the current § number. It means "you can act on this" or "you are here", and nothing else.
- **Ballpoint Wash** (pen-wash): text selection and search-hit highlight only.

### Secondary
- **Margin Red** (red): the vertical margin rule, strike-through on outdated titles and `<s>`/`<del>` revisions, and the border of the outdated-entry callout. Never used for text fills, tags, or decoration.

### Neutral
- **Computation Pad** (pad): page background, header, notes, entry rows, chip and secondary-button fill. Carries the grid.
- **Pad Grid** (grid): the 24px grid lines on the pad. Appears in the frame only, never behind the reading column.
- **Plain Sheet** (sheet): the article/reading sheet and hover fill for buttons and tools.
- **Graphite** (ink): body text, headings, and every structural rule (the `--rule` token is ink in both themes).
- **Soft Graphite** (ink-2): metadata, field labels, § numbers at rest, sidenotes, descriptions.
- **Hairline** (hair): fine dividers inside a record (dashed note rows, table rows, record cells, signature cells).
- **Code Paper** (code-bg): code block background.
- **Syntax inks** (tok-keyword, tok-string, tok-number, tok-comment, tok-function): Shiki css-variables theme, code only.

### Named Rules
**The Three Inks Rule.** Graphite, ballpoint blue, and margin red are the only inks. Any new color is a syntax token inside a code block or it does not ship.

**The Pen Means Act-or-Here Rule.** Blue marks something clickable or the reader's current position (active nav, current TOC item, the pen ring). Static decoration in blue is a defect.

**The Red Is Revision Rule.** Red is the margin line and the strike-through. A placeholder or sample marker uses a 1px ink frame, not red.

## Typography

**Display Font:** Schibsted Grotesk Variable (with Noto Sans TC for CJK, then system-ui)
**Body Font:** Schibsted Grotesk Variable + Noto Sans TC (400/500/700)
**Label/Mono Font:** JetBrains Mono Variable, for code only

**Character:** One grotesk for everything, paired with Noto Sans TC so Chinese and Latin sit on the same line at the same weight. Hierarchy comes from size and weight, never from a second display face.

### Hierarchy
- **Display** (700, clamp(34px, 4.6vw, 60px), 1.2): the home headline only, max ~18em.
- **Headline** (700, clamp(30px, 3.8vw, 46px), 1.25): article and text-page titles; list-page titles use clamp(30px, 3.6vw, 44px).
- **Title** (700, 26px, 1.3; 22px under 720px): prose h2, numbered §n in the margin. Prose h3 is 700 / 20px.
- **Entry title** (600, 20px, 1.45; 18px under 720px): entry rows in lists.
- **Body** (400, 17px, 1.8; 16.5px under 720px): prose, held to a 68ch measure. Ledes run 18 to 19px.
- **Body small** (400, 15.5px, 1.65 to 1.7): notes, entry descriptions, record values, tables, callouts.
- **Note heading** (700, 13px, 0.12em, uppercase): the heading of a note, the revisions block, comments, and table headers (13px, 0.08em). Section heads on the home page use 15px / 0.1em.
- **Label** (600, 12px, 0.12em, uppercase, ink-2): a notebook field name sitting directly above its value (Notebook of / Contents / Book·Page, the record row, the signature row, pager direction).
- **Margin mark** (600, 14px, tabular numerals; 11.5px under 720px): E-###, P-###, §n in the gutter.
- **Code** (JetBrains Mono, 14.5px, 1.65; inline code 0.86em).

### Named Rules
**The Field Label Rule.** An uppercase tracked label always names a value printed right beneath it, like a form field on a notebook page. It never floats above a headline as a teaser.

**The Tabular Numbers Rule.** Dates, page numbers, entry numbers, reading times, and counts use tabular numerals.

## Layout

The page is a three-column notebook spread: a 104px margin gutter, the main column, and a 300px aside for notes, with a 48px column gap, a 1440px max width centred in the window (above 1441px the header fields pad in to the same 1440px frame), and 56px right padding. The red margin rule sits at the gutter's right edge and runs the full page height. The main column starts 44px below the header and ends 64px above the signature row. Home sections open with a 56px gap and a 2px ink rule under a small uppercase heading.

The header is a single row of bordered notebook fields (owner, contents, book/page, tools) separated by 1px ink rules, 88px tall, closed by a 2px rule. Every page closes with a three-cell signature row (recorded by / last revised / contact) under a 2px rule.

Articles sit on a plain sheet capped at the 68ch measure plus padding. Sidenotes pair with their paragraph in a two-column row (paragraph + 170px note, 24px gap) above 1181px only; elsewhere they stack under the paragraph.

Responsive behavior:
- **≤1180px:** the aside drops under the main column as an auto-fit grid of notes (min 260px); the TOC becomes a collapsible note at the top of the entry.
- **≤900px:** the header becomes owner + tools on one row and a horizontally scrolling nav row below; the book/page field hides.
- **≤720px:** the gutter narrows to 44px, column gap to 16px; entry rows stack meta under title; record grid becomes two columns; signature row and pager stack.

## Elevation & Depth

Depth is physical paper layering: the gridless sheet lies on the gridded pad with a second sheet beneath it, notes are taped on, and the pen rests on the desk. These, and only these, lift with the soft `--lift` shadow stack. Boxes are otherwise drawn with ink rules, and nothing gains a shadow on hover.

### Named Rules
**The Drawn-Not-Lifted Rule.** Separation comes from a 1.5px ink border or a change from pad to sheet, never from a shadow or blur. Hover changes a fill (pad to sheet) or an underline, not elevation.

**The Grid-Is-The-Only-Gradient Rule.** The pad's 24px grid is built from two hard-stop linear gradients; that is the only gradient in the system. No soft color gradients on fills, text, or borders.

## Shapes

Square corners throughout (0px radius), including third-party UI (Pagefind is set to 0 radius). Line weights carry the hierarchy: 2px ink for section and page rules (header bottom, section heads, record top, signature row, pager, revisions, comments), 1.5px ink for boxed objects (notes, article sheet, buttons, tools, chips, code blocks), 1px ink for entry-row dividers and blockquote edges, 1px hairline (dashed inside notes) for rows within a record. Line form carries state: dashed underline = draft, double underline (3px double) = revised, red line-through = outdated.

## Components

### Buttons
Ruled ink boxes, stamped rather than raised.
- **Shape:** square (0px), 1.5px ink border, 44px min height, 0 20px padding, 600 16px.
- **Primary:** ballpoint blue fill with pad-colored text and a blue border; hover brightens slightly (brightness 1.12). One per view, for the main action.
- **Secondary:** pad fill, blue text, ink border; hover fills with sheet and underlines the label.
- **Tool button:** 40×40 square, transparent, blue icon or label (search, theme, language) in the header. Hover fills with sheet. Icons are 18px line SVGs, 2px stroke, square caps.
- **Copy button:** small (30px) ink-boxed button pinned top-right in code blocks; label switches to the "copied" text in ink for 1.6s.
- **Focus:** 2px solid blue outline, 2px offset, on every focusable element.

### Chips (category filter)
- **Style:** pad fill, 1.5px ink border, 5px 12px padding, 15px / 500, count in ink-2 tabular numerals.
- **State:** the active chip inverts to ink fill with pad text.

### Cards / Containers (notes)
- **Corner Style:** square (0px).
- **Background:** pad (notes) or sheet (article).
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1.5px ink.
- **Internal Padding:** 18px 20px 20px for notes; 40px clamp(20px, 4vw, 56px) 56px for the article sheet.
- Notes have a 13px uppercase heading and list rows divided by 1px dashed hairlines.

### Navigation
- **Header nav ("Contents" field):** 16px / 500 ink links, with the English name in 12.5px ink-2 after the Chinese on zh pages. Hover turns blue. Active item is blue with a 2px underline offset 7px. The owner's name links home and carries the current state for the home page.
- **Mobile:** single horizontally scrolling row with hidden scrollbar; field label and English subnames hidden.
- **Entry list:** ruled rows (1px ink bottom border), whole row clickable; entry number in blue in the margin; title 20px / 600; meta (date · revised · minutes) right-aligned in ink-2. Hover underlines the title in blue.
- **Pager:** two cells under a 2px rule split by a 1px rule; field label with direction and entry number, title 17px / 600.

### Record row
A ruled data strip under the article title: 2px rule above, 1px below, auto-fit cells (min 130px) separated by hairlines, each a field label over a 15.5px / 600 value.

### Pen Ring (signature component)
While the reader scrolls an article, the § number of the section currently above 30% of the viewport turns blue and a hand-drawn ballpoint loop draws itself around it (SVG path, 2.3px main stroke plus a 1.3px tail at 0.85 opacity, round caps). The main stroke draws over 480ms, the tail over 220ms after a 420ms delay, both on cubic-bezier(0.16, 1, 0.3, 1). The matching TOC item turns blue and 600 weight with aria-current="location". Under reduced motion the ring appears without drawing. This is the system's only animation.

### Visit counts (GoatCounter)
When `site.goatcounter.code` is set, the signature row gains a "Page turns / 翻閱次數" field (site total) and the article record row gains a "Reads / 閱讀次數" field (that page). Both are filled from GoatCounter's public counter JSON, in tabular numerals, and show an em dash until the number loads. When the code is empty, neither field renders.

### Paper (src/styles/paper.css)
- **Grain and fiber:** two procedural SVG noise layers (feTurbulence data URIs) sit over the grid on the body and the sheet: fine grain at 9% alpha and long horizontal fibers at 10% (3% in night mode). The article sheet, notes and header carry the grain too.
- **Perforation:** a row of 2px hair-coloured holes on a 14px pitch runs 10px below the header, like the tear-off edge of a computation pad.
- **Taped notes:** aside notes are slips of paper. They tilt between -0.5deg and +0.45deg, lift with the soft `--lift` shadow, and are held by a translucent 92x22px tape strip with dashed torn ends. The TOC note stays square and untaped so it reads cleanly.
- **Stacked sheet:** the article sheet lifts off the pad with `--lift`, with a second sheet peeking out 6-7px below it, rotated 0.6deg.
- **The pen:** a pen-blue ballpoint (authored SVG: chrome cone tip with a lit ball, recessed rubber grip grooves, a plastic barrel with a narrow specular highlight and a lower rim light, chrome ring and clip with seam shadows, a domed end cap, and "NOTEBOOK · 0.5 mm" print) lies on the desk at the bottom-right corner, rotated 24deg, with a two-layer drop shadow. It is fixed, decorative (`aria-hidden`, no pointer events), stays on top and still during page turns, and slides away near the page end so it does not cover the signature row. It is hidden at 720px and below.
- **The pen writes (`public/pen-write.js`):** the first time a visitor enters each page (by page turn or direct load; remembered per path in localStorage as `nb-pen-written:<path>`), the pen writes out everything visible in the first viewport, in reading order: the main column block by block (title, lede, record row, entries, body paragraphs, headings, lists), then the aside notes. Content below the fold is simply there. The title is written character by character. Each character gets 2-3 up-and-down strokes, a slight pen lift between characters, varied durations and an occasional pause. Other text is written in quick multi-character strokes. A clip-path on each block reveals text exactly up to the tip, line by line. Moving between blocks is a lift, a 180ms move and a 50ms touch-down with a small contact bounce; a new line within a block is an 80ms carriage return. Before starting, the script estimates the total and speeds up body text so the first viewport finishes in about 6.5s (8-10s with pick-up and return). Pick-up: the pen first rolls about 5deg to adjust its grip, then lifts (up to 7% larger, with a longer, softer shadow). While writing it tilts toward the paper, foreshortened 13% along its length. Put-down: it flies back, settles, and rolls with a damped oscillation before stopping. Any scroll, click, key press or resize reveals everything at once (synchronously, so that same click reaches the link underneath) and sends the pen straight back. It does not run with reduced motion or when the pen is hidden (720px and below). Content is only hidden once the pen is certain to write it, so any failure leaves it visible.
- **Depth exception:** the old "no shadows" rule now has one family of exceptions. Paper that physically lifts off the pad (notes, the article sheet, the pen) uses the soft `--lift` stack. Nothing else casts a shadow.

### Notebook motion (src/styles/motion.css)
- **Page turn:** cross-document View Transitions (`@view-transition { navigation: auto }`). The whole sheet below the header (`.nb-body`, opaque grid pad) is one page, turned the way a hand turns paper over 1200ms, inside a 3800px perspective. First the right side lifts and twists (22%: rotateY -14deg, rotateX 2.5deg, rotateZ -0.8deg, toward the reader by 18px). Then the page accelerates over (60%: -62deg, 36px forward) and finally falls away darkening (100%: -104deg, brightness 0.62). A drop-shadow, cast by the lifted page onto the new page beneath, grows and softens as the page rises. The new page brightens from 0.8 as the light comes back. Going back through history (a `back` view-transition type set on `pagereveal`) turns the previous page back over the current one, pausing just before it settles flat. The header and the pen stay on top and still. Browsers without support just navigate.
- **Paper curl (WebGL, `public/page-curl.js`):** where WebGL is available, the page turn becomes a real curl. The still-flat part of the old page is the View Transition snapshot, clipped along a moving fold line by a WAAPI animation on the pseudo-element. The lifted part is drawn on a `.nb-curl` canvas: a 160x48 mesh wrapped around a cylinder whose radius swells mid-turn, so you see the back of the sheet (pad colour, grid faintly showing through), a highlight on the bend, and a shadow cast onto the new page. The fold starts slanted, so the bottom-right corner lifts first, and straightens as it travels left over 1300ms (slow-fast-slow). The canvas reads its progress from the clip animation's `currentTime`, which keeps the two in sync. Back navigation plays the same curl in reverse. Without WebGL or with reduced motion, the CSS 3D turn above applies.
- **Page-number roll:** the Book / Page value (`nb-page-no`) rolls up: halfway through the turn, the old value leaves upward (380ms, 300ms delay) and the new one rises in (620ms, 520ms delay), clipped to its field.
- **Live revision:** on the home headline a red stroke (0.09em, rotated -1.2deg) strikes the old words over 900ms, then the new words are written left to right with a clip-path over 1300ms.
- **Rows written in:** entry text is written in left to right (800ms, 110ms stagger, capped at 660ms), and the margin number fades in with its row. On hover or focus, a 2px pen underline draws under the margin number in 320ms.
- **Reading progress:** on article pages a 4px red bar over the margin rule scales from the top with a scroll-driven animation (`animation-timeline: scroll(root)`). It is hidden where unsupported.
- **Gating:** entrance motion runs only when `html.nb-play` is set, once per page per session through sessionStorage, and never on a page the pen is writing (pen-write.js removes `nb-play`, so the content is not animated twice). Otherwise the default is the finished state. Reduced motion turns off the page turn and entrance motion and keeps the progress bar and the state colours.

### Sidenote
A 14 to 14.5px ink-2 note with a 1px ink rule above it, pinned beside its paragraph on wide screens and stacked beneath it otherwise; a bold lead word in ink.

### Code block
Code paper background, 1.5px ink border, JetBrains Mono 14.5px / 1.65, 18px 20px padding (44px top to clear the copy button), syntax colored only with the tok-* inks. Inline code: pad fill, 1px hairline border, 0.86em.

## Do's and Don'ts

### Do:
- **Do** keep the 24px grid on the pad frame and put reading text on the gridless sheet.
- **Do** number things in the margin only when the number is real: E-### entries, P-### projects, §n sections.
- **Do** show revisions by striking old text through in red (0.09em on inline text, 2 to 3px on titles), keeping it legible in ink-2.
- **Do** draw every box with square corners and 1.5px ink; use 2px ink for section and page rules.
- **Do** carry state with line form: dashed underline for draft, double underline for revised, red strike for outdated.
- **Do** mark placeholder content with the sample tag: a 1px ink frame, ink-2 text, 13px / 600.
- **Do** use tabular numerals for every date, count, and number.

### Don't:
- **Don't** use rounded corners, drop shadows, or soft color gradients anywhere.
- **Don't** use ballpoint blue on anything that is neither clickable nor the reader's current position.
- **Don't** use margin red for tags, badges, warnings in general, or placeholder markers; it is reserved for the margin rule, strike-through revisions, and the outdated callout border.
- **Don't** put decorative numbers or line numbers in the gutter.
- **Don't** add generic fades, slides, or scroll reveals. Every motion must be something a notebook does (draw, strike, write, turn, ink in), and entrance motion plays once per page per session from an already-visible default.
- **Don't** introduce a second display face or set prose in the mono; JetBrains Mono is for code only.
- **Don't** place an uppercase tracked label above a headline as a teaser; labels name a field's value.
