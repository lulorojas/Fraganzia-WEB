// scripts/find-missing-pages.mjs
// Determina en qué página del PDF 18-09 está cada producto de una lista dada,
// para poder extraer la imagen exacta de esa página.
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FALTANTES = [
  'FRAGRANCE WORLD LA UNO MILLION ROYAL 100ML',
  'ZIMAYA FATIMA PINK 100ML',
  'PENDORA SCENTS SAVIOUR 100ML',
  'FRAGRANCE WORLD IS EDP 75ML',
  'PARIS CORNER CREAMY BISCUIT 100ML',
  'MAISON ALHAMBRA YOUR TOUCH FOR WOMEN 100ML',
  "FRAGRANCE WORLD IS L'AMOUR 75ML",
  'FRAGRANCE WORLD IS INTENSE 75ML',
  'FRAGRANCE WORLD BUBBLY 100ML',
  'AFNAN TURATHI BROWN 90ML',
  'PENDORA SCENTS MIDNIGHT IN PARIS 100ML',
  'MAISON ALHAMBRA SCEPTRE OCEANA 100ML',
  'MAISON ALHAMBRA PHILOS OPUS NOIR 100ML',
  'MAISON ALHAMBRA GLACIER LE NOIR 100ML',
  'PENDORA SCENTS VERACIOUS BLUE FOR HIM 100ML',
  'PARIS CORNER MANGO PUNCH 100ML',
  'LATTAFA HABIK PINK 100ML',
  'FRAGRANCE WORLD IMPERIUM ABSOLU 100ML',
  'MAISON ALHAMBRA SCEPTRE AMAZONITE 100ML',
  'AFNAN RARE TIFFANY 100ML',
  'PARIS CORNER PEAR POTION 100ML',
  'LATTAFA RAMZ GOLD 100ML',
  'MAISON ALHAMBRA CORAL BLUSH 80ML',
  'MAISON ALHAMBRA TORO POUR HOMME 100ML',
  'FRAGRANCE WORLD EAU DE SPICE EXTREME MARK & VICTOR 100ML',
  'FRAGRANCE WORLD IMPERIUM INTENSE 100ML',
  'FRAGRANCE WORLD VERSUS DIAMOND BLEU 100ML',
  'RAYHAAN VALHALLA 100ML',
  'FRAGRANCE WORLD LA UNO MILLION ELIXIR 100ML',
  'AFNAN RARE CARBON 100ML',
  'ARMAF DUNESCAPE DUBAI EXTRAIT 100ML',
  'MAISON ALHAMBRA SO CANDID POUR FEMME 80ML',
  'MAISON ALHAMBRA SO CANDID POUR HOMME 100ML',
  'LATTAFA ASDAAF RANEEN 80ML',
  'LATTAFA HABIK 100ML',
  'PARIS CORNER VOUX ZINGY 100ML',
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
const ordenEnPagina = {}; // pageNum -> [nombres en orden de aparicion]

paginas.forEach((pagina, idx) => {
  const pageNum = idx + 1; // paginas[0] = pagina 1, etc.
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

console.log('=== Páginas encontradas para los faltantes ===');
for (const nombre of FALTANTES) {
  console.log(`${resultado[nombre] ?? '???'} <- ${nombre}`);
}

writeFileSync(join(__dirname, 'missing-pages.json'), JSON.stringify({ resultado, ordenEnPagina }, null, 2), 'utf8');
console.log('\nGuardado: scripts/missing-pages.json');
