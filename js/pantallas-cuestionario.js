// Cuestionario, resultado, Mis respuestas, vista docente y rutas por vacante.
var body = document.getElementById('quiz-body');
var ticks = document.getElementById('ticks');
var counter = document.getElementById('counter');
var backBtn = document.getElementById('back');
var version = 1;
var QUESTIONS = SETS[1].qs;
var answers = [];
var current = 0;
var locked = false;
var mode = 'mapa';   // 'mapa' (cuestionario de áreas) o 'diag' (diagnóstico de una ruta)
var diagRuta = null;

// Selector de versión del cuestionario (en #s-intro).
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
function openIntro() { drawModes(); show('intro'); }


function pad(n) { return (n < 10 ? '0' : '') + n; }

function renderQuestion() {
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
  body.append(el('h2', { text: q.q }), list);
  if (version === 1 || mode === 'diag') {
    var g = glossFor([q.q].concat(q.opts.map(function (o) { return o.t; })), '¿Hay términos que no conoces? Aquí se explican');
    if (g) body.append(g);
  }
  body.append(el('p', { class: 'hint', text: mode === 'diag'
    ? 'Puedes responder con las teclas 1 a ' + q.opts.length + '. Si no lo sabes, elige «' + NO_SE + '»: te sirve más que adivinar.'
    : 'Puedes responder con las teclas 1 a ' + q.opts.length + '. Nada de esto te encasilla: es para empezar a explorar.' }));
}

document.addEventListener('keydown', function (e) {
  if (screens.quiz.hidden || locked || e.ctrlKey || e.metaKey || e.altKey) return;
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
    locked = false;
    if (current < QUESTIONS.length - 1) { current++; renderQuestion(); }
    else if (mode === 'diag') renderDiagResult(diagRuta, answers.slice());
    else renderResult();
  }, 170);
}

function renderResult() {
  var ranked = scoreAnswers(answers, version);
  var top = ranked.slice(0, 3);
  var unsure = answers.some(function (c, i) { return QUESTIONS[i].opts[c].unsure; });
  var root = screens.result;
  root.textContent = '';

  var head = el('div', null,
    el('p', { class: 'mono', text: 'Tu resultado' }),
    el('h1', { text: 'Tres áreas para probar primero' }),
    el('p', { class: 'sub', text: 'Esto ordena las áreas según qué tanto coinciden tus respuestas con lo que cada una suele pedir. Sirve para empezar a explorar, no para decidir tu carrera.' })
  );
  root.append(head);
  var saveNote = el('div', { class: 'note', 'aria-live': 'polite', text: 'Guardando tu resultado…' });
  root.append(saveNote);
  saveAttempt(answers.slice(), ranked, version).then(function () {
    saveNote.textContent = 'Guardado. Puedes volver a verlo en Mis respuestas.';
  }).catch(function (e) {
    saveNote.textContent = 'No se pudo guardar tu resultado (' + (e && e.message ? e.message : 'error') + '). Usa el botón Copiar mi resultado para no perderlo.';
  });

  var notes = [];
  if (top[0].pct - top[2].pct <= 10) notes.push('Tus tres primeras áreas están muy cerca. Es lo normal en quinto semestre y significa que conviene probar dos de ellas antes de inclinarte por una.');
  else if (top[0].pct - top[1].pct >= 15) notes.push('Una de tus áreas se separa claramente de las demás. Aun así, prueba la segunda con un proyecto pequeño para comparar.');
  if (unsure) notes.push('Dijiste que aún no sabes qué sector te interesa. Eso es común y no te retrasa: lo que más ayuda es hacer un proyecto pequeño en dos áreas y ver cuál te deja con ganas de seguir.');
  notes.forEach(function (t) { root.append(el('div', { class: 'note', text: t })); });

  var bars = el('div', { class: 'bars' });
  ranked.forEach(function (r, i) {
    var fill = el('div', { class: 'bar-fill' });
    fill.style.width = r.pct + '%';
    bars.append(el('div', { class: 'bar-row' + (i < 3 ? ' top' : '') },
      el('div', { class: 'bar-name', text: AREAS[r.key].name }),
      el('div', { class: 'bar-track' }, fill),
      el('div', { class: 'bar-pct', text: r.pct + '%' })
    ));
  });
  root.append(el('div', { class: 'panel' },
    el('p', { class: 'mono', text: 'Afinidad por área' }),
    el('div', { style: 'height:14px' }),
    bars,
    el('p', { class: 'legend', text: '100% significaría que en cada pregunta elegiste la respuesta que más se parece a esa área.' })
  ));

  var labels = ['Mejor coincidencia', 'Segunda', 'Tercera'];
  var cards = el('div', { class: 'cards' });
  top.forEach(function (r, i) {
    var a = AREAS[r.key];
    var tryList = el('ul', { class: 'projects' });
    a.projects.forEach(function (pr) {
      tryList.append(el('li', null, el('b', { text: pr.n }), ' — ' + pr.d, el('span', { class: 'mono meta', text: 'Tiempo estimado: ' + pr.t })));
    });
    cards.append(el('article', { class: 'panel area' },
      el('p', { class: 'mono rank' }, el('mark', { text: labels[i] })),
      el('h3', { text: a.name }),
      el('div', { class: 'block' }, el('p', { class: 'mono', text: 'Qué haces' }), el('p', { text: a.short })),
      el('div', { class: 'block' }, el('p', { class: 'mono', text: 'Pregunta para alguien que ya trabaja ahí' }), el('p', { class: 'ask', text: a.ask })),
      el('div', { class: 'block' }, el('p', { class: 'mono', text: 'Proyectos para probarla' }), tryList),
      el('div', { class: 'block' }, el('p', { class: 'mono', text: 'Materias que ayudan' }), el('p', { text: a.courses }))
    ));
  });
  root.append(cards);
  var projTexts = [];
  top.forEach(function (r) { AREAS[r.key].projects.forEach(function (pr) { projTexts.push(pr.n + ' ' + pr.d); }); });
  var gl = glossFor(projTexts, 'Palabras de los proyectos que quizá no conozcas');
  if (gl) { gl.style.marginTop = '0'; root.append(gl); }

  rutasFor(top.map(function (r) { return r.key; })).forEach(function (id) {
    var ru = RUTAS[id];
    var go = el('button', { class: 'btn', type: 'button', text: 'Ver qué piden y aprenderlo' });
    go.addEventListener('click', function () { openRuta(id); });
    root.append(el('article', { class: 'panel area vacancy' },
      el('p', { class: 'mono rank' }, el('mark', { text: 'Una vacante real para tus áreas' })),
      el('h3', { text: ru.title + ' · ' + ru.company }),
      el('p', { text: ru.summary }),
      el('div', null, go)
    ));
  });

  var others = el('details', { class: 'panel others' }, el('summary', { text: 'Ver las otras seis áreas' }));
  ranked.slice(3).forEach(function (r) {
    others.append(el('div', { class: 'other' }, el('h3', { text: AREAS[r.key].name }), el('p', { text: AREAS[r.key].short })));
  });
  root.append(others);

  var steps = el('ol', { class: 'steps' },
    el('li', { text: 'Elige dos áreas de tu lista, aunque una no sea la primera.' }),
    el('li', { text: 'Elige un proyecto corto de cada una (los de un fin de semana son buen comienzo) y haz el primero esta semana.' }),
    el('li', { text: 'Habla con una persona que trabaje en cada área y hazle la pregunta que te dejamos.' })
  );
  root.append(el('div', { class: 'panel' }, el('h2', { text: 'Cómo usar este resultado', style: 'font-size:1.35rem;margin-bottom:1rem' }), steps));

  var summary = 'Mi mapa de áreas: ' + top.map(function (r, i) { return (i + 1) + ') ' + AREAS[r.key].name + ' (' + r.pct + '%)'; }).join('  ');
  var status = el('p', { class: 'status', 'aria-live': 'polite' });
  var shareBox = el('div', null);
  var copyBtn = el('button', { class: 'btn', type: 'button', text: 'Copiar mi resultado' });
  copyBtn.addEventListener('click', function () {
    var done = function () { status.textContent = 'Copiado. Puedes pegarlo en un mensaje.'; };
    var fallback = function () {
      shareBox.textContent = '';
      var ta = el('textarea', { class: 'share', id: 'share-text', readonly: 'readonly' });
      ta.value = summary;
      shareBox.append(ta);
      ta.focus(); ta.select();
      status.textContent = 'Selecciona el texto y cópialo.';
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(summary).then(done, fallback);
      else fallback();
    } catch (e) { fallback(); }
  });
  var again = el('button', { class: 'btn ghost', type: 'button', text: 'Volver a empezar' });
  again.addEventListener('click', reset);
  var other = version === 1 ? 2 : 1;
  var otherBtn = el('button', { class: 'btn ghost', type: 'button', text: 'Probar la versión «' + SETS[other].name + '»' });
  otherBtn.addEventListener('click', function () { startQuiz(other); });
  var histBtn = el('button', { class: 'btn ghost', type: 'button', text: 'Mis respuestas' });
  histBtn.addEventListener('click', renderHistory);
  root.append(el('div', { class: 'footer-actions' }, copyBtn, otherBtn, histBtn, again), status, shareBox);

  show('result');
}

function setVersion(v) { version = v; QUESTIONS = SETS[v].qs; }
function startQuiz(v) { mode = 'mapa'; setVersion(v); answers = []; current = 0; locked = false; renderQuestion(); show('quiz'); }
function reset() { answers = []; current = 0; locked = false; show('intro'); }


function saveAttempt(ans, ranked, v) {
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
      go.addEventListener('click', function () { startQuiz(chosen); });
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
    again.addEventListener('click', function () { startQuiz(chosen); });
    root.append(el('div', null, again));
  });
}

function renderAdmin() {
  var root = screens.admin;
  root.textContent = '';
  root.append(navBack(), el('p', { class: 'status', text: 'Cargando respuestas…' }));
  show('admin');
  sb.from('mapa_respuestas').select('id,email,created_at,answers,scores,quiz_version').order('created_at', { ascending: false }).limit(1000).then(function (r) {
    root.textContent = '';
    root.append(navBack());
    if (r.error) { root.append(el('div', { class: 'note', text: 'No se pudieron cargar las respuestas: ' + r.error.message })); return; }
    var rows = r.data || [];
    var people = {};
    rows.forEach(function (x) { people[x.email] = (people[x.email] || 0) + 1; });
    root.append(el('div', null,
      el('p', { class: 'mono', text: 'Vista docente' }),
      el('h1', { text: 'Respuestas del grupo' }),
      el('p', { class: 'sub', text: rows.length + ' intentos de ' + Object.keys(people).length + ' personas. Esta vista solo aparece con tu cuenta.' })
    ));
    var filter = el('input', { class: 'field', id: 'admin-filter', type: 'search', placeholder: 'Filtrar por correo', autocomplete: 'off' });
    var list = el('div', { class: 'attempts' });
    var rlist = el('div', { class: 'attempts ruta-attempts' });
    var rrows = null, rerr = null;
    sb.from('mapa_aprendizaje').select('id,email,created_at,ruta,kind,topic,scores').order('created_at', { ascending: false }).limit(1000).then(function (r2) {
      rerr = r2.error; rrows = r2.data || []; drawRutas();
    });
    function drawRutas() {
      rlist.textContent = '';
      if (rerr) { rlist.append(el('div', { class: 'note', text: 'No se pudieron cargar las rutas: ' + rerr.message })); return; }
      if (!rrows) { rlist.append(el('p', { class: 'status', text: 'Cargando…' })); return; }
      var q = filter.value.trim().toLowerCase();
      var shown = rrows.filter(function (x) { return !q || x.email.indexOf(q) !== -1; });
      if (!shown.length) { rlist.append(el('p', { class: 'status', text: 'Sin resultados.' })); return; }
      shown.forEach(function (x) {
        // Las filas vienen de la base: ruta y topic pueden traer cualquier texto, incluso «constructor».
        var ru = hasOwn(RUTAS, x.ruta) ? RUTAS[x.ruta] : null, line, detail = null;
        if (x.kind === 'diagnostico') {
          var known = ru ? ru.topics.filter(function (t) { return t.id in x.scores; }) : [];
          line = 'Domina ' + known.filter(function (t) { return x.scores[t.id]; }).length + ' de ' + (ru ? ru.topics.length : known.length);
          detail = el('ul', { class: 'qa' });
          known.forEach(function (t) { detail.append(el('li', null, el('p', { class: 'a', text: (x.scores[t.id] ? '✓ ' : '✗ ') + t.name }))); });
        } else {
          var tp = ru ? ru.topics.filter(function (t) { return t.id === x.topic; })[0] : null;
          line = (tp ? tp.name : x.topic) + ': ' + (hasOwn(x.scores, x.topic) ? Number(x.scores[x.topic]) || 0 : 0) + ' de ' + (tp ? tp.review.length : 2);
        }
        rlist.append(el('details', { class: 'attempt' },
          el('summary', null, el('span', { class: 'mono when', text: x.email + ' · ' + fmtDate(x.created_at) + ' · ' + (ru ? ru.title : x.ruta) + ' · ' + (x.kind === 'diagnostico' ? 'Diagnóstico' : 'Repaso') }), line),
          detail
        ));
      });
    }
    function draw() {
      var q = filter.value.trim().toLowerCase();
      list.textContent = '';
      var shown = rows.filter(function (x) { return !q || x.email.indexOf(q) !== -1; });
      if (!shown.length) list.append(el('p', { class: 'status', text: 'Sin resultados.' }));
      shown.forEach(function (x) {
        list.append(el('details', { class: 'attempt' },
          el('summary', null, el('span', { class: 'mono when', text: x.email + ' · ' + fmtDate(x.created_at) + ' · ' + (SETS[x.quiz_version] || SETS[1]).name }), topLine(x.scores)),
          qaList(x.answers, x.quiz_version)
        ));
      });
      drawRutas(); // después de la lista del cuestionario, para que una falla aquí no la deje sin filtrar
    }
    filter.addEventListener('input', draw);
    draw();
    root.append(filter, list, el('div', null,
      el('p', { class: 'mono', text: 'Rutas por vacante' }),
      el('div', { style: 'height:10px' }), rlist
    ));
  });
}

// ---------- Rutas por vacante ----------
var STATE_LABEL = { nuevo: 'Sin evaluar', pendiente: 'Por aprender', dominado: 'Ya lo dominas' };

function loadRutaRows(id) {
  if (!session) return Promise.reject(new Error('no hay sesión'));
  return sb.from('mapa_aprendizaje').select('id,created_at,kind,topic,answers,scores')
    .eq('user_id', session.user.id).eq('ruta', id).order('created_at', { ascending: false })
    .then(function (r) { if (r.error) throw r.error; return r.data || []; });
}

// La ruta espera el último guardado antes de leer, para no mostrar un estado viejo.
var lastSave = Promise.resolve();
function saveRutaRow(row) {
  var p = sb.from('mapa_aprendizaje').insert(row).then(function (r) { if (r.error) throw r.error; });
  lastSave = p.catch(function () {});
  return p;
}

function deleteRutaRows(id) {
  if (!session) return Promise.reject(new Error('no hay sesión'));
  return sb.from('mapa_aprendizaje').delete().eq('user_id', session.user.id).eq('ruta', id)
    .then(function (r) { if (r.error) throw r.error; });
}


function evidenceText(st, topic) {
  if (st.kind === 'diagnostico') return st.score ? 'Diagnóstico: acertaste' : 'Diagnóstico: no acertaste';
  if (st.kind === 'repaso') return 'Último repaso: ' + st.score + ' de ' + topic.review.length;
  return '';
}



function openRuta(id) {
  var root = screens.learn;
  root.textContent = '';
  root.append(navBack(), el('p', { class: 'status', text: 'Cargando tu progreso…' }));
  show('learn');
  lastSave.then(function () { return loadRutaRows(id); }).then(function (rows) { drawRuta(id, rows, null); }, function (e) { drawRuta(id, [], e); });
}

function drawRuta(id, rows, err) {
  var r = RUTAS[id], root = screens.learn;
  var status = topicStatus(r, rows);
  var hasDiag = rows.some(function (x) { return x.kind === 'diagnostico'; });
  root.textContent = '';
  root.append(navBack(), el('div', null,
    el('p', { class: 'mono', text: 'Ruta por vacante' }),
    el('h1', { text: r.title }),
    el('p', { class: 'sub', text: r.company + ' · ' + r.place }),
    el('p', { class: 'sub', text: r.summary })
  ));
  var asks = el('ul', { class: 'asks' });
  r.asks.forEach(function (a) { asks.append(el('li', { text: a })); });
  root.append(el('div', { class: 'panel area' },
    el('p', { class: 'mono', text: 'Lo que pide la vacante' }), asks,
    el('p', { class: 'legend' }, extLink(r.url, 'Ver la vacante original'), ' · leída el ' + fmtDay(r.seen))
  ));
  if (err) root.append(el('div', { class: 'note', text: 'No se pudo cargar tu progreso (' + (err.message || 'error') + '). Los temas aparecen sin evaluar.' }));

  var diagBtn = el('button', { class: 'btn', type: 'button', text: hasDiag ? 'Repetir el diagnóstico' : 'Hacer el diagnóstico' });
  diagBtn.addEventListener('click', function () { startDiag(id); });
  root.append(el('div', { class: 'panel area' },
    el('h2', { text: 'Diagnóstico', style: 'font-size:1.35rem' }),
    el('p', { text: 'Una pregunta por tema para saber por dónde empezar. Si no sabes una, elige «' + NO_SE + '»: te sirve más que adivinar.' }),
    el('p', { class: 'mono', text: r.topics.length + ' preguntas · 4 minutos · sí hay respuestas correctas' }),
    el('div', null, diagBtn)
  ));

  var order = r.topics.map(function (t, i) { return { t: t, i: i }; });
  if (hasDiag) order.sort(function (a, b) {
    return ((status[a.t.id].state === 'pendiente' ? 0 : 1) - (status[b.t.id].state === 'pendiente' ? 0 : 1)) || a.i - b.i;
  });
  var list = el('div', { class: 'topics' });
  order.forEach(function (o) {
    var st = status[o.t.id], ev = evidenceText(st, o.t);
    var b = el('button', { class: 'topic-row', type: 'button' },
      el('span', { class: 'tname' }, o.t.name, ev ? el('span', { class: 'ev', text: ev }) : null),
      el('span', { class: 'state ' + st.state, text: STATE_LABEL[st.state] })
    );
    b.addEventListener('click', function () { renderTopic(id, o.t.id); });
    list.append(b);
  });
  root.append(el('div', null,
    el('p', { class: 'mono', text: 'Los ' + r.topics.length + ' temas' + (hasDiag ? ' · primero los que te faltan' : '') }),
    el('div', { style: 'height:10px' }), list
  ));

  if (rows.length) {
    var del = el('button', { class: 'btn ghost', type: 'button', text: 'Borrar mi progreso en esta ruta' });
    var armed = false;
    del.addEventListener('click', function () {
      if (!armed) { armed = true; del.textContent = 'Confirmar borrado'; return; }
      del.disabled = true;
      deleteRutaRows(id).then(function () { openRuta(id); }, function () {
        del.disabled = false; armed = false; del.textContent = 'No se pudo borrar. Intentar de nuevo';
      });
    });
    root.append(el('div', { class: 'bar-tools' }, del));
  }
}

function startDiag(id) {
  mode = 'diag';
  diagRuta = id;
  QUESTIONS = RUTAS[id].topics.map(function (t) {
    return { q: t.diag.q, opts: t.diag.opts.map(function (o) { return { t: o }; }).concat([{ t: NO_SE }]) };
  });
  answers = []; current = 0; locked = false;
  renderQuestion();
  show('quiz');
}

function saveNoteFor(promise, okText) {
  var note = el('div', { class: 'note', 'aria-live': 'polite', text: 'Guardando…' });
  promise.then(function () { note.textContent = okText; }).catch(function (e) {
    note.textContent = 'No se pudo guardar tu resultado (' + (e && e.message ? e.message : 'error') + '). Puedes intentarlo de nuevo más tarde.';
  });
  return note;
}

function renderDiagResult(id, ans) {
  var r = RUTAS[id], scores = scoreDiag(r, ans), root = screens.learn;
  var n = r.topics.filter(function (t) { return scores[t.id]; }).length;
  var list = el('div', { class: 'attempts' });
  r.topics.forEach(function (t, i) {
    var mine = ans[i] === t.diag.opts.length ? NO_SE : t.diag.opts[ans[i]];
    list.append(el('details', { class: 'attempt' },
      el('summary', null, el('span', { class: 'mono when', text: scores[t.id] ? 'Acertaste' : 'Por aprender' }), t.name),
      el('ul', { class: 'qa' },
        el('li', null, el('p', { class: 'q', text: 'Pregunta' }), el('p', { text: t.diag.q })),
        el('li', null, el('p', { class: 'q', text: 'Tu respuesta' }), el('p', { class: 'a', text: mine })),
        scores[t.id] ? null : el('li', null, el('p', { class: 'q', text: 'La correcta' }), el('p', { class: 'a', text: t.diag.opts[t.diag.ok] })),
        el('li', null, el('p', { class: 'q', text: 'Por qué' }), el('p', { text: t.diag.why }))
      )
    ));
  });
  var back = el('button', { class: 'btn', type: 'button', text: 'Volver a la ruta' });
  back.addEventListener('click', function () { openRuta(id); });
  root.textContent = '';
  root.append(navBack(),
    el('div', { class: 'diag-result' },
      el('p', { class: 'mono', text: 'Diagnóstico · ' + r.title }),
      el('h1', { text: 'Dominas ' + n + ' de ' + r.topics.length }),
      el('p', { class: 'sub', text: n === r.topics.length
        ? 'Acertaste en todos los temas. Haz el repaso de cada uno para confirmarlo.'
        : 'Empieza por los temas marcados «Por aprender». Cada uno trae una explicación, un ejercicio y dos preguntas de repaso.' })
    ),
    saveNoteFor(saveRutaRow({ ruta: id, kind: 'diagnostico', topic: null, answers: ans, scores: scores }), 'Guardado. Lo verás en la ruta.'),
    el('div', null, el('p', { class: 'mono', text: 'Tema por tema' }), el('div', { style: 'height:10px' }), list),
    el('div', null, back)
  );
  show('learn');
}

function renderTopic(id, topicId) {
  var r = RUTAS[id], root = screens.learn;
  var idx = r.topics.map(function (x) { return x.id; }).indexOf(topicId), t = r.topics[idx];
  var toRuta = function () { openRuta(id); };

  var stateTag = el('span', { class: 'state nuevo', text: STATE_LABEL.nuevo });
  var refreshState = function () {
    lastSave.then(function () { return loadRutaRows(id); }).then(function (rows) {
      var st = topicStatus(r, rows)[t.id];
      stateTag.className = 'state ' + st.state;
      stateTag.textContent = STATE_LABEL[st.state];
    }, function () {});
  };
  refreshState();

  var ideas = el('ul');
  t.ideas.forEach(function (x) { ideas.append(el('li', { text: x })); });
  var res = el('ul');
  t.res.forEach(function (x) { res.append(el('li', null, extLink(x.u, x.n))); });
  var block = function (label) {
    var b = el('div', { class: 'block' }, el('p', { class: 'mono', text: label }));
    for (var i = 1; i < arguments.length; i++) b.append(arguments[i]);
    return b;
  };

  var top = el('button', { class: 'linkbtn', type: 'button', text: '← La ruta' });
  top.addEventListener('click', toRuta);
  var back = el('button', { class: 'btn ghost', type: 'button', text: 'Volver a la ruta' });
  back.addEventListener('click', toRuta);

  var lesson = el('article', { class: 'lesson' },
    el('div', null,
      el('p', { class: 'mono', text: r.title + ' · tema ' + (idx + 1) + ' de ' + r.topics.length }),
      el('h1', { text: t.name }),
      stateTag
    ),
    el('div', { class: 'panel area' },
      block('Qué es', el('p', { text: t.plain })),
      block('Por qué le importa a una empresa de pagos', el('p', { text: t.why })),
      block('Ideas clave', ideas)
    ),
    el('div', { class: 'panel area' },
      block('Ejercicio para una tarde', el('ul', { class: 'projects' },
        el('li', null, el('b', { text: t.task.n }), ' — ' + t.task.d, el('span', { class: 'mono meta', text: 'Tiempo estimado: ' + t.task.t }))
      )),
      block('Para leer más', res)
    )
  );
  var gl = glossFor([t.plain, t.why, t.task.d].concat(t.ideas), 'Palabras que quizá no conozcas');
  if (gl) { gl.style.marginTop = '0'; lesson.append(gl); }
  lesson.append(drawReview(id, t, refreshState), el('div', { class: 'footer-actions' }, back));

  root.textContent = '';
  root.append(el('div', { class: 'topnav' }, top), lesson);
  show('learn');
}

// onSaved se llama cuando el repaso quedó guardado, para actualizar la etiqueta de estado del tema.
function drawReview(id, t, onSaved) {
  var box = el('div', { class: 'panel review' });
  var picks = [];
  var finished = false;
  var groups = t.review.map(function (q, qi) {
    var opts = el('div', { class: 'opts' });
    var btns = q.opts.map(function (o, oi) {
      var b = el('button', { class: 'opt', type: 'button', 'aria-pressed': 'false' }, el('span', { class: 'k', text: String(oi + 1) }), el('span', { text: o }));
      b.addEventListener('click', function () {
        if (finished) return;
        picks[qi] = oi;
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var done = 0;
        for (var i = 0; i < t.review.length; i++) if (picks[i] !== undefined) done++;
        if (done === t.review.length) finish();
      });
      opts.append(b);
      return b;
    });
    var rq = el('div', { class: 'rq' }, el('p', { class: 'qtext', text: (qi + 1) + '. ' + q.q }), opts);
    return { rq: rq, btns: btns, q: q };
  });
  function finish() {
    finished = true;
    var scores = scoreReview(t, picks);
    groups.forEach(function (g, qi) {
      g.btns.forEach(function (b, oi) {
        b.disabled = true;
        if (oi === g.q.ok) { b.classList.add('right'); b.append(el('span', { class: 'tag-r', text: 'Correcta' })); }
        else if (oi === picks[qi]) { b.classList.add('wrong'); b.append(el('span', { class: 'tag-r', text: 'Tu respuesta' })); }
      });
      g.rq.append(el('p', { class: 'why', text: g.q.why }));
    });
    var again = el('button', { class: 'btn ghost', type: 'button', text: 'Repetir el repaso' });
    again.addEventListener('click', function () { box.replaceWith(drawReview(id, t, onSaved)); });
    var saving = saveRutaRow({ ruta: id, kind: 'repaso', topic: t.id, answers: picks.slice(), scores: scores });
    saving.then(function () { if (onSaved) onSaved(); }, function () {});
    // El botón presionado queda deshabilitado; el foco pasa al veredicto para no perder el lugar.
    var verdict = el('p', { class: 'verdict', tabindex: '-1', text: scores[t.id] + ' de ' + t.review.length + (scores[t.id] === t.review.length ? ' · ya lo dominas' : ' · sigue practicando') });
    box.append(verdict, saveNoteFor(saving, 'Guardado. El estado del tema ya se actualizó.'), el('div', null, again));
    verdict.focus();
  }
  box.append(el('h2', { text: 'Repaso: ' + t.review.length + ' preguntas', style: 'font-size:1.35rem;margin-bottom:0.4rem' }),
    el('p', { class: 'legend', text: 'Responde las dos y verás cuáles acertaste. Con ' + t.review.length + ' de ' + t.review.length + ', el tema queda como dominado.', style: 'margin:0 0 1.25rem' }));
  groups.forEach(function (g) { box.append(g.rq); });
  return box;
}

// Con una sola ruta se abre directo; con varias, se muestra la lista.
function openLearn() {
  var ids = Object.keys(RUTAS);
  if (ids.length === 1) { openRuta(ids[0]); return; }
  var list = el('div', { class: 'topics ruta-list' });
  ids.forEach(function (id) {
    var ru = RUTAS[id];
    var b = el('button', { class: 'topic-row', type: 'button' },
      el('span', { class: 'tname' }, ru.title + ' · ' + ru.company, el('span', { class: 'ev', text: ru.summary })),
      el('span', { class: 'state', text: ru.topics.length + ' temas' })
    );
    b.addEventListener('click', function () { openRuta(id); });
    list.append(b);
  });
  var root = screens.learn;
  root.textContent = '';
  root.append(navBack(), el('div', null,
    el('p', { class: 'mono', text: 'Rutas por vacante' }),
    el('h1', { text: 'Elige una vacante' }),
    el('p', { class: 'sub', text: 'Cada ruta toma una vacante real y te enseña los temas que pide, con un diagnóstico para saber por dónde empezar.' })
  ), list);
  show('learn');
}

document.getElementById('start').addEventListener('click', function () { startQuiz(chosen); });
// En la primera pregunta, «Atrás» regresa a la presentación del cuestionario.
backBtn.addEventListener('click', function () {
  if (locked) return;
  if (current > 0) { current--; renderQuestion(); } else show('intro');
});
document.getElementById('intro-back').addEventListener('click', function () { renderYo(); });
