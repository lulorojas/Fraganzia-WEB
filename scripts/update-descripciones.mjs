// scripts/update-descripciones.mjs
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const descripciones = JSON.parse(readFileSync(join(__dirname, 'descripciones.json'), 'utf8'));
console.log(`📝 Descripciones cargadas: ${Object.keys(descripciones).length}\n`);

const snap = await db.collection('perfumes').get();
const BATCH_SIZE = 400;
let batch = db.batch();
let count = 0;
let actualizados = 0;
let sinDescripcion = [];

for (const doc of snap.docs) {
  const p = doc.data();
  const key = p.nombre?.trim().toUpperCase();
  if (descripciones[key]) {
    batch.update(doc.ref, { descripcion: descripciones[key] });
    actualizados++;
    count++;
    if (count >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  } else {
    sinDescripcion.push(p.nombre);
  }
}

if (count > 0) await batch.commit();

console.log(`✅ Descripciones actualizadas: ${actualizados} perfumes`);
console.log(`❓ Sin descripción nueva (${sinDescripcion.length}): conservan la actual\n`);
if (sinDescripcion.length > 0) {
  console.log('Sin descripción:');
  sinDescripcion.forEach(n => console.log(' -', n));
}
process.exit(0);
