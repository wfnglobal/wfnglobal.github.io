# Sermon & Bible study posters

A 4:5 stop-to-scroll poster for each day's sermon and Bible study, shown right
under the title on the site (articles/<slug>.html) and in the app (Bible study
detail, via the `poster` / `posterAlt` fields on the BIBLE_STUDY entry).

- Source HTML: `social/posters/sermon-<slug>.html` and `social/posters/study-<slug>.html`
  (1080x1350, fonts from `../fonts/`). Approved first examples:
  `sermon-possess-your-possessions.html` and `study-too-many-to-win-with.html`.
- Render: `node social/render-poster.js social/posters/<file>.html /tmp/<file>.png 2`, then
  save a 1440x1800 progressive JPEG (quality ~86) to
  `assets/posters/sermons/<slug>.jpg` or `assets/posters/study/<slug>.jpg`.
- Every poster is a NEW design: an original illustrated SVG scene that depicts
  that day's topic or Bible story, its own colour palette, a new 2-line
  headline (second line in an accent gradient), a one-sentence sub, a KJV
  verse in the CTA bar. Keep the WFN lockup (top-left), the chip (top-right:
  "Today's Sermon" / "Daily Bible Study"), and the CTA bar with the link
  (wfnglobal.org for sermons, wfnglobal.org/study for studies).
