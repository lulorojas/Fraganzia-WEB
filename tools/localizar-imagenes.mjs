// Descarga las fotos de producto (muchas estaban enlazadas a sitios ajenos) y
// las guarda optimizadas dentro del sitio: public/img/p/<hash>-400.webp y
// -800.webp. La web usa la copia local si existe (src/utils/image.js) y, si no,
// la URL original: Firestore no se toca y todo es reversible.
//
// Incremental: solo procesa lo que falta. Corre antes de cada build; también
// se puede correr a mano:  node tools/localizar-imagenes.mjs
// Si una foto no se puede descargar, se avisa y se sigue (la web usa la URL
// original para esa foto).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { listarColeccion } from './lib/firestore-rest.mjs';
import { hashTexto } from '../src/utils/hash.js';

const DIR = 'public/img/p';
const INDICE = 'src/data/imagenes-locales.json';
const ANCHOS = [400, 800];
const EN_PARALELO = 6;

mkdirSync(DIR, { recursive: true });
mkdirSync('src/data', { recursive: true });

const yaIndexadas = new Set(existsSync(INDICE) ? JSON.parse(readFileSync(INDICE, 'utf8')) : []);
const archivosDe = (hash) => ANCHOS.map((w) => join(DIR, `${hash}-${w}.webp`));

async function leerOriginal(url) {
  if (url.startsWith('/')) return readFileSync(join('public', decodeURI(url)));
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FraganziaBuild/1.0)', Accept: 'image/*' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function procesar(url) {
  const hash = hashTexto(url);
  if (archivosDe(hash).every((f) => existsSync(f))) return { hash, nuevo: false };
  const original = await leerOriginal(url);
  for (const ancho of ANCHOS) {
    await sharp(original)
      .rotate()
      // Las fotos se muestran sobre fondo blanco: aplanar transparencias a blanco.
      .flatten({ background: '#ffffff' })
      .resize({ width: ancho, height: ancho, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(join(DIR, `${hash}-${ancho}.webp`));
  }
  return { hash, nuevo: true };
}

let urls;
try {
  const perfumes = await listarColeccion('perfumes', { campos: ['imagenes'] });
  urls = [...new Set(perfumes.flatMap((p) => p.imagenes ?? []).filter(Boolean))];
} catch (err) {
  console.warn(`imágenes: no se pudo leer el catálogo (${err.message}); se mantiene el índice actual`);
  process.exit(0);
}

const indexadas = new Set();
const fallidas = [];
let nuevas = 0;
for (let i = 0; i < urls.length; i += EN_PARALELO) {
  const tanda = urls.slice(i, i + EN_PARALELO);
  const resultados = await Promise.allSettled(tanda.map(procesar));
  resultados.forEach((r, j) => {
    if (r.status === 'fulfilled') {
      indexadas.add(r.value.hash);
      if (r.value.nuevo) nuevas++;
    } else {
      fallidas.push(`${tanda[j]} (${r.reason.message})`);
      // Si ya estaba de una corrida anterior, se conserva.
      const hash = hashTexto(tanda[j]);
      if (yaIndexadas.has(hash) && archivosDe(hash).every((f) => existsSync(f))) indexadas.add(hash);
    }
  });
}

writeFileSync(INDICE, `${JSON.stringify([...indexadas].sort())}\n`);
console.log(`imágenes: ${indexadas.size}/${urls.length} locales (${nuevas} nuevas)`);
if (fallidas.length) {
  console.warn(`imágenes: ${fallidas.length} no se pudieron descargar (se usa la URL original):`);
  for (const f of fallidas) console.warn(`  - ${f}`);
}
