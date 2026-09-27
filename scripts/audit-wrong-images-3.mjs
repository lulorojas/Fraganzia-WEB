// scripts/audit-wrong-images-3.mjs
// Auditoría de solo-lectura: para perfumes con imagen de parfumo.com,
// verifica que el "slug" del PRODUCTO (no solo la marca) dentro de la URL
// tenga relación real con el nombre del perfume. Esto detecta el caso de
// "misma marca pero producto equivocado" que el audit anterior no cubre.
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

// Extrae las palabras "significativas" (>=3 letras) del slug del producto.
function significantWords(slug) {
  return slug.split('-').filter((w) => w.length >= 3);
}

const snapshot = await db.collection('perfumes').get();
const sospechosos = [];

for (const doc of snapshot.docs) {
  const data = doc.data();
  const url = data.imagenes?.[0];
  if (!url || !url.startsWith('https://media.parfumo.com/')) continue;

  const nameOnly = productNameOnly(data.nombre, data.marca);
  const expectedSlug = toSlug(nameOnly);
  const words = significantWords(expectedSlug);
  if (words.length === 0) continue;

  // Sacamos la parte "slug" de la URL: todo lo que está entre el hash y "_1200.jpg"
  const fileName = url.split('/').pop(); // {hash}-{slug...}_1200.jpg
  const urlSlugPart = fileName.replace(/_1200\.jpg$/, '').toLowerCase();

  const matchedWords = words.filter((w) => urlSlugPart.includes(w));
  const ratio = matchedWords.length / words.length;

  if (ratio < 0.5) {
    sospechosos.push({
      id: doc.id,
      nombre: data.nombre,
      marca: data.marca,
      url,
      esperado: words.join(','),
      coincidieron: matchedWords.join(',') || '(ninguna)',
    });
  }
}

console.log(`Perfumes con imagen parfumo.com cuyo PRODUCTO no coincide bien con el nombre (${sospechosos.length}):\n`);
sospechosos.forEach((s) => {
  console.log(`  - [${s.marca}] ${s.nombre}`);
  console.log(`      url: ${s.url}`);
  console.log(`      palabras esperadas: ${s.esperado} | coincidieron: ${s.coincidieron}\n`);
});

process.exit(0);
