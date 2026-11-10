// Utilidades de interfaz: el, screens, show, glossFor, hasOwn, extLink, fmtDate, fmtDay y navBack.
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

var screens = { intro: document.getElementById('s-intro'), quiz: document.getElementById('s-quiz'), result: document.getElementById('s-result'), history: document.getElementById('s-history'), admin: document.getElementById('s-admin'), learn: document.getElementById('s-learn') };
function show(name) {
  Object.keys(screens).forEach(function (k) { screens[k].hidden = (k !== name); });
  window.scrollTo(0, 0);
}
function glossFor(texts, title, limit) {
  var blob = texts.join(' ').toLowerCase();
  var hits = GLOSS.filter(function (g) { return blob.indexOf(g[1]) !== -1; });
  if (limit) hits = hits.slice(0, limit);
  if (!hits.length) return null;
  var dl = el('dl');
  hits.forEach(function (g) { dl.append(el('dt', { text: g[0] }), el('dd', { text: g[2] })); });
  return el('details', { class: 'gloss' }, el('summary', { text: title }), dl);
}

function fmtDate(iso) { return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }); }
function navBack() {
  var b = el('button', { class: 'linkbtn', type: 'button', text: '← Inicio' });
  b.addEventListener('click', function () { show('intro'); });
  return el('div', { class: 'topnav' }, b);
}
function fmtDay(ymd) { return new Date(ymd + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); }
function hasOwn(obj, key) { return obj != null && Object.prototype.hasOwnProperty.call(obj, key); }
function extLink(href, text) { return el('a', { href: href, target: '_blank', rel: 'noopener', text: text }); }
