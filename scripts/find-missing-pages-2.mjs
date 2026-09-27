// scripts/find-missing-pages-2.mjs
// Igual que find-missing-pages.mjs pero para la segunda tanda de 21 perfumes
// que quedaron sin foto tras limpiar las imágenes equivocadas (dupes).
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FALTANTES = [
  'MAISON ALHAMBRA B.A.D FEMME 100ML',
  'PARIS CORNER TASKEEN LACTEA DIVINA 100ML',
  'MAISON ALHAMBRA YOUR TOUCH FOR MEN 100ML',
  'MAISON ALHAMBRA FORTNIGHT 100ML',
  'MAISON ALHAMBRA KINGSMAN 100ML',
  'FRAGRANCE WORLD JUST ASWAD 100ML',
  'PARIS CORNER KHAIR FELICITY 100ML',
  'MAISON ALHAMBRA YOUR TOUCH AMBER 100ML',
  'MAISON ALHAMBRA DARK DOOR INTENSE 100ML',
  'FRAGRANCE WORLD HARMONY CODE ABSOLUTE 100ML',
  'PARIS CORNER TASKEEN 100ML',
  'PARIS CORNER KHAIR FUSION 100ML',
  'MAISON ALHAMBRA DARK DOOR SPORT 100ML',
  'MAISON ALHAMBRA GALACTIC MEN INTENSE 100ML',
  'FRAGRANCE WORLD MIDORI 100ML',
  'FRENCH AVENUE PINNACE ORYN 100ML',
  'MAISON ALHAMBRA YOUR TOUCH LEATHER 100ML',
  'FRENCH AVENUE TROPICAL KISS 80ML',
  'MAISON ALHAMBRA YOUR TOUCH INTENSE 100ML',
  'MAISON ALHAMBRA B.A.D HOMME 100ML',
  'MAISON ALHAMBRA GALACTIC MEN ELIXIR 100ML',
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

console.log('=== Páginas encontradas para los faltantes (tanda 2) ===');
for (const nombre of FALTANTES) {
  console.log(`${resultado[nombre] ?? '???'} <- ${nombre}`);
}

writeFileSync(join(__dirname, 'missing-pages-2.json'), JSON.stringify({ resultado, ordenEnPagina }, null, 2), 'utf8');
console.log('\nGuardado: scripts/missing-pages-2.json');
