// scripts/fix-wrong-product-images.mjs
// Corrige perfumes cuya imagen de parfumo.com es de OTRO PRODUCTO de la misma
// marca (ej: 5 perfumes Lattafa distintos mostrando la foto de "Liam").
// Estrategia: reintentar el fetch validando que la URL final contenga tanto
// el slug de marca como al menos una palabra significativa del slug de
// producto. Si no se logra un match seguro, se limpia (imagenes: []).
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

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function toPascalUnder(str) {
  return str.toLowerCase().split(/[\s'']+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('_');
}

const BRAND_MAP = {
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

function brandToParfumo(brand) { return BRAND_MAP[brand] ?? brand.replace(/\s+/g, '-'); }
function expectedBrandSlug(marca) { return toSlug(brandToParfumo(marca).replace(/_/g, '-')); }

function productNameOnly(nombre, marca) {
  let name = nombre.replace(/\d+ML$/, '').trim();
  name = name.replace(/\s+\d+\s*$/, '').trim();
  const marcaPattern = marca.toUpperCase().replace(/['']/g, `[''\\s]*`);
  name = name.replace(new RegExp(`^${marcaPattern}\\s+`, 'i'), '').trim();
  return name;
}

function significantWords(slug) {
  return slug.split('-').filter((w) => w.length >= 3);
}

// Lista confirmada por auditoría: marca correcta, PRODUCTO equivocado (0% de
// coincidencia de palabras significativas entre nombre y slug de la URL).
const OBJETIVO = [
  'LATTAFA ATLAS CANYON 55ML',
  'KHADLAJ ISLAND DREAMS 100ML',
  'LATTAFA ATLAS GLACIAL VALLEY 55ML',
  'LATTAFA AL NASHAMA CAPRICE 100ML',
  'ARMAF ODYSSEY SODA POP 100ML',
  'RASASI HAWAS VERDE 100ML',
  'RIIFFS FREEZE 100ML',
  'LATTAFA NAJDIA INTENSE 100ML',
  'RASASI HAWAS DIVA 100ML',
  'ARMAF DUBAI NIGHTS MIDNIGHT 100ML',
  'RAYHAAN PACIFIC AURA 100ML',
  'LATTAFA MUSAMAM BLACK INTENSE 100ML',
  'LATTAFA QAED AL FURSAN UNTAMED 90ML',
  'RAYHAAN AQUATICA 100ML',
];

async function fetchParfumoImageStrictProduct(nombre, marca) {
  const brand = brandToParfumo(marca);
  const nameOnly = productNameOnly(nombre, marca);
  const slug = toSlug(nameOnly);
  const expectedBrand = expectedBrandSlug(marca);
  const words = significantWords(slug);

  const attempts = [`${slug}-1`, slug, `${slug}-2`];
  if (marca === 'Al Haramain') {
    const pascal = toPascalUnder(nameOnly);
    attempts.push(pascal, `${pascal}-1`);
  }

  for (const attempt of attempts) {
    const url = `https://www.parfumo.com/Perfumes/${brand}/${attempt}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'text/html' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      const matches = [...html.matchAll(/https:\/\/media\.parfumo\.com\/perfumes\/[a-f0-9]{2}\/[a-f0-9]+-[^"'\s]+_1200\.jpg/g)];
      const good = matches.find((m) => {
        const fileName = m[0].split('/').pop().replace(/_1200\.jpg$/, '').toLowerCase();
        const brandOk = fileName.includes(`-${expectedBrand}`);
        const productOk = words.length === 0 || words.some((w) => fileName.includes(w));
        return brandOk && productOk;
      });
      if (good) return good[0];
    } catch {
      // timeout / error de red
    }
    await sleep(300);
  }
  return null;
}

const cache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, 'utf8')) : {};
const snapshot = await db.collection('perfumes').get();

let corregidos = 0;
let limpiados = 0;

for (const nombreObjetivo of OBJETIVO) {
  const doc = snapshot.docs.find((d) => (d.data().nombre || '').toUpperCase() === nombreObjetivo);
  if (!doc) {
    console.log(`⚠️  No encontrado en Firestore: ${nombreObjetivo}`);
    continue;
  }
  const data = doc.data();
  const nuevaUrl = await fetchParfumoImageStrictProduct(data.nombre, data.marca);

  if (nuevaUrl) {
    await doc.ref.update({ imagenes: [nuevaUrl] });
    cache[doc.id] = nuevaUrl;
    corregidos++;
    console.log(`✅ Corregido: ${data.nombre} -> ${nuevaUrl}`);
  } else {
    await doc.ref.update({ imagenes: [] });
    cache[doc.id] = 'NOT_FOUND';
    limpiados++;
    console.log(`🧹 Sin foto propia disponible en parfumo, limpiado: ${data.nombre}`);
  }
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  await sleep(700);
}

console.log(`\n🎉 Listo: ${corregidos} corregidos con foto propia, ${limpiados} limpiados (sin foto por ahora).`);
process.exit(0);
