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
//
// Requisitos (no están en package.json: pesan mucho y solo se usan acá):
//   npm install --no-save @imgly/background-removal-node
//   pip install pillow numpy scipy
// El modelo tarda ~10 s por foto; el método está explicado en tools/lib/recorte_hibrido.py.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const FOTOS = 'public/img/p';
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

const { removeBackground } = await import('@imgly/background-removal-node').catch(() => {
  console.error('Falta el modelo: npm install --no-save @imgly/background-removal-node');
  process.exit(1);
});
mkdirSync(CACHE, { recursive: true });

let hashes = JSON.parse(readFileSync('src/data/imagenes-locales.json', 'utf8')).sort();
const solo = valor('--solo');
if (solo) hashes = hashes.filter((h) => h === solo);
const parte = valor('--parte');
if (parte) {
  const [i, n] = parte.split('/').map(Number);
  hashes = hashes.filter((_, k) => k % n === i - 1);
}

let hechas = 0;
for (const hash of hashes) {
  const original = join(FOTOS, `${hash}-800.webp`);
  const salida = join(FOTOS, `${hash}-cut.webp`);
  if (!existsSync(original) || (existsSync(salida) && !solo)) continue;
  const modelo = join(CACHE, `${hash}.png`);
  try {
    const sharp = (await import('sharp')).default;
    const png = await sharp(original).png().toBuffer();
    const blob = await removeBackground(new Blob([png], { type: 'image/png' }), { model: 'medium', output: { format: 'image/png' } });
    writeFileSync(modelo, Buffer.from(await blob.arrayBuffer()));
    const r = spawnSync('python', ['tools/lib/recorte_hibrido.py', original, modelo, salida], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(r.stderr.trim().split('\n').pop());
    unlinkSync(modelo);
    hechas++;
    console.log(`${hash} ${r.stdout.trim()}`);
  } catch (err) {
    console.warn(`${hash} falló: ${err.message}`);
  }
}
console.log(`recortar-fotos: ${hechas} nuevas${parte ? ` (parte ${parte})` : ''}`);
if (!parte) reescribirIndice();
