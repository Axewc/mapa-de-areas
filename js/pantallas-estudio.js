// Pantallas de estudio: Elegir meta, Hoy y Sesión. Mapa, Línea y Estación están en js/pantallas-mapa.js.
// Script clásico (ES5). Usa las globales de app.js: state, commit, syncNow y syncAndRefresh.

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

// Elige la meta y entra a Hoy. notify: avisa «Meta cambiada…» (desde Línea y desde el resultado del cuestionario).
function chooseGoal(id, notify) {
  if (id !== state.goal) commit(setGoal(state, id, Date.now()));
  renderHoy();
  if (notify) showNotice('Meta cambiada a ' + lineById(id).title + '.');
  syncAndRefresh();
}

// ---------- Hoy ----------
function weekStrip(today) {
  var mon = weekKey(today);
  var rest = streak(state, today).rest;
  var ol = el('ol', { class: 'week', 'aria-label': 'Esta semana' });
  for (var i = 0; i < 7; i++) {
    var d = addDays(mon, i);
    var done = coreIsDone(state, d); // la misma regla que la racha
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
  // Con 5 estaciones o menos se nombran todas, escalonadas en dos renglones: cada etiqueta puede medir el doble de una
  // columna, centrada en su estación (la primera y la última, pegadas a su borde y de 1.5 columnas; y la caja se ajusta al texto, así que las del
  // mismo renglón solo se tocan si ambos textos son largos: la prueba lo revisa con las nueve líneas). La cuadrícula
  // de etiquetas tiene 2n unidades (media columna cada una). Con más de 5 solo se nombran la actual y los extremos
  // que caben sin encimarse; cada etiqueta ocupa también las columnas vacías de al lado (columnas 1 a n, fin exclusivo).
  var named = {};
  var stagger = n <= 5;
  if (stagger) {
    // La primera etiqueta pasa de 1.5 a 2 columnas solo si trae una palabra larga («Requerimientos»); entonces la tercera,
    // que comparte su renglón, cede media columna.
    var longWord = ESTACIONES[ids[0]].name.split(' ').some(function (w) { return w.length > 11; });
    ids.forEach(function (id, i) {
      var from = i === 0 ? 1 : i === n - 1 ? 2 * n - 2 : i === 2 && longWord ? 2 * i + 1 : 2 * i;
      var to = i === 0 ? (longWord ? 5 : 4) : i === n - 1 ? 2 * n + 1 : 2 * i + 4;
      named[i] = [from, to];
    });
  }
  else {
    var c = curIdx === -1 ? null : curIdx;
    if (c === null || c >= 3) named[0] = [1, 3];
    if (c === null || c <= n - 4) named[n - 1] = [n - 1, n + 1];
    if (c === 0) named[0] = [1, 3];
    else if (c === n - 1) named[n - 1] = [n - 1, n + 1];
    else if (c !== null) named[c] = [c, c + 3];
  }
  if (stagger) labels.classList.add('stagger');
  ids.forEach(function (id, i) {
    var st = ESTACIONES[id];
    var visited = isVisited(state, st);
    var started = !visited && stationProgress(state, st) > 0;
    var prevVisited = i > 0 && isVisited(state, ESTACIONES[ids[i - 1]]);
    nodes.append(el('span', { class: 'node' + (visited ? ' done' : '') + (started ? ' started' : '') + (i === curIdx ? ' now' : '') + (prevVisited ? ' reach' : '') }, el('i')));
    said.push(st.name + (i === curIdx ? ' (vas aquí)' : visited ? ' (visitada)' : ''));
    if (named[i]) {
      var edge = i === 0 ? ' start' : i === n - 1 ? ' end' : '';
      var lab = el('span', { class: 'lab' + (i === curIdx ? ' cur' : '') + edge, title: st.name, text: st.name });
      lab.style.gridColumn = named[i][0] + ' / ' + named[i][1];
      if (stagger) lab.style.gridRow = String(i % 2 + 1);
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
      var row = el('button', { class: 'lrow ' + l.color, type: 'button', 'data-line': l.id }, lineBadge(l),
        el('span', { class: 'lrow-t' }, el('b', { text: l.title }), el('span', { class: 'small', text: l.company })),
        el('span', { class: 'pct', text: pctOf(l) + '%' }));
      row.addEventListener('click', function () { openLinea(l.id, false, 'hoy'); });
      list.append(el('li', null, row));
    });
    root.append(el('section', { class: 'card', 'aria-labelledby': 'others-h' },
      el('h2', { class: 'mono card-h', id: 'others-h', text: 'Otras líneas que ya avanzaste' }), list));
  }
  show('hoy', keep);
}

// ---------- Sesión ----------
// Una sesión a la vez. Cada respuesta se guarda al momento (commit), así que salir a media sesión conserva lo respondido.
// sesRun: { queue, idx, done (respondidas), step: 'idea' | 'question' | 'end', ideaDone, answer (índice elegido o null),
//           finishedDay, after (estado al cerrar), goal (línea meta al empezar), xp, delta y visited (acumulados por respuesta) }
var sesRun = null;
var SES_KIND = { review: 'Repaso', 'new': 'Nuevo', extra: 'Reto' };
var SES_GLOSS_TITLE = '¿Hay términos que no conoces? Aquí se explican';

// Color de la estación: el de la línea meta si pasa por ella; si no, el de la primera línea que la tiene.
function sesColor(stationId) {
  var g = lineById(state.goal);
  if (g && g.stations.indexOf(stationId) !== -1) return g.color;
  for (var i = 0; i < LINEAS.length; i++) if (LINEAS[i].stations.indexOf(stationId) !== -1) return LINEAS[i].color;
  return '';
}

// Tarjetas cuya estación o pregunta ya no existe en el contenido se saltan sin avisar.
function sesPlayable(card) {
  return !!(ESTACIONES[card.station] && getQuestion(ESTACIONES, card.item));
}

function sesIdeaOf(card) {
  if (card.kind !== 'new' || card.repeat) return null;
  var n = +card.item.slice(card.item.lastIndexOf('.') + 1);
  var step = ESTACIONES[card.station].steps[n];
  return step && step.idea ? step.idea : null;
}

function startSession(opts) {
  if (currentScreen === 'sesion' && sesRun && sesRun.step !== 'end') return; // ya hay una sesión abierta
  if (deleting) { showNotice('Espera a que termine el borrado para empezar una sesión.'); return; }
  var cards = buildSession(state, todayYmd(), LINEAS, ESTACIONES, opts).filter(sesPlayable);
  if (!cards.length) {
    sesRun = null;
    renderHoy();
    showNotice('Por ahora no hay nada que repasar ni pasos nuevos. Vuelve cuando toque tu próximo repaso.');
    return;
  }
  // xp, delta y visited se acumulan respuesta por respuesta: una sincronización que trae progreso
  // de la nube a media sesión no se cuenta como ganado en esta sesión.
  sesRun = { queue: cards, idx: 0, done: 0, step: null, ideaDone: false, answer: null, finishedDay: null, after: null,
    goal: lineById(state.goal), xp: 0, delta: 0, visited: [] };
  sesCard(true);
}

function sesExit() {
  var r = sesRun;
  sesRun = null;
  // Lo respondido ya está guardado; si la sesión quedó a medias, se sincroniza para no esperar a la siguiente.
  if (r && r.done > 0 && !r.finishedDay) syncNow();
  renderHoy();
}

function sesHead() {
  var exit = el('button', { class: 'ses-exit', type: 'button', 'aria-label': 'Salir de la sesión', text: '✕ Salir' });
  exit.addEventListener('click', sesExit);
  return el('div', { class: 'ses-head' },
    el('div', { class: 'ses-bar' }, exit, el('p', { class: 'ses-count' })),
    el('div', { class: 'segs', role: 'progressbar', 'aria-label': 'Avance de la sesión', 'aria-valuemin': '0' }));
}

// Contador «n de total» y barra: un segmento por tarjeta (crece si se agrega una repetición), lleno si ya se respondió.
function sesPaintHead() {
  var r = sesRun, root = screens.sesion, total = r.queue.length;
  root.querySelector('.ses-count').textContent = (r.idx + 1) + ' de ' + total;
  var bar = root.querySelector('.segs');
  bar.setAttribute('aria-valuemax', String(total));
  bar.setAttribute('aria-valuenow', String(r.done));
  bar.setAttribute('aria-valuetext', r.done + ' de ' + total + ' respondidas');
  while (bar.children.length < total) bar.append(el('i'));
  for (var i = 0; i < bar.children.length; i++) bar.children[i].className = i < r.done ? 'f' : '';
}

function sesTag(card) {
  var label = card.repeat ? 'Otra vez' : SES_KIND[card.kind] || 'Repaso';
  return el('p', { class: 'ses-tag' }, el('i', { 'aria-hidden': 'true' }), label + ' · ' + ESTACIONES[card.station].name);
}

function sesFocus(h) {
  window.scrollTo(0, 0);
  h.focus({ preventScroll: true });
}

function sesCard(first) {
  var r = sesRun, card = r.queue[r.idx];
  var idea = r.ideaDone ? null : sesIdeaOf(card);
  r.step = idea ? 'idea' : 'question';
  r.answer = null;
  var root = screens.sesion;
  root.textContent = '';
  var color = sesColor(card.station);
  var box, h;
  if (idea) {
    h = el('h2', { class: 'ses-idea', tabindex: '-1', text: idea });
    var ok = el('button', { class: 'ses-next', type: 'button', text: 'Entendido' });
    ok.addEventListener('click', function (e) { if (e.detail > 1) return; sesAfterIdea(); });
    box = el('div', { class: 'ses-card idea ' + color, 'data-item': card.item }, sesTag(card),
      el('div', { class: 'ses-ideabox' }, el('p', { class: 'mono', text: 'La idea' }), h),
      glossFor([idea], SES_GLOSS_TITLE), ok);
  } else {
    var q = getQuestion(ESTACIONES, card.item);
    h = el('h2', { class: 'ses-q', tabindex: '-1', text: q.q });
    var opts = el('div', { class: 'ses-opts', role: 'group', 'aria-label': 'Opciones' });
    q.opts.forEach(function (t, i) {
      var b = el('button', { class: 'opt', type: 'button', 'aria-pressed': 'false' }, el('span', { class: 'k', text: String(i + 1) }), el('span', { class: 'ot', text: t }));
      // detail > 1: el segundo clic de un doble clic en «Siguiente» no contesta la tarjeta nueva.
      b.addEventListener('click', function (e) { if (e.detail > 1) return; sesAnswer(i); });
      opts.append(b);
    });
    box = el('div', { class: 'ses-card question ' + color, 'data-item': card.item }, sesTag(card), h, opts,
      el('div', { class: 'fb', 'aria-live': 'polite' }),
      glossFor([q.q].concat(q.opts, [q.why]), SES_GLOSS_TITLE),
      el('p', { class: 'hint ses-keys', text: 'Puedes responder con las teclas 1 a 4.' }));
  }
  if (first) root.append(el('h1', { class: 'sr-only', text: 'Sesión de estudio' }));
  root.append(sesHead(), box);
  sesPaintHead();
  if (first) show('sesion');
  sesFocus(h);
}

function sesAfterIdea() {
  if (!sesRun || sesRun.step !== 'idea') return;
  sesRun.ideaDone = true;
  sesCard(false);
}

// Suma lo que cambió con una respuesta: XP, avance de la meta y estaciones que quedaron visitadas.
function sesTally(prev, next, xp, stationId) {
  var r = sesRun;
  r.xp += xp;
  if (r.goal) r.delta += lineProgress(next, r.goal, ESTACIONES) - lineProgress(prev, r.goal, ESTACIONES);
  var st = ESTACIONES[stationId];
  if (r.visited.indexOf(stationId) === -1 && isVisited(next, st) && !isVisited(prev, st)) r.visited.push(stationId);
}

// Cierra la sesión con la fecha de este momento: el día cuenta como cumplido aunque no se pulse «Terminar».
function sesFinish() {
  var r = sesRun;
  r.finishedDay = todayYmd();
  var already = coreDay(state, r.finishedDay).done; // el bono de +20 se da una vez por día
  commit(finishSession(state, r.finishedDay));
  if (!already) r.xp += XP.done;
  r.after = state;
  syncNow();
}

function sesAnswer(i) {
  var r = sesRun;
  if (!r || r.step !== 'question' || r.answer !== null) return;
  var card = r.queue[r.idx];
  var q = getQuestion(ESTACIONES, card.item);
  var right = i === q.ok;
  r.answer = i;
  // La fecha se toma al responder: una sesión que cruza la medianoche cuenta cada respuesta en su día.
  var prev = state;
  commit(recordAnswer(state, card.item, right, todayYmd(), Date.now(), { repeat: !!card.repeat, ahead: !!card.ahead }));
  sesTally(prev, state, right ? XP.right : XP.wrong, card.station);
  r.queue = enqueueRepeat(r.queue, card, right);
  r.done++;
  var last = r.idx >= r.queue.length - 1;
  if (last) {
    sesFinish();
  }

  var root = screens.sesion;
  Array.prototype.forEach.call(root.querySelectorAll('.opt'), function (b, j) {
    b.setAttribute('aria-pressed', j === i ? 'true' : 'false');
    b.setAttribute('aria-disabled', 'true');
    if (j === q.ok) b.classList.add('right');
    else if (j === i) b.classList.add('wrong');
    else b.classList.add('dim');
    if (!right && j === q.ok) b.append(el('span', { class: 'tag-r', text: 'Respuesta correcta' }));
    if (!right && j === i) b.append(el('span', { class: 'tag-r', text: 'Tu respuesta' }));
  });

  var when;
  if (card.ahead) when = 'Repaso adelantado: no cambia cuándo vuelve a salir.' + (!right && !card.repeat ? ' Se repite una vez al final de esta sesión.' : '');
  else if (card.repeat) when = 'Vuelve mañana.';
  else if (!right) when = 'Vuelve mañana y una vez más al final de esta sesión.';
  else {
    var it = state.items[card.item];
    var days = BOX_DAYS[it && it.b > 0 ? Math.min(it.b, 5) : 1];
    when = days === 1 ? 'Vuelve a salir mañana.' : 'Vuelve a salir en ' + days + ' días.';
  }
  var fb = root.querySelector('.fb');
  fb.classList.add(right ? 'good' : 'casi');
  fb.append(
    el('div', { class: 'fb-top' }, el('b', { text: right ? 'Correcto' : 'Casi' }), el('span', { class: 'chip', text: '+' + (right ? XP.right : XP.wrong) + ' XP' })),
    el('p', { class: 'why', text: q.why }),
    el('p', { class: 'small', text: when }));
  var next = el('button', { class: 'ses-next', type: 'button', text: last ? 'Terminar' : 'Siguiente' });
  next.addEventListener('click', function (e) { if (e.detail > 1) return; sesNext(); });
  fb.after(next);
  root.querySelector('.ses-keys').hidden = true;
  sesPaintHead();
  next.scrollIntoView({ block: 'nearest' });
}

function sesNext() {
  var r = sesRun;
  if (!r || r.step !== 'question' || r.answer === null) return;
  if (r.finishedDay || r.idx >= r.queue.length - 1) { sesEnd(); return; }
  r.idx++;
  r.ideaDone = false;
  sesCard(false);
}

function sesEnd() {
  var r = sesRun;
  if (!r.finishedDay) sesFinish(); // no debería pasar: la sesión se cierra al responder la última tarjeta
  r.step = 'end';
  var day = r.finishedDay;
  var line = r.goal;
  var sum = sessionTail(r.after, ESTACIONES, day);
  var deltaPct = Math.round(100 * r.delta);
  var root = screens.sesion;
  root.textContent = '';

  var rows = el('ul', { class: 'ses-sum' });
  var rest = streak(r.after, day).rest.indexOf(addDays(day, -1)) !== -1;
  rows.append(el('li', null, el('span', { class: 'chip', text: 'Racha · ' + plural(sum.streak, 'día', 'días') }),
    rest ? el('span', { class: 'small', text: 'Ayer contó como tu día de descanso de la semana.' }) : null));
  if (line && deltaPct > 0) {
    rows.append(el('li', { class: line.color }, lineBadge(line),
      el('span', { class: 'ses-sum-t' }, el('b', { text: '% listo +' + deltaPct }),
        el('span', { class: 'small', text: 'Tu meta va en ' + pctOf(line) + '%' }))));
  }
  r.visited.forEach(function (id) {
    rows.append(el('li', { class: sesColor(id) }, el('span', { class: 'ses-dot', 'aria-hidden': 'true' }),
      el('span', { class: 'ses-sum-t' }, el('b', { text: 'Estación vista: ' + ESTACIONES[id].name }),
        el('span', { class: 'small', text: 'Ya respondiste todas sus preguntas.' }))));
  });
  rows.append(el('li', null, el('span', { class: 'ses-sum-t' }, el('b', { text: sum.dueTomorrow
    ? 'Mañana tienes ' + plural(sum.dueTomorrow, 'repaso', 'repasos')
    : 'Mañana no tienes repasos pendientes' }))));

  var done = el('button', { class: 'ses-next', type: 'button', text: 'Listo' });
  done.addEventListener('click', function () { sesRun = null; renderHoy(); });
  var actions = el('div', { class: 'ses-actions' }, done);
  if (buildSession(state, todayYmd(), LINEAS, ESTACIONES, { ahead: true }).filter(sesPlayable).length) {
    var more = el('button', { class: 'btn ghost', type: 'button', text: 'Otra sesión' });
    more.addEventListener('click', function () { startSession({ ahead: true }); });
    actions.append(more);
  }
  var h = el('h2', { tabindex: '-1', text: 'Sesión terminada' });
  root.append(el('h1', { class: 'sr-only', text: 'Sesión de estudio' }),
    el('div', { class: 'session-end' }, h,
      el('p', { class: 'ses-xp' }, el('span', { text: '+' + r.xp + ' XP' })),
      el('div', { class: 'card' }, rows), actions));
  sesFocus(h);
}

// Teclado: 1 a 4 responden (solo si la tarjeta no tiene respuesta), Enter avanza y Escape sale.
document.addEventListener('keydown', function (e) {
  if (currentScreen !== 'sesion' || !sesRun || e.ctrlKey || e.metaKey || e.altKey) return;
  var r = sesRun, t = e.target, tag = t && t.tagName;
  if (e.key === 'Escape') { e.preventDefault(); sesExit(); return; }
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key === 'Enter') {
    // En un botón (salvo una opción ya respondida), un enlace o el glosario, Enter hace lo suyo.
    var answeredOpt = tag === 'BUTTON' && t.classList.contains('opt') && r.answer !== null;
    if ((tag === 'BUTTON' && !answeredOpt) || tag === 'A' || tag === 'SUMMARY') return;
    if (e.repeat) { e.preventDefault(); return; }
    if (r.step === 'idea') { e.preventDefault(); sesAfterIdea(); }
    else if (r.step === 'question' && r.answer !== null) { e.preventDefault(); sesNext(); }
    return;
  }
  if (r.step === 'question' && r.answer === null && /^[1-4]$/.test(e.key)) {
    var btns = screens.sesion.querySelectorAll('.opt');
    var n = +e.key;
    if (n <= btns.length) { e.preventDefault(); sesAnswer(n - 1); }
  }
});
