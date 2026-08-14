// render-pdf-pages.mjs
// Renderiza páginas del PDF como PNG usando pdfjs-dist + canvas
import { createCanvas, createImageData } from 'canvas';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import canvasPkg from 'canvas';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Patch globals para pdfjs-dist
if (typeof globalThis.DOMMatrix === 'undefined') globalThis.DOMMatrix = canvasPkg.DOMMatrix;
if (typeof globalThis.Path2D    === 'undefined') globalThis.Path2D    = canvasPkg.Path2D;
if (typeof globalThis.ImageData === 'undefined') globalThis.ImageData = canvasPkg.ImageData;

// NodeCanvasFactory requerido por pdfjs-dist v4+
class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    return { canvas, context: canvas.getContext('2d') };
  }
  reset(canvasAndCtx, width, height) {
    canvasAndCtx.canvas.width  = width;
    canvasAndCtx.canvas.height = height;
  }
  destroy(canvasAndCtx) {
    canvasAndCtx.canvas.width  = 0;
    canvasAndCtx.canvas.height = 0;
    canvasAndCtx.canvas  = null;
    canvasAndCtx.context = null;
  }
}

const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');

const PDF_PATH = join(__dirname, '..', 'CATALOGO ARABES MAYORISTA 13-07.pdf');
const OUT_DIR  = join(__dirname, 'pdf-pages');
mkdirSync(OUT_DIR, { recursive: true });

const data       = readFileSync(PDF_PATH);
const canvasFactory = new NodeCanvasFactory();
const loadingTask = pdfjsLib.getDocument({
  data: new Uint8Array(data),
  useWorkerFetch: false,
  isEvalSupported: false,
  useSystemFonts: true,
  canvasFactory,
});
const pdfDoc = await loadingTask.promise;

const totalPages = pdfDoc.numPages;
const startPage  = parseInt(process.argv[2] || '3');
const endPage    = parseInt(process.argv[3] || String(totalPages));
console.log(`PDF: ${totalPages} páginas — renderizando ${startPage}–${endPage}`);

for (let pageNum = startPage; pageNum <= Math.min(endPage, totalPages); pageNum++) {
  try {
    const page     = await pdfDoc.getPage(pageNum);
    const scale    = 1.0;
    const viewport = page.getViewport({ scale });

    const { canvas, context } = canvasFactory.create(
      Math.round(viewport.width),
      Math.round(viewport.height)
    );

    await page.render({ canvasContext: context, viewport, canvasFactory }).promise;

    const fname = `page_${String(pageNum).padStart(2, '0')}.png`;
    writeFileSync(join(OUT_DIR, fname), canvas.toBuffer('image/png'));
    process.stdout.write(`✅ ${fname}  `);
  } catch (err) {
    console.log(`\n⚠️  Pág ${pageNum}: ${err.message}`);
  }
}
console.log(`\nListo → ${OUT_DIR}`);
process.exit(0);
