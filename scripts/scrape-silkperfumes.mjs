// scrape-silkperfumes.mjs — usa la API de búsqueda de Shopify para encontrar
// imágenes reales de los 28 productos sin imagen en silkperfumes.cl
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

// Mapeo manual de URLs exactas conocidas (de scraping de páginas de producto)
const KNOWN_URLS = {
  'ARMAF CLUB DE NUIT INTENSE 105ML':
    'https://silkperfumes.cl/cdn/shop/products/armaf-club-de-nuit-intense-man-edt-105ml-Silk-Perfumes1.jpg',
  'ARMAF CLUB DE NUIT ICONIC 105ML':
    'https://silkperfumes.cl/cdn/shop/products/armaf-club-de-nuit-iconic-edp-105ml.jpg',
  'ARMAF CLUB DE NUIT IMPERIALE 105ML':
    'https://silkperfumes.cl/cdn/shop/products/armaf-club-de-nuit-imperiale-edp-105ml-Silk-Perfumes.jpg',
  'ARMAF CLUB DE NUIT WOMAN 105ML':
    'https://silkperfumes.cl/cdn/shop/products/armaf-club-de-nuit-women-edp-105ml-Silk-Perfumes.jpg',
};

async function searchProduct(query) {
  const url = `https://silkperfumes.cl/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=5`;
  try {
    const r = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const products = data?.resources?.results?.products || [];
    if (!products.length) return null;
    // Devuelve la imagen del primer resultado
    const img = products[0]?.featured_image?.url || products[0]?.image;
    return img ? `https:${img.replace(/^https?:/, '')}` : null;
  } catch (e) {
    return null;
  }
}

async function getProductJson(handle) {
  const url = `https://silkperfumes.cl/products/${handle}.json`;
  try {
    const r = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const img = data?.product?.images?.[0]?.src;
    return img ? img.replace(/\?.*$/, '') : null;
  } catch (e) {
    return null;
  }
}

function buildSearchQuery(nombre) {
  // Eliminar volumen al final (100ML, etc.)
  return nombre.replace(/\s+\d+ML$/i, '').trim();
}

async function main() {
  const snap = await db.collection('perfumes').get();
  const sinImagen = snap.docs.filter(d => !(d.data().imagenes?.length));
  console.log(`${sinImagen.length} productos sin imagen.\n`);

  let fixed = 0;
  for (const doc of sinImagen) {
    const { nombre } = doc.data();

    // 1. Usar URL conocida si existe
    if (KNOWN_URLS[nombre]) {
      await doc.ref.update({ imagenes: [KNOWN_URLS[nombre]] });
      console.log(`✅ KNOWN  ${nombre}`);
      fixed++;
      continue;
    }

    // 2. Buscar vía Shopify suggest API
    const query = buildSearchQuery(nombre);
    const imgUrl = await searchProduct(query);

    if (imgUrl) {
      // Limpiar query params de versión, dejar URL limpia
      const cleanUrl = imgUrl.split('?')[0];
      await doc.ref.update({ imagenes: [cleanUrl] });
      console.log(`✅ SEARCH ${nombre}\n   → ${cleanUrl}`);
      fixed++;
    } else {
      console.log(`❌ NO IMG  ${nombre}`);
    }

    // Pausa breve para no saturar la API
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nFijados: ${fixed} | Sin imagen: ${sinImagen.length - fixed}`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
