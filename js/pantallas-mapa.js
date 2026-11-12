// Pantallas del mapa: Mapa (SVG de líneas y estaciones), Línea (ficha de la vacante) y Estación (con el atajo).
// Script clásico (ES5). Usa las globales de app.js (state, commit, syncNow, syncAndRefresh), de ui.js y de pantallas-estudio.js.

// A dónde regresa «Volver» desde una estación: al mapa o a la línea desde la que se abrió.
var estBack = { screen: 'mapa' };
// Atajo respondido en esta visita a la estación: { id, answers, passed }. Se conserva al redibujar.
var estShortcut = null;
var lineaShown = null; // línea abierta (para redibujar tras sincronizar)
// A dónde regresa «Volver» desde una línea: 'mapa' u 'hoy' (Otras líneas).
var lineaBack = 'mapa';
// Región viva (role=status) del atajo: se crea vacía con la tarjeta y sobrevive al redibujo de la estación,
// así el resultado se anuncia al escribirlo en ella.
var estLive = null;
var estShown = null;   // estación abierta

function stationPct(st) { return Math.round(100 * stationProgress(state, st)); }

function stationState(st) {
  if (isVisited(state, st)) return 'Vista';
  return stationProgress(state, st) > 0 ? 'En progreso' : 'Sin empezar';
}

function linesThrough(id) {
  return LINEAS.filter(function (l) { return l.stations.indexOf(id) !== -1; });
}

function backButton(text, fn) {
  var b = el('button', { class: 'linkbtn', type: 'button', text: text });
  b.addEventListener('click', fn);
  return el('div', { class: 'topnav' }, b);
}

function progressBar(pct, label) {
  var bar = el('div', { class: 'pbar', role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) }, el('b'));
  bar.firstChild.style.width = pct + '%';
  return bar;
}

// ---------- Mapa ----------
// Abre una estación con el teclado (Enter o Espacio) o con un clic.
function activateOnKeys(node, fn) {
  node.addEventListener('click', fn);
  node.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); fn(); }
  });
}

function mapSvg() {
  var lay = mapLayout(LINEAS, ESTACIONES);
  var goal = lineById(state.goal);
  var cur = goal ? currentStation(state, goal, ESTACIONES) : null;
  var svg = elNS('svg', { class: 'metro', viewBox: '0 0 ' + lay.width + ' ' + lay.height, role: 'group', 'aria-label': 'Mapa de líneas y estaciones' });

  // Líneas: la meta se dibuja al final (encima) y con más fuerza que las demás.
  var tracks = elNS('g', { class: 'tracks', 'aria-hidden': 'true' });
  var order = LINEAS.filter(function (l) { return l.id !== state.goal; });
  if (goal) order.push(goal);
  order.forEach(function (l) {
    var pts = [];
    (lay.paths[l.id] || []).forEach(function (s) { pts.push(s[0] + ',' + s[1], s[2] + ',' + s[3]); });
    if (pts.length) tracks.append(elNS('polyline', { class: 'trk ' + l.color + (l.id === state.goal ? ' goal' : ''), points: pts.join(' '), 'data-line': l.id }));
  });
  svg.append(tracks);

  // Estaciones, en el orden de las líneas (L1 a L9): así las recorre Tab.
  var G = MAP_GEO;
  var colorOf = {};
  LINEAS.forEach(function (l) { colorOf[l.id] = l.color; });
  lay.nodes.forEach(function (n) {
    var st = ESTACIONES[n.id];
    var visited = isVisited(state, st);
    var onGoal = !!goal && goal.stations.indexOf(n.id) !== -1;
    var isCur = n.id === cur;
    var pct = stationPct(st);
    // Las líneas se nombran por su número, no solo por su color: «SQL, líneas L1, L2, L4, L6 y L8, 40% de avance».
    var nums = n.lines.map(function (lid) { return 'L' + lineById(lid).n; });
    var named = nums.length === 1 ? 'línea ' + nums[0] : 'líneas ' + nums.slice(0, -1).join(', ') + ' y ' + nums[nums.length - 1];
    var label = st.name + ', ' + named + ', ' + pct + '% de avance' +
      (visited ? ', vista' : '') + (isCur ? ', vas aquí' : '');
    var g = elNS('g', { class: 'st' + (visited ? ' done' : '') + (isCur ? ' cur' : '') + (onGoal ? ' on-goal' : ''),
      role: 'link', tabindex: '0', 'data-station': n.id, 'aria-label': label });
    g.append(elNS('circle', { class: 'hit', cx: n.x, cy: n.y, r: 22 }));
    if (n.lines.length > 1) {
      var w = n.w, h = n.h;
      if (isCur) g.append(elNS('rect', { class: 'halo', x: n.x - w / 2 - 4, y: n.y - h / 2 - 4, width: w + 8, height: h + 8, rx: h / 2 + 4 }));
      ['ring-gap', 'ring', 'ring-dash'].forEach(function (k) {
        g.append(elNS('rect', { class: k, x: n.x - w / 2 - 7, y: n.y - h / 2 - 7, width: w + 14, height: h + 14, rx: h / 2 + 7 }));
      });
      g.append(elNS('rect', { class: 'pill', x: n.x - w / 2, y: n.y - h / 2, width: w, height: h, rx: h / 2 }));
      n.lines.forEach(function (lid, i) {
        var cx = n.x - (n.lines.length - 1) * G.dotGap / 2 + i * G.dotGap;
        g.append(elNS('circle', { class: 'pdot ' + colorOf[lid], cx: cx, cy: n.y, r: 2.9 }));
      });
    } else {
      var c = colorOf[n.lines[0]];
      if (isCur) g.append(elNS('circle', { class: 'halo', cx: n.x, cy: n.y, r: G.r + 4 }));
      ['ring-gap', 'ring', 'ring-dash'].forEach(function (k) { g.append(elNS('circle', { class: k, cx: n.x, cy: n.y, r: G.r + 7 })); });
      g.append(elNS('circle', { class: 'dot ' + c, cx: n.x, cy: n.y, r: G.r - 1.5 }));
    }
    var t = elNS('text', { class: 'lab', x: n.label.x, 'text-anchor': n.label.anchor, 'aria-hidden': 'true' });
    var lines = n.label.lines;
    lines.forEach(function (s, i) {
      // Centrado vertical: la línea de base queda ~4.2 debajo del centro del renglón.
      var dy = n.label.cy + (i - (lines.length - 1) / 2) * G.lineH + 4.2;
      t.append(elNS('tspan', { x: n.label.x, y: dy.toFixed(1), text: s }));
    });
    g.append(t);
    activateOnKeys(g, function () { openEstacion(n.id, { screen: 'mapa' }); });
    svg.append(g);
  });

  // Insignias «L#» donde empieza cada línea: número más color. Son decorativas para lectores de pantalla
  // (la etiqueta de cada estación y la lista de líneas ya dicen los números).
  var badges = elNS('g', { class: 'badges', 'aria-hidden': 'true' });
  lay.badges.forEach(function (b) {
    badges.append(elNS('g', { class: 'badge ' + colorOf[b.line], 'data-badge': b.line },
      elNS('rect', { x: b.box.x0, y: b.box.y0, width: G.badgeW, height: G.badgeH, rx: G.badgeH / 2 }),
      elNS('text', { x: b.x, y: (b.y + 3.6).toFixed(1), 'text-anchor': 'middle', text: 'L' + b.n })));
  });
  svg.append(badges);
  return svg;
}

function lineRow(line) {
  var pct = pctOf(line);
  var b = el('button', { class: 'line-row ' + line.color, type: 'button', 'data-line': line.id },
    lineBadge(line),
    el('span', { class: 'lr-t' }, el('b', { text: line.title }),
      el('span', { class: 'small', text: line.company }),
      el('span', { class: 'lvl' + (line.level === 'Para empezar' ? ' start' : ''), text: line.level })),
    el('span', { class: 'pct', text: pct + '% listo' }));
  if (line.id === state.goal) b.append(el('span', { class: 'sr-only', text: ', tu meta' }));
  b.addEventListener('click', function () { openLinea(line.id, false, 'mapa'); });
  return b;
}

function renderMapa(keep) {
  var root = screens.mapa;
  root.textContent = '';
  root.append(hubHead(el('p', { class: 'brand', text: LINEAS.length + ' líneas · ' + Object.keys(ESTACIONES).length + ' estaciones' })));
  root.append(el('div', { class: 'hub-title' },
    el('h1', { text: 'Mapa' }),
    el('p', { class: 'lede', text: 'Cada vacante es una línea. Las habilidades son estaciones; donde se cruzan dos líneas, lo que aprendes cuenta para las dos.' })));
  root.append(el('p', { class: 'small map-key' },
    el('span', { class: 'k-dot done', 'aria-hidden': 'true' }), 'vista  ',
    el('span', { class: 'k-dot', 'aria-hidden': 'true' }), 'por visitar  ',
    el('span', { class: 'k-pill', 'aria-hidden': 'true' }), 'compartida  ',
    el('span', { class: 'k-cur', 'aria-hidden': 'true' }), 'vas aquí'));
  root.append(el('div', { class: 'metro-wrap' }, mapSvg()));
  var list = el('ul', { class: 'line-list' });
  LINEAS.forEach(function (l) { list.append(el('li', null, lineRow(l))); });
  root.append(el('section', { class: 'lines-sec', 'aria-labelledby': 'lines-h' },
    el('h2', { id: 'lines-h', text: 'Las líneas' }),
    el('p', { class: 'small', text: 'El mismo mapa en lista. Toca una línea para ver la vacante y sus estaciones.' }),
    list));
  lineaShown = null; estShown = null;
  show('mapa', keep);
}

// ---------- Línea ----------
// from: 'mapa' u 'hoy'. Sin from (al redibujar o al volver desde una estación) se conserva el anterior.
function openLinea(id, keep, from) {
  var line = lineById(id);
  if (!line) { renderMapa(); return; }
  if (from) lineaBack = from;
  lineaShown = id; estShown = null;
  var root = screens.linea;
  root.textContent = '';
  var toHoy = lineaBack === 'hoy';
  root.append(backButton(toHoy ? '← Hoy' : '← Mapa', function () {
    withDir('backward', function () { if (toHoy) renderHoy(); else renderMapa(); });
  }));
  var pct = pctOf(line);
  var mine = line.id === state.goal;
  root.append(el('div', { class: 'hub-title ' + line.color },
    el('p', { class: 'mono goal-tag' }, lineBadge(line), ' · ' + line.level),
    el('h1', { text: line.title }),
    el('p', { class: 'small', text: line.company + ' · ' + line.place }),
    el('p', { text: line.summary })));

  var cur = currentStation(state, line, ESTACIONES);
  root.append(el('article', { class: 'card ' + line.color },
    el('div', { class: 'pct-row' }, el('span', { class: 'big', text: pct + '%' }), el('span', { class: 'small pct-note', text: 'listo para aplicar' })),
    progressBar(pct, 'Avance de la línea')));

  var goalBtn;
  if (mine) {
    goalBtn = el('button', { class: 'btn', type: 'button', disabled: '', 'aria-current': 'true', text: 'Es tu meta' });
  } else {
    goalBtn = el('button', { class: 'btn', type: 'button', text: 'Elegir como meta' });
    goalBtn.addEventListener('click', function () { chooseGoal(line.id, true); });
  }
  root.append(el('div', { class: 'actions' }, goalBtn));

  var asks = el('ul', { class: 'asks' });
  line.asks.forEach(function (a) { asks.append(el('li', { text: a })); });
  var ficha = el('section', { class: 'card stack', 'aria-labelledby': 'asks-h' },
    el('h2', { class: 'mono card-h', id: 'asks-h', text: 'Lo que pide la vacante' }), asks);
  if (line.note) ficha.append(el('p', { class: 'note', text: line.note }));
  var a = extLink(line.url, 'Ver la vacante original');
  a.className = 'vacante';
  ficha.append(el('p', null, a, el('br'), el('span', { class: 'small', text: 'leída el ' + fmtDay(line.seen) + ' · la publicación puede haber cambiado' })));
  root.append(ficha);

  var rows = el('ol', { class: 'st-rows' });
  line.stations.forEach(function (sid) {
    var st = ESTACIONES[sid];
    if (!st) return;
    var p = stationPct(st);
    var isCur = sid === cur;
    var bar = el('span', { class: 'mbar', 'aria-hidden': 'true' }, el('b'));
    bar.firstChild.style.width = p + '%';
    var b = el('button', { class: 'st-row' + (isVisited(state, st) ? ' done' : '') + (isCur ? ' cur' : ''), type: 'button', 'data-station': sid },
      el('span', { class: 'st-dot', 'aria-hidden': 'true' }),
      el('span', { class: 'st-t' }, el('b', { text: st.name }),
        el('span', { class: 'small' }, stationState(st) + ' · ' + p + '%', isCur ? el('span', { class: 'here', text: 'Vas aquí' }) : null)),
      bar);
    b.addEventListener('click', function () { openEstacion(sid, { screen: 'linea', id: line.id }); });
    rows.append(el('li', null, b));
  });
  root.append(el('section', { class: 'card ' + line.color, 'aria-labelledby': 'st-h' },
    el('h2', { class: 'mono card-h', id: 'st-h', text: 'Estaciones en orden' }), rows));

  // Con from se abre (hacia delante); sin from, se vuelve desde una estación (hacia atrás). Con keep, show() la ignora.
  show('linea', keep, from ? 'forward' : 'backward');
}

// ---------- Estación ----------
function shortcutCard(st) {
  var answers = [null, null];
  var check = el('button', { class: 'btn check', type: 'button', disabled: '', text: 'Comprobar' });
  var card = el('section', { class: 'card shortcut', 'aria-labelledby': 'sc-h' },
    el('h2', { id: 'sc-h', text: '¿Ya sabes esto?' }),
    el('p', { class: 'small', text: 'Contesta 2 preguntas. Si aciertas las dos, la estación queda vista y la repasas en 7 días. Si no, la estudias paso a paso en tus sesiones.' }));
  st.extra.forEach(function (q, qi) {
    var qid = 'sc-q' + qi;
    var opts = el('div', { class: 'opts', role: 'group', 'aria-labelledby': qid });
    q.opts.forEach(function (t, i) {
      var b = el('button', { class: 'opt', type: 'button', 'aria-pressed': 'false' }, el('span', { class: 'k', text: String.fromCharCode(65 + i) }), el('span', { class: 'ot', text: t }));
      b.addEventListener('click', function () {
        answers[qi] = i;
        Array.prototype.forEach.call(opts.children, function (o, j) { o.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
        if (answers[0] !== null && answers[1] !== null) check.removeAttribute('disabled');
      });
      opts.append(b);
    });
    card.append(el('div', { class: 'rq', 'data-q': String(qi) }, el('p', { class: 'qtext', id: qid, text: (qi + 1) + '. ' + q.q }), opts));
  });
  check.addEventListener('click', function () {
    if (answers[0] === null || answers[1] === null || estShortcut) return;
    var r = applyShortcut(state, st, answers, todayYmd(), Date.now());
    commit(r.state);
    syncNow();
    estShortcut = { id: st.id, answers: answers.slice(), passed: r.passed };
    openEstacion(st.id, null, true);
    var h = screens.estacion.querySelector('.shortcut-result h2');
    if (h) h.focus({ preventScroll: false });
    // El anuncio no depende del foco: se escribe en la región viva que ya estaba en la página.
    if (estLive) estLive.textContent = shortcutSummary(st, estShortcut);
  });
  card.append(el('div', { class: 'actions' }, check));
  return card;
}

function shortcutHeadline(res) {
  return res.passed ? 'Listo: la estación queda vista y la repasas en 7 días' : 'Vamos paso a paso: esta estación entra en tus sesiones';
}

function shortcutSummary(st, res) {
  var parts = [shortcutHeadline(res) + '.'];
  st.extra.forEach(function (q, qi) {
    parts.push('Pregunta ' + (qi + 1) + ': ' + (res.answers[qi] === q.ok ? 'correcto.' : 'casi; la correcta es ' + q.opts[q.ok] + '.'));
  });
  return parts.join(' ');
}

function shortcutResult(st, res) {
  var card = el('section', { class: 'card shortcut-result' + (res.passed ? ' good' : ''), 'aria-labelledby': 'scr-h' },
    el('h2', { id: 'scr-h', tabindex: '-1', text: shortcutHeadline(res) }));
  if (!res.passed) card.append(el('p', { class: 'small', text: 'Lo que contestaste cuenta: las dos preguntas vuelven en tus repasos.' }));
  var why = el('div', { class: 'stack' });
  st.extra.forEach(function (q, qi) {
    var mine = res.answers[qi], right = mine === q.ok;
    why.append(el('div', { class: 'rq' },
      el('p', { class: 'qtext', text: (qi + 1) + '. ' + q.q }),
      el('p', null, el('b', { text: right ? 'Correcto: ' : 'Casi. ' }), right ? q.opts[q.ok] : 'Tu respuesta: ' + q.opts[mine] + '. La correcta: ' + q.opts[q.ok] + '.'),
      el('p', { class: 'why', text: q.why })));
  });
  card.append(why);
  return card;
}

// from: { screen: 'mapa' } o { screen: 'linea', id }. Sin from (al redibujar) se conserva el anterior.
function openEstacion(id, from, keep) {
  var st = ESTACIONES[id];
  if (!st) { renderMapa(); return; }
  // Llegar de nuevo (con from) empieza una visita: el resultado del atajo anterior ya no se muestra.
  if (from) { estBack = from; estShortcut = null; }
  estShown = id; lineaShown = null;
  var root = screens.estacion;
  // Al redibujar la misma visita, la región viva del atajo se queda en su lugar; lo demás se rehace.
  var keepLive = !from && !!estLive && estLive.parentNode === root;
  Array.prototype.slice.call(root.childNodes).forEach(function (c) { if (!keepLive || c !== estLive) root.removeChild(c); });
  if (!keepLive) estLive = null;
  var back = estBack;
  var backLine = back.screen === 'linea' ? lineById(back.id) : null;
  root.append(backButton(backLine ? '← L' + backLine.n + ' · ' + backLine.title : '← Mapa', function () {
    withDir('backward', function () { if (backLine) openLinea(backLine.id); else renderMapa(); });
  }));

  var through = linesThrough(id);
  var chips = el('ul', { class: 'st-lines', 'aria-label': 'Líneas que pasan por aquí' });
  through.forEach(function (l) {
    var b = el('button', { class: 'lchip', type: 'button', 'aria-label': 'L' + l.n + ': ' + l.title }, lineBadge(l));
    b.addEventListener('click', function () { openLinea(l.id, false, 'mapa'); });
    chips.append(el('li', null, b));
  });
  root.append(el('div', { class: 'hub-title' },
    el('p', { class: 'mono', text: 'Estación · ' + plural(through.length, 'línea', 'líneas') }),
    el('h1', { text: st.name }),
    chips));

  var pct = stationPct(st);
  root.append(el('div', { class: 'card st-prog' },
    el('div', { class: 'pct-row' }, el('span', { class: 'big', text: pct + '%' }), el('span', { class: 'small pct-note', text: stationState(st) })),
    progressBar(pct, 'Avance de la estación'),
    through.length > 1 ? el('p', { class: 'small', text: 'Lo que aprendas aquí cuenta para las ' + through.length + ' líneas.' }) : null));

  if (estShortcut && estShortcut.id === id) root.append(shortcutResult(st, estShortcut));
  else if (stationProgress(state, st) === 0) {
    if (!estLive) estLive = el('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite', 'data-live': 'atajo' });
    root.append(estLive, shortcutCard(st));
  }

  var shown = [st.plain, st.why, st.task.d];
  var steps = el('ol', { class: 'st-steps' });
  st.steps.forEach(function (s, n) {
    var seen = boxOf(state, id + '.' + n) >= 1;
    if (seen) shown.push(s.idea);
    steps.append(el('li', { class: seen ? '' : 'todo' }, seen ? s.idea : 'Por descubrir en tu próxima sesión'));
  });
  var res = el('ul', { class: 'res' });
  st.res.forEach(function (r) { res.append(el('li', null, extLink(r.u, r.n))); });
  root.append(
    el('section', { class: 'card stack', 'aria-labelledby': 'qe-h' },
      el('h2', { class: 'mono card-h', id: 'qe-h', text: 'Qué es' }), el('p', { text: st.plain }),
      el('h2', { class: 'mono card-h', text: 'Para qué sirve' }), el('p', { text: st.why })),
    el('section', { class: 'card stack', 'aria-labelledby': 'ps-h' },
      el('h2', { class: 'mono card-h', id: 'ps-h', text: 'Pasos' }), steps),
    el('section', { class: 'card stack', 'aria-labelledby': 'ej-h' },
      el('h2', { class: 'mono card-h', id: 'ej-h', text: 'Ejercicio' }),
      el('h3', { text: st.task.n }), el('p', { text: st.task.d }), el('p', { class: 'small', text: 'Tiempo: ' + st.task.t })),
    el('section', { class: 'card stack', 'aria-labelledby': 'rs-h' },
      el('h2', { class: 'mono card-h', id: 'rs-h', text: 'Para leer más' }), res),
    glossFor(shown, '¿Hay términos que no conoces? Aquí se explican'));
  show('estacion', keep, from ? 'forward' : null);
}
