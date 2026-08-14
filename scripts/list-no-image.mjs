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
const noImg = snap.docs.filter(d => !d.data().imagenes?.length);
console.log(`Total sin imagen: ${noImg.length}`);
noImg.forEach(d => console.log(`  "${d.data().nombre}"`));
process.exit(0);
