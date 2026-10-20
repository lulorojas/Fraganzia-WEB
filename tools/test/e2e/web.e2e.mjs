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
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
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
  // Con App Check aplicado, Chrome sin cabeza no pasa reCAPTCHA: se usa un token de depuración.
  if (process.env.E2E_APPCHECK_DEBUG_TOKEN) {
    await page.evaluateOnNewDocument((token) => { self.FIREBASE_APPCHECK_DEBUG_TOKEN = token; }, process.env.E2E_APPCHECK_DEBUG_TOKEN);
  }
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = new URL(req.url());
    // El SDK liviano escribe por REST (documents:commit); el completo, por el canal Write.
    if (/Firestore\/Write|firestore\.googleapis\.com\/.*:commit/.test(req.url())) req.abort();
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

test('el filtro de género admite varias opciones a la vez', async () => {
  const { page, errores } = await abrir('/catalogo');
  await page.waitForSelector('ul[aria-label="Perfumes"] li', { timeout: 30000 });
  // El catálogo se pagina de a 24: el total real está en "Mostrando 1–24 de N perfumes".
  const cantidad = () =>
    page.evaluate(() => {
      const m = document.body.innerText.match(/ de (\d+) perfumes/);
      return m ? Number(m[1]) : document.querySelectorAll('ul[aria-label="Perfumes"] li').length;
    });
  /** Espera (sondeando desde Node) a que la cantidad cumpla la condición y la devuelve. */
  async function esperarCantidad(condicion) {
    for (let i = 0; i < 50; i++) {
      const n = await cantidad();
      if (condicion(n)) return n;
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.fail(`la cantidad de perfumes no llegó a lo esperado (última: ${await cantidad()})`);
  }
  const tocarGenero = (nombre) =>
    page.evaluate((n) => {
      [...document.querySelectorAll('[aria-label="Filtrar por género"] button')].find((b) => b.textContent.trim() === n).click();
    }, nombre);
  const nombres = await page.$$eval('[aria-label="Filtrar por género"] button', (bs) => bs.map((b) => b.textContent.trim()));
  assert.ok(nombres.includes('Masculino') && nombres.includes('Unisex'), `faltan botones de género: ${nombres}`);

  const total = await cantidad();
  await tocarGenero('Unisex');
  const soloUnisex = await esperarCantidad((n) => n < total);

  await tocarGenero('Masculino');
  await esperarCantidad((n) => n > soloUnisex);
  const activos = await page.$$eval('[aria-label="Filtrar por género"] button[aria-pressed="true"]', (bs) => bs.map((b) => b.textContent.trim()));
  assert.deepEqual(activos.sort(), ['Masculino', 'Unisex']);

  // Tocar de nuevo saca la opción y vuelve al resultado anterior.
  await tocarGenero('Masculino');
  await esperarCantidad((n) => n === soloUnisex);
  assert.deepEqual(errores, [], `Errores al filtrar por género: ${errores.join(' | ')}`);
  await page.close();
});

// ─── Atajos y compra rápida ──────────────────────────────────────────────────

test('los filtros que vienen en el link (atajos de la portada y del pie) se aplican', async () => {
  const { page: base0 } = await abrir('/catalogo');
  await base0.waitForSelector('ul[aria-label="Perfumes"] li', { timeout: 30000 });
  const total = await base0.$$eval('ul[aria-label="Perfumes"] li', (l) => l.length);
  await base0.close();

  const { page, errores } = await abrir('/catalogo?genero=Femenino&marca=Lattafa');
  await page.waitForFunction(
    () => document.querySelector('[aria-label="Filtrar por género"] button[aria-pressed="true"]')?.textContent.trim() === 'Femenino',
    { timeout: 20000 }
  );
  const tarjetas = await page.$$eval('ul[aria-label="Perfumes"] li', (l) => l.map((li) => li.innerText.toLowerCase()));
  assert.ok(tarjetas.length > 0, `el filtro dejó el catálogo vacío (total sin filtrar: ${total})`);
  assert.ok(tarjetas.every((t) => t.includes('lattafa')), 'hay perfumes de otra marca con el filtro de marca aplicado');
  assert.deepEqual(errores, [], `Errores con filtros por link: ${errores.join(' | ')}`);
  await page.close();
});

test('la portada ofrece atajos reales: un toque lleva al catálogo filtrado', async () => {
  const { page, errores } = await abrir('/');
  await page.waitForSelector('a[href^="/catalogo?genero="]', { timeout: 30000 });
  const atajos = await page.$$eval('#main a[href^="/catalogo?"]', (as) => as.map((a) => a.getAttribute('href')));
  assert.ok(atajos.some((h) => h.includes('genero=')), 'faltan atajos por género');
  assert.ok(atajos.some((h) => h.includes('precio=')), 'faltan atajos por presupuesto');
  assert.ok(atajos.some((h) => h.includes('marca=')), 'faltan atajos por marca');
  await page.click('#main a[href="/catalogo?genero=Femenino"]');
  await page.waitForFunction(
    () => document.querySelector('[aria-label="Filtrar por género"] button[aria-pressed="true"]')?.textContent.trim() === 'Femenino',
    { timeout: 20000 }
  );
  assert.deepEqual(errores, [], `Errores en los atajos: ${errores.join(' | ')}`);
  await page.close();
});

test('"Comprar ahora" lleva directo al carrito con el perfume, sin panel intermedio', async () => {
  const { page } = await abrir('/catalogo');
  await page.waitForSelector('ul[aria-label="Perfumes"] li a[href^="/perfume/"]', { timeout: 30000 });
  const ruta = await page.$eval('ul[aria-label="Perfumes"] li a[href^="/perfume/"]', (a) => a.getAttribute('href'));
  await page.close();

  const { page: ficha, errores } = await abrir(ruta);
  await tocar(ficha, 'Comprar ahora');
  await ficha.waitForFunction(() => location.pathname === '/carrito', { timeout: 15000 });
  await ficha.waitForSelector('ul[aria-label="Productos en el carrito"] li', { timeout: 15000 });
  assert.equal(await ficha.$('[role="dialog"]'), null, 'no debería abrirse el panel de "agregado" al ir directo');
  const unidades = await ficha.$$eval('ul[aria-label="Productos en el carrito"] li [aria-live="polite"]', (n) => n.map((x) => x.textContent.trim()));
  assert.deepEqual(unidades, ['1']);
  assert.deepEqual(errores, [], `Errores en "Comprar ahora": ${errores.join(' | ')}`);
  await ficha.close();
});

// ─── Agentes de IA: se leen sin ejecutar JavaScript ──────────────────────────

const sinEtiquetas = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const jsonLdDe = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

test('sin ejecutar JavaScript, la ficha trae título, descripción, notas, precios y datos estructurados', async () => {
  const archivo = readdirSync('dist/perfume').find((f) => f !== '.html' && f.endsWith('.html'));
  const html = await (await fetch(`${base}/perfume/${archivo}`)).text();
  const texto = sinEtiquetas(html);
  assert.match(html, /<h1>[^<]{3,}<\/h1>/, 'la ficha estática no tiene h1');
  assert.match(texto, /Transferencia: \$/);
  assert.match(texto, /Cómo comprar/);
  assert.match(texto, /Envíos solo al AMBA/);
  const grafos = jsonLdDe(html).flatMap((d) => d['@graph'] ?? [d]);
  const producto = grafos.find((n) => n['@type'] === 'Product');
  assert.ok(producto?.name && producto.offers?.length >= 1, 'falta el Product con sus ofertas');
  assert.equal(producto.offers[0].priceCurrency, 'ARS');
  assert.ok(grafos.some((n) => n['@type'] === 'BreadcrumbList'), 'falta BreadcrumbList');
});

test('sin ejecutar JavaScript, la portada y el catálogo declaran sitio, buscador y lista', async () => {
  const portada = await (await fetch(`${base}/`)).text();
  const grafosPortada = jsonLdDe(portada).flatMap((d) => d['@graph'] ?? [d]);
  assert.ok(grafosPortada.some((n) => n['@type'] === 'WebSite' && n.potentialAction?.['@type'] === 'SearchAction'));
  assert.ok(grafosPortada.some((n) => n['@type'] === 'Organization'));
  assert.match(portada, /<h1[\s>]/);
  assert.match(portada, /rel="alternate" type="text\/plain" href="\/llms\.txt"/);

  const catalogo = await (await fetch(`${base}/catalogo.html`)).text();
  const lista = jsonLdDe(catalogo).find((d) => d['@type'] === 'ItemList');
  assert.ok(lista && lista.numberOfItems > 100 && lista.itemListElement.length > 10);
});

test('llms.txt, llms-full.txt y catalogo.json se publican y son coherentes', async () => {
  const txt = await (await fetch(`${base}/llms.txt`)).text();
  assert.match(txt, /^# Fraganzia/);
  const completo = await (await fetch(`${base}/llms-full.txt`)).text();
  const json = await (await fetch(`${base}/catalogo.json`)).json();
  assert.ok(json.perfumes.length > 100);
  assert.equal(completo.split('\n### ').length - 1, json.perfumes.length, 'llms-full.txt y catalogo.json no listan lo mismo');
  assert.ok(json.perfumes.every((p) => p.nombre && p.marca && p.url.startsWith('https://')));
});

test('robots.txt da la bienvenida a los agentes de IA sin abrir lo privado', async () => {
  const robots = await (await fetch(`${base}/robots.txt`)).text();
  for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
    // El bot comparte grupo con las reglas: debe quedar sujeto a los mismos Disallow.
    assert.match(robots, new RegExp(`User-agent: ${bot}\\n(?:User-agent: [^\\n]+\\n)*Allow: /\\nDisallow: /admin`), `${bot} no comparte el grupo con las restricciones`);
  }
  assert.match(robots, /Disallow: \/carrito/);
  assert.match(robots, /Sitemap: /);
});

test('el nombre del logo es texto real: se lee "FRAGANZIA" aunque las A se vean como arcos', async () => {
  const { page, errores } = await abrir('/');
  const texto = await page.$eval('nav[aria-label="Principal"] a[href="/"]', (a) => a.textContent.replace(/\s+/g, ''));
  assert.equal(texto, 'FRAGANZIA');
  assert.deepEqual(errores, []);
  await page.close();
});

// ─── Accesibilidad (WCAG 2.2 AA, con axe-core) ───────────────────────────────

const axeFuente = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

for (const [nombre, tamano] of [['celular', { width: 390, height: 844, isMobile: true }], ['escritorio', { width: 1366, height: 800 }]]) {
  test(`accesibilidad: sin violaciones de WCAG A/AA en las páginas públicas (${nombre})`, async () => {
    const { page: base0 } = await abrir('/catalogo');
    await base0.waitForSelector('ul[aria-label="Perfumes"] li a[href^="/perfume/"]', { timeout: 30000 });
    const ficha = await base0.$eval('ul[aria-label="Perfumes"] li a[href^="/perfume/"]', (a) => a.getAttribute('href'));
    await base0.close();

    const problemas = [];
    for (const ruta of ['/', '/catalogo', ficha, '/decants', '/contacto', '/sobre-nosotros', '/carrito']) {
      const { page } = await abrir(ruta);
      await page.setViewport(tamano);
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
        window.scrollTo(0, 0);
      });
      await page.evaluate(axeFuente);
      const resultado = await page.evaluate(() =>
        axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })
      );
      for (const v of resultado.violations) {
        problemas.push(`${ruta.startsWith('/perfume') ? '/ficha' : ruta} · ${v.id} (${v.impact}): ${v.nodes[0].html.slice(0, 90)}`);
      }
      await page.close();
    }
    assert.deepEqual(problemas, [], `Violaciones de accesibilidad:\n${problemas.join('\n')}`);
  });
}

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
