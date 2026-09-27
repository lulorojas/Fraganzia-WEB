// scripts/audit-local-images.mjs
// Lista TODOS los perfumes cuya imagen es local (/productos-18-09/...) y
// verifica que el nombre de archivo coincida con el slug del nombre real
// del perfume (para detectar archivos mal asignados, de cualquier tanda).
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function slug(nombre) {
  return nombre.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const snapshot = await db.collection('perfumes').get();
let total = 0;
const mismatches = [];

for (const doc of snapshot.docs) {
  const data = doc.data();
  const url = data.imagenes?.[0];
  if (!url || !url.startsWith('/productos-18-09/')) continue;
  total++;
  const fileName = url.replace('/productos-18-09/', '').replace(/\.(jpg|png)$/, '');
  const expected = slug(data.nombre);
  console.log(`${data.nombre}  ->  ${fileName}${fileName === expected ? '' : '   ⚠️ esperado: ' + expected}`);
  if (fileName !== expected) mismatches.push(data.nombre);
}

console.log(`\nTotal con imagen local: ${total}`);
console.log(`Nombre de archivo no coincide con slug esperado: ${mismatches.length}`);
process.exit(0);
