import { readFileSync, writeFileSync } from 'fs';

const csv = readFileSync('scripts/catalogo-actual.csv', 'utf8');
const lines = csv.split('\n').slice(1).filter(l => l.trim());

const perfumes = lines.map(l => {
  // Parse CSV con campos entre comillas
  const parts = [];
  let current = '';
  let inQuote = false;
  for (const ch of l) {
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { parts.push(current); current = ''; }
    else { current += ch; }
  }
  parts.push(current);
  return {
    marca: parts[0],
    nombre: parts[1],
    genero: parts[2],
    familia: parts[3],
    notasSalida: parts[6] ? parts[6].split(';').map(n => n.trim()).filter(Boolean) : [],
    notasCorazon: parts[7] ? parts[7].split(';').map(n => n.trim()).filter(Boolean) : [],
    notasFondo: parts[8] ? parts[8].split(';').map(n => n.trim()).filter(Boolean) : [],
  };
}).filter(p => p.nombre);

console.log('Total parseados:', perfumes.length);
perfumes.slice(0, 5).forEach(p => {
  console.log(`\n${p.nombre}`);
  console.log('  Salida:', p.notasSalida.join(', '));
  console.log('  Corazon:', p.notasCorazon.join(', '));
  console.log('  Fondo:', p.notasFondo.join(', '));
});

const sinNotasCompletas = perfumes.filter(p => p.notasSalida.length === 0 || p.notasCorazon.length === 0 || p.notasFondo.length === 0);
console.log('\nSin pirámide completa:', sinNotasCompletas.length);

writeFileSync('scripts/perfumes-list.json', JSON.stringify(perfumes, null, 2));
console.log('Guardado scripts/perfumes-list.json');
