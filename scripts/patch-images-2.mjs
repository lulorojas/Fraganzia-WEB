// scripts/patch-images-2.mjs
// Segunda ronda de imágenes para los ~53 productos restantes.
// Usa URLs confirmadas vía web scraping de silkperfumes.cl y otras fuentes.
// Uso: node scripts/patch-images-2.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const S = 'https://silkperfumes.cl/cdn/shop/files/';

// Solo aplica a productos SIN imagen actualmente.
const MAP = [
  // ── Rasasi (confirmados via silkperfumes.cl) ────────────────────────────
  ['RASASI HAWAS FOR HIM 100ML',
    S + 'rasasi-hawas-hombre-edp-100-ml-silk-perfumes.png'],
  ['RASASI HAWAS FOR HIM ICE',
    S + 'rasasi-hawas-ice-hombre-edp-100-ml-silk-perfumes.png'],
  ['RASASI HAWAS FOR HIM TROPICAL',
    S + 'rassasi-hawas-tropical-edp-100ml-Silk-Perfumes.png'],
  ['RASASI HAWAS FOR HIM MALIBU',
    S + 'rasasi-hawas-malibu-for-him-edp-100ml-Silk-Perfumes.png'],
  ['RASASI HAWAS FOR HER',
    S + 'Disenosintitulo-2026-03-27T165818.926.png'],

  // ── Bharara (confirmados via silkperfumes.cl) ───────────────────────────
  ['BHARARA KING EDP 100ML',
    S + 'bharara-king-edp-100ml-silk-perfumes.png'],
  ['BHARARA DOUBLE BLEU',
    S + 'BHRR9_3a18c863-6de7-4c23-afa0-e2202107c747.png'],

  // ── French Avenue (confirmados via silkperfumes.cl) ─────────────────────
  ['FRENCH AVENUE VULCAN FEU',
    S + 'french-avenue-vulcan-feu-edp-100ml-Silk-Perfumes.png'],
  ['FRENCH AVENUE AVE SWEET PARADISE',
    S + '32_fb6a11d3-8c01-400b-a920-950622e22729.png'],
  ['FRENCH AVENUE MERINGUE',
    S + 'melingue.png'],

  // ── Dumont (la ruta Silk que funciona) ─────────────────────────────────
  ['DUMONT NITRO RED',
    S + 'dumont-nitro-red-pour-homme-100ml-Silk-Perfumes.png'],

  // ── Emper (fuentes alternativas) ────────────────────────────────────────
  ['EMPER UOMO INTENSE',
    'https://perfumesdubai.com.au/cdn/shop/files/emper-uomo-intense_1200x1200.jpg?v=1714385562'],
  ['EMPER DONNA INTENSE',
    'https://perfumesdubai.com.au/cdn/shop/files/emper-donna-intense_1200x1200.jpg?v=1714385628'],
  ['EMPER BLUE STALLION',
    'https://cdn.shopify.com/s/files/1/0259/7733/products/emper-blue-stallion_1024x1024.png'],
  ['EMPER MANDORA',
    'https://cdn.shopify.com/s/files/1/0259/7733/products/emper-mandora_1024x1024.png'],

  // ── Armaf (silkperfumes.cl pattern descubierto) ──────────────────────────
  ['ARMAF CLUB DE NUIT INTENSE FEMENINO',
    S + 'armaf-club-de-nuit-intense-woman-edp-105ml-Silk-Perfumes.png'],
  ['ARMAF CLUB DE NUIT OUD PARFUM',
    S + 'armaf-club-de-nuit-oud-parfum-edp-105ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY HOMME FOR MEN',
    S + 'armaf-odyssey-homme-for-men-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY MEGA LE',
    S + 'armaf-odyssey-mega-le-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY SPECTRA',
    S + 'armaf-odyssey-spectra-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ETER ARABIAN SKY',
    S + 'armaf-eter-arabian-sky-edp-100ml-Silk-Perfumes.png'],

  // ── Lattafa (perfumenz.co.nz pattern) ───────────────────────────────────
  ['LATTAFA BADE\'E AL OUD FOR GLORY',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-badee-al-oud-for-glory_1024x1024.png'],
  ['LATTAFA FAKHAR ROSE',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-fakhar-rose_1024x1024.png'],
  ['LATTAFA MAAHIR GOLD',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-maahir-gold_1024x1024.png'],
  ['LATTAFA MAYAR CHERRY',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-mayar-cherry_1024x1024.png'],
  ['LATTAFA PRIDE PISA',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-pride-pisa_1024x1024.png'],
  ['LATTAFA SEHR MAGIC OF',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-sehr-magic-of_1024x1024.png'],
  ['LATTAFA OPULENT OUD',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-opulent-oud_1024x1024.png'],
  ['LATTAFA ISHQ AL SHUYUKH SILVER',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-ishq-al-shuyukh-silver_1024x1024.png'],
  ['LATTAFA THE KINGDOM MASCULINO',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-the-kingdom-man_1024x1024.png'],
  ['LATTAFA THE KINGDOM FEMENINO',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-the-kingdom-woman_1024x1024.png'],
  ['LATTAFA ASDAAF AMEER AL ARAB IMPERIUM',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-asdaaf-ameer-al-arab-imperium_1024x1024.png'],

  // ── Al Haramain ──────────────────────────────────────────────────────────
  ['AL HARAMAIN AMBER OUD EXCLUSIF PARFUM CLASSIC',
    S + 'al-haramain-amber-oud-exclusif-parfum-classic-edp-60ml-Silk-Perfumes.png'],

  // ── Fragrance World ──────────────────────────────────────────────────────
  ['FRAGRANCE WORLD JUST AZRAQ',
    S + 'fragrance-world-just-azraq-edp-100ml-Silk-Perfumes.png'],

  // ── Maison Alhambra ──────────────────────────────────────────────────────
  ['MAISON ALHAMBRA JEAN LOWE IMMORTAL',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-jean-lowe-immortal_1024x1024.png'],
  ['MAISON ALHAMBRA LIBRE LEONIE',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-libre-leonie_1024x1024.png'],
  ['MAISON ALHAMBRA GLACIER BELLA',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-glacier-bella_1024x1024.png'],
  ['MAISON ALHAMBRA GLACIER BOLD',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-glacier-bold_1024x1024.png'],
  ['MAISON ALHAMBRA PINK VELVET',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-pink-velvet_1024x1024.png'],
  ['MAISON ALHAMBRA ROSE SEDUCTION VIP FEMME',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-rose-seduction-vip-femme_1024x1024.png'],
  ['MAISON ALHAMBRA LA VIVACITE',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-la-vivacite_1024x1024.png'],

  // ── French Avenue Genesis (perfumenz.co.nz) ──────────────────────────────
  ['FRENCH AVENUE GENESIS CAPRICORN',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-capricorn_1024x1024.png'],
  ['FRENCH AVENUE GENESIS LIBRA',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-libra_1024x1024.png'],
  ['FRENCH AVENUE GENESIS GEMINI',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-gemini_1024x1024.png'],

  // ── Paris Corner ─────────────────────────────────────────────────────────
  ['PARIS CORNER VOUX ELEGANTE',
    'https://www.perfumenz.co.nz/cdn/shop/files/paris-corner-voux-elegante_1024x1024.png'],
  ['PARIS CORNER VOUX TURQUOISE',
    'https://www.perfumenz.co.nz/cdn/shop/files/paris-corner-voux-turquoise_1024x1024.png'],

  // ── Rave ─────────────────────────────────────────────────────────────────
  ['RAVE NOW MEN',
    'https://www.perfumenz.co.nz/cdn/shop/files/rave-now-men_1024x1024.png'],

  // ── Bharara additional ───────────────────────────────────────────────────
  ['BHARARA KING EDP 150ML',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-king-edp-150ml_1024x1024.png'],
  ['BHARARA KING GOLD',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-king-gold_1024x1024.png'],
  ['BHARARA KING PARFUM',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-king-parfum_1024x1024.png'],
  ['BHARARA KING SOLEIL',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-king-soleil_1024x1024.png'],
  ['BHARARA NICHE PARFUM',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-niche-parfum_1024x1024.png'],
  ['BHARARA MAST PERFUME ROME POUR HOMME',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-mast-rome-pour-homme_1024x1024.png'],

  // ── French Avenue extras ─────────────────────────────────────────────────
  ['FRENCH AVENUE AETHER EXTRAIT',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-aether-extrait_1024x1024.png'],

  // ── L'Affair ─────────────────────────────────────────────────────────────
  ["L'AFFAIR SUMMER SHOCKWAVE",
    'https://www.perfumenz.co.nz/cdn/shop/files/l-affair-summer-shockwave_1024x1024.png'],

  // ── Grandeur Tubbees (fuente alternativa) ───────────────────────────────
  ['GRANDEUR TUBBEES CANDY POP',
    'https://m.media-amazon.com/images/I/61XnBWG2xXL._SL1080_.jpg'],
  ['GRANDEUR TUBBEES CHERRY LUXE',
    'https://m.media-amazon.com/images/I/61a6YMkZoKL._SL1080_.jpg'],
  ['GRANDEUR TUBBEES PINK SUGAR',
    'https://m.media-amazon.com/images/I/71U1BjrA2IL._SL1080_.jpg'],
];

// ─── Helpers ──────────────────────────────────────────────────────────────
async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch { return false; }
}

// ─── Main ─────────────────────────────────────────────────────────────────
const snap = await db.collection('perfumes').get();
let updated = 0, noImg = 0;

for (const doc of snap.docs) {
  const data = doc.data();
  if (data.imagenes?.length > 0) continue;  // ya tiene imagen

  const name = (data.nombre || '').toUpperCase();
  const entry = MAP.find(([key]) => name.includes(key));
  if (!entry) { noImg++; continue; }

  const url = entry[1];
  const ok = await headOk(url);
  if (ok) {
    await doc.ref.update({ imagenes: [url] });
    updated++;
    console.log(`✅ ${data.nombre}`);
  } else {
    console.log(`❌ FAIL ${data.nombre} → ${url}`);
    noImg++;
  }
}

console.log(`\n🎉 Actualizados: ${updated} | Sin resolver: ${noImg}`);
process.exit(0);
