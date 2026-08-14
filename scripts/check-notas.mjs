import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const snap = await db.collection('perfumes').orderBy('marca').get();
const result = snap.docs.map(d => {
  const p = d.data();
  return {
    id: d.id,
    marca: p.marca,
    nombre: p.nombre,
    descripcion: p.descripcion || '',
    notasSalida: p.notasSalida || [],
    notasCorazon: p.notasCorazon || [],
    notasFondo: p.notasFondo || [],
  };
});

writeFileSync(join(__dirname, 'perfumes-review.json'), JSON.stringify(result, null, 2));
console.log(`Exportados ${result.length} perfumes a scripts/perfumes-review.json`);
process.exit(0);
