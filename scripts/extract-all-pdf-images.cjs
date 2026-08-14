// extract-all-pdf-images.cjs
// Extrae TODAS las imágenes de producto del PDF (todas las páginas) y las guarda con metadatos
const {PDFParse} = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const PDF_PATH = path.join(__dirname, '..', 'CATALOGO ARABES MAYORISTA 13-07.pdf');
const OUT_DIR = path.join(__dirname, 'pdf-all-images');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

const MIN_SIZE = 180; // ignorar logos/iconos pequeños

function parsePage(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  // Buscar productos: líneas que parecen nombres de perfume (mayúsculas, tienen marca conocida o ML)
  const products = [];
  const marcas = ['LATTAFA','EMPER','FRAGRANCE WORLD','FRENCH AVENUE','BHARARA','MAISON ALHAMBRA',
    'KHADLAJ','AL HARAMAIN','ARMAF','PARIS CORNER','DUMONT',"L'AFFAIR",'RAYHAAN','AFNAN','AJMAL',
    'Arabian NIGHTS','GRANDEUR ELITE','SWISS ARABIAN','KHALIS','GRANDEUR'];
  let inImagen = false;
  const imagenBrands = [];

  for (const line of lines) {
    const upper = line.toUpperCase();
    // Detectar sección IMAGEN
    if (upper.includes('IMAGEN')) {
      inImagen = true;
      // Extraer marcas que aparecen en la misma línea que IMAGEN
      const after = upper.replace('IMAGEN','').trim();
      if (after) imagenBrands.push(...after.split(/\s+/).filter(w => w.length > 2));
      continue;
    }
    if (inImagen) {
      const words = upper.split(/\s+/).filter(w => w.length > 2);
      imagenBrands.push(...words);
      if (imagenBrands.length > 20) inImagen = false; // stop after enough
      continue;
    }
    // Detectar productos: línea con ML o que empieza con marca conocida
    if ((upper.includes('ML') || upper.includes('100') || upper.includes('EDP')) &&
        marcas.some(m => upper.includes(m))) {
      products.push(line.replace(/\$[\d.,]+/g, '').replace(/[\d,]+$/,'').trim());
    }
  }
  return { products, imagenBrands: [...new Set(imagenBrands)] };
}

async function main() {
  const data = fs.readFileSync(PDF_PATH);
  const pdf = new PDFParse({verbosity: 0, data});
  const textResult = await pdf.getText({});
  const imageResult = await pdf.getImage({imageThreshold: MIN_SIZE});

  const metadata = [];

  for (const {pageNumber, images} of imageResult.pages) {
    if (!images || images.length === 0) continue;

    const pageText = textResult.pages[pageNumber - 1]?.text || '';
    const {products, imagenBrands} = parsePage(pageText);

    const pageImages = [];
    let saved = 0;
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img.dataUrl) continue;
      const fname = `p${pageNumber}_${i}.png`;
      const fpath = path.join(OUT_DIR, fname);
      // dataUrl = 'data:image/png;base64,...'
      const b64 = img.dataUrl.split(',')[1];
      if (!b64) continue;
      fs.writeFileSync(fpath, Buffer.from(b64, 'base64'));
      pageImages.push({ file: fname, width: img.width, height: img.height, index: i });
      saved++;
    }

    if (saved > 0) {
      metadata.push({ page: pageNumber, images: pageImages, products, imagenBrands });
      console.log(`Page ${pageNumber}: ${saved} images, ${products.length} products`);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, '_metadata.json'), JSON.stringify(metadata, null, 2));
  console.log(`\nTotal pages with images: ${metadata.length}`);
  console.log(`Metadata saved to pdf-all-images/_metadata.json`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
