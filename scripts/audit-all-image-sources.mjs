// scripts/audit-all-image-sources.mjs
// Auditoría genérica de solo-lectura para TODAS las fuentes de imagen
// (no solo parfumo.com): compara las palabras significativas del nombre del
// producto contra el texto completo de la URL de la imagen. Si ninguna
// palabra del producto aparece en la URL, es sospechoso de ser la foto de
// otro producto/otra marca.
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

function productNameOnly(nombre, marca) {
  let name = nombre.replace(/\d+ML$/, '').trim();
  name = name.replace(/\s+\d+\s*$/, '').trim();
  const marcaPattern = marca.toUpperCase().replace(/['']/g, `[''\\s]*`);
  name = name.replace(new RegExp(`^${marcaPattern}\\s+`, 'i'), '').trim();
  return name;
}

// Palabras genéricas que no sirven para diferenciar (aparecen en muchos
// nombres de producto y no son un buen indicador de identidad única).
const STOPWORDS = new Set([
  'for', 'pour', 'eau', 'de', 'parfum', 'edp', 'edt', 'intense', 'extreme',
  'homme', 'femme', 'men', 'women', 'gold', 'silver', 'black', 'white',
  'the', 'and', 'by', 'vip', 'pure', 'luxe', 'oud', 'musk',
]);

function significantWords(nameOnly) {
  return toSlug(nameOnly)
    .split('-')
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

const snapshot = await db.collection('perfumes').get();
const sospechosos = [];
let revisados = 0;

for (const doc of snapshot.docs) {
  const data = doc.data();
  const url = data.imagenes?.[0];
  if (!url || !url.startsWith('http')) continue; // saltar locales (ya confiables, PDF propio)
  if (url.startsWith('https://media.parfumo.com/')) continue; // ya auditado aparte

  const nameOnly = productNameOnly(data.nombre, data.marca);
  const words = significantWords(nameOnly);
  if (words.length === 0) continue;

  revisados++;
  const urlLower = decodeURIComponent(url.toLowerCase());
  const matched = words.filter((w) => urlLower.includes(w));

  if (matched.length === 0) {
    sospechosos.push({ nombre: data.nombre, marca: data.marca, url, esperado: words.join(',') });
  }
}

console.log(`Revisados (con imagen externa, no parfumo): ${revisados}`);
console.log(`\nSospechosos - CERO palabras del producto en la URL (${sospechosos.length}):\n`);
sospechosos.forEach((s) => {
  console.log(`  - [${s.marca}] ${s.nombre}`);
  console.log(`      url: ${s.url}`);
  console.log(`      esperaba alguna de: ${s.esperado}\n`);
});
process.exit(0);
