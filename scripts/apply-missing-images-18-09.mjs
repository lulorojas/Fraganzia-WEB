// scripts/apply-missing-images-18-09.mjs
// Copia las imágenes identificadas manualmente del PDF 18-09 a public/productos-18-09/
// y actualiza el campo `imagenes` en Firestore para cada perfume.
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

const SRC_DIR = join(__dirname, 'pdf-images-18-09');
const PUBLIC_DIR = join(__dirname, '..', 'public', 'productos-18-09');

// nombre EXACTO en Firestore (marca+nombre como quedó al crear el perfume) -> archivo fuente
const MATCHES = {
  'AFNAN RARE CARBON 100ML': 'p3_7.png',
  'AFNAN TURATHI BROWN 90ML': 'p4_7.png',
  'ARMAF DUNESCAPE DUBAI EXTRAIT 100ML': 'p8_7.png',
  'FRAGRANCE WORLD IMPERIUM ABSOLU 100ML': 'p14_3.png',
  'FRAGRANCE WORLD IMPERIUM INTENSE 100ML': 'p14_4.png',
  'FRAGRANCE WORLD BUBBLY 100ML': 'p14_5.png',
  'FRAGRANCE WORLD EAU DE SPICE EXTREME MARK & VICTOR 100ML': 'p14_7.png',
  'FRAGRANCE WORLD LA UNO MILLION ELIXIR 100ML': 'p15_5.png',
  'FRAGRANCE WORLD LA UNO MILLION ROYAL 100ML': 'p15_7.png',
  'LATTAFA HABIK 100ML': 'p21_7.png',
  'MAISON ALHAMBRA GLACIER LE NOIR 100ML': 'p27_8.png',
  'MAISON ALHAMBRA SCEPTRE AMAZONITE 100ML': 'p28_8.png',
  'MAISON ALHAMBRA TORO POUR HOMME 100ML': 'p29_6.png',
  'MAISON ALHAMBRA SCEPTRE OCEANA 100ML': 'p29_7.png',
  'MAISON ALHAMBRA SO CANDID POUR HOMME 100ML': 'p29_8.png',
  'PENDORA SCENTS SAVIOUR 100ML': 'p31_3.png',
  'PENDORA SCENTS VERACIOUS BLUE FOR HIM 100ML': 'p31_4.png',
  'PARIS CORNER VOUX ZINGY 100ML': 'p31_5.png',
  'RAYHAAN VALHALLA 100ML': 'p34_4.png',
  'AFNAN RARE TIFFANY 100ML': 'p36_6.png',
  "FRAGRANCE WORLD IS L'AMOUR 75ML": 'p40_2.png',
  'FRAGRANCE WORLD VERSUS DIAMOND BLEU 100ML': 'p40_3.png',
  'FRAGRANCE WORLD IS INTENSE 75ML': 'p40_4.png',
  'FRAGRANCE WORLD IS EDP 75ML': 'p40_5.png',
  'LATTAFA ASDAAF RANEEN 80ML': 'p43_8.png',
  'LATTAFA HABIK PINK 100ML': 'p44_8.png',
  'LATTAFA RAMZ GOLD 100ML': 'p45_7.png',
  'MAISON ALHAMBRA CORAL BLUSH 80ML': 'p47_6.png',
  'MAISON ALHAMBRA SO CANDID POUR FEMME 80ML': 'p48_7.png',
  'MAISON ALHAMBRA PHILOS OPUS NOIR 100ML': 'p48_8.png',
  'MAISON ALHAMBRA YOUR TOUCH FOR WOMEN 100ML': 'p49_5.png',
  'PARIS CORNER MANGO PUNCH 100ML': 'p49_6.png',
  'PARIS CORNER CREAMY BISCUIT 100ML': 'p49_7.png',
  'PARIS CORNER PEAR POTION 100ML': 'p50_2.png',
  'PENDORA SCENTS MIDNIGHT IN PARIS 100ML': 'p50_6.png',
  'ZIMAYA FATIMA PINK 100ML': 'p51_4.png',
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
