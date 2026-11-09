# WFN App 2.0 — Redesign Log

Working branch: `app-redesign` (GitHub Pages serves `main`, so nothing here is live).
The live app at /app/ stays untouched until Oladapo approves the redesign; then this
branch is merged into `main`.

## Brief (Nov 9, 2026)
Complete facelift of the WFN PWA: clean, light, modern, elevated (not dark-first),
premium reading/study product, not a typical ministry app. Soft warm whites, sand,
muted sage/teal, charcoal text, very restrained warm accent. Modern sans for UI,
elegant legible serif for scripture and long-form. Keep ALL existing content,
features and functionality; add: distraction-free reading modes, better offline +
notes/highlights, unified search (Bible, sermons, declarations), reading-plan
progress, "continue where you left off", onboarding for the three pillars, reliable
install flow. Deliver in stages: design system -> core screens (Home, Bible,
Prayer, Library) -> the rest -> build -> approval -> merge.

## Feature inventory of the current app (must all survive)
Home (greeting, verse of the day reveal + translate, today's sermon, Bible study,
declaration, night prayer, Jesus story, Dreams & Discernment, reading plans, Word Climb game) ·
Bible (offline KJV + other versions, books/chapters, search, reader with tap-a-word
dictionary, cross-references, highlights, notes, chapter summaries, appearance
settings) · Sermons (intro gate, list, archive -> /articles/) · Prayer (intro gate,
declarations, prayer points, saved prayers) · Library (books) · Bible Study list/detail
(+ posters) · Reading plans (list, detail, day) · Dreams & Discernment (+ nightly Fire
Prayer, archive) · Profile (edit, notes, highlights, saved verses, prayer, appearance,
notifications, about) · Tolu voice assistant + Listen (TTS) · glass selection bar
(Copy, Select All, Share, Pray, Look Up, Translate) · offline service worker ·
OneSignal push · seasonal effects.

## Constraints
- Daily scheduled tasks write content into app/js/app.js (VERSES, SERMONS,
  BIBLE_STUDY, DECLARATION, NIGHT_PRAYER, DREAM_FIRE_PRAYER) and app/data/*.json.
  The new app must keep reading the same content (or the tasks get updated at merge).

## Sessions
- 2026-11-09 — Session 1: workspace set up; Stage 1 (design system v2 + Home) started.
  - Design system v2 published to the WFN Design System artifact
    (https://claude.ai/artifact/8RL7uyRhr1zmu2PGo8vvz6): Light/Dark/Paper themes,
    pillar coding (Word = bronze, Prayer = sage, Faith = clay), highlight swatches,
    shadow/motion rules, Inter + Newsreader (+ Atkinson Hyperlegible reading option),
    three-petal emblem as the app mark, 5-tab structure Today · Bible · Prayer · Library · You.
    Copies in redesign/stage1/design-system/.
  - Design canvas "WFN App 2.0" (https://claude.ai/artifact/RdEPVN2cdCR3STjLMfwm4p):
    Today (light + dark) and Foundations & components boards. Sources in redesign/stage1/canvas/.
  - Open decisions for Oladapo: (1) approve the direction / changes;
    (2) stack: recommended keeping the no-build static PWA (GitHub Pages + the six daily
    automations keep working) with a modular rebuild, vs Next.js static export + Actions build;
    (3) tabs: Sermons move into Library, Profile becomes "You".
  - Next: Bible reader, Prayer, Library screens (Stage 2), then onboarding, search, You.
- 2026-11-09 — Session 1 review: Oladapo likes the direction and layout, but both Today
  boards used the live site's colors. Rule from now on: App 2.0 shares NO colors or
  typefaces with the live site/app. Design system v3: porcelain #F6F7F5, cool charcoal
  ink #15191A, spruce accent #1D6468 (Prayer + UI), amber #9A5B12 (Word), slate blue
  #3D5A86 (Faith), deep-spruce Verse of the Day hero card #12383A, cool near-black dark
  theme #0E1213, Mist reading theme; Literata (scripture/display) + Instrument Sans (UI).
  Emblem petals recolored to the app palette. Canvas updated.
- 2026-11-09 — Stage 1 approved ("This is better"). Stage 2 designed on the canvas:
  Bible home (search, pick-up card, reading plan ring, OT/NT books by section, your
  highlights/notes/saved counts), Bible reader (Isaiah 49 with highlight, note dot,
  floating selection panel: 4 highlight colours + Note/Copy/Share/Pray/Related/Look Up,
  listen bar with prev/next chapter), Reading settings sheet (Light/Mist/Dark, size,
  Literata vs Hyperlegible, focus mode, verse numbers, red letters, tap-to-define),
  Prayer (today/my prayers/saved, full declaration with Pray aloud + Prayed/Save/Share,
  prayer points from the sermon, Tonight: night prayer + fire prayer card, private
  prayer list with Praying/Answered + testimony, Prayer Circle/WhatsApp),
  Library (filter chips, today's sermon with poster, study posters, free books with
  reading progress, sermon archive by month with read ticks, Films). Today's plan card
  now uses the real plan "Who You Are in Christ" (7 days).
  New features introduced: answered-prayer journal, book reading progress, read ticks
  in the archive, listen bar in reader, related-verses action.
  Still open: 5-tab structure and stack choice (recommendation: stay no-build static).
- 2026-11-09 — Stage 2 accepted ("Go to stage 3"). Stage 3 designed on the canvas:
  Welcome (three pillars + Romans 10:17, step 1 of 3: name, reminders, install next),
  Search (one box over Bible + sermons + declarations, filter chips with counts, match
  highlighting; "captive" = 93 real KJV verses), Sermon reading page (progress bar,
  poster, scripture block, pull quote, Amen / Pray this sermon / previous sermon),
  Dreams & Discernment (spruce header, tonight's fire prayer, Scripture chips,
  peace prayer, NEW private dream journal, support guidance, fire prayer archive),
  You (month-in-the-Word grid, stats, what you've kept, daily reminder times with
  toggles, back up notes, install, Word Climb, about), Notes & journal (daily prompt
  from the verse, Journal/Prayer/Dream tags, entries linked to verses and sermons).
  Next: Stage 4 = build. Open: tabs + stack confirmation.
- 2026-11-09 — Decisions confirmed: keep the no-build static stack (Next.js declined);
  five tabs Today · Bible · Prayer · Library · You. Feedback round:
  * Whole app made warmer, softer, more premium (design system v4): warm pearl/stone
    neutrals (#F4F2EE / #FFFDFA / #ECE8E2), warm charcoal ink, 5% paper-grain texture on
    every screen, bigger radii (cards 24, hero 30, buttons 16), soft diffuse card shadows
    instead of hard borders, Literata headings at weight 400, glowing Verse of the Day card,
    Mist reading theme renamed/warmed to Linen. Still no overlap with the live site.
  * You: profile photo (tap avatar, camera badge, file picker), Font size slider with live
    preview, five reading fonts (Literata, Source Serif 4, Spectral, Instrument Sans,
    Atkinson Hyperlegible) — also in the reading settings sheet.
  * Today gets an "Explore" row with NEW icons for The Story of Jesus (Jerusalem gate
    opening onto a path of light) and The Word Climb (mountain, dotted path, summit flag).
  * The Story of Jesus redesigned as a museum walk through Jerusalem: entrance (illustrated
    Jerusalem at dawn, audio guide, 12 galleries / 80 min, the route from Prophecy to the
    Mount of Olives with visited / you-are-here, collection: JESUS Film, Tissot watercolours,
    photos of the real sites) and Gallery X Golgotha (audio guide with Tolu, placard,
    exhibits, trilingual titulus, seven words from the cross, film, "leave a prayer at
    the cross", next gallery). Photo/painting plates are placeholders until licensed
    images are sourced (Wikimedia Commons / Brooklyn Museum Tissot public domain;
    JESUS Film Project embeds).
  * The Word Climb redesigned: mountain map of the 5 real camps, streak, NEW daily
    5-question challenge tied to the day's sermon, practice by book, 60-second sprint,
    challenge a friend, Scripture hint / 50-50 / learn why, camp badges, certificate.
- 2026-11-09 — Comparison board added (Compare.dc.html): page colour A cool white #F5F7F8 / B soft white #F6F5F2 (recommended) / C warm pearl #F4F2EE (current), and reading themes Light / Linen / Mist / Dark. Awaiting Oladapo's pick.

## Session — Nov 9, evening: palette B, Invite, Give

- Oladapo chose **B**: near-neutral soft white page (#F6F5F2), white cards, warm charcoal ink (#1F1D1B). Applied to every board.
- Reading themes are now **Light, Linen, Mint, Dark** (Mint #EAF1EC, ink #1A2022).
- **You**: real profile photo; new "Friends & giving" tiles (Invite friends, Give).
- **Today header**: amber "Give" pill (hand-and-heart icon); avatar links to You.
- New boards: **Invite** (My code / Scan, real QR for wfnglobal.org/app/?invite=oladapo, Share and Copy link), **Scan** (viewfinder, Allow camera, scan from a photo), **Give** (amount, currency, fund, monthly toggle, date, six payment methods, "Why give to WFN"), **Give to** sheet (Where it's needed most, Spread the Word, Care for the needy).
- Design system bumped to v5.
- Build notes: real payments need provider accounts (Stripe for cards/Apple Pay/Google Pay, PayPal, Paystack for Naira; Interac via the ministry's bank). Scanning needs camera permission (BarcodeDetector or a small JS QR library).
