/* ---------------------------------------------------------------
   cv.yaml  ->  index.html

   One function per region of the page. Nothing here knows about the
   filesystem; build.js handles that.
---------------------------------------------------------------- */

import { esc, inline, attrs, join, indent } from './html.js';
import { renderProfile, describeProfile } from './profile-preview.js';

export function renderPage(cv) {
  const meta = cv.meta ?? {};
  return `<!DOCTYPE html>
<html lang="${esc(meta.lang ?? 'en')}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title ?? '')}</title>
<meta name="description" content="${esc(meta.description ?? '')}">
${socialTags(meta)}
${fontLinks(meta.fonts)}
<link rel="stylesheet" href="styles.css">
<script src="main.js" defer></script>
</head>
<body>

<a class="skip-link" href="#main">${esc(cv.site?.skip_link ?? 'Skip to content')}</a>

${topbar(cv.site ?? {})}

<main id="main" tabindex="-1">
${indent(hero(cv.hero ?? {}), 2)}

${indent(aboutSection(cv), 2)}

${indent(experienceSection(cv.experience), 2)}

${indent(workSection(cv.work), 2)}

${indent(contactSection(cv.contact), 2)}
</main>

${footer(cv.footer ?? {})}

</body>
</html>
`;
}

/* ---------------- head ---------------- */

/**
 * Open Graph + Twitter card tags.
 *
 * Every URL here has to be absolute: LinkedIn, Slack and the rest fetch the
 * page out of context and will not resolve a relative path. Omitting the image
 * is what produces the blank grey card, so if og.image is missing we emit the
 * text tags only rather than pointing at something that 404s.
 */
function socialTags(meta) {
  const site = meta.url ? meta.url.replace(/\/+$/, '') + '/' : null;
  const og = meta.og ?? {};
  const title = og.title ?? meta.title ?? '';
  const description = og.description ?? meta.description ?? '';
  const image = og.image && site ? new URL(og.image, site).href : null;

  const tags = [
    site ? `<link rel="canonical" href="${esc(site)}">` : null,
    '<meta property="og:type" content="website">',
    og.site_name ? `<meta property="og:site_name" content="${esc(og.site_name)}">` : null,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    site ? `<meta property="og:url" content="${esc(site)}">` : null,
    image ? `<meta property="og:image" content="${esc(image)}">` : null,
    // Declaring the dimensions lets a scraper lay the card out before it has
    // finished downloading the image.
    image ? '<meta property="og:image:width" content="1200">' : null,
    image ? '<meta property="og:image:height" content="630">' : null,
    image && og.image_alt ? `<meta property="og:image:alt" content="${esc(og.image_alt)}">` : null,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    image ? `<meta name="twitter:image" content="${esc(image)}">` : null,
  ];

  return join(tags);
}

function fontLinks(families) {
  if (!families?.length) return '';
  const href =
    'https://fonts.googleapis.com/css2?' +
    families.map((f) => `family=${f}`).join('&') +
    '&display=swap';
  return [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link href="${esc(href)}" rel="stylesheet">`,
  ].join('\n');
}

/* ---------------- top bar ---------------- */

function topbar(site) {
  const brand = String(site.brand ?? '');
  // A leading ~ is the one accented character, as in a shell prompt.
  const brandHtml = brand.startsWith('~')
    ? `<span class="tilde">~</span>${esc(brand.slice(1))}`
    : esc(brand);

  const nav = (site.nav ?? [])
    .map((item) => `      <a href="${esc(item.href)}">${esc(item.label)}</a>`)
    .join('\n');

  return `<header class="topbar">
  <div class="wrap topbar-inner">
    <span class="brand">${brandHtml}</span>
    <nav class="nav" aria-label="Site">
${nav}
    </nav>
  </div>
</header>`;
}

/* ---------------- hero ---------------- */

function hero(h) {
  const actions = (h.actions ?? [])
    .map((a) => {
      const cls = a.style === 'quiet' ? 'link-quiet' : 'btn';
      return `        <a class="${cls}" href="${esc(a.href)}">${esc(a.label)}</a>`;
    })
    .join('\n');

  return `<!-- ================= HERO ================= -->
<div class="hero">
  <div class="wrap hero-grid">
    <div>
      <p class="kicker" data-reveal="hero">// ${esc(h.kicker ?? '')}</p>
      <h1 data-reveal="hero">${esc(h.name ?? '')}<span class="underscore">${esc(h.cursor ?? '_')}</span></h1>
      <p class="role" data-reveal="hero">${inline(h.role ?? '')}</p>
      <p class="lede" data-reveal="hero">${inline(h.lede ?? '')}</p>
      <div class="hero-actions" data-reveal="hero">
${actions}
      </div>
    </div>

${indent(editorCard(h.editor ?? {}), 4)}
  </div>
</div>`;
}

function editorCard(editor) {
  const lines = renderProfile(editor)
    .map(
      (html, i) =>
        `<span class="codeline" data-reveal="code"><span class="lineno">${i + 1}</span>${html}</span>`
    )
    .join('\n');

  // role="img" + a label is what makes the name stick: a bare <div> is
  // role="generic", which does not support an accessible name, so the old
  // aria-label was silently dropped and screen readers read the raw YAML.
  return `<div class="editor" data-reveal="editor" role="img" aria-label="${esc(describeProfile(editor))}">
  <div class="editor-tabbar"><span class="editor-tab">${esc(editor.tab ?? 'profile.yaml')}</span></div>
  <div class="editor-body">
<pre>${lines}</pre>
  </div>
</div>`;
}

/* ---------------- about / skills / credentials ---------------- */

function aboutSection(cv) {
  const about = cv.about ?? {};
  const paragraphs = (about.paragraphs ?? [])
    .map((p) => `        <p>${inline(p)}</p>`)
    .join('\n');

  const now = about.now
    ? `      <aside class="now">
        <h3>${esc(about.now.heading ?? '')}</h3>
        <ul>
${(about.now.items ?? []).map((i) => `          <li>${inline(i)}</li>`).join('\n')}
        </ul>
      </aside>`
    : '';

  return `<!-- ================= ABOUT & SKILLS ================= -->
<section${attrs({ id: about.id })}>
  <div class="wrap">
${sectionHeading(about.heading)}
    <div class="about-grid">
      <div>
${paragraphs}
      </div>
${now}
    </div>

${indent(skills(cv.skills), 4)}

${indent(credentials(cv.credentials), 4)}
  </div>
</section>`;
}

function skills(groups) {
  if (!groups?.length) return '';
  const blocks = groups
    .map(
      (g) => `  <div class="skill-group acc-${esc(g.accent ?? 'muted')}">
    <h3>${esc(g.group ?? '')}</h3>
    <ul>${(g.items ?? []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
  </div>`
    )
    .join('\n');
  return `<div class="skills">\n${blocks}\n</div>`;
}

function credentials(creds) {
  if (!creds?.items?.length) return '';
  const items = creds.items
    .map((c) => {
      const when = join([c.issuer, c.year].filter(Boolean).map(String), ', ');
      return `    <li><b>${esc(c.name)}</b><span>${esc(when)}</span></li>`;
    })
    .join('\n');
  const note = creds.note
    ? `\n  <p class="creds-more"># ${inline(creds.note)}</p>`
    : '';

  return `<div class="creds">
  <h3>${esc(creds.heading ?? 'credentials')}</h3>
  <ul>
${items}
  </ul>${note}
</div>`;
}

/* ---------------- experience ---------------- */

function experienceSection(exp) {
  if (!exp) return '';
  const entries = (exp.entries ?? [])
    .map((e) => {
      const points = e.points?.length
        ? `\n    <ul>\n${e.points.map((p) => `      <li>${inline(p)}</li>`).join('\n')}\n    </ul>`
        : '';
      const org = e.org ? `\n    <p class="org">${esc(e.org)}</p>` : '';
      return `  <article class="entry${e.current ? ' head' : ''}">
    <p class="tag">${esc(e.period ?? '')}</p>
    <h3>${esc(e.title ?? '')}</h3>${org}${points}
  </article>`;
    })
    .join('\n\n');

  return `<!-- ================= EXPERIENCE ================= -->
<section${attrs({ id: exp.id })}>
  <div class="wrap">
${sectionHeading(exp.heading)}
    <div class="timeline">
${indent(entries, 6)}
    </div>
  </div>
</section>`;
}

/* ---------------- selected work ---------------- */

function workSection(work) {
  if (!work) return '';
  const items = (work.items ?? []).map(project).join('\n\n');
  const note = work.note
    ? `\n\n    <p class="confidential-note"># ${inline(work.note)}</p>`
    : '';

  return `<!-- ================= PROJECTS ================= -->
<section${attrs({ id: work.id })}>
  <div class="wrap">
${sectionHeading(work.heading)}

${indent(items, 4)}${note}
  </div>
</section>`;
}

function project(p) {
  const meta = join(
    [
      p.badge ? `    <span class="badge">${esc(p.badge)}</span><br>` : null,
      p.year ? `    <span class="yr">${esc(p.year)}</span><br>` : null,
      p.tech ? `    ${esc(p.tech)}` : null,
    ],
    '\n'
  );
  const body = (p.body ?? []).map((t) => `    <p>${inline(t)}</p>`).join('\n');
  const outcome = p.outcome
    ? `\n    <p class="outcome">${inline(p.outcome)}</p>`
    : '';

  return `<article class="project${p.featured ? ' featured' : ''}">
  <div class="meta">
${meta}
  </div>
  <div>
    <h3>${esc(p.title ?? '')}</h3>
${body}${outcome}
  </div>
</article>`;
}

/* ---------------- contact & footer ---------------- */

function contactSection(contact) {
  if (!contact) return '';
  const links = (contact.links ?? [])
    .map((l) => `      <a href="${esc(l.href)}">${esc(l.label)}</a>`)
    .join('\n');

  return `<!-- ================= CONTACT ================= -->
<section${attrs({ id: contact.id, class: 'contact' })}>
  <div class="wrap">
${sectionHeading(contact.heading)}
    <p>${inline(contact.intro ?? '')}</p>
    <div class="contact-links">
${links}
    </div>
  </div>
</section>`;
}

function footer(f) {
  return `<footer>
  <div class="wrap">
    <span>${inline(f.left ?? '')}</span>
    <span>${inline(f.right ?? '')}</span>
  </div>
</footer>`;
}

function sectionHeading(text) {
  if (!text) return '';
  return `    <h2><span class="slashes">//</span> ${esc(text)}</h2>`;
}
