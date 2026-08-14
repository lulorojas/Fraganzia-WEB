// fix-remaining.mjs — tercera pasada para los ~28 productos sin imagen
// Prueba .jpg, silkperfumes con 100ml para productos 80ml/105ml, y más variaciones.

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

async function probe(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const r = await fetch(url, {
        method,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(6000),
      });
      if (r.ok) return true;
    } catch {}
  }
  return false;
}

function candidates(nombre, marca, vol) {
  const prodName = nombre
    .replace(new RegExp('^' + marca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+', 'i'), '')
    .replace(/\s+\d+ML$/i, '').trim();
  const fullSlug = toSlug(marca + ' ' + prodName);
  const urls = [];
  // perfumenz: png/webp/jpg + variante sin marca
  for (const ext of ['png', 'webp', 'jpg']) {
    urls.push(`https://www.perfumenz.co.nz/cdn/shop/files/${fullSlug}_1024x1024.${ext}`);
  }
  // silkperfumes: con el volumen real y con 100ml (para productos de 80ml/105ml/55ml)
  const volumes = [...new Set([vol, 100, 80, 105, 55])];
  for (const v of volumes) {
    for (const ext of ['png', 'webp', 'jpg']) {
      urls.push(`https://silkperfumes.cl/cdn/shop/files/${fullSlug}-edp-${v}ml-Silk-Perfumes.${ext}`);
    }
  }
  return urls;
}

// Mapa manual de última instancia (productos muy específicos)
const LAST_RESORT = {
  'ARMAF CLUB DE NUIT INTENSE 105ML': [
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-intense-man-edp-100ml-Silk-Perfumes.png',
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-intense-man-edp-105ml-Silk-Perfumes.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-intense-man_1024x1024.jpg',
  ],
  'ARMAF CLUB DE NUIT ICONIC 105ML': [
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-iconic-edp-100ml-Silk-Perfumes.png',
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-iconic-edp-105ml-Silk-Perfumes.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-iconic_1024x1024.jpg',
  ],
  'ARMAF CLUB DE NUIT WOMAN 105ML': [
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-woman-edp-100ml-Silk-Perfumes.png',
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-woman-edp-105ml-Silk-Perfumes.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-woman_1024x1024.jpg',
  ],
  'ARMAF CLUB DE NUIT IMPERIALE 105ML': [
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-imperiale-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-imperiale_1024x1024.jpg',
  ],
  'ARMAF CLUB DE NUIT PRECIEUX I 55ML': [
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-precieux-i-edp-55ml-Silk-Perfumes.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-precieux-i_1024x1024.jpg',
  ],
  'ARMAF CLUB DE NUIT PRECIEUX IV 55ML': [
    'https://silkperfumes.cl/cdn/shop/files/armaf-club-de-nuit-precieux-iv-edp-55ml-Silk-Perfumes.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-precieux-iv_1024x1024.jpg',
  ],
  'ARMAF ODYSSEY DUBAI CHOCOLAT 100ML': [
    'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-dubai-chocolat-edp-100ml-Silk-Perfumes.webp',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-odyssey-dubai-chocolat_1024x1024.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-odyssey-dubai-chocolat_1024x1024.jpg',
  ],
  'BHARARA CHOCOLATE 100ML': [
    'https://silkperfumes.cl/cdn/shop/files/bharara-chocolate-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-chocolate_1024x1024.jpg',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-chocolate_1024x1024.webp',
  ],
  'AL HARAMAIN AMBER OUD AQUA DUBAI 100ML': [
    'https://silkperfumes.cl/cdn/shop/files/al-haramain-amber-oud-aqua-dubai-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/al-haramain-amber-oud-aqua-dubai_1024x1024.jpg',
  ],
  'PARIS CORNER KHAIR PISTACHIO 100ML': [
    'https://silkperfumes.cl/cdn/shop/files/paris-corner-khair-pistachio-edp-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/paris-corner-khair-pistachio_1024x1024.jpg',
  ],
  'FRENCH AVENUE GENESIS GEMINI 90ML': [
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-gemini_1024x1024.jpg',
    'https://silkperfumes.cl/cdn/shop/files/french-avenue-genesis-gemini-edp-90ml-Silk-Perfumes.png',
    'https://silkperfumes.cl/cdn/shop/files/french-avenue-genesis-gemini-edp-100ml-Silk-Perfumes.png',
  ],
  'FRENCH AVENUE SPECTRE GHOST 80ML': [
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-spectre-ghost_1024x1024.jpg',
    'https://silkperfumes.cl/cdn/shop/files/french-avenue-spectre-ghost-edp-100ml-Silk-Perfumes.png',
  ],
  'FRENCH AVENUE SPECTRE WRAITH 80ML': [
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-spectre-wraith_1024x1024.jpg',
    'https://silkperfumes.cl/cdn/shop/files/french-avenue-spectre-wraith-edp-100ml-Silk-Perfumes.png',
  ],
  'LATTAFA KHAMRAH WAHA 100ML': [
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-khamrah-waha_1024x1024.jpg',
    'https://silkperfumes.cl/cdn/shop/files/lattafa-khamrah-waha-edp-100ml-Silk-Perfumes.png',
  ],
  'MAISON ALHAMBRA ROSE SEDUCTION VIP FEMME 100ML': [
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-rose-seduction-vip-femme_1024x1024.jpg',
    'https://silkperfumes.cl/cdn/shop/files/maison-alhambra-rose-seduction-vip-femme-edp-100ml-Silk-Perfumes.png',
  ],
};

// ── Main ─────────────────────────────────────────────────────────────────────
const snap = await db.collection('perfumes').get();
const noImg = snap.docs.filter(d => !(d.data().imagenes || []).length);
console.log(`${noImg.length} productos sin imagen.\n`);

let fixed = 0;
for (const doc of noImg) {
  const d = doc.data();
  process.stdout.write(`${d.nombre} ... `);

  const urlsToTry = [
    ...(LAST_RESORT[d.nombre] || []),
    ...candidates(d.nombre, d.marca, d.volumenML),
  ];

  let found = false;
  for (const url of urlsToTry) {
    if (await probe(url)) {
      await doc.ref.update({ imagenes: [url] });
      fixed++;
      console.log(`✅ ${url.split('/').pop().substring(0, 60)}`);
      found = true;
      break;
    }
  }
  if (!found) console.log(`❌ sin imagen`);
}

console.log(`\nFijados: ${fixed} | Sin imagen: ${noImg.length - fixed}`);
process.exit(0);
