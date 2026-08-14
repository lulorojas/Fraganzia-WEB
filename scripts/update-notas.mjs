// scripts/update-notas.mjs
// Actualiza notas olfativas en Firestore con datos reales de Fragrantica

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const notasCorrectas = JSON.parse(readFileSync(join(__dirname, 'notas-fragrantica.json'), 'utf8'));

console.log(`📚 Notas correctas cargadas: ${Object.keys(notasCorrectas).length} perfumes\n`);

const snapshot = await db.collection('perfumes').get();
const perfumes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
console.log(`🗄️  Perfumes en Firestore: ${perfumes.length}\n`);

let actualizados = 0;
let noEncontrados = [];
const batch = db.batch();

for (const perfume of perfumes) {
  // Extraer nombre normalizado (solo el nombre sin la marca al inicio y sin ML al final)
  const nombreDoc = perfume.nombre?.trim().toUpperCase();
  
  if (notasCorrectas[nombreDoc]) {
    const notas = notasCorrectas[nombreDoc];
    const ref = db.collection('perfumes').doc(perfume.id);
    batch.update(ref, {
      notasSalida: notas.notasSalida,
      notasCorazon: notas.notasCorazon,
      notasFondo: notas.notasFondo,
    });
    actualizados++;
  } else {
    noEncontrados.push(nombreDoc);
  }
}

console.log(`✅ Para actualizar: ${actualizados} perfumes`);
console.log(`❓ Sin corrección (${noEncontrados.length}): se mantienen las notas actuales\n`);

if (actualizados > 0) {
  await batch.commit();
  console.log(`🚀 Actualización completada en Firestore!\n`);
}

if (noEncontrados.length > 0) {
  console.log('Perfumes sin corrección:');
  noEncontrados.forEach(n => console.log(' -', n));
}

process.exit(0);
