// scripts/verify-batch2-images.mjs
// Verifica que las 21 imágenes recién aplicadas en Firestore apunten
// exactamente a los archivos esperados en public/productos-18-09/.
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const NOMBRES = [
  'FRAGRANCE WORLD HARMONY CODE ABSOLUTE 100ML',
  'FRAGRANCE WORLD JUST ASWAD 100ML',
  'FRAGRANCE WORLD MIDORI 100ML',
  'FRENCH AVENUE PINNACE ORYN 100ML',
  'MAISON ALHAMBRA B.A.D HOMME 100ML',
  'MAISON ALHAMBRA DARK DOOR INTENSE 100ML',
  'MAISON ALHAMBRA DARK DOOR SPORT 100ML',
  'MAISON ALHAMBRA FORTNIGHT 100ML',
  'MAISON ALHAMBRA GALACTIC MEN ELIXIR 100ML',
  'MAISON ALHAMBRA GALACTIC MEN INTENSE 100ML',
  'MAISON ALHAMBRA KINGSMAN 100ML',
  'MAISON ALHAMBRA YOUR TOUCH AMBER 100ML',
  'MAISON ALHAMBRA YOUR TOUCH FOR MEN 100ML',
  'MAISON ALHAMBRA YOUR TOUCH INTENSE 100ML',
  'MAISON ALHAMBRA YOUR TOUCH LEATHER 100ML',
  'FRENCH AVENUE TROPICAL KISS 80ML',
  'MAISON ALHAMBRA B.A.D FEMME 100ML',
  'PARIS CORNER KHAIR FELICITY 100ML',
  'PARIS CORNER KHAIR FUSION 100ML',
  'PARIS CORNER TASKEEN 100ML',
  'PARIS CORNER TASKEEN LACTEA DIVINA 100ML',
];

const snapshot = await db.collection('perfumes').get();
for (const n of NOMBRES) {
  const doc = snapshot.docs.find((d) => (d.data().nombre || '').toUpperCase() === n);
  if (!doc) { console.log(`⚠️  NO ENCONTRADO: ${n}`); continue; }
  console.log(`${n} -> ${doc.data().imagenes?.[0] ?? '(sin imagen)'}`);
}
process.exit(0);
