import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sa = require('./serviceAccount.json');

initializeApp({ credential: cert(sa) });
const db = getFirestore();

// Decodifica strings mal codificados (Latin-1 leído como UTF-8)
// Cada char del string roto representa un BYTE, así que lo re-decodificamos como UTF-8
function fixEncoding(str) {
  try {
    const bytes = Buffer.from(str.split('').map(c => c.charCodeAt(0) & 0xFF));
    const decoded = bytes.toString('utf8');
    return decoded;
  } catch {
    return str;
  }
}

// Valores correctos esperados (para verificar que la decodificación tenga sentido)
const VALID = new Set([
  'Floral','Amaderado','Oriental','Cítrico','Acuático','Aromático',
  'Gourmand','Chipre','Fougère','Especiado','Aldehídico','Verde',
]);

const snap = await db.collection('perfumes').get();
let fixed = 0, skipped = 0;

const BATCH_SIZE = 400;
let batch = db.batch();
let batchCount = 0;

for (const docSnap of snap.docs) {
  const data = docSnap.data();
  const original = data.familiaOlfativa;
  if (!original) { skipped++; continue; }

  // Si ya es válido, no tocar
  if (VALID.has(original)) { skipped++; continue; }

  // Intentar decodificar
  const correcto = fixEncoding(original);

  if (correcto !== original && VALID.has(correcto)) {
    batch.update(docSnap.ref, { familiaOlfativa: correcto });
    fixed++;
    batchCount++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  } else {
    skipped++;
  }
}

if (batchCount > 0) await batch.commit();

console.log(`✅ Corregidos: ${fixed} | Sin cambios: ${skipped}`);
process.exit(0);
