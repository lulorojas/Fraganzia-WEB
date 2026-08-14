// scripts/patch-images-4.mjs
// Cuarta ronda – URLs confirmadas via scraping directo de silkperfumes.cl.
// Uso: node scripts/patch-images-4.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const S  = 'https://silkperfumes.cl/cdn/shop/files/';
const SP = 'https://silkperfumes.cl/cdn/shop/products/';

// URLs 100% confirmadas via Pinterest scraping de silkperfumes.cl
const CONFIRMED = [
  // ── Lattafa ────────────────────────────────────────────────────────────
  ['LATTAFA THE KINGDOM MASCULINO',
    S + 'lattafa-the-kingdom-eau-de-parfum-para-hombres-100ml-Silk-Perfumes.png'],
  ['LATTAFA THE KINGDOM FEMENINO',
    S + 'lattafa-the-kingdom-mujer-edp-100ml-Silk-Perfumes.png'],
  ['LATTAFA MAYAR CHERRY',
    S + 'Disenosintitulo-2025-11-15T122652.377.png'],
  ['LATTAFA OPULENT OUD',
    SP + 'lattafa-opulent-oud-edp-100ml-Silk-Perfumes-1.jpg'],
  ['LATTAFA ASDAAF AMEER AL ARAB IMPERIUM',
    S + 'lattafa-ameer-al-arab-imperium-edp-100ml-Silk-Perfumes.png'],

  // ── Rave ────────────────────────────────────────────────────────────────
  ['RAVE NOW MEN',
    S + 'now-de-rave-edp-100ml-Silk-Perfumes.png'],

  // ── Armaf ────────────────────────────────────────────────────────────────
  ['ARMAF ODYSSEY SPECTRA',
    S + 'armaf-odyssey-spectra-rainbow-edition-edp-100ml-Silk-Perfumes-1.png'],
  ['ARMAF CLUB DE NUIT OUD PARFUM',
    S + 'armaf-club-de-nuit-oud-i-parfum-105-ml-Silk-Perfumes.png'],

  // ── Grandeur Tubbees ────────────────────────────────────────────────────
  ['GRANDEUR TUBBEES CHERRY LUXE',
    S + 'grandeur-tubbees-cherry-luxe-edp-50ml-silk-perfumes.png'],
  ['GRANDEUR TUBBEES PINK SUGAR',
    S + 'grandeur-tubbees-pink-sugar-edp-50ml-silk-perfumes.png'],

  // ── Fragrance World ──────────────────────────────────────────────────────
  ['FRAGRANCE WORLD JUST AZRAQ',
    S + 'FRWD40.png'],

  // ── Bharara ──────────────────────────────────────────────────────────────
  // Mismo diseño de botella que 200 ml; imagen sirve para 100 ml
  ['BHARARA NICHE PARFUM',
    SP + 'bharara-niche-parfum-200ml-1.jpg'],
];

// --------------------------------------------------------------------------
async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    return res.ok;
  } catch { return false; }
}

// Main: itera todos los docs, solo actualiza los que NO tienen imagenes aún
const snap = await db.collection('perfumes').get();
let applied = 0, noImg = 0;

for (const doc of snap.docs) {
  const data = doc.data();
  if (data.imagenes?.length > 0) continue;  // ya tiene imagen → saltar

  const name = (data.nombre || '').toUpperCase();

  const match = CONFIRMED.find(([key]) => name.includes(key));
  if (!match) { noImg++; continue; }

  const [key, imageUrl] = match;
  const ok = await headOk(imageUrl);
  if (!ok) {
    console.log(`⚠️  URL no accesible: "${data.nombre}"\n   ${imageUrl}`);
    noImg++;
    continue;
  }

  await doc.ref.update({ imagenes: [imageUrl] });
  console.log(`✅ ${data.nombre}`);
  applied++;
}

console.log(`\n── Resumen ──────────────────────────────`);
console.log(`Aplicadas  : ${applied}`);
console.log(`Sin resolver: ${noImg}`);
process.exit(0);
