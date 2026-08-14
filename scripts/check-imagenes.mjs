// scripts/check-imagenes.mjs
// Verifica que todos los perfumes tengan imagenes en Firestore
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function checkImagenes() {
  console.log('🔍 Verificando imágenes en Firestore...\n');
  
  const snapshot = await db.collection('perfumes').get();
  const perfumes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const sinImagenes = [];
  const conImagenes = [];
  const imagenVacia = [];
  
  for (const p of perfumes) {
    if (!p.imagenes) {
      sinImagenes.push(p.nombre);
    } else if (p.imagenes.length === 0) {
      imagenVacia.push(p.nombre);
    } else if (p.imagenes[0]) {
      conImagenes.push({ nombre: p.nombre, url: p.imagenes[0] });
    }
  }
  
  console.log(`📊 RESULTADOS:\n`);
  console.log(`✅ Con imágenes: ${conImagenes.length}`);
  console.log(`❌ Sin campo 'imagenes': ${sinImagenes.length}`);
  console.log(`⚠️  Array vacío: ${imagenVacia.length}\n`);
  
  if (sinImagenes.length > 0) {
    console.log('Perfumes SIN campo imagenes:');
    sinImagenes.slice(0, 10).forEach(n => console.log(`  • ${n}`));
    if (sinImagenes.length > 10) console.log(`  ... y ${sinImagenes.length - 10} más`);
    console.log();
  }
  
  if (imagenVacia.length > 0) {
    console.log('Perfumes con array VACÍO:');
    imagenVacia.slice(0, 10).forEach(n => console.log(`  • ${n}`));
    if (imagenVacia.length > 10) console.log(`  ... y ${imagenVacia.length - 10} más`);
    console.log();
  }
  
  // Mostrar 3 ejemplos de URLs
  if (conImagenes.length > 0) {
    console.log('Ejemplos de URLs:');
    conImagenes.slice(0, 3).forEach(p => {
      console.log(`  • ${p.nombre}`);
      console.log(`    ${p.url}`);
    });
  }
  
  process.exit(0);
}

checkImagenes().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
