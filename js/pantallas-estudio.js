// Pantallas de estudio: Elegir meta y Hoy. La Sesión (Tarea 10) y el Mapa (Tarea 11) quedan como stubs.
// Script clásico (ES5). Usa las globales de app.js: state, commit y syncAndRefresh.

var DIAS_LARGO = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
var DIAS_CORTO = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
var renderedDay = null; // fecha con la que se dibujó Hoy o Yo (ver visibilitychange en app.js)

function lineById(id) {
  for (var i = 0; i < LINEAS.length; i++) if (LINEAS[i].id === id) return LINEAS[i];
  return null;
}

// Insignia «L1»…«L9» con el color de la línea: el número distingue la línea sin depender del color.
function lineBadge(line) {
  return el('span', { class: 'lbadge ' + line.color, title: 'Línea ' + line.n }, 'L' + line.n);
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
function pctOf(line) { return Math.round(100 * lineProgress(state, line, ESTACIONES)); }

function hubHead(right) {
  return el('div', { class: 'hub-head' }, el('p', { class: 'brand', text: 'Mapa de áreas' }), right || null);
}

// ---------- Elegir meta ----------
function renderPick(keep) {
  var root = screens.pick;
  root.textContent = '';
  var hasGoal = !!lineById(state.goal);
  if (hasGoal) {
    var back = el('button', { class: 'linkbtn', type: 'button', text: '← Volver' });
    back.addEventListener('click', function () { renderYo(); });
    root.append(el('div', { class: 'topnav' }, back));
  } else {
    root.append(hubHead());
  }
  root.append(el('div', { class: 'hub-title' },
    el('h1', { text: hasGoal ? 'Cambia tu meta' : 'Elige tu meta' }),
    el('p', { class: 'lede', text: 'Elige una vacante real como meta. Vas a estudiar las habilidades que pide, a tu ritmo.' })
  ));
  if (hasGoal) root.append(el('p', { class: 'small', text: 'Lo que ya estudiaste se conserva: las habilidades compartidas cuentan para todas las líneas.' }));
  // Quien ya tiene cuenta puede entrar antes de elegir, para traer su meta de la nube sin pisarla.
  if (!hasGoal && !session) root.append(el('div', { class: 'pick-login' }, signInBlock('pick-', '¿Ya tienes cuenta? Entra', true)));

  var groups = [
    ['Para empezar', 'Piden poca o ninguna experiencia.', LINEAS.filter(function (l) { return l.level === 'Para empezar'; })],
    ['Para más adelante', 'Piden experiencia: sirven como mapa de lo que hay que aprender.', LINEAS.filter(function (l) { return l.level !== 'Para empezar'; })]
  ];
  groups.forEach(function (g) {
    if (!g[2].length) return;
    var list = el('ul', { class: 'line-list' });
    g[2].slice().sort(function (a, b) { return a.n - b.n; }).forEach(function (line) {
      var pct = pctOf(line);
      var mine = line.id === state.goal;
      var card = el('button', { class: 'line-card ' + line.color, type: 'button' },
        el('span', { class: 'lc-top' }, lineBadge(line),
          el('span', { class: 'lvl' + (line.level === 'Para empezar' ? ' start' : ''), text: line.level }),
          mine ? el('span', { class: 'lvl mine', text: 'Tu meta actual' }) : null),
        el('span', { class: 'lc-title', text: line.title }),
        el('span', { class: 'lc-meta', text: line.company + ' · ' + plural(line.stations.length, 'estación', 'estaciones') + (pct > 0 ? ' · ' + pct + '% listo' : '') })
      );
      if (mine) card.setAttribute('aria-current', 'true');
      card.addEventListener('click', function () { chooseGoal(line.id); });
      list.append(el('li', null, card));
    });
    root.append(el('div', { class: 'pick-group' }, el('h2', { text: g[0] }), el('p', { class: 'small', text: g[1] }), list));
  });
  show('pick', keep);
}

function chooseGoal(id) {
  if (id !== state.goal) commit(setGoal(state, id, Date.now()));
  renderHoy();
  syncAndRefresh();
}

// ---------- Hoy ----------
function weekStrip(today) {
  var mon = weekKey(today);
  var rest = streak(state, today).rest;
  var ol = el('ol', { class: 'week', 'aria-label': 'Esta semana' });
  for (var i = 0; i < 7; i++) {
    var d = addDays(mon, i);
    var done = !!(state.days[d] && state.days[d].done);
    var isRest = !done && rest.indexOf(d) !== -1;
    var isToday = d === today;
    var future = d > today;
    var what = done ? 'cumplido' : isRest ? 'día de descanso' : future ? 'por venir' : isToday ? 'pendiente' : 'sin sesión';
    var cls = 'day' + (done ? ' on' : '') + (isRest ? ' rest' : '') + (isToday ? ' today' : '') + (future ? ' future' : '');
    ol.append(el('li', { class: cls },
      el('span', { 'aria-hidden': 'true', text: DIAS_CORTO[i] }),
      el('i', { 'aria-hidden': 'true', text: isRest ? '–' : null }),
      el('span', { class: 'sr-only', text: DIAS_LARGO[i] + (isToday ? ', hoy' : '') + ', ' + what })));
  }
  return ol;
}

// Línea en miniatura: visitadas rellenas, la actual resaltada y el resto huecas.
function miniLine(line) {
  var ids = line.stations.filter(function (id) { return !!ESTACIONES[id]; });
  var n = ids.length;
  var cur = currentStation(state, line, ESTACIONES);
  var curIdx = ids.indexOf(cur);
  var nodes = el('div', { class: 'mini-nodes', 'aria-hidden': 'true' });
  var labels = el('div', { class: 'mini-labels', 'aria-hidden': 'true' });
  nodes.style.setProperty('--n', n);
  labels.style.setProperty('--n', n);
  var said = [];
  // Columnas (1 a n, fin exclusivo) de cada etiqueta. Con más de 5 estaciones solo se nombran la actual
  // y los extremos que caben sin encimarse; cada etiqueta ocupa también las columnas vacías de al lado.
  var named = {};
  if (n <= 5) ids.forEach(function (id, i) { named[i] = [i + 1, i + 2]; });
  else {
    var c = curIdx === -1 ? null : curIdx;
    if (c === null || c >= 3) named[0] = [1, 3];
    if (c === null || c <= n - 4) named[n - 1] = [n - 1, n + 1];
    if (c === 0) named[0] = [1, 3];
    else if (c === n - 1) named[n - 1] = [n - 1, n + 1];
    else if (c !== null) named[c] = [c, c + 3];
  }
  ids.forEach(function (id, i) {
    var st = ESTACIONES[id];
    var visited = isVisited(state, st);
    var started = !visited && stationProgress(state, st) > 0;
    var prevVisited = i > 0 && isVisited(state, ESTACIONES[ids[i - 1]]);
    nodes.append(el('span', { class: 'node' + (visited ? ' done' : '') + (started ? ' started' : '') + (i === curIdx ? ' now' : '') + (prevVisited ? ' reach' : '') }, el('i')));
    said.push(st.name + (i === curIdx ? ' (vas aquí)' : visited ? ' (visitada)' : ''));
    if (named[i]) {
      var edge = n > 5 && i === 0 ? ' start' : n > 5 && i === n - 1 ? ' end' : '';
      var lab = el('span', { class: 'lab' + (i === curIdx ? ' cur' : '') + edge, title: st.name, text: st.name });
      lab.style.gridColumn = named[i][0] + ' / ' + named[i][1];
      labels.append(lab);
    }
  });
  return el('div', { class: 'mini ' + line.color, role: 'img', 'aria-label': 'Estaciones de la línea: ' + said.join(', ') }, nodes, labels);
}

function renderHoy(keep) {
  var line = lineById(state.goal);
  if (!line) { renderPick(keep); return; }
  var today = todayYmd();
  renderedDay = today;
  var root = screens.hoy;
  root.textContent = '';
  var s = streak(state, today).current;
  root.append(hubHead(el('span', { class: 'chip' + (s ? '' : ' quiet'), text: 'Racha · ' + plural(s, 'día', 'días') })));
  root.append(el('h1', { class: 'sr-only', text: 'Hoy' }));
  root.append(weekStrip(today));

  // Tarjeta de la meta
  var pct = pctOf(line);
  var left = line.stations.filter(function (id) { return ESTACIONES[id] && !isVisited(state, ESTACIONES[id]); }).length;
  var bar = el('div', { class: 'pbar', role: 'progressbar', 'aria-label': 'Avance de tu meta', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) }, el('b'));
  bar.firstChild.style.width = pct + '%';
  root.append(el('article', { class: 'card goal ' + line.color },
    el('p', { class: 'mono goal-tag' }, 'Tu meta · ', lineBadge(line)),
    el('h2', { text: line.title }),
    el('p', { class: 'small', text: line.company + ' · ' + line.level }),
    el('div', { class: 'pct-row' },
      el('span', { class: 'big', text: pct + '%' }),
      el('span', { class: 'small pct-note' }, 'listo para aplicar', el('br'),
        left ? 'te ' + (left === 1 ? 'falta 1 estación' : 'faltan ' + left + ' estaciones') : 'ya visitaste todas las estaciones')
    ),
    bar,
    miniLine(line)
  ));

  // Sesión de hoy o «Estás al día»
  var cards = buildSession(state, today, LINEAS, ESTACIONES);
  if (cards.length) {
    var cta = el('button', { class: 'session-cta', type: 'button' },
      el('span', { class: 'cta-text' }, el('b', { text: 'Sesión de hoy' }), el('span', { class: 'desc', text: describeSession(cards, ESTACIONES) })),
      el('span', { class: 'go', 'aria-hidden': 'true', text: '→' }));
    cta.addEventListener('click', function () { startSession(); });
    root.append(cta);
  } else {
    var nd = nextDue(state, today);
    var more = el('button', { class: 'btn ghost', type: 'button', text: 'Otra sesión' });
    more.addEventListener('click', function () { startSession({ ahead: true }); });
    root.append(el('div', { class: 'card uptodate' },
      el('h2', { text: 'Estás al día' }),
      el('p', { text: nd ? 'Próximo repaso: ' + fmtDay(nd) : 'Aún no tienes repasos programados' }),
      el('p', { class: 'small', text: '«Otra sesión» adelanta los repasos más próximos.' }),
      el('div', null, more)));
  }

  // Otras líneas con avance
  var others = LINEAS.filter(function (l) { return l.id !== line.id && pctOf(l) > 0; });
  if (others.length) {
    var list = el('ul', { class: 'lrows' });
    others.forEach(function (l) {
      list.append(el('li', { class: 'lrow ' + l.color }, lineBadge(l),
        el('span', { class: 'lrow-t' }, el('b', { text: l.title }), el('span', { class: 'small', text: l.company })),
        el('span', { class: 'pct', text: pctOf(l) + '%' })));
    });
    root.append(el('section', { class: 'card', 'aria-labelledby': 'others-h' },
      el('h2', { class: 'mono card-h', id: 'others-h', text: 'Otras líneas que ya avanzaste' }), list));
  }
  show('hoy', keep);
}

// ---------- Stubs ----------
// Sesión de estudio: la arma la Tarea 10. Por ahora solo permite salir.
function startSession(opts) {
  var root = screens.sesion;
  root.textContent = '';
  var exit = el('button', { class: 'linkbtn', type: 'button', text: '✕ Salir' });
  exit.addEventListener('click', function () { renderHoy(); });
  root.append(el('div', { class: 'topnav' }, exit), el('h1', { class: 'sr-only', text: 'Sesión de hoy' }),
    el('p', { class: 'status', text: 'Preparando tu sesión…' }));
  show('sesion');
}

// Mapa y Línea: los dibuja la Tarea 11 (js/pantallas-mapa.js reemplaza estos stubs).
function renderMapa(keep) {
  var root = screens.mapa;
  root.textContent = '';
  root.append(hubHead(), el('h1', { text: 'Mapa' }), el('p', { class: 'status', text: 'Cargando el mapa…' }));
  show('mapa', keep);
}
function openLinea(id) { renderMapa(); }
