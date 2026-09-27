// scripts/verify-batch3-final.mjs
// Contact sheet final de las 14 fotos recién aplicadas, para confirmar
// visualmente que cada una corresponde al producto correcto.
import { createCanvas, loadImage } from 'canvas';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public', 'productos-18-09');

const FILES = [
  'lattafa-atlas-canyon-55ml.png',
  'khadlaj-island-dreams-100ml.png',
  'lattafa-atlas-glacial-valley-55ml.png',
  'lattafa-al-nashama-caprice-100ml.png',
  'armaf-odyssey-soda-pop-100ml.png',
  'rasasi-hawas-verde-100ml.png',
  'riiffs-freeze-100ml.png',
  'lattafa-najdia-intense-100ml.png',
  'rasasi-hawas-diva-100ml.png',
  'armaf-dubai-nights-midnight-100ml.png',
  'rayhaan-pacific-aura-100ml.png',
  'lattafa-musamam-black-intense-100ml.png',
  'lattafa-qaed-al-fursan-untamed-90ml.png',
  'rayhaan-aquatica-100ml.png',
];

const COLS = 5;
const CELL_W = 260;
const CELL_H = 300;
const IMG_H = 260;
const rows = Math.ceil(FILES.length / COLS);
const canvas = createCanvas(COLS * CELL_W, rows * CELL_H);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

for (let i = 0; i < FILES.length; i++) {
  const file = FILES[i];
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const x = col * CELL_W;
  const y = row * CELL_H;
  const img = await loadImage(join(PUBLIC_DIR, file));
  const scale = Math.min((CELL_W - 10) / img.width, (IMG_H - 10) / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, x + (CELL_W - w) / 2, y + (IMG_H - h) / 2, w, h);
  ctx.strokeStyle = '#ccc';
  ctx.strokeRect(x, y, CELL_W, CELL_H);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`#${i} ${file.replace('.png', '')}`, x + 4, y + IMG_H + 15, CELL_W - 8);
}
writeFileSync(join(__dirname, 'verify-batch3-final.png'), canvas.toBuffer('image/png'));
console.log('✅ Listo: verify-batch3-final.png');
