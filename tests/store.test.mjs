// Pruebas del guardado local (js/store.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { emptyState, recordAnswer } = require('../js/core.js');
const { STORE_KEY, safeStorage, loadLocal, saveLocal, clearLocal, isWipeEvent } = require('../js/store.js');

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

test('el upsert manda el correo en minúsculas (la política de update lo exige igual al del token)', async () => {
  const sb = sbFalso(undefined);
  await syncRemote(sb, 'u1', localSt(), 'Ana@Test.MX');
  assert.equal(sb.calls.upsert[0][0].email, 'ana@test.mx');
  assert.equal(sb.calls.upsert[0][0].user_id, 'u1');
  // Sin correo en la sesión, no se manda el campo (lo llena el valor por defecto de la tabla).
  const sb2 = sbFalso(undefined);
  await syncRemote(sb2, 'u1', localSt());
  assert.equal('email' in sb2.calls.upsert[0][0], false);
});
test('guardar con un día null guardado antes no lanza y lo normaliza', () => {
  const st = fake({ 'mapa.v2': JSON.stringify({ v: 2, goal: null, goalT: 0, items: {}, days: { '2026-11-01': null, '2026-11-02': 5 } }) });
  const r = saveLocal(st, localSt());
  assert.equal(r.ok, true);
  assert.deepEqual({ ...r.state.days['2026-11-01'] }, { xp: 0, done: false });
  assert.ok(r.state.items['git.0']);
});

test('isWipeEvent: solo la eliminación de la clave o un clear() cuentan, según los datos del evento', () => {
  assert.equal(isWipeEvent({ key: 'mapa.v2', newValue: null, oldValue: '{}' }), true);
  assert.equal(isWipeEvent({ key: null, newValue: null }), true, 'clear()');
  assert.equal(isWipeEvent({ key: 'mapa.v2', newValue: '{"v":2}' }), false, 'otra pestaña guardó');
  assert.equal(isWipeEvent({ key: 'otra', newValue: null }), false);
  assert.equal(isWipeEvent(null), false);
});

// --- Intento del cuestionario y aviso (Tarea 1) ---
const { QUIZ_KEY, TIP_KEY, loadQuiz, saveQuiz, tipDismissed, dismissTip } = require('../js/store.js');

// Set sintético de 8 preguntas (SETS[3] aún no existe); solo importa cuántas opciones tiene cada una.
const opts = n => Array.from({ length: n }, () => ({ t: 'op', p: {} }));
const Q8 = { name: 'Prueba', qs: [3, 4, 2, 5, 2, 2, 2, 2].map((n, i) => ({ q: 'P' + i, opts: opts(n) })) };
const ANS = [0, 1, 0, 4, 1, 0, 1, 0];
const T = 1762905600000;

// Storage falso que lanza en el método indicado: opts.get / opts.set / opts.remove = true (siempre) o una llave.
function fakeQ(init, opts) {
  const m = new Map(Object.entries(init || {}));
  const o = opts || {};
  const boom = (which, k) => { if (o[which] === true || o[which] === k) throw new Error('SecurityError'); };
  return {
    getItem: k => { boom('get', k); return m.has(k) ? m.get(k) : null; },
    setItem: (k, v) => { boom('set', k); m.set(k, String(v)); },
    removeItem: k => { boom('remove', k); m.delete(k); },
    has: k => m.has(k)
  };
}

test('llaves del cuestionario', () => {
  assert.equal(QUIZ_KEY, 'mapa.quiz');
  assert.equal(TIP_KEY, 'mapa.quizTip');
});
test('saveQuiz y loadQuiz ida y vuelta', () => {
  const st = fakeQ({});
  const ans = ANS.slice();
  assert.equal(saveQuiz(st, ans, T), true);
  const esperado = { v: 3, t: T, answers: ANS };
  assert.deepEqual(JSON.parse(st.getItem('mapa.quiz')), esperado);
  assert.deepEqual(loadQuiz(st, Q8), esperado);
});
test('loadQuiz: null sin storage, sin nada guardado o si getItem lanza', () => {
  assert.equal(loadQuiz(null, Q8), null);
  assert.equal(loadQuiz(fakeQ({}), Q8), null);
  assert.equal(loadQuiz(fakeQ({ 'mapa.quiz': JSON.stringify({ v: 3, t: T, answers: ANS }) }, { get: true }), Q8), null);
});
test('loadQuiz: JSON roto u objeto inválido dan null sin borrar lo guardado', () => {
  const malos = [
    '{no',
    '"hola"',
    'null',
    JSON.stringify({ v: 2, t: T, answers: ANS }),
    JSON.stringify({ v: 3, t: T, answers: ANS.slice(0, 7) }),
    JSON.stringify({ v: 3, t: T, answers: [0, 1, 2, 4, 1, 0, 1, 0] }), // P2 solo tiene 2 opciones
    JSON.stringify({ v: 3, t: null, answers: ANS })
  ];
  for (const raw of malos) {
    const st = fakeQ({ 'mapa.quiz': raw });
    assert.equal(loadQuiz(st, Q8), null, raw);
    assert.equal(st.getItem('mapa.quiz'), raw);
  }
});
test('saveQuiz: false sin storage, si setItem lanza o si answers no es arreglo', () => {
  assert.equal(saveQuiz(null, ANS, T), false);
  const st = fakeQ({}, { set: true });
  assert.equal(saveQuiz(st, ANS, T), false);
  assert.equal(st.has('mapa.quiz'), false);
  assert.equal(saveQuiz(fakeQ({}), null, T), false);
});
test('claimQuizUpload y finishQuizUpload: marca up sin que loadQuiz lo rechace', () => {
  const { claimQuizUpload, finishQuizUpload, QUIZ_CLAIM_MS } = require('../js/store.js');
  const st = fakeQ({});
  saveQuiz(st, ANS, T);
  assert.equal(claimQuizUpload(st, T, T + 10, 'a'), true);
  assert.equal(JSON.parse(st.getItem('mapa.quiz')).c, T + 10);
  assert.deepEqual(loadQuiz(st, Q8), { v: 3, t: T, answers: ANS, c: T + 10, cid: 'a' }, 'el reclamo no invalida el intento');
  assert.equal(claimQuizUpload(st, T, T + 20, 'b'), false, 'otra pestaña no lo reclama mientras tanto');
  assert.equal(claimQuizUpload(st, T, T + 10 + QUIZ_CLAIM_MS, 'b'), true, 'un reclamo viejo se considera abandonado');
  assert.equal(claimQuizUpload(st, T, T, 'c'), true, 'un reclamo con el reloj al revés también');
  assert.equal(finishQuizUpload(st, T, false), true);
  assert.deepEqual(JSON.parse(st.getItem('mapa.quiz')), { v: 3, t: T, answers: ANS }, 'si falla, sin reclamo ni marca');
  assert.equal(claimQuizUpload(st, T, T + 30, 'd'), true);
  assert.equal(finishQuizUpload(st, T, true), true);
  assert.deepEqual(loadQuiz(st, Q8), { v: 3, t: T, answers: ANS, up: 1 });
  assert.equal(claimQuizUpload(st, T, T + 40, 'e'), false, 'ya subido');
});
test('claimQuizUpload y finishQuizUpload: otro intento, sin storage, roto o si setItem lanza', () => {
  const { claimQuizUpload, finishQuizUpload } = require('../js/store.js');
  const st = fakeQ({});
  saveQuiz(st, ANS, T);
  assert.equal(claimQuizUpload(st, T + 1, T), false, 'otro t');
  assert.equal(finishQuizUpload(st, T + 1, true), false);
  assert.deepEqual(JSON.parse(st.getItem('mapa.quiz')), { v: 3, t: T, answers: ANS });
  assert.equal(claimQuizUpload(null, T, T), false);
  assert.equal(finishQuizUpload(null, T, true), false);
  assert.equal(claimQuizUpload(fakeQ({ 'mapa.quiz': '{no' }), T, T), false);
  assert.equal(claimQuizUpload(fakeQ({ 'mapa.quiz': '[1]' }), T, T), false);
  assert.equal(claimQuizUpload(fakeQ({}), T, T), false, 'nada guardado');
  const lleno = fakeQ({ 'mapa.quiz': JSON.stringify({ v: 3, t: T, answers: ANS }) }, { set: true });
  assert.equal(claimQuizUpload(lleno, T, T), false);
  assert.equal(claimQuizUpload(fakeQ({ 'mapa.quiz': JSON.stringify({ v: 3, t: T, answers: ANS }) }, { get: true }), T, T), false);
});
test('marca de subida por cuenta (uid): subido para una cuenta sigue pendiente para otra', () => {
  const { claimQuizUpload, ownsQuizClaim, finishQuizUpload } = require('../js/store.js');
  const st = fakeQ({});
  saveQuiz(st, ANS, T);
  assert.equal(claimQuizUpload(st, T, T, 'a', 'ana'), true);
  assert.equal(finishQuizUpload(st, T, true, 'ana'), true);
  assert.deepEqual(loadQuiz(st, Q8), { v: 3, t: T, answers: ANS, up: 1, uid: 'ana' }, 'uid no invalida el intento');
  assert.equal(claimQuizUpload(st, T, T + 1, 'b', 'ana'), false, 'ya está en la cuenta de Ana');
  assert.equal(claimQuizUpload(st, T, T + 1, 'b', 'beto'), true, 'para Beto sigue pendiente');
  assert.equal(ownsQuizClaim(st, T, 'b', 'beto'), true);
  assert.equal(ownsQuizClaim(st, T, 'b', 'ana'), false, 'para Ana ya estaba subido');
  assert.equal(finishQuizUpload(st, T, true, 'beto'), true);
  assert.deepEqual(JSON.parse(st.getItem('mapa.quiz')), { v: 3, t: T, answers: ANS, up: 1, uid: 'beto' });
  assert.equal(claimQuizUpload(st, T, T + 2, 'c', 'beto'), false);
});
test('ownsQuizClaim: solo la ficha del último reclamo, del mismo intento y sin subir', () => {
  const { claimQuizUpload, ownsQuizClaim, finishQuizUpload, QUIZ_CLAIM_MS } = require('../js/store.js');
  const st = fakeQ({});
  saveQuiz(st, ANS, T);
  assert.equal(ownsQuizClaim(st, T, 'a'), false, 'sin reclamo');
  claimQuizUpload(st, T, T, 'a');
  assert.equal(ownsQuizClaim(st, T, 'a'), true);
  assert.equal(ownsQuizClaim(st, T, 'b'), false, 'otra ficha');
  assert.equal(ownsQuizClaim(st, T + 1, 'a'), false, 'otro intento');
  claimQuizUpload(st, T, T + QUIZ_CLAIM_MS, 'b'); // la otra pestaña lo reclamó después (el de a ya era viejo)
  assert.equal(ownsQuizClaim(st, T, 'a'), false, 'quien reclamó antes ya no lo sube');
  assert.equal(ownsQuizClaim(st, T, 'b'), true);
  finishQuizUpload(st, T, true);
  assert.equal(ownsQuizClaim(st, T, 'b'), false, 'ya subido');
  assert.equal(ownsQuizClaim(null, T, 'b'), false);
  assert.equal(ownsQuizClaim(fakeQ({ 'mapa.quiz': '{no' }), T, 'b'), false);
  assert.equal(ownsQuizClaim(fakeQ({ 'mapa.quiz': JSON.stringify({ v: 3, t: T, answers: ANS, c: T, cid: 'b' }) }, { get: true }), T, 'b'), false);
});
test('tipDismissed y dismissTip', () => {
  const st = fakeQ({});
  assert.equal(tipDismissed(st), false);
  dismissTip(st);
  assert.equal(st.getItem('mapa.quizTip'), '1');
  assert.equal(tipDismissed(st), true);
  assert.equal(tipDismissed(fakeQ({ 'mapa.quizTip': '0' })), false);
  assert.equal(tipDismissed(null), false);
  assert.equal(tipDismissed(fakeQ({ 'mapa.quizTip': '1' }, { get: true })), false);
  dismissTip(null);
  const lleno = fakeQ({}, { set: true });
  dismissTip(lleno);
  assert.equal(tipDismissed(lleno), false);
});
test('clearLocal borra progreso, intento y aviso, y deja lo demás', () => {
  const st = fakeQ({ 'mapa.v2': '{}', 'mapa.quiz': '{}', 'mapa.quizTip': '1', otra: 'x' });
  clearLocal(st);
  assert.equal(st.has('mapa.v2'), false);
  assert.equal(st.has('mapa.quiz'), false);
  assert.equal(st.has('mapa.quizTip'), false);
  assert.equal(st.getItem('otra'), 'x');
});
test('clearLocal: si removeItem lanza en una llave, borra las otras; si lanza siempre, no lanza', () => {
  const st = fakeQ({ 'mapa.v2': '{}', 'mapa.quiz': '{}', 'mapa.quizTip': '1' }, { remove: 'mapa.v2' });
  clearLocal(st);
  assert.equal(st.has('mapa.v2'), true);
  assert.equal(st.has('mapa.quiz'), false);
  assert.equal(st.has('mapa.quizTip'), false);
  clearLocal(fakeQ({ 'mapa.quiz': '{}' }, { remove: true }));
});
test('clearLocal borra el resultado y el aviso antes que el progreso', () => {
  const llamadas = [];
  clearLocal({ removeItem: k => { llamadas.push(k); } });
  assert.deepEqual(llamadas, ['mapa.quiz', 'mapa.quizTip', 'mapa.v2']);
});
test('saveQuiz: no escribe si answers no es arreglo o now no es número finito', () => {
  const st = fakeQ({});
  assert.equal(saveQuiz(st, 'abc', 1), false);
  assert.equal(st.has('mapa.quiz'), false);
  assert.equal(saveQuiz(st, [0, 1], NaN), false);
  assert.equal(saveQuiz(st, [0, 1], Infinity), false);
  assert.equal(saveQuiz(st, [0, 1], '1'), false);
  assert.equal(st.has('mapa.quiz'), false);
});
test('isWipeEvent no cambia: borrar el intento o el aviso no es borrar el progreso', () => {
  assert.equal(isWipeEvent({ key: 'mapa.quiz', newValue: null }), false);
  assert.equal(isWipeEvent({ key: 'mapa.quizTip', newValue: null }), false);
  assert.equal(isWipeEvent({ key: 'mapa.v2', newValue: null }), true);
  assert.equal(isWipeEvent({ key: null, newValue: null }), true);
});
