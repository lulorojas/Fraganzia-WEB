// scripts/fetch-images.mjs
// Busca la imagen de cada perfume en parfumo.com y actualiza Firestore.
// Uso: node scripts/fetch-images.mjs
// Genera un checkpoint en scripts/images-cache.json para poder resumir si se interrumpe.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, 'images-cache.json');

const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')   // apostrophes & non-alnum → hyphen
    .replace(/^-+|-+$/g, '');
}

// PascalCase_Underscore format used by older Al Haramain URLs (e.g. L_Aventure_Femme)
function toPascalUnder(str) {
  return str
    .toLowerCase()
    .split(/[\s'']+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('_');
}

function brandToParfumo(brand) {
  const map = {
    'Afnan':           'Afnan_Perfumes',
    'Al Haramain':     'Al_Haramain',
    'Al Wataniah':     'Al_Wataniah',
    'Anfar':           'Anfar',
    'Armaf':           'Armaf',
    'Bharara':         'Bharara',
    'Dumont':          'Dumont',
    'Emper':           'Emper',
    'Fragrance World': 'Fragrance-World',
    'French Avenue':   'French-Avenue',
    'Grandeur':        'Grandeur',
    'Khadlaj':         'Khadlaj',
    "L'Affair":        'L-Affair',
    'Lattafa':         'Lattafa',
    'Maison Alhambra': 'Maison-Alhambra',
    'Nautica':         'Nautica',
    'Orientica':       'Orientica',
    'Paris Corner':    'Paris-Corner',
    'Rasasi':          'Rasasi',
    'Rave':            'Rave',
    'Rayhaan':         'Rayhaan',
    'Riiffs':          'Riiffs',
    'Zimaya':          'Zimaya',
  };
  return map[brand] ?? brand.replace(/\s+/g, '-');
}

/** Extrae solo el nombre del producto (sin marca ni volumen). */
function productNameOnly(nombre, marca) {
  let name = nombre.replace(/\d+ML$/, '').trim();
  name = name.replace(/\s+\d+\s*$/, '').trim();
  // Quitar marca del inicio (maneja marcas con apostrofe como L'Affair)
  const marcaPattern = marca.toUpperCase().replace(/['']/g, `[''\\s]*`);
  name = name.replace(new RegExp(`^${marcaPattern}\\s+`, 'i'), '').trim();
  return name;
}

function productSlug(nombre, marca) {
  return toSlug(productNameOnly(nombre, marca));
}

async function fetchParfumoImage(nombre, marca) {
  const brand   = brandToParfumo(marca);
  const nameOnly = productNameOnly(nombre, marca);
  const slug    = toSlug(nameOnly);

  // Intentamos con -1 primero (parfumo usa números para desambiguar)
  const attempts = [`${slug}-1`, slug, `${slug}-2`];

  // Al Haramain: productos más viejos usan formato PascalCase_Underscore
  if (marca === 'Al Haramain') {
    const pascal = toPascalUnder(nameOnly);
    attempts.push(pascal, `${pascal}-1`);

    // Amber Oud: parfumo los tiene como "haramain-amber-oud-{name}"
    if (/^AMBER OUD/i.test(nameOnly)) {
      const rest = toSlug(nameOnly.replace(/^AMBER OUD\s*/i, ''));
      attempts.push(
        `haramain-amber-oud-${rest}-1`,
        `haramain-amber-oud-${rest}`,
        `haramain-amber-oud-${rest}-edition`,
      );
    }
  }

  for (const attempt of attempts) {
    const url = `https://www.parfumo.com/Perfumes/${brand}/${attempt}`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const html = await res.text();

      // Patrón: https://media.parfumo.com/perfumes/{xx}/{hash}-{slug}-{brand}_1200.jpg
      const match = html.match(/https:\/\/media\.parfumo\.com\/perfumes\/[a-f0-9]{2}\/[a-f0-9]+-[^"'\s]+_1200\.jpg/);
      if (match) return match[0];
    } catch {
      // timeout o error de red — continuamos
    }
    await sleep(300);
  }
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const cache = existsSync(CACHE_PATH)
  ? JSON.parse(readFileSync(CACHE_PATH, 'utf8'))
  : {};

const snapshot = await db.collection('perfumes').get();
const docs = snapshot.docs;

console.log(`🔍 ${docs.length} perfumes a procesar (${Object.keys(cache).length} ya en caché)\n`);

let updated = 0;
let failed  = 0;

for (let i = 0; i < docs.length; i++) {
  const doc  = docs[i];
  const data = doc.data();

  // Saltar si ya tiene imagen o ya está en caché
  if (data.imagenes?.length > 0) continue;
  if (cache[doc.id] === 'NOT_FOUND') continue;

  const imgUrl = cache[doc.id] ?? await fetchParfumoImage(data.nombre, data.marca);

  if (imgUrl) {
    cache[doc.id] = imgUrl;
    await doc.ref.update({ imagenes: [imgUrl] });
    updated++;
    console.log(`✅ [${i + 1}/${docs.length}] ${data.nombre}`);
  } else {
    cache[doc.id] = 'NOT_FOUND';
    failed++;
    console.log(`⚠️  [${i + 1}/${docs.length}] sin imagen: ${data.nombre}`);
  }

  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  await sleep(700); // ~85 req/min para no sobrecargar parfumo
}

console.log(`\n🎉 Listo: ${updated} imágenes actualizadas, ${failed} sin imagen.`);
process.exit(0);
