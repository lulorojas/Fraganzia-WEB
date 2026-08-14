// scripts/review-low-usage-families.mjs
// Revisar familias olfativas con pocos perfumes
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function reviewLowUsage() {
  console.log('🔍 Revisando familias poco usadas...\n');
  
  const snapshot = await db.collection('perfumes').get();
  const perfumes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Contar por familia
  const stats = {};
  perfumes.forEach(p => {
    stats[p.familiaOlfativa] = (stats[p.familiaOlfativa] || 0) + 1;
  });
  
  // Ordenar de menor a mayor
  const sorted = Object.entries(stats).sort((a, b) => a[1] - b[1]);
  
  console.log('📊 Familias de menor a mayor uso:\n');
  sorted.forEach(([familia, count]) => {
    const percentage = ((count / perfumes.length) * 100).toFixed(1);
    console.log(`   ${familia}: ${count} perfumes (${percentage}%)`);
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Mostrar las 3 familias menos usadas en detalle
  const lowUsage = sorted.slice(0, 3);
  
  for (const [familia, count] of lowUsage) {
    console.log(`\n${familia.toUpperCase()} (${count} perfumes):`);
    console.log('━'.repeat(50));
    
    const perfumesFamilia = perfumes.filter(p => p.familiaOlfativa === familia);
    
    perfumesFamilia.forEach(p => {
      console.log(`• ${p.marca} ${p.nombre}`);
      console.log(`  Género: ${p.genero} | Notas: ${p.notasSalida?.slice(0, 2).join(', ') || 'N/A'}`);
    });
  }
  
  console.log('\n\n💡 ANÁLISIS Y SUGERENCIAS:\n');
  
  // Análisis específico de Verde
  const verdes = perfumes.filter(p => p.familiaOlfativa === 'Verde');
  if (verdes.length <= 5) {
    console.log('🌿 VERDE (muy poco usada):');
    console.log('   → Fragrantica usa "Green/Aromatic" o "Fresh Spicy"');
    console.log('   → Sugerencia: integrar en AROMÁTICO o ACUÁTICO');
    console.log('   → Verde es subcategoría de Aromático en la mayoría de clasificaciones\n');
  }
  
  // Análisis de Especiado
  const especiados = perfumes.filter(p => p.familiaOlfativa === 'Especiado');
  if (especiados.length <= 20) {
    console.log('🌶️  ESPECIADO (poco usada):');
    console.log('   → Fragrantica lo combina con Oriental (Spicy Oriental)');
    console.log('   → Muchos especiados árabes son realmente Oriental\n');
  }
  
  // Propuesta de simplificación
  console.log('📋 PROPUESTA DE SIMPLIFICACIÓN:');
  console.log('   Pasar de 9 familias a 7 familias principales:\n');
  console.log('   ✓ Oriental (Amber, Spicy Oriental)');
  console.log('   ✓ Floral (incluye Fruity Floral)');
  console.log('   ✓ Amaderado (Woody, Leather)');
  console.log('   ✓ Aromático (Aromatic, Green, Fougère)');
  console.log('   ✓ Acuático (Fresh, Aquatic, Oceanic)');
  console.log('   ✓ Cítrico (Citrus)');
  console.log('   ✓ Gourmand (Sweet, Gourmand)\n');
  console.log('   🗑️  ELIMINAR: Verde (→ Aromático), Especiado (→ Oriental/Aromático)\n');
  
  // Guardar reporte
  const report = {
    stats: sorted.map(([f, c]) => ({ familia: f, count: c, percentage: ((c / perfumes.length) * 100).toFixed(1) })),
    lowUsage: lowUsage.map(([f]) => ({
      familia: f,
      perfumes: perfumes.filter(p => p.familiaOlfativa === f).map(p => ({
        id: p.id,
        nombre: p.nombre,
        marca: p.marca,
      })),
    })),
  };
  
  writeFileSync(join(__dirname, 'family-usage-report.json'), JSON.stringify(report, null, 2));
  console.log('💾 Reporte guardado en scripts/family-usage-report.json\n');
  
  process.exit(0);
}

reviewLowUsage().catch(console.error);
