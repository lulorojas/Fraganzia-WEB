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
let found = null;
snap.forEach(doc => {
  const n = (doc.data().nombre || '').toUpperCase();
  if (n.includes('AMERAAT') || n.includes('AMEERAT') || n.includes('ADAAF') || n.includes('ASDAAF')) {
    console.log(doc.id, '|', doc.data().nombre, '| imgs:', JSON.stringify(doc.data().imagenes));
    if (n.includes('ROSE') || n.includes('PRIVE')) found = { id: doc.id, nombre: doc.data().nombre };
  }
});
if (found) {
  const url = 'https://dxbperfume.co.uk/cdn/shop/files/ameeratalarab1_62ef03a2-7774-4226-b137-5b4f2075f751.jpg?v=1725026976&width=1000';
  await db.collection('perfumes').doc(found.id).update({ imagenes: [url] });
  console.log('\nUPDATED:', found.nombre, '->', url);
} else {
  console.log('\nNo encontrado. Buscando todos con ROSE en el nombre:');
  snap.forEach(doc => {
    const n = (doc.data().nombre || '').toUpperCase();
    if (n.includes('PRIVATE ROSE')) console.log(' -', doc.data().nombre);
  });
}
process.exit(0);
