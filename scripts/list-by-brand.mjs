import { readFileSync } from 'fs';
const d = JSON.parse(readFileSync('scripts/perfumes-review.json', 'utf8'));
const byBrand = {};
d.forEach(p => {
  if (!byBrand[p.marca]) byBrand[p.marca] = [];
  byBrand[p.marca].push(p.nombre);
});
Object.entries(byBrand).forEach(([marca, nombres]) => {
  console.log('\n=== ' + marca + ' ===');
  nombres.forEach(n => console.log(' ' + n));
});
