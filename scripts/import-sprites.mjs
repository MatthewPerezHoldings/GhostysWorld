// One-shot importer: converts source images (HEIC/JPG) from
// OneDrive\Pictures\Camera Roll\ghostysworld into public/assets/sprites/*.png.
//
// Usage: node scripts/import-sprites.mjs
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import heicConvert from "heic-convert";

const SRC_DIR = String.raw`C:\Users\matth\OneDrive\Pictures\Camera Roll\ghostysworld`;
const OUT_DIR = path.resolve("public/assets/sprites");

async function toPng(srcPath) {
  const buf = await readFile(srcPath);
  const ext = path.extname(srcPath).toLowerCase();
  if (ext === ".heic" || ext === ".heif") {
    const out = await heicConvert({ buffer: buf, format: "PNG" });
    return Buffer.from(out);
  }
  return sharp(buf).png().toBuffer();
}

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });
  const files = await readdir(SRC_DIR);
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (![".heic", ".heif", ".jpg", ".jpeg", ".png", ".webp"].includes(ext)) continue;
    const src = path.join(SRC_DIR, f);
    const stem = path.basename(f, path.extname(f)).replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
    const out = path.join(OUT_DIR, `${stem}.png`);
    try {
      const png = await toPng(src);
      // Resize to max 512px on longest edge — keeps repo small, plenty for 32px display.
      const resized = await sharp(png).resize({ width: 512, height: 512, fit: "inside" }).png().toBuffer();
      await writeFile(out, resized);
      console.log(`OK ${f} -> ${path.relative(process.cwd(), out)}`);
    } catch (e) {
      console.error(`FAIL ${f}: ${e.message}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
