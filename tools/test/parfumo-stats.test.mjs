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

test('sortItems ordena por puntaje y deja nulos al final', () => {
  const a = [{ index: 0, score: 5 }, { index: 1, score: null }, { index: 2, score: 7 }];
  assert.deepEqual(S.sortItems(a, 'score').map((x) => x.index), [2, 0, 1]);
  assert.deepEqual(S.sortItems(a, 'original').map((x) => x.index), [0, 1, 2]);
});
