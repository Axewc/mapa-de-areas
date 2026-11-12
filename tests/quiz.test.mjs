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

// Para cada pregunta, la opción que más puntos le da al área. Si ninguna opción
// le da puntos, la que menos puntos suma a las demás áreas.
function greedyFor(area) {
  return Q3.map(q => {
    const has = q.opts.some(o => o.p[area]);
    let best = 0, bestVal = null;
    q.opts.forEach((o, i) => {
      let val;
      if (has) {
        val = o.p[area] || 0;
      } else {
        val = 0;
        Object.keys(o.p).forEach(k => { val -= o.p[k]; });
      }
      if (bestVal === null || val > bestVal) { best = i; bestVal = val; }
    });
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
    assert.ok(r[0].pct - r[1].pct >= 20, k + ' solo supera a ' + r[1].key + ' por ' + (r[0].pct - r[1].pct) + ' pp');
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
  assert.deepEqual({ ...MAXP[3] }, { dat: 14, ml: 12, bak: 15, web: 14, rsk: 14, con: 13, sec: 12, inf: 13, inv: 12 });
});

test('desempate: mismo porcentaje redondeado, gana la mayor proporción exacta', () => {
  // Sintético: dat = 2/26 = 7.7 % y con = 2/25 = 8.0 %; ambos redondean a 8.
  // dat va primero por índice, pero con tiene mayor proporción exacta.
  const v = 99;
  SETS[v] = { name: 'sintetico', qs: [{ q: '¿Prueba?', opts: [{ t: 'a', p: { dat: 2, con: 2 } }] }] };
  MAXP[v] = {};
  KEYS.forEach(k => { MAXP[v][k] = 10; });
  MAXP[v].dat = 26;
  MAXP[v].con = 25;
  try {
    const r = scoreAnswers([0], v);
    assert.equal(r[0].pct, 8);
    assert.equal(r[1].pct, 8);
    assert.equal(r[0].key, 'con');
  } finally {
    delete SETS[v];
    delete MAXP[v];
  }
});

test('desempate: en todas las combinaciones de v3, < 8 % de empates exactos y cada área gana entre 8 % y 14.5 %', () => {
  // Empate exacto = primero y segundo con la misma proporción raw/MAXP y los mismos puntos brutos.
  // El reparto usa scoreAnswers tal cual, con su desempate por la pregunta más reciente.
  const sizes = Q3.map(q => q.opts.length);
  const total = sizes.reduce((a, b) => a * b, 1);
  assert.equal(total, 160000);
  const idx = sizes.map(() => 0);
  const wins = {};
  KEYS.forEach(k => { wins[k] = 0; });
  let ties = 0;
  for (let n = 0; n < total; n++) {
    const raw = {};
    KEYS.forEach(k => { raw[k] = 0; });
    Q3.forEach((q, i) => {
      const p = q.opts[idx[i]].p;
      Object.keys(p).forEach(k => { raw[k] += p[k]; });
    });
    const r = scoreAnswers(idx, 3);
    const a = r[0].key, b = r[1].key;
    if (raw[a] === raw[b] && raw[a] * MAXP[3][b] === raw[b] * MAXP[3][a]) ties++;
    wins[a]++;
    for (let i = sizes.length - 1; i >= 0; i--) { // contador tipo odómetro
      idx[i]++;
      if (idx[i] < sizes[i]) break;
      idx[i] = 0;
    }
  }
  const frac = ties / total;
  assert.ok(frac < 0.08, 'empates exactos en el primer lugar: ' + (frac * 100).toFixed(2) + ' %');
  for (const k of KEYS) {
    const f = wins[k] / total;
    assert.ok(f >= 0.08 && f <= 0.145, k + ' queda primera en ' + (f * 100).toFixed(2) + ' %');
  }
});

test('desempate: con proporción y puntos iguales gana quien sumó más en la pregunta más reciente', () => {
  // Sintético: dat y con terminan con 3 de 6. dat va antes en AREAS, pero con
  // ganó más en la pregunta 2 (la última en que difieren); en la 3 empatan.
  const v = 98;
  SETS[v] = { name: 'sintetico', qs: [
    { q: '¿Uno?', opts: [{ t: 'a', p: { dat: 2, con: 1 } }] },
    { q: '¿Dos?', opts: [{ t: 'b', p: { dat: 1, con: 2 } }] },
    { q: '¿Tres?', opts: [{ t: 'c', p: { inv: 1 } }] }
  ] };
  MAXP[v] = {};
  KEYS.forEach(k => { MAXP[v][k] = 6; });
  try {
    const r = scoreAnswers([0, 0, 0], v);
    assert.deepEqual(r.slice(0, 2).map(x => x.key), ['con', 'dat']);
    assert.deepEqual(Object.keys(r[0]).sort(), ['idx', 'key', 'pct']);
    assert.equal(r[0].pct, r[1].pct);
    // Si son idénticas en todas las preguntas, decide el índice (orden de AREAS).
    SETS[v].qs[1].opts[0].p = { dat: 1, con: 1 };
    SETS[v].qs[0].opts[0].p = { dat: 2, con: 2 };
    assert.deepEqual(scoreAnswers([0, 0, 0], v).slice(0, 2).map(x => x.key), ['dat', 'con']);
  } finally {
    delete SETS[v];
    delete MAXP[v];
  }
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
