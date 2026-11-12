// Cuestionario de áreas, resultado (con las líneas que encajan), y Mis respuestas (la vista docente vive en pantallas-cuenta.js).
var body = document.getElementById('quiz-body');
var ticks = document.getElementById('ticks');
var counter = document.getElementById('counter');
var backBtn = document.getElementById('back');
var version = 1;
var QUESTIONS = SETS[1].qs;
var answers = [];
var current = 0;
var locked = false;

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
  if (version === 1) {
    var g = glossFor([q.q].concat(q.opts.map(function (o) { return o.t; })), '¿Hay términos que no conoces? Aquí se explican');
    if (g) body.append(g);
  }
  body.append(el('p', { class: 'hint', text: 'Puedes responder con las teclas 1 a ' + q.opts.length + '. Nada de esto te encasilla: es para empezar a explorar.' }));
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
  // Guardar el intento requiere cuenta (la base lo rechaza sin sesión): sin cuenta ni se intenta.
  if (session) {
    var saveNote = el('div', { class: 'note', 'aria-live': 'polite', text: 'Guardando tu resultado…' });
    saveAttempt(answers.slice(), ranked, version).then(function () {
      saveNote.textContent = 'Guardado. Puedes volver a verlo en Mis respuestas.';
    }).catch(function (e) {
      saveNote.textContent = 'No se pudo guardar tu resultado (' + (e && e.message ? e.message : 'error') + '). Usa el botón Copiar mi resultado para no perderlo.';
    });
    root.append(saveNote);
  } else {
    var create = el('button', { class: 'btn ghost', type: 'button', text: 'Crear cuenta' });
    create.addEventListener('click', function () { renderYo(); });
    root.append(el('div', { class: 'note stack', 'aria-live': 'polite' },
      el('p', { text: 'No se guardó: no tienes cuenta. Puedes crear una en Yo.' }),
      el('div', null, create)));
  }

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

  root.append(vacancyPanel(lineasFor(top.map(function (r) { return r.key; }), LINEAS)));

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
  var hoyBtn = el('button', { class: 'btn', type: 'button', text: 'Ir a Hoy' });
  hoyBtn.addEventListener('click', function () { renderHoy(); });
  var actions = el('div', { class: 'footer-actions' }, hoyBtn, copyBtn, otherBtn);
  if (session) {
    var histBtn = el('button', { class: 'btn ghost', type: 'button', text: 'Mis respuestas' });
    histBtn.addEventListener('click', renderHistory);
    actions.append(histBtn);
  }
  actions.append(again);
  root.append(actions, status, shareBox);

  show('result');
}

// Líneas del mapa que encajan con las tres áreas del resultado: ver la línea o elegirla como meta.
function vacancyPanel(ids) {
  var box = el('section', { class: 'panel area vacancy', 'aria-labelledby': 'vac-h' },
    el('h2', { id: 'vac-h', text: 'Vacantes reales para tus áreas', style: 'font-size:1.35rem' }));
  if (!ids.length) {
    box.append(el('p', { text: 'Por ahora no hay vacantes para esas áreas. Las agregaremos pronto.' }));
    return box;
  }
  box.append(el('p', { class: 'small', text: 'Cada una es una línea del mapa: ves lo que piden y por dónde empezar.' }));
  var list = el('ul', { class: 'vac-list' });
  ids.forEach(function (id) {
    var line = lineById(id);
    if (!line) return;
    var see = el('button', { class: 'btn ghost', type: 'button', text: 'Ver la línea', 'aria-label': 'Ver la línea ' + line.title });
    see.addEventListener('click', function () { openLinea(id, false, 'mapa'); });
    var pick;
    if (line.id === state.goal) {
      pick = el('button', { class: 'btn', type: 'button', disabled: '', 'aria-current': 'true', text: 'Es tu meta' });
    } else {
      pick = el('button', { class: 'btn', type: 'button', text: 'Elegir como meta', 'aria-label': 'Elegir como meta ' + line.title });
      pick.addEventListener('click', function () { chooseGoal(id, true); });
    }
    list.append(el('li', { class: 'vac-row ' + line.color, 'data-line': id },
      el('span', { class: 'lc-top' }, lineBadge(line), el('span', { class: 'lvl' + (line.level === 'Para empezar' ? ' start' : ''), text: line.level })),
      el('span', { class: 'lc-title', text: line.title }),
      el('span', { class: 'lc-meta', text: line.company }),
      el('div', { class: 'actions' }, see, pick)));
  });
  box.append(list);
  return box;
}

function setVersion(v) { version = v; QUESTIONS = SETS[v].qs; }
function startQuiz(v) { setVersion(v); answers = []; current = 0; locked = false; renderQuestion(); show('quiz'); }
function reset() { answers = []; current = 0; locked = false; show('intro'); }


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

document.getElementById('start').addEventListener('click', function () { startQuiz(chosen); });
// En la primera pregunta, «Atrás» regresa a la presentación del cuestionario.
backBtn.addEventListener('click', function () {
  if (locked) return;
  if (current > 0) { current--; renderQuestion(); } else show('intro');
});
document.getElementById('intro-back').addEventListener('click', function () { renderYo(); });
