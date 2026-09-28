<h1 align="center">Alexander Mendola – web CV</h1>

<p align="center">
  <a href="https://cv.alexandermendola.dev"><img alt="Live site" src="https://img.shields.io/badge/live-cv.alexandermendola.dev-e8b25c?style=flat-square"></a>
  <a href="LICENSE"><img alt="Code licence" src="https://img.shields.io/badge/code-MIT-62d3bd?style=flat-square"></a>
  <img alt="Dependencies" src="https://img.shields.io/badge/dependencies-1-a78bfa?style=flat-square">
  <img alt="Framework" src="https://img.shields.io/badge/framework-none-7d8aa8?style=flat-square">
</p>

A static, framework-free CV site. All content lives in `cv.yaml` – the HTML, CSS
and JS never need editing to update the CV. The code-editor panel in the hero
renders that same file, so it can't drift out of sync with the rest of the page.

> **The idea:** content and presentation are completely separate. A small Node
> script reads one YAML file and writes the site. Nothing in the code knows
> anything about me – swap the YAML and it's your CV.

---

## ✏️ Updating the CV

```bash
npm install          # first time only – one dependency, js-yaml
npm run build        # cv.yaml → dist/
```

1. Edit `cv.yaml`
2. Run `npm run build`
3. Open `dist/index.html`

That's it – you shouldn't ever need to edit HTML to change content.

💡 While editing, run `npm run watch` instead. It rebuilds on every save, so a
browser pointed at `dist/index.html` only needs a refresh.

---

## 🗂️ Layout

```
.
├── cv.yaml                 all content – the only file you edit
├── build.js                the build itself; --watch to rebuild on change
│
├── src/
│   ├── render.js           cv.yaml → HTML, one function per region of the page
│   ├── html.js             escaping + the tiny **bold** / [link](url) markup
│   ├── profile-preview.js  re-serialises the hero profile as highlighted YAML
│   ├── og-card.js          the link-preview card, as a page you screenshot
│   ├── styles.css          all styling             ┐
│   ├── main.js             the page's only script  ├─ copied to dist/ as-is
│   └── og.png              1200×630 link preview   ┘
│
├── dist/                   generated output – deployed by Cloudflare
└── og-card.html            regenerated each build; open it to recapture og.png
```

♻️ `dist/` and `og-card.html` are both disposable: delete them and
`npm run build` recreates them. Everything else is source.

---

## 📝 Writing `cv.yaml`

Prose fields accept three bits of inline markup and nothing else:

| Markup                 | Renders as             |
| ---------------------- | ---------------------- |
| `**text**`             | **bold**               |
| `[label](https://url)` | a link                 |
| `{{year}}`             | the year at build time |

`{{year}}` is what keeps the footer's copyright current. Because it resolves
when the site is built, it only moves on if something triggers a build – a push
does, but a year with no pushes would leave it stale. An unrecognised
`{{token}}` is left on the page verbatim rather than blanked, so a typo is
visible rather than silent.

🔒 Everything else is HTML-escaped, so `&`, `<` and quotes are safe to type
literally. Link URLs are checked against an allow-list (http, https, mailto,
`#anchor`, relative paths), so a stray `javascript:` URL is rendered inert.

<details>
<summary><b>Fields worth knowing about</b></summary>

<br>

| Field                          | What it does                                                                                                                                                                                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skills[].accent`              | `amber`, `teal`, `violet` or `muted`. Colours the group the way a syntax theme colours a token type.                                                                                                                                                                  |
| `experience.entries[].current` | `true` fills in that entry's timeline dot. Use it on the present role only.                                                                                                                                                                                           |
| `credentials.items[].url`      | Optional. Links the credential name to its verification page (Credly, Oracle CertView). An item without one stays plain text, so an unverifiable entry never looks verifiable.                                                                                        |
| `work.items[].featured`        | `true` promotes the project to a card.                                                                                                                                                                                                                                |
| `work.items[].badge`           | Short label above the project meta, e.g. `client delivery`. Only shows on featured items.                                                                                                                                                                             |
| `work.items[].outcome`         | The amber-bordered result line under a project. Reserve it for something measurable; it is the most-read line in the section.                                                                                                                                         |
| `site.skip_link`               | Text of the keyboard skip link, hidden until focused. Defaults to `Skip to content`.                                                                                                                                                                                  |
| `hero.editor.profile`          | Re-serialised back into syntax-highlighted YAML to draw the editor card in the hero, line numbers and all. What the card shows really is this config, so it can never drift. `flow_keys` lists the keys that render as inline `[a, b]` lists rather than block lists. |

</details>

---

## 🔗 The link preview

When the site is shared on LinkedIn, Slack, iMessage or WhatsApp, the card
those show comes from the Open Graph tags in the page head, generated from
`meta.url` and `meta.og` in `cv.yaml`. The image is `src/og.png`, which has to
be a real PNG or JPEG at an absolute URL – SVG is not supported, and a relative
path is ignored.

To change the card – a new job title, a different design – edit `cv.yaml` or
`src/og-card.js`, then:

1. `npm run build`, which rewrites `og-card.html` in the project root
2. Open `og-card.html` in Chrome
3. Right-click the card → Inspect → right-click the `<div class="og-card">`
   node → **Capture node screenshot**
4. Save over `src/og.png`

📐 Capture the _node_ rather than taking an ordinary screenshot: a normal
capture picks up your display scaling and won't be 1200×630.

The build warns on every run if `meta.og.image` is set but `src/og.png` is
missing, because a preview pointing at a 404 is worse than no image tag –
scrapers cache the failure.

> ⚠️ **LinkedIn caches previews aggressively.** After changing the image, run
> the URL through [Post Inspector](https://www.linkedin.com/post-inspector/) to
> force a refresh, or the old card can persist for weeks.

---

## 🚀 Deployment

Hosted on Cloudflare Pages at
[cv.alexandermendola.dev](https://cv.alexandermendola.dev), building from this
repo on every push to `main`:

| Setting                | Value                     |
| ---------------------- | ------------------------- |
| Build command          | `npm run build`           |
| Build output directory | `dist`                    |
| Node version           | from `.node-version` (20) |

So deploying is just:

```bash
git commit -am "Update experience"
git push
```

There is nothing to upload by hand – Cloudflare runs the build itself, which is
why `dist/` is gitignored rather than committed.

Two things worth keeping in mind:

- 🔕 **Keep preview deployments set to None** (Settings → Builds & deployments).
  Left on, every push leaves an outdated copy of the CV permanently reachable at
  its own `*.pages.dev` URL.
- 📂 `dist/` has no absolute paths, so it also works from a plain `file://`
  double-click if you ever want to check it without deploying.

---

## ⚖️ Licence

Two different things live in this repository, under two different terms.

|                | Covers                                   | Terms                                                                                              |
| -------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 🛠️ **Code**    | `build.js`, `src/*.js`, `src/styles.css` | [MIT](LICENSE) – fork it, take it apart, build your own CV on it                                   |
| 📄 **Content** | `cv.yaml`, `src/og.png`                  | [All rights reserved](LICENSE-CONTENT) – employment history, credentials, contact details and name |

If you want to reuse the generator, the move is to clone it and replace
`cv.yaml` with your own content. Nothing in the code knows anything about me –
it all comes from that one file.
