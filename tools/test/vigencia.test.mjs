// Tests de la vigencia de las promociones (src/utils/vigencia.js): plazos reales, nunca inventados.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aMilisegundos, finDePromo, estaVigente, vigentes, restante, textoRestante, fechaCorta, fechaLarga,
  etiquetaVigencia, cierreMasCercano, aInputLocal, desdeInputLocal, finDelDia, finDeMes,
  AVISAR_DENTRO_DE_MS, URGENTE_DENTRO_DE_MS,
} from '../../src/utils/vigencia.js';
import { getMejorPromo } from '../../src/utils/precios.js';

const MIN = 60_000;
const H = 60 * MIN;
const D = 24 * H;
// 30/11/2026 23:59 hora de Argentina (UTC−3) = 01/12/2026 02:59 UTC
const FIN = Date.parse('2026-12-01T02:59:00Z');

test('la fecha llega de varias formas (Timestamp, ISO, número, Date) y siempre da milisegundos', () => {
  assert.equal(aMilisegundos(FIN), FIN);
  assert.equal(aMilisegundos('2026-12-01T02:59:00Z'), FIN);
  assert.equal(aMilisegundos(new Date(FIN)), FIN);
  assert.equal(aMilisegundos({ toMillis: () => FIN }), FIN);
  assert.equal(aMilisegundos({ seconds: FIN / 1000, nanoseconds: 0 }), FIN);
  assert.equal(aMilisegundos({ _seconds: FIN / 1000, _nanoseconds: 500_000_000 }), FIN + 500);
  for (const nada of [null, undefined, '', 'no es fecha', {}, NaN]) assert.equal(aMilisegundos(nada), null, String(nada));
});

test('sin fecha de cierre una promo siempre está vigente y no genera ningún plazo', () => {
  const sinFecha = { titulo: 'Siempre' };
  assert.equal(finDePromo(sinFecha), null);
  assert.equal(finDePromo({ venceEn: null }), null);
  assert.equal(estaVigente(sinFecha, FIN + 10 * D), true);
  assert.equal(etiquetaVigencia(finDePromo(sinFecha), FIN) === null || finDePromo(sinFecha) === null, true);
  assert.equal(cierreMasCercano([sinFecha, { venceEn: null }], FIN - D), null);
});

test('la promo deja de estar vigente exactamente al llegar la fecha (el cierre ya no cuenta)', () => {
  const promo = { venceEn: FIN };
  assert.equal(estaVigente(promo, FIN - 1), true);
  assert.equal(estaVigente(promo, FIN), false);
  assert.equal(estaVigente(promo, FIN + D), false);
});

test('si no se conoce la hora (ahora null) no se descarta nada: así el HTML pre-generado y el navegador coinciden', () => {
  assert.equal(estaVigente({ venceEn: 1 }, null), true);
  assert.equal(estaVigente({ venceEn: 1 }, undefined), true);
  assert.equal(vigentes([{ venceEn: 1 }, { venceEn: FIN }], null).length, 2);
});

test('vigentes() saca solo las vencidas y respeta el orden', () => {
  const lista = [{ id: 'a', venceEn: FIN - D }, { id: 'b' }, { id: 'c', venceEn: FIN + D }, { id: 'd', venceEn: FIN - 1 }];
  assert.deepEqual(vigentes(lista, FIN).map((p) => p.id), ['b', 'c']);
  assert.deepEqual(vigentes(undefined, FIN), []);
});

test('texto de lo que falta: días y horas, horas y minutos, o solo minutos; los minutos solo en el último día', () => {
  assert.equal(textoRestante(10 * D), '10 días');
  assert.equal(textoRestante(4 * D + 5 * H), '4 días');
  assert.equal(textoRestante(3 * D + 20 * H), '3 días y 20 h');
  assert.equal(textoRestante(2 * D), '2 días');
  assert.equal(textoRestante(D + 3 * H), '1 día y 3 h');
  assert.equal(textoRestante(D), '1 día');
  assert.equal(textoRestante(5 * H + 20 * MIN), '5 h 20 min');
  assert.equal(textoRestante(2 * H), '2 h');
  assert.equal(textoRestante(59 * MIN + 30_000), '59 min');
  assert.equal(textoRestante(20_000), '1 min', 'nunca "0 min" mientras siga vigente');
  assert.equal(textoRestante(0), 'terminó');
  assert.equal(textoRestante(-5 * MIN), 'terminó');
});

test('restante() desglosa bien y no da negativos', () => {
  assert.deepEqual(restante(FIN, FIN - (2 * D + 3 * H + 4 * MIN)), { ms: 2 * D + 3 * H + 4 * MIN, dias: 2, horas: 3, minutos: 4 });
  assert.deepEqual(restante(FIN, FIN + H), { ms: -H, dias: 0, horas: 0, minutos: 0 });
});

test('fechas en hora de Argentina, sin depender de la zona de quien corre la prueba', () => {
  assert.equal(fechaCorta(FIN), '30/11');
  assert.equal(fechaLarga(FIN), '30/11 a las 23:59');
  assert.equal(fechaLarga(Date.parse('2026-12-01T03:00:00Z')), '01/12 a las 00:00', 'medianoche es 00:00, no 24:00');
});

test('etiqueta: urgente en el último día, cuenta regresiva dentro de 3 días, y solo la fecha si falta más', () => {
  assert.equal(etiquetaVigencia(FIN, FIN), null, 'ya terminó: no hay etiqueta');
  assert.equal(etiquetaVigencia(FIN, FIN + H), null);
  assert.deepEqual(etiquetaVigencia(FIN, FIN - 90 * MIN), { texto: 'Termina en 1 h 30 min', urgente: true, ms: 90 * MIN });
  assert.equal(etiquetaVigencia(FIN, FIN - URGENTE_DENTRO_DE_MS).urgente, true, 'justo 24 h: urgente');
  assert.equal(etiquetaVigencia(FIN, FIN - URGENTE_DENTRO_DE_MS - MIN).urgente, false);
  assert.equal(etiquetaVigencia(FIN, FIN - 2 * D).texto, 'Termina en 2 días');
  assert.equal(etiquetaVigencia(FIN, FIN - AVISAR_DENTRO_DE_MS).texto, 'Termina en 3 días');
  const lejos = etiquetaVigencia(FIN, FIN - AVISAR_DENTRO_DE_MS - MIN);
  assert.equal(lejos.texto, 'Hasta el 30/11', 'con una fecha lejana no se mete apuro');
  assert.equal(lejos.urgente, false);
});

test('de varias promos aplicadas manda la que cierra primero, y se ignoran las vencidas y las sin fecha', () => {
  const ahora = FIN - 5 * D;
  const lista = [{ id: 'sin' }, { id: 'tarde', venceEn: FIN + D }, { id: 'pronto', venceEn: FIN - 2 * D }, { id: 'vencida', venceEn: ahora - 1 }];
  assert.equal(cierreMasCercano(lista, ahora).id, 'pronto');
  assert.equal(cierreMasCercano([{ id: 'vencida', venceEn: ahora - 1 }], ahora), null);
});

test('el formulario del admin ida y vuelta: ms → input → ms sin perder el minuto', () => {
  const ms = new Date(2026, 10, 30, 23, 59).getTime(); // hora local, la de quien carga la promo
  assert.equal(aInputLocal(ms), '2026-11-30T23:59');
  assert.equal(desdeInputLocal('2026-11-30T23:59'), ms);
  assert.equal(aInputLocal(null), '');
  assert.equal(desdeInputLocal(''), null);
  assert.equal(desdeInputLocal('basura'), null);
});

test('atajos del admin: hoy, en N días y fin de mes siempre a las 23:59', () => {
  const ahora = new Date(2026, 10, 17, 10, 30).getTime();
  const en = (ms) => new Date(ms);
  assert.equal(en(finDelDia(ahora)).getDate(), 17);
  assert.equal(en(finDelDia(ahora, 3)).getDate(), 20);
  assert.equal(en(finDelDia(ahora, 14)).getMonth(), 11, 'cruza de mes');
  for (const f of [finDelDia(ahora), finDelDia(ahora, 7), finDeMes(ahora)]) {
    assert.equal(en(f).getHours(), 23);
    assert.equal(en(f).getMinutes(), 59);
  }
  assert.equal(en(finDeMes(ahora)).getDate(), 30, 'noviembre termina el 30');
  assert.equal(en(finDeMes(new Date(2026, 1, 3).getTime())).getDate(), 28, 'febrero de 2026');
  assert.ok(finDelDia(ahora, 3) - ahora > 2 * D);
});

test('integración con precios: una promo vencida deja de aplicarse cuando se filtra con vigentes()', () => {
  const promos = [{ id: 'p1', descuentoPorcentaje: 20, perfumeIds: [], venceEn: FIN }, { id: 'p2', descuentoPorcentaje: 10, perfumeIds: [] }];
  assert.equal(getMejorPromo('x', vigentes(promos, FIN - H)).id, 'p1');
  assert.equal(getMejorPromo('x', vigentes(promos, FIN + H)).id, 'p2', 'vencida la de 20 %, queda la de 10 %');
  assert.equal(getMejorPromo('x', vigentes([promos[0]], FIN + H)), null);
});
