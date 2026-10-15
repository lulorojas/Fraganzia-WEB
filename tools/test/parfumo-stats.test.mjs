import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('../../extension-parfumo/lib/stats.js');

test('parseCardText lee valoración, votos y año', () => {
  const r = S.parseCardText('Sauvage Dior 2015 8.4 (12.345 Ratings)');
  assert.deepEqual(r, { rating: 8.4, votes: 12345, year: 2015 });
  assert.equal(S.parseCardText('Algo 7,8 · 1,234 votos').votes, 1234);
  assert.equal(S.parseCardText('sin datos').rating, null);
});

test('parseCardText con tarjetas reales de Parfumo (grilla y lista)', () => {
  // Grilla: el año va entre paréntesis y no son los votos.
  assert.deepEqual(S.parseCardText('Khamrah (2022) 7.9 4791'), { rating: 7.9, votes: 4791, year: 2022 });
  // Sin año.
  assert.deepEqual(S.parseCardText('Oud for Glory 7.6 2712'), { rating: 7.6, votes: 2712, year: null });
  // Lista: "288 Reviews" son reseñas, no votos.
  assert.deepEqual(S.parseCardText('Khamrah 7.9 4791 (2022) 288 Reviews'), { rating: 7.9, votes: 4791, year: 2022 });
  // Perfume con año en el nombre y votos con separador de miles.
  assert.deepEqual(S.parseCardText('Ameer Al Oudh Intense Oud (2021) 7.7 1.259'), { rating: 7.7, votes: 1259, year: 2021 });
});

test('el puntaje penaliza pocos votos sin usar rating × votos', () => {
  const items = [
    { rating: 9.5, votes: 3 }, { rating: 8.4, votes: 900 }, { rating: 7.0, votes: 200 }, { rating: 8.0, votes: 100 },
  ];
  const ctx = S.buildContext(items);
  const sc = items.map((i) => S.statScore(i, ctx));
  assert.ok(sc[1] > sc[0], '8.4 con 900 votos supera a 9.5 con 3');
  assert.ok(sc[3] > sc[2]);
  assert.equal(S.statScore({ rating: null, votes: 5 }, ctx), null);
});

test('valoración y votos son filtros opcionales', () => {
  const it = { text: 'rosa oud', rating: 8, votes: 50, year: 2020, score: 7.5 };
  assert.ok(S.passes(it, {}));
  assert.ok(!S.passes(it, { votesMin: 100 }));
  assert.ok(!S.passes(it, { ratingMin: 8.5 }));
  assert.ok(S.passes(it, { include: 'oud, ámbar' }));
  assert.ok(!S.passes(it, { include: 'oud, ámbar', matchAll: true }));
  assert.ok(!S.passes(it, { exclude: 'rosa' }));
  assert.ok(!S.passes(it, { yearMin: 2021 }));
  assert.ok(!S.passes(it, { scoreMin: 8 }));
});

test('paginación: última página, URL de otra página y páginas a traer', () => {
  const base = 'https://www.parfumo.com/Perfumes/Lattafa?current_page=2&v=list&o=nr_desc';
  assert.equal(S.pageOf(base), 2);
  assert.equal(S.pageOf('https://www.parfumo.com/Perfumes/Lattafa'), null);
  assert.equal(S.lastPage([base, S.pageUrl(base, 5), S.pageUrl(base, 1)]), 5);
  assert.equal(S.lastPage([]), 1);
  assert.equal(S.pageUrl(base, 4), 'https://www.parfumo.com/Perfumes/Lattafa?current_page=4&v=list&o=nr_desc');
  assert.equal(S.pageUrl('https://www.parfumo.com/Perfumes/Lattafa', 3), 'https://www.parfumo.com/Perfumes/Lattafa?current_page=3');
  // Estoy en la 3 de 6: traer todo salvo la 3.
  assert.deepEqual(S.pagesToLoad(3, 6, [], 99), [1, 2, 4, 5, 6]);
  // Tope de 4 páginas en total (la actual cuenta): trae 3 más.
  assert.deepEqual(S.pagesToLoad(1, 23, [], 4), [2, 3, 4]);
  // Ya cargadas no se repiten.
  assert.deepEqual(S.pagesToLoad(1, 5, [2, 3], 99), [4, 5]);
  assert.deepEqual(S.pagesToLoad(1, 1, [], 10), []);
});

test('filtros de duración y estela se combinan entre sí y con valoración y votos', () => {
  const it = { text: 'khamrah', rating: 7.9, votes: 4791, year: 2022, m: { dur: { rating: 8.4, votes: 4545 }, sillage: { rating: 8.2, votes: 4523 } } };
  assert.ok(S.passes(it, { durMin: 8, sillageMin: 8 }));
  assert.ok(!S.passes(it, { durMin: 8, sillageMin: 8.5 }), 'falla la estela aunque pase la duración');
  assert.ok(!S.passes(it, { durMin: 8.5, sillageMin: 8 }), 'falla la duración aunque pase la estela');
  assert.ok(!S.passes(it, { durMin: 8, sillageMin: 8, ratingMin: 8 }), 'falla la valoración aunque pasen las otras');
  assert.ok(S.passes(it, { durMin: 8, sillageMin: 8, ratingMin: 7.5, votesMin: 1000, yearMin: 2020 }));
  assert.ok(!S.passes(it, { sillageVotesMin: 5000 }));
  assert.ok(!S.passes(it, { bottleMin: 1 }), 'sin dato de esa métrica no pasa');
  assert.ok(S.passes({ ...it, m: {} }, { ratingMin: 7 }), 'sin filtros de métricas extra no se exige el dato');
  const a = [{ index: 0, m: { dur: { rating: 7 } } }, { index: 1, m: {} }, { index: 2, m: { dur: { rating: 9 } } }];
  assert.deepEqual(S.sortItems(a, 'dur').map((x) => x.index), [2, 0, 1]);
});

test('métricas: clase de la tarjeta y URL de orden', () => {
  assert.equal(S.metricaDeClase('av av_sillage'), 'sillage');
  assert.equal(S.metricaDeClase('av av_pricing'), 'pricing');
  assert.equal(S.metricaDeClase('av av_scent'), 'scent');
  assert.equal(S.metricaDeClase('av'), null);
  const u = 'https://www.parfumo.com/Perfumes/Lattafa?current_page=2&v=list&o=nr_desc&g_f=1';
  assert.equal(S.urlConOrden(u, 's_desc'), 'https://www.parfumo.com/Perfumes/Lattafa?current_page=2&v=list&o=s_desc&g_f=1');
  assert.equal(S.urlConOrden('https://www.parfumo.com/Perfumes/Lattafa', 'd_desc'), 'https://www.parfumo.com/Perfumes/Lattafa?o=d_desc');
  assert.equal(S.METRICAS.dur.o, 'd_desc');
});

test('sortItems ordena por puntaje y deja nulos al final', () => {
  const a = [{ index: 0, score: 5 }, { index: 1, score: null }, { index: 2, score: 7 }];
  assert.deepEqual(S.sortItems(a, 'score').map((x) => x.index), [2, 0, 1]);
  assert.deepEqual(S.sortItems(a, 'original').map((x) => x.index), [0, 1, 2]);
});

test('buscador: orden con order= y enlace de búsqueda en la colección', () => {
  const b = 'https://www.parfumo.com/s_perfumes_x.php?wr_id=1323510%3B1&v=list&order=nr_desc';
  assert.equal(S.urlConOrden(b, 'd_desc'), 'https://www.parfumo.com/s_perfumes_x.php?wr_id=1323510%3B1&v=list&order=d_desc');
  // Sin parámetro de orden en la URL: se usa el que se indique.
  const sin = 'https://www.parfumo.com/s_perfumes_x.php?&wr_id=1323510%3B1&v=list';
  assert.equal(S.urlConOrden(sin, 's_desc', 'order'), sin + '&order=s_desc');
  assert.equal(S.urlConOrden(sin, 's_desc'), sin + '&o=s_desc');
  assert.equal(S.urlBusquedaColeccion('https://www.parfumo.com/s_perfumes_x.php?&wr_id=1323510%3B1'), 'https://www.parfumo.com/s_perfumes_x.php?&wr_id=1323510%3B1&v=list');
  assert.equal(S.urlBusquedaColeccion('https://www.parfumo.com/s_perfumes_x.php?&wr_id=1%3B1&v=grid'), 'https://www.parfumo.com/s_perfumes_x.php?&wr_id=1%3B1&v=grid');
  assert.equal(S.urlBusquedaColeccion('https://www.parfumo.com/s_perfumes_x.php?filter=oud'), null);
  assert.equal(S.urlBusquedaColeccion('https://www.parfumo.com/Perfumes/Lattafa'), null);
});

test('tablaMarkdown arma la tabla con todas las métricas y "-" donde no hay dato', () => {
  const t = S.tablaMarkdown([
    { nombre: 'Khamrah', casa: 'Lattafa', year: 2022, rating: 7.9, votes: 4791, m: { dur: { rating: 8.4, votes: 4545 }, sillage: { rating: 8.2, votes: 4523 } } },
    { nombre: 'A | B', casa: 'X', year: null, rating: null, votes: null, m: {} },
  ]).split('\n');
  assert.equal(t[0], '| Perfume | Casa | Año | Aroma | Duración | Estela | Botella | Precio/valor |');
  assert.equal(t[2], '| Khamrah | Lattafa | 2022 | 7.9 (4791) | 8.4 (4545) | 8.2 (4523) | - | - |');
  assert.equal(t[3], '| A / B | X | - | - | - | - | - | - |');
});
