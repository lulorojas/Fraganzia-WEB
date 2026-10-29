// Busca, en tiendas que ya vende lo mismo, fotos del perfume con su caja al lado, para los que hoy se
// muestran solo con el frasco (muchas fotos vienen de bases de datos como Parfumo, que no publican la caja).
//
//   node tools/buscar-fotos-con-caja.mjs --tiendas              baja el listado de productos de cada tienda (con pausas)
//   node tools/buscar-fotos-con-caja.mjs --emparejar [lista]    cruza el catálogo con las tiendas → tools/.cache/candidatas.json
//   node tools/buscar-fotos-con-caja.mjs --descargar            baja las fotos candidatas → tools/.cache/candidatas/<hash>/<n>.jpg
//   node tools/buscar-fotos-con-caja.mjs --paginas <lista.json> toma las fotos de páginas de producto sueltas ({hash: [urls]})
//
// No cambia nada del sitio: solo deja candidatas para revisar a ojo. Lo elegido se copia a
// tools/fotos-alternativas/<hash>.jpg y lo usa tools/recortar-fotos.mjs en lugar de la foto original.
// Firestore no se toca: el recorte conserva el nombre (hash) de la foto original del catálogo.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hashTexto } from '../src/utils/hash.js';

const CACHE = 'tools/.cache';
const TIENDAS = [
  'silkperfumes.cl',
  'www.perfumenz.co.nz',
  'dxbperfume.co.uk',
  'emiratesoud.co.uk',
  'www.intenseoud.com',
  'privateblends.com.au',
];
const PAUSA_MS = 6000; // las tiendas limitan los pedidos seguidos (error 429)
const args = process.argv.slice(2);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(`${CACHE}/tiendas`, { recursive: true });

async function pedir(url, { json = true, intentos = 4 } = {}) {
  for (let i = 0; i < intentos; i++) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FraganziaFotos/1.0)', Accept: json ? 'application/json' : 'image/*' },
      signal: AbortSignal.timeout(30000),
    }).catch(() => null);
    if (res?.ok) return json ? res.json() : Buffer.from(await res.arrayBuffer());
    if (res && res.status !== 429) throw new Error(`HTTP ${res.status}`);
    await dormir(PAUSA_MS * (i + 2));
  }
  throw new Error('demasiados reintentos');
}

// ─── 1. Listados de las tiendas ──────────────────────────────────────────────
if (args.includes('--tiendas')) {
  for (const host of TIENDAS) {
    const productos = [];
    try {
      for (let pagina = 1; pagina <= 60; pagina++) {
        const { products } = await pedir(`https://${host}/products.json?limit=250&page=${pagina}`);
        if (!products?.length) break;
        productos.push(...products.map((p) => ({ titulo: p.title, marca: p.vendor, handle: p.handle, imagenes: p.images.map((i) => i.src) })));
        await dormir(PAUSA_MS);
      }
      writeFileSync(`${CACHE}/tiendas/${host}.json`, JSON.stringify(productos));
      console.log(`${host}: ${productos.length} productos`);
    } catch (err) {
      console.warn(`${host}: ${err.message}`);
    }
  }
  process.exit(0);
}

// ─── 2. Emparejar nombres ────────────────────────────────────────────────────
const RUIDO = new Set(['edp', 'edt', 'eau', 'de', 'parfum', 'parfume', 'perfume', 'spray', 'ml', 'oz', 'by', 'the', 'and', 'extrait', 'pour', 'for']);
const MASCULINO = new Set(['men', 'man', 'homme', 'him', 'masculino', 'uomo']);
const FEMENINO = new Set(['women', 'woman', 'femme', 'her', 'femenino', 'donna', 'ladies']);
// Cosas que no son el frasco del perfume: su foto no sirve.
const NO_ES_PERFUME = /\b(body|splash|mist|gift|set|deodorant|deodorante|hair|oil|attar|sample|decant|tester|travel|roll|shower|cream|lotion|soap|candle|bakhoor|incense|air|freshener)\b/i;
const normalizar = (t) =>
  t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\b(\d+)\s*(ml|oz)\b/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = (t) => new Set(normalizar(t).split(' ').filter((w) => w && !RUIDO.has(w)));
const generoDe = (set) => ([...set].some((w) => MASCULINO.has(w)) ? 'm' : [...set].some((w) => FEMENINO.has(w)) ? 'f' : null);
const volumenDe = (t) => (t.match(/(\d+)\s*ml/i) ?? [])[1] ?? null;

function puntaje(perfume, producto) {
  if (NO_ES_PERFUME.test(producto.titulo)) return 0;
  const marca = tokens(perfume.marca ?? '');
  const nombre = tokens(perfume.nombre.replace(new RegExp(perfume.marca ?? '', 'i'), ''));
  const titulo = tokens(`${producto.titulo} ${producto.marca ?? ''}`);
  if (![...marca].some((m) => titulo.has(m))) return 0;
  const gp = generoDe(nombre);
  const gt = generoDe(titulo);
  if (gp && gt && gp !== gt) return 0; // "For Men" no es "For Women"
  const clave = [...nombre].filter((w) => !MASCULINO.has(w) && !FEMENINO.has(w) && !/^\d+$/.test(w));
  if (!clave.length) return 0;
  const comunes = clave.filter((w) => titulo.has(w)).length;
  const sobran = [...titulo].filter((w) => !nombre.has(w) && !marca.has(w) && !MASCULINO.has(w) && !FEMENINO.has(w)).length;
  const mismoVolumen = volumenDe(perfume.nombre) && volumenDe(perfume.nombre) === volumenDe(producto.titulo);
  return comunes / clave.length - 0.1 * sobran + (mismoVolumen ? 0.05 : 0);
}

if (args.includes('--emparejar')) {
  const lista = args[args.indexOf('--emparejar') + 1];
  const objetivos = lista && !lista.startsWith('--') ? JSON.parse(readFileSync(lista, 'utf8')) : null; // [{nombre, hash}]
  const tiendas = TIENDAS.filter((h) => existsSync(`${CACHE}/tiendas/${h}.json`)).map((h) => ({ host: h, productos: JSON.parse(readFileSync(`${CACHE}/tiendas/${h}.json`, 'utf8')) }));
  const catalogo = JSON.parse(readFileSync('tools/.cache/catalogo.json', 'utf8')); // [{id, nombre, marca, imagenes}]
  const salida = [];
  for (const p of catalogo) {
    const hash = hashTexto(p.imagenes[0]);
    if (objetivos && !objetivos.some((o) => o.hash === hash)) continue;
    const mejores = [];
    for (const { host, productos } of tiendas) {
      for (const prod of productos) {
        const s = puntaje(p, prod);
        if (s >= 0.8 && prod.imagenes.length) mejores.push({ tienda: host, titulo: prod.titulo, handle: prod.handle, puntaje: Number(s.toFixed(2)), imagenes: prod.imagenes.slice(0, 5) });
      }
    }
    mejores.sort((a, b) => b.puntaje - a.puntaje);
    salida.push({ nombre: p.nombre, hash, candidatas: mejores.slice(0, 3) });
  }
  writeFileSync(`${CACHE}/candidatas.json`, JSON.stringify(salida, null, 1));
  console.log(`${salida.length} perfumes buscados; con candidata: ${salida.filter((s) => s.candidatas.length).length}`);
  process.exit(0);
}

// ─── 3. Descargar las fotos candidatas ───────────────────────────────────────
if (args.includes('--descargar')) {
  const candidatas = JSON.parse(readFileSync(`${CACHE}/candidatas.json`, 'utf8'));
  let n = 0;
  for (const c of candidatas) {
    const mejor = c.candidatas[0];
    if (!mejor) continue;
    const dir = `${CACHE}/candidatas/${c.hash}`;
    mkdirSync(dir, { recursive: true });
    for (const [i, src] of mejor.imagenes.slice(0, 4).entries()) {
      const destino = join(dir, `${i + 1}.jpg`);
      if (existsSync(destino)) continue;
      try {
        const url = src.includes('?') ? `${src}&width=900` : `${src}?width=900`;
        writeFileSync(destino, await pedir(url, { json: false }));
        n++;
        await dormir(900);
      } catch (err) {
        console.warn(`${c.nombre} #${i + 1}: ${err.message}`);
      }
    }
  }
  console.log(`descargadas: ${n} fotos`);
  process.exit(0);
}

// ─── 4. Fotos de páginas de producto sueltas (tiendas que no son Shopify o no figuran en el listado) ───
if (args.includes('--paginas')) {
  const lista = JSON.parse(readFileSync(args[args.indexOf('--paginas') + 1], 'utf8'));
  const decodificar = (t) => t.replace(/&amp;/g, '&').replace(/\\\//g, '/').replace(/\\u002F/gi, '/');
  for (const [hash, paginas] of Object.entries(lista)) {
    const dir = `${CACHE}/candidatas/${hash}`;
    mkdirSync(dir, { recursive: true });
    const urls = [];
    for (const pagina of paginas) {
      try {
        const html = (await pedir(pagina, { json: false })).toString('utf8');
        const hallazgos = [
          ...html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/gi),
          ...html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/gi),
          ...html.matchAll(/"image"\s*:\s*\[?\s*"(https?:[^"]+)"/g),
        ].map((m) => decodificar(m[1]));
        urls.push(...hallazgos.filter((u) => /^https?:/.test(u)));
      } catch (err) {
        console.warn(`${pagina}: ${err.message}`);
      }
      await dormir(PAUSA_MS / 2);
    }
    const unicas = [...new Set(urls)].slice(0, 5);
    for (const [i, url] of unicas.entries()) {
      const destino = join(dir, `p${i + 1}.jpg`);
      if (existsSync(destino)) continue;
      try {
        writeFileSync(destino, await pedir(url, { json: false }));
        await dormir(700);
      } catch (err) {
        console.warn(`${hash} ${url.slice(0, 70)}: ${err.message}`);
      }
    }
    console.log(`${hash}: ${unicas.length} fotos de ${paginas.length} páginas`);
  }
  process.exit(0);
}

console.log('Uso: --tiendas | --emparejar [lista.json] | --descargar | --paginas <lista.json>');
