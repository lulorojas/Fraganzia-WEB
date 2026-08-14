// extract-catalog-27-simple.mjs — Extrae texto del catálogo 27-07
import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url));
const pdfParseModule = require(join(__dirname, '..', 'node_modules', 'pdf-parse', 'dist', 'pdf-parse', 'cjs', 'index.cjs'));
const { PDFParse } = pdfParseModule;

console.log('📄 Leyendo catálogo 27-07...\n');

const pdfBuf = readFileSync(join(__dirname, '..', 'CATALOGO ARABES MAYORISTA 27-07.pdf'));
const data = await new PDFParse().parse(pdfBuf);

// Guardar texto completo
const outputPath = join(__dirname, 'catalogo-27-07-text.txt');
writeFileSync(outputPath, data.text, 'utf8');

console.log(`✅ Texto extraído y guardado en: ${outputPath}`);
console.log(`📊 Páginas: ${data.numpages}`);
console.log(`📝 Total caracteres: ${data.text.length}`);
console.log('\n📋 PRIMERAS 100 LÍNEAS:');
console.log('='.repeat(70));

const lines = data.text.split('\n').filter(l => l.trim());
lines.slice(0, 100).forEach((line, i) => {
  console.log(`${String(i + 1).padStart(3, '0')}: ${line}`);
});

// Buscar precios
console.log('\n\n💰 LÍNEAS CON PRECIOS (formato $XX):');
console.log('='.repeat(70));
const precioLines = lines.filter(l => /\$\s*\d+/.test(l) || /USD\s*\d+/i.test(l));
precioLines.slice(0, 50).forEach((line, i) => {
  console.log(`${String(i + 1).padStart(3, '0')}: ${line}`);
});

// Buscar Teriaq específicamente
console.log('\n\n🔍 LÍNEAS CON "TERIAQ":');
console.log('='.repeat(70));
const teriaqLines = lines.filter(l => /teriaq/i.test(l));
teriaqLines.forEach((line, i) => {
  console.log(`${String(i + 1).padStart(3, '0')}: ${line}`);
});

console.log(`\n\n✅ Archivo completo guardado: ${outputPath}\n`);
