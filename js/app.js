// Arranque: cliente de Supabase, sesión, autenticación y pantalla de inicio.
var SUPABASE_URL = 'https://vhdrnrzerjysjzpyzgif.supabase.co';
var SUPABASE_KEY = 'sb_publishable_D6zlOACzmjEzb2_CdqupZQ_Vyj1ZbQz';
var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }
});
var session = null;
var isAdmin = false;

var loginForm = document.getElementById('login');
var homeBox = document.getElementById('home');
var authMsg = document.getElementById('auth-msg');
var who = document.getElementById('who');
var toAdmin = document.getElementById('to-admin');

var modesBox = document.getElementById('modes');
var chosen = 2;
function drawModes() {
  modesBox.textContent = '';
  [[2, 'Explorar', 'Preguntas sobre lo que te gusta hacer, sin nombres de herramientas. Ideal si apenas estás decidiendo.', 'Recomendada si estás empezando'],
   [1, 'Con herramientas', 'Incluye cosas como Python, Docker o Power BI, con una explicación junto a cada pregunta. Mejor si ya programaste bastante.', null]].forEach(function (m) {
    var b = el('button', { class: 'mode', type: 'button', 'aria-pressed': chosen === m[0] ? 'true' : 'false' },
      m[3] ? el('span', { class: 'tag', text: m[3] }) : null, el('b', { text: m[1] }), el('span', { text: m[2] }));
    b.addEventListener('click', function () { chosen = m[0]; drawModes(); });
    modesBox.append(b);
  });
}
drawModes();

function updateHome() {
  var logged = !!session;
  loginForm.hidden = logged;
  homeBox.hidden = !logged;
  if (logged) {
    who.textContent = 'Sesión: ' + session.user.email;
    sb.from('mapa_admins').select('email').limit(1).then(function (r) {
      isAdmin = !r.error && r.data && r.data.length > 0;
      toAdmin.hidden = !isAdmin;
    });
  } else {
    isAdmin = false;
    toAdmin.hidden = true;
  }
}

sb.auth.getSession().then(function (r) { session = r.data.session; updateHome(); });
sb.auth.onAuthStateChange(function (ev, s) {
  session = s;
  updateHome();
  if (ev === 'SIGNED_IN' && window.location.hash.indexOf('access_token') !== -1) {
    history.replaceState(null, '', window.location.pathname);
  }
});

loginForm.addEventListener('submit', function (e) {
  e.preventDefault();
  var email = document.getElementById('email').value.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) { authMsg.textContent = 'Escribe un correo válido.'; return; }
  var btn = document.getElementById('send-link');
  btn.disabled = true;
  authMsg.textContent = 'Enviando…';
  sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: window.location.origin + window.location.pathname } }).then(function (r) {
    btn.disabled = false;
    authMsg.textContent = r.error
      ? 'No se pudo enviar el enlace: ' + r.error.message
      : 'Listo. Revisa tu correo, incluida la carpeta de spam, y abre el enlace. Funciona desde cualquier dispositivo.';
  });
});

document.getElementById('logout').addEventListener('click', function () { sb.auth.signOut().then(function () { answers = []; show('intro'); }); });
document.getElementById('to-history').addEventListener('click', renderHistory);
toAdmin.addEventListener('click', renderAdmin);
