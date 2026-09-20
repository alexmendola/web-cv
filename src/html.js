/* ---------------------------------------------------------------
   Small HTML helpers.

   Everything from cv.yaml is escaped by default; `inline()` then
   re-introduces a deliberately tiny markup vocabulary so the config
   can hold prose without holding markup.
---------------------------------------------------------------- */

const ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape text for use in element content or a quoted attribute value. */
export function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

/**
 * Values substituted for {{token}} at build time.
 * An unknown token is left alone rather than blanked, so a typo shows up on
 * the page instead of silently deleting itself.
 */
const TOKENS = {
  year: () => String(new Date().getFullYear()),
};

function substitute(text) {
  return text.replace(/\{\{(\w+)\}\}/g, (whole, name) =>
    Object.hasOwn(TOKENS, name) ? TOKENS[name]() : whole,
  );
}

/**
 * Escape, then allow **bold**, [label](href) and {{token}}.
 * An href outside the allow-list is left as literal source text rather than
 * quietly becoming a link, so a bad URL in cv.yaml is visible on the page.
 */
export function inline(value) {
  return substitute(
    esc(value)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label, href) =>
        isSafeHref(href) ? `<a href="${href}">${label}</a>` : whole,
      )
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"),
  );
}

/**
 * Href allow-list: http(s), mailto, #anchors and relative paths.
 * Note `href` arrives already escaped, so an `&amp;` in a query string is fine.
 */
export function isSafeHref(href) {
  if (/^(https?:\/\/|mailto:)/i.test(href)) return true;
  if (href.startsWith("//")) return false; // protocol-relative
  return !/^[a-z][a-z0-9+.-]*:/i.test(href); // any other scheme
}

/** Build an attribute string, skipping null/undefined/false values. */
export function attrs(map) {
  return Object.entries(map)
    .filter(([, v]) => v !== null && v !== undefined && v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`))
    .join("");
}

/** Join a list of rendered fragments, dropping empties. */
export function join(parts, separator = "\n") {
  return parts.filter(Boolean).join(separator);
}

/**
 * Indent every line of a block by `spaces`, for readable generated HTML.
 * Lines inside a <pre> are left alone – whitespace there is content, and
 * padding it would put blank gutters between the editor's code lines.
 */
export function indent(block, spaces) {
  const pad = " ".repeat(spaces);
  let inPre = false;

  return block
    .split("\n")
    .map((line) => {
      const padded = !inPre && line.trim() ? pad + line : line;
      if (line.includes("<pre>")) inPre = true;
      if (line.includes("</pre>")) inPre = false;
      return padded;
    })
    .join("\n");
}
