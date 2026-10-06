import test from 'node:test';
import assert from 'node:assert/strict';
import { filasDesdeTextos, cruzar, motivoDeAborto, clave } from '../lib/catalogo-proveedor.mjs';

test('filasDesdeTextos une nombres partidos y descarta el encabezado de página', () => {
  const textos = [
    'FRAGANCIAS FEMENINAS', 'IMAGEN', 'MODELO', ' ', 'PRECIO',
    'AFNAN 9AM DIVE 100ML', ' ', '34 USD',
    'AFNAN 9PM ELIXIR PARFUM', '100ML', ' ', '43 USD',
    'SIN VOLUMEN', '10 USD',
  ];
  assert.deepEqual(filasDesdeTextos(textos), [
    { nombre: 'AFNAN 9AM DIVE 100ML', volumenML: 100, precioUSD: 34, genero: 'Femenino' },
    { nombre: 'AFNAN 9PM ELIXIR PARFUM 100ML', volumenML: 100, precioUSD: 43, genero: 'Femenino' },
  ]);
});

test('clave ignora tildes, símbolos y espacios antes de ML', () => {
  assert.equal(clave("Qaa'ed  100 ML"), clave('QAA ED 100ML'));
});

const perfumes = [
  { id: 'a', nombre: 'AFNAN 9PM 100ML', marca: 'Afnan', precioUSD: 29 },
  { id: 'b', nombre: 'LATTAFA HABIK 100ML', marca: 'Lattafa', precioUSD: 28 },
  { id: 'c', nombre: 'DUP 100ML', marca: 'X', precioUSD: 10 },
  { id: 'd', nombre: 'Dup 100ML', marca: 'X', precioUSD: 11 },
];

test('cruzar separa cambios, nuevos, omitidos y ambiguos', () => {
  const filas = [
    { nombre: 'AFNAN 9PM 100ML', volumenML: 100, precioUSD: 31 },
    { nombre: 'LATTAFA HABIK 100ML', volumenML: 100, precioUSD: 28 },
    { nombre: 'AFNAN NUEVO TEST 100ML', volumenML: 100, precioUSD: 40 },
    { nombre: 'DUP 100ML', volumenML: 100, precioUSD: 12 },
    { nombre: 'LATTAFA OTRO 100ML', volumenML: 100, precioUSD: 0 },
  ];
  const r = cruzar(filas, perfumes);
  assert.deepEqual(r.cambios, [{ id: 'a', nombre: 'AFNAN 9PM 100ML', anterior: 29, nuevo: 31 }]);
  assert.equal(r.nuevos[0].marca, 'Afnan');
  assert.deepEqual(r.ambiguos, ['DUP 100ML']);
  assert.equal(r.omitidos[0].motivo, 'precio inválido');
});

test('cruzar omite variaciones de más de 50%', () => {
  const r = cruzar([{ nombre: 'AFNAN 9PM 100ML', volumenML: 100, precioUSD: 90 }], perfumes);
  assert.equal(r.cambios.length, 0);
  assert.match(r.omitidos[0].motivo, /variación/);
});

test('motivoDeAborto frena PDFs chicos, cambios masivos y formato roto', () => {
  const vacio = { cambios: [], nuevos: [], omitidos: [], ambiguos: [] };
  assert.match(motivoDeAborto(new Array(10).fill({}), vacio, 400), /filas/);
  const filas = new Array(200).fill({});
  assert.match(motivoDeAborto(filas, { ...vacio, cambios: new Array(150).fill({}) }, 400), /precios/);
  assert.match(motivoDeAborto(filas, { ...vacio, nuevos: new Array(100).fill({}) }, 400), /nuevas/);
  assert.equal(motivoDeAborto(filas, vacio, 400), null);
});
