// Pruebas del cuestionario de áreas (js/data-areas.js).
// Correr con: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const dataAreas = require('../js/data-areas.js');
const { scoreAnswers, MAXP } = dataAreas;
const { lineasFor } = require('../js/core.js');
const { LINEAS } = require('../js/data-lineas.js');

test('scoreAnswers v2 con la opción 1 en todo: ml, bak, dat arriba', () => {
  const r = scoreAnswers([0,0,0,0,0,0,0,0,0,0], 2).slice(0, 3).map(x => x.key + ':' + x.pct);
  assert.deepEqual(r, ['ml:57', 'bak:43', 'dat:36']);
});
test('MAXP tiene las 9 áreas en las tres versiones', () => {
  for (const v of [1, 2, 3]) assert.equal(Object.keys(MAXP[v]).length, 9);
});
test('el resultado enlaza con las líneas de sus tres áreas', () => {
  const top = scoreAnswers([0,0,0,0,0,0,0,0,0,0], 2).slice(0, 3).map(x => x.key);
  assert.deepEqual([...lineasFor(top, LINEAS)], ['edar-dev-jr', 'sears-datos-jr', 'mvs-tester-jr', 'banorte-ds-jr', 'getnet-ai-deploy']);
  assert.deepEqual([...lineasFor(['inv'], LINEAS)], []);
});
test('data-areas.js solo exporta el cuestionario y el glosario', () => {
  assert.deepEqual(Object.keys(dataAreas).sort(), ['AREAS', 'GLOSS', 'MAXP', 'SETS', 'scoreAnswers']);
});

// ---- Cuestionario v3 («Descubre») ----
const { AREAS, SETS } = dataAreas;
const KEYS = Object.keys(AREAS);
const Q3 = (SETS[3] || { name: null, qs: [] }).qs;

// Para cada pregunta, la primera opción que más puntos le da al área.
function greedyFor(area) {
  return Q3.map(q => {
    let best = 0;
    q.opts.forEach((o, i) => { if ((o.p[area] || 0) > (q.opts[best].p[area] || 0)) best = i; });
    return best;
  });
}

test('v3: 8 preguntas con 4 o 5 opciones', () => {
  assert.equal((SETS[3] || {}).name, 'Descubre');
  assert.equal(Q3.length, 8);
  for (const q of Q3) assert.ok(q.opts.length === 4 || q.opts.length === 5, q.q);
});

test('v3: cada opción da enteros 1–3 a entre 1 y 3 áreas válidas', () => {
  for (const q of Q3) for (const o of q.opts) {
    const ks = Object.keys(o.p);
    assert.ok(ks.length >= 1 && ks.length <= 3, o.t);
    for (const k of ks) {
      assert.ok(KEYS.includes(k), o.t + ' → ' + k);
      assert.ok(Number.isInteger(o.p[k]) && o.p[k] >= 1 && o.p[k] <= 3, o.t + ' → ' + k);
    }
  }
});

test('v3: cada pregunta reparte puntos a 4 áreas o más', () => {
  for (const q of Q3) {
    const s = new Set();
    q.opts.forEach(o => Object.keys(o.p).forEach(k => s.add(k)));
    assert.ok(s.size >= 4, q.q);
  }
});

test('v3: cada área puede quedar sola en primer lugar', () => {
  for (const k of KEYS) {
    const r = scoreAnswers(greedyFor(k), 3);
    assert.equal(r[0].key, k, k + ' no queda primero');
    assert.ok(r[0].pct > r[1].pct, k + ' empata con ' + r[1].key);
  }
});

test('v3: MAXP equilibrado y cada área suma en 4 preguntas o más', () => {
  const vals = KEYS.map(k => MAXP[3][k]);
  assert.ok(Math.min(...vals) > 0);
  assert.ok(Math.max(...vals) / Math.min(...vals) <= 1.5, JSON.stringify(MAXP[3]));
  for (const k of KEYS) {
    const n = Q3.filter(q => q.opts.some(o => o.p[k])).length;
    assert.ok(n >= 4, k + ' solo suma en ' + n + ' preguntas');
  }
});

test('v3: MAXP fijo (detecta errores al copiar pesos)', () => {
  assert.deepEqual({ ...MAXP[3] }, { dat: 12, ml: 12, bak: 13, web: 13, rsk: 13, con: 12, sec: 12, inf: 13, inv: 12 });
});

test('v3: ninguna opción delata por longitud (≤ 1.6 × la más corta)', () => {
  for (const q of Q3) {
    const ls = q.opts.map(o => o.t.length);
    assert.ok(Math.max(...ls) <= 1.6 * Math.min(...ls), q.q + ' ' + ls.join(','));
  }
});

test('v3: al menos 3 preguntas plantean la IA', () => {
  const n = Q3.filter(q => /(^|[^\p{L}])IA([^\p{L}]|$)/u.test(q.q) || /asistente/i.test(q.q)).length;
  assert.ok(n >= 3, 'solo ' + n);
});

test('v3: ningún texto nombra herramientas', () => {
  const BAN = ['Python', 'SQL', 'Docker', 'Power BI', 'Excel', 'AWS', 'Git', 'Linux', 'Java', 'Kubernetes', 'React'];
  const texts = Q3.flatMap(q => [q.q, ...q.opts.map(o => o.t)]);
  for (const w of BAN) {
    const re = new RegExp('(?<![\\p{L}\\p{N}])' + w + '(?![\\p{L}\\p{N}])', 'iu');
    for (const t of texts) assert.ok(!re.test(t), w + ' en: ' + t);
  }
});

test('v3: sin preguntas ni opciones repetidas; las preguntas terminan en «?»', () => {
  const qs = Q3.map(q => q.q);
  const ts = Q3.flatMap(q => q.opts.map(o => o.t));
  assert.equal(new Set(qs).size, qs.length);
  assert.equal(new Set(ts).size, ts.length);
  for (const q of qs) assert.ok(q.endsWith('?'), q);
});
