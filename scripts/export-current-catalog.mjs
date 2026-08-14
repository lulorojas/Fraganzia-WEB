// scripts/export-current-catalog.mjs
// Exportar catálogo actual a CSV para que el usuario lo revise

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
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

console.log('📦 Exportando catálogo actual a CSV...\n');

const perfumesSnap = await db.collection('perfumes').get();
const perfumes = perfumesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// Crear CSV
const headers = ['Marca', 'Nombre', 'Género', 'Familia', 'Precio USD', 'Volumen ML', 'Notas Salida', 'Notas Corazón', 'Notas Fondo'];
const rows = [headers];

perfumes.forEach(p => {
  rows.push([
    p.marca || '',
    p.nombre || '',
    p.genero || '',
    p.familiaOlfativa || '',
    p.precioUSD || 0,
    p.volumenML || 0,
    (p.notasSalida || []).join('; '),
    (p.notasCorazon || []).join('; '),
    (p.notasFondo || []).join('; ')
  ]);
});

// Convertir a CSV
const csvContent = rows.map(row => 
  row.map(cell => {
    const str = String(cell);
    // Escapar comillas y envolver en comillas si contiene coma, punto y coma o salto de línea
    if (str.includes(',') || str.includes(';') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }).join(',')
).join('\n');

const outputPath = join(__dirname, 'catalogo-actual.csv');
writeFileSync(outputPath, '\uFEFF' + csvContent, 'utf8'); // BOM para Excel

console.log(`✅ CSV exportado: ${outputPath}`);
console.log(`📊 Total productos: ${perfumes.length}\n`);
console.log('🔧 INSTRUCCIONES:');
console.log('1. Abrí el archivo CSV en Excel o Google Sheets');
console.log('2. Revisá y corregí los precios, familias y notas');
console.log('3. Guardalo como "catalogo-corregido.csv"');
console.log('4. Ejecutá: node scripts/import-corrected-catalog.mjs\n');

process.exit(0);
