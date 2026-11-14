// Utilidades de interfaz: el, elNS (SVG), screens, show y withDir (con la barra inferior, el título y las transiciones), showNotice, glossHits, glossFor, extLink, fmtDate, fmtDay y navBack.
function el(tag, attrs) {
  var n = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    if (k === 'class') n.className = attrs[k];
    else if (k === 'text') n.textContent = attrs[k];
    else n.setAttribute(k, attrs[k]);
  });
  for (var i = 2; i < arguments.length; i++) {
    var c = arguments[i];
    if (c == null) continue;
    n.append(c.nodeType ? c : document.createTextNode(c));
  }
  return n;
}

// Igual que el(), pero crea elementos SVG (sin innerHTML: el texto va con textContent).
var SVG_NS = 'http://www.w3.org/2000/svg';
function elNS(tag, attrs) {
  var n = document.createElementNS(SVG_NS, tag);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    if (k === 'text') n.textContent = attrs[k];
    else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  });
  for (var i = 2; i < arguments.length; i++) if (arguments[i] != null) n.append(arguments[i]);
  return n;
}

// Pantallas: cada <section id="s-…"> de <main>, con la clave sin el prefijo («s-hoy» → «hoy»).
var screens = {};
if (typeof document !== 'undefined') {
  Array.prototype.forEach.call(document.querySelectorAll('main > section[id^="s-"]'), function (s) { screens[s.id.slice(2)] = s; });
}
var currentScreen = null;
// Pestaña que se marca en cada pantalla y pantallas sin barra inferior.
var TAB_OF = { hoy: 'hoy', mapa: 'mapa', linea: 'mapa', estacion: 'mapa', descubre: 'descubre', quiz: 'descubre', result: 'descubre', yo: 'yo', history: 'yo', admin: 'yo' };
var NO_TABBAR = { sesion: true, quiz: true, pick: true, entrada: true };
// Título de la pestaña del navegador en cada pantalla: «<título> · Mapa de áreas». La entrada usa solo «Mapa de áreas».
var SCREEN_TITLE = { pick: 'Elige tu meta', hoy: 'Hoy', mapa: 'Mapa', linea: 'Línea', estacion: 'Estación', sesion: 'Sesión de estudio',
  descubre: 'Descubre', quiz: 'Cuestionario', result: 'Tu resultado', yo: 'Yo', history: 'Mis respuestas', admin: 'Vista docente' };
var tabNav = false; // true mientras se atiende un clic en la barra inferior (app.js)
// Dirección de la navegación en curso ('forward' | 'backward' | null), para show(). La pone withDir().
var navDir = null;
// Pantalla donde estuvo el último foco (null: fuera de las pantallas o aún sin foco) y una llave estable del control
// enfocado (focusKey), para devolverle el foco si un redibujo con keep lo reemplaza.
var lastFocusScreen = null;
var lastFocusKey = null;
if (typeof document !== 'undefined') document.addEventListener('focusin', function (e) {
  var sec = e.target && e.target.closest ? e.target.closest('main > section[id^="s-"]') : null;
  lastFocusScreen = sec ? sec.id.slice(2) : null;
  lastFocusKey = sec ? focusKey(e.target) : null;
});

// Llave de un control que sobrevive a un redibujo: su id; si no, su data-line (enlaces y filas de línea); si no, su
// etiqueta y su texto. Los títulos enfocados por programa (tabindex="-1") no cuentan.
function focusKey(n) {
  if (!n || !n.tagName || n.getAttribute('tabindex') === '-1') return null;
  if (n.id) return '#' + n.id;
  if (n.getAttribute('data-line')) return n.tagName + '|' + n.className + '|' + n.getAttribute('data-line');
  return n.tagName + '|' + n.textContent.trim();
}

// Control de la pantalla con esa llave (el primero), o null.
function findByFocusKey(screen, key) {
  if (!screen || !key) return null;
  var all = screen.querySelectorAll('button, a[href], summary, input, select, textarea, [tabindex="0"]');
  for (var i = 0; i < all.length; i++) if (focusKey(all[i]) === key && all[i].getClientRects().length) return all[i];
  return null;
}

// Foco al título principal de la pantalla (h1 o, si no hay, h2), sin mover la página.
function focusHeading(screen) {
  var h = screen && screen.querySelector('h1, h2');
  if (!h) return;
  h.setAttribute('tabindex', '-1');
  h.focus({ preventScroll: true });
}

// Ejecuta fn (que dibuja una pantalla y llama a show()) con una dirección de transición: 'forward' o 'backward'.
function withDir(dir, fn) {
  var prev = navDir;
  navDir = dir;
  try { fn(); } finally { navDir = prev; }
}

// Cambia de pantalla. keep: no regresa al inicio de la página (para volver a dibujar la misma pantalla).
// dir ('forward' | 'backward', o el de withDir): con View Transitions, el cambio se anima en esa dirección; sin dir,
// con keep o sin soporte, cambia al instante.
// Foco: si el cambio vino de la barra inferior, se queda en su botón; si no, pasa al título de la pantalla.
// Al redibujar (keep) solo se mueve si el elemento enfocado de esa pantalla desapareció.
function show(name, keep, dir) {
  var first = currentScreen === null;
  var fromTab = tabNav;
  currentScreen = name;
  var d = keep ? null : (dir || navDir);
  var update = function () {
    if (currentScreen !== name) return; // otra navegación posterior ya cambió la pantalla
    paintScreen(name, keep, first, fromTab);
  };
  if (!d || !document.startViewTransition) { update(); return; }
  try {
    document.startViewTransition({ update: update, types: [d] });
  } catch (e) {
    update(); // navegador con View Transitions pero sin la forma con objeto (types)
  }
}

// La parte de show() que cambia la página: visibilidad, barra inferior, título, scroll y foco.
function paintScreen(name, keep, first, fromTab) {
  Object.keys(screens).forEach(function (k) { screens[k].hidden = (k !== name); });
  var bar = document.getElementById('tabbar');
  if (bar) {
    bar.hidden = !!NO_TABBAR[name];
    document.body.classList.toggle('has-tabbar', !bar.hidden);
    document.documentElement.classList.toggle('has-tabbar', !bar.hidden); // scroll-padding-bottom (css/app.css), sin :has()
    Array.prototype.forEach.call(bar.querySelectorAll('button[data-tab]'), function (b) {
      if (b.getAttribute('data-tab') === TAB_OF[name]) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }
  document.title = SCREEN_TITLE[name] ? SCREEN_TITLE[name] + ' · Mapa de áreas' : 'Mapa de áreas';
  if (!keep) window.scrollTo(0, 0);
  // Al arrancar (sin interacción todavía) no se toma el foco.
  var lost = !document.activeElement || document.activeElement === document.body;
  if (keep) {
    // Redibujo de la misma pantalla (sesión, sincronización…): si el control enfocado se reemplazó, el foco vuelve a su
    // equivalente nuevo sin mover la página; si ya no existe, al título.
    if (!lost || lastFocusScreen !== name) return;
    var again = findByFocusKey(screens[name], lastFocusKey);
    if (again) again.focus({ preventScroll: true });
    else focusHeading(screens[name]);
  } else if (!first && (!fromTab || NO_TABBAR[name])) focusHeading(screens[name]);
}

// Aviso discreto: uno a la vez, se cierra solo a los 6 s o con su botón. #notices es role="status".
var noticeTimer = null;
function showNotice(text) {
  var box = document.getElementById('notices');
  if (!box) return;
  clearTimeout(noticeTimer);
  box.textContent = '';
  var close = el('button', { type: 'button', 'aria-label': 'Cerrar aviso', text: '\u2715' });
  var n = el('div', { class: 'notice' }, el('p', { text: text }), close);
  close.addEventListener('click', function () { clearTimeout(noticeTimer); n.remove(); });
  box.append(n);
  noticeTimer = setTimeout(function () { n.remove(); }, 6000);
}

// Entradas del glosario que aparecen en los textos. La clave cuenta solo como palabra completa:
// empieza donde empieza una palabra y termina donde termina, con plural opcional en s o es.
// Así «git» no aparece en «digital» ni «log» en «catálogo» o «lograr».
var GLOSS_WORD_CHARS = 'a-z0-9áéíóúüñ';
function glossHits(texts, gloss) {
  var blob = texts.join(' ').toLowerCase();
  return gloss.filter(function (g) {
    var key = g[1].replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    var re = new RegExp('(^|[^' + GLOSS_WORD_CHARS + '])' + key + '(?:s|es)?(?![' + GLOSS_WORD_CHARS + '])');
    return re.test(blob);
  });
}
function glossFor(texts, title, limit) {
  var hits = glossHits(texts, GLOSS);
  if (limit) hits = hits.slice(0, limit);
  if (!hits.length) return null;
  var dl = el('dl');
  hits.forEach(function (g) { dl.append(el('dt', { text: g[0] }), el('dd', { text: g[2] })); });
  return el('details', { class: 'gloss' }, el('summary', { text: title }), dl);
}

function fmtDate(iso) { return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }); }
function navBack() {
  var b = el('button', { class: 'linkbtn', type: 'button', text: '← Volver' });
  b.addEventListener('click', function () { withDir('backward', function () { renderYo(); }); });
  return el('div', { class: 'topnav' }, b);
}
function fmtDay(ymd) { return new Date(ymd + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); }
function extLink(href, text) { return el('a', { href: href, target: '_blank', rel: 'noopener', text: text }); }

if (typeof module !== 'undefined') module.exports = { glossHits: glossHits };
