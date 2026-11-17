// Muestra en el sitio las fotos con la caja al lado: para cada perfume que tiene una foto alternativa elegida en
// tools/fotos-alternativas/<hash>.(jpg|png|webp) —o una composición de frasco y caja de dos fotos reales (composiciones.json)—,
// regenera las copias que usa la web (public/img/p/<hash>-400.webp y -800.webp) a partir de esa foto, con los mismos
// parámetros que tools/localizar-imagenes.mjs. Así todo el catálogo se ve "frasco con caja" y no mezclado con fotos
// de solo frasco (muchas fotos del catálogo vienen de bases de datos que no publican la caja).
//
//   node tools/aplicar-fotos-alternativas.mjs          aplica todas
//   node tools/aplicar-fotos-alternativas.mjs --lista  solo muestra qué haría
//
// El nombre (hash) es el de la foto original del catálogo: Firestore no se toca. Es seguro repetirlo. Las fotos del catálogo
// originales quedan en el historial de git y se recuperan con `git checkout <commit> -- public/img/p/<hash>-*.webp`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ALT = 'tools/fotos-alternativas';
const DIR = 'public/img/p';
const ANCHOS = [400, 800];
const soloListar = process.argv.includes('--lista');

const alternativas = readdirSync(ALT)
  .filter((f) => /^[0-9a-f]{8}\.(jpe?g|png|webp)$/i.test(f))
  .map((f) => ({ hash: f.slice(0, 8), origen: join(ALT, f), tipo: 'alternativa' }));

const composiciones = existsSync(join(ALT, 'composiciones.json')) ? Object.keys(JSON.parse(readFileSync(join(ALT, 'composiciones.json'), 'utf8'))) : [];
// La composición ya está armada como recorte transparente (-cut.webp): se aplana sobre blanco como cualquier foto.
const compuestas = composiciones
  .filter((hash) => !alternativas.some((a) => a.hash === hash))
  .map((hash) => ({ hash, origen: join(DIR, `${hash}-cut.webp`), tipo: 'composición' }))
  .filter((c) => existsSync(c.origen));

const todas = [...alternativas, ...compuestas];
console.log(`${alternativas.length} alternativas con caja + ${compuestas.length} composiciones`);
if (soloListar) process.exit(0);

let hechas = 0;
for (const { hash, origen } of todas) {
  for (const ancho of ANCHOS) {
    await sharp(origen)
      .rotate()
      .flatten({ background: '#ffffff' })
      .resize({ width: ancho, height: ancho, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(join(DIR, `${hash}-${ancho}.webp`));
  }
  hechas++;
}
console.log(`fotos aplicadas: ${hechas}`);
