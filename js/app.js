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

// Con sesión: combina con la fila remota y guarda en los dos lados. Nunca rechaza.
function syncNow() {
  if (!session) return Promise.resolve(state);
  return syncRemote(sb, session.user.id, state).then(function (r) {
    if (r.error) {
      showNotice('No se pudo sincronizar. Tu progreso sigue en este dispositivo.');
      return state;
    }
    return commit(r.state);
  });
}

// Vuelve a dibujar la pantalla actual sin moverla (tras sincronizar o cambiar la sesión).
function refreshScreen() {
  if (currentScreen === 'hoy') renderHoy(true);
  else if (currentScreen === 'yo') renderYo(true);
  else if (currentScreen === 'pick') renderPick(true);
  else if (currentScreen === 'mapa') renderMapa(true);
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
Array.prototype.forEach.call(document.querySelectorAll('#tabbar button[data-tab]'), function (b) {
  b.addEventListener('click', function () {
    var t = b.getAttribute('data-tab');
    if (t === 'hoy') renderHoy();
    else if (t === 'mapa') renderMapa();
    else renderYo();
  });
});

// Pantalla inicial: sin meta válida se pide elegirla.
if (bootLoad.warning === 'sin-almacenamiento') showNotice('Este navegador no deja guardar progreso. Funciona, pero no se conservará al cerrar.');
else if (bootLoad.warning === 'estado-invalido') showNotice('Tu progreso guardado no se pudo leer, así que empezamos de cero.');
if (lineById(state.goal)) renderHoy(); else renderPick();

sb.auth.getSession().then(function (r) {
  session = r.data.session;
  checkAdmin();
  if (session) syncNow().then(refreshScreen);
  else refreshScreen();
});
sb.auth.onAuthStateChange(function (ev, s) {
  session = s;
  if (ev === 'SIGNED_IN') {
    if (window.location.hash.indexOf('access_token') !== -1) history.replaceState(null, '', window.location.pathname);
    checkAdmin();
    refreshScreen();
    syncNow().then(refreshScreen);
  } else if (ev === 'SIGNED_OUT') {
    isAdmin = false;
    refreshScreen();
  }
});
