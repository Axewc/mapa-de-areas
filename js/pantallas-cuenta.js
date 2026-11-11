// Pantalla Yo: avance, meta, cuenta opcional, cuestionario, borrar datos y acceso a la vista docente.
// Script clásico (ES5). Usa las globales de app.js: sb, session, isAdmin, state y storage.

var PRIVACIDAD = 'Sin cuenta, nada sale de tu dispositivo. Con cuenta se guardan tu correo, tus respuestas del cuestionario y tu progreso de estudio; el profesor puede verlos; puedes borrar tu progreso aquí y tus respuestas desde Mis respuestas.';

function statTile(value, label) {
  return el('div', { class: 'stat' }, el('b', { text: value }), el('span', { class: 'small', text: label }));
}

// Botón que despliega el formulario de acceso por correo (enlace mágico). Se usa en Yo y en Elegir meta.
// prefix distingue los ids de cada copia (#email, #send-link y #auth-msg en Yo; #pick-email… en Elegir meta).
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
    var failOut = function () {
      out.disabled = false;
      showNotice('No se pudo cerrar la sesión. Intenta de nuevo.');
    };
    out.addEventListener('click', function () {
      out.disabled = true;
      // SIGNED_OUT (app.js) pone session en null y redibuja; si no llegó, no se cerró.
      Promise.resolve().then(function () { return sb.auth.signOut(); }).then(function (r) {
        if ((r && r.error) || session) failOut();
        else answers = [];
      }, failOut);
    });
    card.append(el('p', null, 'Sesión: ', el('b', { text: session.user.email })),
      el('p', { class: 'small', text: 'Tu progreso se guarda en la nube y lo ves en cualquier dispositivo con este correo.' }),
      el('div', null, out));
  } else {
    card.append(el('p', { text: 'Es opcional. Con una cuenta, tu progreso se guarda en la nube y sigue contigo en cualquier dispositivo.' }),
      signInBlock('', 'Guarda tu progreso en la nube', false));
  }
  card.append(el('p', { class: 'fine', text: PRIVACIDAD }));
  return card;
}

function deleteCard() {
  var hint = el('p', { class: 'small', 'aria-live': 'polite', text: 'Borra tu progreso de estudio de este dispositivo' + (session ? ' y de la nube' : '') + '.' });
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
    invalidateData().then(function () {
      return uid ? deleteRemote(sb, uid) : { error: null };
    }).then(function (r) {
      if (r.error) {
        del.disabled = false;
        armed = false;
        del.textContent = 'Borrar mis datos';
        showNotice('No se pudo borrar tu progreso de la nube. Intenta de nuevo.');
        return;
      }
      clearLocal(storage);
      state = emptyState();
      renderPick();
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

  var quiz = el('button', { class: 'btn', type: 'button', text: 'Descubre tu área' });
  quiz.addEventListener('click', openIntro);
  var actions = el('div', { class: 'actions' }, quiz);
  if (session) {
    var hist = el('button', { class: 'btn ghost', type: 'button', text: 'Mis respuestas' });
    hist.addEventListener('click', renderHistory);
    actions.append(hist);
  }
  root.append(el('section', { class: 'card stack', 'aria-labelledby': 'quiz-h' },
    el('h2', { id: 'quiz-h', text: '¿Qué área va contigo?' }),
    el('p', { text: 'Un cuestionario de 10 preguntas y 5 minutos que te sugiere tres áreas de computación para explorar.' }),
    actions));

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
