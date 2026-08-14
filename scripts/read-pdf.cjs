// Extrae texto del PDF y busca menciones de los 12 productos sin imagen
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const TARGETS = [
  'EMPER UOMO INTENSE', 'EMPER DONNA INTENSE', 'EMPER MANDORA',
  'EMPER BLUE STALLION', 'EMPER PHANTOM MY HERO',
  'LATTAFA FAKHAR ROSE', 'LATTAFA MAAHIR GOLD', 'LATTAFA SEHR MAGIC',
  'FRENCH AVENUE GENESIS GEMINI', 'FRENCH AVENUE AETHER',
  'MAISON ALHAMBRA ROSE SEDUCTION VIP',
  'BHARARA MAST', 'L\'AFFAIR SUMMER SHOCKWAVE',
];

const buf = fs.readFileSync(path.join(__dirname, '..', 'CATALOGO ARABES MAYORISTA 13-07.pdf'));

async function main() {
const data = await pdfParse(buf);

const lines = data.text.split('\n').map(l => l.trim()).filter(Boolean);

// Print all lines containing any target keyword
const upper = lines.map(l => l.toUpperCase());
const found = {};
for (const target of TARGETS) {
  const matches = lines.filter((_, i) => upper[i].includes(target));
  if (matches.length > 0) found[target] = matches;
}

if (Object.keys(found).length === 0) {
  console.log('Ningún producto de los 12 encontrado en el PDF.\n');
  console.log('Primeras 200 líneas del PDF:');
  lines.slice(0, 200).forEach(l => console.log(l));
} else {
  for (const [k, v] of Object.entries(found)) {
    console.log(`\n✅ ${k}:`);
    v.forEach(l => console.log('   ' + l));
  }
}
}
