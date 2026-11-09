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
