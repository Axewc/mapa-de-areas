// Pruebas del guardado local (js/store.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { emptyState, recordAnswer } = require('../js/core.js');
const { STORE_KEY, safeStorage, loadLocal, saveLocal, clearLocal } = require('../js/store.js');

function fake(init, opts) {
  const m = new Map(Object.entries(init || {}));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { if (opts && opts.throws) throw new Error('cuota'); m.set(k, String(v)); },
    removeItem: k => { m.delete(k); }
  };
}

test('clave y safeStorage sin navegador', () => {
  assert.equal(STORE_KEY, 'mapa.v2');
  assert.equal(safeStorage(), null);
});
test('sin storage: estado vacío y aviso', () => {
  const r = loadLocal(null);
  assert.equal(r.warning, 'sin-almacenamiento');
  assert.deepEqual(r.state, emptyState());
});
test('sin nada guardado: vacío y sin aviso', () => {
  const r = loadLocal(fake({}));
  assert.equal(r.warning, null);
  assert.deepEqual(r.state, emptyState());
});
test('estado guardado inválido: vacío y aviso, sin borrarlo hasta guardar', () => {
  const st = fake({ 'mapa.v2': '{"v":3}' });
  assert.equal(loadLocal(st).warning, 'estado-invalido');
  assert.equal(st.getItem('mapa.v2'), '{"v":3}');
});
test('JSON roto se trata como inválido', () => {
  const st = fake({ 'mapa.v2': '{no' });
  const r = loadLocal(st);
  assert.equal(r.warning, 'estado-invalido');
  assert.equal(st.getItem('mapa.v2'), '{no');
});
test('guardar y cargar ida y vuelta', () => {
  const st = fake({});
  const s = recordAnswer(emptyState(), 'a.0', true, '2026-11-10', 1);
  const w = saveLocal(st, s);
  assert.equal(w.ok, true);
  const r = loadLocal(st);
  assert.equal(r.warning, null);
  assert.deepEqual(r.state, w.state);
  assert.ok(r.state.items['a.0']);
});
test('sin storage, guardar no hace nada', () => {
  const s = emptyState();
  const r = saveLocal(null, s);
  assert.equal(r.ok, false);
  assert.equal(r.state, s);
});
test('dos pestañas: guardar combina con lo que otra pestaña guardó después', () => {
  const st = fake({});
  const viejo = recordAnswer(emptyState(), 'a.0', true, '2026-11-10', 1);
  saveLocal(st, recordAnswer(emptyState(), 'a.1', true, '2026-11-10', 2));
  const r = saveLocal(st, viejo);
  assert.ok(r.state.items['a.0'] && r.state.items['a.1']);
  assert.ok(loadLocal(st).state.items['a.1']);
});
test('lo guardado inválido se sobrescribe al guardar', () => {
  const st = fake({ 'mapa.v2': '{"v":3}' });
  const s = recordAnswer(emptyState(), 'a.0', true, '2026-11-10', 1);
  const r = saveLocal(st, s);
  assert.equal(r.ok, true);
  assert.equal(loadLocal(st).warning, null);
});
test('si setItem lanza (cuota llena), ok es false y no lanza', () => {
  const st = fake({}, { throws: true });
  const s = recordAnswer(emptyState(), 'a.0', true, '2026-11-10', 1);
  const r = saveLocal(st, s);
  assert.equal(r.ok, false);
  assert.ok(r.state.items['a.0']);
});
test('clearLocal borra la clave y tolera null', () => {
  const st = fake({ 'mapa.v2': '{}' });
  clearLocal(st);
  assert.equal(st.getItem('mapa.v2'), null);
  clearLocal(null);
});
