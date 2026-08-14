// scripts/clear-uncertain-notes.mjs
// Borra las notas de marcas donde no tenemos certeza de que sean correctas

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

// Marcas donde NO tenemos certeza de las notas (niche, mal documentadas)
const MARCAS_INCIERTAS = [
  'French Avenue',
  'Grandeur',
  'Rayhaan',
  'Paris Corner',
  'Zimaya',
  'Emper',
  'Dumont',
  'L\'Affair',
  'Anfar',
  'Rave',
  'Riiffs',
  'Fragrance World',
];

const snap = await db.collection('perfumes').get();
const BATCH_SIZE = 400;
let batch = db.batch();
let count = 0;
let batchCount = 0;
let cleared = 0;
const clearedList = [];

for (const doc of snap.docs) {
  const p = doc.data();
  const marcaIncierta = MARCAS_INCIERTAS.some(m => 
    p.marca?.toLowerCase() === m.toLowerCase()
  );

  if (marcaIncierta) {
    batch.update(doc.ref, {
      notasSalida: [],
      notasCorazon: [],
      notasFondo: [],
    });
    clearedList.push(`${p.marca} - ${p.nombre}`);
    cleared++;
    count++;

    if (count >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      count = 0;
      batchCount++;
    }
  }
}

if (count > 0) {
  await batch.commit();
}

console.log(`\n✅ Notas borradas en ${cleared} perfumes de marcas inciertas:`);
MARCAS_INCIERTAS.forEach(m => {
  const n = clearedList.filter(x => x.startsWith(m)).length;
  if (n > 0) console.log(`   ${m}: ${n} perfumes`);
});
console.log('\nPerfumes con notas conservadas: Lattafa, Armaf, Al Haramain, Rasasi, Afnan, Maison Alhambra, Al Wataniah, Bharara, Orientica, Nautica, Khadlaj');
process.exit(0);
