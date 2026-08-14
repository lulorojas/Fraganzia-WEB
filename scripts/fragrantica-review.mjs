// scripts/fragrantica-review.mjs
// Compara familias olfativas con Fragrantica para validación final
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Mapeo Fragrantica → Fraganzia
const FAMILIA_MAPPING = {
  // Fragrantica usa estos términos:
  'Oriental': 'Oriental',
  'Amber': 'Oriental',
  'Woody': 'Amaderado',
  'Aromatic': 'Aromático',
  'Fresh': 'Acuático',
  'Aquatic': 'Acuático',
  'Floral': 'Floral',
  'Citrus': 'Cítrico',
  'Fruity': 'Floral', // Fragantica usa Fruity, nosotros lo incluimos en Floral
  'Gourmand': 'Gourmand',
  'Spicy': 'Especiado',
  'Green': 'Verde',
  'Leather': 'Amaderado', // Cuero generalmente va con amaderados
  'Fougere': 'Aromático', // Fougère es tipo aromático
};

// Keywords específicos que indican familia (basados en Fragrantica)
const FAMILIA_KEYWORDS = {
  'Oriental': ['OUD', 'AMBER', 'KHAMRAH', 'SULTAN', 'AL HARAMAIN', 'SHEIKH', 'ARABIC', 'EASTERN'],
  'Gourmand': ['CHOCOLATE', 'VANILLA', 'CANDY', 'CARAMEL', 'SWEET', 'GOURMAND'],
  'Acuático': ['AQUA', 'OCEAN', 'MARINE', 'FRESH', 'SEA', 'BLUE'],
  'Amaderado': ['WOOD', 'WOODY', 'SANDALWOOD', 'CEDAR', 'CARBON', 'TOBACCO'],
  'Cítrico': ['LEMON', 'ORANGE', 'BERGAMOT', 'CITRUS', 'LIME'],
  'Aromático': ['LAVENDER', 'SAGE', 'HERBAL', 'AROMATIC'],
  'Especiado': ['SPICE', 'PEPPER', 'CINNAMON', 'CARDAMOM'],
  'Floral': ['ROSE', 'JASMINE', 'IRIS', 'LILY', 'VIOLET', 'ORCHID', 'BLOSSOM'],
};

async function fragranticaReview() {
  console.log('🔍 Revisión final de familias olfativas según Fragrantica\n');
  
  const snapshot = await db.collection('perfumes').get();
  const perfumes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const problemas = [];
  const sugerencias = new Map();
  
  for (const p of perfumes) {
    const nombreUpper = p.nombre.toUpperCase();
    const marcaUpper = p.marca.toUpperCase();
    const fullName = `${marcaUpper} ${nombreUpper}`;
    
    // Detectar familia por keywords
    let familiaDetectada = null;
    for (const [familia, keywords] of Object.entries(FAMILIA_KEYWORDS)) {
      if (keywords.some(kw => fullName.includes(kw))) {
        familiaDetectada = familia;
        break;
      }
    }
    
    // Si detectamos una familia diferente, reportar
    if (familiaDetectada && familiaDetectada !== p.familiaOlfativa) {
      // Excepciones conocidas
      if (nombreUpper.includes('AQUA') && nombreUpper.includes('DUBAI') && p.familiaOlfativa === 'Acuático') {
        continue; // AQUA DUBAI es correctamente Acuático
      }
      if (nombreUpper.includes('CARBON') && p.familiaOlfativa === 'Amaderado') {
        continue; // CARBON EDITION es correctamente Amaderado
      }
      if (nombreUpper.includes('VIOLET') && p.familiaOlfativa === 'Floral') {
        continue; // ULTRA VIOLET podría ser Floral por la flor
      }
      
      problemas.push({
        nombre: p.nombre,
        actual: p.familiaOlfativa,
        sugerida: familiaDetectada,
        razon: `Contiene keywords de ${familiaDetectada}`,
      });
      
      if (!sugerencias.has(familiaDetectada)) {
        sugerencias.set(familiaDetectada, []);
      }
      sugerencias.get(familiaDetectada).push(p.nombre);
    }
  }
  
  console.log('📊 RESULTADOS:\n');
  
  if (problemas.length === 0) {
    console.log('✅ Todas las familias olfativas están correctamente catalogadas');
    console.log('   según los estándares de Fragrantica\n');
  } else {
    console.log(`⚠️  ${problemas.length} posibles inconsistencias detectadas:\n`);
    
    for (const [familia, perfumes] of sugerencias) {
      console.log(`${familia}:`);
      perfumes.forEach(n => console.log(`  • ${n}`));
      console.log();
    }
    
    console.log('💡 RECOMENDACIONES:');
    console.log('   1. Verifica cada perfume en Fragrantica.com');
    console.log('   2. Las detecciones son sugerencias, no correcciones automáticas');
    console.log('   3. Algunas ediciones especiales pueden tener familias diferentes');
    console.log('   4. Ejemplo: "CARBON" puede ser Amaderado aunque contenga OUD\n');
  }
  
  // Estadísticas finales
  const stats = {};
  perfumes.forEach(p => {
    stats[p.familiaOlfativa] = (stats[p.familiaOlfativa] || 0) + 1;
  });
  
  console.log('📈 Distribución actual:');
  Object.entries(stats).sort((a, b) => b[1] - a[1]).forEach(([f, c]) => {
    console.log(`   ${f}: ${c} perfumes`);
  });
  
  console.log(`\n✅ Total: ${perfumes.length} perfumes catalogados`);
  
  process.exit(0);
}

fragranticaReview().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
