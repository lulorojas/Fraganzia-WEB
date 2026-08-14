// scripts/check-catalog.mjs
// Revisa géneros y familias olfativas de todos los perfumes
// Uso: node scripts/check-catalog.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Palabras clave para detectar género
const MASCULINO_KEYWORDS = ['HOMME', 'FOR HIM', 'MAN', 'MEN', 'MASCULINO', 'BLUE', 'SPORT', 'KING', 'UOMO'];
const FEMENINO_KEYWORDS = ['FEMME', 'FOR HER', 'WOMAN', 'WOMEN', 'FEMENINO', 'ROSA', 'PINK', 'ROSE', 'DONNA', 'LADY', 'GIRL'];
const KIDS_KEYWORDS = ['KIDS', 'TUBBEES'];

// Correcciones de familia olfativa basadas en el nombre
const FAMILIA_CORRECTIONS = {
  // Masculinos acuáticos/frescos
  'AQUA': 'Acuático',
  'OCEAN': 'Acuático',
  'BLUE': 'Acuático',
  'ICE': 'Acuático',
  'MARINE': 'Acuático',
  'VOYAGE': 'Acuático',
  
  // Gourmands
  'CHOCOLATE': 'Gourmand',
  'VANILLA': 'Gourmand',
  'CARAMEL': 'Gourmand',
  'CANDY': 'Gourmand',
  'MARSHMALLOW': 'Gourmand',
  'TIRAMISU': 'Gourmand',
  'PISTACHIO': 'Gourmand',
  'BUBBLE GUM': 'Gourmand',
  'COOKIES': 'Gourmand',
  'CHERRY': 'Gourmand',
  'SUGAR': 'Gourmand',
  'CHEESECAKE': 'Gourmand',
  
  // Orientales
  'OUD': 'Oriental',
  'AMBER': 'Oriental',
  'KHAMRAH': 'Oriental',
  'SULTAN': 'Oriental',
  'KHALIFA': 'Oriental',
  
  // Especiados
  'SPICE': 'Especiado',
  'SAFFRON': 'Especiado',
  'PEPPER': 'Especiado',
  
  // Cítricos
  'LEMON': 'Cítrico',
  'CITRUS': 'Cítrico',
  'MANDARIN': 'Cítrico',
  'ORANGE': 'Cítrico',
  'BERGAMOT': 'Cítrico',
  
  // Florales
  'ROSE': 'Floral',
  'JASMINE': 'Floral',
  'LILY': 'Floral',
  'VIOLET': 'Floral',
  'PEONY': 'Floral',
  
  // Amaderados
  'WOOD': 'Amaderado',
  'CEDAR': 'Amaderado',
  'SANDALWOOD': 'Amaderado',
  'LEATHER': 'Amaderado',
  
  // Aromáticos
  'LAVENDER': 'Aromático',
  'SAGE': 'Aromático',
  'ROSEMARY': 'Aromático',
};

async function revisarCatalogo() {
  console.log('🔍 Revisando catálogo...\n');
  
  const snapshot = await db.collection('perfumes').get();
  const problemas = {
    generoIncorrecto: [],
    familiaIncorrecta: [],
  };
  
  for (const doc of snapshot.docs) {
    const perfume = { id: doc.id, ...doc.data() };
    const nombreUpper = perfume.nombre.toUpperCase();
    
    // Verificar género
    let generoEsperado = perfume.genero;
    
    if (KIDS_KEYWORDS.some(k => nombreUpper.includes(k))) {
      generoEsperado = 'Kids';
    } else if (MASCULINO_KEYWORDS.some(k => nombreUpper.includes(k))) {
      generoEsperado = 'Masculino';
    } else if (FEMENINO_KEYWORDS.some(k => nombreUpper.includes(k))) {
      generoEsperado = 'Femenino';
    }
    
    if (generoEsperado !== perfume.genero && perfume.genero !== 'Unisex') {
      problemas.generoIncorrecto.push({
        nombre: perfume.nombre,
        actual: perfume.genero,
        sugerido: generoEsperado,
      });
    }
    
    // Verificar familia olfativa
    for (const [keyword, familia] of Object.entries(FAMILIA_CORRECTIONS)) {
      if (nombreUpper.includes(keyword) && perfume.familiaOlfativa !== familia) {
        problemas.familiaIncorrecta.push({
          nombre: perfume.nombre,
          actual: perfume.familiaOlfativa,
          sugerido: familia,
          razon: keyword,
        });
        break;
      }
    }
  }
  
  console.log('📊 RESULTADOS:\n');
  
  if (problemas.generoIncorrecto.length > 0) {
    console.log(`⚠️  ${problemas.generoIncorrecto.length} perfumes con género potencialmente incorrecto:\n`);
    problemas.generoIncorrecto.slice(0, 10).forEach(p => {
      console.log(`   • ${p.nombre}`);
      console.log(`     Actual: ${p.actual} → Sugerido: ${p.sugerido}`);
    });
    if (problemas.generoIncorrecto.length > 10) {
      console.log(`   ... y ${problemas.generoIncorrecto.length - 10} más\n`);
    }
  } else {
    console.log('✅ Todos los géneros parecen correctos\n');
  }
  
  if (problemas.familiaIncorrecta.length > 0) {
    console.log(`⚠️  ${problemas.familiaIncorrecta.length} perfumes con familia olfativa potencialmente incorrecta:\n`);
    problemas.familiaIncorrecta.slice(0, 10).forEach(p => {
      console.log(`   • ${p.nombre}`);
      console.log(`     Actual: ${p.actual} → Sugerido: ${p.sugerido} (contiene "${p.razon}")`);
    });
    if (problemas.familiaIncorrecta.length > 10) {
      console.log(`   ... y ${problemas.familiaIncorrecta.length - 10} más\n`);
    }
  } else {
    console.log('✅ Todas las familias olfativas parecen correctas\n');
  }
  
  console.log(`\n📝 Total revisados: ${snapshot.docs.length} perfumes`);
  
  // Guardar reporte completo
  const reporte = {
    fecha: new Date().toISOString(),
    total: snapshot.docs.length,
    problemas,
  };
  
  writeFileSync(
    join(__dirname, 'catalog-review.json'),
    JSON.stringify(reporte, null, 2)
  );
  
  console.log('\n💾 Reporte completo guardado en scripts/catalog-review.json');
  
  if (problemas.generoIncorrecto.length > 0 || problemas.familiaIncorrecta.length > 0) {
    console.log('\n💡 Para aplicar correcciones automáticas, ejecutá: node scripts/fix-catalog.mjs');
  }
  
  process.exit(0);
}

revisarCatalogo().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
