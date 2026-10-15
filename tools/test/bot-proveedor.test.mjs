import test from 'node:test';
import assert from 'node:assert/strict';
import { filasDesdeTextos, cruzar, motivoDeAborto, clave, extraerImagenesCrudas, asociarImagenes } from '../lib/catalogo-proveedor.mjs';

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

test('extraerImagenesCrudas encuentra JPEGs grandes e ignora los chicos (logos/íconos)', () => {
  const grande = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(6000, 1), Buffer.from([0xff, 0xd9])]);
  const chico = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(10, 1), Buffer.from([0xff, 0xd9])]);
  const buffer = Buffer.concat([Buffer.from('relleno'), chico, Buffer.from('más relleno'), grande]);
  const imagenes = extraerImagenesCrudas(buffer);
  assert.equal(imagenes.length, 1);
  assert.equal(imagenes[0].length, grande.length);
});

test('asociarImagenes solo empareja por orden si la cantidad coincide exacto', () => {
  const filas = [{ nombre: 'A' }, { nombre: 'B' }];
  const img1 = Buffer.from('img1');
  const img2 = Buffer.from('img2');
  assert.deepEqual(asociarImagenes(filas, [img1]), filas);
  const emparejadas = asociarImagenes(filas, [img1, img2]);
  assert.equal(emparejadas[0].imagenBuffer, img1);
  assert.equal(emparejadas[1].imagenBuffer, img2);
});

// Lee un PDF real (mínimo) con pdfjs: así un cambio de versión de Node o de pdfjs que lo rompa
// falla en los tests y no recién en la corrida diaria. `sinWithResolvers` simula Node 20.
function pdfMinimo(lineas) {
  const flujo = `BT /F1 12 Tf 14 TL 20 760 Td ${lineas.map((l) => `(${l}) Tj T*`).join(' ')} ET`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${flujo.length} >>\nstream\n${flujo}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const pos = objs.map((o, i) => { const p = pdf.length; pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; return p; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${pos.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

test('leerFilasDelPdf lee un PDF con pdfjs', async () => {
  const { leerFilasDelPdf } = await import('../lib/catalogo-proveedor.mjs');
  const filas = await leerFilasDelPdf(pdfMinimo(['FRAGANCIAS MASCULINAS', 'MODELO PRECIO', 'KHAMRAH 100ML', '15 USD']));
  assert.deepEqual(filas.map((f) => [f.nombre, f.volumenML, f.precioUSD, f.genero]), [['KHAMRAH 100ML', 100, 15, 'Masculino']]);
});

test('el bot anda aunque Node no tenga Promise.withResolvers (Node 20)', async () => {
  const { execFileSync } = await import('node:child_process');
  const codigo = `
    delete Promise.withResolvers;
    const { leerFilasDelPdf } = await import(${JSON.stringify(new URL('../lib/catalogo-proveedor.mjs', import.meta.url).href)});
    const pdf = Buffer.from(${JSON.stringify(pdfMinimo(['FRAGANCIAS MASCULINAS', 'MODELO PRECIO', 'KHAMRAH 100ML', '15 USD']).toString('latin1'))}, 'latin1');
    const f = await leerFilasDelPdf(pdf);
    if (f.length !== 1) throw new Error('filas: ' + f.length);
  `;
  execFileSync(process.execPath, ['--input-type=module', '-e', codigo], { stdio: 'pipe' });
});
