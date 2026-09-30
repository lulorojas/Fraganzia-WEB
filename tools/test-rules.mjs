// Pruebas de firestore.rules contra el emulador local. Correr con:
//   npm run test:rules
// (levanta el emulador de Firestore, corre este archivo y lo apaga; requiere Java).
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, addDoc, collection, increment, serverTimestamp, deleteDoc, getDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-fraganzia',
  // Host y puerto los toma de FIRESTORE_EMULATOR_HOST, que define emulators:exec.
  firestore: { rules: readFileSync('firestore.rules', 'utf8') },
});

const anon = env.unauthenticatedContext().firestore();
let fails = 0;
async function t(name, p, ok) {
  try { await (ok ? assertSucceeds(p) : assertFails(p)); console.log('PASS', name); }
  catch (e) { fails++; console.log('FAIL', name, e.message); }
}

const pedidoOk = () => ({
  items: [{ perfumeId: 'a', nombre: 'X', marca: 'Y', precioUSD: 30, precioARS: 40000, cantidad: 1 }],
  metodoPago: 'Transferencia', dolarBlueUsado: 1300, subtotalARS: 40000, descuentoARS: 0,
  totalARS: 40000, clienteNombre: 'Ana', estado: 'confirmado', creadoEn: serverTimestamp(),
});
const ped = collection(anon, 'pedidos');

await t('pedido válido', addDoc(ped, pedidoOk()), true);
await t('pedido con email', addDoc(ped, { ...pedidoOk(), clienteEmail: 'a@b.com' }), true);
await t('pedido descuento negativo por redondeo', addDoc(ped, { ...pedidoOk(), descuentoARS: -300 }), true);
await t('campo extra', addDoc(ped, { ...pedidoOk(), admin: true }), false);
await t('total negativo', addDoc(ped, { ...pedidoOk(), totalARS: -5 }), false);
await t('total cero', addDoc(ped, { ...pedidoOk(), totalARS: 0 }), false);
await t('nombre enorme', addDoc(ped, { ...pedidoOk(), clienteNombre: 'x'.repeat(500) }), false);
await t('sin items', addDoc(ped, { ...pedidoOk(), items: [] }), false);
await t('estado distinto', addDoc(ped, { ...pedidoOk(), estado: 'cancelado' }), false);
await t('fecha falsa', addDoc(ped, { ...pedidoOk(), creadoEn: new Date(2000, 1, 1) }), false);
await t('leer pedido anónimo', getDoc(doc(anon, 'pedidos', 'x')), false);

const est = (id, campos) => setDoc(doc(anon, 'estadisticas', id), { perfumeId: id, ...campos, updatedAt: serverTimestamp() }, { merge: true });
await t('vista nueva', est('p1', { vistas: increment(1) }), true);
await t('vista +1', est('p1', { vistas: increment(1) }), true);
await t('carrito en doc existente', est('p1', { agregadosCarrito: increment(1) }), true);
await t('favorito +1', est('p1', { favoritos: increment(1) }), true);
await t('favorito +5', est('p1', { favoritos: increment(5) }), false);
await t('campo inventado', est('p1', { compras: increment(1) }), false);
await t('vista +100', est('p1', { vistas: increment(100) }), false);
await t('vista fija enorme', est('p2', { vistas: 999999 }), false);
await t('perfumeId distinto al id', setDoc(doc(anon, 'estadisticas', 'p3'), { perfumeId: 'otro', vistas: 1, updatedAt: serverTimestamp() }), false);
await t('borrar estadística', deleteDoc(doc(anon, 'estadisticas', 'p1')), false);

const bus = (id, conteo, sin) => setDoc(doc(anon, 'busquedas', id), { termino: id, conteo, sinResultados: sin, updatedAt: serverTimestamp() }, { merge: true });
await t('búsqueda nueva con resultados', bus('lattafa', increment(1), increment(0)), true);
await t('búsqueda repetida sin resultados', bus('lattafa', increment(1), increment(1)), true);
await t('búsqueda +50', bus('lattafa', increment(50), increment(0)), false);
await t('término muy largo', bus('x'.repeat(200), increment(1), increment(0)), false);
await t('término distinto al id', setDoc(doc(anon, 'busquedas', 'abc'), { termino: 'zzz', conteo: 1, sinResultados: 0, updatedAt: serverTimestamp() }), false);

await env.cleanup();
console.log(fails ? `\n${fails} FALLARON` : '\nTODAS OK');
process.exit(fails ? 1 : 0);
