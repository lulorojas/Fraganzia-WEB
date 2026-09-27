// scripts/fix-wrong-dupe-images.mjs
// Detecta perfumes a los que el scraper de parfumo.com les puso la foto del
// producto ORIGINAL (de lujo) que dupean, en lugar de la propia. Esto pasa
// cuando la URL exacta del slug no existe en parfumo y el regex agarra la
// primera imagen de la página de "sugerencias" (que suele ser el original).
//
// Estrategia: la URL de parfumo siempre termina en "-{marca-slug}_1200.jpg".
// Si la marca-slug de la URL no coincide con la marca real del perfume en
// Firestore, es una imagen equivocada -> se limpia (queda sin foto) y se
// reintenta el fetch con validación estricta de marca.
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

function brandToParfumo(brand) {
  return BRAND_MAP[brand] ?? brand.replace(/\s+/g, '-');
}

// slug de marca tal cual aparece en el nombre de archivo de la imagen
function expectedBrandSlug(marca) {
  return toSlug(brandToParfumo(marca).replace(/_/g, '-'));
}

function productNameOnly(nombre, marca) {
  let name = nombre.replace(/\d+ML$/, '').trim();
  name = name.replace(/\s+\d+\s*$/, '').trim();
  const marcaPattern = marca.toUpperCase().replace(/['']/g, `[''\\s]*`);
  name = name.replace(new RegExp(`^${marcaPattern}\\s+`, 'i'), '').trim();
  return name;
}

async function fetchParfumoImageStrict(nombre, marca) {
  const brand = brandToParfumo(marca);
  const nameOnly = productNameOnly(nombre, marca);
  const slug = toSlug(nameOnly);
  const expected = expectedBrandSlug(marca);

  const attempts = [`${slug}-1`, slug, `${slug}-2`];
  if (marca === 'Al Haramain') {
    const pascal = toPascalUnder(nameOnly);
    attempts.push(pascal, `${pascal}-1`);
    if (/^AMBER OUD/i.test(nameOnly)) {
      const rest = toSlug(nameOnly.replace(/^AMBER OUD\s*/i, ''));
      attempts.push(`haramain-amber-oud-${rest}-1`, `haramain-amber-oud-${rest}`, `haramain-amber-oud-${rest}-edition`);
    }
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
      // Solo aceptamos una imagen cuya marca-slug coincida con la marca real
      const good = matches.find((m) => m[0].toLowerCase().includes(`-${expected}_1200.jpg`));
      if (good) return good[0];
    } catch {
      // timeout / error de red
    }
    await sleep(300);
  }
  return null;
}

// ── 1. Auditar caché e imágenes actuales en Firestore ──
const cache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, 'utf8')) : {};
const snapshot = await db.collection('perfumes').get();

const sospechosos = [];
for (const doc of snapshot.docs) {
  const data = doc.data();
  const url = data.imagenes?.[0];
  if (!url || !url.startsWith('https://media.parfumo.com/')) continue;
  const expected = expectedBrandSlug(data.marca);
  if (!url.toLowerCase().includes(`-${expected}_1200.jpg`)) {
    sospechosos.push({ id: doc.id, nombre: data.nombre, marca: data.marca, urlActual: url, expected });
  }
}

console.log(`🔎 ${sospechosos.length} perfumes con foto de OTRA marca (probable foto del original que dupean):\n`);
sospechosos.forEach((s) => console.log(`  - [${s.marca}] ${s.nombre}\n      actual: ${s.urlActual}`));

// ── 2. Corregir cada uno: reintentar con validación estricta, si no, limpiar ──
let corregidos = 0;
let limpiados = 0;

for (const s of sospechosos) {
  const doc = snapshot.docs.find((d) => d.id === s.id);
  const data = doc.data();
  const nuevaUrl = await fetchParfumoImageStrict(data.nombre, data.marca);

  if (nuevaUrl) {
    await doc.ref.update({ imagenes: [nuevaUrl] });
    cache[doc.id] = nuevaUrl;
    corregidos++;
    console.log(`✅ Corregido: ${data.nombre} -> ${nuevaUrl}`);
  } else {
    await doc.ref.update({ imagenes: [] });
    cache[doc.id] = 'NOT_FOUND';
    limpiados++;
    console.log(`🧹 Sin foto propia disponible, limpiado: ${data.nombre}`);
  }
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  await sleep(700);
}

console.log(`\n🎉 Listo: ${corregidos} corregidos con foto propia, ${limpiados} limpiados (sin foto por ahora).`);
process.exit(0);
