# Word and Faith Network

A brand system for a church without walls: a global, fully digital ministry built around one daily rhythm. The Word, declared. Prayer, offered. Faith, lived out.

Version 4 (November 2026) is the system for **WFN App 2.0**, the complete redesign of the progressive web app at wfnglobal.org/app. The website facelift runs on version 1. At Oladapo's direction the app takes its own visual identity, sharing no colors or typefaces with the live site, and adds what a daily reading and prayer product needs: reading themes, highlight colors, pillar coding, elevation and motion rules, and app components.

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
3. **Read without interruption.** Every long text (Bible, sermon, study, book) opens in the same reading surface with three themes (Light, Linen, Dark), adjustable size, and a focus mode that hides all chrome.
4. **Pick up where you left off.** The app always knows the last chapter, sermon, book page and plan day, and offers one tap back.
5. **Restraint over decoration.** No gradients behind text, no stock imagery, no glow, no emoji as icons. Color appears only where it carries meaning.

## Voice

Direct, scriptural, unhurried. WFN writes the way it prays: plainly, with conviction, without ornament. Avoid devotional clichés ("Blessed Monday!", "Be encouraged, fam!") and avoid corporate coldness. The register sits between a serious publication and a trusted teacher: *"Today's word is for the waiting."* not *"Check out today's inspirational verse!"*

Interface copy is short and literal: "Continue reading", "Save declaration", "Mark as prayed", "Join the Prayer Circle". Greetings use the reader's first name and the time of day ("Good evening, Oladapo"), nothing more.

## Logo

The three-petal emblem stays the brand mark: three petals turning around one centre, the Word, Prayer and Faith held together by a single point. In App 2.0 its petals take the app's own pillar colors (amber, spruce, slate) on a charcoal disc (`assets/Logos/emblem-*.svg` hold the website version). The earlier ring-and-line mark is superseded.

Rules: minimum size 20px; clear space equal to one petal; never one-color petals; never rotate, outline or stretch it.

## Color

App 2.0 deliberately shares nothing with the live website's warm cream, sage and bronze. Its palette is cooler and cleaner: porcelain white, cool charcoal ink, a deep spruce accent and one warm amber note. Three themes, same structure: **Light** (default), **Dark** (a cool near-black, not brown) and **Linen**, a soft warm reading theme. Exact values in `tokens.json`.

- **`surface-100`** soft-white page (#F6F5F2), **`surface-200`** cards and sheets, **`surface-300`** sunken fields, **`mist`** the one cool neutral band.
- **`ink`**, **`ink-2`**, **`ink-3`** step from scripture and body text to captions to timestamps.
- **`spruce`** is the working accent: links, the active tab, primary buttons, progress, and the Prayer pillar.
- **`amber`** is the only warm color and is reserved for the Word: references and verse eyebrows.
- **`slate`** marks Faith: studies, sermons, books, plans.
- **`hero`** is the deep-spruce Verse of the Day card, the single dark block on a light screen, with `hero-ink` scripture and an `hero-accent` amber eyebrow.

**Pillar coding.** Every piece of content belongs to one pillar, shown by a 6px dot or eyebrow color in `pillar-word` (amber), `pillar-prayer` (spruce) or `pillar-faith` (slate), never by a colored card.

**Highlights.** Gold, mint, rose and sky, tuned per theme so ink stays at 4.5:1 or better.

## Type

- **Instrument Sans** is the interface: navigation, buttons, labels, metadata. Tabular figures for counts and progress.
- **Literata** (optical sizing), a typeface designed for long-form screen reading, carries Display and Scripture: headlines, verses, declarations, sermons, studies, books. Never set a verse in the sans; never set a button in Literata.
- **Atkinson Hyperlegible** is an accessibility option in the reading surface.

Reading measure 60 to 68 characters. Verse numbers: sans, `eyebrow` size, `ink-3`, superscript inline. References: sans `label` in `amber`, written "Isaiah 49:25 · KJV".

## Warmth and softness (v4)

At Oladapo's direction the whole app moves to warmer, more refined tones, subtle texture, softer edges and calmer type, so it feels premium, soft and inviting. Neutrals are a warm pearl and stone rather than cool grey; ink is a warm charcoal. Every screen carries a 5% paper-grain texture. Cards use `radius-lg` (24px), a near-invisible hairline and `shadow-card`, a soft diffuse lift, instead of hard borders. Display headings in Literata drop to weight 400; eyebrows open up to 0.14em tracking. The Verse of the Day card glows softly from its top-right corner.

## Reading fonts

Readers choose from five faces in You and in the reading sheet, with a font-size slider (14 to 30pt): **Literata** (default, made for long screen reading), **Source Serif 4** (classic, like a well-printed Bible), **Spectral** (elegant and light), **Instrument Sans** (clean modern sans) and **Atkinson Hyperlegible** (for low vision and easy reading).

## Spacing, shape and elevation

A 4px-rooted scale; the phone gutter is `space-4`, the gap between Home sections `space-8`. Radii step from `radius-sm` (chips) to `radius-xl` (sheets and the verse card).

Cards separate from the page with a one-step surface shift or a `line` hairline, never a shadow. `shadow-float` is reserved for things that genuinely float: bottom sheets, the text-selection bar, toasts and the audio mini-player.

## Motion

One curve, `cubic-bezier(0.2, 0, 0, 1)`: 140ms for press states and toggles, 240ms for sheets, card reveals and page transitions. Sheets rise from the bottom; pages cross-fade with a 6px rise. Nothing loops, pulses or floats. With `prefers-reduced-motion`, everything becomes a plain fade.

## Iconography

Line icons on a 24px grid, 1.75px stroke, round caps and joins, drawn in `ink` or `ink-2`; the active tab icon switches to `spruce` on a `spruce-soft` pill. Five tab icons: Today (sunrise over a line), Bible (open book), Prayer (two hands meeting as an arch), Library (three spines), You (person). No crosses, doves or flames as UI icons; the brand mark carries the meaning.

## App structure (App 2.0)

Tabs: **Today · Bible · Prayer · Library · You**, with search at the top of Today, Bible and Library.

- **Today**: greeting, Continue card, Verse of the Day, the day's rhythm (Declaration, Bible Study, Sermon, Night Prayer, Fire Prayer) with progress, then plans, Dreams & Discernment, community.
- **Bible**: offline KJV and other versions, books and chapters, the reading surface with highlights, notes, cross-references, tap-a-word dictionary, listen.
- **Prayer**: today's declaration, saved prayers, prayer points, fire prayer and archive, Prayer Circle and WhatsApp.
- **Library**: sermons (permanent archive), Bible studies, free books, reading plans, films.
- **You**: profile, notes and journal, highlights, saved verses and prayers, reading appearance, notifications, about.

## Status

Version 4 covers tokens, logo, pillar coding, type roles, elevation, motion, iconography and app structure. Stage 1 also includes the redesigned Today screen on the design canvas. The Bible reader, Prayer and Library screens follow after review.


## Version 5

- Page is a near-neutral soft white (#F6F5F2), cards pure white, text a warm charcoal (#1F1D1B). Chosen by eye over warm pearl.
- Reading themes: Light, Linen, Mint and Dark. Mint is a calm grey-green (#EAF1EC, ink #1A2022).
- New patterns: the Give pill (amber soft ground, hand-and-heart icon) in the Today header, the Invite QR card on the spruce hero, and radio lists for payment methods and funds.
