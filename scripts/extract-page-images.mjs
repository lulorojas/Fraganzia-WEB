// extract-page-images.mjs — Extrae imágenes de páginas específicas del PDF usando pdfjs-dist
// sin necesidad de canvas; obtiene los XObjects de imagen directamente
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Patch para pdfjs-dist en Node.js sin DOM
if (typeof globalThis.DOMMatrix  === 'undefined') globalThis.DOMMatrix  = class { constructor(){} };
if (typeof globalThis.Path2D     === 'undefined') globalThis.Path2D     = class { constructor(){} };
if (typeof globalThis.ImageData  === 'undefined') {
  globalThis.ImageData = class ImageData {
    constructor(data, w, h) { this.data = data; this.width = w; this.height = h; }
  };
}

const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');

const PDF_PATH = join(__dirname, '..', 'CATALOGO ARABES MAYORISTA 13-07.pdf');
const OUT_DIR  = join(__dirname, 'pdf-page-imgs');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const data    = readFileSync(PDF_PATH);
const pdfDoc  = await pdfjsLib.getDocument({
  data: new Uint8Array(data),
  useWorkerFetch: false,
  isEvalSupported: false,
  useSystemFonts: true,
}).promise;

const totalPages = pdfDoc.numPages;
console.log(`PDF: ${totalPages} páginas`);

// Mapeo de páginas conocidas → rango de imágenes esperadas
// Vamos a sacar imágenes de páginas específicas donde esperamos encontrar los productos
const PAGE_RANGE = [
  parseInt(process.argv[2] || '1'),
  parseInt(process.argv[3] || String(totalPages)),
];
console.log(`Extrayendo páginas ${PAGE_RANGE[0]}–${PAGE_RANGE[1]}\n`);

let imgCount = 0;

for (let pageNum = PAGE_RANGE[0]; pageNum <= Math.min(PAGE_RANGE[1], totalPages); pageNum++) {
  const page = await pdfDoc.getPage(pageNum);
  const ops  = await page.getOperatorList();

  const imgNames = [];
  for (let i = 0; i < ops.fnArray.length; i++) {
    // OPS.paintImageXObject = 85, paintJpegXObject = 82
    if (ops.fnArray[i] === 85 || ops.fnArray[i] === 82) {
      const imgName = ops.argsArray[i][0];
      if (!imgNames.includes(imgName)) imgNames.push(imgName);
    }
  }

  for (const imgName of imgNames) {
    try {
      const objs = page.objs;
      const img  = await new Promise((resolve, reject) => {
        objs.get(imgName, (obj) => {
          if (obj) resolve(obj); else reject(new Error('null object'));
        });
      });

      if (!img || !img.data) continue;

      // Si es JPEG (nativeImageDecoder), img.data es el Buffer JPEG crudo
      const isJpeg = img.data instanceof Uint8Array && img.data[0] === 0xFF && img.data[1] === 0xD8;

      if (isJpeg) {
        const fname = `page${String(pageNum).padStart(2,'0')}_${imgName.replace(/\//g,'_')}.jpg`;
        writeFileSync(join(OUT_DIR, fname), Buffer.from(img.data));
        console.log(`  pág ${pageNum} JPEG ${fname} (${(img.data.length/1024).toFixed(1)} KB)`);
        imgCount++;
      } else if (img.data instanceof Uint8ClampedArray || img.data instanceof Uint8Array) {
        // Raw RGBA data — guardar como raw (no muy útil sin canvas, pero al menos lo registramos)
        console.log(`  pág ${pageNum} RAW ${imgName} ${img.width}×${img.height} (${(img.data.length/1024).toFixed(1)} KB raw)`);
      }
    } catch (e) {
      console.log(`  pág ${pageNum} ERR ${imgName}: ${e.message}`);
    }
  }

  process.stdout.write(`✓p${pageNum} `);
}

console.log(`\n\nTotal JPEG extraídas: ${imgCount} → ${OUT_DIR}`);
process.exit(0);
