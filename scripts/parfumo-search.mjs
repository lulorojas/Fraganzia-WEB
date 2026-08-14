// parfumo-search.mjs — search parfumo for products not found by direct slug
import { createWriteStream } from 'fs';
import { stdout } from 'process';

const queries = [
  { q: 'club de nuit bling armaf', label: 'CLUB DE NUIT BLING' },
  { q: 'odyssey dubai chocolat armaf', label: 'ODYSSEY DUBAI CHOCOLAT' },
  { q: 'eter desert breeze armaf', label: 'ETER DESERT BREEZE' },
  { q: 'ameerat al arab prive rose lattafa', label: 'AMEERAT AL ARAB PRIVE ROSE' },
  { q: 'genesis gemini french avenue', label: 'GENESIS GEMINI' },
  { q: 'rose seduction vip femme maison alhambra', label: 'ROSE SEDUCTION VIP FEMME' },
];

async function searchParfumo(query) {
  const url = `https://www.parfumo.com/Search?q=${encodeURIComponent(query)}`;
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(10000),
    });
    const html = await r.text();
    // Extract product page links like /Perfumes/Brand/slug
    const links = [...html.matchAll(/href="(\/Perfumes\/[^"]+)"/g)].map(m => m[1]);
    const unique = [...new Set(links)].filter(l => !l.includes('?') && l.split('/').length === 4);
    return unique.slice(0, 5);
  } catch (e) {
    return [`Error: ${e.message}`];
  }
}

for (const { q, label } of queries) {
  console.log(`\n${label}`);
  const links = await searchParfumo(q);
  links.forEach(l => console.log('  https://www.parfumo.com' + l));
}
