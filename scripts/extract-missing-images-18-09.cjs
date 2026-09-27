// scripts/extract-missing-images-18-09.cjs
// Extrae las imágenes (rasters) de las páginas del PDF 18-09 donde están los
// 36 productos sin foto, para poder matchearlas visualmente.
const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'pdf-images-18-09');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const PAGES = [3, 4, 8, 14, 15, 21, 27, 28, 29, 31, 34, 36, 40, 43, 44, 45, 47, 48, 49, 50, 51];

async function main() {
  const p = new PDFParse({ data: fs.readFileSync(path.join(__dirname, '..', 'CATALOGO ARABES MAYORISTA 18-09.pdf')) });
  const r = await p.getImage({ imageThreshold: 100 });

  for (const pgNum of PAGES) {
    const pg = r.pages.find((pp) => pp.pageNumber === pgNum);
    if (!pg) { console.log(`Página ${pgNum}: no encontrada`); continue; }

    const imgs = pg.images.filter((i) => i.width > 150 && i.height > 150);
    console.log(`Página ${pgNum}: ${imgs.length} imágenes`);

    imgs.forEach((img, idx) => {
      const filename = `p${pgNum}_${idx}.png`;
      const outPath = path.join(OUT, filename);
      if (img.dataUrl) {
        const base64 = img.dataUrl.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
      } else if (img.data && img.data.length > 0) {
        fs.writeFileSync(outPath, Buffer.from(img.data));
      } else {
        console.log(`  sin datos: ${img.name}`);
      }
    });
  }
  await p.destroy();
  console.log(`\nGuardado en: ${OUT}`);
}

main().catch((e) => console.error(e.message));
