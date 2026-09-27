// scripts/find-missing-pages-3.mjs
// Igual que find-missing-pages-2.mjs pero para los 14 perfumes que quedaron
// sin foto tras limpiar las fotos de "producto equivocado, misma marca".
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FALTANTES = [
  'LATTAFA ATLAS CANYON 55ML',
  'KHADLAJ ISLAND DREAMS 100ML',
  'LATTAFA ATLAS GLACIAL VALLEY 55ML',
  'LATTAFA AL NASHAMA CAPRICE 100ML',
  'ARMAF ODYSSEY SODA POP 100ML',
  'RASASI HAWAS VERDE 100ML',
  'RIIFFS FREEZE 100ML',
  'LATTAFA NAJDIA INTENSE 100ML',
  'RASASI HAWAS DIVA 100ML',
  'ARMAF DUBAI NIGHTS MIDNIGHT 100ML',
  'RAYHAAN PACIFIC AURA 100ML',
  'LATTAFA MUSAMAM BLACK INTENSE 100ML',
  'LATTAFA QAED AL FURSAN UNTAMED 90ML',
  'RAYHAAN AQUATICA 100ML',
].map((s) => s.toUpperCase());

const JUNK_LINE = /^(MODELO\s*PRECIO|MODELO$|PRECIO$|IMAGEN\b.*|@Franzebi\.imports.*|Franzebi Imports$|11\s?2872\s?0954$|--\s*\d+\s*of\s*\d+\s*--$)$/i;
const GENDER_MARK = {
  'FRAGANCIAS MASCULINAS': 'Masculino',
  'FRAGANCIAS FEMENINAS': 'Femenino',
  'FRAGANCIAS KIDS': 'Kids',
};

const text = readFileSync(join(__dirname, 'pdf-text-18-09.txt'), 'utf8');
const paginas = text.split(/--\s*\d+\s*of\s*\d+\s*--/i);

const resultado = {};
const ordenEnPagina = {};

paginas.forEach((pagina, idx) => {
  const pageNum = idx + 1;
  const lines = pagina.split('\n').map((l) => l.trim());
  let buffer = [];
  const nombresPagina = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
    if (!line) { buffer = []; continue; }
    if (GENDER_MARK[line] || JUNK_LINE.test(line)) { buffer = []; continue; }

    if (/\bUSD\b/i.test(line)) {
      const combined = [...buffer, line].join(' ').replace(/\s+/g, ' ').trim();
      const m = combined.match(/^(.*?)\s*(\d+)\s*ML\s+(\d+)\s*USD$/i);
      buffer = [];
      if (!m) continue;
      const [, nombreBase, volumenML] = m;
      const nombreCompleto = `${nombreBase.trim()} ${volumenML}ML`.toUpperCase();
      nombresPagina.push(nombreCompleto);
      if (FALTANTES.includes(nombreCompleto)) {
        resultado[nombreCompleto] = pageNum;
      }
    } else {
      buffer.push(line);
    }
  }
  if (nombresPagina.length) ordenEnPagina[pageNum] = nombresPagina;
});

console.log('=== Páginas encontradas para los faltantes (tanda 3) ===');
for (const nombre of FALTANTES) {
  console.log(`${resultado[nombre] ?? '???'} <- ${nombre}`);
}

writeFileSync(join(__dirname, 'missing-pages-3.json'), JSON.stringify({ resultado, ordenEnPagina }, null, 2), 'utf8');
console.log('\nGuardado: scripts/missing-pages-3.json');
