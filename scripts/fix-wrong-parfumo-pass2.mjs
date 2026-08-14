// fix-wrong-parfumo-pass2.mjs — segunda pasada para los 28 restantes con imagen parfumo incorrecta
// Prueba variantes adicionales de slug (con "man", con volumen exacto, etc.)

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

function toSlug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isWrongParfumoImage(imageUrl, productName) {
  if (!imageUrl || !imageUrl.includes('parfumo')) return false;
  const m = imageUrl.match(/parfumo\.com\/perfumes\/[a-f0-9]{2}\/[a-f0-9]+-([^_"'\s]+)_\d+\.jpg/);
  if (!m) return false;
  const imgSlug = m[1].toLowerCase().replace(/-/g, ' ');
  const nameWords = productName.toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(' ')
    .filter(w => w.length > 3 && !['100ml', '90ml', '75ml', '60ml', '50ml', '55ml', '105ml', '120ml', '200ml', '150ml', '80ml'].includes(w));
  return !nameWords.some(w => imgSlug.includes(w));
}

async function headOk(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return r.ok;
  } catch { return false; }
}

// URLs extendidas para productos que fallaron en la 1er pasada
const EXTRA_MANUAL = [
  // Armaf - variantes con "man" o sin volumen
  ['ARMAF CLUB DE NUIT INTENSE 105ML', [
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-intense-man-edp-105ml-Silk-Perfumes.png',
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-intense-edp-105ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-intense_1024x1024.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-intense-man_1024x1024.webp',
  ]],
  ['ARMAF CLUB DE NUIT ICONIC 105ML', [
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-iconic-edp-105ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-iconic_1024x1024.webp',
  ]],
  ['ARMAF CLUB DE NUIT PRECIEUX I 55ML', [
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-precieux-i-edp-55ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-precieux-i_1024x1024.webp',
  ]],
  ['ARMAF CLUB DE NUIT PRECIEUX IV 55ML', [
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-precieux-iv-edp-55ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-precieux-iv_1024x1024.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-precieux-iv_1024x1024.webp',
  ]],
  ['ARMAF CLUB DE NUIT IMPERIALE 105ML', [
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-imperiale-edp-105ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-imperiale_1024x1024.webp',
  ]],
  ['ARMAF CLUB DE NUIT WOMAN 105ML', [
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-woman-edp-105ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-woman_1024x1024.webp',
  ]],
  // Maison Alhambra silkperfumes variants
  ['MAISON ALHAMBRA DELILAH 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-delilah-edp-100ml-Silk-Perfumes.png',
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-delilah-edp-100ml-Silk-Perfumes.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-delilah_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-delilah_1024x1024.jpg',
  ]],
  ['MAISON ALHAMBRA LA VITA 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-la-vita-edp-100ml-Silk-Perfumes.png',
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-la-vita-edp-100ml-Silk-Perfumes.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-la-vita_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-la-vita_1024x1024.jpg',
  ]],
  ['MAISON ALHAMBRA THE MYTH 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-the-myth-edp-100ml-Silk-Perfumes.png',
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-the-myth-edp-100ml-Silk-Perfumes.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-the-myth_1024x1024.webp',
  ]],
  ['MAISON ALHAMBRA LOVE SPARK 80ML', [
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-love-spark-edp-80ml-Silk-Perfumes.png',
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-love-spark-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-love-spark_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-love-spark_1024x1024.jpg',
  ]],
  ['MAISON ALHAMBRA TERRA 50ML', [
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-terra-edp-50ml-Silk-Perfumes.png',
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-terra-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-terra_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-terra_1024x1024.jpg',
  ]],
  ['MAISON ALHAMBRA GLACIER POUR HOMME 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-glacier-pour-homme-edp-100ml-Silk-Perfumes.png',
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-glacier-pour-homme-edp-100ml-Silk-Perfumes.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-glacier-pour-homme_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-glacier-pour-homme_1024x1024.jpg',
  ]],
  ['MAISON ALHAMBRA JEAN LOWE NOIR 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-jean-lowe-noir-edp-100ml-Silk-Perfumes.png',
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-jean-lowe-noir-edp-100ml-Silk-Perfumes.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-jean-lowe-noir_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-jean-lowe-noir_1024x1024.jpg',
  ]],
  ['MAISON ALHAMBRA REYNA 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-reyna-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-reyna_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-reyna_1024x1024.jpg',
  ]],
  ['MAISON ALHAMBRA KISMET FOR MEN 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-kismet-for-men-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-kismet-for-men_1024x1024.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-kismet-for-men_1024x1024.webp',
  ]],
  ['MAISON ALHAMBRA ALIVE NOW 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-alive-now-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-alive-now_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-alive-now_1024x1024.jpg',
  ]],
  ['MAISON ALHAMBRA JORGE DI PROFUMO DEEP BLUE 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-jorge-di-profumo-deep-blue-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-jorge-di-profumo-deep-blue_1024x1024.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-jorge-di-profumo-deep-blue_1024x1024.webp',
  ]],
  // Al Haramain
  ['AL HARAMAIN AMBER OUD AQUA DUBAI 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/al-haramain-amber-oud-aqua-dubai-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/al-haramain-amber-oud-aqua-dubai_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/al-haramain-amber-oud-aqua-dubai_1024x1024.jpg',
  ]],
  // Bharara
  ['BHARARA CHOCOLATE 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/bharara-chocolate-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-chocolate_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-chocolate_1024x1024.jpg',
  ]],
  // Paris Corner
  ['PARIS CORNER KHAIR PISTACHIO 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/paris-corner-khair-pistachio-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/paris-corner-khair-pistachio_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/paris-corner-khair-pistachio_1024x1024.jpg',
  ]],
  // Lattafa
  ['LATTAFA HAYAATI GOLD ELIXIR 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/lattafa-hayaati-gold-elixir-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-hayaati-gold-elixir_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-hayaati-gold-elixir_1024x1024.jpg',
  ]],
  ['LATTAFA KHAMRAH WAHA 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/lattafa-khamrah-waha-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-khamrah-waha_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-khamrah-waha_1024x1024.jpg',
  ]],
  // French Avenue
  ['FRENCH AVENUE SPECTRE GHOST 80ML', [
    'https://silkperfumes.cl/cdn/shop/files/french-avenue-spectre-ghost-edp-80ml-Silk-Perfumes.png',
    'https://silkperfumes.cl/cdn/shop/files/french-avenue-spectre-ghost-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-spectre-ghost_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-spectre-ghost_1024x1024.jpg',
  ]],
  ['FRENCH AVENUE SPECTRE WRAITH 80ML', [
    'https://silkperfumes.cl/cdn/shop/files/french-avenue-spectre-wraith-edp-80ml-Silk-Perfumes.png',
    'https://silkperfumes.cl/cdn/shop/files/french-avenue-spectre-wraith-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-spectre-wraith_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-spectre-wraith_1024x1024.jpg',
  ]],
  // Rayhaan
  ['RAYHAAN PACIFIC ALOHA 100ML', [
    'https://www.perfumenz.co.nz/cdn/shop/files/rayhaan-pacific-aloha_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/rayhaan-pacific-aloha_1024x1024.jpg',
    'https://silkperfumes.cl/cdn/shop/files/rayhaan-pacific-aloha-edp-100ml-Silk-Perfumes.png',
  ]],
  // Al Wataniah
  ['AL WATANIAH SULTAN AL LAIL 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/al-wataniah-sultan-al-lail-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/al-wataniah-sultan-al-lail_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/al-wataniah-sultan-al-lail_1024x1024.jpg',
  ]],
  ['AL WATANIAH ATTAR AL WESAL 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/al-wataniah-attar-al-wesal-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/al-wataniah-attar-al-wesal_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/al-wataniah-attar-al-wesal_1024x1024.jpg',
  ]],
  ['AL WATANIAH SABAH AL WARD 100ML', [
    'https://silkperfumes.cl/cdn/shop/files/al-wataniah-sabah-al-ward-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/al-wataniah-sabah-al-ward_1024x1024.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/al-wataniah-sabah-al-ward_1024x1024.jpg',
  ]],
];

// ── Main ─────────────────────────────────────────────────────────────────────
console.log('Cargando perfumes de Firestore...');
const snap = await db.collection('perfumes').get();
const docs = snap.docs;

const wrongOnes = docs.filter(doc => {
  const d = doc.data();
  const img = (d.imagenes || [])[0] || '';
  return isWrongParfumoImage(img, d.nombre);
});

console.log(`Aún ${wrongOnes.length} con imagen incorrecta.\n`);

let fixed = 0, cleared = 0;

for (const doc of wrongOnes) {
  const d = doc.data();
  const name = d.nombre.toUpperCase();
  process.stdout.write(`${d.nombre} ... `);

  const entry = EXTRA_MANUAL.find(([key]) => name === key.toUpperCase() || name.includes(key.toUpperCase().replace(/ \d+ML$/, '')));
  if (entry) {
    let found = false;
    for (const url of entry[1]) {
      if (await headOk(url)) {
        await doc.ref.update({ imagenes: [url] });
        fixed++;
        console.log(`✅ ${url.split('/').pop()}`);
        found = true;
        break;
      }
    }
    if (!found) {
      // Limpiar imagen incorrecta — mejor sin imagen que con imagen equivocada
      await doc.ref.update({ imagenes: [] });
      cleared++;
      console.log(`🗑 CLEARED (no URL válida encontrada)`);
    }
  } else {
    // No está en EXTRA_MANUAL — limpiar imagen incorrecta
    await doc.ref.update({ imagenes: [] });
    cleared++;
    console.log(`🗑 CLEARED (no en lista manual)`);
  }
}

console.log(`\n✅ Corregidos: ${fixed} | 🗑 Limpiados: ${cleared}`);
process.exit(0);
