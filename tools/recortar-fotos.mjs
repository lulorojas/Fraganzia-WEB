// Saca el fondo de las fotos de producto para mostrarlas sobre el escenario oscuro de las cards.
//
// Entrada:  public/img/p/<hash>-800.webp (las que deja tools/localizar-imagenes.mjs)
// Salida:   public/img/p/<hash>-cut.webp (WebP con transparencia, recortada al producto)
//           src/data/recortes.json       (hashes con recorte: la web usa el recorte solo si está en la lista)
//
// Es incremental (no repite lo que ya tiene recorte) y se puede repartir en varios procesos:
//   node tools/recortar-fotos.mjs --parte 1/3     (y 2/3, 3/3 en otras terminales)
//   node tools/recortar-fotos.mjs --indice        (regenera src/data/recortes.json al terminar)
//   node tools/recortar-fotos.mjs --solo <hash>   (rehace una sola, por ejemplo tras retocar el original)
//   node tools/recortar-fotos.mjs --modelos       (solo guarda la máscara del modelo de cada foto en la caché)
//   (composiciones: ver tools/fotos-alternativas/composiciones.json, caja y frasco de dos fotos reales)
//   node tools/recortar-fotos.mjs --rehacer       (rehace todas con lo guardado en la caché, sin volver a correr el modelo)
//
// Si existe tools/fotos-alternativas/<hash>.(jpg|png|webp) se recorta esa foto (por ejemplo una con la caja
// al lado) en lugar de la del catálogo; el recorte conserva el nombre (hash) de la foto original.
//
// Requisitos (no están en package.json: pesan mucho y solo se usan acá):
//   npm install --no-save @imgly/background-removal-node
//   pip install pillow numpy scipy
// El modelo tarda ~10 s por foto; el método está explicado en tools/lib/recorte_hibrido.py.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const FOTOS = 'public/img/p';
const ALTERNATIVAS = 'tools/fotos-alternativas';
// Opciones por foto para los casos difíciles (caja blanca sobre fondo blanco): ver tools/lib/recorte_hibrido.py.
const OPCIONES = JSON.parse(readFileSync('tools/lib/recorte-opciones.json', 'utf8'));
const CACHE = 'tools/.cache/recortes';
const INDICE = 'src/data/recortes.json';
const args = process.argv.slice(2);
const valor = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : null);

function reescribirIndice() {
  const hashes = readdirSync(FOTOS).filter((f) => f.endsWith('-cut.webp')).map((f) => f.replace('-cut.webp', '')).sort();
  writeFileSync(INDICE, JSON.stringify(hashes) + '\n');
  console.log(`recortes: ${hashes.length} fotos con recorte en ${INDICE}`);
}

if (args.includes('--indice')) {
  reescribirIndice();
  process.exit(0);
}

mkdirSync(CACHE, { recursive: true });
const rehacer = args.includes('--rehacer');
const soloModelos = args.includes('--modelos'); // solo calcula (y guarda) la máscara del modelo, sin armar los WebP
const { removeBackground } = rehacer
  ? {}
  : await import('@imgly/background-removal-node').catch(() => {
      console.error('Falta el modelo: npm install --no-save @imgly/background-removal-node');
      process.exit(1);
    });

// Foto de origen: la alternativa elegida (con caja) o, si no hay, la del catálogo.
function origenDe(hash) {
  const alt = ['jpg', 'png', 'webp'].map((e) => join(ALTERNATIVAS, `${hash}.${e}`)).find((f) => existsSync(f));
  return alt ?? join(FOTOS, `${hash}-800.webp`);
}

let hashes = JSON.parse(readFileSync('src/data/imagenes-locales.json', 'utf8')).sort();
const solo = valor('--solo');
if (solo) hashes = hashes.filter((h) => h === solo);
const parte = valor('--parte');
if (parte) {
  const [i, n] = parte.split('/').map(Number);
  hashes = hashes.filter((_, k) => k % n === i - 1);
}

// Máscara del modelo de una foto, guardada en la caché (permite ajustar el postproceso sin repetir los ~10 s por foto).
async function asegurarMascara(original, modelo, forzar = false) {
  if (existsSync(modelo) && !forzar) return true;
  if (rehacer) return false;
  const sharp = (await import('sharp')).default;
  const png = await sharp(original).png().toBuffer();
  const blob = await removeBackground(new Blob([png], { type: 'image/png' }), { model: 'medium', output: { format: 'image/png' } });
  writeFileSync(modelo, Buffer.from(await blob.arrayBuffer()));
  return true;
}

function python(...argumentos) {
  const r = spawnSync('python', argumentos, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error((r.stderr ?? r.error?.message ?? '').trim().split('\n').pop());
  return r.stdout.trim();
}

// Perfumes cuya foto con caja se arma juntando dos fotos reales (una del frasco y otra de la caja):
// tools/fotos-alternativas/composiciones.json → { hash: { frasco, caja, escala? } }, con las partes en tools/fotos-alternativas/partes/.
const COMPOSICIONES = existsSync(join(ALTERNATIVAS, 'composiciones.json')) ? JSON.parse(readFileSync(join(ALTERNATIVAS, 'composiciones.json'), 'utf8')) : {};

async function recortarParte(nombre, forzar) {
  const original = join(ALTERNATIVAS, 'partes', nombre);
  const clave = nombre.replace(/\.\w+$/, '');
  const modelo = join(CACHE, `parte-${clave}.png`);
  mkdirSync('tools/.cache/partes', { recursive: true });
  const salida = join('tools/.cache/partes', `${clave}.webp`);
  if (!(await asegurarMascara(original, modelo, forzar))) return null;
  python('tools/lib/recorte_hibrido.py', original, modelo, salida, ...(OPCIONES[`parte:${clave}`] ?? []));
  return salida;
}

let hechas = 0;
for (const hash of hashes) {
  const salida = join(FOTOS, `${hash}-cut.webp`);
  try {
    const comp = COMPOSICIONES[hash];
    if (comp) {
      if (existsSync(salida) && !solo && !rehacer && !soloModelos) continue;
      const caja = await recortarParte(comp.caja, solo);
      const frasco = await recortarParte(comp.frasco, solo);
      if (soloModelos || !caja || !frasco) { if (soloModelos) hechas++; continue; }
      console.log(`${hash} compuesta ${python('tools/lib/componer.py', caja, frasco, salida, String(comp.escala ?? 0.8))}`);
      hechas++;
      continue;
    }
    const original = origenDe(hash);
    if (!existsSync(original) || (existsSync(salida) && !solo && !rehacer && !soloModelos)) continue;
    const modelo = join(CACHE, `${hash}.png`);
    if (!(await asegurarMascara(original, modelo, solo))) continue;
    if (soloModelos) {
      hechas++;
      console.log(`${hash} modelo`);
      continue;
    }
    console.log(`${hash} ${python('tools/lib/recorte_hibrido.py', original, modelo, salida, ...(OPCIONES[hash] ?? []))}`);
    hechas++;
  } catch (err) {
    console.warn(`${hash} falló: ${err.message}`);
  }
}
console.log(`recortar-fotos: ${hechas} nuevas${parte ? ` (parte ${parte})` : ''}`);
if (!parte) reescribirIndice();
