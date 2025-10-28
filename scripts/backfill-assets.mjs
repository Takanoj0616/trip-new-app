#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const PAGE = path.join(ROOT, 'src/app/page.tsx');
const ASSETS_DIR = path.join(ROOT, 'public/assets');

// 1x1 transparent PNG
const PNG_PLACEHOLDER_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

function unique(arr) { return Array.from(new Set(arr)); }

async function main() {
  await ensureDir(ASSETS_DIR);
  const src = await fs.readFile(PAGE, 'utf8');
  const re = /\"\/assets\/([A-Za-z0-9._-]+\.(?:png|svg|jpg|jpeg))\"/g;
  const files = [];
  for (const m of src.matchAll(re)) {
    files.push(m[1]);
  }
  const uniqueFiles = unique(files);
  if (uniqueFiles.length === 0) {
    console.log('No asset references found.');
    return;
  }
  console.log(`Found ${uniqueFiles.length} asset references.`);

  let created = 0;
  for (const name of uniqueFiles) {
    const ext = path.extname(name).toLowerCase();
    const outPath = path.join(ASSETS_DIR, name);
    if (await fileExists(outPath)) {
      continue;
    }
    await ensureDir(path.dirname(outPath));
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      const buf = Buffer.from(PNG_PLACEHOLDER_BASE64, 'base64');
      await fs.writeFile(outPath, buf);
    } else if (ext === '.svg') {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="#444"/></svg>`;
      await fs.writeFile(outPath, svg, 'utf8');
    } else {
      // default to png
      const buf = Buffer.from(PNG_PLACEHOLDER_BASE64, 'base64');
      await fs.writeFile(outPath, buf);
    }
    created++;
  }
  console.log(`Created ${created} placeholder file(s) in public/assets`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

