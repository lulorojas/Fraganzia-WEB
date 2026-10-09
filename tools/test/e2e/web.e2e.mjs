// Pruebas de navegador de la web pública: abren el sitio ya compilado (dist/)
// en Chrome y recorren lo que importa para vender: que cada página cargue sin
// errores (incluida la hidratación de React), el catálogo, el carrito, los
// decants y el asistente "Encontrá tu perfume".
//
// Uso: npm run build && npm run test:e2e
// Necesita Chrome (CHROME_PATH o las rutas habituales). Lee Firestore en modo
// lectura; las ESCRITURAS a Firestore se bloquean en la red, así que estas
// pruebas no suman estadísticas ni pedidos.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { preview } from 'vite';

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((ruta) => ruta && existsSync(ruta));

let servidor;
let navegador;
let base;

before(async () => {
  assert.ok(CHROME, 'No se encontró Chrome (definí CHROME_PATH)');
  assert.ok(existsSync('dist/index.html'), 'Falta dist/: corré npm run build antes');
  servidor = await preview({ preview: { port: 4199, strictPort: false, host: '127.0.0.1' }, logLevel: 'silent' });
  base = servidor.resolvedUrls.local[0].replace(/\/$/, '');
  navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
});

after(async () => {
  await navegador?.close();
  await new Promise((r) => servidor?.httpServer.close(r));
});

// Páginas que Firebase Hosting sirve con el shell vacío (app.html) y no con una
// versión pre-generada (ver rewrites en firebase.json). vite preview las
// resolvería con index.html, que lleva el HTML de la portada.
const SIN_PRERENDER = /^\/(decants|carrito|favoritos|mis-pedidos|pedido\/|login)/;

/** Página nueva con las escrituras a Firestore bloqueadas y los errores recolectados. */
async function abrir(ruta, { espera = 'domcontentloaded', conservar = false } = {}) {
  const page = await navegador.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  // Cada pestaña nueva arranca sin carrito ni favoritos guardados (salvo `conservar`),
  // para que las pruebas no dependan unas de otras. sessionStorage dura mientras
  // la pestaña siga abierta, así que cambiar de página dentro de una prueba no borra nada.
  if (!conservar) {
    await page.evaluateOnNewDocument(() => {
      if (!sessionStorage.getItem('e2e-limpio')) {
        localStorage.clear();
        sessionStorage.setItem('e2e-limpio', '1');
      }
    });
  }
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (/Firestore\/Write/.test(req.url())) req.abort();
    else if (req.isNavigationRequest() && url.origin === base && SIN_PRERENDER.test(url.pathname)) {
      req.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: readFileSync('dist/app.html') });
    } else req.continue();
  });
  await page.goto(`${base}${ruta}`, { waitUntil: espera });
  // Hasta que React termina de hidratar, los botones todavía no responden.
  await new Promise((r) => setTimeout(r, 2500));
  return { page, errores };
}

/** Espera a que haya un botón o enlace con ese texto y lo toca. */
async function tocar(page, texto, { timeout = 20000 } = {}) {
  const handle = await page.waitForFunction(
    (t) => [...document.querySelectorAll('button, a')].find((el) => el.textContent.trim().startsWith(t) && !el.disabled),
    { timeout },
    texto
  );
  await handle.asElement().click();
}

const textoDe = (page, selector) => page.$eval(selector, (el) => el.innerText);

// ─── Cada página carga sin errores ───────────────────────────────────────────

for (const [ruta, esperar] of [
  ['/', '#main h1'],
  ['/catalogo', 'ul[aria-label="Perfumes"] li'],
  ['/contacto', '#main h1'],
  ['/sobre-nosotros', '#main h1'],
]) {
  test(`${ruta} carga y se hidrata sin errores`, async () => {
    const { page, errores } = await abrir(ruta);
    await page.waitForSelector(esperar, { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2500)); // dar tiempo a la hidratación y a la lectura en vivo
    assert.deepEqual(errores, [], `Errores en ${ruta}: ${errores.join(' | ')}`);
    await page.close();
  });
}

test('la ficha de un perfume carga sin errores', async () => {
  const { page } = await abrir('/catalogo');
  await page.waitForSelector('ul[aria-label="Perfumes"] li a[href^="/perfume/"]', { timeout: 30000 });
  const ruta = await page.$eval('ul[aria-label="Perfumes"] li a[href^="/perfume/"]', (a) => a.getAttribute('href'));
  await page.close();

  const { page: ficha, errores } = await abrir(ruta);
  await ficha.waitForSelector('h1', { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2500));
  const titulo = await textoDe(ficha, 'h1');
  assert.ok(titulo.trim().length > 3, 'la ficha no muestra el nombre del perfume');
  assert.deepEqual(errores, [], `Errores en ${ruta}: ${errores.join(' | ')}`);
  await ficha.close();
});

// ─── Catálogo ────────────────────────────────────────────────────────────────

test('el catálogo muestra perfumes con precio y el buscador filtra', async () => {
  const { page } = await abrir('/catalogo');
  await page.waitForSelector('ul[aria-label="Perfumes"] li', { timeout: 30000 });
  const inicial = await page.$$eval('ul[aria-label="Perfumes"] li', (l) => l.length);
  assert.ok(inicial >= 12, `el catálogo muestra solo ${inicial} perfumes`);

  const hayPrecio = await page.$eval('ul[aria-label="Perfumes"]', (ul) => /\$\s?\d/.test(ul.innerText));
  assert.ok(hayPrecio, 'las tarjetas no muestran precio en pesos');

  await page.type('input[type="search"], input[placeholder^="Buscar"]', 'lattafa');
  await page.waitForFunction(
    () => [...document.querySelectorAll('ul[aria-label="Perfumes"] li')].every((li) => /lattafa/i.test(li.innerText)),
    { timeout: 10000 }
  );
  const filtrados = await page.$$eval('ul[aria-label="Perfumes"] li', (l) => l.length);
  assert.ok(filtrados > 0 && filtrados <= inicial, 'el buscador no devolvió resultados de Lattafa');
  await page.close();
});

// ─── Carrito ─────────────────────────────────────────────────────────────────

test('agregar un perfume actualiza el carrito y se mantiene al cambiar de página', async () => {
  const { page, errores } = await abrir('/catalogo');
  await page.waitForSelector('ul[aria-label="Perfumes"] li', { timeout: 30000 });
  await page.click('button[aria-label^="Agregar al carrito:"]');
  await page.waitForSelector('a[aria-label^="Carrito, 1"]', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 500)); // deja que se guarde

  // Recargar en otra página: el carrito se conserva.
  await page.goto(`${base}/carrito`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('a[aria-label^="Carrito, 1"]', { timeout: 15000 });
  assert.deepEqual(errores, [], `Errores en el carrito: ${errores.join(' | ')}`);
  await page.close();
});

test('quien vuelve con carrito y favoritos guardados no sufre errores de hidratación', async () => {
  const { page: previa } = await abrir('/catalogo'); // arranca limpia
  await previa.waitForSelector('ul[aria-label="Perfumes"] li', { timeout: 30000 });
  await previa.click('button[aria-label^="Agregar al carrito:"]');
  await previa.waitForSelector('a[aria-label^="Carrito, 1"]', { timeout: 10000 });
  await previa.click('ul[aria-label="Perfumes"] li button[aria-label*="avorito"]');
  await new Promise((r) => setTimeout(r, 800));
  await previa.close();

  // Segunda visita (mismo navegador, con lo guardado) sobre una página pre-generada.
  for (const ruta of ['/', '/catalogo']) {
    const { page, errores } = await abrir(ruta, { conservar: true });
    await page.waitForSelector('a[aria-label^="Carrito, 1"]', { timeout: 15000 });
    assert.deepEqual(errores, [], `Errores al volver a ${ruta} con carrito guardado: ${errores.join(' | ')}`);
    await page.close();
  }
});

// ─── Decants ─────────────────────────────────────────────────────────────────

test('los decants muestran los 12 perfumes con 3, 5 y 10 ml', async () => {
  const { page, errores } = await abrir('/decants');
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Agregar').length >= 36,
    { timeout: 30000 }
  );
  const tamanos = await page.$$eval('#main p', (ps) => ps.map((p) => p.textContent.trim()).filter((t) => /^(3|5|10)ml$/.test(t)));
  assert.ok(tamanos.length >= 36, `faltan fracciones de decant (hay ${tamanos.length})`);
  assert.deepEqual(errores, [], `Errores en decants: ${errores.join(' | ')}`);
  await page.close();
});

// ─── Asistente "Encontrá tu perfume" ─────────────────────────────────────────

test('el asistente llega a recomendaciones sin callejones sin salida', async () => {
  const { page, errores } = await abrir('/catalogo');
  await page.waitForSelector('ul[aria-label="Perfumes"] li', { timeout: 30000 });
  await page.click('button[aria-label="Encontrá tu perfume"], a[aria-label="Encontrá tu perfume"]');

  await tocar(page, 'Para mí');
  await tocar(page, 'Me da igual'); // género
  await tocar(page, 'No, quiero descubrir'); // sin perfume de referencia
  await tocar(page, 'Dulces y cálidos'); // aroma (varias opciones posibles)
  await tocar(page, 'Listo');
  await tocar(page, 'Me da igual'); // matiz
  await tocar(page, 'Nada en especial'); // evitar
  await tocar(page, 'Para todo momento'); // momento
  await tocar(page, 'No tengo límite'); // presupuesto

  await page.waitForSelector('ul[aria-label="Perfumes recomendados"] li', { timeout: 30000 });
  const n = await page.$$eval('ul[aria-label="Perfumes recomendados"] li', (l) => l.length);
  assert.ok(n >= 1, 'el asistente no devolvió recomendaciones');
  assert.deepEqual(errores, [], `Errores en el asistente: ${errores.join(' | ')}`);
  await page.close();
});

test('el asistente con perfume de referencia devuelve alternativas', async () => {
  const { page } = await abrir('/catalogo');
  await page.waitForSelector('ul[aria-label="Perfumes"] li', { timeout: 30000 });
  await page.click('button[aria-label="Encontrá tu perfume"], a[aria-label="Encontrá tu perfume"]');

  await tocar(page, 'Para mí');
  await tocar(page, 'Me da igual');
  // La primera referencia que ofrece el asistente tiene al menos una alternativa.
  const handle = await page.waitForFunction(
    () => {
      const botones = [...document.querySelectorAll('[role="dialog"] button')].map((b) => b.textContent.trim());
      const i = botones.indexOf('No, quiero descubrir');
      return i >= 0 ? botones[i + 1] : null;
    },
    { timeout: 20000 }
  );
  const referencia = await handle.jsonValue();
  await tocar(page, referencia);
  await tocar(page, 'No tengo límite');
  await page.waitForSelector('ul[aria-label="Perfumes recomendados"] li', { timeout: 30000 });
  await page.close();
});
