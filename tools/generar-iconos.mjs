// Genera los íconos de la marca a partir del símbolo (frasco con hombros en arco + F):
//   public/favicon.svg, icon-32/180/192/512.png y og-fraganzia.png (imagen para redes).
// Usa Chrome (puppeteer-core) para rasterizar. Correr solo si cambia la marca:
//   node tools/generar-iconos.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// La fuente va incrustada: una página cargada con setContent no puede leer archivos locales.
const FUENTE = `data:font/woff2;base64,${readFileSync('src/assets/fonts/outfit.woff2').toString('base64')}`;

const DEGRADE = `<linearGradient id="oro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9D5FF"/><stop offset=".5" stop-color="#C084FC"/><stop offset="1" stop-color="#7B2FBE"/></linearGradient>`;

// Silueta del frasco en su caja de 64x76. Sólida (íconos chicos: se lee mejor) o en línea (imagen grande).
const CUERPO = 'M27.5 10H36.5V14.5C37 18 41 19.5 45.5 23C52 28 56 33 56 41V72H8V41C8 33 12 28 18.5 23C23 19.5 27 18 27.5 14.5Z';
const EFE = 'M24 61V33H42V38H29.6V44.2H38.6V49.2H29.6V61Z';
const solida = (fondo) => `
  <rect x="25.5" y="3" width="13" height="7" rx="1.4" fill="url(#oro)"/>
  <path d="${CUERPO}" fill="url(#oro)"/>
  <path d="${EFE}" fill="${fondo}"/>`;
const linea = () => `
  <rect x="25.5" y="3" width="13" height="7" rx="1.4" fill="url(#oro)"/>
  <path d="${CUERPO}" stroke="url(#oro)" stroke-width="2.4" stroke-linejoin="round" fill="none"/>
  <path d="${EFE}" fill="url(#oro)"/>`;

// La "A" de la marca: arco ogival con travesaño (igual que ArcoA en LogoFraganzia.jsx).
const arcoA = (margen) => `<svg viewBox="0 0 16 18" style="width:.62em;height:.72em;margin-right:${margen}em" fill="none"><path d="M2.2 18V7.6C2.2 4.6 5 2.2 8 .2C11 2.2 13.8 4.6 13.8 7.6V18M2.2 12.6H13.8" stroke="currentColor" stroke-width="2.4"/></svg>`;

/** Ícono cuadrado: fondo oscuro con el frasco centrado (zona segura ~64 %). */
function icono(px, { redondeado }) {
  const alto = px * 0.62;
  const ancho = (alto * 64) / 76;
  const x = (px - ancho) / 2;
  const y = (px - alto) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
    <defs>${DEGRADE}</defs>
    <rect width="${px}" height="${px}" ${redondeado ? `rx="${px * 0.22}"` : ''} fill="#06040D"/>
    <svg x="${x}" y="${y}" width="${ancho}" height="${alto}" viewBox="0 0 64 76">${solida('#06040D')}</svg>
  </svg>`;
}

const og = `<!doctype html><meta charset="utf-8"><style>
  @font-face { font-family: Outfit; font-weight: 300 700; src: url('${FUENTE}') format('woff2'); }
  html, body { margin: 0; width: 1200px; height: 630px; background: #06040D; font-family: Outfit, sans-serif; color: #F8F4FF; }
  .fondo { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 80% at 50% 0%, rgba(123,47,190,.34), transparent 70%); }
  .caja { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px; }
  .nombre { font-size: 76px; font-weight: 500; letter-spacing: .32em; display: flex; align-items: baseline; color: #F8F4FF; }
  .linea { width: 120px; height: 1px; background: linear-gradient(90deg, transparent, #C084FC, transparent); }
  .lema { font-size: 30px; font-weight: 300; letter-spacing: .28em; margin-right: -.28em; color: #C084FC; text-transform: uppercase; }
  .borde { position: absolute; inset: 26px; border: 1px solid rgba(192,132,252,.35); }
</style><div class="fondo"></div><div class="borde"></div>
<div class="caja">
  <svg width="${(150 * 64) / 76}" height="150" viewBox="0 0 64 76"><defs>${DEGRADE}</defs>${linea()}</svg>
  <div class="nombre">FR${arcoA(.32)}G${arcoA(.32)}NZI${arcoA(0)}</div>
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
