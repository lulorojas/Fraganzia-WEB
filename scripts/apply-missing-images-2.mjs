// scripts/apply-missing-images-2.mjs
// Copia (comprimiendo a JPEG) las imágenes identificadas manualmente para la
// tanda 2 de productos sin foto, y actualiza Firestore.
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { createCanvas, loadImage } from 'canvas';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const SRC_DIR = join(__dirname, 'pdf-images-18-09-t2');
const PUBLIC_DIR = join(__dirname, '..', 'public', 'productos-18-09');
const MAX_SIDE = 700;
const QUALITY = 0.82;

const MATCHES = {
  'FRAGRANCE WORLD HARMONY CODE ABSOLUTE 100ML': 'p14_6.png',
  'FRAGRANCE WORLD JUST ASWAD 100ML': 'p15_6.png',
  'FRAGRANCE WORLD MIDORI 100ML': 'p15_4.png',
  'FRENCH AVENUE PINNACE ORYN 100ML': 'p17_5.png',
  'MAISON ALHAMBRA B.A.D HOMME 100ML': 'p26_3.png',
  'MAISON ALHAMBRA DARK DOOR INTENSE 100ML': 'p26_4.png',
  'MAISON ALHAMBRA DARK DOOR SPORT 100ML': 'p26_5.png',
  'MAISON ALHAMBRA FORTNIGHT 100ML': 'p26_2.png',
  'MAISON ALHAMBRA GALACTIC MEN ELIXIR 100ML': 'p26_6.png',
  'MAISON ALHAMBRA GALACTIC MEN INTENSE 100ML': 'p26_7.png',
  'MAISON ALHAMBRA KINGSMAN 100ML': 'p27_7.png',
  'MAISON ALHAMBRA YOUR TOUCH AMBER 100ML': 'p30_5.png',
  'MAISON ALHAMBRA YOUR TOUCH FOR MEN 100ML': 'p30_4.png',
  'MAISON ALHAMBRA YOUR TOUCH INTENSE 100ML': 'p30_6.png',
  'MAISON ALHAMBRA YOUR TOUCH LEATHER 100ML': 'p30_3.png',
  'FRENCH AVENUE TROPICAL KISS 80ML': 'p42_7.png',
  'MAISON ALHAMBRA B.A.D FEMME 100ML': 'p47_7.png',
  'PARIS CORNER KHAIR FELICITY 100ML': 'p49_3.png',
  'PARIS CORNER KHAIR FUSION 100ML': 'p49_4.png',
  'PARIS CORNER TASKEEN 100ML': 'p50_4.png',
  'PARIS CORNER TASKEEN LACTEA DIVINA 100ML': 'p50_3.png',
};

function slug(nombre) {
  return nombre.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function toOptimizedJpg(srcPath) {
  const img = await loadImage(srcPath);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toBuffer('image/jpeg', { quality: QUALITY });
}

const snap = await db.collection('perfumes').get();
const docs = snap.docs;

let actualizados = 0;
let noEncontrados = 0;

for (const [nombre, srcFile] of Object.entries(MATCHES)) {
  const doc = docs.find((d) => (d.data().nombre || '').toUpperCase() === nombre);
  if (!doc) {
    console.log(`⚠️  No encontrado en Firestore: ${nombre}`);
    noEncontrados++;
    continue;
  }
  if (doc.data().imagenes?.length > 0) {
    console.log(`↷ Ya tenía imagen, se omite: ${nombre}`);
    continue;
  }
  const destFile = `${slug(nombre)}.jpg`;
  const jpgBuffer = await toOptimizedJpg(join(SRC_DIR, srcFile));
  writeFileSync(join(PUBLIC_DIR, destFile), jpgBuffer);
  const url = `/productos-18-09/${destFile}`;
  await doc.ref.update({ imagenes: [url] });
  console.log(`✅ ${nombre} -> ${url} (${(jpgBuffer.length / 1024).toFixed(0)} KB)`);
  actualizados++;
}

console.log(`\n🎉 Listo: ${actualizados} actualizados, ${noEncontrados} no encontrados en Firestore.`);
process.exit(0);
