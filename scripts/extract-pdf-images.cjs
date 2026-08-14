// scripts/extract-pdf-images.cjs
// Extrae imágenes de páginas específicas del PDF y las guarda en scripts/pdf-images/
const {PDFParse} = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'pdf-images');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

// (pageNumber, [producto1, producto2, ...]) según el orden del IMAGEN del PDF
const PAGE_PRODUCTS = {
  12: ['BHARARA_MAST__BHARARA_VIKING_BEIRUT__BHARARA_VIKING_DUBAI', 'DUMONT_NITRO_INTENSE', 'DUMONT_NITRO_RED', 'DUMONT_NITRO_WHITE', 'EMPER_BLUE_STALLION'],
  13: ['EMPER_MANDORA', 'EMPER_PHANTOM_MY_HERO', 'EMPER_STALLION_53', 'EMPER_UOMO_INTENSE', 'FW_HAYAATI', 'FW_HAYAATI_BEAU', 'FW_IMPERIUM', 'FW_PROUD_OF_YOU'],
  14: ['FW_SEDLEY', 'FW_STAR_MEN_NEBULA', 'FRENCH_AVE_AETHER_EXTRAIT', 'FRENCH_AVE_ATLANTIS', 'FRENCH_AVE_AZZURE_AOUD', 'FRENCH_AVE_ESSENCE_BLANC', 'FRENCH_AVE_GENESIS_AQUARIUS', 'FRENCH_AVE_GENESIS_CAPRICORN'],
  16: ['KHADLAJ_ISLAND', 'LATTAFA_ADEEB', 'LATTAFA_AJWAA', 'LATTAFA_AL_NOBLE_AMEER', 'LATTAFA_AL_NOBLE_SAFEER', 'LAFFAIR_SUMMER_SHOCKWAVE'],
  21: ['LATTAFA_MAAHIR_BLACK', 'LATTAFA_MAAHIR_GOLD', 'LATTAFA_MAAHIR_LEGACY', 'LATTAFA_MASHRABYA', 'LATTAFA_NEBRAS', 'LATTAFA_NICHE_EMARATI', 'LATTAFA_OPULENT_OUD', 'LATTAFA_PRIDE_PISA', 'LATTAFA_QAED_AL_FURSAN'],
  34: ['FRENCH_AVE_SWEET_PARADISE', 'FRENCH_AVE_COCOA_MORADO', 'FRENCH_AVE_GENESIS_ARIES', 'EMPER_DONNA_INTENSE', 'FW_JUST_AZRAQ', 'BHARARA_NICHE_FEMME'],
  37: ['LATTAFA_ATHEERI', 'LATTAFA_BADEE_NOBLE_BLUSH', 'LATTAFA_ECLAIRE', 'LATTAFA_ECLAIRE_BANOFFI', 'LATTAFA_EMAAN', 'LATTAFA_FAKHAR_ROSE', 'LATTAFA_HAYA', 'LATTAFA_HAYAATI_FLORENCE', 'LATTAFA_HER_CONFESSION'],
  39: ['LATTAFA_SEHR_MAGIC_OF', 'LATTAFA_TERIAQ', 'LATTAFA_THE_KINGDOM_FEM', 'LATTAFA_VICTORIA', 'LATTAFA_YARA_CANDY', 'LATTAFA_YARA_ELIXIR', 'LATTAFA_YARA_MOI', 'LATTAFA_YARA_ROSA', 'LATTAFA_YARA_TOUS'],
};

async function main() {
  const p = new PDFParse({verbosity: 0, data: fs.readFileSync(path.join(__dirname, '..', 'CATALOGO ARABES MAYORISTA 13-07.pdf'))});
  const r = await p.getImage({imageThreshold: 100});
  
  for (const [pgNum, products] of Object.entries(PAGE_PRODUCTS)) {
    const pg = r.pages.find(p => p.pageNumber === parseInt(pgNum));
    if (!pg) continue;
    
    // Only product images (>200px)
    const imgs = pg.images.filter(i => i.width > 200 && i.height > 200);
    
    console.log(`\nPage ${pgNum}: ${imgs.length} images, ${products.length} product labels`);
    
    imgs.forEach((img, idx) => {
      const label = products[idx] || `UNKNOWN_${idx}`;
      const filename = `p${pgNum}_${idx}_${label}.png`;
      const outPath = path.join(OUT, filename);
      
      if (img.dataUrl) {
        const base64 = img.dataUrl.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
        console.log(`  ✅ Saved: ${filename} (${img.width}x${img.height})`);
      } else if (img.data && img.data.length > 0) {
        // Save raw data
        fs.writeFileSync(outPath, Buffer.from(img.data));
        console.log(`  ✅ Saved raw: ${filename} (${img.width}x${img.height})`);
      } else {
        console.log(`  ⚠️  No data for: ${img.name}`);
      }
    });
  }
  
  console.log(`\nImages saved to: ${OUT}`);
}

main().catch(e => console.error(e.message));
