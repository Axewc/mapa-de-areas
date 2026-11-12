// Pruebas de las reglas puras del hub (js/core.js).
// Correr con: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  reviewItem, stationProgress, lineProgress, isVisited, itemIds,
  currentStation, getQuestion, validState, emptyState,
  buildSession, enqueueRepeat, describeSession, nextDue,
  recordAnswer, finishSession, setGoal, totalXp, level, weekKey, streak, mergeState,
  applyShortcut, sessionSummary, segmentOffsets, lineasFor,
  mapLabelLines, mapMarkerW, mapLayout, mapIssues, MAP_GEO, mapTextW
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

function daysDone(list) {
  const days = {};
  for (const d of list) days[d] = { xp: 20, done: true };
  return { ...emptyState(), days };
}

test('recordAnswer suma XP y mueve la caja; la repetición solo suma XP', () => {
  let s = recordAnswer(emptyState(), 'a.0', true, '2026-11-10', 1);
  assert.equal(s.items['a.0'].b, 1); assert.equal(s.days['2026-11-10'].xp, 10);
  s = recordAnswer(s, 'a.0', false, '2026-11-10', 2, { repeat: true });
  assert.equal(s.items['a.0'].b, 1); assert.equal(s.days['2026-11-10'].xp, 12);
});
test('finishSession marca el día y suma 20', () => {
  const s = finishSession(emptyState(), '2026-11-10');
  assert.deepEqual({ ...s.days['2026-11-10'] }, { xp: 20, done: true });
});
test('setGoal, totalXp, level y weekKey', () => {
  const s = setGoal(emptyState(), 'l', 7);
  assert.equal(s.goal, 'l'); assert.equal(s.goalT, 7);
  assert.equal(totalXp({ ...emptyState(), days: { x: { xp: 30, done: true }, y: { xp: 12, done: false } } }), 42);
  assert.equal(level(0), 1); assert.equal(level(199), 1); assert.equal(level(200), 2);
  assert.equal(weekKey('2026-11-10'), '2026-11-09');
  assert.equal(weekKey('2026-11-08'), '2026-11-02');
  assert.equal(weekKey('2026-11-09'), '2026-11-09');
});
test('racha: hoy pendiente no la rompe', () => {
  assert.equal(streak(daysDone(['2026-11-08', '2026-11-09']), '2026-11-10').current, 2);
});
test('racha: un día faltante por semana se tolera, dos no', () => {
  // semana del lunes 2: cumplidos lun 2, mar 3, jue 5 y vie 6; falta mié 4 → 4
  assert.equal(streak(daysDone(['2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06']), '2026-11-06').current, 4);
  assert.equal(streak(daysDone(['2026-11-02', '2026-11-05', '2026-11-06']), '2026-11-06').current, 2);
});
test('racha: el descanso es por semana de lunes a domingo', () => {
  // dom 8 falta (semana del 2) y lun 9 falta (semana del 9): sigue
  assert.equal(streak(daysDone(['2026-11-06', '2026-11-07', '2026-11-10']), '2026-11-10').current, 3);
});
test('racha: sin días cumplidos es 0', () => {
  assert.deepEqual({ ...streak(emptyState(), '2026-11-10') }, { current: 0, best: 0, rest: [] });
});
test('best toma la racha más larga del historial', () => {
  // 5 días (1 a 5), hueco de 3 (6 a 8, misma semana), 2 días (9 y 10) → best 5, current 2
  const s = daysDone(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-09', '2026-11-10']);
  const r = streak(s, '2026-11-10');
  assert.equal(r.best, 5); assert.equal(r.current, 2);
});
test('mergeState: ítem más reciente, XP máximo, done si cualquiera, meta más reciente, desconocidos se conservan', () => {
  const a = { ...emptyState(), goal: 'x', goalT: 5, items: { 'a.0': { b: 1, due: 'd', t: 10 }, 'zzz.0': { b: 2, due: 'd', t: 1 } }, days: { '2026-11-10': { xp: 30, done: false } } };
  const b = { ...emptyState(), goal: 'y', goalT: 9, items: { 'a.0': { b: 3, due: 'e', t: 20 } }, days: { '2026-11-10': { xp: 12, done: true } } };
  const m = mergeState(a, b);
  assert.equal(m.items['a.0'].b, 3); assert.ok(m.items['zzz.0']);
  assert.deepEqual({ ...m.days['2026-11-10'] }, { xp: 30, done: true });
  assert.equal(m.goal, 'y');
});
test('mergeState: estado inválido se ignora', () => {
  const a = { ...emptyState(), goal: 'x', goalT: 5 };
  assert.equal(mergeState(a, { v: 9 }).goal, 'x');
  assert.equal(mergeState(null, a).goal, 'x');
  assert.deepEqual(mergeState(null, null), emptyState());
});
test('atajo: dos aciertos llevan los 6 ítems a la caja 3 con repaso en 7 días', () => {
  const r = applyShortcut(emptyState(), A, [A.extra[0].ok, A.extra[1].ok], '2026-11-10', 1);
  assert.equal(r.passed, true);
  assert.ok(itemIds(A).every(id => r.state.items[id].b === 3 && r.state.items[id].due === '2026-11-17'));
});
test('atajo: un error estudia normal y cuenta esas dos respuestas', () => {
  const r = applyShortcut(emptyState(), A, [A.extra[0].ok, (A.extra[1].ok + 1) % 4], '2026-11-10', 1);
  assert.equal(r.passed, false);
  assert.equal(r.state.items['a.4'].b, 1); assert.equal(r.state.items['a.5'].b, 1); assert.equal(r.state.items['a.0'], undefined);
});
test('sessionSummary', () => {
  const mk = (ids, due, xp) => {
    const items = {};
    for (const id of ids) items[id] = { b: 1, due, t: 0 };
    return { ...emptyState(), items, days: { '2026-11-10': { xp, done: xp > 10 } } };
  };
  const before = mk(['a.0', 'a.1', 'a.2', 'a.3'], '2026-11-11', 10);
  const after = mk(itemIds(A).concat(['zzz.0']), '2026-11-11', 30);
  after.items['a.4'].due = '2026-11-12'; after.items['a.5'].due = '2026-11-12';
  const r = sessionSummary(before, after, L, S, '2026-11-10');
  assert.deepEqual({ ...r, visited: r.visited.slice() }, { xp: 20, streak: 1, deltaPct: 7, visited: ['a'], dueTomorrow: 4 });
});
test('las funciones no mutan sus argumentos', () => {
  const s = emptyState(); const frozen = JSON.stringify(s);
  recordAnswer(s, 'a.0', true, '2026-11-10', 1); finishSession(s, '2026-11-10');
  assert.equal(JSON.stringify(s), frozen);
});

test('segmentOffsets separa tramos compartidos', () => {
  const o = segmentOffsets([{ id: 'p', stations: ['a', 'b', 'c'] }, { id: 'q', stations: ['x', 'a', 'b'] }]);
  assert.equal(o.p['a|b'], -3.5); assert.equal(o.q['a|b'], 3.5); assert.equal(o.p['b|c'], 0);
  assert.equal(o.q['a|x'], 0);
});
test('segmentOffsets: tres líneas en el mismo tramo, en cualquier sentido', () => {
  const o = segmentOffsets([{ id: 'p', stations: ['a', 'b'] }, { id: 'q', stations: ['b', 'a'] }, { id: 'r', stations: ['c', 'a', 'b'] }]);
  assert.deepEqual([o.p['a|b'], o.q['a|b'], o.r['a|b']], [-7, 0, 7]);
});
test('lineasFor', () => {
  const { LINEAS } = require('../js/data-lineas.js');
  // L1 a L4: solo SatoriTech tiene infraestructura (las líneas de la Tarea 6 también pueden tenerla)
  assert.deepEqual([...lineasFor(['inf'], LINEAS.slice(0, 4))], ['satori-cloud-jr']);
  assert.deepEqual([...lineasFor(['web', 'dat'], LINEAS.slice(0, 4))], ['edar-dev-jr', 'sears-datos-jr', 'mvs-tester-jr']);
  assert.deepEqual([...lineasFor(['rsk'], LINEAS.slice(0, 4))], []);
});
test('lineasFor usa la global LINEAS si no recibe líneas', () => {
  globalThis.LINEAS = [{ id: 'u', areas: ['ml'] }, { id: 'w', areas: ['dat', 'ml'] }];
  try { assert.deepEqual([...lineasFor(['ml'])], ['u', 'w']); } finally { delete globalThis.LINEAS; }
});

const ST = { a: { name: 'Aa' }, b: { name: 'Bb' }, c: { name: 'Cc' }, d: { name: 'Dd' } };

test('mapLabelLines: corta en 2 renglones solo los nombres largos, donde el renglón más largo queda más corto', () => {
  assert.deepEqual(mapLabelLines('SQL'), ['SQL']);
  assert.deepEqual(mapLabelLines('LLM y embeddings'), ['LLM y embeddings']);
  assert.deepEqual(mapLabelLines('Pruebas automáticas'), ['Pruebas', 'automáticas']);
  assert.deepEqual(mapLabelLines('Amenazas y vulnerabilidades'), ['Amenazas y', 'vulnerabilidades']);
  assert.deepEqual(mapLabelLines('Respuesta a incidentes'), ['Respuesta a', 'incidentes']);
});

test('mapTextW: las mayúsculas y la m pesan más que la i', () => {
  assert.ok(mapTextW('SQL') > mapTextW('sql'));
  assert.ok(mapTextW('mm') > mapTextW('ii'));
  assert.equal(mapTextW(''), 0);
});

test('mapLayout: etiqueta arriba o abajo, centrada en la estación', () => {
  const L = mapLayout([{ id: 'p', stations: ['a', 'b'], map: { a: [100, 100, 't'], b: [200, 100, 'b'] } }], ST);
  const a = L.byId.a.label, b = L.byId.b.label;
  assert.equal(a.anchor, 'middle');
  assert.ok(a.box.y1 <= 100 - MAP_GEO.r && Math.abs((a.box.x0 + a.box.x1) / 2 - 100) < 0.01);
  assert.ok(b.box.y0 >= 100 + MAP_GEO.r);
});

test('mapMarkerW: círculo para una línea, píldora que crece con cada línea', () => {
  assert.equal(mapMarkerW(1), 2 * MAP_GEO.r);
  assert.ok(mapMarkerW(2) > mapMarkerW(1));
  assert.equal(mapMarkerW(5) - mapMarkerW(4), MAP_GEO.dotGap);
});

test('mapLayout: estaciones sin repetir, alto = y mayor + 40 y tramos compartidos desplazados en paralelo', () => {
  const lines = [
    { id: 'p', stations: ['a', 'b'], map: { a: [100, 20], b: [100, 120, 'l'] } },
    { id: 'q', stations: ['b', 'a', 'c'], map: { b: [100, 120, 'l'], a: [100, 20], c: [200, 20] } }
  ];
  const L = mapLayout(lines, ST);
  assert.deepEqual(L.nodes.map((n) => n.id), ['a', 'b', 'c']);
  assert.deepEqual(L.byId.a.lines, ['p', 'q']);
  assert.equal(L.height, 160);
  // Tramo vertical a-b: p a un lado (x = 103.5) y q al otro (x = 96.5), aunque q lo recorra al revés.
  assert.deepEqual(L.paths.p[0].map((v) => +v.toFixed(2)), [103.5, 20, 103.5, 120]);
  assert.deepEqual(L.paths.q[0].map((v) => +v.toFixed(2)), [96.5, 120, 96.5, 20]);
  assert.deepEqual(L.paths.q[1], [100, 20, 200, 20]);
  // Etiqueta a la izquierda: termina antes de la píldora.
  assert.equal(L.byId.b.label.anchor, 'end');
  assert.ok(L.byId.b.label.box.x1 <= 100 - mapMarkerW(2) / 2);
  assert.equal(L.byId.c.label.anchor, 'start');
});

test('mapIssues encuentra etiquetas encimadas, tramos sobre estaciones ajenas y estaciones juntas', () => {
  const ok = mapLayout([{ id: 'p', stations: ['a', 'b'], map: { a: [40, 40], b: [40, 120] } }], ST);
  assert.deepEqual(mapIssues(ok, 44), []);
  const juntas = mapLayout([{ id: 'p', stations: ['a', 'b'], map: { a: [40, 40], b: [40, 70] } }], ST);
  assert.ok(mapIssues(juntas, 44).some((m) => /estaciones juntas: a y b/.test(m)));
  const encima = mapLayout([
    { id: 'p', stations: ['a', 'b'], map: { a: [40, 40], b: [40, 120] } },
    { id: 'q', stations: ['c', 'd'], map: { c: [90, 46, 'l'], d: [200, 200] } }
  ], ST);
  const m = mapIssues(encima, 0);
  assert.ok(m.some((x) => /etiquetas encimadas: a y c/.test(x)), m.join('; '));
  const cruza = mapLayout([
    { id: 'p', stations: ['a', 'b'], map: { a: [40, 40], b: [40, 200] } },
    { id: 'q', stations: ['c'], map: { c: [40, 120] } }
  ], ST);
  assert.ok(mapIssues(cruza, 0).some((x) => /línea sobre estación: p cruza c/.test(x)));
  const fuera = mapLayout([{ id: 'p', stations: ['a'], map: { a: [350, 40] } }], ST);
  assert.ok(mapIssues(fuera, 0).some((x) => /etiqueta fuera: a/.test(x)));
});

test('mapLayout: insignia «L#» de cada línea junto a su primera estación (line.badge o 24 arriba) y mapIssues la revisa', () => {
  const lines = [
    { id: 'p', n: 1, stations: ['a', 'b'], map: { a: [100, 100], b: [100, 200] } },
    { id: 'q', n: 2, stations: ['c', 'd'], map: { c: [250, 100], d: [250, 200] }, badge: [225, 100] }
  ];
  const L = mapLayout(lines, ST);
  assert.deepEqual(L.badges.map((b) => [b.line, b.n, b.x, b.y]), [['p', 1, 100, 76], ['q', 2, 225, 100]]);
  assert.equal(L.badges[0].box.x1 - L.badges[0].box.x0, MAP_GEO.badgeW);
  assert.deepEqual(mapIssues(L, 44), []);
  // Sobre la etiqueta de c (a la derecha de c), sobre un tramo y encima de otra insignia.
  lines[1].badge = [282, 100];
  assert.ok(mapIssues(mapLayout(lines, ST), 44).some((m) => /insignia L2 sobre la etiqueta de c/.test(m)));
  lines[1].badge = [250, 150];
  assert.ok(mapIssues(mapLayout(lines, ST), 44).some((m) => /insignia L2 sobre línea: q/.test(m)));
  lines[1].badge = [110, 76];
  assert.ok(mapIssues(mapLayout(lines, ST), 44).some((m) => /insignia L1 sobre insignia L2/.test(m)));
  lines[1].badge = [350, 20];
  assert.ok(mapIssues(mapLayout(lines, ST), 44).some((m) => /insignia L2 fuera/.test(m)));
});
