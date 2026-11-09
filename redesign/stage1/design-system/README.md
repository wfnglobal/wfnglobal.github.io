# Word and Faith Network

A brand system for a church without walls: a global, fully digital ministry built around one daily rhythm. The Word, declared. Prayer, offered. Faith, lived out.

Version 2 (November 2026) extends the system for **WFN App 2.0**, the complete redesign of the progressive web app at wfnglobal.org/app. The website facelift already runs on version 1; version 2 keeps its character and adds what a daily reading and prayer product needs: a reading theme, highlight colors, pillar coding, elevation and motion rules, and app components.

## What the brand believes

Three pillars, always in this order:

1. **The Word.** Scripture delivered daily, not just to be read, but declared.
2. **Prayer.** Targeted, faith-filled, scripture-based intercession and declaration.
3. **Faith.** Bible studies and teaching that move a reader from knowing about God to walking in His promises.

Core scripture: Romans 10:17, "So then faith cometh by hearing, and hearing by the word of God." The Word produces faith, and faith prays. Every screen traces back to that chain.

Facts that shape the product, not just the copy:

- No building, no address. WFN is fully digital and global, so nothing gestures at a physical campus (no pews, steeples, stained glass or "visit us").
- A complete offline King James Bible lives in the app.
- Nothing is ever taken down. Sermons, studies, declarations and fire prayers form a permanent, growing archive.
- New content arrives on a daily clock: the verse, sermon and declaration at midnight, the Bible study at 7am, the night prayer at 8pm and the fire prayer at midnight.
- A weekly Prayer Circle runs on X Spaces; a WhatsApp community carries prayer between sessions.

## Product principles (App 2.0)

1. **The Word is the interface.** Scripture is the largest, calmest thing on any screen. Chrome recedes: hairlines, not boxes; type, not icons.
2. **One daily rhythm.** Home is "Today": the day's verse, declaration, study, sermon and night prayer in the order they're meant to be lived, with quiet progress. It is not a feed.
3. **Read without interruption.** Every long text (Bible, sermon, study, book) opens in the same reading surface with three themes (Light, Paper, Dark), adjustable size, and a focus mode that hides all chrome.
4. **Pick up where you left off.** The app always knows the last chapter, sermon, book page and plan day, and offers one tap back.
5. **Restraint over decoration.** No gradients behind text, no stock imagery, no glow, no emoji as icons. Color appears only where it carries meaning.

## Voice

Direct, scriptural, unhurried. WFN writes the way it prays: plainly, with conviction, without ornament. Avoid devotional clichés ("Blessed Monday!", "Be encouraged, fam!") and avoid corporate coldness. The register sits between a serious publication and a trusted teacher: *"Today's word is for the waiting."* not *"Check out today's inspirational verse!"*

Interface copy is short and literal: "Continue reading", "Save declaration", "Mark as prayed", "Join the Prayer Circle". Greetings use the reader's first name and the time of day ("Good evening, Oladapo"), nothing more.

## Logo

**Current mark: the three-petal emblem** (`assets/Logos/emblem-light.svg`, `emblem-dark.svg`, `app-icon-emblem.svg`). Three petals turning around one centre: the Word (sand gold), Prayer (sage) and Faith (clay) held together by a single point. It shipped on the website header in the October 2026 facelift and becomes the app icon and app header mark in App 2.0. The petal colors are the source of the pillar colors below.

The earlier ring-and-line mark (`mark-*`, `wordmark-*`, `app-icon-light/dark`) is kept for reference but superseded.

Rules: minimum size 20px; clear space equal to one petal on every side; never recolor the petals to one color; never rotate, outline or stretch it; on photographs use the app-icon tile.

## Color

Three themes, same structure: **Light** (default), **Dark**, and **Paper**, a warm sepia theme used only inside the reading surface. Exact values in `tokens.json`.

- **`surface-100`** is the page, a warm white rather than pure white. **`surface-200`** is a card or sheet on it. **`surface-300`** is sunken: inputs, search, segmented controls, progress tracks. **`sand`** is the one warm neutral band: the Today rhythm rail and selected chips.
- **`ink`**, **`ink-2`**, **`ink-3`** step from scripture and body text to captions to timestamps. Body copy and scripture always sit on `ink`.
- **`sage`** is the working accent: links, the active tab, primary buttons, progress. A muted green-teal, deep enough to pass 4.5:1 as text.
- **`bronze`** is reserved for the Word: scripture references, the verse-of-the-day eyebrow. One or two uses per screen.
- **`clay`** marks Faith (studies, sermons, books, plans) and doubles as the only destructive color.

**Pillar coding.** Every piece of content belongs to one pillar, shown by a 6px dot or a thin rule in `pillar-word`, `pillar-prayer` or `pillar-faith`, never by a colored card. A reader learns the system without being told: bronze is Scripture, sage is prayer, clay is teaching.

**Highlights.** Four Bible highlight swatches (`highlight-gold`, `-sage`, `-blush`, `-sky`), tuned per theme so ink stays at 4.5:1 or better on top of them.

## Type

- **Inter** is the interface: navigation, buttons, labels, metadata. Tabular figures for counts, dates and progress.
- **Newsreader** (optical sizing) carries Display and Scripture: headlines, every verse, every declaration, sermons, studies and books. Never set a verse in Inter; never set a button in Newsreader. The reader should tell, without reading a word, whether they're looking at the product or at the Word.
- **Atkinson Hyperlegible** is an accessibility reading option in the reading surface, offered next to Newsreader.

Reading measure: 60 to 68 characters. Verse numbers are Inter at `eyebrow` size in `ink-3`, set as superscript inline, never in the margin. Scripture references are Inter `label` in `bronze`, written "Isaiah 49:25 · KJV".

## Spacing, shape and elevation

A 4px-rooted scale; the phone gutter is `space-4`, the gap between Home sections `space-8`. Radii step from `radius-sm` (chips) to `radius-xl` (sheets and the verse card).

Cards separate from the page with a one-step surface shift or a `line` hairline, never a shadow. `shadow-float` is reserved for things that genuinely float: bottom sheets, the text-selection bar, toasts and the audio mini-player.

## Motion

One curve, `cubic-bezier(0.2, 0, 0, 1)`: 140ms for press states and toggles, 240ms for sheets, card reveals and page transitions. Sheets rise from the bottom; pages cross-fade with a 6px rise. Nothing loops, pulses or floats. With `prefers-reduced-motion`, everything becomes a plain fade.

## Iconography

Line icons on a 24px grid, 1.75px stroke, round caps and joins, drawn in `ink` or `ink-2`; the active tab icon switches to `sage` with a filled variant. Five tab icons: Today (sunrise over a line), Bible (open book), Prayer (two hands meeting as an arch), Library (three spines), You (person). No crosses, doves or flames as UI icons; the brand mark carries the meaning.

## App structure (App 2.0)

Tabs: **Today · Bible · Prayer · Library · You**, with search at the top of Today, Bible and Library.

- **Today**: greeting, Continue card, Verse of the Day, the day's rhythm (Declaration, Bible Study, Sermon, Night Prayer, Fire Prayer) with progress, then plans, Dreams & Discernment, community.
- **Bible**: offline KJV and other versions, books and chapters, the reading surface with highlights, notes, cross-references, tap-a-word dictionary, listen.
- **Prayer**: today's declaration, saved prayers, prayer points, fire prayer and archive, Prayer Circle and WhatsApp.
- **Library**: sermons (permanent archive), Bible studies, free books, reading plans, films.
- **You**: profile, notes and journal, highlights, saved verses and prayers, reading appearance, notifications, about.

## Status

Version 2 covers tokens, logo, pillar coding, type roles, elevation, motion, iconography and app structure. Stage 1 also includes the redesigned Today screen on the design canvas. The Bible reader, Prayer and Library screens follow after review.
