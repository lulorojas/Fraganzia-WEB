import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('scripts/perfumes-review.json', 'utf8'));
const marcas = {};
data.forEach(p => { marcas[p.marca] = (marcas[p.marca] || 0) + 1; });
const sorted = Object.entries(marcas).sort((a,b) => b[1]-a[1]);
sorted.forEach(([m,n]) => console.log(`${n.toString().padStart(3)} ${m}`));
console.log('\nTotal:', data.length);
