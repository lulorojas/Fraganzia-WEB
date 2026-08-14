import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const snap = await db.collection('perfumes').get();
let conPrecio = 0, sinPrecio = 0;
snap.forEach(doc => {
  const d = doc.data();
  if (d.precioTransferencia) { conPrecio++; }
  else { sinPrecio++; }
});

console.log(`Con precioTransferencia en Firestore: ${conPrecio}`);
console.log(`Sin precioTransferencia: ${sinPrecio}`);

// Mostrar una muestra
let count = 0;
snap.forEach(doc => {
  if (count++ > 4) return;
  const d = doc.data();
  if (d.precioTransferencia) {
    console.log(`  ${d.nombre} | USD $${d.precioUSD} → Transf $${d.precioTransferencia?.toLocaleString('es-AR')} | Ef $${d.precioEfectivo?.toLocaleString('es-AR')} | Dólar ref: $${d.dolarReferencia}`);
  }
});
process.exit(0);