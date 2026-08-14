// scripts/patch-images-3.mjs
// Tercera ronda – URLs confirmadas mediante web scraping directo.
// Uso: node scripts/patch-images-3.mjs

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
const SP = 'https://silkperfumes.cl/cdn/shop/products/'; // ruta antigua de Shopify

// Confirmadas 100% vía Pinterest URL scraping
const CONFIRMED = [
  // ── Maison Alhambra ──────────────────────────────────────────────────────
  ['MAISON ALHAMBRA LIBRE LEONIE',
    S + 'maison-alhambra-leonie-edp-100ml-Silk-Perfumes-1.png'],
  ['MAISON ALHAMBRA JEAN LOWE IMMORTAL',
    S + 'maison-alhambra-jean-lowe-immortel-edp-100ml-Silk-Perfumes-1.png'],
  ['MAISON ALHAMBRA GLACIER BOLD',
    S + 'maison-alhambra-glacier-bold-edp-100ml-Silk-Perfumes-1.png'],
  ['MAISON ALHAMBRA LA VIVACITE',
    S + 'maison-alhambra-la-vivacite-edp-100ml-Silk-Perfumes_68d42f10-84be-4acc-81d7-2bd1051db305.png'],
  ['MAISON ALHAMBRA GLACIER BELLA',
    S + 'maison-alhambra-glacier-bella-edp-100ml-silk-perfumes.png'],
  ['MAISON ALHAMBRA PINK VELVET',
    S + 'Maison-Alhambra-Pink-Velvet-EDP-80ml-Silk-Perfumes.webp'],

  // ── Armaf ────────────────────────────────────────────────────────────────
  ['ARMAF CLUB DE NUIT INTENSE FEMENINO',
    SP + 'armaf-club-de-nuit-women-edp-105ml-Silk-Perfumes.jpg'],

  // ── Lattafa ──────────────────────────────────────────────────────────────
  ['LATTAFA BADE\'E AL OUD FOR GLORY',
    SP + 'lattafa-badee-al-oud-for-glory-edp-100ml-Silk-Perfumes-1.jpg'],
  ['LATTAFA PRIDE PISA',
    S + 'lattafa-pride-pisa-edp-100ml-silk-perfumes-1.png'],
];

// Candidatos: probar via HEAD check con varios patrones de nombre
const CANDIDATES = [
  // ── Lattafa (intentos de nombre en silkperfumes.cl) ─────────────────────
  ['LATTAFA MAAHIR GOLD', [
    S + 'lattafa-maahir-gold-edp-100ml-Silk-Perfumes-1.png',
    S + 'lattafa-maahir-gold-edp-100ml-silk-perfumes.png',
    S + 'lattafa-maahir-gold-edition-edp-100ml-Silk-Perfumes.png',
  ]],
  ['LATTAFA FAKHAR ROSE', [
    S + 'lattafa-fakhar-rose-edp-100ml-Silk-Perfumes.png',
    S + 'lattafa-fakhar-rose-pour-femme-edp-100ml-Silk-Perfumes.png',
    S + 'lattafa-fakhar-rose-edp-100ml-Silk-Perfumes-1.png',
  ]],
  ['LATTAFA MAYAR CHERRY', [
    S + 'lattafa-mayar-cherry-edp-100ml-Silk-Perfumes.png',
    S + 'lattafa-mayar-cherry-edp-100ml-silk-perfumes.png',
    S + 'lattafa-mayar-cherry-edp-100ml-Silk-Perfumes-1.png',
  ]],
  ['LATTAFA SEHR MAGIC OF', [
    S + 'lattafa-sehr-magic-of-edp-100ml-Silk-Perfumes.png',
    S + 'lattafa-sehr-magic-of-edp-100ml-silk-perfumes.png',
    S + 'lattafa-sehr-magic-of-edp-100ml-Silk-Perfumes-1.png',
  ]],
  ['LATTAFA OPULENT OUD', [
    S + 'lattafa-opulent-oud-edp-100ml-Silk-Perfumes.png',
    S + 'lattafa-opulent-oud-edp-100ml-silk-perfumes.png',
    S + 'lattafa-opulent-oud-edp-100ml-Silk-Perfumes-1.png',
  ]],
  ['LATTAFA ISHQ AL SHUYUKH SILVER', [
    S + 'lattafa-ishq-al-shuyukh-silver-edp-100ml-Silk-Perfumes.png',
    S + 'lattafa-ishq-al-shuyukh-silver-edp-100ml-silk-perfumes.png',
    S + 'lattafa-ishq-al-shuyukh-silver-edp-100ml-Silk-Perfumes-1.png',
  ]],
  ['LATTAFA THE KINGDOM MASCULINO', [
    S + 'lattafa-the-kingdom-men-edp-100ml-Silk-Perfumes.png',
    S + 'lattafa-the-kingdom-men-edp-100ml-silk-perfumes.png',
    S + 'lattafa-the-kingdom-men-edp-100ml-Silk-Perfumes-1.png',
    S + 'lattafa-the-kingdom-man-edp-100ml-Silk-Perfumes.png',
  ]],
  ['LATTAFA THE KINGDOM FEMENINO', [
    S + 'lattafa-the-kingdom-women-edp-100ml-Silk-Perfumes.png',
    S + 'lattafa-the-kingdom-women-edp-100ml-silk-perfumes.png',
    S + 'lattafa-the-kingdom-woman-edp-100ml-Silk-Perfumes.png',
    S + 'lattafa-the-kingdom-women-edp-100ml-Silk-Perfumes-1.png',
  ]],
  ['LATTAFA ASDAAF AMEER AL ARAB IMPERIUM', [
    S + 'lattafa-asdaaf-ameer-al-arab-imperium-edp-100ml-Silk-Perfumes.png',
    S + 'lattafa-asdaaf-ameer-al-arab-imperium-edp-100ml-silk-perfumes.png',
    S + 'asdaaf-ameer-al-arab-imperium-edp-100ml-Silk-Perfumes.png',
    S + 'lattafa-asdaaf-ameer-al-arab-imperium-edp-100ml-Silk-Perfumes-1.png',
  ]],

  // ── Armaf (intentos de nombre) ───────────────────────────────────────────
  ['ARMAF ODYSSEY HOMME FOR MEN', [
    S + 'armaf-odyssey-homme-for-men-edp-100ml-Silk-Perfumes.png',
    S + 'armaf-odyssey-homme-for-men-edp-100ml-silk-perfumes.png',
    SP + 'armaf-odyssey-homme-for-men-edp-100ml-Silk-Perfumes.jpg',
    S + 'armaf-odyssey-homme-for-men-edp-100ml-Silk-Perfumes-1.png',
  ]],
  ['ARMAF CLUB DE NUIT OUD PARFUM', [
    S + 'armaf-club-de-nuit-oud-parfum-edp-105ml-Silk-Perfumes.png',
    S + 'armaf-club-de-nuit-oud-parfum-edp-105ml-silk-perfumes.png',
    SP + 'armaf-club-de-nuit-oud-parfum-edp-105ml-Silk-Perfumes.jpg',
    S + 'armaf-club-de-nuit-oud-edp-105ml-Silk-Perfumes.png',
  ]],
  ['ARMAF ODYSSEY MEGA LE', [
    S + 'armaf-odyssey-mega-le-edp-100ml-Silk-Perfumes-1.png',
    S + 'armaf-odyssey-mega-le-edp-100ml-silk-perfumes.png',
    SP + 'armaf-odyssey-mega-edp-100ml-Silk-Perfumes.jpg',
    S + 'armaf-odyssey-mega-edp-100ml-Silk-Perfumes.png',
  ]],
  ['ARMAF ODYSSEY SPECTRA', [
    S + 'armaf-odyssey-spectra-edp-100ml-Silk-Perfumes-1.png',
    S + 'armaf-odyssey-spectra-edp-100ml-silk-perfumes.png',
    SP + 'armaf-odyssey-spectra-edp-100ml-Silk-Perfumes.jpg',
  ]],
  ['ARMAF ETER ARABIAN SKY', [
    S + 'armaf-eter-arabian-sky-edp-100ml-Silk-Perfumes.png',
    S + 'armaf-eter-arabian-sky-edp-100ml-silk-perfumes.png',
    S + 'armaf-eter-arabian-sky-edp-100ml-Silk-Perfumes-1.png',
    SP + 'armaf-eter-arabian-sky-edp-100ml-Silk-Perfumes.jpg',
  ]],

  // ── Bharara ─────────────────────────────────────────────────────────────
  ['BHARARA KING EDP 150ML', [
    S + 'bharara-king-edp-150ml-silk-perfumes.png',
    S + 'bharara-king-edp-150ml-Silk-Perfumes.png',
    S + 'bharara-king-edp-150ml-Silk-Perfumes-1.png',
  ]],
  ['BHARARA KING GOLD', [
    S + 'bharara-king-gold-edp-100ml-silk-perfumes.png',
    S + 'bharara-king-gold-edp-100ml-Silk-Perfumes.png',
    S + 'bharara-king-gold-100ml-Silk-Perfumes.png',
  ]],
  ['BHARARA KING PARFUM', [
    S + 'bharara-king-parfum-100ml-silk-perfumes.png',
    S + 'bharara-king-parfum-100ml-Silk-Perfumes.png',
    S + 'bharara-king-parfum-edp-100ml-Silk-Perfumes.png',
  ]],
  ['BHARARA KING SOLEIL', [
    S + 'bharara-king-soleil-edp-100ml-silk-perfumes.png',
    S + 'bharara-king-soleil-edp-100ml-Silk-Perfumes.png',
    S + 'bharara-king-soleil-100ml-Silk-Perfumes.png',
  ]],
  ['BHARARA NICHE PARFUM', [
    S + 'bharara-niche-parfum-100ml-silk-perfumes.png',
    S + 'bharara-niche-parfum-100ml-Silk-Perfumes.png',
    S + 'bharara-niche-parfum-edp-100ml-Silk-Perfumes.png',
  ]],
  ['BHARARA MAST PERFUME ROME POUR HOMME', [
    S + 'bharara-mast-rome-pour-homme-edp-100ml-silk-perfumes.png',
    S + 'bharara-mast-rome-pour-homme-edp-100ml-Silk-Perfumes.png',
    S + 'bharara-mast-perfume-rome-pour-homme-edp-100ml-Silk-Perfumes.png',
  ]],

  // ── Maison Alhambra extras ────────────────────────────────────────────────
  ['MAISON ALHAMBRA ROSE SEDUCTION VIP FEMME', [
    S + 'maison-alhambra-rose-seduction-vip-femme-edp-100ml-Silk-Perfumes.png',
    S + 'maison-alhambra-rose-seduction-vip-femme-edp-100ml-silk-perfumes.png',
    S + 'maison-alhambra-rose-seduction-vip-femme-edp-100ml-Silk-Perfumes-1.png',
  ]],

  // ── Fragrance World ──────────────────────────────────────────────────────
  ['FRAGRANCE WORLD JUST AZRAQ', [
    S + 'fragrance-world-just-azraq-edp-100ml-Silk-Perfumes.png',
    S + 'fragrance-world-just-azraq-edp-100ml-silk-perfumes.png',
    S + 'fragrance-world-just-azraq-edp-100ml-Silk-Perfumes-1.png',
  ]],

  // ── Al Haramain ──────────────────────────────────────────────────────────
  ['AL HARAMAIN AMBER OUD EXCLUSIF PARFUM CLASSIC', [
    S + 'al-haramain-amber-oud-exclusif-parfum-classic-edp-60ml-Silk-Perfumes.png',
    S + 'al-haramain-amber-oud-exclusif-parfum-classic-edp-60ml-silk-perfumes.png',
    S + 'al-haramain-amber-oud-exclusif-parfum-classic-60ml-Silk-Perfumes.png',
    S + 'al-haramain-amber-oud-exclusif-classic-edp-60ml-Silk-Perfumes.png',
  ]],

  // ── Paris Corner ────────────────────────────────────────────────────────
  ['PARIS CORNER VOUX ELEGANTE', [
    S + 'paris-corner-voux-elegante-edp-100ml-Silk-Perfumes.png',
    S + 'paris-corner-voux-elegante-edp-100ml-silk-perfumes.png',
    S + 'paris-corner-voux-elegante-edp-100ml-Silk-Perfumes-1.png',
  ]],
  ['PARIS CORNER VOUX TURQUOISE', [
    S + 'paris-corner-voux-turquoise-edp-100ml-Silk-Perfumes.png',
    S + 'paris-corner-voux-turquoise-edp-100ml-silk-perfumes.png',
    S + 'paris-corner-voux-turquoise-edp-100ml-Silk-Perfumes-1.png',
  ]],

  // ── Rave ─────────────────────────────────────────────────────────────────
  ['RAVE NOW MEN', [
    S + 'rave-now-men-edp-100ml-Silk-Perfumes.png',
    S + 'rave-now-men-edp-100ml-silk-perfumes.png',
    S + 'rave-now-men-edp-100ml-Silk-Perfumes-1.png',
    S + 'lattafa-rave-now-men-edp-100ml-Silk-Perfumes.png',
  ]],

  // ── L'Affair ─────────────────────────────────────────────────────────────
  ["L'AFFAIR SUMMER SHOCKWAVE", [
    S + 'l-affair-summer-shockwave-edp-100ml-Silk-Perfumes.png',
    S + 'l-affair-summer-shockwave-edp-100ml-silk-perfumes.png',
    S + "l'affair-summer-shockwave-edp-100ml-Silk-Perfumes.png",
    S + 'l-affair-summer-shockwave-edp-100ml-Silk-Perfumes-1.png',
  ]],

  // ── French Avenue Genesis (zodíaco) ──────────────────────────────────────
  ['FRENCH AVENUE GENESIS CAPRICORN', [
    S + 'french-avenue-genesis-capricorn-edp-90ml-Silk-Perfumes.png',
    S + 'french-avenue-genesis-capricorn-90ml-Silk-Perfumes.png',
    S + 'french-avenue-genesis-capricorno-edp-90ml-Silk-Perfumes.png',
  ]],
  ['FRENCH AVENUE GENESIS LIBRA', [
    S + 'french-avenue-genesis-libra-edp-90ml-Silk-Perfumes.png',
    S + 'french-avenue-genesis-libra-90ml-Silk-Perfumes.png',
  ]],
  ['FRENCH AVENUE GENESIS GEMINI', [
    S + 'french-avenue-genesis-gemini-edp-90ml-Silk-Perfumes.png',
    S + 'french-avenue-genesis-gemini-90ml-Silk-Perfumes.png',
  ]],

  // ── French Avenue Aether ─────────────────────────────────────────────────
  ['FRENCH AVENUE AETHER EXTRAIT', [
    S + 'french-avenue-aether-extrait-de-parfum-100ml-Silk-Perfumes.png',
    S + 'french-avenue-aether-extrait-100ml-Silk-Perfumes.png',
    S + 'french-avenue-aether-extrait-edp-100ml-Silk-Perfumes.png',
  ]],

  // ── Grandeur Tubbees (sitios de perfumería especializados) ───────────────
  ['GRANDEUR TUBBEES CANDY POP', [
    S + 'grandeur-tubbees-candy-pop-edp-50ml-Silk-Perfumes.png',
    S + 'grandeur-tubbees-candy-pop-50ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-candy-pop_1024x1024.png',
    'https://www.perfumenz.co.nz/cdn/shop/products/grandeur-tubbees-candy-pop_1024x1024.png',
  ]],
  ['GRANDEUR TUBBEES CHERRY LUXE', [
    S + 'grandeur-tubbees-cherry-luxe-edp-50ml-Silk-Perfumes.png',
    S + 'grandeur-tubbees-cherry-luxe-50ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-cherry-luxe_1024x1024.png',
  ]],
  ['GRANDEUR TUBBEES PINK SUGAR', [
    S + 'grandeur-tubbees-pink-sugar-edp-50ml-Silk-Perfumes.png',
    S + 'grandeur-tubbees-pink-sugar-50ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-pink-sugar_1024x1024.png',
  ]],

  // ── Emper ────────────────────────────────────────────────────────────────
  ['EMPER UOMO INTENSE', [
    S + 'emper-uomo-intense-edp-100ml-Silk-Perfumes.png',
    S + 'emper-uomo-intense-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/emper-uomo-intense_1024x1024.png',
    'https://cdn.shopify.com/s/files/1/0259/7733/files/emper-uomo-intense_1024x1024.png',
  ]],
  ['EMPER DONNA INTENSE', [
    S + 'emper-donna-intense-edp-100ml-Silk-Perfumes.png',
    S + 'emper-donna-intense-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/emper-donna-intense_1024x1024.png',
    'https://cdn.shopify.com/s/files/1/0259/7733/files/emper-donna-intense_1024x1024.png',
  ]],
  ['EMPER BLUE STALLION', [
    S + 'emper-blue-stallion-edp-100ml-Silk-Perfumes.png',
    S + 'emper-blue-stallion-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/emper-blue-stallion_1024x1024.png',
  ]],
  ['EMPER MANDORA', [
    S + 'emper-mandora-edp-100ml-Silk-Perfumes.png',
    S + 'emper-mandora-100ml-Silk-Perfumes.png',
    'https://www.perfumenz.co.nz/cdn/shop/files/emper-mandora_1024x1024.png',
  ]],
];

// ─── Helpers ──────────────────────────────────────────────────────────────
async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch { return false; }
}

async function firstOk(urls) {
  for (const url of urls) {
    if (await headOk(url)) return url;
  }
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────
const snap = await db.collection('perfumes').get();
let updated = 0, noImg = 0;

for (const doc of snap.docs) {
  const data = doc.data();
  if (data.imagenes?.length > 0) continue;

  const name = (data.nombre || '').toUpperCase();

  // Check confirmed first
  const confirmed = CONFIRMED.find(([key]) => name.includes(key));
  if (confirmed) {
    await doc.ref.update({ imagenes: [confirmed[1]] });
    updated++;
    console.log(`✅ ${data.nombre}`);
    continue;
  }

  // Check candidates
  const candidate = CANDIDATES.find(([key]) => name.includes(key));
  if (candidate) {
    const url = await firstOk(candidate[1]);
    if (url) {
      await doc.ref.update({ imagenes: [url] });
      updated++;
      console.log(`🔍 ${data.nombre} → ${url}`);
    } else {
      console.log(`❌ ${data.nombre}`);
      noImg++;
    }
    continue;
  }

  noImg++;
}

console.log(`\n🎉 Actualizados: ${updated} | Sin resolver: ${noImg}`);
process.exit(0);
