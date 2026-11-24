// Rasterises the SVG textures from generate.py at 2x into PNG files with a
// transparent background (Chromium applies the SVG filters exactly as the
// browser will). Run from apps/web:
//   python3 scripts/yarn/generate.py <svg-dir>
//   node scripts/yarn/render.mjs <svg-dir> <png-dir>
// then convert the PNGs to WebP into public/yarn/ (see README.md).
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const [svgDir, pngDir] = process.argv.slice(2);
if (!svgDir || !pngDir) {
  console.error("usage: node render.mjs <svg-dir> <png-dir>");
  process.exit(1);
}
mkdirSync(pngDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const file of readdirSync(svgDir).filter((f) => f.endsWith(".svg"))) {
  const svg = readFileSync(join(svgDir, file), "utf8");
  const width = Number(svg.match(/width="(\d+)"/)?.[1]);
  const height = Number(svg.match(/height="(\d+)"/)?.[1]);
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg}</body></html>`,
  );
  await page.screenshot({
    path: join(pngDir, file.replace(/\.svg$/, ".png")),
    omitBackground: true,
  });
}
await browser.close();
