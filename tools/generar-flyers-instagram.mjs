// Genera las piezas de Instagram de Fraganzia (posts 1080x1350 e historias
// 1080x1920) en public/flyers/instagram/*.png, con la identidad de la web
// (fondo oscuro, violeta, Cinzel + Manrope) y fotos reales del catálogo.
//
// Uso: node tools/generar-flyers-instagram.mjs
// Necesita Chrome (CHROME_PATH o la ruta de Windows) y leer Firestore (REST).
import { mkdirSync, existsSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { listarColeccion } from './lib/firestore-rest.mjs';
import { hashTexto } from '../src/utils/hash.js';

const SALIDA = 'public/flyers/instagram';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const WEB = 'fraganzia-e9b70.web.app';
const IG = '@fraganzia.ar';

// Decants disponibles (los mismos de src/utils/decants.js).
const DECANTS = [
  'Al Haramain Amber Oud Gold Edition', 'Afnan 9PM Night Out', 'Maison Alhambra Philos Pura', 'Rasasi Hawas For Him Ice',
  'Lattafa Yara Rosa', 'Armaf Club de Nuit Intense', 'Afnan 9PM', 'Armaf Odyssey Mandarin Sky',
  'Lattafa Confidential Private Gold', 'Rayhaan Wolf', 'Maison Alhambra Jorge di Profumo Deep Blue', 'Lattafa Ajwad',
];

const fuente = (nombre) => pathToFileURL(join('src/assets/fonts', nombre)).href;
const logo = pathToFileURL(join('public', 'logo-256.webp')).href;

// Foto local de un perfume (public/img/p/<hash>-800.webp o /productos-bot/...).
function fotoDe(url) {
  if (!url) return null;
  const archivo = url.startsWith('/') ? join('public', decodeURI(url)) : join('public/img/p', `${hashTexto(url)}-800.webp`);
  return existsSync(archivo) ? pathToFileURL(archivo).href : null;
}

const CSS = `
@font-face{font-family:Cinzel;src:url(${fuente('cinzel.woff2')})}
@font-face{font-family:Manrope;src:url(${fuente('manrope.woff2')})}
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#06040D;--v:#7B2FBE;--l:#C084FC;--t:#F8F4FF;--s:#C9BEE0}
body{background:var(--bg);color:var(--t);font-family:Manrope,sans-serif;position:relative;overflow:hidden}
.g1{position:absolute;right:-220px;top:-260px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,#7B2FBE70,transparent 65%)}
.g2{position:absolute;left:-260px;bottom:-300px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,#C084FC26,transparent 65%)}
.marco{position:absolute;inset:36px;border:2px solid #C084FC33;border-radius:36px}
.in{position:relative;height:100%;display:flex;flex-direction:column;padding:96px 90px 84px}
.marca{display:flex;align-items:center;gap:22px}
.marca img{width:76px;height:76px;border-radius:50%;box-shadow:0 0 36px #7B2FBE99}
.marca span{font-family:Cinzel;font-size:38px;letter-spacing:8px;font-weight:600}
h1{font-family:Cinzel;font-weight:600;line-height:1.08;letter-spacing:2px}
h1 em{font-style:normal;color:var(--l)}
p.sub{color:var(--s);line-height:1.45}
.pie{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;color:var(--l);letter-spacing:3px;text-transform:uppercase;font-weight:600}
.boton{display:inline-block;background:linear-gradient(135deg,#7B2FBE,#9B59D0);padding:26px 46px;border-radius:999px;font-weight:800;font-size:34px;color:#fff;box-shadow:0 14px 50px #7B2FBE88}
.chip{display:inline-block;border:2px solid #C084FC66;background:#7B2FBE22;border-radius:999px;padding:12px 26px;margin:7px;font-weight:600;color:var(--t)}
.num{font-family:Cinzel;color:var(--l);font-weight:700}
.tarjeta{background:#ffffff0d;border:2px solid #C084FC33;border-radius:30px;padding:34px 38px}
.foto{background:#fff;border-radius:28px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.foto img{max-width:88%;max-height:88%;object-fit:contain}
`;

const pagina = (w, h, cuerpo) =>
  `<!doctype html><meta charset="utf-8"><style>${CSS}body{width:${w}px;height:${h}px}</style><body><div class="g1"></div><div class="g2"></div><div class="marco"></div><div class="in">${cuerpo}</div></body>`;

const marca = `<div class="marca"><img src="${logo}"><span>FRAGANZIA</span></div>`;
const pie = (txt = WEB) => `<div class="pie" style="font-size:26px"><span>${txt}</span><span>${IG}</span></div>`;

function piezas(destacados) {
  const fotos = destacados.slice(0, 4);
  const grilla = fotos
    .map((p) => `<div class="foto" style="height:330px"><img src="${p.foto}"></div>`)
    .join('');
  const nombres = fotos.map((p) => `<div style="font-size:23px;text-align:center;color:var(--s);margin-top:12px;font-weight:600">${p.nombre.replace(/ \d+ ?ml$/i, '')}</div>`);
  const celdas = fotos.map((p, i) => `<div><div class="foto" style="height:330px"><img src="${p.foto}"></div>${nombres[i]}</div>`).join('');

  const post = (id, cuerpo) => ({ id, w: 1080, h: 1350, html: pagina(1080, 1350, cuerpo) });
  const story = (id, cuerpo) => ({ id, w: 1080, h: 1920, html: pagina(1080, 1920, cuerpo) });

  return [
    post('post-1-presentacion', `${marca}
      <h1 style="font-size:104px;margin-top:150px">Perfumes<br><em>árabes</em><br>originales</h1>
      <p class="sub" style="font-size:38px;margin-top:44px;max-width:780px">Más de 400 fragancias de Lattafa, Armaf, Al Haramain, Afnan y más. Precios en pesos, envíos en AMBA.</p>
      <div style="margin-top:56px"><span class="chip" style="font-size:28px">Catálogo online</span><span class="chip" style="font-size:28px">Decants</span><span class="chip" style="font-size:28px">Asistente</span></div>
      ${pie()}`),

    post('post-2-decants', `${marca}
      <h1 style="font-size:92px;margin-top:90px">Probalo antes<br>de <em>comprarlo</em></h1>
      <p class="sub" style="font-size:36px;margin-top:30px">Decants originales en fracciones de:</p>
      <div style="display:flex;gap:26px;margin-top:34px">
        ${[3, 5, 10].map((ml) => `<div class="tarjeta" style="flex:1;text-align:center"><div class="num" style="font-size:96px;line-height:1">${ml}</div><div style="font-size:30px;color:var(--s);margin-top:6px">ml</div></div>`).join('')}
      </div>
      <div style="margin-top:40px">${DECANTS.slice(0, 8).map((d) => `<span class="chip" style="font-size:24px">${d}</span>`).join('')}<span class="chip" style="font-size:24px">y más…</span></div>
      ${pie(`${WEB}/decants`)}`),

    post('post-3-asistente', `${marca}
      <h1 style="font-size:96px;margin-top:130px">¿No sabés<br>cuál <em>elegir</em>?</h1>
      <p class="sub" style="font-size:38px;margin-top:40px;max-width:800px">Respondé unas preguntas y nuestro asistente te recomienda el perfume ideal: para vos o para regalar.</p>
      <div class="tarjeta" style="margin-top:56px;font-size:32px;line-height:1.9;color:var(--s)">
        <div><span class="num">1</span> &nbsp;¿Para quién es?</div>
        <div><span class="num">2</span> &nbsp;¿Qué aromas te gustan?</div>
        <div><span class="num">3</span> &nbsp;¿Para qué momento?</div>
        <div><span class="num">4</span> &nbsp;¿Cuánto querés invertir?</div>
      </div>
      <div style="margin-top:48px"><span class="boton">Encontrá tu perfume</span></div>
      ${pie()}`),

    post('post-4-como-comprar', `${marca}
      <h1 style="font-size:90px;margin-top:100px">Comprar es<br><em>muy fácil</em></h1>
      <div style="margin-top:56px;display:flex;flex-direction:column;gap:26px">
        ${[
          ['1', 'Elegí', 'Mirá el catálogo con fotos, notas y precio en pesos.'],
          ['2', 'Pagá como prefieras', 'Transferencia o efectivo, con precio diferenciado.'],
          ['3', 'Recibilo', 'Envíos en AMBA y seguimiento de tu pedido.'],
        ].map(([n, t, d]) => `<div class="tarjeta" style="display:flex;gap:34px;align-items:center"><div class="num" style="font-size:84px;line-height:1">${n}</div><div><div style="font-size:42px;font-weight:800">${t}</div><div style="font-size:28px;color:var(--s);margin-top:8px">${d}</div></div></div>`).join('')}
      </div>
      ${pie()}`),

    post('post-5-favoritos', `${marca}
      <h1 style="font-size:84px;margin-top:80px">Nuestros <em>destacados</em></h1>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:44px">${celdas}</div>
      <p class="sub" style="font-size:30px;margin-top:34px">Guardá tus favoritos y armá tu carrito en nuestra web.</p>
      ${pie()}`),

    post('post-6-original', `${marca}
      <h1 style="font-size:96px;margin-top:130px">Calidad árabe,<br><em>precio justo</em></h1>
      <p class="sub" style="font-size:38px;margin-top:40px;max-width:820px">Fragancias intensas, de larga duración y con carácter. Descubrí por qué los perfumes árabes están revolucionando el mundo.</p>
      <div style="margin-top:56px;display:flex;gap:22px">
        ${[['+400', 'perfumes'], ['3-10', 'ml en decants'], ['AMBA', 'envíos']].map(([a, b]) => `<div class="tarjeta" style="flex:1;text-align:center;padding:30px 12px"><div class="num" style="font-size:62px">${a}</div><div style="font-size:24px;color:var(--s);margin-top:6px">${b}</div></div>`).join('')}
      </div>
      ${pie()}`),

    story('story-1-web', `${marca}
      <h1 style="font-size:124px;margin-top:300px">Nuestra<br>web ya<br>está <em>online</em></h1>
      <p class="sub" style="font-size:44px;margin-top:56px;max-width:820px">Catálogo completo, carrito, favoritos y pedidos en pesos. Todo en un solo lugar.</p>
      <div style="margin-top:80px"><span class="boton" style="font-size:42px">Entrá y mirá</span></div>
      ${pie()}`),

    story('story-2-decants', `${marca}
      <h1 style="font-size:116px;margin-top:240px">Decants<br><em>3 · 5 · 10</em> ml</h1>
      <p class="sub" style="font-size:44px;margin-top:50px;max-width:820px">Probá los perfumes árabes más pedidos sin comprar el frasco entero.</p>
      <div style="margin-top:56px">${DECANTS.map((d) => `<span class="chip" style="font-size:27px">${d}</span>`).join('')}</div>
      ${pie(`${WEB}/decants`)}`),

    story('story-3-asistente', `${marca}
      <h1 style="font-size:116px;margin-top:280px">Encontrá<br>tu <em>perfume</em><br>ideal</h1>
      <p class="sub" style="font-size:44px;margin-top:56px;max-width:840px">Cuatro preguntas y te recomendamos los que mejor te van. También para regalar.</p>
      <div style="margin-top:80px"><span class="boton" style="font-size:42px">Probá el asistente</span></div>
      ${pie()}`),
  ];
}

const perfumes = await listarColeccion('perfumes', { campos: ['nombre', 'imagenes', 'destacado', 'activo', 'disponible'] });
const destacados = perfumes
  .filter((p) => p.activo === true && p.disponible === true && p.destacado)
  .map((p) => ({ nombre: p.nombre, foto: fotoDe(p.imagenes?.[0]) }))
  .filter((p) => p.foto);
if (destacados.length < 4) throw new Error('Hacen falta al menos 4 perfumes destacados con foto local');

mkdirSync(SALIDA, { recursive: true });
const TEMPORAL = mkdtempSync(join(tmpdir(), 'flyers-'));
const navegador = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files'] });
try {
  for (const { id, w, h, html } of piezas(destacados)) {
    const archivoHtml = join(TEMPORAL, `${id}.html`);
    writeFileSync(archivoHtml, html);
    const tab = await navegador.newPage();
    await tab.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await tab.goto(pathToFileURL(archivoHtml).href, { waitUntil: 'load' });
    await tab.evaluate(() => document.fonts.ready);
    await tab.screenshot({ path: join(SALIDA, `${id}.png`) });
    await tab.close();
    console.log(`${id}.png`);
  }
} finally {
  await navegador.close();
}
