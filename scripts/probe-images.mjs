// scripts/probe-images.mjs
// Prueba HEAD en múltiples URLs candidatas para los 12 productos sin imagen.
// Reporta qué URLs responden 200 OK.

const NZ  = 'https://www.perfumenz.co.nz/cdn/shop/files/';
const NZP = 'https://www.perfumenz.co.nz/cdn/shop/products/';
const SK  = 'https://silkperfumes.cl/cdn/shop/files/';
const SKP = 'https://silkperfumes.cl/cdn/shop/products/';

const CANDIDATES = [
  // ── EMPER ─────────────────────────────────────────────────────────────────
  [NZ + 'emper-blue-stallion_1024x1024.png',             'EMPER BLUE STALLION'],
  [NZ + 'emper-blue-stallion-edp_1024x1024.png',         'EMPER BLUE STALLION'],
  [NZP + 'emper-blue-stallion_1024x1024.png',            'EMPER BLUE STALLION'],
  [SK + 'emper-blue-stallion_1024x1024.png',             'EMPER BLUE STALLION'],
  [SKP + 'emper-blue-stallion_1024x1024.png',            'EMPER BLUE STALLION'],

  [NZ + 'emper-uomo-intense_1024x1024.png',              'EMPER UOMO INTENSE'],
  [NZP + 'emper-uomo-intense_1024x1024.png',             'EMPER UOMO INTENSE'],
  [SK + 'emper-uomo-intense_1024x1024.png',              'EMPER UOMO INTENSE'],

  [NZ + 'emper-donna-intense_1024x1024.png',             'EMPER DONNA INTENSE'],
  [NZP + 'emper-donna-intense_1024x1024.png',            'EMPER DONNA INTENSE'],
  [SK + 'emper-donna-intense_1024x1024.png',             'EMPER DONNA INTENSE'],

  [NZ + 'emper-mandora_1024x1024.png',                   'EMPER MANDORA'],
  [NZP + 'emper-mandora_1024x1024.png',                  'EMPER MANDORA'],
  [SK + 'emper-mandora_1024x1024.png',                   'EMPER MANDORA'],

  [NZ + 'emper-phantom-my-hero_1024x1024.png',           'EMPER PHANTOM'],
  [NZ + 'emper-phantom_1024x1024.png',                   'EMPER PHANTOM'],
  [NZP + 'emper-phantom-my-hero_1024x1024.png',          'EMPER PHANTOM'],
  [SK + 'emper-phantom-my-hero_1024x1024.png',           'EMPER PHANTOM'],
  [SK + 'emper-phantom_1024x1024.png',                   'EMPER PHANTOM'],

  // ── LATTAFA ───────────────────────────────────────────────────────────────
  [NZ + 'lattafa-fakhar-rose_1024x1024.png',             'LATTAFA FAKHAR ROSE'],
  [NZ + 'fakhar-rose-by-lattafa_1024x1024.png',          'LATTAFA FAKHAR ROSE'],
  [NZP + 'lattafa-fakhar-rose_1024x1024.png',            'LATTAFA FAKHAR ROSE'],
  [SK + 'lattafa-fakhar-rose_1024x1024.png',             'LATTAFA FAKHAR ROSE'],

  [NZ + 'lattafa-maahir-gold_1024x1024.png',             'LATTAFA MAAHIR GOLD'],
  [NZ + 'maahir-gold_1024x1024.png',                     'LATTAFA MAAHIR GOLD'],
  [NZP + 'lattafa-maahir-gold_1024x1024.png',            'LATTAFA MAAHIR GOLD'],
  [SK + 'lattafa-maahir-gold_1024x1024.png',             'LATTAFA MAAHIR GOLD'],

  [NZ + 'lattafa-sehr-magic-of_1024x1024.png',           'LATTAFA SEHR MAGIC'],
  [NZ + 'lattafa-sehr-magic_1024x1024.png',              'LATTAFA SEHR MAGIC'],
  [NZ + 'sehr-magic-of_1024x1024.png',                   'LATTAFA SEHR MAGIC'],
  [NZP + 'lattafa-sehr-magic-of_1024x1024.png',          'LATTAFA SEHR MAGIC'],
  [SK + 'lattafa-sehr-magic-of_1024x1024.png',           'LATTAFA SEHR MAGIC'],
  [SK + 'lattafa-sehr-magic_1024x1024.png',              'LATTAFA SEHR MAGIC'],

  // ── FRENCH AVENUE ─────────────────────────────────────────────────────────
  [NZ + 'french-avenue-gemini_1024x1024.png',            'FRENCH AVENUE GEMINI'],
  [NZ + 'french-avenue-genesis-gemini_1024x1024.png',    'FRENCH AVENUE GEMINI'],
  [NZP + 'french-avenue-gemini_1024x1024.png',           'FRENCH AVENUE GEMINI'],
  [SK + 'french-avenue-gemini_1024x1024.png',            'FRENCH AVENUE GEMINI'],

  [NZ + 'french-avenue-aether-extrait_1024x1024.png',    'FRENCH AVENUE AETHER'],
  [NZ + 'french-avenue-aether_1024x1024.png',            'FRENCH AVENUE AETHER'],
  [NZP + 'french-avenue-aether-extrait_1024x1024.png',   'FRENCH AVENUE AETHER'],
  [SK + 'french-avenue-aether_1024x1024.png',            'FRENCH AVENUE AETHER'],
  [SK + 'french-avenue-aether-extrait_1024x1024.png',    'FRENCH AVENUE AETHER'],

  // ── MAISON ALHAMBRA ────────────────────────────────────────────────────────
  [NZ + 'maison-alhambra-rose-seduction-vip_1024x1024.png',    'ALHAMBRA ROSE SEDUCTION'],
  [NZ + 'alhambra-rose-seduction-vip_1024x1024.png',           'ALHAMBRA ROSE SEDUCTION'],
  [NZ + 'rose-seduction-vip_1024x1024.png',                    'ALHAMBRA ROSE SEDUCTION'],
  [NZP + 'maison-alhambra-rose-seduction-vip_1024x1024.png',   'ALHAMBRA ROSE SEDUCTION'],
  [SK + 'maison-alhambra-rose-seduction-vip_1024x1024.png',    'ALHAMBRA ROSE SEDUCTION'],
  [SK + 'alhambra-rose-seduction-vip_1024x1024.png',           'ALHAMBRA ROSE SEDUCTION'],

  // ── L'AFFAIR ──────────────────────────────────────────────────────────────
  [NZ + 'l-affair-summer-shockwave_1024x1024.png',       "L'AFFAIR SUMMER SHOCKWAVE"],
  [NZ + 'laffair-summer-shockwave_1024x1024.png',        "L'AFFAIR SUMMER SHOCKWAVE"],
  [NZ + 'summer-shockwave_1024x1024.png',                "L'AFFAIR SUMMER SHOCKWAVE"],
  [NZP + 'l-affair-summer-shockwave_1024x1024.png',      "L'AFFAIR SUMMER SHOCKWAVE"],
  [SK + 'l-affair-summer-shockwave_1024x1024.png',       "L'AFFAIR SUMMER SHOCKWAVE"],
  [SK + 'laffair-summer-shockwave_1024x1024.png',        "L'AFFAIR SUMMER SHOCKWAVE"],

  // ── BHARARA MAST ──────────────────────────────────────────────────────────
  [NZ + 'bharara-mast-rome-pour-homme_1024x1024.png',    'BHARARA MAST ROME'],
  [NZ + 'bharara-rome-pour-homme_1024x1024.png',         'BHARARA MAST ROME'],
  [NZ + 'bharara-mast-perfume-rome_1024x1024.png',       'BHARARA MAST ROME'],
  [NZP + 'bharara-mast-rome-pour-homme_1024x1024.png',   'BHARARA MAST ROME'],
  [SK + 'bharara-mast-rome-pour-homme_1024x1024.png',    'BHARARA MAST ROME'],
  [SK + 'bharara-rome-pour-homme_1024x1024.png',         'BHARARA MAST ROME'],
];

async function head(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(7000) });
    return r.ok;
  } catch { return false; }
}

console.log(`Probando ${CANDIDATES.length} URLs...\n`);

const found = {};
for (const [url, label] of CANDIDATES) {
  const ok = await head(url);
  if (ok) {
    console.log(`✅ [${label}] ${url}`);
    if (!found[label]) found[label] = url;
  }
}

console.log(`\n── Resumen ──────────────────────────────`);
const keys = Object.keys(found);
console.log(`Encontradas: ${keys.length}`);
keys.forEach(k => console.log(`  ${k}: ${found[k]}`));
process.exit(0);
