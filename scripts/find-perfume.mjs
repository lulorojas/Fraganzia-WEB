import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('scripts/perfumes-review.json', 'utf8'));
const r = data.filter(p => p.nombre.toUpperCase().includes('SAGITARIO') || p.marca?.toUpperCase().includes('FRENCH'));
console.log(JSON.stringify(r, null, 2));
