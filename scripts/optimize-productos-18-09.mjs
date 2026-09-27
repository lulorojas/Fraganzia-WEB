// scripts/optimize-productos-18-09.mjs
// Convierte los PNG pesados (rasters crudos extraídos del PDF) a JPEG
// comprimido y redimensionado, actualiza Firestore con la nueva extensión.
import { createCanvas, loadImage } from 'canvas';
import { readdirSync, writeFileSync, unlinkSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, '..', 'public', 'productos-18-09');
const MAX_SIDE = 700;
const QUALITY = 0.82;

const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const files = readdirSync(DIR).filter((f) => f.endsWith('.png'));

let totalAntes = 0;
let totalDespues = 0;

for (const file of files) {
  const srcPath = join(DIR, file);
  totalAntes += statSync(srcPath).size;

  const img = await loadImage(srcPath);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const jpgBuffer = canvas.toBuffer('image/jpeg', { quality: QUALITY });
  const destFile = file.replace(/\.png$/, '.jpg');
  writeFileSync(join(DIR, destFile), jpgBuffer);
  unlinkSync(srcPath);
  totalDespues += jpgBuffer.length;

  console.log(`${file} -> ${destFile} (${w}x${h})`);
}

console.log(`\nTotal antes: ${(totalAntes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Total después: ${(totalDespues / 1024 / 1024).toFixed(2)} MB`);

// ── Actualizar Firestore: .png -> .jpg en imagenes[] ──
const snap = await db.collection('perfumes').get();
let actualizados = 0;
for (const doc of snap.docs) {
  const imgs = doc.data().imagenes;
  if (!imgs?.length) continue;
  const nuevas = imgs.map((u) => (u.startsWith('/productos-18-09/') ? u.replace(/\.png$/, '.jpg') : u));
  if (JSON.stringify(nuevas) !== JSON.stringify(imgs)) {
    await doc.ref.update({ imagenes: nuevas });
    actualizados++;
  }
}
console.log(`\nFirestore actualizado: ${actualizados} perfumes.`);
process.exit(0);
