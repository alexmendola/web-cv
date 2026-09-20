# Alexander Mendola — web CV

**Live at [cv.alexandermendola.dev](https://cv.alexandermendola.dev)**

A static, framework-free CV site. All content lives in `cv.yaml` — the HTML, CSS
and JS never need editing to update the CV. The code-editor panel in the hero
renders that same file, so it can't drift out of sync with the rest of the page.

## Updating the CV

1. Edit `cv.yaml`.
2. Run `npm run build`.
3. Open `dist/index.html`.

That's it — you shouldn't ever need to edit HTML to change content.

While editing, `npm run watch` rebuilds automatically on every save; just refresh the browser.

First time on a new machine: `npm install` (one dependency, `js-yaml`).

## Layout

```
cv.yaml            all content — the only file you edit to update the CV
src/
  styles.css       all styling (copied to dist/ as-is)
  main.js          the page's only script (copied to dist/ as-is)
  render.js        cv.yaml -> HTML, one function per region of the page
  html.js          escaping + the tiny **bold** / [link](url) markup
  profile-preview.js   re-serialises the hero's profile block as highlighted YAML
build.js           the build itself; `--watch` to rebuild on change
dist/              generated output — publish this folder
```

`dist/` is disposable: delete it and `npm run build` recreates it.

## Writing `cv.yaml`

Prose fields accept two bits of inline markup and nothing else:

| Markup                 | Renders as |
| ---------------------- | ---------- |
| `**text**`             | bold       |
| `[label](https://url)` | a link     |

Everything else is HTML-escaped, so `&`, `<` and quotes are safe to type literally. Link URLs are checked against an allow-list (http, https, mailto, `#anchor`, relative paths), so a stray `javascript:` URL is rendered inert.

A few fields worth knowing about:

- **`skills[].accent`** — `amber`, `teal`, `violet` or `muted`. Colours the group the way a syntax theme colours a token type.
- **`experience.entries[].current`** — `true` fills in that entry's timeline dot. Use it on the present role only.
- **`work.items[].featured`** — `true` promotes the project to a card.
- **`hero.editor.profile`** — this block is re-serialised back into syntax-highlighted YAML to draw the editor card in the hero, line numbers and all. What the card shows really is this config, so it can never drift. `flow_keys` lists the keys that should render as inline `[a, b]` lists rather than block lists.

## Deployment

Hosted on Cloudflare Pages at
[cv.alexandermendola.dev](https://cv.alexandermendola.dev), building from this
repo on every push to `main`:

| Setting                | Value                     |
| ---------------------- | ------------------------- |
| Build command          | `npm run build`           |
| Build output directory | `dist`                    |
| Node version           | from `.node-version` (20) |

So deploying is just:

```
git commit -am "Update experience"
git push
```

There is nothing to upload by hand — Cloudflare runs the build itself, which is
why `dist/` is gitignored rather than committed.

Two things worth keeping in mind:

- **Keep preview deployments set to None** (Settings → Builds & deployments).
  Left on, every push leaves an outdated copy of the CV permanently reachable
  at its own `*.pages.dev` URL.
- `dist/` has no absolute paths, so it also works from a plain `file://`
  double-click if you ever want to check it without deploying.
