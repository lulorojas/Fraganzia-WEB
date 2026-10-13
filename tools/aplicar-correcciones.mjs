// Aplica correcciones puntuales de datos a los perfumes de Firestore.
//
// Uso: node tools/aplicar-correcciones.mjs <correcciones.json> [--aplicar]
//
// El archivo es una lista de { id, nombre, campos: { genero?, imagenes? } } o, para
// cambios de género, { id, nombre, de, a } (`de` es el género actual esperado y `a` el
// nuevo). Sin --aplicar solo muestra qué cambiaría (no escribe nada). Con --aplicar:
//   - guarda antes los valores previos en privado/respaldo-correcciones-<fecha>.json
//   - solo toca `genero` e `imagenes`, y pone `updatedAt` para que la web lo lea
//     en la próxima lectura incremental.
// Si el valor actual de Firestore ya no coincide con `de`, esa fila se saltea.
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { credencial } from './lib/credencial.mjs';

const CAMPOS_PERMITIDOS = ['genero', 'imagenes'];
const GENEROS = ['Masculino', 'Femenino', 'Unisex', 'Kids'];

const [archivo] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const aplicar = process.argv.includes('--aplicar');
if (!archivo) throw new Error('Uso: node tools/aplicar-correcciones.mjs <correcciones.json> [--aplicar]');

const filas = JSON.parse(readFileSync(archivo, 'utf8')).map((f) => ({
  id: f.id,
  nombre: f.nombre,
  esperado: f.de,
  campos: f.campos ?? { genero: f.a },
}));

for (const f of filas) {
  for (const k of Object.keys(f.campos)) {
    if (!CAMPOS_PERMITIDOS.includes(k)) throw new Error(`${f.nombre}: campo no permitido "${k}"`);
  }
  if (f.campos.genero && !GENEROS.includes(f.campos.genero)) throw new Error(`${f.nombre}: género inválido "${f.campos.genero}"`);
}

initializeApp({ credential: cert(credencial()) });
const db = getFirestore();

const cambios = [];
const salteadas = [];
for (const f of filas) {
  const ref = db.doc(`perfumes/${f.id}`);
  const doc = await ref.get();
  if (!doc.exists) { salteadas.push(`${f.nombre}: no existe`); continue; }
  const actual = doc.data();
  if (f.esperado && actual.genero !== f.esperado) {
    salteadas.push(`${f.nombre}: el género actual es ${actual.genero}, se esperaba ${f.esperado}`);
    continue;
  }
  const previo = Object.fromEntries(Object.keys(f.campos).map((k) => [k, actual[k] ?? null]));
  cambios.push({ ref, id: f.id, nombre: f.nombre, previo, nuevo: f.campos });
}

console.log(`${cambios.length} cambios${aplicar ? '' : ' (simulación, no se escribe nada)'}; ${salteadas.length} salteadas`);
for (const s of salteadas) console.log('  salteada:', s);
for (const c of cambios) console.log(`  ${c.nombre}: ${JSON.stringify(c.previo)} -> ${JSON.stringify(c.nuevo)}`);

if (!aplicar) {
  console.log('\nAgregá --aplicar para escribirlos.');
} else if (cambios.length) {
  mkdirSync('privado', { recursive: true });
  const respaldo = `privado/respaldo-correcciones-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  writeFileSync(respaldo, JSON.stringify(cambios.map(({ id, nombre, previo, nuevo }) => ({ id, nombre, previo, nuevo })), null, 1));
  console.log(`respaldo: ${respaldo}`);
  // Lotes de hasta 400 operaciones (el límite de Firestore es 500).
  for (let i = 0; i < cambios.length; i += 400) {
    const lote = db.batch();
    for (const c of cambios.slice(i, i + 400)) lote.update(c.ref, { ...c.nuevo, updatedAt: FieldValue.serverTimestamp() });
    await lote.commit();
  }
  console.log('listo');
}
