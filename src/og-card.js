/* ---------------------------------------------------------------
   The link-preview card, as a 1200x630 HTML page you screenshot once.

   Not deployed as part of the site – build.js writes it to
   dist/og-card.html purely so you can open it, capture it, and save the
   result as src/og.png. Driven from cv.yaml like everything else, so the
   card cannot claim a different name or role from the page it previews.

   Sizes are deliberately large: LinkedIn renders the card at roughly 520px
   wide, so everything here is seen at about 43% of its stated size.
---------------------------------------------------------------- */

import { esc } from "./html.js";

export function renderCard(cv) {
  const hero = cv.hero ?? {};
  const profile = hero.editor?.profile ?? {};
  const url = (cv.meta?.url ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  const org = [profile.firm, profile.base].filter(Boolean).join(" · ");

  return `<!DOCTYPE html>
<html lang="${esc(cv.meta?.lang ?? "en")}">
<head>
<meta charset="UTF-8">
<meta name="robots" content="noindex">
<title>Open Graph card – screenshot this</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #131720; --line: #2a3147; --text: #e8eaf2;
    --muted: #9aa3b8; --comment: #7d8aa8; --amber: #e8b25c;
    --font-sans: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
    --font-mono: "IBM Plex Mono", Consolas, monospace;
  }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    background: #3a3f4a;
    font-family: var(--font-sans);
  }
  .instructions {
    position: fixed;
    top: 16px; left: 16px;
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.6;
    color: #fff;
    background: rgba(0,0,0,0.6);
    padding: 10px 14px;
    border-radius: 6px;
    max-width: 420px;
  }

  /* Exactly 1200x630. Do not add margin or shadow to this element – they
     would be included in a node screenshot. */
  .og-card {
    width: 1200px;
    height: 630px;
    box-sizing: border-box;
    padding: 84px 90px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background-color: var(--bg);
    background-image: radial-gradient(var(--line) 1.6px, transparent 1.6px);
    background-size: 34px 34px;
    color: var(--text);
    overflow: hidden;
  }
  .kicker {
    font-family: var(--font-mono);
    font-size: 30px;
    color: var(--comment);
    margin: 0 0 22px;
  }
  .name {
    font-size: 104px;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.02;
    margin: 0 0 26px;
  }
  .name .underscore { color: var(--amber); }
  .role {
    font-size: 34px;
    line-height: 1.45;
    color: var(--muted);
    margin: 0;
    max-width: 22ch;
  }
  .rule {
    width: 96px;
    height: 5px;
    background: var(--amber);
    border-radius: 3px;
    margin: 40px 0 34px;
  }
  .foot {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 32px;
    font-family: var(--font-mono);
    font-size: 27px;
  }
  .foot .url { color: var(--amber); }
  .foot .org { color: var(--comment); }
</style>
</head>
<body>

<p class="instructions">
  Screenshot the card below at exactly 1200&times;630:<br>
  right-click it &rarr; Inspect &rarr; right-click the
  <code>&lt;div class="og-card"&gt;</code> node in DevTools &rarr;
  <b>Capture node screenshot</b>.<br>
  Save the result as <b>src/og.png</b>.
</p>

<div class="og-card">
  <p class="kicker">// ${esc(hero.kicker ?? "")}</p>
  <h1 class="name">${esc(hero.name ?? "")}<span class="underscore">${esc(hero.cursor ?? "_")}</span></h1>
  <p class="role">${esc(profile.role ?? "")}</p>
  <div class="rule"></div>
  <div class="foot">
    <span class="url">${esc(url)}</span>
    <span class="org">${esc(org)}</span>
  </div>
</div>

</body>
</html>
`;
}
