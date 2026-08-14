// find-fragrantica-ids.mjs — prueba IDs del CDN fimgs.net para encontrar imágenes
// Los IDs de Fragrantica son numéricos y subiendo. Busca por HEAD request (200 = existe).
// Rasasi Hawas For Her: ~63000-70000 (lanzado 2020)
// Bharara Chocolate: ~70000-90000 (lanzado ~2021-2023)
// AL WATANIAH (no comunes en Fragrantica, salvo que estén listados)

// Estrategia: para Rasasi y Bharara buscar rangos específicos
// Para AL WATANIAH: usar otras fuentes

async function checkId(id) {
  const url = `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg`;
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
    return res.status === 200;
  } catch {
    return false;
  }
}

// Scan basado en el nombre del perfume en Fragrantica
// Necesitamos encontrar el ID exacto para:
// - Rasasi Hawas For Her (https://www.fragrantica.com/perfume/Rasasi/Hawas-For-Her-XXXXX.html)
// - Bharara Chocolate / Bharara Beauty Chocolate

// Usar la búsqueda de Fragrantica por nombre
async function searchFragrantica(query) {
  // Fragrantica tiene una API de búsqueda interna (no oficial)
  const url = `https://www.fragrantica.com/search/?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(10000)
    });
    const html = await res.text();
    // Buscar links de tipo /perfume/Rasasi/Hawas-For-Her-NNNNN.html
    const matches = html.match(/\/perfume\/[^"]+?-(\d{4,6})\.html/g) || [];
    const ids = [...new Set(matches.map(m => parseInt(m.match(/(\d{4,6})\.html/)[1])))];
    return { html: html.substring(0, 2000), ids };
  } catch (e) {
    return { html: '', ids: [] };
  }
}

console.log('Buscando IDs en Fragrantica...\n');

// Buscar Rasasi Hawas For Her
console.log('--- Rasasi Hawas For Her ---');
const r1 = await searchFragrantica('rasasi hawas for her');
if (r1.ids.length > 0) {
  console.log('IDs encontrados:', r1.ids.slice(0, 20));
  // Verificar cuál es la imagen correcta
  for (const id of r1.ids.slice(0, 10)) {
    const ok = await checkId(id);
    if (ok) console.log(`  ✅ ID ${id} → https://fimgs.net/mdimg/perfume/375x500.${id}.jpg`);
  }
} else {
  console.log('No encontrado por búsqueda');
}

// Buscar Bharara Chocolate
console.log('\n--- Bharara Chocolate ---');
const r2 = await searchFragrantica('bharara chocolate');
if (r2.ids.length > 0) {
  console.log('IDs encontrados:', r2.ids.slice(0, 20));
  for (const id of r2.ids.slice(0, 10)) {
    const ok = await checkId(id);
    if (ok) console.log(`  ✅ ID ${id} → https://fimgs.net/mdimg/perfume/375x500.${id}.jpg`);
  }
} else {
  console.log('No encontrado por búsqueda');
}

// Buscar AL WATANIAH products
const wataniahProducts = [
  'al wataniah watani noir',
  'al wataniah sultan al lail', 
  'al wataniah kenz al malik',
  'al wataniah rose mystery intense',
  'al wataniah sabah al ward',
  'al wataniah thahaani',
];

for (const q of wataniahProducts) {
  console.log(`\n--- ${q.toUpperCase()} ---`);
  const r = await searchFragrantica(q);
  if (r.ids.length > 0) {
    console.log('IDs encontrados:', r.ids.slice(0, 10));
    for (const id of r.ids.slice(0, 5)) {
      const ok = await checkId(id);
      if (ok) console.log(`  ✅ ID ${id} → https://fimgs.net/mdimg/perfume/375x500.${id}.jpg`);
    }
  } else {
    console.log('No encontrado');
  }
}
