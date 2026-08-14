// extract-pdf-images.mjs — Extrae todas las imágenes JPEG/PNG embebidas en el PDF del catálogo
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PDF_PATH = join(__dirname, '..', 'CATALOGO ARABES MAYORISTA 13-07.pdf');
const OUT_DIR = join(__dirname, 'pdf-images');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const buf = readFileSync(PDF_PATH);
let count = 0;

// ── Extraer JPEGs ─────────────────────────────────────────────────────────────
// JPEG: empieza con FF D8 FF, termina con FF D9
let pos = 0;
while (pos < buf.length - 2) {
  // Buscar SOI marker
  const soi = buf.indexOf(Buffer.from([0xFF, 0xD8, 0xFF]), pos);
  if (soi === -1) break;

  // Buscar EOI marker desde soi+2
  const eoi = buf.indexOf(Buffer.from([0xFF, 0xD9]), soi + 2);
  if (eoi === -1) break;

  const imgBuf = buf.slice(soi, eoi + 2);

  // Solo guardar si parece una imagen real (>5KB para evitar thumbnails de 1x1)
  if (imgBuf.length > 5000) {
    const fname = `img_${String(count).padStart(3, '0')}.jpg`;
    writeFileSync(join(OUT_DIR, fname), imgBuf);
    console.log(`JPEG ${fname} — ${(imgBuf.length / 1024).toFixed(1)} KB`);
    count++;
  }

  pos = eoi + 2;
}

// ── Extraer PNGs ──────────────────────────────────────────────────────────────
// PNG: empieza con 89 50 4E 47 0D 0A 1A 0A, termina con IEND chunk (49 45 4E 44 AE 42 60 82)
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const IEND    = Buffer.from([0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);

pos = 0;
while (pos < buf.length - 8) {
  const pngStart = buf.indexOf(PNG_SIG, pos);
  if (pngStart === -1) break;

  const pngEnd = buf.indexOf(IEND, pngStart + 8);
  if (pngEnd === -1) break;

  const imgBuf = buf.slice(pngStart, pngEnd + 8);
  if (imgBuf.length > 5000) {
    const fname = `img_${String(count).padStart(3, '0')}.png`;
    writeFileSync(join(OUT_DIR, fname), imgBuf);
    console.log(`PNG  ${fname} — ${(imgBuf.length / 1024).toFixed(1)} KB`);
    count++;
  }

  pos = pngEnd + 8;
}

console.log(`\nTotal extraídas: ${count} imágenes → ${OUT_DIR}`);
