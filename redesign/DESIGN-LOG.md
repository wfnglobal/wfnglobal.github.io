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

## Session — Nov 9, afternoon: Stage 4 begins, the real App 2.0

- Built the real app in `app2/` (no build step). Nothing in `app/` or the live site changed.
  - `app2/js/core.js` router, settings, sheets, read-aloud; `today.js`, `bible.js`, `pages.js`, `you.js`, `extras.js` for the screens.
  - Uses the same on-phone storage as the old app (`app/js/store.js`), so people keep their notes, highlights, prayers and plan progress when 2.0 goes live.
  - Content bridge: `node tools/app2-content.js` regenerates `app2/js/content.js` from the arrays the nightly tasks already write in `app/js/app.js`. Today's verse, sermon, study, declaration and fire prayer come live from `app/data/today.json`. Full sermons are read from `/articles/<slug>.html`.
  - Invite: real QR (vendored qrcode-generator, MIT) and a camera scanner (BarcodeDetector, falling back to vendored jsQR, Apache-2.0).
  - Give: amount, currency (CAD/USD/GBP/NGN), funds, monthly, six methods. `window.WFN_GIVING` takes the payment links (Stripe, PayPal, Paystack, Interac email) at go-live; until then the Give button explains and offers to email the ministry.
  - Story of Jesus: 12 galleries with KJV passages from the offline Bible, Golgotha with the seven sayings.
  - Word Climb mounts the existing game.
- Private preview published as an artifact ("WFN App 2.0"). In the preview frame the camera, downloads and email links are blocked by the viewer; they work on wfnglobal.org.
- To go live later: move `app2/` to `app/` (or point `/app/` at it), add OneSignal to the new service worker, have the nightly tasks run `node tools/app2-content.js`, and bump the cache.

## Session — Nov 9, late afternoon: prayer requests + go-live preparation

- Prayer tab: "Send a prayer request" in three steps (topic, request + optional first name + who sees it, then confirmation). "Just me" keeps it in the private prayer list; "The WFN prayer team" saves it, then emails it to wordandfaithnetwork@gmail.com or sends it another way. Wording names the WFN prayer team (no Pastor Johnson).
- App only: none of this touches the website.
- Go-live structure is now on the branch:
  - `app/index.html` is App 2.0; the previous app is kept whole at `app/classic.html` (linked from You → App) so it can be restored in one step.
  - App 2.0 code: `app/js2/`, `app/css/app2.css`, `app/vendor/`. Old `app/js/app.js` stays as the content source the nightly tasks write; App 2.0 reads its arrays live, so no scheduled task needs to change.
  - Look Up, Translate and Copy/Share/Pray on any text carry over (wfn-lookup.js, wfn-tts.js), styled in the new colours.
  - Daily reminders use OneSignal (same app id and GitHub Action). GA4 kept. Service worker cache bumped to v71 with the new shell.
  - Books open their full HTML pages in /library/, with the PDF as a download.
- Remaining before the switch: Oladapo's final OK, then merge app-redesign into main (watch the CACHE_VERSION bump the nightly task makes; take the higher number + 1).

## Nov 9, ~3pm: App 2.0 is live

- Prayer requests to the team can go by email, the WhatsApp prayer group (request copied first, then pasted) or Instagram DM (ig.me/m/wordfaithnetwork).
- Oladapo said "Switch it on". Pushed to main as 54f65b4; GitHub Pages deployed it (first attempt timed out on GitHub's side, the rerun succeeded). Old app at /app/classic.html.

## Nov 9, evening: restored everything the classic app had

Oladapo found features missing after go-live. Audited the classic app (app/classic.html + app/js/app.js) and brought back:
- Listen (floating, every screen): voice choice incl. Pidgin, speed, Play/Pause/Resume/Stop. Inline listen buttons now turn into Stop while reading.
- Ask Tolu: mic or typed requests; opens sermons, studies, declaration, night/fire prayer, Bible book/chapter/verse, library, give, invite, Jesus, game; "search for…" across sermons, studies, library and the whole Bible; read/stop/pause/resume.
- Translate (Yorùbá, Igbo, Hausa, Pidgin, more): Verse of the Day, declaration, night prayer, prayer points, fire prayer, sermons, studies, plan days, museum galleries, each Bible verse, and whole chapters.
- Bible reader: tap any word for the dictionary (setting to turn off), tap a verse number to select; 13 versions (bible-api.com + machine-translated Yorùbá/Igbo/Hausa); compare versions; jump to verse; chapter summary; related verses (cross-references); Pray and Look up on verses; title button goes to the Old/New Testament book list; classic highlight colours (gold/green/blue/pink) so old highlights show; notes saved in the classic format.
- Sermons tab is back (six tabs like classic) with today's sermon and the full archive by month, with notes. Bible studies live under the Bible tab. Library holds books and plans.
