// scripts/make-contact-sheets-2.mjs
// Igual que make-contact-sheets.mjs pero para la tanda 2 (pdf-images-18-09-t2).
import { createCanvas, loadImage } from 'canvas';
import { readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, 'pdf-images-18-09-t2');

const PAGES = [14, 15, 17, 26, 27, 30, 42, 47, 49, 50];

const CELL = 260;
const COLS = 4;

async function makeSheet(pageNum) {
  const files = readdirSync(DIR)
    .filter((f) => f.startsWith(`p${pageNum}_`) && f.endsWith('.png'))
    .sort((a, b) => {
      const ai = Number(a.match(/_(\d+)\.png$/)[1]);
      const bi = Number(b.match(/_(\d+)\.png$/)[1]);
      return ai - bi;
    });
  if (!files.length) return;

  const rows = Math.ceil(files.length / COLS);
  const canvas = createCanvas(COLS * CELL, rows * CELL + 20);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < files.length; i++) {
    const img = await loadImage(join(DIR, files[i]));
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * CELL;
    const y = row * CELL;
    const scale = Math.min((CELL - 10) / img.width, (CELL - 30) / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, x + (CELL - w) / 2, y + (CELL - h) / 2, w, h);
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(x, y, CELL, CELL);
    const idx = Number(files[i].match(/_(\d+)\.png$/)[1]);
    ctx.fillStyle = 'red';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`#${idx}`, x + 5, y + 20);
  }

  writeFileSync(join(DIR, `SHEET_p${pageNum}.png`), canvas.toBuffer('image/png'));
  console.log(`p${pageNum}: sheet con ${files.length} imágenes`);
}

for (const pg of PAGES) {
  await makeSheet(pg);
}
console.log('\nListo.');
