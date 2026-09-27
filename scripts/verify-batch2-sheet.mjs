// scripts/verify-batch2-sheet.mjs
// Arma UNA sola imagen (grilla) con las 21 fotos agregadas en la tanda 2,
// con el nombre del producto debajo de cada una, para poder revisarlas
// visualmente en una sola llamada (evita el límite de 20 imágenes por request).
import { createCanvas, loadImage } from 'canvas';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public', 'productos-18-09');

const ITEMS = [
  ['fragrance-world-harmony-code-absolute-100ml.jpg', 'FW HARMONY CODE ABSOLUTE'],
  ['fragrance-world-just-aswad-100ml.jpg', 'FW JUST ASWAD'],
  ['fragrance-world-midori-100ml.jpg', 'FW MIDORI'],
  ['french-avenue-pinnace-oryn-100ml.jpg', 'FA PINNACE ORYN'],
  ['maison-alhambra-b-a-d-homme-100ml.jpg', 'MA B.A.D HOMME'],
  ['maison-alhambra-dark-door-intense-100ml.jpg', 'MA DARK DOOR INTENSE'],
  ['maison-alhambra-dark-door-sport-100ml.jpg', 'MA DARK DOOR SPORT'],
  ['maison-alhambra-fortnight-100ml.jpg', 'MA FORTNIGHT'],
  ['maison-alhambra-galactic-men-elixir-100ml.jpg', 'MA GALACTIC MEN ELIXIR'],
  ['maison-alhambra-galactic-men-intense-100ml.jpg', 'MA GALACTIC MEN INTENSE'],
  ['maison-alhambra-kingsman-100ml.jpg', 'MA KINGSMAN'],
  ['maison-alhambra-your-touch-amber-100ml.jpg', 'MA YOUR TOUCH AMBER'],
  ['maison-alhambra-your-touch-for-men-100ml.jpg', 'MA YOUR TOUCH FOR MEN'],
  ['maison-alhambra-your-touch-intense-100ml.jpg', 'MA YOUR TOUCH INTENSE'],
  ['maison-alhambra-your-touch-leather-100ml.jpg', 'MA YOUR TOUCH LEATHER'],
  ['french-avenue-tropical-kiss-80ml.jpg', 'FA TROPICAL KISS'],
  ['maison-alhambra-b-a-d-femme-100ml.jpg', 'MA B.A.D FEMME'],
  ['paris-corner-khair-felicity-100ml.jpg', 'PC KHAIR FELICITY'],
  ['paris-corner-khair-fusion-100ml.jpg', 'PC KHAIR FUSION'],
  ['paris-corner-taskeen-100ml.jpg', 'PC TASKEEN'],
  ['paris-corner-taskeen-lactea-divina-100ml.jpg', 'PC TASKEEN LACTEA DIVINA'],
];

const COLS = 5;
const CELL_W = 260;
const CELL_H = 300;
const IMG_H = 260;
const ROWS = Math.ceil(ITEMS.length / COLS);

const canvas = createCanvas(COLS * CELL_W, ROWS * CELL_H);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

for (let i = 0; i < ITEMS.length; i++) {
  const [file, label] = ITEMS[i];
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
  } catch (e) {
    ctx.fillStyle = '#f00';
    ctx.fillText('ERROR: ' + file, x + 5, y + 20);
  }

  ctx.strokeStyle = '#ccc';
  ctx.strokeRect(x, y, CELL_W, CELL_H);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`#${i} ${label}`, x + 4, y + IMG_H + 20);
}

writeFileSync(join(__dirname, 'verify-batch2-sheet.png'), canvas.toBuffer('image/png'));
console.log(`✅ Listo: ${ITEMS.length} imágenes en scripts/verify-batch2-sheet.png`);
