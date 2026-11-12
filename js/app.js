// Arranque: cliente de Supabase, sesión, estado global, sincronización y pantalla inicial.
var SUPABASE_URL = 'https://vhdrnrzerjysjzpyzgif.supabase.co';
var SUPABASE_KEY = 'sb_publishable_D6zlOACzmjEzb2_CdqupZQ_Vyj1ZbQz';
// El cliente real existe solo si la biblioteca de Supabase ya cargó (viene de un CDN, con `async`: no bloquea la página).
function realClient() {
  if (!window.supabase || !window.supabase.createClient) return null;
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }
  });
}
// Mientras no carga (o si el CDN está bloqueado) se usa este cliente sin conexión: nunca hay sesión y toda consulta
// responde con error, así que el estudio sin cuenta funciona igual y las pantallas de cuenta avisan del fallo.
function offlineClient() {
  var err = { message: 'no hay conexión con el servicio de cuentas. Intenta más tarde' };
  function Q() {}
  ['select', 'insert', 'upsert', 'update', 'delete', 'eq', 'order', 'limit'].forEach(function (m) { Q.prototype[m] = function () { return this; }; });
  Q.prototype.then = function (res, rej) { return Promise.resolve({ data: null, error: err }).then(res, rej); };
  return {
    auth: {
      getSession: function () { return Promise.resolve({ data: { session: null }, error: null }); },
      onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; },
      signOut: function () { return Promise.resolve({ error: err }); },
      signInWithOtp: function () { return Promise.resolve({ error: err }); }
    },
    from: function () { return new Q(); }
  };
}
var sb = realClient();
var sbReady = !!sb;
if (!sb) sb = offlineClient();
var session = null;
var isAdmin = false;

// Estado de estudio: se lee una vez del dispositivo y se guarda con commit().
var storage = safeStorage();
var bootLoad = loadLocal(storage);
var state = bootLoad.state;
var saveWarned = false;

// Guarda en el dispositivo (combinando con lo guardado) y adopta el resultado.
function commit(nuevo) {
  var r = saveLocal(storage, nuevo);
  state = r.state;
  // Sin almacenamiento ya se avisó al arrancar; aquí solo se avisa una vez si falla la escritura.
  if (!r.ok && storage && !saveWarned) {
    saveWarned = true;
    showNotice('No se pudo guardar en este dispositivo.');
  }
  return state;
}

// Época de los datos: «Borrar mis datos» la incrementa y una sincronización que empezó antes
// descarta su resultado (no guarda ni redibuja), para no devolver el progreso borrado.
var dataEpoch = 0;
var pendingSyncs = [];

// true mientras corre «Borrar mis datos»: no empieza ninguna sincronización nueva.
var deleting = false;

// Una sincronización con sesión: combina con la fila remota y guarda en los dos lados. Nunca rechaza.
// Resuelve { ok, discarded }: discarded si no empezó porque los datos se están borrando o si «Borrar mis datos»
// la invalidó; ok es false si falló. Sin sesión no hay nada que subir: ok.
function runSync() {
  if (deleting) return Promise.resolve({ ok: false, discarded: true });
  if (!session) return Promise.resolve({ ok: true, discarded: false });
  var epoch = dataEpoch;
  var p = syncRemote(sb, session.user.id, state, session.user.email).then(function (r) {
    pendingSyncs = pendingSyncs.filter(function (x) { return x !== p; });
    if (epoch !== dataEpoch) return { ok: false, discarded: true };
    if (r.error) return { ok: false, discarded: false };
    // Se combina otra vez con el estado actual: lo respondido durante la sincronización no se pierde aunque no haya localStorage.
    commit(mergeState(r.state, state));
    return { ok: true, discarded: false };
  });
  pendingSyncs.push(p);
  return p;
}

// Con aviso si falla. Resuelve con el estado nuevo, o con null si se descartó o no empezó porque los datos se están borrando.
function syncNow() {
  return runSync().then(function (r) {
    if (r.discarded) return null;
    if (!r.ok) showNotice('No se pudo sincronizar. Tu progreso sigue en este dispositivo.');
    return state;
  });
}

// Espera a que terminen las sincronizaciones en curso, con tope (INVALIDATE_WAIT_MS) para que una red colgada no deje
// trabado el borrado ni el cierre de sesión. Resuelve { timedOut, settled }: settled es la espera completa, por si hace falta
// repetir algo cuando las sincronizaciones tardías terminen.
var INVALIDATE_WAIT_MS = 8000;
function settlePending() {
  var settled = Promise.all(pendingSyncs).then(function () { return false; });
  var limit = new Promise(function (resolve) { setTimeout(function () { resolve(true); }, INVALIDATE_WAIT_MS); });
  return Promise.race([settled, limit]).then(function (timedOut) { return { timedOut: timedOut, settled: settled }; });
}

// Para borrar o cerrar sesión: invalida las sincronizaciones en curso y espera a que terminen (sin usar su resultado),
// así su upsert no vuelve a crear la fila remota después del borrado.
function invalidateData() {
  dataEpoch++;
  return settlePending();
}

// Sincroniza y redibuja. Si en la primera visita (sin meta) llega una meta de la nube, entra a Hoy.
function syncAndRefresh() {
  var hadGoal = !!lineById(state.goal);
  return syncNow().then(function (r) {
    if (r === null) return;
    if (!hadGoal && currentScreen === 'pick' && lineById(state.goal)) renderHoy();
    else refreshScreen();
  });
}

// Vuelve a dibujar la pantalla actual sin moverla (tras sincronizar o cambiar la sesión).
function refreshScreen() {
  if (currentScreen === 'hoy') renderHoy(true);
  else if (currentScreen === 'yo') renderYo(true);
  else if (currentScreen === 'pick') renderPick(true);
  else if (currentScreen === 'mapa') renderMapa(true);
  else if (currentScreen === 'linea' && lineaShown) openLinea(lineaShown, true);
  else if (currentScreen === 'estacion' && estShown) openEstacion(estShown, null, true);
}

function checkAdmin() {
  if (!session) { isAdmin = false; return; }
  sb.from('mapa_admins').select('email').limit(1).then(function (r) {
    var was = isAdmin;
    isAdmin = !r.error && !!r.data && r.data.length > 0;
    if (was !== isAdmin) refreshScreen();
  });
}

// Barra inferior
// Al cambiar de pestaña con la barra, el foco se queda en el botón de la pestaña (ver show()).
Array.prototype.forEach.call(document.querySelectorAll('#tabbar button[data-tab]'), function (b) {
  b.addEventListener('click', function () {
    var t = b.getAttribute('data-tab');
    tabNav = true;
    try {
      if (t === 'hoy') renderHoy();
      else if (t === 'mapa') renderMapa();
      else renderYo();
    } finally { tabNav = false; }
  });
});

// Al volver a la pestaña del navegador otro día, Hoy y Yo se redibujan con la fecha nueva.
// Nunca durante una sesión de estudio ni el cuestionario.
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState !== 'visible') return;
  if ((currentScreen === 'hoy' || currentScreen === 'yo') && renderedDay !== todayYmd()) refreshScreen();
});

// Pantalla inicial: sin meta válida se pide elegirla.
if (bootLoad.warning === 'sin-almacenamiento') showNotice('Este navegador no deja guardar progreso. Funciona, pero no se conservará al cerrar.');
else if (bootLoad.warning === 'estado-invalido') showNotice('Tu progreso guardado no se pudo leer, así que empezamos de cero.');
if (lineById(state.goal)) renderHoy(); else renderPick();

// Sesión: se consulta cuando el cliente real está listo. Si la biblioteca llega después, se conecta entonces.
function bootAuth() {
  sb.auth.getSession().then(function (r) {
    session = r.data.session;
    checkAdmin();
    if (session) syncAndRefresh();
    else refreshScreen();
  });
  sb.auth.onAuthStateChange(function (ev, s) {
    session = s;
    if (ev === 'SIGNED_IN') {
      if (window.location.hash.indexOf('access_token') !== -1) history.replaceState(null, '', window.location.pathname);
      checkAdmin();
      refreshScreen();
      syncAndRefresh();
    } else if (ev === 'SIGNED_OUT') {
      isAdmin = false;
      refreshScreen();
    }
  });
}
if (sbReady) bootAuth();
else {
  var sbLib = document.getElementById('sb-lib');
  if (sbLib) sbLib.addEventListener('load', function () {
    var c = realClient();
    if (!c || sbReady) return;
    sb = c;
    sbReady = true;
    bootAuth();
  });
}

// «Borrar mis datos» (o limpiar los datos del sitio) en otra pestaña de este navegador: esta pestaña adopta el estado vacío
// y se redibuja, sin volver a escribir lo que ya no está. Si tenía una sesión de estudio abierta, se cierra.
window.addEventListener('storage', function (e) {
  if (!storage || deleting) return;
  if (e.storageArea && e.storageArea !== storage) return;
  if (!isWipeEvent(e)) return;
  dataEpoch++; // una sincronización en curso no devuelve el progreso borrado
  state = emptyState();
  sesRun = null;
  if (['intro', 'quiz', 'result', 'history', 'admin'].indexOf(currentScreen) === -1) renderPick();
  showNotice('Se borró tu progreso de este dispositivo desde otra pestaña.');
});
