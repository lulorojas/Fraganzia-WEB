// scripts/verify-destacados-sheet.mjs
import { createCanvas, loadImage } from 'canvas';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, '..', 'public', 'productos-18-09');

const files = [
  'emper-uomo-intense-100ml.jpg',
  'lattafa-eclaire-100ml.jpg',
  'emper-donna-intense-100ml.jpg',
  'rayhaan-azul-100ml.jpg',
  'afnan-9pm-100ml.jpg',
  'lattafa-khamrah-100ml.jpg',
  'armaf-odyssey-mandarin-sky-100ml.jpg',
  'lattafa-yara-moi-100ml.jpg',
  'lattafa-khamrah-waha-100ml.jpg',
];

const COLS = 3;
const CELL = 300;
const ROWS = Math.ceil(files.length / COLS);
const canvas = createCanvas(COLS * CELL, ROWS * (CELL + 30));
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#fff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

for (let i = 0; i < files.length; i++) {
  const img = await loadImage(join(DIR, files[i]));
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const x = col * CELL;
  const y = row * (CELL + 30);
  ctx.drawImage(img, x + 10, y + 10, CELL - 20, CELL - 20);
  ctx.fillStyle = '#000';
  ctx.font = '14px sans-serif';
  ctx.fillText(files[i], x + 5, y + CELL + 20);
}

const out = join(__dirname, 'verify-destacados-sheet.png');
writeFileSync(out, canvas.toBuffer('image/png'));
console.log('Wrote', out);
