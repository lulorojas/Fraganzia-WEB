// scripts/fix-images.mjs
// 1. Corrige imágenes incorrectas (ej: ART OF NATURE II tenía imagen de I).
// 2. Para productos sin imagen busca en múltiples CDNs via HTTP HEAD.
// Uso: node scripts/fix-images.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

// ─── Utilidades ────────────────────────────────────────────────────────────
function toSlug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
/** Slug sin la marca y sin el sufijo NNml */
function productOnly(nombre, marca) {
  return nombre
    .replace(new RegExp('^' + marca.toUpperCase() + '\\s+', 'i'), '')
    .replace(/\s+\d+ML$/i, '').trim();
}

async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch { return false; }
}

// ─── Correcciones forzadas (sobreescribe cualquier imagen actual) ──────────
// Formato: [nombre_contains_uppercase, correct_url]
const FORCED = [
  // ART OF NATURE II había recibido la imagen de ART OF NATURE I
  ['LATTAFA ART OF NATURE II 100ML',
    'https://privateblends.com.au/cdn/shop/files/03idbtmknq_533x_59c4b951-85f6-4378-aff2-4d9bc18dca99.jpg?v=1730706683&width=1600'],
  // LATTAFA ASDAAF AMEERAT AL ARAB PRIVE ROSE recibió un image.png genérico
  ['LATTAFA ASDAAF AMEERAT AL ARAB PRIVE ROSE 100ML',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-asdaaf-ameerat-al-arab-prive-rose_1024x1024.png'],
];

// ─── Mapeos manuales adicionales (solo para productos SIN imagen) ──────────
const MANUAL = [
  // Afnan
  ['AFNAN 9PM ELIXIR PARFUM',
    'https://www.perfumenz.co.nz/cdn/shop/files/afnan-9pm-elixir_1024x1024.png'],
  ['AFNAN HISTORIC OLMEDA',
    'https://cdn.shopify.com/s/files/1/0259/7733/products/afnan-historic-olmeda_1024x1024.png'],
  // Al Haramain
  ['AL HARAMAIN AMBER OUD GOLD EDITION 200ML',
    'https://www.perfumenz.co.nz/cdn/shop/files/haramain-amber-oud-gold-200ml_1024x1024.png'],
  ['AL HARAMAIN DETOUR NOIR EXCLUSIF',
    'https://www.perfumenz.co.nz/cdn/shop/files/haramain-detour-noir-exclusif_1024x1024.png'],
  ['AL HARAMAIN DETOUR NOIR INTENSE',
    'https://www.perfumenz.co.nz/cdn/shop/files/haramain-detour-noir-intense_1024x1024.png'],
  // Al Wataniah
  ['AL WATANIAH AMEERATI',
    'https://cdn.gamma.app/al71mod0a3v067z/25fd00ea5863449ca4224a482021e98f/original/image.png'],
  ['AL WATANIAH ROSE MYSTERY INTENSE',
    'https://cdn.gamma.app/al71mod0a3v067z/0ad432f8e40a416f81cb4a213868a180/original/OIP.jpg'],
  ['AL WATANIAH THAHAANI',
    'https://cdn.gamma.app/al71mod0a3v067z/42d6774603034426b57cd91d517cc1ff/original/17239077119689c6b53f099d04c4a4021b79350aa0_thumbnail_900x.jpg'],
  // Armaf
  ['ARMAF CLUB DE NUIT BLING',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-bling_1024x1024.png'],
  ['ARMAF CLUB DE NUIT ICONIC',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-iconic_1024x1024.png'],
  ['ARMAF CLUB DE NUIT INTENSE 105ML',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-intense-man_1024x1024.png'],
  ['ARMAF CLUB DE NUIT LIONHEART MAN',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-lionheart-man_1024x1024.png'],
  ['ARMAF CLUB DE NUIT MILESTONE',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-milestone_1024x1024.png'],
  ['ARMAF CLUB DE NUIT PRECIEUX I',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-precieux-i_1024x1024.png'],
  ['ARMAF CLUB DE NUIT SILLAGE',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-sillage_1024x1024.png'],
  ['ARMAF CLUB DE NUIT URBAN MAN ELIXIR',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-urban-man-elixir_1024x1024.png'],
  ['ARMAF ETER ARABIAN SKY',
    'https://silkperfumes.cl/cdn/shop/files/armaf-eter-arabian-sky-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ETER DESERT NIGHT',
    'https://silkperfumes.cl/cdn/shop/files/armaf-eter-desert-night-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ETER MAGICAL OUD',
    'https://silkperfumes.cl/cdn/shop/files/armaf-eter-magical-oud-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY AOUD',
    'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-aoud-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY AQUA',
    'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-aqua-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY ARTISTO',
    'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-artisto-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY DUBAI CHOCOLAT',
    'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-dubai-chocolat-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY GO MANGO',
    'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-go-mango-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY HOMME FOR MEN',
    'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-homme-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY LIMONI',
    'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-limoni-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY MANDARIN SKY 100ML',
    'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-mandarin-sky-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY MANDARIN SKY ELIXIR',
    'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-mandarin-sky-elixir-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY MEGA LE',
    'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-mega-le-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY SPECTRA',
    'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-spectra-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF ODYSSEY TYRANT',
    'https://silkperfumes.cl/cdn/shop/files/armaf-odyssey-tyrant-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF TAG HIM UOMO ROSSO',
    'https://silkperfumes.cl/cdn/shop/files/armaf-tag-him-uomo-rosso-edp-100ml-Silk-Perfumes.png'],
  ['ARMAF TAG HIM 100ML',
    'https://silkperfumes.cl/cdn/shop/files/armaf-tag-him-edp-100ml-Silk-Perfumes.png'],
  // Bharara
  ['BHARARA CHOCOLATE',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-chocolate_1024x1024.png'],
  ['BHARARA DOUBLE BLEU',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-double-bleu_1024x1024.png'],
  ['BHARARA KING EDP 100ML',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-king-edp-100ml_1024x1024.png'],
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
  ['BHARARA VIKING BEIRUT',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-viking-beirut_1024x1024.png'],
  ['BHARARA VIKING DUBAI',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-viking-dubai_1024x1024.png'],
  // Dumont
  ['DUMONT NITRO INTENSE',
    'https://www.perfumenz.co.nz/cdn/shop/files/dumont-nitro-intense_1024x1024.png'],
  ['DUMONT NITRO RED',
    'https://www.perfumenz.co.nz/cdn/shop/files/dumont-nitro-red_1024x1024.png'],
  ['DUMONT NITRO WHITE',
    'https://www.perfumenz.co.nz/cdn/shop/files/dumont-nitro-white_1024x1024.png'],
  // Emper
  ['EMPER BLUE STALLION',
    'https://www.perfumenz.co.nz/cdn/shop/files/emper-blue-stallion_1024x1024.png'],
  ['EMPER DONNA INTENSE',
    'https://www.perfumenz.co.nz/cdn/shop/files/emper-donna-intense_1024x1024.png'],
  ['EMPER MANDORA',
    'https://www.perfumenz.co.nz/cdn/shop/files/emper-mandora_1024x1024.png'],
  ['EMPER PHANTOM MY HERO',
    'https://www.perfumenz.co.nz/cdn/shop/files/emper-phantom-my-hero_1024x1024.png'],
  ['EMPER UOMO INTENSE',
    'https://www.perfumenz.co.nz/cdn/shop/files/emper-uomo-intense_1024x1024.png'],
  // Fragrance World
  ['FRAGRANCE WORLD IMPERIUM',
    'https://silkperfumes.cl/cdn/shop/files/fragrance-world-imperium-edp-100ml-Silk-Perfumes.webp'],
  ['FRAGRANCE WORLD JUST AZRAQ',
    'https://silkperfumes.cl/cdn/shop/files/fragrance-world-just-azraq-edp-100ml-Silk-Perfumes.webp'],
  ['FRAGRANCE WORLD SEDLEY',
    'https://silkperfumes.cl/cdn/shop/files/fragrance-world-sedley-edp-100ml-Silk-Perfumes.webp'],
  ['FRAGRANCE WORLD STAR MEN NEBULA',
    'https://silkperfumes.cl/cdn/shop/files/fragrance-world-star-men-nebula-edp-100ml-Silk-Perfumes.webp'],
  // French Avenue
  ['FRENCH AVENUE AETHER EXTRAIT',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-aether-extrait_1024x1024.png'],
  ['FRENCH AVENUE ATLANTIS EXTRAIT',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-atlantis-extrait_1024x1024.png'],
  ['FRENCH AVENUE AVE SWEET PARADISE',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-ave-sweet-paradise_1024x1024.png'],
  ['FRENCH AVENUE COCOA MORADO',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-cocoa-morado_1024x1024.png'],
  ['FRENCH AVENUE GENESIS AQUARIUS',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-aquarius_1024x1024.png'],
  ['FRENCH AVENUE GENESIS ARIES',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-aries_1024x1024.png'],
  ['FRENCH AVENUE GENESIS CANCER',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-cancer_1024x1024.png'],
  ['FRENCH AVENUE GENESIS CAPRICORN',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-capricorn_1024x1024.png'],
  ['FRENCH AVENUE GENESIS GEMINI',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-gemini_1024x1024.png'],
  ['FRENCH AVENUE GENESIS LEO',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-leo_1024x1024.png'],
  ['FRENCH AVENUE GENESIS LIBRA',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-libra_1024x1024.png'],
  ['FRENCH AVENUE GENESIS PISCES',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-pisces_1024x1024.png'],
  ['FRENCH AVENUE GENESIS SAGITTARIUS',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-sagittarius_1024x1024.png'],
  ['FRENCH AVENUE GENESIS SCORPIO',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-scorpio_1024x1024.png'],
  ['FRENCH AVENUE GENESIS TAURUS',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-taurus_1024x1024.png'],
  ['FRENCH AVENUE GENESIS VIRGO',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-genesis-virgo_1024x1024.png'],
  ['FRENCH AVENUE MERINGUE',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-meringue_1024x1024.png'],
  ['FRENCH AVENUE SPECTRE GHOST',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-spectre-ghost_1024x1024.png'],
  ['FRENCH AVENUE SPECTRE WRAITH',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-spectre-wraith_1024x1024.png'],
  ['FRENCH AVENUE VULCAN FEU',
    'https://www.perfumenz.co.nz/cdn/shop/files/french-avenue-vulcan-feu_1024x1024.png'],
  // Grandeur Tubbees
  ['GRANDEUR TUBBEES BUBBLE GUM',
    'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-bubble-gum_1024x1024.png'],
  ['GRANDEUR TUBBEES CHOCOLATE FUDGE',
    'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-chocolate-fudge_1024x1024.png'],
  ['GRANDEUR TUBBEES COOKIES & CREAM',
    'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-cookies-cream_1024x1024.png'],
  ['GRANDEUR TUBBEES CANDY POP',
    'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-candy-pop_1024x1024.png'],
  ['GRANDEUR TUBBEES CHERRY LUXE',
    'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-cherry-luxe_1024x1024.png'],
  ['GRANDEUR TUBBEES PINK SUGAR',
    'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-pink-sugar_1024x1024.png'],
  ['GRANDEUR TUBBEES STRAWBERRY CHEESECAKE',
    'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-strawberry-cheesecake_1024x1024.png'],
  ['GRANDEUR TUBBEES UNICORN VANILLA',
    'https://www.perfumenz.co.nz/cdn/shop/files/grandeur-tubbees-unicorn-vanilla_1024x1024.png'],
  // Khadlaj
  ['KHADLAJ ISLAND',
    'https://www.perfumenz.co.nz/cdn/shop/files/khadlaj-island_1024x1024.png'],
  // L'Affair
  ["L'AFFAIR SUMMER SHOCKWAVE",
    'https://www.perfumenz.co.nz/cdn/shop/files/l-affair-summer-shockwave_1024x1024.png'],
  // Lattafa
  ['LATTAFA AJWAA',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-ajwaa_1024x1024.webp'],
  ['LATTAFA AJWAD PINK TO PINK',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-ajwad-pink-to-pink_1024x1024.png'],
  ['LATTAFA AJWAD 60ML',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-ajwad_1024x1024.png'],
  ['LATTAFA AL NOBLE AMEER',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-al-noble-ameer_1024x1024.png'],
  ['LATTAFA AL NOBLE SAFEER',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-al-noble-safeer_1024x1024.png'],
  ['LATTAFA AL NOBLE WAZEER',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-al-noble-wazeer_1024x1024.png'],
  ['LATTAFA ANA ABIYEDH ROUGE',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-ana-abiyedh-rouge_1024x1024.png'],
  ['LATTAFA ANA ABIYEDH 60ML',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-ana-abiyedh_1024x1024.png'],
  ['LATTAFA ANGHAM SECOND SONG',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-angham-second-song_1024x1024.png'],
  ['LATTAFA ANGHAM 100ML',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-angham_1024x1024.png'],
  ['LATTAFA ART OF NATURE II',
    'https://privateblends.com.au/cdn/shop/files/03idbtmknq_533x_59c4b951-85f6-4378-aff2-4d9bc18dca99.jpg?v=1730706683&width=1600'],
  ['LATTAFA ART OF UNIVERSE',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-art-of-universe_1024x1024.png'],
  ['LATTAFA ASAD BOURBON',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-asad-bourbon_1024x1024.png'],
  ['LATTAFA ASAD ELIXIR',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-asad-elixir_1024x1024.png'],
  ['LATTAFA ASAD ZANZIBAR',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-asad-zanzibar_1024x1024.png'],
  ['LATTAFA ASDAAF AMEER AL ARAB IMPERIUM',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-asdaaf-ameer-al-arab-imperium_1024x1024.png'],
  ['LATTAFA ATHEERI',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-atheeri_1024x1024.png'],
  ['LATTAFA BADE\'E AL OUD FOR GLORY',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-badee-al-oud-for-glory_1024x1024.png'],
  ['LATTAFA BADE\'E AL OUD NOBLE BLUSH',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-badee-al-oud-noble-blush_1024x1024.png'],
  ['LATTAFA ECLAIRE BANOFFI',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-eclaire-banoffi_1024x1024.png'],
  ['LATTAFA EMEER',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-emeer_1024x1024.png'],
  ['LATTAFA FAKHAR EXTRAIT GOLD',
    'https://www.intenseoud.com/cdn/shop/files/715FNrIwXsL._SL1500.jpg?v=1690391630'],
  ['LATTAFA FAKHAR PLATIN',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-fakhar-platin_1024x1024.png'],
  ['LATTAFA FAKHAR ROSE',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-fakhar-rose_1024x1024.png'],
  ['LATTAFA HAYA',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-haya_1024x1024.png'],
  ['LATTAFA HAYAATI FLORENCE',
    'https://momperfume.in/cdn/shop/files/m63279828063-1.jpg?v=1737597423&width=1946'],
  ['LATTAFA HER CONFESSION',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-her-confession_1024x1024.png'],
  ['LATTAFA HIS CONFESSION',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-his-confession_1024x1024.png'],
  ['LATTAFA ISHQ AL SHUYUKH SILVER',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-ishq-al-shuyukh-silver_1024x1024.png'],
  ['LATTAFA KHAMRAH DUKHAN',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-khamrah-dukhan_1024x1024.png'],
  ['LATTAFA LAIL MALEKI',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-lail-maleki_1024x1024.png'],
  ['LATTAFA LIAM BLUE SHINE',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-liam-blue-shine_1024x1024.png'],
  ['LATTAFA LIAM GREY',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-liam-grey_1024x1024.png'],
  ['LATTAFA MAAHIR GOLD',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-maahir-gold_1024x1024.png'],
  ['LATTAFA MAAHIR LEGACY',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-maahir-legacy_1024x1024.png'],
  ['LATTAFA MASHRABYA',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-mashrabya_1024x1024.png'],
  ['LATTAFA MAYAR CHERRY',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-mayar-cherry_1024x1024.png'],
  ['LATTAFA MAYAR NATURAL INTENSE',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-mayar-natural-intense_1024x1024.png'],
  ['LATTAFA MAYAR 100ML',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-mayar_1024x1024.png'],
  ['LATTAFA MUSAMAM 100ML',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-musamam_1024x1024.png'],
  ['LATTAFA NEBRAS ELIXIR',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-nebras-elixir_1024x1024.png'],
  ['LATTAFA NEBRAS 100ML',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-nebras_1024x1024.png'],
  ['LATTAFA OPULENT DUBAI',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-opulent-dubai_1024x1024.png'],
  ['LATTAFA OPULENT OUD',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-opulent-oud_1024x1024.png'],
  ['LATTAFA PRIDE PISA',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-pride-pisa_1024x1024.png'],
  ['LATTAFA SAKEENA',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-sakeena_1024x1024.png'],
  ['LATTAFA SEHR MAGIC OF',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-sehr-magic-of_1024x1024.png'],
  ['LATTAFA SHAHEEN GOLD',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-shaheen-gold_1024x1024.png'],
  ['LATTAFA SHAHEEN SILVER',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-shaheen-silver_1024x1024.png'],
  ['LATTAFA THE KINGDOM MASCULINO',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-the-kingdom_1024x1024.png'],
  ['LATTAFA THE KINGDOM FEMENINO',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-the-kingdom-woman_1024x1024.png'],
  ['LATTAFA VICTORIA',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-victoria_1024x1024.png'],
  ['LATTAFA YARA CANDY',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-yara-candy_1024x1024.png'],
  // Maison Alhambra
  ['MAISON ALHAMBRA ALPINE HOMME SPORT',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-alpine-homme-sport_1024x1024.png'],
  ['MAISON ALHAMBRA DELILAH',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-delilah_1024x1024.png'],
  ['MAISON ALHAMBRA FLAMING ELIXIR',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-flaming-elixir_1024x1024.png'],
  ['MAISON ALHAMBRA GLACIER BELLA',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-glacier-bella_1024x1024.png'],
  ['MAISON ALHAMBRA GLACIER BOLD',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-glacier-bold_1024x1024.png'],
  ['MAISON ALHAMBRA GLACIER POUR HOMME',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-glacier-pour-homme_1024x1024.png'],
  ['MAISON ALHAMBRA JEAN LOWE IMMORTAL',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-jean-lowe-immortal_1024x1024.png'],
  ['MAISON ALHAMBRA JEAN LOWE NOIR',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-jean-lowe-noir_1024x1024.png'],
  ['MAISON ALHAMBRA JORGE DI PROFUMO AQUA',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-jorge-di-profumo-aqua_1024x1024.png'],
  ['MAISON ALHAMBRA LA VITA',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-la-vita_1024x1024.png'],
  ['MAISON ALHAMBRA LA VIVACITE',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-la-vivacite_1024x1024.png'],
  ['MAISON ALHAMBRA LIBRE LEONIE',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-libre-leonie_1024x1024.png'],
  ['MAISON ALHAMBRA LOVE SPARK',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-love-spark_1024x1024.png'],
  ['MAISON ALHAMBRA OPULENCE LEATHER',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-opulence-leather_1024x1024.png'],
  ['MAISON ALHAMBRA PACIFIC BLUE',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-pacific-blue_1024x1024.png'],
  ['MAISON ALHAMBRA PHILOS PURA',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-philos-pura_1024x1024.png'],
  ['MAISON ALHAMBRA PINK VELVET',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-pink-velvet_1024x1024.png'],
  ['MAISON ALHAMBRA REYNA',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-reyna_1024x1024.png'],
  ['MAISON ALHAMBRA ROSE SEDUCTION VIP FEMME',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-rose-seduction-vip-femme_1024x1024.png'],
  ['MAISON ALHAMBRA SCEPTRE MALACHITE',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-sceptre-malachite_1024x1024.png'],
  ['MAISON ALHAMBRA SENSUAL VANILLA',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-sensual-vanilla_1024x1024.png'],
  ['MAISON ALHAMBRA TERRA',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-terra_1024x1024.png'],
  ['MAISON ALHAMBRA THE MYTH',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-the-myth_1024x1024.png'],
  ['MAISON ALHAMBRA VICTORIOSO 100ML',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-victorioso_1024x1024.png'],
  ['MAISON ALHAMBRA ALIVE NOW',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-alive-now_1024x1024.png'],
  // Orientica
  ['ORIENTICA AMBER ROUGE',
    'https://www.perfumenz.co.nz/cdn/shop/files/orientica-amber-rouge_1024x1024.png'],
  ['ORIENTICA ROYAL AMBER',
    'https://www.perfumenz.co.nz/cdn/shop/files/orientica-royal-amber_1024x1024.png'],
  // Paris Corner
  ['PARIS CORNER VOUX ELEGANTE',
    'https://www.perfumenz.co.nz/cdn/shop/files/paris-corner-voux-elegante_1024x1024.png'],
  ['PARIS CORNER VOUX TURQUOISE',
    'https://www.perfumenz.co.nz/cdn/shop/files/paris-corner-voux-turquoise_1024x1024.png'],
  ['PARIS CORNER MARSHMALLOW BLUSH',
    'https://www.perfumenz.co.nz/cdn/shop/files/paris-corner-marshmallow-blush_1024x1024.png'],
  ['PARIS CORNER TASKEEN CARAMEL CASCADE',
    'https://www.perfumenz.co.nz/cdn/shop/files/paris-corner-taskeen-caramel-cascade_1024x1024.png'],
  // Rasasi
  ['RASASI HAWAS BLACK',
    'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-black_1024x1024.png'],
  ['RASASI HAWAS ELIXIR',
    'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-elixir_1024x1024.png'],
  ['RASASI HAWAS FIRE',
    'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-fire_1024x1024.png'],
  ['RASASI HAWAS FOR HER',
    'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-for-her_1024x1024.png'],
  ['RASASI HAWAS FOR HIM ICE',
    'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-for-him-ice_1024x1024.png'],
  ['RASASI HAWAS FOR HIM MALIBU',
    'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-for-him-malibu_1024x1024.png'],
  ['RASASI HAWAS FOR HIM TROPICAL',
    'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-for-him-tropical_1024x1024.png'],
  ['RASASI HAWAS FOR HIM 100ML',
    'https://www.perfumenz.co.nz/cdn/shop/files/rasasi-hawas-for-him_1024x1024.png'],
  // Rave
  ['RAVE NOW MEN',
    'https://www.perfumenz.co.nz/cdn/shop/files/rave-now-men_1024x1024.png'],
  // Rayhaan
  ['RAYHAAN ELIXIR',
    'https://cdn.gamma.app/al71mod0a3v067z/c455eb622b034741ba958a7c0464254b/original/Untitled_design_-_2024-12-31T120620.819.webp'],
  ['RAYHAAN TROPICAL VIBES',
    'https://cdn.gamma.app/al71mod0a3v067z/2bff4442c6914b05bdd7dd0bced26232/original/rayhaan-1132149890.webp'],
  // Riiffs
  ['RIIFFS MOMENTO',
    'https://www.perfumenz.co.nz/cdn/shop/files/riiffs-momento_1024x1024.png'],
  // Zimaya
  ['ZIMAYA AMBER IS GREAT',
    'https://www.perfumenz.co.nz/cdn/shop/files/zimaya-amber-is-great_1024x1024.png'],
  // Anfar
  ['ANFAR ROYAL IMPERIAL',
    'https://silkperfumes.cl/cdn/shop/files/anlo22.png?v=1720207703&width=1214'],
  // Bharara femeninos
  ['BHARARA ROSE',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-rose_1024x1024.png'],
  ['BHARARA NICHE FEMME',
    'https://www.perfumenz.co.nz/cdn/shop/files/bharara-niche-femme_1024x1024.png'],
  // Armaf femeninos
  ['ARMAF CLUB DE NUIT IMPERIALE',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-imperiale_1024x1024.png'],
  ['ARMAF CLUB DE NUIT INTENSE FEMENINO',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-intense-woman_1024x1024.png'],
  ['ARMAF CLUB DE NUIT MALEKA',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-maleka_1024x1024.png'],
  ['ARMAF CLUB DE NUIT OUD PARFUM',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-oud-parfum_1024x1024.png'],
  ['ARMAF CLUB DE NUIT PRECIEUX IV',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-precieux-iv_1024x1024.png'],
  ['ARMAF CLUB DE NUIT WOMAN',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-club-de-nuit-woman_1024x1024.png'],
  ['ARMAF MISS ARMAF ATTITUDE',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-miss-armaf-attitude_1024x1024.png'],
  ['ARMAF MISS ARMAF CATWALK',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-miss-armaf-catwalk_1024x1024.png'],
  ['ARMAF ODYSSEY EAU DE MONTAGNE',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-odyssey-eau-de-montagne_1024x1024.png'],
  ['ARMAF ODYSSEY MARSHMALLOW',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-odyssey-marshmallow_1024x1024.png'],
  ['ARMAF YUM YUM',
    'https://www.perfumenz.co.nz/cdn/shop/files/armaf-yum-yum_1024x1024.png'],
  // Lattafa femeninos
  ['LATTAFA AFEEF',
    'https://www.perfumenz.co.nz/cdn/shop/files/lattafa-afeef_1024x1024.png'],
  // Zimaya femeninos
  ['ZIMAYA TIRAMISU CARAMEL',
    'https://www.perfumenz.co.nz/cdn/shop/files/zimaya-tiramisu-caramel_1024x1024.png'],
  ['ZIMAYA TIRAMISU COCO',
    'https://www.perfumenz.co.nz/cdn/shop/files/zimaya-tiramisu-coco_1024x1024.png'],
  // Maison Alhambra femeninos extra
  ['MAISON ALHAMBRA ALIVE NOW',
    'https://www.perfumenz.co.nz/cdn/shop/files/maison-alhambra-alive-now_1024x1024.png'],
];

// ─── CDN fallbacks dinámicos por marca (se prueban si el manual no fue ok) ──
// Genera múltiples URLs candidatas para un producto dado y las prueba con HEAD.
function candidateUrls(nombre, marca, volumenML) {
  const prodName = nombre
    .replace(new RegExp('^' + marca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+', 'i'), '')
    .replace(/\s+\d+ML$/i, '').trim();
  const brandSlug  = toSlug(marca.replace("'", '').replace('Al ', ''));
  const prodSlug   = toSlug(prodName);
  const fullSlug   = toSlug(marca + ' ' + prodName);
  const vol        = volumenML;

  return [
    // perfumenz.co.nz - los más confiables (sin versión)
    `https://www.perfumenz.co.nz/cdn/shop/files/${fullSlug}_1024x1024.webp`,
    `https://www.perfumenz.co.nz/cdn/shop/files/${fullSlug}_1024x1024.png`,
    `https://www.perfumenz.co.nz/cdn/shop/files/${fullSlug}_1024x1024.jpg`,
    // silkperfumes.cl - bueno para Armaf y Fragrance World
    `https://silkperfumes.cl/cdn/shop/files/${fullSlug}-edp-${vol}ml-Silk-Perfumes.png`,
    `https://silkperfumes.cl/cdn/shop/files/${fullSlug}-edp-${vol}ml-Silk-Perfumes.webp`,
    `https://silkperfumes.cl/cdn/shop/files/${fullSlug}-edp-${vol}ml-Silk-Perfumes.jpg`,
  ];
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const snap = await db.collection('perfumes').get();
let forced = 0, updated = 0, notFound = 0;

for (const doc of snap.docs) {
  const data = doc.data();
  const name = (data.nombre || '').toUpperCase();

  // 1. Aplicar correcciones forzadas (independiente de si tiene imagen)
  const fix = FORCED.find(([key]) => name === key || name.includes(key));
  if (fix) {
    await doc.ref.update({ imagenes: [fix[1]] });
    forced++;
    console.log(`🔧 FIXED  ${data.nombre}`);
    continue;
  }

  // 2. Solo productos SIN imagen a partir de aquí
  if (data.imagenes?.length > 0) continue;

  // 3. Intentar mapeo manual
  const manual = MANUAL.find(([key]) => name.includes(key));
  if (manual) {
    const url = manual[1];
    // Verificar que la URL responde (si no es una URL genérica de gamma)
    const isGamma = url.includes('cdn.gamma.app');
    const ok = isGamma || await headOk(url);
    if (ok) {
      await doc.ref.update({ imagenes: [url] });
      updated++;
      console.log(`✅ MANUAL ${data.nombre}`);
      continue;
    }
    // Si el manual no responde, seguimos al dinámico
    console.log(`⚠️ MANUAL FAIL ${data.nombre} → ${url}`);
  }

  // 4. Intentar candidatos dinámicos de CDN
  const candidates = candidateUrls(data.nombre, data.marca, data.volumenML);
  let found = false;
  for (const url of candidates) {
    if (await headOk(url)) {
      await doc.ref.update({ imagenes: [url] });
      updated++;
      console.log(`🌐 CDN    ${data.nombre} → ${url}`);
      found = true;
      break;
    }
  }
  if (!found) {
    notFound++;
    console.log(`❌ NO IMG ${data.nombre}`);
  }
}

console.log(`\n🎉 Forzadas: ${forced} | Nuevas: ${updated} | Sin resolver: ${notFound}`);
process.exit(0);
