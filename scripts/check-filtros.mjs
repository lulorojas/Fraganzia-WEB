import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sa = require('./serviceAccount.json');

initializeApp({ credential: cert(sa) });
const db = getFirestore();

const snap = await db.collection('perfumes').where('activo', '==', true).limit(200).get();
const docs = snap.docs.map(d => d.data());

// Valores únicos de genero
const generos = [...new Set(docs.map(d => d.genero).filter(Boolean))].sort();
console.log('GENEROS en Firestore:', generos);

// Valores únicos de familiaOlfativa
const familias = [...new Set(docs.map(d => d.familiaOlfativa).filter(Boolean))].sort();
console.log('FAMILIAS en Firestore:', familias);

process.exit(0);
