// scripts/deep-review.mjs
// Revisión profunda del catálogo buscando inconsistencias reales
// Uso: node scripts/deep-review.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function deepReview() {
  console.log('🔍 Revisión profunda del catálogo...\n');
  
  const snapshot = await db.collection('perfumes').get();
  const perfumes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const problemas = {
    sinDescripcion: [],
    sinNotas: [],
    generosSospechosos: [],
    familiasRaras: [],
    sinImagen: [],
  };
  
  // Patrones específicos para género
  const MASCULINO_REAL = ['HOMME', 'FOR HIM', 'POUR HOMME', 'MEN\'S', 'KING', 'SULTAN', 'AL MALIK'];
  const FEMENINO_REAL = ['FEMME', 'FOR HER', 'POUR FEMME', 'LADY', 'QUEEN', 'AMEERAT', 'MALEKA'];
  
  for (const p of perfumes) {
    const nombreUpper = p.nombre.toUpperCase();
    
    // Revisar descripción vacía
    if (!p.descripcion || p.descripcion.trim() === '') {
      problemas.sinDescripcion.push(p.nombre);
    }
    
    // Revisar notas vacías
    if (!p.notasSalida?.length && !p.notasCorazon?.length && !p.notasFondo?.length) {
      problemas.sinNotas.push(p.nombre);
    }
    
    // Revisar géneros realmente sospechosos
    const esClaMasc = MASCULINO_REAL.some(k => nombreUpper.includes(k));
    const esClaFem = FEMENINO_REAL.some(k => nombreUpper.includes(k));
    
    if (esClaMasc && p.genero === 'Femenino') {
      problemas.generosSospechosos.push({
        nombre: p.nombre,
        actual: p.genero,
        razon: 'Contiene keyword masculino claro',
      });
    }
    
    if (esClaFem && p.genero === 'Masculino') {
      problemas.generosSospechosos.push({
        nombre: p.nombre,
        actual: p.genero,
        razon: 'Contiene keyword femenino claro',
      });
    }
    
    // Revisar familias muy raras para el género
    if (p.genero === 'Masculino' && p.familiaOlfativa === 'Gourmand' && !nombreUpper.includes('CHOCOLATE') && !nombreUpper.includes('CANDY')) {
      problemas.familiasRaras.push({
        nombre: p.nombre,
        genero: p.genero,
        familia: p.familiaOlfativa,
      });
    }
    
    // Revisar sin imagen
    if (!p.imagenes || p.imagenes.length === 0) {
      problemas.sinImagen.push(p.nombre);
    }
  }
  
  console.log('📊 RESULTADOS DETALLADOS:\n');
  
  if (problemas.sinDescripcion.length > 0) {
    console.log(`❌ ${problemas.sinDescripcion.length} perfumes SIN DESCRIPCIÓN`);
    problemas.sinDescripcion.slice(0, 5).forEach(n => console.log(`   • ${n}`));
    if (problemas.sinDescripcion.length > 5) {
      console.log(`   ... y ${problemas.sinDescripcion.length - 5} más`);
    }
    console.log();
  } else {
    console.log('✅ Todos los perfumes tienen descripción\n');
  }
  
  if (problemas.sinNotas.length > 0) {
    console.log(`❌ ${problemas.sinNotas.length} perfumes SIN NOTAS OLFATIVAS`);
    problemas.sinNotas.slice(0, 5).forEach(n => console.log(`   • ${n}`));
    if (problemas.sinNotas.length > 5) {
      console.log(`   ... y ${problemas.sinNotas.length - 5} más`);
    }
    console.log();
  } else {
    console.log('✅ Todos los perfumes tienen notas olfativas\n');
  }
  
  if (problemas.generosSospechosos.length > 0) {
    console.log(`⚠️  ${problemas.generosSospechosos.length} GÉNEROS REALMENTE SOSPECHOSOS:`);
    problemas.generosSospechosos.forEach(p => {
      console.log(`   • ${p.nombre} → ${p.actual} (${p.razon})`);
    });
    console.log();
  } else {
    console.log('✅ Todos los géneros parecen correctos\n');
  }
  
  if (problemas.familiasRaras.length > 0) {
    console.log(`⚠️  ${problemas.familiasRaras.length} FAMILIAS INUSUALES:`);
    problemas.familiasRaras.forEach(p => {
      console.log(`   • ${p.nombre} → ${p.genero}/${p.familia}`);
    });
    console.log();
  } else {
    console.log('✅ Familias olfativas consistentes\n');
  }
  
  if (problemas.sinImagen.length > 0) {
    console.log(`📷 ${problemas.sinImagen.length} perfumes sin imagen`);
    problemas.sinImagen.slice(0, 5).forEach(n => console.log(`   • ${n}`));
    if (problemas.sinImagen.length > 5) {
      console.log(`   ... y ${problemas.sinImagen.length - 5} más`);
    }
    console.log();
  } else {
    console.log('✅ Todos los perfumes tienen imagen\n');
  }
  
  // Estadísticas por categoría
  const stats = {
    generos: {},
    familias: {},
  };
  
  perfumes.forEach(p => {
    stats.generos[p.genero] = (stats.generos[p.genero] || 0) + 1;
    stats.familias[p.familiaOlfativa] = (stats.familias[p.familiaOlfativa] || 0) + 1;
  });
  
  console.log('📊 DISTRIBUCIÓN DEL CATÁLOGO:\n');
  console.log('Géneros:');
  Object.entries(stats.generos).sort((a, b) => b[1] - a[1]).forEach(([g, c]) => {
    console.log(`   • ${g}: ${c} perfumes`);
  });
  
  console.log('\nFamilias olfativas:');
  Object.entries(stats.familias).sort((a, b) => b[1] - a[1]).forEach(([f, c]) => {
    console.log(`   • ${f}: ${c} perfumes`);
  });
  
  console.log(`\n📝 Total: ${perfumes.length} perfumes\n`);
  
  // Guardar reporte
  writeFileSync(
    join(__dirname, 'deep-review.json'),
    JSON.stringify({ problemas, stats }, null, 2)
  );
  
  console.log('💾 Reporte guardado en scripts/deep-review.json');
  
  process.exit(0);
}

deepReview().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
