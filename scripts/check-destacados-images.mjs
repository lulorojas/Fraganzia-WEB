// scripts/check-destacados-images.mjs
// Los "destacados" son los que se muestran en el Home (HorizontalSlider),
// la carga inicial que audita Lighthouse. Revisa si tienen imagen local u externa.
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const snap = await db.collection('perfumes').where('destacado', '==', true).get();
console.log(`Destacados: ${snap.size}`);
snap.forEach(doc => {
  const d = doc.data();
  const img = d.imagenes?.[0] || '(sin foto)';
  const tipo = img.startsWith('/productos-18-09/') ? 'LOCAL' : 'EXTERNA';
  console.log(`[${tipo}] ${d.marca} ${d.nombre} -> ${img}`);
});
