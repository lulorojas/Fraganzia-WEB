// Tests de las cuentas de precios de la web (src/utils/precios.js y decants.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { preciosPorMetodo, getMejorPromo, calcularTotal2x1, valorDolarMedio } from '../../src/utils/precios.js';
import { precioDecantUSD, ML_DECANT } from '../../src/utils/decants.js';

test('dólar medio es el promedio de compra y venta', () => {
  assert.equal(valorDolarMedio({ compra: 1000, venta: 1100 }), 1050);
});

test('transferencia = x1,40 y efectivo = x1,35 del valor en pesos, redondeado a miles', () => {
  const { precioTransferencia, precioEfectivo } = preciosPorMetodo(30, 1000);
  assert.equal(precioTransferencia, 42000);
  assert.equal(precioEfectivo, 41000); // 40.500 -> 41.000
});

test('la mejor promo es la de mayor descuento y respeta los perfumes acotados', () => {
  const promos = [
    { id: 'a', descuentoPorcentaje: 10 },
    { id: 'b', descuentoPorcentaje: 20, perfumeIds: ['p1'] },
    { id: 'c', descuentoPorcentaje: 0 },
  ];
  assert.equal(getMejorPromo('p1', promos).id, 'b');
  assert.equal(getMejorPromo('p2', promos).id, 'a');
  assert.equal(getMejorPromo('p1', []), null);
});

test('2x1: de cada par, la unidad más barata es gratis', () => {
  const items = [{ precioARS: 50000, cantidad: 1 }, { precioARS: 30000, cantidad: 1 }];
  assert.equal(calcularTotal2x1(items, false, 1000), 50000);
});

test('decants: costo del líquido por ml x ml x 2,5', () => {
  const perfume = { precioUSD: 40, volumenML: 100 };
  assert.deepEqual(ML_DECANT, [3, 5, 10]);
  const casi = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
  casi(precioDecantUSD(perfume, 10), 10); // 0,40 USD/ml * 10 * 2,5
  casi(precioDecantUSD(perfume, 3), 3);
});
