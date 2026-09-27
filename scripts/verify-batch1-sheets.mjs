// scripts/verify-batch1-sheets.mjs
// Arma 2 imágenes (grilla) con las ~35 fotos del PRIMER lote (sesión
// anterior), para revisarlas visualmente sin superar el límite de imágenes
// por request.
import { createCanvas, loadImage } from 'canvas';
import { writeFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public', 'productos-18-09');

const BATCH2 = new Set([
  'fragrance-world-harmony-code-absolute-100ml.jpg',
  'fragrance-world-just-aswad-100ml.jpg',
  'fragrance-world-midori-100ml.jpg',
  'french-avenue-pinnace-oryn-100ml.jpg',
  'maison-alhambra-b-a-d-homme-100ml.jpg',
  'maison-alhambra-dark-door-intense-100ml.jpg',
  'maison-alhambra-dark-door-sport-100ml.jpg',
  'maison-alhambra-fortnight-100ml.jpg',
  'maison-alhambra-galactic-men-elixir-100ml.jpg',
  'maison-alhambra-galactic-men-intense-100ml.jpg',
  'maison-alhambra-kingsman-100ml.jpg',
  'maison-alhambra-your-touch-amber-100ml.jpg',
  'maison-alhambra-your-touch-for-men-100ml.jpg',
  'maison-alhambra-your-touch-intense-100ml.jpg',
  'maison-alhambra-your-touch-leather-100ml.jpg',
  'french-avenue-tropical-kiss-80ml.jpg',
  'maison-alhambra-b-a-d-femme-100ml.jpg',
  'paris-corner-khair-felicity-100ml.jpg',
  'paris-corner-khair-fusion-100ml.jpg',
  'paris-corner-taskeen-100ml.jpg',
  'paris-corner-taskeen-lactea-divina-100ml.jpg',
]);

const allFiles = readdirSync(PUBLIC_DIR).filter((f) => f.endsWith('.jpg') && !BATCH2.has(f)).sort();
console.log(`Archivos del primer lote a revisar: ${allFiles.length}`);

const COLS = 5;
const CELL_W = 260;
const CELL_H = 300;
const IMG_H = 260;

async function buildSheet(files, outName) {
  const rows = Math.ceil(files.length / COLS);
  const canvas = createCanvas(COLS * CELL_W, rows * CELL_H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * CELL_W;
    const y = row * CELL_H;
    try {
      const img = await loadImage(join(PUBLIC_DIR, file));
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
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`#${i} ${file.replace('.jpg', '')}`, x + 4, y + IMG_H + 15, CELL_W - 8);
  }
  writeFileSync(join(__dirname, outName), canvas.toBuffer('image/png'));
  console.log(`✅ ${outName}: ${files.length} imágenes`);
}

const mid = Math.ceil(allFiles.length / 2);
await buildSheet(allFiles.slice(0, mid), 'verify-batch1-sheet-A.png');
await buildSheet(allFiles.slice(mid), 'verify-batch1-sheet-B.png');
