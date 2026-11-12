// Utilidades de interfaz: el, elNS (SVG), screens, show (con la barra inferior), showNotice, glossHits, glossFor, hasOwn, extLink, fmtDate, fmtDay y navBack.
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
var TAB_OF = { hoy: 'hoy', mapa: 'mapa', linea: 'mapa', estacion: 'mapa', yo: 'yo', intro: 'yo', result: 'yo', history: 'yo', admin: 'yo' };
var NO_TABBAR = { sesion: true, quiz: true, pick: true };
var tabNav = false; // true mientras se atiende un clic en la barra inferior (app.js)
// Pantalla donde estuvo el último foco (null: fuera de las pantallas o aún sin foco).
var lastFocusScreen = null;
if (typeof document !== 'undefined') document.addEventListener('focusin', function (e) {
  var sec = e.target && e.target.closest ? e.target.closest('main > section[id^="s-"]') : null;
  lastFocusScreen = sec ? sec.id.slice(2) : null;
});

// Foco al título principal de la pantalla (h1 o, si no hay, h2), sin mover la página.
function focusHeading(screen) {
  var h = screen && screen.querySelector('h1, h2');
  if (!h) return;
  h.setAttribute('tabindex', '-1');
  h.focus({ preventScroll: true });
}

// keep: no regresa al inicio de la página (para volver a dibujar la misma pantalla).
// Foco: si el cambio vino de la barra inferior, se queda en su botón; si no, pasa al título de la pantalla.
// Al redibujar (keep) solo se mueve si el elemento enfocado de esa pantalla desapareció.
function show(name, keep) {
  var first = currentScreen === null;
  Object.keys(screens).forEach(function (k) { screens[k].hidden = (k !== name); });
  currentScreen = name;
  var bar = document.getElementById('tabbar');
  if (bar) {
    bar.hidden = !!NO_TABBAR[name];
    document.body.classList.toggle('has-tabbar', !bar.hidden);
    Array.prototype.forEach.call(bar.querySelectorAll('button[data-tab]'), function (b) {
      if (b.getAttribute('data-tab') === TAB_OF[name]) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }
  if (!keep) window.scrollTo(0, 0);
  // Al arrancar (sin interacción todavía) no se toma el foco.
  var lost = !document.activeElement || document.activeElement === document.body;
  if (keep ? (lost && lastFocusScreen === name) : (!first && !tabNav)) focusHeading(screens[name]);
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
  b.addEventListener('click', function () { renderYo(); });
  return el('div', { class: 'topnav' }, b);
}
function fmtDay(ymd) { return new Date(ymd + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); }
function hasOwn(obj, key) { return obj != null && Object.prototype.hasOwnProperty.call(obj, key); }
function extLink(href, text) { return el('a', { href: href, target: '_blank', rel: 'noopener', text: text }); }

if (typeof module !== 'undefined') module.exports = { glossHits: glossHits };
