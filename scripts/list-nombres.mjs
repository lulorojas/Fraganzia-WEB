import { readFileSync, writeFileSync } from 'fs';
const p = JSON.parse(readFileSync('scripts/perfumes-list.json', 'utf8'));
const nombres = p.map(x => x.marca + ' || ' + x.nombre);
writeFileSync('scripts/nombres.txt', nombres.join('\n'));
console.log('Total:', p.length);
