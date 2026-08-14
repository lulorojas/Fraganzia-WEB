// fix-reported-wrong.mjs — Corrige las 24 imágenes mal reportadas por el usuario
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

// URLs correctas encontradas via Shopify suggest API de silkperfumes / perfumenz
const FIXES = {
  // Parfumo mostraba imagen de KAYALI YUM BOUJEE MARSHMALLOW (wrong)
  'PARIS CORNER MARSHMALLOW BLUSH 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/paris-corner-marshmallow-blush-edp-100ml-Silk-Perfumes.png',

  // Parfumo mostraba TOM FORD VANILLA SEX (wrong)
  'MAISON ALHAMBRA SENSUAL VANILLA 80ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/maison-alhambra-sensual-vanilla-edp-80ml-silk-perfumes-1.png',

  // Silkperfumes tenía imagen de body spray 150ml (wrong)
  'MAISON ALHAMBRA DELILAH 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/maison-alhambra-delilah-pour-femme-edp-30ml-Silk-Perfumes.png',

  // Parfumo mostraba CHANEL COCO MADEMOISELLE (wrong)
  'MAISON ALHAMBRA COMO MOISELLE 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/maison-alhambra-como-moiselle-edp-100ml-Silk-Perfumes.png',

  // Imagen genérica de India (momperfume.in) — wrong
  'LATTAFA HAYAATI FLORENCE 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/lattafa-hayaati-florence-edp-100ml-Silk-Perfumes.png',

  // Parfumo mostraba KAYALI YUM BOUJEE MARSHMALLOW (wrong)
  'ARMAF ODYSSEY MARSHMALLOW 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/armaf-odyssey-marshmallow-gourmand-edition-edp-100ml-Silk-Perfumes.png',

  // Gamma con imagen genérica de Rayhaan (wrong)
  'RAYHAAN TROPICAL VIBES 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/rayhaan-tropical-vibe-100ml-Silk-Perfumes.png',

  // Gamma con "Untitled Design" image (wrong)
  'RAYHAAN ELIXIR 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/rayhaan-elixir-100ml-Silk-Perfumes.png',

  // Parfumo mostraba JEAN PAUL GAULTIER LE MALE ELIXIR (wrong)
  'RASASI HAWAS ELIXIR 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/rasasi-hawas-elixir-men-edp-100-ml-silk-perfumes.png',

  // Parfumo mostraba TOM FORD OMBRE LEATHER (wrong)
  'MAISON ALHAMBRA OPULENCE LEATHER 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/MAHB185.png',

  // Parfumo mostraba KHAMRAH QAHWA en vez de KHAMRAH (wrong — distinto producto)
  'LATTAFA KHAMRAH 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/lattafa-khamrah-edp-100ml-Silk-Perfumes-1.png',

  // Parfumo mostraba KHAMRAH QAHWA en vez de KHAMRAH DUKHAN (wrong)
  'LATTAFA KHAMRAH DUKHAN 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/lattafa-khamrah-dukhan-edp-100ml-Silk-Perfumes.png',

  // Perfumenz tenía imagen de "lattafa-haya" (distinto producto)
  'LATTAFA HAYAATI GOLD ELIXIR 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/lattafa-hayaati-gold-elixir-edp-100ml-Silk-Perfumes-1.png',

  // Parfumo mostraba NAJDIA (distinto producto Lattafa)
  'LATTAFA HAYAATI 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/products/lattafa-hayaati-men-edp-100ml-Silk-Perfumes.jpg',

  // Perfumenz tenía imagen de "lattafa-haya" (distinto producto)
  'LATTAFA HAYAATI AL MALEKY 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/lattafa-hayaati-al-maleky-edp-100ml-Silk-Perfumes.png',

  // Parfumo mostraba BY KILIAN BLACK PHANTOM (wrong)
  'EMPER PHANTOM MY HERO 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/perfume-phantom-my-hero-edp-100ml-unisex.jpg',

  // eliteperfumes.cl imagen (podría ser correcta pero mejor usar perfumenz)
  'ARMAF ODYSSEY MANDARIN SKY VINTAGE 100ML':
    'https://cdn.shopify.com/s/files/1/0259/7733/files/armaf-odyssey-mandarin-sky-vintage.png',

  // Silkperfumes tenía imagen de PRECIEUX IV (wrong — es el IV, no el I)
  'ARMAF CLUB DE NUIT PRECIEUX I 55ML':
    'https://cdn.shopify.com/s/files/1/0259/7733/files/armaf-club-de-nuit-precieux.png',

  // Parfumo mostraba KAYAAN CLASSIC Al Wataniah (wrong — distinto producto)
  'AL WATANIAH AL LAYL 100ML':
    'https://cdn.shopify.com/s/files/1/0674/9614/9209/files/Disenosintitulo-2025-11-03T163548.058.png',

  // --- Los 5 sin imagen correcta encontrada: se limpian ---
  // Silkperfumes solo tiene "Hawas Pink For Her" (distinto)
  'RASASI HAWAS FOR HER 100ML': null,

  // Parfumo mostraba KAYAAN CLASSIC (wrong), no encontrado en CDNs
  'AL WATANIAH WATANI NOIR 100ML': null,

  // Gamma OIP.jpg (imagen genérica, wrong), no encontrado en CDNs
  'AL WATANIAH ROSE MYSTERY INTENSE 100ML': null,

  // Parfumo mostraba KAYAAN CLASSIC (wrong), no encontrado en CDNs
  'AL WATANIAH KENZ AL MALIK 100ML': null,

  // Gamma thumbnail genérico (wrong según usuario), no encontrado en CDNs
  'AL WATANIAH THAHAANI 100ML': null,
};

async function main() {
  const snap = await db.collection('perfumes').get();
  let fixed = 0, cleared = 0;

  for (const doc of snap.docs) {
    const nombre = doc.data().nombre;
    if (!(nombre in FIXES)) continue;

    const newUrl = FIXES[nombre];
    if (newUrl) {
      await doc.ref.update({ imagenes: [newUrl] });
      console.log(`✅ ${nombre}`);
      fixed++;
    } else {
      await doc.ref.update({ imagenes: [] });
      console.log(`🗑  ${nombre} (limpiado — sin imagen correcta disponible)`);
      cleared++;
    }
  }

  console.log(`\n✅ Corregidos: ${fixed} | 🗑 Limpiados: ${cleared} | Total: ${fixed + cleared}/24`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
