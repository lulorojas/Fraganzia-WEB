// scripts/convert-images-webp.mjs
// Genera una versión .webp de cada imagen de producto (jpg/png) en
// public/productos-18-09/, manteniendo el original como fallback para
// navegadores viejos. El <picture> en el front usa <source type="image/webp">.
import { readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, '..', 'public', 'productos-18-09');
const QUALITY = 80;

const files = readdirSync(DIR).filter((f) => /\.(jpe?g|png)$/i.test(f));

let totalOriginal = 0;
let totalWebp = 0;

for (const file of files) {
  const srcPath = join(DIR, file);
  const destPath = join(DIR, file.replace(extname(file), '.webp'));
  totalOriginal += statSync(srcPath).size;

  await sharp(srcPath).webp({ quality: QUALITY }).toFile(destPath);

  totalWebp += statSync(destPath).size;
  console.log(`${file} -> ${file.replace(extname(file), '.webp')}`);
}

console.log(`\nTotal original: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
console.log(`Total webp:     ${(totalWebp / 1024 / 1024).toFixed(2)} MB`);
