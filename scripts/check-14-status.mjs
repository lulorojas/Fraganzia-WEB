// scripts/check-14-status.mjs
// Verifica el estado actual de los 14 perfumes que habíamos dejado sin foto
// (por tener foto de OTRO producto de la misma marca). Si fetch-images.mjs
// corrió después, puede haberles vuelto a poner una foto (posiblemente mala,
// porque ese script no valida nada).
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

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

const snapshot = await db.collection('perfumes').get();
for (const nombreObjetivo of OBJETIVO) {
  const doc = snapshot.docs.find((d) => (d.data().nombre || '').toUpperCase() === nombreObjetivo);
  if (!doc) { console.log(`⚠️  No encontrado: ${nombreObjetivo}`); continue; }
  const url = doc.data().imagenes?.[0];
  console.log(`${nombreObjetivo}: ${url ? url : '(sin foto)'}`);
}
process.exit(0);
