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

// --- Sincronización remota ---
const { syncRemote, deleteRemote } = require('../js/store.js');

function sbFalso(remote, opts) {
  const calls = { upsert: [], select: 0, del: 0 };
  const o = opts || {};
  return {
    calls,
    from: () => ({
      select: () => ({ eq: () => { calls.select++; return o.failSelect ? Promise.reject(new Error('sin red')) : Promise.resolve({ data: remote === undefined ? [] : [{ state: remote }], error: null }); } }),
      upsert: (obj, opt) => { calls.upsert.push([obj, opt]); return Promise.resolve({ data: null, error: o.upsertError ? { message: 'rls' } : null }); },
      delete: () => ({ eq: () => { calls.del++; return Promise.resolve({ data: null, error: o.delError ? { message: 'sin permiso' } : null }); } })
    })
  };
}
const localSt = () => recordAnswer(emptyState(), 'git.0', true, '2026-11-10');

test('sin fila remota: sube el estado local', async () => {
  const sb = sbFalso(undefined);
  const local = localSt();
  const r = await syncRemote(sb, 'u1', local);
  assert.equal(r.error, null);
  assert.equal(sb.calls.upsert.length, 1);
  assert.equal(sb.calls.upsert[0][0].user_id, 'u1');
  assert.deepEqual(sb.calls.upsert[0][1], { onConflict: 'user_id' });
  assert.deepEqual(r.state, local);
});
test('con fila remota: combina y sube la combinación', async () => {
  const remote = recordAnswer(emptyState(), 'sql.0', true, '2026-11-09');
  const sb = sbFalso(remote);
  const r = await syncRemote(sb, 'u1', localSt());
  assert.equal(r.error, null);
  assert.equal(sb.calls.upsert.length, 1);
  assert.ok(r.state.items['git.0'] && r.state.items['sql.0']);
  assert.deepEqual(sb.calls.upsert[0][0].state, r.state);
});
test('fila remota de otra versión: no escribe y avisa', async () => {
  const local = localSt();
  const sb = sbFalso({ v: 3 });
  const r = await syncRemote(sb, 'u1', local);
  assert.equal(r.error, 'estado-remoto-invalido');
  assert.equal(sb.calls.upsert.length, 0);
  assert.equal(r.state, local);
});
test('falla de red: devuelve el estado local y el error, sin lanzar', async () => {
  const local = localSt();
  const r = await syncRemote(sbFalso(undefined, { failSelect: true }), 'u1', local);
  assert.equal(r.error, 'sin red');
  assert.equal(r.state, local);
});
test('falla del upsert: devuelve el error', async () => {
  const local = localSt();
  const r = await syncRemote(sbFalso(undefined, { upsertError: true }), 'u1', local);
  assert.equal(r.error, 'rls');
  assert.equal(r.state, local);
});
test('deleteRemote: ok y con error, sin lanzar', async () => {
  const a = sbFalso(undefined);
  assert.deepEqual(await deleteRemote(a, 'u1'), { error: null });
  assert.equal(a.calls.del, 1);
  assert.deepEqual(await deleteRemote(sbFalso(undefined, { delError: true }), 'u1'), { error: 'sin permiso' });
});
