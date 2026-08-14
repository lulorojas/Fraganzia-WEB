// scripts/patch-images-5.mjs
// Quinta ronda – URLs confirmadas vía scraping de perfumenz.co.nz.
// Novedades: filenames distintos en CDN (editions, emir-prefix, /products/ path)
// Uso: node scripts/patch-images-5.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const NZ  = 'https://www.perfumenz.co.nz/cdn/shop/files/';
const NZP = 'https://www.perfumenz.co.nz/cdn/shop/products/'; // vieja ruta Shopify

// URLs confirmadas vía páginas de producto en perfumenz.co.nz
// Los filenames son distintos de lo que fix-images.mjs intentó
const CONFIRMED = [
  // ── French Avenue Genesis (zodíaco) ─────────────────────────────────────
  // Filename sin "genesis-" → así los tiene perfumenz.co.nz
  ['FRENCH AVENUE GENESIS CAPRICORN',
    NZ + 'french-avenue-capricorn_1024x1024.png'],
  ['FRENCH AVENUE GENESIS LIBRA',
    NZ + 'french-avenue-libra_1024x1024.png'],

  // ── Bharara ───────────────────────────────────────────────────────────────
  // King Gold → "gold-edition" en el CDN (fix-images usó "king-gold" sin "edition")
  ['BHARARA KING GOLD',
    NZ + 'bharara-king-gold-edition_1024x1024.png'],
  // King Soleil → producto nuevo 2026 (no existía cuando corrió fix-images)
  ['BHARARA KING SOLEIL',
    NZ + 'bharara-king-soleil_1024x1024.png'],
  // King Parfum → 2021, versión reciente del CDN
  ['BHARARA KING PARFUM',
    NZ + 'bharara-king-parfum_1024x1024.png'],
  // King EDP 150ML → se usa la imagen del 200ml (mismo diseño de botella)
  ['BHARARA KING EDP 150ML',
    NZ + 'bharara-king-200ml_1024x1024.png'],

  // ── Paris Corner / Emir ───────────────────────────────────────────────────
  // Perfumenz.co.nz las lista como "Emir" → filename con "emir-" prefix
  ['PARIS CORNER VOUX ELEGANTE',
    NZ + 'emir-voux-elegante_1024x1024.png'],
  ['PARIS CORNER VOUX TURQUOISE',
    NZ + 'emir-voux-turquoise_1024x1024.png'],

  // ── Armaf ─────────────────────────────────────────────────────────────────
  // Odyssey Homme es de 2018 → imagen en la ruta vieja /products/
  ['ARMAF ODYSSEY HOMME FOR MEN',
    NZP + 'armaf-odyssey-homme_1024x1024.png'],

  // ── Al Haramain ───────────────────────────────────────────────────────────
  // "Amber Oud Exclusif Parfum Classic" → CDN: "haramain-amber-oud-exclusif"
  // Está en la ruta vieja /products/ (producto de 2021)
  ['AL HARAMAIN AMBER OUD EXCLUSIF PARFUM CLASSIC',
    NZP + 'haramain-amber-oud-exclusif_1024x1024.png'],
];

// ─────────────────────────────────────────────────────────────────────────────
async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    return res.ok;
  } catch { return false; }
}

const snap = await db.collection('perfumes').get();
let applied = 0, noImg = 0;

for (const doc of snap.docs) {
  const data = doc.data();
  if (data.imagenes?.length > 0) continue;  // ya tiene imagen

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
