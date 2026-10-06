// Pre-render de las páginas públicas, después de `vite build`.
//
// 1. Toma una "foto" de los datos públicos (perfumes, promociones activas,
//    config y cotización del dólar) y la incrusta en el HTML como JSON. La app
//    la carga en React Query antes del primer render (src/utils/datosIniciales.js)
//    y después la refresca desde Firestore.
// 2. Abre cada página pública en Chrome headless (con Firestore bloqueado: todo
//    sale de la foto) y guarda el HTML resultante. Así el navegador del
//    visitante pinta la página apenas llega el HTML, sin esperar al JavaScript.
//
// Archivos que genera en dist/ (ver rewrites y cleanUrls en firebase.json):
//   index.html, catalogo.html, sobre-nosotros.html, contacto.html  → páginas
//   perfume.html → esqueleto para /perfume/:id (con la foto de datos)
//   app.html     → shell vacío para el resto (carrito, admin, 404...)
//
// Si falta Chrome o falla algo, deja todos los archivos como copias del shell
// (la web funciona igual, solo sin pre-render): nunca rompe el build.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { preview } from 'vite';
import { listarColeccion, leerDocumento } from './lib/firestore-rest.mjs';
import { preciosPorMetodo, getMejorPromo } from '../src/utils/precios.js';
import { hashTexto } from '../src/utils/hash.js';

const DIST = 'dist';
const SITE = 'https://fraganzia-e9b70.web.app';
const PUERTO = 4180;
const DOLAR_API = 'https://dolarapi.com/v1/dolares/blue';

const PAGINAS = [
  { ruta: '/', archivo: 'index.html', esperar: '#main h1' },
  { ruta: '/catalogo', archivo: 'catalogo.html', esperar: 'ul[aria-label="Perfumes"] li' },
  { ruta: '/sobre-nosotros', archivo: 'sobre-nosotros.html', esperar: '#main h1' },
  { ruta: '/contacto', archivo: 'contacto.html', esperar: '#main h1' },
  // Un id que no existe: la página queda en su estado "cargando" (esqueleto).
  { ruta: '/perfume/__shell__', archivo: 'perfume.html', esperar: '[aria-label="Cargando perfume"]', soloRoot: true },
];

// Solo los campos que usan las cards, los filtros y la cabecera del detalle.
// La descripción y las notas llegan después, con la lectura en vivo.
const CAMPOS_PERFUME = [
  'nombre', 'marca', 'precioUSD', 'precioTransferencia', 'precioEfectivo', 'imagenes',
  'genero', 'familiaOlfativa', 'destacado', 'volumenML', 'descuento', 'activo', 'disponible', 'createdAt',
];

async function tomarFoto() {
  const [perfumes, promociones, config, dolarBlue] = await Promise.all([
    listarColeccion('perfumes', { campos: CAMPOS_PERFUME }),
    listarColeccion('promociones'),
    leerDocumento('config/general'),
    fetch(DOLAR_API).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ]);

  return {
    generadoEn: new Date().toISOString(),
    // Mismo filtro y orden que listarPerfumesPublicos (más nuevos primero).
    perfumes: perfumes
      .filter((p) => p.activo === true && p.disponible === true)
      .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
      .map(({ createdAt, activo, disponible, imagenes, ...p }) => ({ ...p, imagenes: imagenes?.slice(0, 1) ?? [] })),
    promociones: promociones
      .filter((p) => p.activa === true)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
    config,
    dolarBlue,
  };
}

function buscarChrome() {
  const candidatos = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  return candidatos.find((c) => c && existsSync(c));
}

// JSON dentro de <script>: escapar "<" evita que un texto como "</script>"
// en algún nombre o descripción cierre la etiqueta.
const scriptDatos = (datos) =>
  `<script id="datos-iniciales" type="application/json">${JSON.stringify(datos).replace(/</g, '\\u003c')}</script>`;

const escaparAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function aplicarHead(html, head) {
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${escaparAttr(head.title)}</title>`)
    .replace(/(<meta name="description"\s+content=")[^"]*(")/, `$1${escaparAttr(head.description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${escaparAttr(head.canonical)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escaparAttr(head.title)}$2`)
    .replace(/(<meta property="og:description"\s+content=")[^"]*(")/, `$1${escaparAttr(head.description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${escaparAttr(head.canonical)}$2`);
}

// En los shells genéricos el canonical de la home sería incorrecto: lo quita
// y lo agrega la app en el navegador (useDocumentMeta).
const sinCanonical = (html) => html.replace(/\s*<link rel="canonical"[^>]*>/, '');

// vite.config.js baja la prioridad del JS porque en las páginas pre-renderizadas
// no hace falta para el primer pintado. En los shells (perfume, carrito,
// admin...) el contenido SÍ depende del JS: ahí vuelve a prioridad normal.
const prioridadNormal = (html) => html.replace(/ fetchpriority="low"/g, '');
const shell = (html) => prioridadNormal(sinCanonical(html));

const plantilla = readFileSync(`${DIST}/index.html`, 'utf8');
let conDatos = plantilla;
let datos = null;

function escribirShells(html) {
  writeFileSync(`${DIST}/app.html`, shell(html));
  for (const { archivo } of PAGINAS) {
    if (archivo !== 'index.html') writeFileSync(`${DIST}/${archivo}`, shell(html));
  }
}

try {
  datos = await tomarFoto();
  conDatos = plantilla.replace('</head>', `    ${scriptDatos(datos)}\n  </head>`);
  console.log(`prerender: foto de datos con ${datos.perfumes.length} perfumes`);
} catch (err) {
  console.warn(`prerender: sin foto de datos (${err.message})`);
}

// Primero, shells para todo: si el pre-render falla, la web funciona igual.
writeFileSync(`${DIST}/index.html`, conDatos);
escribirShells(conDatos);

const chrome = buscarChrome();
if (!chrome) {
  console.warn('prerender: no se encontró Chrome (definí CHROME_PATH); se sirven shells sin pre-render');
  process.exit(0);
}

// Al compartir un link de WhatsApp o Instagram no corre JavaScript: el título, la foto
// y el precio tienen que estar ya en el HTML de cada perfume. Estas páginas pisan el
// rewrite de /perfume/** (Hosting sirve primero el archivo que existe) y siguen siendo
// el mismo esqueleto de la app, pero con datos de un solo perfume para no pesar de más.
function urlImagen(url) {
  if (!url) return `${SITE}/icon-512.png`;
  const hash = hashTexto(url);
  if (existsSync(`${DIST}/img/p/${hash}-800.webp`)) return `${SITE}/img/p/${hash}-800.webp`;
  return url.startsWith('/') ? `${SITE}${url}` : url;
}

const reemplazar = (html, regex, valor) => html.replace(regex, (_, a, b) => `${a}${escaparAttr(valor)}${b}`);

async function paginasPorPerfume(rootEsqueleto) {
  if (!datos) return;
  const descripciones = new Map(
    (await listarColeccion('perfumes', { campos: ['descripcion'] })).map((p) => [p.id, p.descripcion])
  );
  const dolarMedio = datos.dolarBlue ? (datos.dolarBlue.compra + datos.dolarBlue.venta) / 2 : null;
  mkdirSync(`${DIST}/perfume`, { recursive: true });

  for (const p of datos.perfumes) {
    const descripcion = descripciones.get(p.id);
    const base = dolarMedio && p.precioUSD ? preciosPorMetodo(p.precioUSD, dolarMedio).precioTransferencia : null;
    const pct = getMejorPromo(p.id, datos.promociones)?.descuentoPorcentaje ?? 0;
    const precio = base && (pct ? Math.round((base * (1 - pct / 100)) / 1000) * 1000 : base);

    const titulo = `${p.nombre} — ${p.marca} | Fraganzia`;
    const resumen =
      descripcion?.slice(0, 155) || `${p.nombre} de ${p.marca}, perfume original. Precio en pesos y envíos en AMBA.`;
    const url = `${SITE}/perfume/${p.id}`;
    const imagen = urlImagen(p.imagenes?.[0]);
    const productoLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.nombre,
      brand: { '@type': 'Brand', name: p.marca },
      image: imagen,
      description: descripcion || undefined,
      ...(precio && {
        offers: { '@type': 'Offer', url, priceCurrency: 'ARS', price: precio, availability: 'https://schema.org/InStock' },
      }),
    };
    const soloEste = {
      generadoEn: datos.generadoEn,
      promociones: datos.promociones,
      config: datos.config,
      dolarBlue: datos.dolarBlue,
      perfume: { ...p, descripcion },
    };
    const jsonLd = JSON.stringify(productoLd).replace(/</g, '\\u003c');

    let html = plantilla
      .replace('</head>', () => `    ${scriptDatos(soloEste)}\n    <script type="application/ld+json">${jsonLd}</script>\n  </head>`)
      .replace('<div id="root"></div>', () => `<div id="root">${rootEsqueleto}</div>`);
    html = shell(html).replace(
      /<title>[^<]*<\/title>/,
      () => `<title>${escaparAttr(titulo)}</title>\n    <link rel="canonical" href="${url}" />`
    );
    html = reemplazar(html, /(<meta name="description"\s+content=")[^"]*(")/, resumen);
    html = reemplazar(html, /(<meta property="og:title" content=")[^"]*(")/, titulo);
    html = reemplazar(html, /(<meta property="og:description"\s+content=")[^"]*(")/, resumen);
    html = reemplazar(html, /(<meta property="og:url" content=")[^"]*(")/, url);
    html = reemplazar(html, /(<meta property="og:image" content=")[^"]*(")/, imagen);
    html = html
      .replace('<meta property="og:type" content="website" />', '<meta property="og:type" content="product" />')
      .replace('<meta name="twitter:card" content="summary" />', '<meta name="twitter:card" content="summary_large_image" />');

    writeFileSync(`${DIST}/perfume/${p.id}.html`, html);
  }
  console.log(`prerender: ${datos.perfumes.length} páginas de perfume`);
}

const { default: puppeteer } = await import('puppeteer-core');
const servidor = await preview({ preview: { port: PUERTO, strictPort: false }, logLevel: 'silent' });
const base = servidor.resolvedUrls.local[0].replace(/\/$/, '');
const navegador = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const resultados = {};
try {
  for (const pagina of PAGINAS) {
    const tab = await navegador.newPage();
    await tab.setViewport({ width: 1280, height: 900 });
    // Nada de red externa salvo imágenes: los datos salen de la foto y así el
    // pre-render tampoco escribe estadísticas ni pedidos en Firestore.
    await tab.setRequestInterception(true);
    tab.on('request', (req) => {
      const url = req.url();
      const externo = !url.startsWith(base);
      if (externo && req.resourceType() !== 'image') req.abort();
      else req.continue();
    });

    await tab.goto(`${base}${pagina.ruta}`, { waitUntil: 'domcontentloaded' });
    await tab.waitForSelector(pagina.esperar, { timeout: 20000 });
    // Dar tiempo a los efectos (título y metas por página).
    await new Promise((r) => setTimeout(r, 400));

    resultados[pagina.archivo] = await tab.evaluate(() => ({
      root: document.getElementById('root').innerHTML,
      head: {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content ?? '',
        canonical: document.querySelector('link[rel="canonical"]')?.href ?? '',
      },
    }));
    await tab.close();
  }

  for (const { archivo, soloRoot } of PAGINAS) {
    const { root, head } = resultados[archivo];
    let html = conDatos.replace('<div id="root"></div>', `<div id="root">${root}</div>`);
    html = soloRoot ? shell(html) : aplicarHead(html, head);
    writeFileSync(`${DIST}/${archivo}`, html);
  }
  console.log(`prerender: ${PAGINAS.length} páginas`);
  await paginasPorPerfume(resultados['perfume.html'].root);
} catch (err) {
  console.warn(`prerender: falló (${err.message}); se sirven shells sin pre-render`);
} finally {
  await navegador.close();
  await new Promise((r) => servidor.httpServer.close(r));
}
