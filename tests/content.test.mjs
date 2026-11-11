// Pruebas del contenido del hub: estaciones (js/data-estaciones.js) y líneas (js/data-lineas.js).
// Corren sobre lo que exista en ESTACIONES y LINEAS. Correr con: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ESTACIONES } = require('../js/data-estaciones.js');
const { LINEAS } = require('../js/data-lineas.js');
const { AREAS, GLOSS } = require('../js/data-areas.js');
const { glossHits } = require('../js/ui.js');

const ids = Object.keys(ESTACIONES);
const preguntas = (st) => [...st.steps.map(s => s.q), ...st.extra];
const todas = ids.flatMap(id => preguntas(ESTACIONES[id]).map(q => ({ ...q, st: id })));

test('cada estación: plain, why, 4 pasos con idea y pregunta, 2 extra, tarea y de 1 a 3 recursos https', () => {
  assert.ok(ids.length > 0);
  for (const id of ids) {
    const st = ESTACIONES[id];
    assert.equal(st.id, id, id);
    for (const k of ['name', 'plain', 'why']) assert.ok(typeof st[k] === 'string' && st[k].length > 2, id + '.' + k);
    assert.ok(st.plain.length > 20 && st.why.length > 20, id);
    assert.equal(st.steps.length, 4, id);
    st.steps.forEach((s, n) => {
      assert.ok(typeof s.idea === 'string' && s.idea.length > 20, id + ' paso ' + n);
      assert.ok(s.idea.length <= 280, id + ' paso ' + n + ' mide ' + s.idea.length);
      assert.ok(s.q && typeof s.q.q === 'string', id + ' paso ' + n);
    });
    assert.equal(st.extra.length, 2, id);
    assert.ok(st.task && st.task.n && st.task.d && st.task.t === '1 tarde', id);
    assert.ok(Array.isArray(st.res) && st.res.length >= 1 && st.res.length <= 3, id);
    st.res.forEach(r => { assert.ok(r.n, id); assert.match(r.u, /^https:\/\/\S+$/, id); });
  }
});

test('preguntas: 4 opciones, ok de 0 a 3, why de más de 20 caracteres', () => {
  for (const q of todas) {
    assert.ok(typeof q.q === 'string' && q.q.length > 10, q.st);
    assert.equal(q.opts.length, 4, q.st + ': ' + q.q);
    q.opts.forEach(o => assert.ok(typeof o === 'string' && o.length > 0, q.st));
    assert.equal(new Set(q.opts).size, 4, q.st + ': opciones repetidas');
    assert.ok(Number.isInteger(q.ok) && q.ok >= 0 && q.ok <= 3, q.st + ': ' + q.q);
    assert.ok(typeof q.why === 'string' && q.why.length > 20, q.st + ': ' + q.q);
  }
});

test('la longitud de las opciones no delata la respuesta correcta', () => {
  // sobre todas las preguntas: la correcta es la más larga en ≤ 40% y la más corta en ≤ 40%
  const isLongest = q => q.opts.every((o, i) => i === q.ok || o.length < q.opts[q.ok].length);
  const isShortest = q => q.opts.every((o, i) => i === q.ok || o.length > q.opts[q.ok].length);
  const L = todas.filter(isLongest).length, S = todas.filter(isShortest).length;
  assert.ok(L <= 0.4 * todas.length, 'la correcta es la más larga en ' + L + ' de ' + todas.length);
  assert.ok(S <= 0.4 * todas.length, 'la correcta es la más corta en ' + S + ' de ' + todas.length);
  // y tampoco va casi siempre en medio: si nunca es la más larga ni la más corta, descartar esas dos ayuda a adivinar
  assert.ok(L >= 0.1 * todas.length, 'la correcta es la más larga solo en ' + L + ' de ' + todas.length);
  assert.ok(S >= 0.1 * todas.length, 'la correcta es la más corta solo en ' + S + ' de ' + todas.length);
});

test('la correcta no siempre va en la misma posición dentro de cada estación', () => {
  // en cada estación, las 6 preguntas usan al menos 3 posiciones distintas
  for (const id of ids) assert.ok(new Set(preguntas(ESTACIONES[id]).map(q => q.ok)).size >= 3, id);
});

test('líneas: ids únicos, n consecutivos desde 1, areas válidas, URL https, seen AAAA-MM-DD', () => {
  assert.ok(LINEAS.length > 0);
  assert.equal(new Set(LINEAS.map(l => l.id)).size, LINEAS.length);
  LINEAS.forEach((l, i) => {
    assert.equal(l.n, i + 1, l.id);
    assert.equal(l.color, 'l' + l.n, l.id);
    for (const k of ['title', 'company', 'place', 'level', 'summary']) assert.ok(typeof l[k] === 'string' && l[k].length > 2, l.id + '.' + k);
    assert.ok(l.areas.length > 0 && l.areas.every(k => k in AREAS), l.id);
    assert.match(l.url, /^https:\/\/\S+$/, l.id);
    assert.match(l.seen, /^\d{4}-\d{2}-\d{2}$/, l.id);
    assert.ok(l.asks.length >= 3 && l.asks.length <= 5, l.id);
    assert.equal(new Set(l.stations).size, l.stations.length, l.id);
    if (l.note !== undefined) assert.ok(typeof l.note === 'string' && l.note.length > 5, l.id);
  });
});

test('L1 a L4: vacantes y estaciones de la tabla del spec', () => {
  const by = Object.fromEntries(LINEAS.map(l => [l.id, l]));
  const exp = {
    'edar-dev-jr': [['bak', 'web'], 'https://to.indeed.com/aatdz7r8llx4', ['git', 'datos', 'sql', 'apis', 'pruebas-auto']],
    'sears-datos-jr': [['dat'], 'https://to.indeed.com/aaldbdtkrfpw', ['hojas', 'datos', 'sql', 'tableros', 'indicadores']],
    'mvs-tester-jr': [['bak', 'web'], 'https://to.indeed.com/aa4ldtjsjhgg', ['casos-prueba', 'defectos', 'hojas', 'pruebas-auto']],
    'satori-cloud-jr': [['inf'], 'https://to.indeed.com/aadcj6rbvmmm', ['linux', 'nube', 'monitoreo', 'sql', 'git']]
  };
  Object.keys(exp).forEach((id, i) => {
    const l = by[id];
    assert.ok(l, id);
    assert.equal(l.n, i + 1, id);
    assert.equal(l.level, 'Para empezar', id);
    assert.equal(l.seen, '2026-11-10', id);
    assert.deepEqual([...l.areas], exp[id][0], id);
    assert.equal(l.url, exp[id][1], id);
    assert.deepEqual([...l.stations], exp[id][2], id);
  });
});

test('cada estación de cada línea existe y tiene coordenadas dentro del lienzo (16 ≤ x ≤ 344, y ≥ 16)', () => {
  for (const l of LINEAS) {
    assert.deepEqual(Object.keys(l.map).sort(), [...l.stations].sort(), l.id + ': map y stations no coinciden');
    for (const s of l.stations) {
      assert.ok(ESTACIONES[s], l.id + ': falta la estación ' + s);
      const c = l.map[s];
      assert.ok(Array.isArray(c) && (c.length === 2 || c.length === 3), l.id + '.' + s);
      assert.ok(c[0] >= 16 && c[0] <= 344 && c[1] >= 16, l.id + '.' + s + ' fuera del lienzo');
      if (c.length === 3) assert.ok(c[2] === 'l' || c[2] === 'r', l.id + '.' + s);
    }
  }
});

test('cada estación aparece en alguna línea', () => {
  const usadas = new Set(LINEAS.flatMap(l => l.stations));
  for (const id of ids) assert.ok(usadas.has(id), id);
});

test('una estación compartida tiene las mismas coordenadas en todas sus líneas', () => {
  const pos = {};
  for (const l of LINEAS) for (const s of l.stations) {
    const c = l.map[s], k = c[0] + ',' + c[1] + ',' + (c[2] || 'r');
    if (s in pos) assert.equal(k, pos[s], s + ' en ' + l.id); else pos[s] = k;
  }
});

test('dos estaciones distintas quedan al menos a 28 px', () => {
  const pos = {};
  for (const l of LINEAS) for (const s of l.stations) pos[s] = l.map[s];
  const ks = Object.keys(pos);
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
    const a = pos[ks[i]], b = pos[ks[j]];
    assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) >= 28, ks[i] + ' y ' + ks[j]);
  }
});

test('términos técnicos en el glosario', () => {
  ['sql', 'api', 'git', 'linux', 'terminal', 'log', 'json'].forEach(k => assert.ok(GLOSS.some(g => g[1] === k), k));
});

test('el glosario no repite claves', () => {
  const keys = GLOSS.map(g => g[1]);
  assert.equal(new Set(keys).size, keys.length);
  GLOSS.forEach(g => assert.equal(g[1], g[1].toLowerCase(), g[0]));
});

test('glossHits: la clave cuenta solo como palabra completa', () => {
  const hit = (t, k) => glossHits([t], GLOSS).some(g => g[1] === k);
  assert.ok(!hit('un candado digital', 'git'));
  assert.ok(hit('git push', 'git'));
  assert.ok(!hit('el catálogo de comercios', 'log'));
  assert.ok(!hit('logran entrar al sistema', 'log'));
  assert.ok(hit('revisa los logs del servidor', 'log'));
  assert.ok(hit('las APIs del banco', 'api'));
  assert.ok(!hit('una hoja excelente', 'excel'));
  assert.ok(hit('COUNT(*) cuenta filas', 'count('));
  assert.ok(hit('BUSCARX devuelve #N/D', '#n/d'));
  assert.ok(hit('usa CONTAR.SI.CONJUNTO', 'contar.si'));
  const g = [['Uno', 'a.b', 'x'], ['Dos', 'c+d', 'y']];
  assert.deepEqual(glossHits(['axb y c+d'], g).map(x => x[0]), ['Dos']);
});

test('cada estación tiene en el glosario sus términos de la Tarea 5', () => {
  const need = {
    git: ['git', 'commit', 'branch', 'pull request'], datos: ['llave primaria', 'llave foránea', 'null'],
    sql: ['select', 'join', 'group by', 'having', 'distinct'], apis: ['endpoint', 'métodos http', 'código de estado', 'json'],
    'pruebas-auto': ['prueba unitaria', 'pytest', 'mock', 'regresión'], hojas: ['buscarx', 'contar.si', 'sumar.si', 'tabla dinámica', 'función espacios'],
    tableros: ['power query', 'segmentación', 'visual de tarjeta'], indicadores: ['rotación', 'ausentismo', 'plantilla'],
    'casos-prueba': ['partición de equivalencia', 'valores límite'], defectos: ['severidad', 'log'],
    linux: ['linux', 'terminal', 'grep', 'systemctl', 'df -h', 'free -h', 'comando top'], nube: ['ec2', 'de iam', 'rds', 'aws cli', 'región de aws'],
    monitoreo: ['cloudwatch', 'métrica', 'saturación', 'sre']
  };
  for (const id of Object.keys(need)) {
    if (!ESTACIONES[id]) continue;
    const keys = glossHits([JSON.stringify(ESTACIONES[id])], GLOSS).map(g => g[1]);
    need[id].forEach(k => assert.ok(keys.includes(k), id + ': ' + k));
  }
});
