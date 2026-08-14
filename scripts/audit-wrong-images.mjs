// audit-wrong-images.mjs — busca imágenes correctas para los 24 productos reportados
import { readFileSync } from 'fs';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

async function searchSilk(query) {
  const url = `https://silkperfumes.cl/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=3`;
  try {
    const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return null;
    const data = await r.json();
    const products = data?.resources?.results?.products || [];
    for (const p of products) {
      const title = p.title?.toLowerCase() || '';
      const img = p.featured_image?.url || p.image;
      if (img) return { title: p.title, url: `https:${img.replace(/^https?:/, '')}`.split('?')[0] };
    }
    return null;
  } catch { return null; }
}

async function searchPerfumenz(query) {
  const url = `https://www.perfumenz.co.nz/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=3`;
  try {
    const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return null;
    const data = await r.json();
    const products = data?.resources?.results?.products || [];
    for (const p of products) {
      const img = p.featured_image?.url || p.image;
      if (img) return { title: p.title, url: `https:${img.replace(/^https?:/, '')}`.split('?')[0] };
    }
    return null;
  } catch { return null; }
}

const TARGETS = [
  // [product name in Firestore, search query, preferred source]
  ['RASASI HAWAS FOR HER 100ML', 'rasasi hawas for her', 'silk'],
  ['PARIS CORNER MARSHMALLOW BLUSH 100ML', 'paris corner marshmallow blush', 'silk'],
  ['MAISON ALHAMBRA SENSUAL VANILLA 80ML', 'maison alhambra sensual vanilla', 'silk'],
  ['MAISON ALHAMBRA DELILAH 100ML', 'maison alhambra delilah edp', 'silk'],
  ['MAISON ALHAMBRA COMO MOISELLE 100ML', 'maison alhambra como moiselle', 'silk'],
  ['LATTAFA HAYAATI FLORENCE 100ML', 'lattafa hayaati florence', 'silk'],
  ['ARMAF ODYSSEY MARSHMALLOW 100ML', 'armaf odyssey marshmallow', 'silk'],
  ['AL WATANIAH THAHAANI 100ML', 'al wataniah thahaani', 'silk'],
  ['RAYHAAN TROPICAL VIBES 100ML', 'rayhaan tropical vibes', 'silk'],
  ['RAYHAAN ELIXIR 100ML', 'rayhaan elixir', 'silk'],
  ['RASASI HAWAS ELIXIR 100ML', 'rasasi hawas elixir', 'silk'],
  ['MAISON ALHAMBRA OPULENCE LEATHER 100ML', 'maison alhambra opulence leather', 'silk'],
  ['LATTAFA KHAMRAH 100ML', 'lattafa khamrah edp 100', 'silk'],
  ['LATTAFA KHAMRAH DUKHAN 100ML', 'lattafa khamrah dukhan', 'silk'],
  ['LATTAFA HAYAATI GOLD ELIXIR 100ML', 'lattafa hayaati gold elixir', 'silk'],
  ['LATTAFA HAYAATI 100ML', 'lattafa hayaati edp 100', 'silk'],
  ['LATTAFA HAYAATI AL MALEKY 100ML', 'lattafa hayaati al maleky', 'silk'],
  ['EMPER PHANTOM MY HERO 100ML', 'emper phantom my hero', 'silk'],
  ['ARMAF ODYSSEY MANDARIN SKY VINTAGE 100ML', 'armaf odyssey mandarin sky vintage', 'silk'],
  ['ARMAF CLUB DE NUIT PRECIEUX I 55ML', 'armaf club de nuit precieux', 'silk'],
  ['AL WATANIAH WATANI NOIR 100ML', 'al wataniah watani noir', 'silk'],
  ['AL WATANIAH ROSE MYSTERY INTENSE 100ML', 'al wataniah rose mystery intense', 'silk'],
  ['AL WATANIAH KENZ AL MALIK 100ML', 'al wataniah kenz al malik', 'silk'],
  ['AL WATANIAH AL LAYL 100ML', 'al wataniah al layl', 'silk'],
];

async function main() {
  const results = [];
  for (const [nombre, query, source] of TARGETS) {
    let found = null;
    if (source === 'silk') found = await searchSilk(query);
    if (!found) found = await searchPerfumenz(query);
    if (!found && source === 'silk') found = await searchPerfumenz(query);
    
    results.push({ nombre, query, found });
    if (found) {
      console.log(`✅ ${nombre}`);
      console.log(`   [${found.title}]`);
      console.log(`   ${found.url}`);
    } else {
      console.log(`❌ ${nombre}`);
    }
    console.log();
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Print as JS map for the fix script
  console.log('\n=== MAPA PARA FIX SCRIPT ===');
  for (const { nombre, found } of results) {
    if (found) console.log(`  '${nombre}': '${found.url}',`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
