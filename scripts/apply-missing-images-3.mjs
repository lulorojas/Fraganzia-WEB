// scripts/apply-missing-images-3.mjs
// Copia las imágenes identificadas manualmente (tanda 3, 14 perfumes que
// habían quedado sin foto) a public/productos-18-09/ y actualiza el campo
// `imagenes` en Firestore para cada perfume.
import { copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const SRC_DIR = join(__dirname, 'pdf-images-18-09-t3');
const PUBLIC_DIR = join(__dirname, '..', 'public', 'productos-18-09');

const MATCHES = {
  'LATTAFA ATLAS CANYON 55ML': 'p20_7.png',
  'KHADLAJ ISLAND DREAMS 100ML': 'p17_6.png',
  'LATTAFA ATLAS GLACIAL VALLEY 55ML': 'p20_8.png',
  'LATTAFA AL NASHAMA CAPRICE 100ML': 'p18_5.png',
  'ARMAF ODYSSEY SODA POP 100ML': 'p11_8.png',
  'RASASI HAWAS VERDE 100ML': 'p32_8.png',
  'RIIFFS FREEZE 100ML': 'p34_6.png',
  'LATTAFA NAJDIA INTENSE 100ML': 'p24_8.png',
  'RASASI HAWAS DIVA 100ML': 'p50_5.png',
  'ARMAF DUBAI NIGHTS MIDNIGHT 100ML': 'p8_8.png',
  'RAYHAAN PACIFIC AURA 100ML': 'p34_5.png',
  'LATTAFA MUSAMAM BLACK INTENSE 100ML': 'p23_8.png',
  'LATTAFA QAED AL FURSAN UNTAMED 90ML': 'p24_6.png',
  'RAYHAAN AQUATICA 100ML': 'p33_7.png',
};

function slug(nombre) {
  return nombre
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
  const destFile = `${slug(nombre)}.png`;
  copyFileSync(join(SRC_DIR, srcFile), join(PUBLIC_DIR, destFile));
  const url = `/productos-18-09/${destFile}`;
  await doc.ref.update({ imagenes: [url] });
  console.log(`✅ ${nombre} -> ${url}`);
  actualizados++;
}

console.log(`\n🎉 Listo: ${actualizados} actualizados, ${noEncontrados} no encontrados en Firestore.`);
process.exit(0);
