// scripts/audit-wrong-images-2.mjs
// Auditoría de solo-lectura: detecta perfumes cuya imagen de parfumo.com
// no coincide con su propia marca (posible foto del original que dupean),
// y además reporta cuántos perfumes quedaron sin imagen.
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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

function expectedBrandSlug(marca) {
  return toSlug(brandToParfumo(marca).replace(/_/g, '-'));
}

const snapshot = await db.collection('perfumes').get();

const sinImagen = [];
const marcaEquivocada = [];
let totalConParfumo = 0;

for (const doc of snapshot.docs) {
  const data = doc.data();
  const url = data.imagenes?.[0];
  if (!url) {
    sinImagen.push({ id: doc.id, nombre: data.nombre, marca: data.marca });
    continue;
  }
  if (!url.startsWith('https://media.parfumo.com/')) continue;
  totalConParfumo++;
  const expected = expectedBrandSlug(data.marca);
  if (!url.toLowerCase().includes(`-${expected}_1200.jpg`)) {
    marcaEquivocada.push({ id: doc.id, nombre: data.nombre, marca: data.marca, url, expected });
  }
}

console.log(`Total perfumes: ${snapshot.docs.length}`);
console.log(`Con imagen de parfumo.com: ${totalConParfumo}`);
console.log(`\n=== SIN IMAGEN (${sinImagen.length}) ===`);
sinImagen.forEach((s) => console.log(`  - [${s.marca}] ${s.nombre}`));

console.log(`\n=== MARCA EQUIVOCADA EN URL (${marcaEquivocada.length}) ===`);
marcaEquivocada.forEach((s) => console.log(`  - [${s.marca}] ${s.nombre}\n      url: ${s.url}\n      esperado: -${s.expected}_1200.jpg`));

process.exit(0);
