// scripts/verify-batch3-sheets.mjs
// Arma una grilla por página con todas las imágenes candidatas extraídas de
// pdf-images-18-09-t3, para matchear visualmente contra el nombre real de
// cada producto de la tanda 3 (14 perfumes sin foto).
import { createCanvas, loadImage } from 'canvas';
import { writeFileSync, readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, 'pdf-images-18-09-t3');

const { ordenEnPagina } = JSON.parse(readFileSync(join(__dirname, 'missing-pages-3.json'), 'utf8'));

const PAGES = [8, 11, 17, 18, 20, 23, 24, 32, 33, 34, 50];

const CELL_W = 260;
const CELL_H = 300;
const IMG_H = 240;

async function buildSheet(pageNum, files) {
  const cols = Math.min(files.length, 5);
  const rows = Math.ceil(files.length / cols);
  const canvas = createCanvas(cols * CELL_W, rows * CELL_H + 40);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`Página ${pageNum}`, 8, 25);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * CELL_W;
    const y = 40 + row * CELL_H;
    try {
      const img = await loadImage(join(SRC_DIR, file));
      const scale = Math.min((CELL_W - 10) / img.width, (IMG_H - 10) / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, x + (CELL_W - w) / 2, y + (IMG_H - h) / 2, w, h);
    } catch {
      ctx.fillStyle = '#f00';
      ctx.fillText('ERROR: ' + file, x + 5, y + 20);
    }
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(x, y, CELL_W, CELL_H);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(file.replace('.png', ''), x + 4, y + IMG_H + 18, CELL_W - 8);
  }
  writeFileSync(join(__dirname, `verify-batch3-page-${pageNum}.png`), canvas.toBuffer('image/png'));
  console.log(`✅ Página ${pageNum}: ${files.length} imágenes -> verify-batch3-page-${pageNum}.png`);
}

for (const pageNum of PAGES) {
  const files = readdirSync(SRC_DIR)
    .filter((f) => f.startsWith(`p${pageNum}_`))
    .sort((a, b) => {
      const ai = parseInt(a.match(/_(\d+)\.png/)[1], 10);
      const bi = parseInt(b.match(/_(\d+)\.png/)[1], 10);
      return ai - bi;
    });
  console.log(`\n=== Página ${pageNum} ===`);
  console.log('Orden de nombres en la página:', ordenEnPagina[pageNum]?.join(' | '));
  await buildSheet(pageNum, files);
}
