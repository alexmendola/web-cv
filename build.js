#!/usr/bin/env node
/* ---------------------------------------------------------------
   Build the site.

     node build.js            build once into dist/
     node build.js --watch    rebuild whenever cv.yaml or src/ changes

   dist/ is disposable: everything in it is generated from cv.yaml
   and src/. Publish that folder; edit this one.
---------------------------------------------------------------- */

import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import yaml from 'js-yaml';

import { renderPage } from './src/render.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(root, 'cv.yaml');
const SRC_DIR = path.join(root, 'src');
const OUT_DIR = path.join(root, 'dist');
const ASSETS = ['styles.css', 'main.js'];

async function build() {
  const raw = await readFile(SOURCE, 'utf8');

  let cv;
  try {
    cv = yaml.load(raw);
  } catch (err) {
    throw new Error(`cv.yaml is not valid YAML:\n${err.message}`);
  }
  if (!cv || typeof cv !== 'object') {
    throw new Error('cv.yaml parsed to nothing — is the file empty?');
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, 'index.html'), renderPage(cv), 'utf8');
  await Promise.all(
    ASSETS.map((name) =>
      copyFile(path.join(SRC_DIR, name), path.join(OUT_DIR, name))
    )
  );

  return ['index.html', ...ASSETS];
}

async function buildAndReport() {
  const started = Date.now();
  try {
    const files = await build();
    console.log(
      `built ${files.join(', ')} -> ${path.relative(root, OUT_DIR)}/ ` +
        `in ${Date.now() - started}ms`
    );
    return true;
  } catch (err) {
    console.error(`\nbuild failed: ${err.message}\n`);
    return false;
  }
}

const watching = process.argv.includes('--watch');
const ok = await buildAndReport();

if (!watching) {
  process.exit(ok ? 0 : 1);
}

// Editors often write a file as several events; coalesce them.
let pending = null;
const queueRebuild = () => {
  clearTimeout(pending);
  pending = setTimeout(buildAndReport, 80);
};

watch(SOURCE, queueRebuild);
watch(SRC_DIR, { recursive: true }, queueRebuild);
// Plain ASCII: this goes to a Windows console that is not always UTF-8.
console.log('watching cv.yaml and src/ - ctrl+c to stop');
