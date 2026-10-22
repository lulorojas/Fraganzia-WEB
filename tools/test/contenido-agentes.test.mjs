// Pruebas del contenido para agentes de IA (tools/lib/contenido-agentes.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { preciosPorMetodo } from '../../src/utils/precios.js';
import {
  preciosDe, htmlFicha, jsonLdFicha, jsonLdSitio, jsonLdCatalogo, llmsTxt, llmsFull, catalogoJson, SITE,
} from '../lib/contenido-agentes.mjs';

const DOLAR = 1000;
const perfume = {
  id: 'abc123',
  nombre: 'LATTAFA YARA 100ML',
  marca: 'Lattafa',
  genero: 'Femenino',
  familiaOlfativa: 'Floral',
  volumenML: 100,
  precioUSD: 30,
  descripcion: 'Dulce <floral> & suave',
  notasSalida: ['Mandarina'],
  notasCorazon: ['Orquídea'],
  notasFondo: ['Vainilla'],
};
const sinPromo = [];
const conPromo = [{ id: 'x', titulo: 'Día de la Madre', descuentoPorcentaje: 20, perfumeIds: [] }];

test('preciosDe calcula los dos métodos con la misma regla que la tienda', () => {
  const base = preciosPorMetodo(30, DOLAR);
  const p = preciosDe(perfume, DOLAR, sinPromo);
  assert.equal(p.transferencia, base.precioTransferencia);
  assert.equal(p.efectivo, base.precioEfectivo);
  assert.equal(p.descuento, 0);
});

test('preciosDe aplica la promoción y guarda el precio anterior', () => {
  const base = preciosPorMetodo(30, DOLAR);
  const p = preciosDe(perfume, DOLAR, conPromo);
  assert.equal(p.descuento, 20);
  assert.equal(p.antesTransferencia, base.precioTransferencia);
  assert.equal(p.transferencia, Math.round((base.precioTransferencia * 0.8) / 1000) * 1000);
});

test('preciosDe devuelve null si no hay cotización ni precio guardado', () => {
  assert.equal(preciosDe({ ...perfume, precioUSD: undefined }, null, sinPromo), null);
});

test('htmlFicha trae título, descripción, notas y los dos precios, con el texto escapado', () => {
  const html = htmlFicha(perfume, preciosDe(perfume, DOLAR, sinPromo));
  assert.match(html, /<h1>LATTAFA YARA 100ML<\/h1>/);
  assert.match(html, /Dulce &lt;floral&gt; &amp; suave/);
  assert.match(html, /Notas de salida: Mandarina/);
  assert.match(html, /Notas de corazón: Orquídea/);
  assert.match(html, /Notas de fondo: Vainilla/);
  assert.match(html, /Transferencia: \$/);
  assert.match(html, /Efectivo: \$/);
  assert.match(html, /id="contenido-estatico"/);
  assert.doesNotMatch(html, /<floral>/);
});

test('htmlFicha sin precio pide consultar y sin notas no inventa la pirámide', () => {
  const html = htmlFicha({ ...perfume, notasSalida: [], notasCorazon: [], notasFondo: [] }, null);
  assert.match(html, /Precio a consultar por WhatsApp/);
  assert.doesNotMatch(html, /Pirámide olfativa/);
});

test('jsonLdFicha: Product con dos ofertas y migas de pan completas', () => {
  const ld = jsonLdFicha(perfume, preciosDe(perfume, DOLAR, sinPromo), `${SITE}/foto.webp`);
  const [producto, migas] = ld['@graph'];
  assert.equal(producto['@type'], 'Product');
  assert.equal(producto.offers.length, 2);
  assert.deepEqual(producto.offers.map((o) => o.priceCurrency), ['ARS', 'ARS']);
  assert.equal(producto.offers[0].price, preciosPorMetodo(30, DOLAR).precioTransferencia);
  assert.equal(migas['@type'], 'BreadcrumbList');
  assert.equal(migas.itemListElement.length, 4);
  assert.equal(migas.itemListElement[3].item, `${SITE}/perfume/abc123`);
  // Debe poder serializarse a JSON y volver sin pérdida.
  assert.deepEqual(JSON.parse(JSON.stringify(ld)), JSON.parse(JSON.stringify(ld)));
});

test('jsonLdSitio declara la organización y el buscador del catálogo', () => {
  const ld = jsonLdSitio();
  const sitio = ld['@graph'].find((n) => n['@type'] === 'WebSite');
  assert.match(sitio.potentialAction.target.urlTemplate, /catalogo\?buscar=\{search_term_string\}/);
  assert.ok(ld['@graph'].some((n) => n['@type'] === 'Organization' && n.name === 'Fraganzia'));
});

test('jsonLdCatalogo limita los ítems pero informa el total', () => {
  const muchos = Array.from({ length: 100 }, (_, i) => ({ ...perfume, id: `id${i}` }));
  const ld = jsonLdCatalogo(muchos, 10);
  assert.equal(ld.numberOfItems, 100);
  assert.equal(ld.itemListElement.length, 10);
});

test('llms.txt, llms-full.txt y catalogo.json describen el catálogo y avisan del dólar', () => {
  const opciones = { dolarMedio: DOLAR, promociones: sinPromo, generadoEn: '2026-10-20T10:00:00Z' };
  const txt = llmsTxt({ cantidad: 1, marcas: 1, ...opciones });
  assert.match(txt, /^# Fraganzia/);
  assert.match(txt, /llms-full\.txt/);
  assert.match(txt, /dólar del día/);

  const completo = llmsFull([perfume], opciones);
  assert.match(completo, /### \[LATTAFA YARA 100ML\]\(https:\/\/.*\/perfume\/abc123\)/);
  assert.match(completo, /Transferencia \$.*Efectivo \$/);
  assert.match(completo, /Notas — salida: Mandarina; corazón: Orquídea; fondo: Vainilla/);

  const json = catalogoJson([perfume], opciones);
  assert.equal(json.moneda, 'ARS');
  assert.equal(json.perfumes[0].marca, 'Lattafa');
  assert.equal(json.perfumes[0].precioTransferencia, preciosPorMetodo(30, DOLAR).precioTransferencia);
  assert.deepEqual(json.perfumes[0].notasFondo, ['Vainilla']);
});
