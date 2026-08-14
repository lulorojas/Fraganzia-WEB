// scripts/deep-analysis.mjs
// Análisis profundo del catálogo comparando seed.js vs Firestore

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
} catch {
  console.error('❌ No se encontró scripts/serviceAccount.json');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

console.log('🔍 ANÁLISIS PROFUNDO DEL CATÁLOGO\n');
console.log('='.repeat(60));

const perfumesSnap = await db.collection('perfumes').get();
const perfumes = perfumesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

console.log(`\n📊 Total perfumes en Firestore: ${perfumes.length}\n`);

// Buscar perfumes específicos que mencionó el usuario
console.log('🔎 PERFUMES ESPECÍFICOS MENCIONADOS');
console.log('='.repeat(60));

const teriaqIntense = perfumes.find(p => p.nombre?.toLowerCase().includes('teriaq intense'));
if (teriaqIntense) {
  console.log('\n📦 LATTAFA TERIAQ INTENSE:');
  console.log(`   Precio USD: $${teriaqIntense.precioUSD}`);
  console.log(`   Familia: ${teriaqIntense.familiaOlfativa}`);
  console.log(`   Género: ${teriaqIntense.genero}`);
  console.log(`   Volumen: ${teriaqIntense.volumenML}ml`);
  console.log(`   Notas Salida: ${(teriaqIntense.notasSalida || []).join(', ') || 'VACÍO'}`);
  console.log(`   Notas Corazón: ${(teriaqIntense.notasCorazon || []).join(', ') || 'VACÍO'}`);
  console.log(`   Notas Fondo: ${(teriaqIntense.notasFondo || []).join(', ') || 'VACÍO'}`);
  console.log(`   Imágenes: ${(teriaqIntense.imagenes || []).length} imagen(es)`);
}

// Análisis de precios sospechosos
console.log('\n\n💰 ANÁLISIS DE PRECIOS SOSPECHOSOS');
console.log('='.repeat(60));

const preciosPorMarca = new Map();
perfumes.forEach(p => {
  if (!preciosPorMarca.has(p.marca)) {
    preciosPorMarca.set(p.marca, []);
  }
  preciosPorMarca.get(p.marca).push({ nombre: p.nombre, precio: p.precioUSD });
});

// Mostrar rangos por marca
console.log('\nRangos de precios por marca:');
[...preciosPorMarca.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .forEach(([marca, productos]) => {
    const precios = productos.map(p => p.precio).sort((a, b) => a - b);
    const min = precios[0];
    const max = precios[precios.length - 1];
    const promedio = (precios.reduce((sum, p) => sum + p, 0) / precios.length).toFixed(2);
    console.log(`  ${marca}: $${min} - $${max} (promedio: $${promedio}, ${productos.length} productos)`);
  });

// Perfumes con precios muy diferentes al promedio de su marca
console.log('\n⚠️ Perfumes con precios atípicos para su marca:');
[...preciosPorMarca.entries()].forEach(([marca, productos]) => {
  if (productos.length < 3) return; // Ignorar marcas con pocos productos
  
  const precios = productos.map(p => p.precio);
  const promedio = precios.reduce((sum, p) => sum + p, 0) / precios.length;
  const desviacion = Math.sqrt(precios.reduce((sum, p) => sum + Math.pow(p - promedio, 2), 0) / precios.length);
  
  productos.forEach(prod => {
    const diferencia = Math.abs(prod.precio - promedio);
    if (diferencia > desviacion * 1.5) { // Más de 1.5 desviaciones estándar
      console.log(`  ⚠️ ${prod.nombre}: $${prod.precio} (marca promedio: $${promedio.toFixed(2)})`);
    }
  });
});

// Análisis de familias olfativas
console.log('\n\n🏷️ ANÁLISIS DE FAMILIAS OLFATIVAS');
console.log('='.repeat(60));

const familias = new Map();
perfumes.forEach(p => {
  const familia = p.familiaOlfativa || 'Sin familia';
  if (!familias.has(familia)) {
    familias.set(familia, []);
  }
  familias.get(familia).push(p.nombre);
});

console.log('\nFamilias encontradas:');
[...familias.entries()]
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([familia, productos]) => {
    console.log(`  ${familia}: ${productos.length} productos`);
    if (productos.length <= 3) {
      productos.forEach(p => console.log(`    - ${p}`));
    }
  });

// Análisis de notas faltantes
console.log('\n\n🌸 ANÁLISIS DE NOTAS OLFATIVAS');
console.log('='.repeat(60));

const sinNotasCompletas = perfumes.filter(p => {
  const salida = (p.notasSalida || []).length;
  const corazon = (p.notasCorazon || []).length;
  const fondo = (p.notasFondo || []).length;
  return salida === 0 || corazon === 0 || fondo === 0;
});

console.log(`\n❌ ${sinNotasCompletas.length} perfumes sin notas completas (${((sinNotasCompletas.length / perfumes.length) * 100).toFixed(1)}%)`);

if (sinNotasCompletas.length > 0) {
  console.log('\nPrimeros 20 perfumes sin notas completas:');
  sinNotasCompletas.slice(0, 20).forEach(p => {
    const s = (p.notasSalida || []).length;
    const c = (p.notasCorazon || []).length;
    const f = (p.notasFondo || []).length;
    console.log(`  - ${p.nombre}: S=${s}, C=${c}, F=${f}`);
  });
}

// Análisis de imágenes
console.log('\n\n🖼️ ANÁLISIS DE IMÁGENES');
console.log('='.repeat(60));

const sinImagen = perfumes.filter(p => !p.imagenes || p.imagenes.length === 0);
const conImagen = perfumes.filter(p => p.imagenes && p.imagenes.length > 0);

console.log(`\n✅ Con imagen: ${conImagen.length} (${((conImagen.length / perfumes.length) * 100).toFixed(1)}%)`);
console.log(`❌ Sin imagen: ${sinImagen.length} (${((sinImagen.length / perfumes.length) * 100).toFixed(1)}%)`);

// Top 10 marcas sin imágenes
const sinImagenPorMarca = new Map();
sinImagen.forEach(p => {
  sinImagenPorMarca.set(p.marca, (sinImagenPorMarca.get(p.marca) || 0) + 1);
});

if (sinImagenPorMarca.size > 0) {
  console.log('\nMarcas con más productos sin imagen:');
  [...sinImagenPorMarca.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([marca, count]) => console.log(`  ${marca}: ${count} sin imagen`));
}

console.log('\n\n✅ Análisis completado\n');
process.exit(0);
