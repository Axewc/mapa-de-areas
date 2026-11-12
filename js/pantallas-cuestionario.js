// Cuestionario de áreas (versión 3, 8 preguntas), resultado corto y Mis respuestas. Se entra desde la entrada, Descubre,
// la tarjeta de Hoy o Mis respuestas. Elegir meta, Hoy, Sesión, Mapa, Línea, Estación, Yo y la vista docente viven en los
// demás pantallas-*.js. Script clásico (ES5). Usa las globales de app.js (storage, session, state, sb).
var body = document.getElementById('quiz-body');
var ticks = document.getElementById('ticks');
var counter = document.getElementById('counter');
var backBtn = document.getElementById('back');
var QUESTIONS = SETS[3].qs;
var answers = [];
var current = 0;
var locked = false;   // true entre un toque y la pregunta siguiente, y desde la última respuesta hasta el próximo startQuiz()
var quizFrom = null;  // pantalla desde la que se empezó: a ella vuelve «← Atrás» en la primera pregunta

// Último resultado en memoria: lo único que queda sin localStorage (se pierde al recargar).
var quizMem = null;
// «Ahora no» de la tarjeta de Hoy, en memoria (sin localStorage no se puede recordar entre visitas).
var tipHidden = false;

// Resultado en pantalla y estado de su guardado en la cuenta (para redibujarlo sin perder el aviso).
var resultShown = null;
var saveText = '';
var saveNode = null;
var saveSeq = 0;
var copyTimer = null;

// Respuestas del último resultado: las del dispositivo si son válidas; si no, las de esta visita; si no, null.
function savedQuiz() {
  var q = loadQuiz(storage, SETS[3]);
  if (q) return q.answers.slice();
  return quizMem ? quizMem.slice() : null;
}

// Olvida el resultado y la tarjeta en memoria («Borrar mis datos», cerrar sesión borrando y borrado desde otra pestaña).
function forgetQuiz() {
  quizMem = null;
  tipHidden = false;
  resultShown = null;
  saveText = '';
  saveNode = null;
  saveSeq++;
}

function sameAnswers(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// ---------- Preguntas ----------
function renderQuestion(focus) {
  var q = QUESTIONS[current];
  counter.textContent = 'Pregunta ' + (current + 1) + ' de ' + QUESTIONS.length;
  ticks.setAttribute('aria-valuenow', String(current));
  ticks.setAttribute('aria-valuemax', String(QUESTIONS.length));
  ticks.textContent = '';
  ticks.style.gridTemplateColumns = 'repeat(' + QUESTIONS.length + ', 1fr)';
  for (var i = 0; i < QUESTIONS.length; i++) ticks.append(el('div', { class: 'tick' + (i < current ? ' done' : '') }));
  body.textContent = '';
  var list = el('div', { class: 'opts' });
  q.opts.forEach(function (o, idx) {
    var b = el('button', { class: 'opt', type: 'button', 'aria-pressed': answers[current] === idx ? 'true' : 'false' }, el('span', { class: 'k', text: String(idx + 1) }), el('span', { text: o.t }));
    b.addEventListener('click', function () { choose(idx, b); });
    list.append(b);
  });
  body.append(el('h1', { text: q.q }), list,
    el('p', { class: 'hint', text: 'Puedes responder con las teclas 1 a ' + q.opts.length + '. Nada de esto te encasilla: es para empezar a explorar.' }));
  if (focus) focusHeading(screens.quiz);
}

document.addEventListener('keydown', function (e) {
  if (currentScreen !== 'quiz' || screens.quiz.hidden || locked || e.ctrlKey || e.metaKey || e.altKey) return;
  var n = parseInt(e.key, 10);
  var btns = body.querySelectorAll('.opt');
  if (n >= 1 && n <= btns.length) btns[n - 1].click();
});

function choose(idx, btn) {
  if (locked) return;
  locked = true;
  answers[current] = idx;
  Array.prototype.forEach.call(body.querySelectorAll('.opt'), function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
  setTimeout(function () {
    if (current < QUESTIONS.length - 1) { locked = false; current++; renderQuestion(true); }
    else withDir('forward', function () { renderResult(answers.slice(), { fresh: true }); }); // locked sigue en true: un solo resultado
  }, 170);
}

// Empieza el cuestionario desde la pregunta 1. Recuerda de qué pantalla se vino.
function startQuiz() {
  quizFrom = currentScreen;
  answers = [];
  current = 0;
  locked = false;
  renderQuestion(false);
  show('quiz');
}

// «← Atrás»: a la pregunta anterior; en la primera, a la pantalla desde la que se empezó.
backBtn.addEventListener('click', function () {
  if (locked) return;
  if (current > 0) { current--; renderQuestion(true); return; }
  withDir('backward', function () {
    if (quizFrom === 'hoy' && lineById(state.goal)) renderHoy();
    else if (quizFrom === 'history' && session) renderHistory();
    else if (quizFrom === 'entrada') renderInicio();
    else renderDescubre();
  });
});

// ---------- Resultado corto ----------
// Línea del mapa como botón-enlace (con su insignia si badge). Abre la pantalla Línea; «← Mapa» vuelve al mapa.
function lineLink(line, label, badge) {
  var b = el('button', { class: 'linkbtn line-link', type: 'button', 'data-line': line.id }, badge ? lineBadge(line) : null, label);
  b.addEventListener('click', function () { withDir('forward', function () { openLinea(line.id, false, 'mapa'); }); });
  return b;
}

// Tarjeta de la línea sugerida: insignia, nivel, título, empresa, «Elegir como meta» (o «Ir a Hoy» si ya es la meta) y «Ver en el mapa».
function suggestedCard(line) {
  var mine = line.id === state.goal;
  var pick = el('button', { class: 'btn', id: 'result-goal', type: 'button', text: mine ? 'Ir a Hoy' : 'Elegir como meta' });
  pick.addEventListener('click', function () {
    if (line.id === state.goal) renderHoy();
    else chooseGoal(line.id, true);
  });
  return el('div', { class: 'line-card sugg ' + line.color, 'data-line': line.id },
    el('span', { class: 'lc-top' }, lineBadge(line),
      el('span', { class: 'lvl' + (line.level === 'Para empezar' ? ' start' : ''), text: line.level }),
      mine ? el('span', { class: 'lvl mine', text: 'Tu meta actual' }) : null),
    el('h3', { class: 'lc-title', text: line.title }),
    el('span', { class: 'lc-meta', text: line.company }),
    el('div', { class: 'actions' }, pick, lineLink(line, 'Ver en el mapa', false)));
}

// Texto que copia «Copiar mi resultado».
function resultSummary(ranked, line) {
  var top = ranked.slice(0, 3).map(function (r, i) { return (i + 1) + ') ' + AREAS[r.key].name + ' (' + r.pct + '%)'; }).join(', ');
  return 'Mi mapa de áreas: ' + top + '.' + (line ? ' Línea sugerida: L' + line.n + ' ' + line.title + ', ' + line.company + '.' : '');
}

// Detalle plegado: afinidad de las 9 áreas, las tres primeras a fondo, las otras seis y los pasos.
function resultMore(ranked, open) {
  var bars = el('div', { class: 'bars' });
  ranked.forEach(function (r, i) {
    var fill = el('div', { class: 'bar-fill' });
    fill.style.width = r.pct + '%';
    bars.append(el('div', { class: 'bar-row' + (i < 3 ? ' top' : '') },
      el('div', { class: 'bar-name', text: AREAS[r.key].name }),
      el('div', { class: 'bar-track' }, fill),
      el('div', { class: 'bar-pct', text: r.pct + '%' })));
  });
  var deep = el('div', { class: 'stack' });
  ranked.slice(0, 3).forEach(function (r) {
    var a = AREAS[r.key];
    var tryList = el('ul', { class: 'projects' });
    a.projects.forEach(function (pr) {
      tryList.append(el('li', null, el('b', { text: pr.n }), ' — ' + pr.d, el('span', { class: 'mono meta', text: 'Tiempo estimado: ' + pr.t })));
    });
    deep.append(el('article', { class: 'area' },
      el('h3', { text: a.name }),
      el('p', { text: a.short }),
      el('div', { class: 'block' }, el('p', { class: 'mono', text: 'Proyectos para probarla' }), tryList),
      el('div', { class: 'block' }, el('p', { class: 'mono', text: 'Materias que ayudan' }), el('p', { text: a.courses })),
      el('div', { class: 'block' }, el('p', { class: 'mono', text: 'Pregunta para alguien que ya trabaja ahí' }), el('p', { class: 'ask', text: a.ask }))));
  });
  var rest = el('div', { class: 'stack' });
  ranked.slice(3).forEach(function (r) {
    rest.append(el('div', { class: 'other' }, el('h3', { text: AREAS[r.key].name }), el('p', { class: 'small', text: AREAS[r.key].short })));
  });
  var steps = el('ol', { class: 'steps' },
    el('li', { text: 'Elige dos áreas de tu lista, aunque una no sea la primera.' }),
    el('li', { text: 'Elige un proyecto corto de cada una (los de un fin de semana son buen comienzo) y haz el primero esta semana.' }),
    el('li', { text: 'Habla con una persona que trabaje en cada área y hazle la pregunta que te dejamos.' }));
  var d = el('details', { class: 'result-more' }, el('summary', { text: 'Ver detalle' }),
    el('div', { class: 'more-body' },
      el('section', { class: 'stack', 'aria-labelledby': 'more-bars-h' }, el('h2', { id: 'more-bars-h', text: 'Afinidad por área' }), bars,
        el('p', { class: 'fine', text: '100% significaría que en cada pregunta elegiste la respuesta que más se parece a esa área.' })),
      el('section', { class: 'stack', 'aria-labelledby': 'more-deep-h' }, el('h2', { id: 'more-deep-h', text: 'Tus tres áreas, a fondo' }), deep),
      el('section', { class: 'stack', 'aria-labelledby': 'more-rest-h' }, el('h2', { id: 'more-rest-h', text: 'Las otras seis áreas' }), rest),
      el('section', { class: 'stack', 'aria-labelledby': 'more-steps-h' }, el('h2', { id: 'more-steps-h', text: 'Cómo usar este resultado' }), steps)));
  if (open) d.open = true;
  return d;
}

// Pie: copiar (con un único role="status" y respaldo seleccionable), volver a hacerlo, Mis respuestas y la línea del guardado.
function resultFooter(summary) {
  var copyStatus = el('span', { class: 'copy-status', id: 'copy-status', role: 'status' });
  var shareBox = el('div', { class: 'share-box' });
  var say = function (text) {
    clearTimeout(copyTimer);
    copyStatus.textContent = text;
    copyTimer = setTimeout(function () { copyStatus.textContent = ''; }, 2000);
  };
  var fallback = function () {
    shareBox.textContent = '';
    var ta = el('textarea', { class: 'share', id: 'share-text', readonly: 'readonly', 'aria-label': 'Tu resultado para copiar' });
    ta.value = summary;
    shareBox.append(ta);
    ta.focus();
    ta.select();
    say('No se pudo copiar. Selecciona el texto de abajo y cópialo.');
  };
  var copyBtn = el('button', { class: 'btn ghost', id: 'copy-result', type: 'button', text: 'Copiar mi resultado' });
  copyBtn.addEventListener('click', function () {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) { fallback(); return; }
      navigator.clipboard.writeText(summary).then(function () { shareBox.textContent = ''; say('Copiado'); }, fallback);
    } catch (e) { fallback(); }
  });
  var again = el('button', { class: 'btn ghost', id: 'quiz-again', type: 'button', text: 'Volver a hacerlo' });
  again.addEventListener('click', function () { withDir('forward', function () { startQuiz(); }); });
  var actions = el('div', { class: 'actions' }, copyBtn, again);
  if (session) {
    var hist = el('button', { class: 'btn ghost', type: 'button', text: 'Mis respuestas' });
    hist.addEventListener('click', function () { withDir('forward', function () { renderHistory(); }); });
    actions.append(hist);
  }
  var foot = el('div', { class: 'result-foot' }, actions, copyStatus, shareBox);
  if (session) {
    saveNode = el('p', { class: 'small', id: 'save-note', 'aria-live': 'polite', text: saveText });
    foot.append(saveNode);
  } else {
    saveNode = null;
    var toYo = el('button', { class: 'linkbtn', type: 'button', text: 'Crear una cuenta en Yo' });
    toYo.addEventListener('click', function () { renderYo(); });
    foot.append(el('p', { class: 'small', id: 'device-note' },
      storage ? 'Tu resultado queda en este dispositivo. Con cuenta lo conservas en todos. ' : 'Este navegador no guarda datos: tu resultado se pierde al cerrar. Con cuenta lo conservas. ',
      toYo));
  }
  return foot;
}

// Guarda el resultado recién terminado: en el dispositivo (o en memoria) y, con sesión, un intento en mapa_respuestas.
function saveResult(ans, ranked) {
  quizMem = ans.slice();
  saveQuiz(storage, ans, Date.now());
  saveText = '';
  var seq = ++saveSeq;
  if (!session) return;
  saveText = 'Guardando tu resultado en tu cuenta…';
  var put = function (t) { if (seq !== saveSeq) return; saveText = t; if (saveNode) saveNode.textContent = t; };
  saveAttempt(ans.slice(), ranked, 3).then(function () {
    put('Guardado en tu cuenta. Lo ves en Mis respuestas.');
  }, function (e) {
    put('No se pudo guardar en tu cuenta (' + (e && e.message ? e.message : 'error') + '). Tu resultado sigue aquí; puedes copiarlo.');
  });
}

// Resultado corto. opts.fresh: recién terminado (guarda e inserta una vez); si no, reabierto desde Descubre (no inserta).
// opts.keep: redibujar la misma pantalla (tras iniciar sesión o sincronizar) sin mover el scroll y conservando el detalle abierto.
function renderResult(ans, opts) {
  var o = opts || {};
  var root = screens.result;
  var same = !o.fresh && sameAnswers(resultShown, ans);
  var oldMore = root.querySelector('details.result-more');
  var wasOpen = !!(o.keep && same && oldMore && oldMore.open);
  if (!same && !o.fresh) { saveText = ''; saveSeq++; }
  resultShown = ans.slice();
  var ranked = scoreAnswers(ans, 3);
  if (o.fresh) saveResult(ans, ranked);
  var top = AREAS[ranked[0].key];
  var sugg = suggestLine(ranked, LINEAS);
  var line = sugg.line ? lineById(sugg.line) : null;
  root.textContent = '';

  root.append(el('div', { class: 'hub-title' },
    el('p', { class: 'mono', text: 'Tu resultado' }),
    el('h1', { text: top.name }),
    el('p', { text: top.short })));

  var why = el('ul', { class: 'why-list' });
  whyAnswers(SETS[3], ans, ranked[0].key).forEach(function (i) {
    why.append(el('li', { title: QUESTIONS[i].q, text: QUESTIONS[i].opts[ans[i]].t }));
  });
  root.append(el('section', { class: 'stack tight', 'aria-labelledby': 'why-h' }, el('h2', { id: 'why-h', text: 'Por qué te salió' }),
    el('p', { class: 'small', text: 'Las dos respuestas que más te acercaron a esta área:' }), why));

  var lineSec = el('section', { class: 'stack tight', 'aria-labelledby': 'sugg-h' }, el('h2', { id: 'sugg-h', text: 'Tu línea sugerida' }));
  if (line && !sugg.exact) lineSec.append(el('p', { class: 'small', id: 'no-vacancy', text: ranked[0].key === 'inv'
    ? 'Aún no tenemos una vacante de investigación; esta línea es la más cercana.'
    : 'Aún no tenemos una vacante de ' + top.name.toLowerCase() + '; esta línea es la más cercana.' }));
  lineSec.append(line ? suggestedCard(line) : el('p', { class: 'small', text: 'Por ahora no hay vacantes para tus áreas.' }));
  root.append(lineSec);

  var others = el('ul', { class: 'res-others' });
  ranked.slice(1, 3).forEach(function (r) {
    var a = AREAS[r.key];
    var lid = lineForArea(r.key, LINEAS);
    var l = lid ? lineById(lid) : null;
    others.append(el('li', { class: 'res-other' },
      el('h3', { text: a.name }),
      el('p', { class: 'small one-line', text: a.short }),
      l ? lineLink(l, l.title, true) : el('p', { class: 'small', text: 'Aún sin vacante en el mapa.' })));
  });
  root.append(el('section', { class: 'stack tight', 'aria-labelledby': 'others-h2' }, el('h2', { id: 'others-h2', text: 'Tus otras dos áreas' }), others));

  root.append(el('p', { class: 'fine', text: 'Es una afinidad para empezar a explorar, no un veredicto.' }));
  root.append(resultMore(ranked, wasOpen));
  root.append(resultFooter(resultSummary(ranked, line)));
  show('result', !!o.keep);
}


function saveAttempt(ans, ranked, v) {
  if (!session) return Promise.reject(new Error('no hay sesión'));
  var scores = {};
  ranked.forEach(function (r) { scores[r.key] = r.pct; });
  return sb.from('mapa_respuestas').insert({ answers: ans, scores: scores, quiz_version: v }).then(function (r) { if (r.error) throw r.error; });
}


function topOf(scores) {
  return Object.keys(AREAS).map(function (k, i) { return { key: k, pct: scores[k] || 0, idx: i }; })
    .sort(function (a, b) { return b.pct - a.pct || a.idx - b.idx; });
}

function topLine(scores) {
  return topOf(scores).slice(0, 3).map(function (r, i) { return (i + 1) + ') ' + AREAS[r.key].name; }).join('   ');
}

// Preguntas y respuestas de un intento guardado; v es su quiz_version (1, 2 o 3; otra cosa se lee como 1).
function qaList(ans, v) {
  var ul = el('ul', { class: 'qa' });
  var qs = (SETS[v] || SETS[1]).qs;
  ans.forEach(function (c, i) {
    var q = qs[i];
    if (!q || !q.opts[c]) return;
    ul.append(el('li', null, el('p', { class: 'q', text: q.q }), el('p', { class: 'a', text: q.opts[c].t })));
  });
  return ul;
}


function renderHistory() {
  var root = screens.history;
  root.textContent = '';
  root.append(navBack(), el('p', { class: 'status', text: 'Cargando tus respuestas…' }));
  show('history');
  sb.from('mapa_respuestas').select('id,created_at,answers,scores,quiz_version').eq('user_id', session.user.id).order('created_at', { ascending: false }).then(function (r) {
    root.textContent = '';
    root.append(navBack());
    if (r.error) { root.append(el('div', { class: 'note', text: 'No se pudieron cargar tus respuestas: ' + r.error.message })); return; }
    var rows = r.data || [];
    root.append(el('div', null,
      el('p', { class: 'mono', text: 'Tu historial' }),
      el('h1', { text: 'Mis respuestas' }),
      el('p', { class: 'sub', text: rows.length ? 'Cada intento queda guardado con su fecha. Compara cómo cambian tus áreas a medida que pruebas cosas.' : 'Todavía no has terminado el cuestionario.' })
    ));
    if (!rows.length) {
      var go = el('button', { class: 'btn', type: 'button', text: 'Hacer el cuestionario' });
      go.addEventListener('click', function () { withDir('forward', function () { startQuiz(); }); });
      root.append(el('div', null, go));
      return;
    }
    var asc = rows.slice().reverse();
    var latest = topOf(rows[0].scores);
    var thead = el('tr', null, el('th', { text: 'Área' }));
    asc.forEach(function (row) { thead.append(el('th', { text: new Date(row.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) })); });
    var tbody = el('tbody');
    latest.forEach(function (a) {
      var tr = el('tr', null, el('td', { text: AREAS[a.key].name }));
      asc.forEach(function (row) {
        var t3 = topOf(row.scores).slice(0, 3).map(function (x) { return x.key; });
        tr.append(el('td', { class: 'num' + (t3.indexOf(a.key) !== -1 ? ' hi' : ''), text: ((row.scores[a.key] || 0)) + '%' }));
      });
      tbody.append(tr);
    });
    root.append(el('div', null,
      el('div', { class: 'tablewrap' }, el('table', null, el('thead', null, thead), tbody)),
      el('p', { class: 'legend', text: 'El fondo resaltado marca las tres áreas con más afinidad en cada intento.' })
    ));
    var list = el('div', { class: 'attempts' });
    rows.forEach(function (row) {
      var del = el('button', { class: 'btn ghost', type: 'button', text: 'Borrar este intento' });
      var armed = false;
      del.addEventListener('click', function () {
        if (!armed) { armed = true; del.textContent = 'Confirmar borrado'; return; }
        del.disabled = true;
        sb.from('mapa_respuestas').delete().eq('id', row.id).then(function (d) {
          if (d.error) { del.disabled = false; del.textContent = 'No se pudo borrar. Intentar de nuevo'; armed = false; }
          else renderHistory();
        });
      });
      list.append(el('details', { class: 'attempt' },
        el('summary', null, el('span', { class: 'mono when', text: fmtDate(row.created_at) + ' · ' + (SETS[row.quiz_version] || SETS[1]).name }), topLine(row.scores)),
        qaList(row.answers, row.quiz_version),
        el('div', { class: 'bar-tools' }, del)
      ));
    });
    root.append(el('div', null, el('p', { class: 'mono', text: 'Cada intento' }), el('div', { style: 'height:10px' }), list));
    var again = el('button', { class: 'btn', type: 'button', text: 'Hacer el cuestionario otra vez' });
    again.addEventListener('click', function () { withDir('forward', function () { startQuiz(); }); });
    root.append(el('div', null, again));
  });
}
