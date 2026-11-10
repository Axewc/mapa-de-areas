// Pruebas de las reglas puras del hub (js/core.js).
// Correr con: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  reviewItem, stationProgress, lineProgress, isVisited, itemIds,
  currentStation, getQuestion, validState, emptyState,
  buildSession, enqueueRepeat, describeSession, nextDue
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
const S = { a: A, b: B };
// Estado con ítems dados como { id: [caja, due] }.
function stWith(m) {
  const items = {};
  for (const id of Object.keys(m)) items[id] = { b: m[id][0], due: m[id][1], t: 0 };
  return { ...emptyState(), items };
}
// Todos los ítems de A y B con la misma caja y fecha.
function allItems(v) {
  const m = {};
  for (const st of [A, B]) for (const id of itemIds(st)) m[id] = [v.b, v.due];
  return m;
}
const REAL = { sql: { name: 'SQL' }, git: { name: 'Git' }, datos: { name: 'Datos' } };
const rev = { kind: 'review', item: 'sql.0', station: 'sql' };
const newSql = { kind: 'new', item: 'sql.1', station: 'sql' };
const newGit = { kind: 'new', item: 'git.1', station: 'git' };
const newDatos = { kind: 'new', item: 'datos.1', station: 'datos' };

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

test('primera sesión: 5 pasos nuevos de la primera estación de la meta', () => {
  const c = buildSession(emptyState(), '2026-11-10', [L], S);
  assert.deepEqual(c.map(x => x.item), ['a.0', 'a.1', 'a.2', 'a.3', 'b.0']);
  assert.ok(c.every(x => x.kind === 'new'));
});
test('mezcla: hasta 3 repasos vencidos, del más atrasado al menos', () => {
  const st = stWith({ 'b.0': [1, '2026-11-09'], 'b.1': [1, '2026-11-01'], 'b.2': [1, '2026-11-10'], 'b.3': [1, '2026-11-05'], 'a.0': [2, '2026-11-20'] });
  const c = buildSession(st, '2026-11-10', [L], S);
  assert.deepEqual(c.slice(0, 3).map(x => x.item), ['b.1', 'b.3', 'b.0']);
  assert.deepEqual(c.slice(3).map(x => x.kind), ['new', 'new']);
});
test('sin pasos nuevos se completa con más repasos; luego extras', () => {
  const m = allItems({ b: 2, due: '2026-12-01' });
  delete m['a.4']; delete m['a.5']; delete m['b.4']; delete m['b.5'];
  m['a.0'] = [2, '2026-11-01'];
  m['a.1'] = [2, '2026-11-05'];
  const c = buildSession(stWith(m), '2026-11-10', [L], S);
  assert.deepEqual(c.map(x => x.item), ['a.0', 'a.1', 'a.4', 'a.5', 'b.4']);
  assert.deepEqual(c.map(x => x.kind), ['review', 'review', 'extra', 'extra', 'extra']);
  assert.equal(c[2].station, 'a');
  // con pocos pasos nuevos y muchos repasos, el resto de D completa
  const m2 = { 'a.0': [1, '2026-11-01'], 'a.1': [1, '2026-11-02'], 'a.2': [1, '2026-11-03'], 'a.3': [1, '2026-11-04'], 'b.0': [1, '2026-11-05'], 'b.1': [1, '2026-11-06'] };
  for (const id of ['a.4', 'a.5', 'b.2', 'b.3', 'b.4', 'b.5']) m2[id] = [1, '2026-12-01'];
  assert.deepEqual(buildSession(stWith(m2), '2026-11-10', [L], S).map(x => x.item), ['a.0', 'a.1', 'a.2', 'a.3', 'b.0']);
});
test('todo al día: [] y nextDue da la fecha más cercana', () => {
  const st = stWith(allItems({ b: 5, due: '2026-12-01' }));
  assert.deepEqual(buildSession(st, '2026-11-10', [L], S), []);
  assert.equal(nextDue(st, '2026-11-10'), '2026-12-01');
  assert.equal(nextDue(emptyState(), '2026-11-10'), null);
});
test('ahead adelanta repasos no vencidos; sin ítems vistos sigue en []', () => {
  const st = stWith(allItems({ b: 5, due: '2026-12-01' }));
  assert.equal(buildSession(st, '2026-11-10', [L], S, { ahead: true }).length, 5);
  assert.deepEqual(buildSession(stWith({}), '2026-11-10', [], S, { ahead: true }), []);
});
test('meta: usa la línea de state.goal; sin duplicados ni estaciones desconocidas', () => {
  const L2 = { id: 'l2', stations: ['zzz', 'b', 'a'] };
  const st = { ...emptyState(), goal: 'l2' };
  assert.deepEqual(buildSession(st, '2026-11-10', [L, L2], S).map(x => x.item), ['b.0', 'b.1', 'b.2', 'b.3', 'a.0']);
  const st2 = { ...emptyState(), goal: 'nada' };
  assert.equal(buildSession(st2, '2026-11-10', [L, L2], S)[0].item, 'a.0');
  assert.deepEqual(buildSession(stWith({ 'zzz.0': [1, '2026-01-01'] }), '2026-11-10', [], S), []);
});
test('enqueueRepeat solo repite errores y una vez', () => {
  const c = { kind: 'new', item: 'a.0', station: 'a' };
  assert.equal(enqueueRepeat([c], c, true).length, 1);
  const q = enqueueRepeat([c], c, false);
  assert.deepEqual(q[1], { ...c, repeat: true });
  assert.equal(enqueueRepeat(q, q[1], false).length, 2);
});
test('describeSession', () => {
  assert.equal(describeSession([rev, rev, rev, newSql, newSql], REAL), '5 min · 3 repasos · 2 pasos nuevos de SQL');
  assert.equal(describeSession([newGit, newGit, newGit, newGit, newDatos], REAL), '5 min · 5 pasos nuevos de Git y más');
  assert.equal(describeSession([rev], REAL), '1 min · 1 repaso');
  assert.equal(describeSession([], REAL), '');
});
