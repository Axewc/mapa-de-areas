// Pruebas de la lógica pura de js/data-areas.js.
// Correr con: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { RUTAS, NO_SE, scoreDiag, scoreReview, topicStatus, rutasFor, GLOSS } = require('../js/data-areas.js');

const q = (ok) => ({ q: '¿?', opts: ['w', 'x', 'y', 'z'], ok, why: 'porque sí, con detalle suficiente' });
const R = {
  title: 'Prueba', topics: [
    { id: 'a', name: 'A', diag: q(1), review: [q(0), q(0)] },
    { id: 'b', name: 'B', diag: q(1), review: [q(0), q(0)] },
  ],
};

// --- Tarea 1: lógica ---

test('NO_SE es el texto de la opción para no adivinar', () => {
  assert.equal(NO_SE, 'Aún no lo sé');
});

test('scoreDiag: acierto, error y «Aún no lo sé»', () => {
  assert.deepEqual({ ...scoreDiag(R, [1, 0]) }, { a: 1, b: 0 });
  assert.deepEqual({ ...scoreDiag(R, [4, 1]) }, { a: 0, b: 1 }); // 4 = opts.length = NO_SE
});

test('scoreReview cuenta aciertos del tema', () => {
  assert.deepEqual({ ...scoreReview(R.topics[0], [0, 0]) }, { a: 2 });
  assert.deepEqual({ ...scoreReview(R.topics[0], [0, 3]) }, { a: 1 });
});

test('topicStatus: sin filas todo es nuevo', () => {
  const s = topicStatus(R, []);
  assert.deepEqual({ ...s.a }, { state: 'nuevo', kind: null, score: null, at: null });
  assert.equal(s.b.state, 'nuevo');
});

test('topicStatus: gana la evidencia más reciente', () => {
  const rows = [
    { kind: 'diagnostico', topic: null, scores: { a: 0, b: 1 }, created_at: '2026-11-10T10:00:00Z' },
    { kind: 'repaso', topic: 'a', scores: { a: 2 }, created_at: '2026-11-10T11:00:00Z' },
    { kind: 'diagnostico', topic: null, scores: { a: 1, b: 0 }, created_at: '2026-11-10T09:00:00Z' },
  ];
  const s = topicStatus(R, rows);
  assert.deepEqual({ ...s.a }, { state: 'dominado', kind: 'repaso', score: 2, at: '2026-11-10T11:00:00Z' });
  assert.deepEqual({ ...s.b }, { state: 'dominado', kind: 'diagnostico', score: 1, at: '2026-11-10T10:00:00Z' });
});

test('topicStatus: repaso 1 de 2 deja pendiente; diagnóstico nuevo gana a repaso viejo', () => {
  const s = topicStatus(R, [
    { kind: 'repaso', topic: 'a', scores: { a: 1 }, created_at: '2026-11-10T10:00:00Z' },
    { kind: 'repaso', topic: 'b', scores: { b: 2 }, created_at: '2026-11-10T10:00:00Z' },
    { kind: 'diagnostico', topic: null, scores: { a: 0, b: 0 }, created_at: '2026-11-11T10:00:00Z' },
  ]);
  assert.equal(s.a.state, 'pendiente');
  assert.equal(s.b.state, 'pendiente');
});

test('topicStatus: un repaso de 1 de 2 sin diagnóstico queda pendiente', () => {
  const s = topicStatus(R, [{ kind: 'repaso', topic: 'a', scores: { a: 1 }, created_at: '2026-11-10T10:00:00Z' }]);
  assert.deepEqual({ ...s.a }, { state: 'pendiente', kind: 'repaso', score: 1, at: '2026-11-10T10:00:00Z' });
  assert.equal(s.b.state, 'nuevo');
});

test('topicStatus ignora temas desconocidos y scores incompletos', () => {
  const s = topicStatus(R, [
    { kind: 'repaso', topic: 'zzz', scores: { zzz: 2 }, created_at: '2026-11-10T10:00:00Z' },
    { kind: 'diagnostico', topic: null, scores: { a: 1 }, created_at: '2026-11-10T10:00:00Z' },
  ]);
  assert.equal(s.a.state, 'dominado');
  assert.equal(s.b.state, 'nuevo');
  assert.ok(!('zzz' in s));
});

test('rutasFor', () => {
  assert.deepEqual([...rutasFor(['ml', 'web', 'con'])], ['getnet-ai-deploy']);
  assert.deepEqual([...rutasFor(['web', 'con', 'sec'])], []);
});

test('ruta Getnet: metadatos de la vacante', () => {
  const r = RUTAS['getnet-ai-deploy'];
  assert.equal(r.title, 'AI Deployment Engineer');
  assert.equal(r.company, 'Getnet');
  assert.equal(r.place, 'Ciudad de México · híbrido');
  assert.equal(r.url, 'https://job-boards.eu.greenhouse.io/getnet/jobs/5019637101');
  assert.equal(r.seen, '2026-11-10');
  assert.deepEqual([...r.areas], ['ml', 'bak', 'inf']);
  assert.ok(r.summary.length > 40);
  assert.equal(r.asks.length, 4);
});

// --- Tarea 2: contenido ---

test('ruta Getnet: 7 temas en orden', () => {
  assert.deepEqual([...RUTAS['getnet-ai-deploy'].topics.map(t => t.id)],
    ['agentes', 'multiagente', 'evaluacion', 'guardrails', 'rag', 'mcp', 'observabilidad']);
});

test('cada tema está completo', () => {
  for (const t of RUTAS['getnet-ai-deploy'].topics) {
    for (const k of ['name', 'plain', 'why']) assert.ok(typeof t[k] === 'string' && t[k].length > 10, t.id + '.' + k);
    assert.ok(t.ideas.length >= 3 && t.ideas.length <= 4, t.id);
    assert.ok(t.task && t.task.n && t.task.d && t.task.t, t.id);
    assert.ok(t.res.length >= 2 && t.res.length <= 3, t.id);
    t.res.forEach(r => { assert.ok(r.n, t.id); assert.match(r.u, /^https:\/\//); });
    assert.equal(t.review.length, 2, t.id);
    [t.diag, ...t.review].forEach(q => {
      assert.equal(q.opts.length, 4, t.id);
      assert.ok(Number.isInteger(q.ok) && q.ok >= 0 && q.ok < 4, t.id);
      assert.ok(q.why.length > 20, t.id);
      assert.ok(!q.opts.includes(NO_SE), t.id);
    });
  }
});

test('la respuesta correcta no siempre está en la misma posición', () => {
  const oks = RUTAS['getnet-ai-deploy'].topics.flatMap(t => [t.diag.ok, ...t.review.map(r => r.ok)]);
  assert.ok(new Set(oks).size >= 3);
});

test('la longitud de las opciones no delata la respuesta correcta', () => {
  const qs = RUTAS['getnet-ai-deploy'].topics.flatMap(t => [{ ...t.diag, diag: true }, ...t.review]);
  const isLongest = q => q.opts.every((o, i) => i === q.ok || o.length < q.opts[q.ok].length);
  const isShortest = q => q.opts.every((o, i) => i === q.ok || o.length > q.opts[q.ok].length);
  const diag = qs.filter(q => q.diag);
  assert.ok(qs.filter(isLongest).length <= 0.4 * qs.length, 'la correcta es la más larga en ' + qs.filter(isLongest).length + ' de ' + qs.length);
  assert.ok(qs.filter(isShortest).length <= 0.4 * qs.length, 'la correcta es la más corta en ' + qs.filter(isShortest).length + ' de ' + qs.length);
  assert.ok(diag.filter(isLongest).length <= 3, 'diagnóstico: la correcta es la más larga en ' + diag.filter(isLongest).length + ' de 7');
  assert.ok(diag.filter(isShortest).length <= 3, 'diagnóstico: la correcta es la más corta en ' + diag.filter(isShortest).length + ' de 7');
});

test('términos técnicos de las lecciones están en el glosario', () => {
  const keys = GLOSS.map(g => g[1]);
  ['llm', 'token', 'embedding', 'prompt'].forEach(k => assert.ok(keys.includes(k), k));
});

export { RUTAS, GLOSS };
