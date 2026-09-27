// extract-pdf-text-18-09.mjs — Extrae el texto del PDF del proveedor 18-09
import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pdfParseModule = require(join(__dirname, '..', 'node_modules', 'pdf-parse', 'dist', 'pdf-parse', 'cjs', 'index.cjs'));
const { PDFParse } = pdfParseModule;

const pdfBuf = readFileSync(join(__dirname, '..', 'CATALOGO ARABES MAYORISTA 18-09.pdf'));

const parser = new PDFParse({ data: pdfBuf });
const data = await parser.getText();
await parser.destroy();

writeFileSync(join(__dirname, 'pdf-text-18-09.txt'), data.text, 'utf8');
console.log(`Páginas: ${data.total}`);
console.log(`Total chars: ${data.text.length}`);
console.log('\nPrimeros 3000 chars:');
console.log(data.text.slice(0, 3000));
