// find-product-pages.mjs — Usa pdfjs-dist para encontrar en qué página están los productos
// buscando por texto en cada página del PDF
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (typeof globalThis.DOMMatrix === 'undefined') globalThis.DOMMatrix = class { constructor(){} };
if (typeof globalThis.Path2D   === 'undefined') globalThis.Path2D   = class { constructor(){} };
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class {
    constructor(data, w, h) { this.data = data; this.width = w; this.height = h; }
  };
}

const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');

const PDF_PATH = join(__dirname, '..', 'CATALOGO ARABES MAYORISTA 13-07.pdf');
const OUT_DIR  = join(__dirname, 'pdf-product-imgs');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const TARGETS = [
  'RASASI HAWAS FOR HER',
  'WATANI NOIR',
  'KENZ AL MALIK',
  'BHARARA CHOCOLATE',
  'ROSE MYSTERY',
  'SABAH AL WARD',
  'THAHAANI',
  'SULTAN AL LAIL',
];

const data   = readFileSync(PDF_PATH);
const pdfDoc = await pdfjsLib.getDocument({
  data: new Uint8Array(data),
  useWorkerFetch: false,
  isEvalSupported: false,
  useSystemFonts: true,
}).promise;

console.log(`PDF: ${pdfDoc.numPages} páginas`);
const found = {};

for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
  const page    = await pdfDoc.getPage(pageNum);
  const content = await page.getTextContent();
  const text    = content.items.map(i => i.str).join(' ').toUpperCase();

  const matched = TARGETS.filter(t => text.includes(t));
  if (matched.length === 0) continue;

  console.log(`\nPágina ${pageNum}: ${matched.join(', ')}`);
  console.log(`  Texto: ${text.substring(0, 200)}...`);

  // Extraer las imágenes grandes de esta página (probablemente las fotos de producto)
  const ops = await page.getOperatorList();
  const imgNames = [];
  for (let i = 0; i < ops.fnArray.length; i++) {
    if (ops.fnArray[i] === 85 || ops.fnArray[i] === 82) {
      const name = ops.argsArray[i][0];
      if (!imgNames.includes(name)) imgNames.push(name);
    }
  }

  let imgIdx = 0;
  for (const imgName of imgNames) {
    try {
      // Acceso síncrono: después de getOperatorList() los objetos están en caché
      let img = page.objs.get(imgName);

      // Si no está en caché aún, intentar con timeout corto
      if (!img) {
        img = await Promise.race([
          new Promise((resolve) => page.objs.get(imgName, resolve)),
          new Promise((resolve) => setTimeout(() => resolve(null), 500)),
        ]);
      }

      if (!img || !img.data || !img.width || !img.height) continue;

      // Solo guardar imágenes de producto (razonablemente grandes)
      if (img.width < 100 || img.height < 100) continue;

      // Convertir a PNG usando canvas con manejo correcto de RGB/RGBA
      const canvas = createCanvas(img.width, img.height);
      const ctx    = canvas.getContext('2d');

      const bytesPerPixel = img.data.length / (img.width * img.height);
      let rgbaData;

      if (Math.round(bytesPerPixel) === 4) {
        // RGBA — pero verificar si alpha está todo en 0 (imagen opaca sin canal alpha)
        const rawData = img.data instanceof Uint8ClampedArray ? img.data : new Uint8ClampedArray(img.data.buffer);
        // Comprobar si alpha parece ser todo cero (imagen RGB almacenada como RGBA con alpha=0)
        let allZeroAlpha = true;
        for (let i = 3; i < Math.min(rawData.length, 4000); i += 4) {
          if (rawData[i] !== 0) { allZeroAlpha = false; break; }
        }
        if (allZeroAlpha) {
          // Forzar alpha=255 en todos los píxeles
          rgbaData = new Uint8ClampedArray(rawData.length);
          for (let i = 0; i < rawData.length; i += 4) {
            rgbaData[i]   = rawData[i];
            rgbaData[i+1] = rawData[i+1];
            rgbaData[i+2] = rawData[i+2];
            rgbaData[i+3] = 255;
          }
        } else {
          rgbaData = rawData;
        }
      } else if (Math.round(bytesPerPixel) === 3) {
        // RGB — agregar canal alpha=255
        const rawData = img.data instanceof Uint8ClampedArray ? img.data : new Uint8ClampedArray(img.data.buffer);
        rgbaData = new Uint8ClampedArray(img.width * img.height * 4);
        for (let i = 0, j = 0; i < rawData.length; i += 3, j += 4) {
          rgbaData[j]   = rawData[i];
          rgbaData[j+1] = rawData[i+1];
          rgbaData[j+2] = rawData[i+2];
          rgbaData[j+3] = 255;
        }
      } else {
        continue; // formato desconocido
      }

      const id = ctx.createImageData(img.width, img.height);
      id.data.set(rgbaData);
      ctx.putImageData(id, 0, 0);

      for (const m of matched) {
        const fname = `${m.replace(/\s+/g,'_')}_p${pageNum}_${imgIdx}.png`;
        writeFileSync(join(OUT_DIR, fname), canvas.toBuffer('image/png'));
        console.log(`  ✅ Guardado: ${fname} (${img.width}×${img.height})`);
        if (!found[m]) found[m] = [];
        found[m].push(fname);
      }
      imgIdx++;
    } catch (e) {
      // skip
    }
  }
}

console.log('\n=== RESUMEN ===');
for (const t of TARGETS) {
  console.log(`${t}: ${found[t] ? found[t].join(', ') : '❌ NO ENCONTRADO'}`);
}
process.exit(0);
