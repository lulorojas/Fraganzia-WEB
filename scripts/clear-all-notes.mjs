// scripts/clear-all-notes.mjs
// Borra notasSalida, notasCorazon y notasFondo de TODOS los perfumes
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const snap = await db.collection('perfumes').get();
const BATCH_SIZE = 400;
let batch = db.batch();
let count = 0;
let total = 0;

for (const doc of snap.docs) {
  batch.update(doc.ref, { notasSalida: [], notasCorazon: [], notasFondo: [] });
  count++;
  total++;
  if (count >= BATCH_SIZE) {
    await batch.commit();
    batch = db.batch();
    count = 0;
  }
}
if (count > 0) await batch.commit();

console.log(`✅ Notas borradas en ${total} perfumes.`);
process.exit(0);
