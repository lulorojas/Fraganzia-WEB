// search-shopify-images.mjs — busca imágenes en tiendas Shopify para los productos sin imagen
const STORES = [
  'silkperfumes.cl',
  'perfumenz.co.nz',
  'attoperfumes.com.co',
  'dxbperfume.co.uk',
];

const PRODUCTS = [
  { key: 'KENZ_AL_MALIK',         queries: ['kenz al malik', 'al wataniah kenz'] },
  { key: 'ROSE_MYSTERY',          queries: ['rose mystery intense', 'al wataniah rose mystery'] },
  { key: 'WATANI_NOIR',           queries: ['watani noir', 'al wataniah watani noir'] },
  { key: 'SULTAN_AL_LAIL',        queries: ['sultan al lail', 'al wataniah sultan'] },
  { key: 'BHARARA_CHOCOLATE',     queries: ['bharara chocolate', 'bharara choco'] },
  { key: 'SABAH_AL_WARD',         queries: ['sabah al ward', 'al wataniah sabah'] },
  { key: 'THAHAANI',              queries: ['thahaani', 'al wataniah thahaani', 'tahaani'] },
  { key: 'RASASI_HAWAS_FOR_HER',  queries: ['hawas for her', 'rasasi hawas her'] },
];

const results = {};

for (const { key, queries } of PRODUCTS) {
  console.log(`\n🔍 Buscando: ${key}`);
  let found = false;

  for (const store of STORES) {
    for (const q of queries) {
      if (found) break;
      const url = `https://${store}/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=5`;
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; perfume-search/1.0)' },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const products = data?.resources?.results?.products || [];
        if (products.length === 0) continue;

        for (const p of products) {
          const title = (p.title || '').toUpperCase();
          const queryUpper = q.toUpperCase();
          // Verificar si alguna palabra clave del query coincide con el título
          const words = queryUpper.split(' ').filter(w => w.length > 3);
          const matched = words.filter(w => title.includes(w)).length;
          if (matched >= 2 || title.includes(queryUpper.split(' ')[0])) {
            const imgUrl = p.featured_image?.url || p.image?.src;
            if (imgUrl) {
              const cleanUrl = imgUrl.split('?')[0];
              results[key] = { store, title: p.title, url: cleanUrl };
              console.log(`  ✅ ${store}: "${p.title}"`);
              console.log(`     ${cleanUrl}`);
              found = true;
              break;
            }
          }
        }
      } catch (e) {
        // ignorar timeout/error
      }
    }
    if (found) break;
  }

  if (!found) {
    console.log(`  ❌ No encontrado en ninguna tienda`);
  }
}

console.log('\n\n=== RESUMEN ===');
for (const [key, val] of Object.entries(results)) {
  console.log(`${key}: ${val.url}`);
}
const missing = PRODUCTS.filter(p => !results[p.key]).map(p => p.key);
if (missing.length) {
  console.log(`\nSin imagen: ${missing.join(', ')}`);
}
