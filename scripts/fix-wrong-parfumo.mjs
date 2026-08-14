// fix-wrong-parfumo.mjs
// Detecta las 69 imágenes de parfumo incorrectas y las reemplaza con URLs CDN correctas.
// Usa las mismas URLs manuales que fix-images.mjs, más búsqueda dinámica.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

// ── Utilidades ────────────────────────────────────────────────────────────────
function toSlug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isWrongParfumoImage(imageUrl, productName) {
  if (!imageUrl || !imageUrl.includes('parfumo')) return false;
  // Extrae el slug de la imagen: entre el hash y _1200.jpg
  const m = imageUrl.match(/parfumo\.com\/perfumes\/[a-f0-9]{2}\/[a-f0-9]+-([^_"'\s]+)_\d+\.jpg/);
  if (!m) return false;
  const imgSlug = m[1].toLowerCase().replace(/-/g, ' ');
  const nameWords = productName.toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(' ')
    .filter(w => w.length > 3 && !['100ml', '90ml', '75ml', '60ml', '50ml', '55ml', '105ml', '120ml', '200ml', '150ml'].includes(w));
  return !nameWords.some(w => imgSlug.includes(w));
}

async function headOk(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return r.ok;
  } catch { return false; }
}

// URLs manuales correctas (copiadas de fix-images.mjs)
const MANUAL_URLS = [
  // Armaf masculinos
  ['ARMAF CLUB DE NUIT BLING', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-bling_1024x1024.png'],
  ['ARMAF CLUB DE NUIT ICONIC', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-iconic_1024x1024.png'],
  ['ARMAF CLUB DE NUIT INTENSE 105ML', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-intense-man_1024x1024.png'],
  ['ARMAF CLUB DE NUIT LIONHEART MAN', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-lionheart-man_1024x1024.png'],
  ['ARMAF CLUB DE NUIT MILESTONE', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-milestone_1024x1024.png'],
  ['ARMAF CLUB DE NUIT PRECIEUX I', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-precieux-i_1024x1024.png'],
  ['ARMAF CLUB DE NUIT SILLAGE', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-sillage_1024x1024.png'],
  ['ARMAF CLUB DE NUIT URBAN MAN ELIXIR', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-urban-man-elixir_1024x1024.png'],
  ['ARMAF CLUB DE NUIT UNTOLD', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-untold_1024x1024.png'],
  ['ARMAF ETER ARABIAN SKY', 'https://silkperfumes.cl/cdn/shop/files/armaf-eter-arabian-sky-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ETER DESERT BREEZE', 'https://silkperfumes.cl/cdn/shop/files/armaf-eter-desert-breeze-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ETER DESERT NIGHT', 'https://silkperfumes.cl/cdn/shop/files/armaf-eter-desert-night-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ETER MAGICAL OUD', 'https://silkperfumes.cl/cdn/shop/files/armaf-eter-magical-oud-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY AOUD', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-aoud-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY AQUA', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-aqua-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY ARTISTO', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-artisto-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY BAHAMAS', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-bahamas-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY DUBAI CHOCOLAT', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-dubai-chocolat-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY GO MANGO', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-go-mango-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY HOMME FOR MEN 100ML', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-homme-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY LIMONI', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-limoni-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY MANDARIN SKY 100ML', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-mandarin-sky-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY MANDARIN SKY ELIXIR', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-mandarin-sky-elixir-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY MANDARIN SKY VINTAGE', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-mandarin-sky-vintage-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY MEGA LE', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-mega-le-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY REVOLUTION', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-revolution-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY SPECTRA', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-spectra-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY TYRANT', 'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-tyrant-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF TAG HIM UOMO ROSSO', 'https://silkperfumes.cl/cdn/shop/files/armaf-tag-him-uomo-rosso-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF TAG HIM 100ML', 'https://silkperfumes.cl/cdn/shop/files/armaf-tag-him-edp-100ml-Silk-Perfumes.png'],
  // Armaf femeninos
  ['ARMAF CLUB DE NUIT MALEKA', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-maleka_1024x1024.png'],
  ['ARMAF CLUB DE NUIT PRECIEUX IV', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-precieux-iv_1024x1024.png'],
  ['ARMAF CLUB DE NUIT IMPERIALE', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-imperiale_1024x1024.png'],
  ['ARMAF CLUB DE NUIT INTENSE FEMENINO', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-intense-woman_1024x1024.png'],
  ['ARMAF CLUB DE NUIT OUD PARFUM', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-oud-parfum_1024x1024.png'],
  ['ARMAF CLUB DE NUIT WOMAN', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-woman_1024x1024.png'],
  ['ARMAF MISS ARMAF ATTITUDE', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-miss-armaf-attitude_1024x1024.png'],
  ['ARMAF MISS ARMAF CATWALK', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-miss-armaf-catwalk_1024x1024.png'],
  ['ARMAF ODYSSEY EAU DE MONTAGNE', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-odyssey-eau-de-montagne_1024x1024.png'],
  ['ARMAF ODYSSEY MARSHMALLOW', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-odyssey-marshmallow_1024x1024.png'],
  ['ARMAF YUM YUM', 'https://www.perfumenz.co.nz/cdn/shop/files/armaf-yum-yum_1024x1024.png'],
  // Bharara
  ['BHARARA CHOCOLATE', 'https://www.perfumenz.co.nz/cdn/shop/files/bharara-chocolate_1024x1024.png'],
  ['BHARARA DOUBLE BLEU', 'https://www.perfumenz.co.nz/cdn/shop/files/bharara-double-bleu_1024x1024.png'],
  ['BHARARA KING EDP 100ML', 'https://www.perfumenz.co.nz/cdn/shop/files/bharara-king-edp-100ml_1024x1024.png'],
  ['BHARARA KING EDP 150ML', 'https://www.perfumenz.co.nz/cdn/shop/files/bharara-king-edp-150ml_1024x1024.png'],
  ['BHARARA KING GOLD', 'https://www.perfumenz.co.nz/cdn/shop/files/bharara-king-gold_1024x1024.png'],
  ['BHARARA KING PARFUM', 'https://www.perfumenz.co.nz/cdn/shop/files/bharara-king-parfum_1024x1024.png'],
  ['BHARARA KING SOLEIL', 'https://www.perfumenz.co.nz/cdn/shop/files/bharara-king-soleil_1024x1024.png'],
  ['BHARARA NICHE PARFUM', 'https://www.perfumenz.co.nz/cdn/shop/files/bharara-niche-parfum_1024x1024.png'],
  ['BHARARA MAST PERFUME ROME POUR HOMME', 'https://www.perfumenz.co.nz/cdn/shop/files/bharara-mast-rome-pour-homme_1024x1024.png'],
  ['BHARARA VIKING BEIRUT', 'https://www.perfumenz.co.nz/cdn/shop/files/bharara-viking-beirut_1024x1024.png'],
  ['BHARARA VIKING DUBAI', 'https://www.perfumenz.co.nz/cdn/shop/files/bharara-viking-dubai_1024x1024.png'],
  ['BHARARA ROSE', 'https://www.perfumenz.co.nz/cdn/shop/files/bharara-rose_1024x1024.png'],
  ['BHARARA NICHE FEMME', 'https://www.perfumenz.co.nz/cdn/shop/files/bharara-niche-femme_1024x1024.png'],
  // Dumont
  ['DUMONT NITRO INTENSE', 'https://www.perfumenz.co.nz/cdn/shop/files/dumont-nitro-intense_1024x1024.png'],
  ['DUMONT NITRO RED', 'https://www.perfumenz.co.nz/cdn/shop/files/dumont-nitro-red_1024x1024.png'],
  ['DUMONT NITRO WHITE', 'https://www.perfumenz.co.nz/cdn/shop/files/dumont-nitro-white_1024x1024.png'],
  // Emper
  ['EMPER BLUE STALLION', 'https://www.perfumenz.co.nz/cdn/shop/files/emper-blue-stallion_1024x1024.png'],
  ['EMPER DONNA INTENSE', 'https://www.perfumenz.co.nz/cdn/shop/files/emper-donna-intense_1024x1024.png'],
  ['EMPER MANDORA', 'https://www.perfumenz.co.nz/cdn/shop/files/emper-mandora_1024x1024.png'],
  ['EMPER PHANTOM MY HERO', 'https://www.perfumenz.co.nz/cdn/shop/files/emper-phantom-my-hero_1024x1024.png'],
  ['EMPER UOMO INTENSE', 'https://www.perfumenz.co.nz/cdn/shop/files/emper-uomo-intense_1024x1024.png'],
  // Fragrance World
  ['FRAGRANCE WORLD IMPERIUM', 'https://silkperfumes.cl/cdn/shop/files/fragrance-world-imperium-edp-100ml-Silk-Perfumes.webp'],
  ['FRAGRANCE WORLD JUST AZRAQ', 'https://silkperfumes.cl/cdn/shop/files/fragrance-world-just-azraq-edp-100ml-Silk-Perfumes.webp'],
  ['FRAGRANCE WORLD SEDLEY', 'https://silkperfumes.cl/cdn/shop/files/fragrance-world-sedley-edp-100ml-Silk-Perfumes.webp'],
  ['FRAGRANCE WORLD STAR MEN NEBULA', 'https://silkperfumes.cl/cdn/shop/files/fragrance-world-star-men-nebula-edp-100ml-Silk-Perfumes.webp'],
  // French Avenue
  ['FRENCH AVENUE AETHER EXTRAIT', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-aether-extrait_1024x1024.png'],
  ['FRENCH AVENUE ATLANTIS EXTRAIT', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-atlantis-extrait_1024x1024.png'],
  ['FRENCH AVENUE AVE SWEET PARADISE', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-ave-sweet-paradise_1024x1024.png'],
  ['FRENCH AVENUE AZZURE AOUD', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-azzure-aoud_1024x1024.png'],
  ['FRENCH AVENUE COCOA MORADO', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-cocoa-morado_1024x1024.png'],
  ['FRENCH AVENUE GENESIS AQUARIUS', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-aquarius_1024x1024.png'],
  ['FRENCH AVENUE GENESIS ARIES', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-aries_1024x1024.png'],
  ['FRENCH AVENUE GENESIS CANCER', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-cancer_1024x1024.png'],
  ['FRENCH AVENUE GENESIS CAPRICORN', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-capricorn_1024x1024.png'],
  ['FRENCH AVENUE GENESIS GEMINI', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-gemini_1024x1024.png'],
  ['FRENCH AVENUE GENESIS LEO', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-leo_1024x1024.png'],
  ['FRENCH AVENUE GENESIS LIBRA', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-libra_1024x1024.png'],
  ['FRENCH AVENUE GENESIS PISCES', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-pisces_1024x1024.png'],
  ['FRENCH AVENUE GENESIS SAGITTARIUS', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-sagittarius_1024x1024.png'],
  ['FRENCH AVENUE GENESIS SCORPIO', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-scorpio_1024x1024.png'],
  ['FRENCH AVENUE GENESIS TAURUS', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-taurus_1024x1024.png'],
  ['FRENCH AVENUE GENESIS VIRGO', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-virgo_1024x1024.png'],
  ['FRENCH AVENUE LIQUID BRUN', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-liquid-brun_1024x1024.png'],
  ['FRENCH AVENUE MERINGUE', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-meringue_1024x1024.png'],
  ['FRENCH AVENUE SPECTRE GHOST', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-spectre-ghost_1024x1024.png'],
  ['FRENCH AVENUE SPECTRE WRAITH', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-spectre-wraith_1024x1024.png'],
  ['FRENCH AVENUE VULCAN FEU', 'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-vulcan-feu_1024x1024.png'],
  // Grandeur Tubbees
  ['GRANDEUR TUBBEES BUBBLE GUM', 'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-bubble-gum_1024x1024.png'],
  ['GRANDEUR TUBBEES CHOCOLATE FUDGE', 'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-chocolate-fudge_1024x1024.png'],
  ['GRANDEUR TUBBEES COOKIES & CREAM', 'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-cookies-cream_1024x1024.png'],
  ['GRANDEUR TUBBEES CANDY POP', 'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-candy-pop_1024x1024.png'],
  ['GRANDEUR TUBBEES CHERRY LUXE', 'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-cherry-luxe_1024x1024.png'],
  ['GRANDEUR TUBBEES PINK SUGAR', 'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-pink-sugar_1024x1024.png'],
  ['GRANDEUR TUBBEES STRAWBERRY CHEESECAKE', 'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-strawberry-cheesecake_1024x1024.png'],
  ['GRANDEUR TUBBEES UNICORN VANILLA', 'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-unicorn-vanilla_1024x1024.png'],
  // Lattafa
  ['LATTAFA AJWAD 60ML', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-ajwad_1024x1024.png'],
  ['LATTAFA AJWAD PINK TO PINK', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-ajwad-pink-to-pink_1024x1024.png'],
  ['LATTAFA ART OF NATURE II', 'https://privateblends.com.au/cdn/shop/files/03idbtmknq_533x_59c4b951-85f6-4378-aff2-4d9bc18dca99.jpg?v=1730706683&width=1600'],
  ['LATTAFA ART OF UNIVERSE', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-art-of-universe_1024x1024.png'],
  ['LATTAFA ASAD ZANZIBAR', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-asad-zanzibar_1024x1024.png'],
  ['LATTAFA ASAD BOURBON', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-asad-bourbon_1024x1024.png'],
  ['LATTAFA ASAD ELIXIR', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-asad-elixir_1024x1024.png'],
  ['LATTAFA ATHEERI', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-atheeri_1024x1024.png'],
  ['LATTAFA BADE\'E AL OUD FOR GLORY', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-badee-al-oud-for-glory_1024x1024.png'],
  ['LATTAFA BADE\'E AL OUD NOBLE BLUSH', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-badee-al-oud-noble-blush_1024x1024.png'],
  ['LATTAFA HAYAATI GOLD ELIXIR', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-hayaati-gold-elixir_1024x1024.png'],
  ['LATTAFA HAYAATI FLORENCE', 'https://momperfume.in/cdn/shop/files/m63279828063-1.jpg?v=1737597423&width=1946'],
  ['LATTAFA HAYA', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-haya_1024x1024.png'],
  ['LATTAFA LAIL MALEKI', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-lail-maleki_1024x1024.png'],
  ['LATTAFA MAAHIR GOLD', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-maahir-gold_1024x1024.png'],
  ['LATTAFA MAAHIR LEGACY', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-maahir-legacy_1024x1024.png'],
  ['LATTAFA VICTORIA', 'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-victoria_1024x1024.png'],
  // Maison Alhambra
  ['MAISON ALHAMBRA DELILAH', 'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-delilah_1024x1024.png'],
  ['MAISON ALHAMBRA FLAMING ELIXIR', 'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-flaming-elixir_1024x1024.png'],
  ['MAISON ALHAMBRA JORGE DI PROFUMO AQUA', 'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-jorge-di-profumo-aqua_1024x1024.png'],
  ['MAISON ALHAMBRA LA VITA', 'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-la-vita_1024x1024.png'],
  ['MAISON ALHAMBRA ROSE SEDUCTION VIP FEMME', 'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-rose-seduction-vip-femme_1024x1024.png'],
  ['MAISON ALHAMBRA TERRA', 'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-terra_1024x1024.png'],
  ['MAISON ALHAMBRA VICTORIOSO 100ML', 'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-victorioso_1024x1024.png'],
  ['MAISON ALHAMBRA VICTORIOSO NERO', 'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-victorioso-nero_1024x1024.png'],
  // Orientica
  ['ORIENTICA AMBER ROUGE', 'https://www.perfumenz.co.nz/cdn/shop/files/orientica-amber-rouge_1024x1024.png'],
  ['ORIENTICA ROYAL AMBER', 'https://www.perfumenz.co.nz/cdn/shop/files/orientica-royal-amber_1024x1024.png'],
  // Paris Corner
  ['PARIS CORNER KHAIR PISTACHIO', 'https://www.perfumenz.co.nz/cdn/shop/files/paris-corner-khair-pistachio_1024x1024.png'],
  ['PARIS CORNER VOUX ELEGANTE', 'https://www.perfumenz.co.nz/cdn/shop/files/paris-corner-voux-elegante_1024x1024.png'],
  ['PARIS CORNER VOUX TURQUOISE', 'https://www.perfumenz.co.nz/cdn/shop/files/paris-corner-voux-turquoise_1024x1024.png'],
  ['PARIS CORNER MARSHMALLOW BLUSH', 'https://www.perfumenz.co.nz/cdn/shop/files/paris-corner-marshmallow-blush_1024x1024.png'],
  ['PARIS CORNER TASKEEN CARAMEL CASCADE', 'https://www.perfumenz.co.nz/cdn/shop/files/paris-corner-taskeen-caramel-cascade_1024x1024.png'],
  // Rasasi
  ['RASASI HAWAS BLACK', 'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-black_1024x1024.png'],
  ['RASASI HAWAS ELIXIR', 'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-elixir_1024x1024.png'],
  ['RASASI HAWAS FIRE', 'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-fire_1024x1024.png'],
  ['RASASI HAWAS FOR HER', 'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-for-her_1024x1024.png'],
  ['RASASI HAWAS FOR HIM ICE', 'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-for-him-ice_1024x1024.png'],
  ['RASASI HAWAS FOR HIM MALIBU', 'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-for-him-malibu_1024x1024.png'],
  ['RASASI HAWAS FOR HIM TROPICAL', 'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-for-him-tropical_1024x1024.png'],
  ['RASASI HAWAS FOR HIM 100ML', 'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-for-him_1024x1024.png'],
  // Rayhaan
  ['RAYHAAN AZUL', 'https://www.perfumenz.co.nz/cdn/shop/files/rayhaan-azul_1024x1024.png'],
  // Riiffs
  ['RIIFFS MOMENTO', 'https://www.perfumenz.co.nz/cdn/shop/files/riiffs-momento_1024x1024.png'],
  // Al Haramain
  ['AL HARAMAIN AMBER OUD AQUA DUBAI', 'https://www.perfumenz.co.nz/cdn/shop/files/al-haramain-amber-oud-aqua-dubai_1024x1024.png'],
  // Afnan
  ['AFNAN TURATHI ELECTRIC', 'https://www.perfumenz.co.nz/cdn/shop/files/afnan-turathi-electric_1024x1024.png'],
  ['AFNAN TURATHI BLUE', 'https://www.perfumenz.co.nz/cdn/shop/files/afnan-turathi-blue_1024x1024.png'],
];

// ── CDN fallback dinámico ──────────────────────────────────────────────────
function buildCandidates(nombre, marca, volumenML) {
  const prodName = nombre
    .replace(new RegExp('^' + marca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+', 'i'), '')
    .replace(/\s+\d+ML$/i, '').trim();
  const fullSlug = toSlug(marca + ' ' + prodName);
  const vol = volumenML || 100;
  return [
    `https://www.perfumenz.co.nz/cdn/shop/files/${fullSlug}_1024x1024.png`,
    `https://www.perfumenz.co.nz/cdn/shop/files/${fullSlug}_1024x1024.webp`,
    `https://www.perfumenz.co.nz/cdn/shop/files/${fullSlug}_1024x1024.jpg`,
    `https://silkperfumes.cl/cdn/shop/files/${fullSlug}-edp-${vol}ml-Silk-Perfumes.png`,
    `https://silkperfumes.cl/cdn/shop/files/${fullSlug}-edp-${vol}ml-Silk-Perfumes.webp`,
  ];
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log('Cargando perfumes de Firestore...');
const snap = await db.collection('perfumes').get();
const docs = snap.docs;

// Identificar todos los productos con imagen parfumo incorrecta
const wrongOnes = docs.filter(doc => {
  const d = doc.data();
  const img = (d.imagenes || [])[0] || '';
  return isWrongParfumoImage(img, d.nombre);
});

console.log(`Encontrados ${wrongOnes.length} productos con imagen parfumo incorrecta.\n`);

let fixed = 0, notFound = 0;

for (const doc of wrongOnes) {
  const d = doc.data();
  const name = (d.nombre || '').toUpperCase();
  process.stdout.write(`[${fixed + notFound + 1}/${wrongOnes.length}] ${d.nombre} ... `);

  // 1. Buscar en lista manual
  const manual = MANUAL_URLS.find(([key]) => name.includes(key.toUpperCase()));
  if (manual) {
    const url = manual[1];
    const ok = url.includes('cdn.gamma.app') || url.includes('privateblends') || await headOk(url);
    if (ok) {
      await doc.ref.update({ imagenes: [url] });
      fixed++;
      console.log(`✅ MANUAL`);
      continue;
    }
    console.log(`⚠ MANUAL FAIL (${url})`);
  }

  // 2. Intentar candidatos dinámicos de CDN
  const candidates = buildCandidates(d.nombre, d.marca, d.volumenML);
  let found = false;
  for (const url of candidates) {
    if (await headOk(url)) {
      await doc.ref.update({ imagenes: [url] });
      fixed++;
      console.log(`🌐 CDN → ${url.split('/').pop()}`);
      found = true;
      break;
    }
  }
  if (!found) {
    notFound++;
    console.log(`❌ NO ENCONTRADO`);
  }
}

console.log(`\n✅ Corregidos: ${fixed} | ❌ Sin resolver: ${notFound}`);
process.exit(0);
