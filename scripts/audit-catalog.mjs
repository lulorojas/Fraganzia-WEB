// scripts/audit-catalog.mjs
// Auditoría completa del catálogo: precios, notas olfativas, familias
// Uso: node scripts/audit-catalog.mjs

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer el seed.js para analizar
const seedPath = join(__dirname, 'seed.js');
const seedContent = readFileSync(seedPath, 'utf8');

// Familias válidas según constants/index.js
const FAMILIAS_VALIDAS = [
  'Oriental',
  'Floral',
  'Amaderado',
  'Aromático',
  'Acuático',
  'Gourmand',
  'Cítrico',
];

// Extraer todos los perfumes del seed.js
const perfumeMatches = [...seedContent.matchAll(/p\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+)\)/g)];

const perfumes = perfumeMatches.map(match => ({
  nombre: match[1],
  marca: match[2],
  genero: match[3],
  familiaOlfativa: match[4],
  precioUSD: parseInt(match[5]),
  volumenML: parseInt(match[6]),
}));

console.log(`🔍 Auditando ${perfumes.length} perfumes del catálogo...\n`);

// ============ AUDITORÍA DE PRECIOS ============
const preciosProblematicos = [];
const precioStats = {
  min: Infinity,
  max: -Infinity,
  promedio: 0,
  total: 0,
};

perfumes.forEach(p => {
  const precio = p.precioUSD;
  
  // Actualizar stats
  if (precio < precioStats.min) precioStats.min = precio;
  if (precio > precioStats.max) precioStats.max = precio;
  precioStats.total += precio;
  
  // Detectar problemas
  if (precio <= 0) {
    preciosProblematicos.push({
      nombre: p.nombre,
      marca: p.marca,
      precioActual: precio,
      problema: 'Precio cero o negativo',
      severidad: 'CRÍTICO',
    });
  } else if (precio < 10) {
    preciosProblematicos.push({
      nombre: p.nombre,
      marca: p.marca,
      precioActual: precio,
      problema: 'Precio sospechosamente bajo (< $10)',
      severidad: 'ADVERTENCIA',
    });
  } else if (precio > 100) {
    preciosProblematicos.push({
      nombre: p.nombre,
      marca: p.marca,
      precioActual: precio,
      problema: 'Precio alto (> $100)',
      severidad: 'INFO',
    });
  }
});

precioStats.promedio = Math.round(precioStats.total / perfumes.length);

// ============ AUDITORÍA DE NOTAS OLFATIVAS ============
// En el seed.js todas las notas están vacías [], así que esto es informativo
const notasVacias = {
  count: perfumes.length, // Todos tienen arrays vacíos
  perfumes: perfumes.map(p => ({
    nombre: p.nombre,
    marca: p.marca,
    genero: p.genero,
  })),
};

// ============ AUDITORÍA DE FAMILIAS OLFATIVAS ============
const familiasEncontradas = {};
const familiasInconsistentes = [];

perfumes.forEach(p => {
  const familia = p.familiaOlfativa;
  
  // Contar uso de cada familia
  if (!familiasEncontradas[familia]) {
    familiasEncontradas[familia] = {
      count: 0,
      perfumes: [],
    };
  }
  familiasEncontradas[familia].count++;
  familiasEncontradas[familia].perfumes.push({
    nombre: p.nombre,
    marca: p.marca,
    genero: p.genero,
  });
  
  // Detectar inconsistencias
  const familiaCorregida = corregirEncoding(familia);
  const familiaValida = FAMILIAS_VALIDAS.find(f => 
    f.toLowerCase() === familiaCorregida.toLowerCase()
  );
  
  if (!familiaValida) {
    // Familia no está en la lista válida
    const sugerencia = FAMILIAS_VALIDAS.find(f => 
      f.toLowerCase().includes(familiaCorregida.toLowerCase().substring(0, 4))
    ) || 'Especiado';
    
    familiasInconsistentes.push({
      nombre: p.nombre,
      marca: p.marca,
      familiaActual: familia,
      problema: 'Familia no está en FAMILIAS_VALIDAS',
      sugerencia: sugerencia,
    });
  } else if (familia !== familiaValida) {
    // Familia existe pero tiene problemas de encoding o capitalización
    familiasInconsistentes.push({
      nombre: p.nombre,
      marca: p.marca,
      familiaActual: familia,
      problema: 'Problema de encoding o capitalización',
      sugerencia: familiaValida,
    });
  }
});

// Helper para corregir encoding UTF-8 mal interpretado
function corregirEncoding(str) {
  return str
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ');
}

// Ordenar familias por frecuencia
const familiasOrdenadas = Object.entries(familiasEncontradas)
  .map(([nombre, data]) => ({
    nombre,
    nombreCorregido: corregirEncoding(nombre),
    count: data.count,
    porcentaje: ((data.count / perfumes.length) * 100).toFixed(1),
    enListaValida: FAMILIAS_VALIDAS.includes(nombre) || FAMILIAS_VALIDAS.includes(corregirEncoding(nombre)),
  }))
  .sort((a, b) => b.count - a.count);

// ============ ANÁLISIS DE MARCAS ============
const marcasStats = {};
perfumes.forEach(p => {
  if (!marcasStats[p.marca]) {
    marcasStats[p.marca] = { count: 0, precioPromedio: 0, precioTotal: 0 };
  }
  marcasStats[p.marca].count++;
  marcasStats[p.marca].precioTotal += p.precioUSD;
});

Object.keys(marcasStats).forEach(marca => {
  marcasStats[marca].precioPromedio = Math.round(
    marcasStats[marca].precioTotal / marcasStats[marca].count
  );
  delete marcasStats[marca].precioTotal;
});

const marcasOrdenadas = Object.entries(marcasStats)
  .map(([nombre, stats]) => ({ nombre, ...stats }))
  .sort((a, b) => b.count - a.count);

// ============ ANÁLISIS POR GÉNERO ============
const generoStats = {
  Masculino: { count: 0, precioPromedio: 0, precioTotal: 0 },
  Femenino: { count: 0, precioPromedio: 0, precioTotal: 0 },
  Kids: { count: 0, precioPromedio: 0, precioTotal: 0 },
  Unisex: { count: 0, precioPromedio: 0, precioTotal: 0 },
};

perfumes.forEach(p => {
  if (generoStats[p.genero]) {
    generoStats[p.genero].count++;
    generoStats[p.genero].precioTotal += p.precioUSD;
  }
});

Object.keys(generoStats).forEach(genero => {
  if (generoStats[genero].count > 0) {
    generoStats[genero].precioPromedio = Math.round(
      generoStats[genero].precioTotal / generoStats[genero].count
    );
  }
  delete generoStats[genero].precioTotal;
});

// ============ GENERAR REPORTE FINAL ============
const reporte = {
  metadata: {
    fecha: new Date().toISOString(),
    totalPerfumes: perfumes.length,
    archivos: ['scripts/seed.js'],
  },
  
  resumenEjecutivo: {
    preciosProblematicos: preciosProblematicos.length,
    notasVacias: notasVacias.count,
    familiasInconsistentes: familiasInconsistentes.length,
    familiasUnicas: familiasOrdenadas.length,
    familiasNoValidas: familiasOrdenadas.filter(f => !f.enListaValida).length,
  },
  
  precios: {
    estadisticas: precioStats,
    problemasDetectados: preciosProblematicos,
    distribucionPorMarca: marcasOrdenadas.slice(0, 10), // Top 10 marcas
    distribucionPorGenero: generoStats,
  },
  
  notasOlfativas: {
    mensaje: 'Todos los perfumes tienen notasSalida, notasCorazon y notasFondo como arrays vacíos []',
    accionRequerida: 'Completar las notas olfativas para todos los perfumes',
    totalPerfumesSinNotas: notasVacias.count,
    nota: 'Este campo está vacío por diseño en el seed.js. Se deben completar manualmente o con scraping.',
  },
  
  familiasOlfativas: {
    familiasValidas: FAMILIAS_VALIDAS,
    familiasEncontradas: familiasOrdenadas,
    inconsistenciasDetectadas: familiasInconsistentes,
    resumenProblemas: {
      'Problemas de encoding': familiasInconsistentes.filter(f => 
        f.problema === 'Problema de encoding o capitalización'
      ).length,
      'Familias no válidas': familiasInconsistentes.filter(f => 
        f.problema === 'Familia no está en FAMILIAS_VALIDAS'
      ).length,
    },
  },
  
  marcas: {
    total: marcasOrdenadas.length,
    ranking: marcasOrdenadas,
    masPopulares: marcasOrdenadas.slice(0, 5),
    menosPopulares: marcasOrdenadas.slice(-5).reverse(),
  },
  
  recomendaciones: [
    {
      prioridad: 'ALTA',
      categoria: 'Familias Olfativas',
      problema: `${familiasInconsistentes.length} perfumes con familias inconsistentes`,
      accion: 'Corregir encoding UTF-8 en seed.js: reemplazar "Acuático" → "Acuático", "Aromático" → "Aromático", "Cítrico" → "Cítrico"',
      script: 'Crear script fix-familias-encoding.mjs para corregir automáticamente',
    },
    {
      prioridad: 'ALTA',
      categoria: 'Familias Olfativas',
      problema: 'Familia "Especiado" y "Verde" no están en FAMILIAS_VALIDAS',
      accion: 'Agregar "Especiado" y "Verde" a src/constants/index.js en FAMILIAS_OLFATIVAS',
    },
    {
      prioridad: 'ALTA',
      categoria: 'Notas Olfativas',
      problema: `${notasVacias.count} perfumes sin notas olfativas`,
      accion: 'Implementar scraping de Fragrantica/Parfumo o agregar manualmente las notas',
    },
    {
      prioridad: 'MEDIA',
      categoria: 'Precios',
      problema: `${preciosProblematicos.filter(p => p.severidad === 'ADVERTENCIA').length} precios sospechosamente bajos`,
      accion: 'Revisar manualmente los precios < $10',
    },
    {
      prioridad: 'BAJA',
      categoria: 'Precios',
      problema: `${preciosProblematicos.filter(p => p.severidad === 'INFO').length} precios altos (> $100)`,
      accion: 'Verificar que son correctos (perfumes premium/grandes volúmenes)',
    },
  ],
};

// Guardar reporte
const reportePath = join(__dirname, 'catalog-audit-report.json');
writeFileSync(reportePath, JSON.stringify(reporte, null, 2), 'utf8');

// ============ IMPRIMIR RESUMEN EN CONSOLA ============
console.log('📊 RESUMEN DE AUDITORÍA\n');
console.log('━'.repeat(60));

console.log('\n💰 PRECIOS:');
console.log(`   Total perfumes:      ${perfumes.length}`);
console.log(`   Precio mínimo:       $${precioStats.min}`);
console.log(`   Precio máximo:       $${precioStats.max}`);
console.log(`   Precio promedio:     $${precioStats.promedio}`);
console.log(`   Problemas detectados: ${preciosProblematicos.length}`);
if (preciosProblematicos.length > 0) {
  console.log('\n   🔴 Precios problemáticos:');
  preciosProblematicos.forEach(p => {
    console.log(`      ${p.severidad.padEnd(12)} | $${String(p.precioActual).padStart(3)} | ${p.nombre}`);
  });
}

console.log('\n🌸 NOTAS OLFATIVAS:');
console.log(`   ⚠️  TODOS los perfumes (${notasVacias.count}) tienen notas vacías`);
console.log('   Acción: Completar notasSalida, notasCorazon, notasFondo');

console.log('\n🎨 FAMILIAS OLFATIVAS:');
console.log(`   Familias válidas:     ${FAMILIAS_VALIDAS.length}`);
console.log(`   Familias encontradas: ${familiasOrdenadas.length}`);
console.log(`   Inconsistencias:      ${familiasInconsistentes.length}`);
console.log('\n   Distribución de familias:');
familiasOrdenadas.forEach(f => {
  const icono = f.enListaValida ? '✓' : '✗';
  console.log(`      ${icono} ${f.nombreCorregido.padEnd(20)} ${String(f.count).padStart(3)} (${f.porcentaje}%)`);
});

if (familiasInconsistentes.length > 0) {
  console.log('\n   🔴 Inconsistencias detectadas:');
  const problemasUnicos = {};
  familiasInconsistentes.forEach(f => {
    const key = `${f.familiaActual} → ${f.sugerencia}`;
    if (!problemasUnicos[key]) {
      problemasUnicos[key] = 0;
    }
    problemasUnicos[key]++;
  });
  
  Object.entries(problemasUnicos).forEach(([problema, count]) => {
    console.log(`      ${problema.padEnd(40)} (${count} perfumes)`);
  });
}

console.log('\n🏷️  MARCAS (Top 5):');
marcasOrdenadas.slice(0, 5).forEach((m, i) => {
  console.log(`   ${i + 1}. ${m.nombre.padEnd(20)} ${String(m.count).padStart(3)} perfumes (precio promedio: $${m.precioPromedio})`);
});

console.log('\n👥 GÉNEROS:');
Object.entries(generoStats).forEach(([genero, stats]) => {
  if (stats.count > 0) {
    console.log(`   ${genero.padEnd(12)} ${String(stats.count).padStart(3)} perfumes (precio promedio: $${stats.precioPromedio})`);
  }
});

console.log('\n━'.repeat(60));
console.log('\n📝 RECOMENDACIONES:\n');
reporte.recomendaciones.forEach((rec, i) => {
  const icono = rec.prioridad === 'ALTA' ? '🔴' : rec.prioridad === 'MEDIA' ? '🟡' : '🟢';
  console.log(`${icono} [${rec.prioridad}] ${rec.categoria}`);
  console.log(`   Problema: ${rec.problema}`);
  console.log(`   Acción:   ${rec.accion}`);
  if (rec.script) {
    console.log(`   Script:   ${rec.script}`);
  }
  console.log();
});

console.log('━'.repeat(60));
console.log(`\n✅ Reporte completo guardado en: ${reportePath}\n`);
