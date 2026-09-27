// scripts/clear-low-confidence-images.mjs
// Las "correcciones" de fix-wrong-product-images.mjs no tuvieron 100% de
// coincidencia de palabras significativas (ej. dos productos distintos
// terminaron con la MISMA url -> "Hawas Ice" para Hawas Verde y Hawas Diva).
// Mejor no mostrar nada que mostrar una foto de otro producto.
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
  'KHADLAJ ISLAND DREAMS 100ML',
  'ARMAF ODYSSEY SODA POP 100ML',
  'RASASI HAWAS VERDE 100ML',
  'LATTAFA NAJDIA INTENSE 100ML',
  'RASASI HAWAS DIVA 100ML',
  'LATTAFA MUSAMAM BLACK INTENSE 100ML',
  'LATTAFA QAED AL FURSAN UNTAMED 90ML',
];

const snapshot = await db.collection('perfumes').get();
let limpiados = 0;
for (const nombreObjetivo of OBJETIVO) {
  const doc = snapshot.docs.find((d) => (d.data().nombre || '').toUpperCase() === nombreObjetivo);
  if (!doc) { console.log(`⚠️  No encontrado: ${nombreObjetivo}`); continue; }
  await doc.ref.update({ imagenes: [] });
  console.log(`🧹 Limpiado: ${nombreObjetivo}`);
  limpiados++;
}
console.log(`\n🎉 Listo: ${limpiados} limpiados.`);
process.exit(0);
