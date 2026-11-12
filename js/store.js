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

// ¿Este evento `storage` (de otra pestaña) borró el progreso? Se decide con los datos del evento, no volviendo a leer:
// si la otra pestaña guarda otra vez enseguida, releer ya no vería el borrado.
function isWipeEvent(e) {
  return !!e && (e.key === null || (e.key === STORE_KEY && e.newValue === null));
}

function storeMsg(e) {
  return (e && e.message) ? String(e.message) : String(e || 'error');
}

// Sincroniza con Supabase. Nunca lanza: -> Promise<{ state, error: null | string }>
// `email` (el de la sesión) viaja en el upsert, en minúsculas: la política de update exige que la fila lleve el correo
// del token, y sin él un cambio de correo dejaría de poder sincronizar.
function syncRemote(sb, userId, state, email) {
  var fail = function (e) { return { state: state, error: storeMsg(e) }; };
  try {
    return Promise.resolve(sb.from('mapa_progreso').select('state').eq('user_id', userId)).then(function (res) {
      if (res && res.error) return fail(res.error);
      var rows = (res && res.data) || [];
      var merged = state;
      if (rows.length) {
        var remote = rows[0].state;
        if (!storeCore.validState(remote)) return { state: state, error: 'estado-remoto-invalido' };
        merged = storeCore.mergeState(state, remote);
      }
      var row = { user_id: userId, state: merged };
      if (typeof email === 'string' && email) row.email = email.toLowerCase();
      return Promise.resolve(sb.from('mapa_progreso').upsert(row, { onConflict: 'user_id' })).then(function (up) {
        if (up && up.error) return fail(up.error);
        return { state: merged, error: null };
      });
    }).then(null, fail);
  } catch (e) {
    return Promise.resolve(fail(e));
  }
}

// Borra la fila remota. Nunca lanza: -> Promise<{ error: null | string }>
function deleteRemote(sb, userId) {
  var fail = function (e) { return { error: storeMsg(e) }; };
  try {
    return Promise.resolve(sb.from('mapa_progreso').delete().eq('user_id', userId)).then(function (res) {
      return (res && res.error) ? fail(res.error) : { error: null };
    }).then(null, fail);
  } catch (e) {
    return Promise.resolve(fail(e));
  }
}

if (typeof module !== 'undefined') module.exports = { STORE_KEY: STORE_KEY, safeStorage: safeStorage, loadLocal: loadLocal, saveLocal: saveLocal, clearLocal: clearLocal, isWipeEvent: isWipeEvent, syncRemote: syncRemote, deleteRemote: deleteRemote };
