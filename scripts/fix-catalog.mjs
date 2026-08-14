// scripts/fix-catalog.mjs
// Corrige familias olfativas basándose en el análisis
// Uso: node scripts/fix-catalog.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Correcciones específicas basadas en keywords
const FAMILIA_CORRECTIONS = {
  'OUD': 'Oriental',
  'AMBER': 'Oriental',
  'KHAMRAH': 'Oriental',
  'CHOCOLATE': 'Gourmand',
  'VANILLA': 'Gourmand',
  'CARAMEL': 'Gourmand',
  'CANDY': 'Gourmand',
  'MARSHMALLOW': 'Gourmand',
  'TIRAMISU': 'Gourmand',
  'PISTACHIO': 'Gourmand',
  'CHERRY': 'Gourmand',
  'SUGAR': 'Gourmand',
  'CHEESECAKE': 'Gourmand',
  'COOKIES': 'Gourmand',
  'BUBBLE GUM': 'Gourmand',
};

// Keywords que tienen prioridad (no corregir si el nombre las contiene)
const SKIP_IF_CONTAINS = {
  'AQUA': true,  // AMBER OUD AQUA → mantener Acuático
  'CARBON': true, // CARBON EDITION → mantener Amaderado
};

async function corregirCatalogo() {
  console.log('🔧 Corrigiendo catálogo...\n');
  
  const snapshot = await db.collection('perfumes').get();
  let corregidos = 0;
  const cambios = [];
  
  for (const doc of snapshot.docs) {
    const perfume = doc.data();
    const nombreUpper = perfume.nombre.toUpperCase();
    
    // Skip si contiene keywords de excepción
    if (Object.keys(SKIP_IF_CONTAINS).some(k => nombreUpper.includes(k))) {
      continue;
    }
    
    // Buscar corrección de familia
    for (const [keyword, familiaCorrecta] of Object.entries(FAMILIA_CORRECTIONS)) {
      if (nombreUpper.includes(keyword) && perfume.familiaOlfativa !== familiaCorrecta) {
        await doc.ref.update({ familiaOlfativa: familiaCorrecta });
        corregidos++;
        cambios.push({
          nombre: perfume.nombre,
          anterior: perfume.familiaOlfativa,
          nueva: familiaCorrecta,
          razon: keyword,
        });
        break;
      }
    }
  }
  
  console.log(`✅ ${corregidos} familias olfativas corregidas:\n`);
  
  cambios.forEach(c => {
    console.log(`   • ${c.nombre}`);
    console.log(`     ${c.anterior} → ${c.nueva} (${c.razon})`);
  });
  
  console.log(`\n📝 Total revisados: ${snapshot.docs.length} perfumes`);
  
  process.exit(0);
}

corregirCatalogo().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
