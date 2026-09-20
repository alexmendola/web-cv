/* ---------------------------------------------------------------
   Re-serialise the `hero.editor.profile` object back into YAML, as
   syntax-highlighted HTML lines.

   The point is that the editor card in the hero is not a picture of a
   config file — it *is* the config, round-tripped. Edit cv.yaml and the
   card follows, line numbers included.

   Colour convention inherited from the original hand-written page:
     mapping keys   -> violet   (--violet, .tok-key)
     mapping values -> amber, quoted   (.tok-str)
     sequence items -> teal, bare      (.tok-val)
     punctuation    -> muted           (.tok-punc)
---------------------------------------------------------------- */

import { esc } from './html.js';

const key = (t) => `<span class="tok-key">${esc(t)}</span>`;
const str = (t) => `<span class="tok-str">"${esc(t)}"</span>`;
const val = (t) => `<span class="tok-val">${esc(t)}</span>`;
const punc = (t) => `<span class="tok-punc">${esc(t)}</span>`;
const comment = (t) => `<span class="tok-comment"># ${esc(t)}</span>`;

/**
 * @param {object} editor  the `hero.editor` block from cv.yaml
 * @returns {string[]}     one HTML fragment per rendered line
 */
export function renderProfile(editor = {}) {
  const lines = [];
  if (editor.comment) lines.push(comment(editor.comment));
  walk(editor.profile ?? {}, 0, new Set(editor.flow_keys ?? []), lines);
  return lines;
}

function walk(node, depth, flowKeys, lines) {
  const pad = ' '.repeat(depth * 2);

  for (const [k, value] of Object.entries(node)) {
    if (Array.isArray(value)) {
      if (flowKeys.has(k)) {
        lines.push(`${pad}${key(k)}${punc(':')} ${flowSeq(value)}`);
      } else {
        lines.push(`${pad}${key(k)}${punc(':')}`);
        for (const item of value) {
          lines.push(`${pad}${punc('  -')} ${val(item)}`);
        }
      }
    } else if (value && typeof value === 'object') {
      lines.push(`${pad}${key(k)}${punc(':')}`);
      walk(value, depth + 1, flowKeys, lines);
    } else {
      lines.push(`${pad}${key(k)}${punc(':')} ${scalar(value)}`);
    }
  }
}

/**
 * A plain-text reading of the same profile, for the card's accessible name.
 *
 * The card is `role="img"`, so assistive tech announces this instead of
 * walking eleven lines of quotes, colons, dashes and line numbers. Built from
 * the same object as the visible card, so the two cannot drift apart.
 *
 * @param {object} editor  the `hero.editor` block from cv.yaml
 * @returns {string}
 */
export function describeProfile(editor = {}) {
  const parts = Object.entries(editor.profile ?? {}).map(([k, value]) => {
    const label = k.replace(/_/g, ' ');
    const text = Array.isArray(value) ? value.join(', ') : value;
    return `${label}: ${text}`;
  });
  return `Profile summary, shown as a YAML file. ${parts.join('. ')}.`;
}

function flowSeq(items) {
  const inner = items.map((i) => val(i)).join(`${punc(',')} `);
  return `${punc('[')}${inner}${punc(']')}`;
}

/** Strings read as quoted values; numbers and booleans stay bare. */
function scalar(value) {
  return typeof value === 'string' ? str(value) : val(value);
}
