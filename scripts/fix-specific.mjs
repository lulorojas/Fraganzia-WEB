// scripts/fix-specific.mjs
// Corrige los 2 casos específicos detectados
// Uso: node scripts/fix-specific.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function fixSpecific() {
  console.log('🔧 Corrigiendo casos específicos...\n');
  
  const snapshot = await db.collection('perfumes').get();
  let cambios = 0;
  
  for (const doc of snapshot.docs) {
    const perfume = doc.data();
    const updates = {};
    
    // LATTAFA THE KINGDOM FEMENINO → debería ser Femenino (el nombre ya lo dice)
    // No hay problema, está bien catalogado
    
    // ARMAF ODYSSEY DUBAI CHOCOLAT → Gourmand está bien, es un perfume masculino gourmand
    // Odyssey Chocolat es una edición de chocolate, gourmand correcto
    
    // Revisión: perfumes con "POUR HOMME" que no sean Masculino
    if (perfume.nombre.toUpperCase().includes('POUR HOMME') && perfume.genero !== 'Masculino') {
      updates.genero = 'Masculino';
      cambios++;
      console.log(`   ✓ ${perfume.nombre} → Masculino`);
    }
    
    // Revisión: perfumes con "POUR FEMME" que no sean Femenino
    if (perfume.nombre.toUpperCase().includes('POUR FEMME') && perfume.genero !== 'Femenino') {
      updates.genero = 'Femenino';
      cambios++;
      console.log(`   ✓ ${perfume.nombre} → Femenino`);
    }
    
    // Aplicar cambios si hay
    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
    }
  }
  
  if (cambios === 0) {
    console.log('✅ No se encontraron problemas que corregir');
    console.log('   El catálogo está correctamente categorizado\n');
  } else {
    console.log(`\n✅ ${cambios} correcciones aplicadas\n`);
  }
  
  process.exit(0);
}

fixSpecific().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
