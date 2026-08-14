// scripts/extract-catalog-27-07.mjs
// Extraer datos del catálogo 27-07 y compararlos con Firestore

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pdfParse from 'pdf-parse';

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

console.log('📄 Extrayendo datos del catálogo 27-07...\n');

// Leer PDF
const pdfPath = join(__dirname, '..', 'CATALOGO ARABES MAYORISTA 27-07.pdf');
const dataBuffer = readFileSync(pdfPath);
const pdfData = await pdfParse(dataBuffer);

console.log(`📊 Páginas: ${pdfData.numpages}`);
console.log(`📝 Texto extraído: ${pdfData.text.length} caracteres\n`);

// Guardar texto extraído
const outputPath = join(__dirname, 'catalog-27-07-extracted.txt');
writeFileSync(outputPath, pdfData.text, 'utf8');
console.log(`✅ Texto guardado en: ${outputPath}\n`);

// Mostrar primeras líneas para análisis
const lines = pdfData.text.split('\n').filter(l => l.trim());
console.log('📋 PRIMERAS 50 LÍNEAS DEL CATÁLOGO:');
console.log('='.repeat(60));
lines.slice(0, 50).forEach((line, i) => {
  console.log(`${(i + 1).toString().padStart(3, '0')}: ${line}`);
});

// Buscar líneas que contengan precios (formato $XX o USD XX)
console.log('\n\n💰 LÍNEAS CON PRECIOS DETECTADOS:');
console.log('='.repeat(60));
const precioRegex = /\$\s*\d+|\busd\s*\d+/i;
const lineasConPrecio = lines.filter(l => precioRegex.test(l)).slice(0, 30);
lineasConPrecio.forEach((line, i) => {
  console.log(`${(i + 1).toString().padStart(3, '0')}: ${line}`);
});

// Buscar Teriaq específicamente
console.log('\n\n🔎 LÍNEAS QUE CONTIENEN "TERIAQ":');
console.log('='.repeat(60));
const teriaqLines = lines.filter(l => /teriaq/i.test(l));
teriaqLines.forEach((line, i) => {
  console.log(`${(i + 1).toString().padStart(3, '0')}: ${line}`);
});

console.log('\n\n✅ Extracción completada');
console.log(`📁 Archivo completo guardado en: ${outputPath}`);
console.log('\nPróximo paso: Analizar el formato y crear script de actualización\n');

process.exit(0);
