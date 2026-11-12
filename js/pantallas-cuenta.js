// Pantalla Yo (avance, meta, cuenta opcional con Mis respuestas, borrar datos y acceso a la vista docente) y la vista docente (renderAdmin).
// Script clásico (ES5). Usa las globales de app.js: sb, session, isAdmin, state y storage.

var PRIVACIDAD = 'Sin cuenta, nada sale de tu dispositivo. Con cuenta se guardan tu correo, tus respuestas del cuestionario y tu progreso de estudio; el profesor puede verlos; puedes borrar tu progreso aquí y tus respuestas desde Mis respuestas. Si tienes la sesión abierta en otros dispositivos, pueden volver a subir su copia hasta que cierres sesión o borres allí también.';

function statTile(value, label) {
  return el('div', { class: 'stat' }, el('b', { text: value }), el('span', { class: 'small', text: label }));
}

// Botón que despliega el formulario de acceso por correo (enlace mágico). Se usa en Yo y en la entrada.
// prefix distingue los ids de cada copia (#email, #send-link y #auth-msg en Yo; #pick-email… en la entrada).
function signInBlock(prefix, openText, quiet) {
  var formId = prefix + 'login', emailId = prefix + 'email';
  var open = el('button', { class: quiet ? 'linkbtn' : 'btn ghost', type: 'button', 'aria-expanded': 'false', 'aria-controls': formId, text: openText });
  var email = el('input', { class: 'field', id: emailId, type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'nombre@correo.com', required: 'required' });
  var send = el('button', { class: 'btn', id: prefix + 'send-link', type: 'submit', text: 'Enviarme el enlace' });
  var msg = el('p', { class: 'small', id: prefix + 'auth-msg', 'aria-live': 'polite' });
  var form = el('form', { class: 'stack', id: formId, novalidate: 'novalidate', hidden: 'hidden' },
    el('label', { class: 'mono', for: emailId, text: 'Tu correo' }), email, el('div', null, send), msg);
  if (quiet) form.append(el('p', { class: 'fine', text: 'Te mandamos un enlace para entrar. Tu meta y tu progreso guardados en la nube se traen a este dispositivo. ' + PRIVACIDAD }));
  open.addEventListener('click', function () {
    var willOpen = form.hidden;
    form.hidden = !willOpen;
    open.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    if (willOpen) email.focus();
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var addr = email.value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(addr)) { msg.textContent = 'Escribe un correo válido.'; return; }
    send.disabled = true;
    msg.textContent = 'Enviando…';
    sb.auth.signInWithOtp({ email: addr, options: { emailRedirectTo: window.location.origin + window.location.pathname } }).then(function (r) {
      send.disabled = false;
      msg.textContent = r.error
        ? 'No se pudo enviar el enlace: ' + r.error.message
        : 'Listo. Revisa tu correo, incluida la carpeta de spam, y abre el enlace. Funciona desde cualquier dispositivo.';
    });
  });
  return el('div', { class: 'stack' }, el('div', null, open), form);
}

function accountCard() {
  var card = el('section', { class: 'card stack', id: 'account', 'aria-labelledby': 'account-h' },
    el('h2', { id: 'account-h', text: 'Tu cuenta' }));
  if (session) {
    var out = el('button', { class: 'btn ghost', id: 'logout', type: 'button', text: 'Cerrar sesión' });
    var noWipe = el('button', { class: 'btn ghost', id: 'logout-keep', type: 'button', text: 'Cerrar sesión sin borrar', hidden: 'hidden' });
    var msg = el('p', { class: 'small', id: 'logout-msg', 'aria-live': 'polite' });
    var failOut = function () {
      out.disabled = false;
      noWipe.disabled = false;
      showNotice('No se pudo cerrar la sesión. Intenta de nuevo.');
    };
    // Cierra la sesión. Con wipe (lo normal, para que el siguiente en este equipo no mezcle su avance con el tuyo) primero
    // espera (con tope) a las sincronizaciones en curso, para que ninguna con un estado más viejo pise la fila después,
    // intenta una última sincronización y, si salió bien, borra la copia de este dispositivo. Si algo falla, no borra nada.
    var logout = function (wipe) {
      out.disabled = true;
      noWipe.disabled = true;
      msg.textContent = wipe ? 'Guardando tu avance en tu cuenta…' : '';
      (wipe
        ? settlePending().then(function (w) { return w.timedOut ? { ok: false, discarded: false } : runSync(); })
        : Promise.resolve({ ok: true, discarded: false })).then(function (r) {
        if (!r.ok) {
          out.disabled = false;
          noWipe.disabled = false;
          out.textContent = 'Reintentar';
          noWipe.hidden = false;
          msg.textContent = r.discarded
            ? 'Se está borrando tu progreso. Espera un momento e intenta de nuevo.'
            : 'No se pudo guardar tu avance en tu cuenta, así que no lo borramos de este dispositivo. Puedes reintentar o cerrar sesión sin borrar: el avance se queda en este navegador y quien entre después en él lo combinará con su cuenta.';
          return;
        }
        deleting = true; // ninguna sincronización empieza mientras se cierra la sesión y se borra la copia local
        return invalidateData().then(function () { return sb.auth.signOut(); }).then(function (res) {
          // SIGNED_OUT (app.js) pone session en null y redibuja; si no llegó, no se cerró.
          if ((res && res.error) || session) { deleting = false; failOut(); return; }
          if (wipe) { clearLocal(storage); state = emptyState(); forgetQuiz(); }
          deleting = false;
          if (wipe) {
            renderInicio();
            showNotice('Cerraste sesión. Tu avance quedó en tu cuenta y borramos la copia de este dispositivo.');
          } else {
            showNotice('Cerraste sesión. Tu avance sigue en este navegador: quien entre después en él lo combinará con su cuenta.');
          }
        });
      }).then(null, function () { deleting = false; failOut(); });
    };
    out.addEventListener('click', function () { logout(true); });
    noWipe.addEventListener('click', function () { logout(false); });
    var hist = el('button', { class: 'btn ghost', id: 'to-history', type: 'button', text: 'Mis respuestas' });
    hist.addEventListener('click', function () { withDir('forward', function () { renderHistory(); }); });
    card.append(el('p', null, 'Sesión: ', el('b', { text: session.user.email })),
      el('p', { class: 'small', text: 'Tu progreso se guarda en la nube y lo ves en cualquier dispositivo con este correo. Al cerrar sesión se guarda tu avance y se borra la copia de este dispositivo.' }),
      el('div', { class: 'row' }, hist),
      el('div', { class: 'row' }, out, noWipe), msg);
  } else {
    card.append(el('p', { text: 'Es opcional. Con una cuenta, tu progreso se guarda en la nube y sigue contigo en cualquier dispositivo.' }),
      signInBlock('', 'Guarda tu progreso en la nube', false));
  }
  card.append(el('p', { class: 'fine', text: PRIVACIDAD }));
  return card;
}

function deleteCard() {
  var hint = el('p', { class: 'small', 'aria-live': 'polite', text: 'Borra tu progreso de estudio de este dispositivo' + (session ? ' y de la nube. Otros dispositivos con tu sesión abierta pueden volver a subir su copia hasta que cierren sesión o borren allí también' : '') + '.' });
  var del = el('button', { class: 'btn ghost danger', type: 'button', text: 'Borrar mis datos' });
  var armed = false;
  del.addEventListener('click', function () {
    if (!armed) {
      armed = true;
      del.textContent = 'Sí, borrar todo';
      hint.textContent = 'No se puede deshacer. Toca otra vez para confirmar.';
      return;
    }
    del.disabled = true;
    // Primero se invalidan las sincronizaciones en curso y se espera a que terminen;
    // así ninguna devuelve el progreso borrado ni recrea la fila remota.
    var uid = session ? session.user.id : null;
    deleting = true; // bloquea sincronizaciones nuevas (p. ej. un SIGNED_IN) hasta terminar, con éxito o no
    var done = function () { deleting = false; };
    var waited = null;
    invalidateData().then(function (w) {
      waited = w;
      return uid ? deleteRemote(sb, uid) : { error: null };
    }).then(function (r) {
      if (r.error) {
        del.disabled = false;
        armed = false;
        del.textContent = 'Borrar mis datos';
        showNotice('No se pudo borrar tu progreso de la nube. Intenta de nuevo.');
        return;
      }
      // Si la espera tuvo que rendirse, una sincronización tardía aún podría recrear la fila: se borra otra vez cuando termine.
      if (uid && waited && waited.timedOut) waited.settled.then(function () { deleteRemote(sb, uid); });
      clearLocal(storage);
      state = emptyState();
      forgetQuiz();
      renderInicio();
      showNotice('Listo. Borramos tu progreso.');
    }).then(done, function (e) { done(); throw e; });
  });
  return el('section', { class: 'card stack', 'aria-labelledby': 'delete-h' },
    el('h2', { id: 'delete-h', text: 'Borrar mis datos' }), hint, el('div', null, del));
}

function renderYo(keep) {
  var root = screens.yo;
  root.textContent = '';
  var today = todayYmd();
  renderedDay = today;
  var xp = totalXp(state);
  var best = streak(state, today).best;
  root.append(hubHead(), el('h1', { text: 'Tu avance' }));
  root.append(el('div', { class: 'stats' },
    statTile('Nivel ' + level(xp), 'faltan ' + (level(xp) * 200 - xp) + ' XP para el ' + (level(xp) + 1)),
    statTile(String(xp), 'XP en total'),
    statTile(plural(best, 'día', 'días'), 'tu mejor racha')));

  var line = lineById(state.goal);
  var change = el('button', { class: 'btn ghost', type: 'button', text: line ? 'Cambiar de meta' : 'Elegir meta' });
  change.addEventListener('click', function () { renderPick(); });
  root.append(el('section', { class: 'card stack ' + (line ? line.color : ''), 'aria-labelledby': 'goal-h' },
    el('h2', { class: 'mono card-h', id: 'goal-h', text: 'Tu meta' }),
    line ? el('p', { class: 'goal-line' }, lineBadge(line), el('b', { text: line.title }), el('span', { class: 'small', text: line.company + ' · ' + pctOf(line) + '% listo' }))
      : el('p', { text: 'Aún no eliges una meta.' }),
    el('div', null, change)));

  root.append(accountCard());

  if (isAdmin) {
    var adm = el('button', { class: 'btn ghost', id: 'to-admin', type: 'button', text: 'Vista docente' });
    adm.addEventListener('click', renderAdmin);
    root.append(el('section', { class: 'card stack', 'aria-labelledby': 'admin-h' },
      el('h2', { id: 'admin-h', text: 'Docente' }),
      el('p', { class: 'small', text: 'Respuestas y avance del grupo. Solo aparece con tu cuenta.' }),
      el('div', null, adm)));
  }

  root.append(deleteCard());
  show('yo', keep);
}

// Vista docente: dos secciones independientes (progreso de estudio e intentos del cuestionario), cada una con su
// propia consulta, y un filtro por correo que actúa sobre las dos en el cliente. Nada de lo que llega de la base
// (correos, metas, días) se inserta como HTML ni se usa como llave de un objeto.
function adminSection(id, title) {
  var body = el('div', { class: 'stack' }, el('p', { class: 'status', text: 'Cargando…' }));
  return { body: body, node: el('section', { class: 'admin-sec stack', 'aria-labelledby': id }, el('h2', { id: id, text: title }), body) };
}

// Solo texto: String() sobre un valor anidado hostil podría lanzar.
function adminEmail(x) { return typeof x === 'string' ? x : ''; }

var ADMIN_LIMIT = 1000;
var ADMIN_CUT = 'Se muestran los primeros 1000; puede haber más.';
var adminHintWrap = null, adminHintObs = null;

// La fila de un estado que no se pudo leer: «estado no válido» y guiones.
function adminBadRow() { return { valid: false, goalId: null, pct: null, streak: null, xp: null, lastDay: null }; }

// Una fila hostil nunca debe detener la sección: cualquier excepción da la fila no válida.
function adminBuildRow(x, today) {
  try {
    return { email: adminEmail(x && x.email), row: adminRow(x && x.state, today, LINEAS, ESTACIONES) };
  } catch (e) {
    return { email: adminEmail(x && x.email), row: adminBadRow() };
  }
}

// El aviso de deslizar solo sale cuando la tabla de verdad se desborda.
function adminWatchOverflow(wrap, hint) {
  var update = function () { hint.hidden = !(wrap.scrollWidth > wrap.clientWidth + 1); };
  if (adminHintObs) { adminHintObs.disconnect(); adminHintObs = null; }
  adminHintWrap = update;
  update();
  if (typeof ResizeObserver !== 'undefined') {
    adminHintObs = new ResizeObserver(update);
    adminHintObs.observe(wrap);
    if (wrap.firstChild) adminHintObs.observe(wrap.firstChild);
  }
}
window.addEventListener('resize', function () { if (adminHintWrap) adminHintWrap(); });

function adminMeta(line) {
  return el('td', { class: 'meta' }, lineBadge(line), ' ' + line.title);
}

function adminProgressRow(item) {
  var r = item.row, line = null, i;
  if (r.valid && r.goalId) for (i = 0; i < LINEAS.length; i++) if (LINEAS[i].id === r.goalId) { line = LINEAS[i]; break; }
  var dash = function (cls) { return el('td', { class: cls || '', text: '–' }); };
  var tr = el('tr', null, el('th', { scope: 'row', class: 'who', title: item.email, text: item.email }));
  if (!r.valid) {
    tr.append(el('td', { class: 'bad', text: 'estado no válido' }), dash('num'), dash('num'), dash('num'), dash());
    return tr;
  }
  tr.append(line ? adminMeta(line) : el('td', { class: 'dim', text: 'Sin meta' }),
    r.pct === null ? dash('num') : el('td', { class: 'num', text: r.pct + '%' }),
    el('td', { class: 'num', text: plural(r.streak, 'día', 'días') }),
    el('td', { class: 'num', text: String(r.xp) }),
    r.lastDay ? el('td', { text: fmtDay(r.lastDay) }) : dash());
  return tr;
}

function renderAdmin() {
  var root = screens.admin;
  root.textContent = '';
  var prog = adminSection('admin-prog-h', 'Progreso de estudio');
  var quiz = adminSection('admin-quiz-h', 'Intentos del cuestionario');
  var filter = el('input', { class: 'field', id: 'admin-filter', type: 'search', placeholder: 'Filtrar por correo', autocomplete: 'off', 'aria-label': 'Filtrar por correo' });
  root.append(navBack(), el('div', null,
    el('p', { class: 'mono', text: 'Docente' }),
    el('h1', { text: 'Vista docente' }),
    el('p', { class: 'sub', text: 'Cómo estudia el grupo y qué respondió en el cuestionario. Esta vista solo aparece con tu cuenta.' })),
    filter, prog.node, quiz.node);
  show('admin');

  var today = todayYmd();
  var progRows = null, quizRows = null;
  var match = function (email, q) { return !q || adminEmail(email).toLowerCase().indexOf(q) !== -1; };

  function drawProgress() {
    if (!progRows) return;
    var q = filter.value.trim().toLowerCase();
    var shown = progRows.filter(function (x) { return match(x.email, q); });
    var valid = progRows.filter(function (x) { return x.row.valid; }).length;
    prog.body.textContent = '';
    if (!progRows.length) { prog.body.append(el('p', { class: 'status', text: 'Todavía nadie guarda progreso de estudio.' })); return; }
    var cut = progRows.length >= ADMIN_LIMIT;
    prog.body.append(el('p', { class: 'small', text: cut
      ? plural(progRows.length, 'estudiante', 'estudiantes') + ' cargados (' + valid + ' con estado válido).'
      : plural(progRows.length, 'estudiante', 'estudiantes') + ' con progreso (' + valid + ' con estado válido).' }));
    if (cut) prog.body.append(el('div', { class: 'note', text: ADMIN_CUT }));
    if (!shown.length) { prog.body.append(el('p', { class: 'status', text: 'Sin resultados.' })); return; }
    var head = el('tr', null);
    ['Correo', 'Meta', '% listo', 'Racha', 'XP', 'Último día'].forEach(function (h, i) {
      head.append(el('th', { scope: 'col', class: i >= 2 && i <= 4 ? 'num' : '', text: h }));
    });
    var tbody = el('tbody');
    shown.forEach(function (x) { tbody.append(adminProgressRow(x)); });
    var hint = el('p', { class: 'fine scrollhint', text: 'Desliza la tabla a un lado para ver todas las columnas.', hidden: 'hidden' });
    var wrap = el('div', { class: 'tablewrap', tabindex: '0', role: 'region', 'aria-label': 'Progreso de estudio' }, el('table', { class: 'prog' },
      el('caption', { class: 'sr-only', text: 'Progreso de estudio por estudiante, del último día de estudio más reciente al más antiguo' }),
      el('thead', null, head), tbody));
    prog.body.append(hint, wrap);
    adminWatchOverflow(wrap, hint);
  }

  function drawQuiz() {
    if (!quizRows) return;
    var q = filter.value.trim().toLowerCase();
    var shown = quizRows.filter(function (x) { return match(x.email, q); });
    var people = {};
    quizRows.forEach(function (x) { people[adminEmail(x.email)] = true; });
    quiz.body.textContent = '';
    if (!quizRows.length) { quiz.body.append(el('p', { class: 'status', text: 'Todavía no hay intentos del cuestionario.' })); return; }
    var cutQ = quizRows.length >= ADMIN_LIMIT;
    quiz.body.append(el('p', { class: 'small', text: cutQ
      ? plural(quizRows.length, 'intento', 'intentos') + ' cargados.'
      : plural(quizRows.length, 'intento', 'intentos') + ' de ' + plural(Object.keys(people).length, 'persona', 'personas') + '.' }));
    if (cutQ) quiz.body.append(el('div', { class: 'note', text: ADMIN_CUT }));
    if (!shown.length) { quiz.body.append(el('p', { class: 'status', text: 'Sin resultados.' })); return; }
    var list = el('div', { class: 'attempts' });
    shown.forEach(function (x) {
      try {
        list.append(el('details', { class: 'attempt' },
          el('summary', null, el('span', { class: 'mono when', text: adminEmail(x.email) + ' · ' + fmtDate(x.created_at) + ' · ' + (SETS[x.quiz_version] || SETS[1]).name }), topLine(x.scores)),
          qaList(x.answers, x.quiz_version)
        ));
      } catch (e) {
        // Un intento con datos ilegibles no tumba a los demás.
        list.append(el('p', { class: 'status', text: adminEmail(x.email) + ' · intento ilegible' }));
      }
    });
    quiz.body.append(list);
  }

  var fail = function (box, what, e) {
    box.textContent = '';
    box.append(el('div', { class: 'note', text: 'No se pudo cargar ' + what + ' (' + ((e && e.message) || 'error de red') + ').' }));
  };

  // Cada consulta es independiente; un fallo al procesar (no solo al pedir) cae en la misma nota de error.
  var toProg = function (e) { progRows = null; fail(prog.body, 'el progreso', e); };
  var toQuiz = function (e) { quizRows = null; fail(quiz.body, 'las respuestas', e); };

  sb.from('mapa_progreso').select('email,state,updated_at').order('updated_at', { ascending: false }).limit(ADMIN_LIMIT).then(function (r) {
    if (r.error) { toProg(r.error); return; }
    progRows = (r.data || []).map(function (x) { return adminBuildRow(x, today); });
    progRows.sort(adminCompare);
    drawProgress();
  }).then(null, toProg);

  sb.from('mapa_respuestas').select('id,email,created_at,answers,scores,quiz_version').order('created_at', { ascending: false }).limit(ADMIN_LIMIT).then(function (r) {
    if (r.error) { toQuiz(r.error); return; }
    quizRows = r.data || [];
    drawQuiz();
  }).then(null, toQuiz);

  filter.addEventListener('input', function () {
    try { drawProgress(); } catch (e) { toProg(e); }
    try { drawQuiz(); } catch (e) { toQuiz(e); }
  });
}
