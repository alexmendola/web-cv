#!/usr/bin/env node
/* ---------------------------------------------------------------
   Build the site.

     node build.js            build once into dist/
     node build.js --watch    rebuild whenever cv.yaml or src/ changes

   dist/ is disposable: everything in it is generated from cv.yaml
   and src/. Publish that folder; edit this one.
---------------------------------------------------------------- */

import { readFile, writeFile, copyFile, mkdir, access } from "node:fs/promises";
import { watch } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import yaml from "js-yaml";

import { renderPage } from "./src/render.js";
import { renderCard } from "./src/og-card.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(root, "cv.yaml");
const SRC_DIR = path.join(root, "src");
const OUT_DIR = path.join(root, "dist");
const ASSETS = ["styles.css", "main.js"];
// Copied only if present, so the build still works before the card exists.
const OPTIONAL_ASSETS = ["og.png"];

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

async function build() {
  const raw = await readFile(SOURCE, "utf8");

  let cv;
  try {
    cv = yaml.load(raw);
  } catch (err) {
    throw new Error(`cv.yaml is not valid YAML:\n${err.message}`);
  }
  if (!cv || typeof cv !== "object") {
    throw new Error("cv.yaml parsed to nothing – is the file empty?");
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "index.html"), renderPage(cv), "utf8");
  // Written to the project root, not dist/ – it is a tool for producing
  // og.png, not part of the site, and should never be deployed.
  await writeFile(path.join(root, "og-card.html"), renderCard(cv), "utf8");
  await Promise.all(
    ASSETS.map((name) =>
      copyFile(path.join(SRC_DIR, name), path.join(OUT_DIR, name)),
    ),
  );

  const written = ["index.html", ...ASSETS];

  for (const name of OPTIONAL_ASSETS) {
    if (await exists(path.join(SRC_DIR, name))) {
      await copyFile(path.join(SRC_DIR, name), path.join(OUT_DIR, name));
      written.push(name);
    }
  }

  // A link preview pointing at a missing image is worse than no image tag:
  // scrapers cache the failure. Warn loudly rather than deploying a 404.
  if (cv.meta?.og?.image && !written.includes("og.png")) {
    console.warn(
      `  ! meta.og.image is set but src/og.png is missing - the link preview\n` +
        `    will 404. Open og-card.html in a browser and capture the card.`,
    );
  }

  return written;
}

async function buildAndReport() {
  const started = Date.now();
  try {
    const files = await build();
    console.log(
      `built ${files.join(", ")} -> ${path.relative(root, OUT_DIR)}/ ` +
        `in ${Date.now() - started}ms`,
    );
    return true;
  } catch (err) {
    console.error(`\nbuild failed: ${err.message}\n`);
    return false;
  }
}

const watching = process.argv.includes("--watch");
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
console.log("watching cv.yaml and src/ - ctrl+c to stop");
