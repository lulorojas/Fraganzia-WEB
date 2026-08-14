// build-pdf-viewer.cjs
// Genera un HTML local que muestra cada página del PDF con sus productos e imágenes extraídas
const {PDFParse} = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const PDF_PATH = path.join(__dirname, '..', 'CATALOGO ARABES MAYORISTA 13-07.pdf');
const IMAGES_DIR = path.join(__dirname, 'pdf-all-images');
const OUT_HTML = path.join(__dirname, '..', 'pdf-viewer.html');

async function main() {
  const data = fs.readFileSync(PDF_PATH);
  const pdf = new PDFParse({verbosity: 0, data});
  const textResult = await pdf.getText({});
  const imageResult = await pdf.getImage({imageThreshold: 180});

  // Build page → images map
  const pageImages = {};
  for (const {pageNumber, images} of imageResult.pages) {
    pageImages[pageNumber] = (images || []).filter(img => img.width >= 180 && img.height >= 180);
  }

  let html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>PDF Viewer - Fraganzia</title>
<style>
body{font-family:sans-serif;font-size:12px;background:#f5f5f5}
.page{background:#fff;margin:16px auto;max-width:1100px;padding:16px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.page h2{margin:0 0 8px;font-size:16px;background:#333;color:#fff;padding:6px 12px;border-radius:4px}
.layout{display:flex;gap:16px}
.products{min-width:280px;max-width:300px}
.products ul{margin:0;padding:0 0 0 16px;line-height:1.8}
.products li{font-size:11px}
.images{display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start}
.img-box{border:2px solid #ddd;border-radius:4px;padding:4px;text-align:center;background:#fafafa;cursor:pointer}
.img-box:hover{border-color:#007aff;background:#e8f0ff}
.img-box img{max-height:100px;max-width:110px;display:block;margin:0 auto}
.img-box span{display:block;font-size:9px;color:#888;margin-top:2px}
</style>
</head>
<body>
<h1 style="text-align:center;padding:16px 0">Catálogo PDF - Mapeo de Imágenes</h1>
`;

  for (let pageNum = 3; pageNum <= 44; pageNum++) {
    const text = textResult.pages[pageNum - 1]?.text || '';
    const imgs = pageImages[pageNum] || [];
    if (imgs.length === 0) continue;

    // Extract product lines from page text
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const productLines = [];
    let collecting = false;
    let prevLine = '';
    for (const line of lines) {
      if (line === 'MODELO  PRECIO' || line === 'MODELO PRECIO') { collecting = true; continue; }
      if (line === 'IMAGEN' || line.startsWith('IMAGEN') || line.includes('@Franzebi')) { collecting = false; continue; }
      if (collecting) {
        // Lines with USD are price entries
        if (line.match(/\d+ USD$/) || line.match(/^\d+ USD$/)) {
          // The product name might be on previous line(s)
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

    // Images
    let imgHtml = '';
    imgs.forEach((img, i) => {
      const fname = `p${pageNum}_${i}.png`;
      const fpath = path.join(IMAGES_DIR, fname);
      if (fs.existsSync(fpath)) {
        const b64 = fs.readFileSync(fpath).toString('base64');
        imgHtml += `<div class="img-box" title="${fname}" onclick="this.style.borderColor='#e00'" >
          <img src="data:image/png;base64,${b64}" />
          <span>[${i}] ${img.width}×${img.height}</span>
        </div>`;
      }
    });

    html += `
<div class="page">
  <h2>Página ${pageNum} — IMAGEN: ${imagenBrands || 'ver texto'} (${imgs.length} imágenes)</h2>
  <div class="layout">
    <div class="products">
      <b>Productos en esta página:</b>
      <ul>${productLines.map(p => `<li>${p}</li>`).join('')}</ul>
    </div>
    <div class="images">${imgHtml}</div>
  </div>
</div>`;
  }

  html += '</body></html>';
  fs.writeFileSync(OUT_HTML, html, 'utf8');
  console.log(`✅ PDF viewer generado: ${OUT_HTML}`);
  console.log(`Tamaño: ${(fs.statSync(OUT_HTML).size / 1024 / 1024).toFixed(1)} MB`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
