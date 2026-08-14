// build-pdf-viewer-light.cjs
// Genera un HTML liviano que carga imágenes desde rutas locales (via servidor)
const {PDFParse} = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const PDF_PATH = path.join(__dirname, '..', 'CATALOGO ARABES MAYORISTA 13-07.pdf');
const IMAGES_DIR = path.join(__dirname, 'pdf-all-images');
const OUT_HTML = path.join(__dirname, '..', 'pdf-viewer-light.html');

async function main() {
  const data = fs.readFileSync(PDF_PATH);
  const pdf = new PDFParse({verbosity: 0, data});
  const textResult = await pdf.getText({});
  const imageResult = await pdf.getImage({imageThreshold: 180});

  const pageImages = {};
  for (const {pageNumber, images} of imageResult.pages) {
    pageImages[pageNumber] = (images || []).filter(img => img.width >= 180 && img.height >= 180);
  }

  let sections = '';

  for (let pageNum = 3; pageNum <= 44; pageNum++) {
    const text = textResult.pages[pageNum - 1]?.text || '';
    const imgs = pageImages[pageNum] || [];
    if (imgs.length === 0) continue;

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const productLines = [];
    let collecting = false;
    let prevLine = '';
    for (const line of lines) {
      if (line === 'MODELO  PRECIO' || line === 'MODELO PRECIO') { collecting = true; continue; }
      if (line === 'IMAGEN' || line.startsWith('IMAGEN') || line.includes('@Franzebi')) { collecting = false; continue; }
      if (collecting) {
        if (line.match(/\d+ USD$/) || line.match(/^\d+ USD$/)) {
          const full = (prevLine + ' ' + line).replace(/\s+\d+ USD$/, '').trim();
          if (full.length > 3) productLines.push(full);
          prevLine = '';
        } else {
          prevLine = prevLine ? prevLine + ' ' + line : line;
        }
      }
    }

    const imagenMatch = text.match(/IMAGEN\s*\n?([^\n@]+)/);
    const imagenBrands = imagenMatch ? imagenMatch[1].trim() : '';

    let imgHtml = '';
    imgs.forEach((img, i) => {
      const fname = `p${pageNum}_${i}.png`;
      const fpath = path.join(IMAGES_DIR, fname);
      if (fs.existsSync(fpath)) {
        // Reference via local server path
        imgHtml += `<div class="ib">
          <img src="/scripts/pdf-all-images/${fname}" loading="lazy" />
          <span>[${i}] ${img.width}×${img.height}</span>
        </div>`;
      }
    });

    sections += `
<div class="page" id="p${pageNum}">
  <h2>Página ${pageNum} · IMAGEN: ${imagenBrands} · (${imgs.length} imgs)</h2>
  <div class="row">
    <div class="prods"><b>Productos:</b><ol>${productLines.map(p=>`<li>${p}</li>`).join('')}</ol></div>
    <div class="imgs">${imgHtml}</div>
  </div>
</div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>PDF Viewer - Fraganzia</title>
<style>
body{font-family:sans-serif;font-size:12px;background:#f0f0f0;margin:0}
h1{text-align:center;padding:12px;background:#222;color:#fff;margin:0}
.page{background:#fff;margin:12px auto;max-width:1100px;padding:12px;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.page h2{margin:0 0 8px;font-size:13px;background:#444;color:#fff;padding:5px 10px;border-radius:4px}
.row{display:flex;gap:12px}
.prods{min-width:250px;max-width:260px}
.prods ol{margin:4px 0;padding-left:18px;line-height:1.7}
.prods li{font-size:11px}
.imgs{display:flex;flex-wrap:wrap;gap:6px}
.ib{border:2px solid #ddd;border-radius:4px;padding:3px;text-align:center;background:#fafafa}
.ib img{max-height:90px;max-width:100px;display:block}
.ib span{display:block;font-size:9px;color:#888}
</style>
</head>
<body>
<h1>Catálogo PDF - Por Página</h1>
${sections}
</body>
</html>`;

  fs.writeFileSync(OUT_HTML, html, 'utf8');
  console.log(`✅ PDF viewer light: ${OUT_HTML}`);
  console.log(`Tamaño: ${(fs.statSync(OUT_HTML).size / 1024).toFixed(0)} KB`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
