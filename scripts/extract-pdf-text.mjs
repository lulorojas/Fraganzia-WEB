// extract-pdf-text.mjs — Extrae el texto del PDF para correlacionar orden de productos con imágenes
import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pdfParseModule = require(join(__dirname, '..', 'node_modules', 'pdf-parse', 'dist', 'pdf-parse', 'cjs', 'index.cjs'));
const { PDFParse } = pdfParseModule;

const pdfBuf = readFileSync(join(__dirname, '..', 'CATALOGO ARABES MAYORISTA 13-07.pdf'));

const data = await new PDFParse().parse(pdfBuf);

// Guardar el texto completo para análisis
writeFileSync(join(__dirname, 'pdf-text.txt'), data.text, 'utf8');
console.log(`Páginas: ${data.numpages}`);
console.log(`Total chars: ${data.text.length}`);
console.log('\nPrimeros 3000 chars:');
console.log(data.text.slice(0, 3000));
