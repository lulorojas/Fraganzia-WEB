// Genera los íconos de la marca: una F simple (el logo es solo el nombre, no hay símbolo propio):
//   public/favicon.svg, icon-32/180/192/512.png y og-fraganzia.png (imagen para redes).
// Usa Chrome (puppeteer-core) para rasterizar. Correr solo si cambia la marca:
//   node tools/generar-iconos.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// La fuente va incrustada: una página cargada con setContent no puede leer archivos locales.
const FUENTE = `data:font/woff2;base64,${readFileSync('src/assets/fonts/outfit.woff2').toString('base64')}`;
const FONDO = '#06040D';

let n = 0;
/** La F del ícono, en una caja de 64 × 64: trazos redondeados con degradé violeta. */
function marcaF() {
  const id = `f${++n}`;
  return `<defs><linearGradient id="g${id}" gradientUnits="userSpaceOnUse" x1="8" y1="4" x2="56" y2="60"><stop offset="0" stop-color="#F1E3FF"/><stop offset=".45" stop-color="#C084FC"/><stop offset="1" stop-color="#7B2FBE"/></linearGradient></defs>
  <g fill="url(#g${id})"><rect x="16" y="10" width="11" height="46" rx="5.5"/><rect x="16" y="10" width="34" height="11" rx="5.5"/><rect x="16" y="30" width="24" height="10.5" rx="5.25"/></g>`;
}

/** Ícono cuadrado: fondo oscuro con la F centrada (zona segura ~72 %). */
function icono(px, { redondeado }) {
  const lado = px * 0.72;
  const x = (px - lado) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
    <rect width="${px}" height="${px}" ${redondeado ? `rx="${px * 0.22}"` : ''} fill="${FONDO}"/>
    <svg x="${x}" y="${x}" width="${lado}" height="${lado}" viewBox="0 0 64 64">${marcaF()}</svg>
  </svg>`;
}

const og = `<!doctype html><meta charset="utf-8"><style>
  @font-face { font-family: Outfit; font-weight: 300 700; src: url('${FUENTE}') format('woff2'); }
  html, body { margin: 0; width: 1200px; height: 630px; background: ${FONDO}; font-family: Outfit, sans-serif; color: #F8F4FF; }
  .fondo { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 80% at 50% 0%, rgba(123,47,190,.34), transparent 70%); }
  .caja { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px; }
  .nombre { font-size: 92px; font-weight: 300; letter-spacing: .34em; margin-right: -.34em; }
  .linea { width: 120px; height: 1px; background: linear-gradient(90deg, transparent, #C084FC, transparent); }
  .lema { font-size: 30px; font-weight: 300; letter-spacing: .28em; margin-right: -.28em; color: #C084FC; text-transform: uppercase; }
  .borde { position: absolute; inset: 26px; border: 1px solid rgba(192,132,252,.35); }
</style><div class="fondo"></div><div class="borde"></div>
<div class="caja">
  <div class="nombre">FRAGANZIA</div>
  <div class="linea"></div>
  <div class="lema">Perfumes árabes originales</div>
</div>`;

writeFileSync('public/favicon.svg', icono(64, { redondeado: true }).replace(/\n\s*/g, ''));

const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true });
const pagina = await navegador.newPage();
for (const [px, archivo, opciones] of [
  [32, 'icon-32.png', { redondeado: true }],
  [180, 'icon-180.png', { redondeado: false }],
  [192, 'icon-192.png', { redondeado: false }],
  [512, 'icon-512.png', { redondeado: false }],
]) {
  await pagina.setViewport({ width: px, height: px, deviceScaleFactor: 1 });
  await pagina.setContent(`<body style="margin:0;background:transparent">${icono(px, opciones)}</body>`);
  await pagina.screenshot({ path: `public/${archivo}`, omitBackground: true });
  console.log(archivo);
}
await pagina.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await pagina.setContent(og);
await pagina.evaluate(() => document.fonts.ready);
await pagina.screenshot({ path: 'public/og-fraganzia.png' });
console.log('og-fraganzia.png');
await navegador.close();
