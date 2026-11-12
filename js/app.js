// Arranque: cliente de Supabase, sesión, estado global, sincronización y pantalla inicial.
var SUPABASE_URL = 'https://vhdrnrzerjysjzpyzgif.supabase.co';
var SUPABASE_KEY = 'sb_publishable_D6zlOACzmjEzb2_CdqupZQ_Vyj1ZbQz';
var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }
});
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

// Con sesión: combina con la fila remota y guarda en los dos lados. Nunca rechaza.
// Resuelve con el estado nuevo, o con null si se descartó o no empezó porque los datos se están borrando.
function syncNow() {
  if (deleting) return Promise.resolve(null);
  if (!session) return Promise.resolve(state);
  var epoch = dataEpoch;
  var p = syncRemote(sb, session.user.id, state).then(function (r) {
    pendingSyncs = pendingSyncs.filter(function (x) { return x !== p; });
    if (epoch !== dataEpoch) return null;
    if (r.error) {
      showNotice('No se pudo sincronizar. Tu progreso sigue en este dispositivo.');
      return state;
    }
    return commit(r.state);
  });
  pendingSyncs.push(p);
  return p;
}

// Para borrar: invalida las sincronizaciones en curso y espera a que terminen (sin usar su resultado),
// así su upsert no vuelve a crear la fila remota después del borrado.
function invalidateData() {
  dataEpoch++;
  return Promise.all(pendingSyncs).then(function () {});
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
