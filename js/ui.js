// Utilidades de interfaz: el, screens, show (con la barra inferior), showNotice, glossHits, glossFor, hasOwn, extLink, fmtDate, fmtDay y navBack.
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

// Pantallas: cada <section id="s-…"> de <main>, con la clave sin el prefijo («s-hoy» → «hoy»).
var screens = {};
if (typeof document !== 'undefined') {
  Array.prototype.forEach.call(document.querySelectorAll('main > section[id^="s-"]'), function (s) { screens[s.id.slice(2)] = s; });
}
var currentScreen = null;
// Pestaña que se marca en cada pantalla y pantallas sin barra inferior.
var TAB_OF = { hoy: 'hoy', mapa: 'mapa', linea: 'mapa', estacion: 'mapa', yo: 'yo', intro: 'yo', result: 'yo', history: 'yo', admin: 'yo', learn: 'yo' };
var NO_TABBAR = { sesion: true, quiz: true, pick: true };
// keep: no regresa al inicio de la página (para volver a dibujar la misma pantalla).
function show(name, keep) {
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
