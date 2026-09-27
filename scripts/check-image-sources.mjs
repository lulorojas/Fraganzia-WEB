// scripts/check-image-sources.mjs
// Audita cuántos perfumes tienen imagen local (/productos-18-09/) vs externa (http/https).
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const snap = await db.collection('perfumes').get();
let local = 0, externa = 0, vacio = 0;
const externos = [];

snap.forEach(doc => {
  const d = doc.data();
  const img = d.imagenes?.[0];
  if (!img) { vacio++; return; }
  if (img.startsWith('/productos-18-09/')) { local++; }
  else { externa++; externos.push(`${d.marca} ${d.nombre} -> ${img}`); }
});

console.log(`Total: ${snap.size}`);
console.log(`Local (/productos-18-09/): ${local}`);
console.log(`Externa (http/otro): ${externa}`);
console.log(`Sin foto: ${vacio}`);
if (externos.length) {
  console.log('\n--- Externas ---');
  externos.forEach(l => console.log(l));
}
