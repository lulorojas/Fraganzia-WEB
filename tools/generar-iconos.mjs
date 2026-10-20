// Genera los íconos de la marca a partir del monograma (arco + F):
//   public/favicon.svg, icon-32/180/192/512.png y og-fraganzia.png (imagen para redes).
// Usa Chrome (puppeteer-core) para rasterizar. Correr solo si cambia la marca:
//   node tools/generar-iconos.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// La fuente va incrustada: una página cargada con setContent no puede leer archivos locales.
const FUENTE = `data:font/woff2;base64,${readFileSync('src/assets/fonts/outfit.woff2').toString('base64')}`;

const DEGRADE = `<linearGradient id="oro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9D5FF"/><stop offset=".5" stop-color="#C084FC"/><stop offset="1" stop-color="#7B2FBE"/></linearGradient>`;

// El monograma en su caja de 64x76. `fino` agrega el arco interior (solo en tamaños grandes).
const marca = (fino) => `
  <path d="M6 72V34C6 20 19 11 32 3C45 11 58 20 58 34V72" stroke="url(#oro)" stroke-width="${fino ? 2.2 : 3.8}" stroke-linejoin="round" fill="none"/>
  ${fino ? '<path d="M12 72V35C12 23 23 15.5 32 9.5C41 15.5 52 23 52 35V72" stroke="url(#oro)" stroke-width=".9" opacity=".55" stroke-linejoin="round" fill="none"/>' : ''}
  <path d="M24 56V30H42V34.5H29.5V41H38.5V45.5H29.5V56Z" fill="url(#oro)"/>`;

/** Ícono cuadrado: fondo oscuro con el monograma centrado (zona segura ~64 %). */
function icono(px, { redondeado, fino }) {
  const alto = px * 0.62;
  const ancho = (alto * 64) / 76;
  const x = (px - ancho) / 2;
  const y = (px - alto) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
    <defs>${DEGRADE}</defs>
    <rect width="${px}" height="${px}" ${redondeado ? `rx="${px * 0.22}"` : ''} fill="#06040D"/>
    <svg x="${x}" y="${y}" width="${ancho}" height="${alto}" viewBox="0 0 64 76">${marca(fino)}</svg>
  </svg>`;
}

const og = `<!doctype html><meta charset="utf-8"><style>
  @font-face { font-family: Outfit; font-weight: 300 700; src: url('${FUENTE}') format('woff2'); }
  html, body { margin: 0; width: 1200px; height: 630px; background: #06040D; font-family: Outfit, sans-serif; color: #F8F4FF; }
  .fondo { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 80% at 50% 0%, rgba(123,47,190,.34), transparent 70%); }
  .caja { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px; }
  .nombre { font-size: 76px; font-weight: 500; letter-spacing: .34em; margin-right: -.34em; }
  .linea { width: 120px; height: 1px; background: linear-gradient(90deg, transparent, #C084FC, transparent); }
  .lema { font-size: 30px; font-weight: 300; letter-spacing: .28em; margin-right: -.28em; color: #C084FC; text-transform: uppercase; }
  .borde { position: absolute; inset: 26px; border: 1px solid rgba(192,132,252,.35); }
</style><div class="fondo"></div><div class="borde"></div>
<div class="caja">
  <svg width="${(150 * 64) / 76}" height="150" viewBox="0 0 64 76"><defs>${DEGRADE}</defs>${marca(true)}</svg>
  <div class="nombre">FRAGANZIA</div>
  <div class="linea"></div>
  <div class="lema">Perfumes árabes originales</div>
</div>`;

writeFileSync('public/favicon.svg', icono(64, { redondeado: true, fino: false }).replace(/\n\s*/g, ''));

const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true });
const pagina = await navegador.newPage();
for (const [px, archivo, opciones] of [
  [32, 'icon-32.png', { redondeado: true, fino: false }],
  [180, 'icon-180.png', { redondeado: false, fino: false }],
  [192, 'icon-192.png', { redondeado: false, fino: false }],
  [512, 'icon-512.png', { redondeado: false, fino: true }],
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
