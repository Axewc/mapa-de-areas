// Guardado local del progreso (localStorage). ES5, script clásico.
var STORE_KEY = 'mapa.v2';

var storeCore = (typeof module !== 'undefined' && typeof require === 'function')
  ? require('./core.js')
  : { emptyState: emptyState, validState: validState, mergeState: mergeState };

function safeStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    var s = window.localStorage;
    s.setItem('mapa.test', '1');
    s.removeItem('mapa.test');
    return s;
  } catch (e) {
    return null;
  }
}

function storeRead(storage) {
  // -> { found: bool, state: estado válido | null }
  var raw;
  try { raw = storage.getItem(STORE_KEY); } catch (e) { return { found: false, state: null }; }
  if (raw === null || raw === undefined) return { found: false, state: null };
  try {
    var parsed = JSON.parse(raw);
    return { found: true, state: storeCore.validState(parsed) ? parsed : null };
  } catch (e) {
    return { found: true, state: null };
  }
}

function loadLocal(storage) {
  if (!storage) return { state: storeCore.emptyState(), warning: 'sin-almacenamiento' };
  var r = storeRead(storage);
  if (!r.found) return { state: storeCore.emptyState(), warning: null };
  if (!r.state) return { state: storeCore.emptyState(), warning: 'estado-invalido' };
  return { state: r.state, warning: null };
}

function saveLocal(storage, state) {
  if (!storage) return { state: state, ok: false };
  var stored = storeRead(storage).state;
  var merged = stored ? storeCore.mergeState(state, stored) : state;
  try {
    storage.setItem(STORE_KEY, JSON.stringify(merged));
    return { state: merged, ok: true };
  } catch (e) {
    return { state: merged, ok: false };
  }
}

function clearLocal(storage) {
  if (!storage) return;
  try { storage.removeItem(STORE_KEY); } catch (e) { /* sin acción */ }
}

if (typeof module !== 'undefined') module.exports = { STORE_KEY: STORE_KEY, safeStorage: safeStorage, loadLocal: loadLocal, saveLocal: saveLocal, clearLocal: clearLocal };
