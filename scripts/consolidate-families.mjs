// scripts/consolidate-families.mjs
// Consolidar familias poco usadas según estándares de Fragrantica
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Reglas de consolidación
const CONSOLIDATION_RULES = {
  'Verde': {
    newFamilia: 'Aromático',
    reason: 'Verde es subcategoría de Aromático (Green Aromatic en Fragrantica)',
  },
  'Especiado': {
    // Especiado se divide según el contexto
    analyze: true,
    defaultFamilia: 'Oriental',
    reason: 'Especiado árabe generalmente es Spicy Oriental en Fragrantica',
  },
};

async function consolidateFamilies() {
  console.log('🔄 Consolidando familias olfativas...\n');
  
  const snapshot = await db.collection('perfumes').get();
  let cambios = 0;
  const cambiosDetalle = [];
  
  for (const doc of snapshot.docs) {
    const perfume = doc.data();
    const familiaActual = perfume.familiaOlfativa;
    
    // Regla 1: Verde → Aromático (todos)
    if (familiaActual === 'Verde') {
      await doc.ref.update({ familiaOlfativa: 'Aromático' });
      cambios++;
      cambiosDetalle.push({
        nombre: perfume.nombre,
        anterior: 'Verde',
        nueva: 'Aromático',
        razon: 'Verde es Aromático según Fragrantica',
      });
      continue;
    }
    
    // Regla 2: Especiado → Oriental o Aromático
    if (familiaActual === 'Especiado') {
      const nombreUpper = perfume.nombre.toUpperCase();
      const marcaUpper = perfume.marca.toUpperCase();
      
      // Si tiene notas orientales claras → Oriental
      const notasOrientales = ['OUD', 'AMBER', 'MUSK', 'INCIENSO', 'MYRRH', 'SAFFRON', 'AZAFRAN'];
      const esOriental = notasOrientales.some(n => 
        nombreUpper.includes(n) || 
        perfume.notasSalida?.some(nota => nota.toUpperCase().includes(n)) ||
        perfume.notasCorazon?.some(nota => nota.toUpperCase().includes(n)) ||
        perfume.notasFondo?.some(nota => nota.toUpperCase().includes(n))
      );
      
      // Marcas árabes típicamente van a Oriental
      const marcasArabes = ['LATTAFA', 'AL HARAMAIN', 'AFNAN', 'RASASI'];
      const esMarcaArabe = marcasArabes.some(m => marcaUpper.includes(m));
      
      const nuevaFamilia = (esOriental || esMarcaArabe) ? 'Oriental' : 'Aromático';
      
      await doc.ref.update({ familiaOlfativa: nuevaFamilia });
      cambios++;
      cambiosDetalle.push({
        nombre: perfume.nombre,
        anterior: 'Especiado',
        nueva: nuevaFamilia,
        razon: nuevaFamilia === 'Oriental' ? 'Spicy Oriental' : 'Spicy Aromatic',
      });
    }
  }
  
  console.log(`✅ ${cambios} perfumes actualizados\n`);
  
  if (cambiosDetalle.length > 0) {
    console.log('📋 CAMBIOS REALIZADOS:\n');
    
    // Agrupar por tipo de cambio
    const verdeAAromatico = cambiosDetalle.filter(c => c.anterior === 'Verde');
    const especiadoAOriental = cambiosDetalle.filter(c => c.anterior === 'Especiado' && c.nueva === 'Oriental');
    const especiadoAAromatico = cambiosDetalle.filter(c => c.anterior === 'Especiado' && c.nueva === 'Aromático');
    
    if (verdeAAromatico.length > 0) {
      console.log(`🌿 Verde → Aromático (${verdeAAromatico.length}):`);
      verdeAAromatico.forEach(c => console.log(`   • ${c.nombre}`));
      console.log();
    }
    
    if (especiadoAOriental.length > 0) {
      console.log(`🌶️  Especiado → Oriental (${especiadoAOriental.length}):`);
      especiadoAOriental.forEach(c => console.log(`   • ${c.nombre}`));
      console.log();
    }
    
    if (especiadoAAromatico.length > 0) {
      console.log(`🌶️  Especiado → Aromático (${especiadoAAromatico.length}):`);
      especiadoAAromatico.forEach(c => console.log(`   • ${c.nombre}`));
      console.log();
    }
  }
  
  // Mostrar nueva distribución
  console.log('━'.repeat(60));
  console.log('\n📊 NUEVA DISTRIBUCIÓN (7 familias):\n');
  
  const snapshotNuevo = await db.collection('perfumes').get();
  const perfumesNuevos = snapshotNuevo.docs.map(d => d.data());
  const statsNuevos = {};
  
  perfumesNuevos.forEach(p => {
    statsNuevos[p.familiaOlfativa] = (statsNuevos[p.familiaOlfativa] || 0) + 1;
  });
  
  Object.entries(statsNuevos)
    .sort((a, b) => b[1] - a[1])
    .forEach(([familia, count]) => {
      const percentage = ((count / perfumesNuevos.length) * 100).toFixed(1);
      console.log(`   ${familia}: ${count} perfumes (${percentage}%)`);
    });
  
  console.log(`\n✅ Total: ${perfumesNuevos.length} perfumes en 7 familias\n`);
  
  process.exit(0);
}

consolidateFamilies().catch(console.error);
