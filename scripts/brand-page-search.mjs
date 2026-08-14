// brand-page-search.mjs — fetch parfumo brand pages and search for products
import { stdout } from 'process';

async function fetchBrandPage(brand, page = 1) {
  const url = `https://www.parfumo.com/Brands/${brand}?page=${page}`;
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) return null;
  return r.text();
}

const keywords = {
  Armaf: ['bling', 'chocolat', 'eter', 'desert'],
  Lattafa: ['asdaaf', 'prive rose', 'ameerat'],
  'French-Avenue': ['gemini'],
  'Maison-Alhambra': ['seduction vip'],
};

for (const [brand, terms] of Object.entries(keywords)) {
  console.log(`\n=== ${brand} ===`);
  let found = false;
  for (let pg = 1; pg <= 5; pg++) {
    const html = await fetchBrandPage(brand, pg);
    if (!html) { console.log(`  Page ${pg}: 404`); break; }
    const links = [...html.matchAll(/href="(\/Perfumes\/[^"]+)"/g)].map(m => m[1]);
    const unique = [...new Set(links)];
    const matched = unique.filter(l => terms.some(t => l.toLowerCase().includes(t.toLowerCase())));
    if (matched.length > 0) {
      matched.forEach(l => console.log(`  ✅ https://www.parfumo.com${l}`));
      found = true;
    }
    // Check if there are more pages
    if (!html.includes(`page=${pg + 1}`)) break;
  }
  if (!found) console.log(`  Nothing found for terms: ${terms.join(', ')}`);
}
