// Entrada (primera visita, con dos puertas) y pestaña Descubre (invitación al cuestionario o el último resultado).
// Script clásico (ES5). Usa las globales de app.js (storage, session), de ui.js y de las demás pantallas-*.js.

// Botón-tarjeta de la entrada: título, subtítulo y flecha decorativa.
function doorButton(id, title, sub, fn) {
  var b = el('button', { class: 'door', id: id, type: 'button' },
    el('span', { class: 'door-t', text: title }),
    el('span', { class: 'door-s', text: sub }),
    el('span', { class: 'go', 'aria-hidden': 'true', text: '→' }));
  b.addEventListener('click', fn);
  return b;
}

// ---------- Entrada ----------
function renderEntrada(keep) {
  var root = screens.entrada;
  root.textContent = '';
  root.append(hubHead(), el('div', { class: 'hub-title' },
    el('h1', { text: '¿Por dónde empiezas?' }),
    el('p', { class: 'lede', text: 'Descubre qué área de computación va contigo o elige directo la vacante que quieres alcanzar.' })));
  root.append(el('div', { class: 'doors' },
    doorButton('door-quiz', 'No sé qué área me va', '8 preguntas · 5 minutos · sin cuenta', function () {
      withDir('forward', function () { startQuiz(); });
    }),
    doorButton('door-goal', 'Ya sé qué quiero', 'Elige una vacante real como meta', function () {
      withDir('forward', function () { renderPick(); });
    })));
  // Quien ya tiene cuenta puede entrar antes de elegir, para traer su meta de la nube sin pisarla.
  if (!session) root.append(el('div', { class: 'pick-login' }, signInBlock('pick-', '¿Ya tienes cuenta? Entra', true)));
  show('entrada', keep);
}

// ---------- Descubre ----------
// Con un resultado guardado (o de esta visita) muestra ese resultado (#s-result, sin volver a guardarlo);
// si no, la invitación con «Empezar».
function renderDescubre(keep) {
  var saved = savedQuiz();
  if (saved) { renderResult(saved, { fresh: false, keep: !!keep }); return; }
  var root = screens.descubre;
  root.textContent = '';
  var start = el('button', { class: 'btn', id: 'descubre-start', type: 'button', text: 'Empezar' });
  start.addEventListener('click', function () { withDir('forward', function () { startQuiz(); }); });
  root.append(hubHead(), el('div', { class: 'hub-title' },
    el('p', { class: 'mono', text: '8 preguntas · 5 minutos · sin cuenta' }),
    el('h1', { text: '¿Qué área de computación va contigo?' }),
    el('p', { class: 'lede', text: 'Contesta qué harías en situaciones de todos los días. Te sugerimos un área y una vacante real para empezar a estudiar. No hay respuestas correctas.' })),
    el('div', null, start));
  show('descubre', keep);
}
