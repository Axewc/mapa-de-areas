// Pruebas de las reglas puras del hub (js/core.js).
// Correr con: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  reviewItem, stationProgress, lineProgress, isVisited, itemIds,
  currentStation, getQuestion, validState, emptyState
} = require('../js/core.js');

function q(tag) { return { q: 'P ' + tag, opts: ['a', 'b', 'c', 'd'], ok: 0, why: 'Porque ' + tag }; }
function station(id) {
  return {
    id, name: id, plain: '', why: '',
    steps: [0, 1, 2, 3].map(n => ({ idea: 'idea ' + n, q: q(id + n) })),
    extra: [q(id + '4'), q(id + '5')],
    task: '', res: []
  };
}
const A = station('a');
const B = station('b');
const L = { id: 'l', stations: ['a', 'b'] };

test('reviewItem: acierto sube de caja y programa', () => {
  assert.deepEqual({ ...reviewItem(undefined, true, '2026-11-10', 1) }, { b: 1, due: '2026-11-11', t: 1 });
  assert.deepEqual({ ...reviewItem({ b: 2, due: 'x', t: 0 }, true, '2026-11-10', 2) }, { b: 3, due: '2026-11-17', t: 2 });
  assert.equal(reviewItem({ b: 5 }, true, '2026-11-10', 3).b, 5);
  assert.equal(reviewItem({ b: 5 }, true, '2026-11-10', 3).due, '2026-12-15');
});
test('reviewItem: error baja a la caja 1 y vuelve mañana', () => {
  assert.deepEqual({ ...reviewItem({ b: 4 }, false, '2026-12-31', 9) }, { b: 1, due: '2027-01-01', t: 9 });
});
test('avance de estación y de línea con pesos por caja', () => {
  const s = { ...emptyState(), items: { 'a.0': { b: 1 }, 'a.1': { b: 5 } } };
  assert.equal(stationProgress(s, A), (0.4 + 1) / 6);
  assert.equal(lineProgress(s, L, { a: A, b: B }), ((0.4 + 1) / 6) / 2);
});
test('visitada: los 6 ítems en caja 1 o más', () => {
  const items = Object.fromEntries(itemIds(A).map(id => [id, { b: 1 }]));
  assert.equal(isVisited({ ...emptyState(), items }, A), true);
  delete items['a.5'];
  assert.equal(isVisited({ ...emptyState(), items }, A), false);
});
test('estación compartida cuenta en las dos líneas', () => {
  const items = Object.fromEntries(itemIds(A).map(id => [id, { b: 5 }]));
  const st = { ...emptyState(), items }, S = { a: A, b: B };
  assert.equal(lineProgress(st, { stations: ['a', 'b'] }, S), 0.5);
  assert.equal(lineProgress(st, { stations: ['a'] }, S), 1);
});
test('currentStation salta estaciones con todos los pasos vistos y las desconocidas', () => {
  const items = { 'a.0': { b: 1 }, 'a.1': { b: 1 }, 'a.2': { b: 1 }, 'a.3': { b: 1 } };
  assert.equal(currentStation({ ...emptyState(), items }, { stations: ['zzz', 'a', 'b'] }, { a: A, b: B }), 'b');
});
test('ítems desconocidos no cambian el avance', () => {
  const s = { ...emptyState(), items: { 'zzz.0': { b: 5 } } };
  assert.equal(stationProgress(s, A), 0);
});
test('getQuestion y validState', () => {
  assert.equal(getQuestion({ a: A }, 'a.4'), A.extra[0]);
  assert.equal(getQuestion({ a: A }, 'a.9'), null);
  assert.equal(validState(emptyState()), true);
  assert.equal(validState({ v: 3, items: {}, days: {} }), false);
});
test('itemIds, getQuestion de pasos y validState estricto', () => {
  assert.deepEqual(itemIds(A), ['a.0', 'a.1', 'a.2', 'a.3', 'a.4', 'a.5']);
  assert.equal(getQuestion({ a: A }, 'a.2'), A.steps[2].q);
  assert.equal(getQuestion({ a: A }, 'zzz.0'), null);
  assert.equal(validState({ v: 2, items: [], days: {} }), false);
  assert.equal(validState(null), false);
});
test('currentStation devuelve null si todo está visto; no muta argumentos', () => {
  const items = {};
  [A, B].forEach(s => [0, 1, 2, 3].forEach(n => { items[s.id + '.' + n] = { b: 2 }; }));
  const st = { ...emptyState(), items };
  const copy = JSON.stringify(st);
  assert.equal(currentStation(st, L, { a: A, b: B }), null);
  const prev = { b: 1, due: 'x', t: 0 };
  reviewItem(prev, true, '2026-11-10', 5);
  assert.deepEqual(prev, { b: 1, due: 'x', t: 0 });
  assert.equal(JSON.stringify(st), copy);
});
