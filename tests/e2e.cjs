// Prueba de flujo del hub con Playwright y un Supabase falso (primera visita, sesión, mapa, cuenta, cuestionario, vista docente y revisión visual).
// Correr con: node tests/e2e.cjs   (capturas: SHOTS_DIR=/ruta node tests/e2e.cjs)
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { ESTACIONES } = require('../js/data-estaciones.js');
const { todayYmd, addDays, weekKey, suggestLine, whyAnswers } = require('../js/core.js');
const { scoreAnswers, SETS, AREAS } = require('../js/data-areas.js');
const { LINEAS } = require('../js/data-lineas.js');

const INDEX_URL = 'file://' + path.resolve(__dirname, '../index.html');
const FAKE = fs.readFileSync(path.join(__dirname, 'fake-supabase.js'), 'utf8');
const SB_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
const KEY = 'mapa.v2';
const SYNC_FAIL = 'No se pudo sincronizar. Tu progreso sigue en este dispositivo.';

async function setupRoutes(page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.route(SB_URL, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE }));
}

const noHScroll = () => document.documentElement.scrollWidth <= window.innerWidth;

// Abre el sitio. Por defecto sin sesión (la primera visita normal).
// opts: { seed, seedJson (texto JSON del seed, para llaves como «__proto__»), session, admin, failSync, failQuiz, slowSync (ms), failDelete, noStorage, local, quiz, clock (fecha fija), motion }.
// `local` es el texto que se guarda en localStorage antes de cargar (null: no se toca); `quiz`, lo mismo para «mapa.quiz».
// Sin `motion`, la página prefiere movimiento reducido: las transiciones entre pantallas terminan en uno o dos cuadros.
async function openHome(context, opts) {
  const o = opts || {};
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await setupRoutes(page);
  await page.addInitScript((a) => {
    window.__seed = Object.assign({}, a.seedJson ? JSON.parse(a.seedJson) : (a.seed || {}), a.session ? { session: true } : {});
    if (a.admin) window.__fakeAdmin = true;
    if (a.failSync) window.__failSync = true;
    if (a.failQuiz) window.__failQuiz = true;
    if (a.local !== null && a.local !== undefined && !sessionStorage.getItem('e2e.seeded')) {
      localStorage.setItem(a.key, a.local);
      sessionStorage.setItem('e2e.seeded', '1');
    }
    if (a.quiz !== null && !sessionStorage.getItem('e2e.quiz')) {
      localStorage.setItem('mapa.quiz', a.quiz);
      sessionStorage.setItem('e2e.quiz', '1');
    }
    if (a.slowSync) window.__slowSync = a.slowSync;
    if (a.failDelete) window.__failDelete = true;
    if (a.noStorage) Storage.prototype.setItem = function () { throw new Error('cuota'); }; // localStorage no disponible
  }, { seed: o.seed, seedJson: o.seedJson || null, session: !!o.session, admin: !!o.admin, failSync: !!o.failSync, failQuiz: !!o.failQuiz, slowSync: o.slowSync || 0, failDelete: !!o.failDelete, noStorage: !!o.noStorage,
    local: o.local === undefined ? null : o.local, quiz: o.quiz === undefined ? null : o.quiz, key: KEY });
  if (!o.motion) await page.emulateMedia({ reducedMotion: 'reduce' });
  if (o.clock) await page.clock.setFixedTime(new Date(o.clock));
  await page.goto(INDEX_URL);
  await page.waitForSelector('#s-entrada:not([hidden]), #s-hoy:not([hidden]), #s-descubre:not([hidden]), #s-result:not([hidden])');
  return { page, errors };
}

const localState = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);

// Estado con todos los ítems de todas las estaciones en caja 5 y repaso futuro: no queda nada nuevo ni pendiente.
function allDoneState() {
  const due = addDays(todayYmd(), 20);
  const items = {};
  Object.keys(ESTACIONES).forEach((id) => { for (let n = 0; n < 6; n++) items[id + '.' + n] = { b: 5, due, t: 1 }; });
  return { v: 2, goal: 'edar-dev-jr', goalT: 1, items, days: {} };
}

// Estado con algo de avance para la revisión visual: Git visitada, Datos empezada, días cumplidos en la semana.
function progressState(goal) {
  const today = todayYmd();
  const items = {};
  for (let n = 0; n < 6; n++) items['git.' + n] = { b: 2, due: addDays(today, 2), t: 1 };
  for (let n = 0; n < 2; n++) items['datos.' + n] = { b: 1, due: today, t: 1 };
  items['sql.0'] = { b: 1, due: addDays(today, 1), t: 1 };
  const days = {};
  const mon = weekKey(today);
  for (let d = mon; d < today; d = addDays(d, 1)) days[d] = { xp: 64, done: true };
  return { v: 2, goal: goal || 'edar-dev-jr', goalT: 1, items, days };
}

const SHOTS = process.env.SHOTS_DIR || null;

// Sesión: pasa la idea (si la hay) con Enter y responde la pregunta con la tecla de la correcta o de otra.
// Devuelve el ítem, el texto de la retroalimentación y la etiqueta. No avanza: eso lo hace nextCard.
async function answerCard(page, right) {
  await page.waitForSelector('#s-sesion .ses-card');
  if (await page.locator('#s-sesion .ses-card.idea').count()) {
    await page.keyboard.press('Enter');
    await page.waitForSelector('#s-sesion .ses-card.question');
  }
  const item = await page.getAttribute('#s-sesion .ses-card', 'data-item');
  const ok = await page.evaluate((id) => getQuestion(ESTACIONES, id).ok, item);
  await page.keyboard.press(String(right ? ok + 1 : ((ok + 1) % 4) + 1));
  await page.waitForSelector('#s-sesion .fb:not(:empty)');
  return { item, ok, fb: await page.textContent('#s-sesion .fb'), tag: await page.textContent('#s-sesion .ses-tag') };
}
async function nextCard(page) {
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('#s-sesion .fb:not(:empty)'));
}
// Termina la sesión respondiendo todo bien.
async function finishAllRight(page) {
  const seen = [];
  while (!(await page.locator('#s-sesion .session-end').count())) {
    seen.push(await answerCard(page, true));
    await nextCard(page);
  }
  return seen;
}

// Revisión visual de todas las pantallas a un tamaño y un tema: Elegir meta (primera visita), Hoy (con avance), Yo (sin
// cuenta y con cuenta), Elegir meta (cambiar de meta), Mapa, Línea, Estación (con el atajo y después de él), Sesión (idea,
// pregunta, acierto, error), Cierre, Cuestionario (intro, pregunta, resultado) y Vista docente. En cada una verifica que no haya scroll
// horizontal y, con SHOTS_DIR, guarda {ancho}-{tema}-{pantalla}.png. Los errores de JS de cada página fallan la prueba.
async function visualPass(browser, viewport, colorScheme) {
  const tag = viewport.width + '-' + colorScheme;
  const shoot = async (page, name) => {
    await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));
    assert.ok(await page.evaluate(noHScroll), 'scroll horizontal en ' + name + ' (' + tag + ')');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, tag + '-' + name + '.png'), fullPage: true, animations: 'disabled' });
  };
  // Primera visita: la entrada y Elegir meta sin meta, sin barra inferior.
  const ctx0 = await browser.newContext({ viewport, colorScheme, deviceScaleFactor: 1 });
  const first = await openHome(ctx0, { clock: '2026-11-10T10:00:00' });
  await first.page.waitForSelector('#s-entrada #door-goal');
  await shoot(first.page, 'entrada');
  await first.page.click('#door-goal');
  await first.page.waitForSelector('#s-pick .line-card');
  await shoot(first.page, 'elegir-primera-visita');
  assert.deepEqual(first.errors, [], 'errores de JS en la primera visita (' + tag + ')');
  await ctx0.close();

  const ctx = await browser.newContext({ viewport, colorScheme, deviceScaleFactor: 1 });
  const { page, errors } = await openHome(ctx, { local: JSON.stringify(progressState()) });
  const check = (name) => shoot(page, name);
  await page.waitForSelector('#s-hoy:not([hidden])');
  await check('hoy');
  await page.click('#tabbar [data-tab=yo]');
  await page.waitForSelector('#s-yo:not([hidden])');
  await check('yo');
  await page.click('#s-yo button:has-text("Cambiar de meta")');
  await page.waitForSelector('#s-pick:not([hidden])');
  await check('elegir');
  await page.locator('#s-pick .line-card', { hasText: 'Científico de Datos Jr.' }).click();
  await page.waitForSelector('#s-hoy:not([hidden])');
  await check('hoy-l6');
  await page.click('#tabbar [data-tab=mapa]');
  await page.waitForSelector('#s-mapa:not([hidden]) svg');
  await check('mapa');
  assert.deepEqual(await mapLabelProblems(page), [], 'etiquetas del mapa (' + tag + ')');
  // Foco con teclado en una estación compartida (Datos → Tab → SQL): el aro de dos tonos se dibuja.
  await page.focus('#s-mapa [data-station=git]');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-station')), 'sql');
  const ring = await page.evaluate(() => {
    const g = document.activeElement;
    return ['ring-gap', 'ring', 'ring-dash'].map((k) => getComputedStyle(g.querySelector('.' + k)).stroke);
  });
  assert.ok(ring.every((c) => c !== 'none'), 'aro de foco visible: ' + ring.join(' / '));
  if (SHOTS) {
    const r = await page.locator('#s-mapa [data-station=sql]').boundingBox();
    await page.screenshot({ path: path.join(SHOTS, tag + '-mapa-foco.png'), clip: { x: Math.max(0, r.x - 120), y: r.y - 120, width: 300, height: 260 }, animations: 'disabled' });
  }
  await page.click('#s-mapa .line-list [data-line=edar-dev-jr]');
  await page.waitForSelector('#s-linea:not([hidden])');
  await check('linea');
  await page.click('#s-linea .st-rows [data-station=apis]');
  await page.waitForSelector('#s-estacion .shortcut');
  await check('estacion-atajo');
  await shortcutAnswer(page, 'apis', [true, false]);
  await check('estacion-atajo-respondido');
  await page.click('#s-estacion .shortcut button.check');
  await page.waitForSelector('#s-estacion .shortcut-result');
  await check('estacion-resultado');
  await page.click('#s-estacion .topnav button');
  await page.waitForSelector('#s-linea:not([hidden])');
  await page.click('#s-linea .st-rows [data-station=git]');
  await page.waitForSelector('#s-estacion:not([hidden])');
  await check('estacion-vista');
  // Sesión: repaso sin responder, bien, mal, idea de un paso nuevo y cierre.
  await page.click('#tabbar [data-tab=hoy]');
  await page.click('#s-hoy .session-cta');
  await page.waitForSelector('#s-sesion .ses-card.question');
  await check('sesion-pregunta');
  await answerCard(page, true);
  await check('sesion-bien');
  await nextCard(page);
  await answerCard(page, false);
  await check('sesion-mal');
  await nextCard(page);
  await page.waitForSelector('#s-sesion .ses-card.idea');
  await check('sesion-idea');
  await finishAllRight(page);
  await check('sesion-cierre');
  // Cuestionario: Descubre vacío, una pregunta y el resultado sin cuenta (detalle cerrado y abierto).
  await page.click('.session-end button:has-text("Listo")');
  await page.waitForSelector('#s-hoy:not([hidden])');
  await page.click('#tabbar [data-tab=descubre]');
  await page.waitForSelector('#s-descubre:not([hidden])');
  await check('descubre');
  await page.click('#s-descubre #descubre-start');
  await page.waitForSelector('#s-quiz:not([hidden]) .opt');
  await check('cuestionario-pregunta');
  await answerQuiz(page, '11111111');
  await check('cuestionario-resultado');
  await page.click('#s-result details.result-more > summary');
  await check('cuestionario-resultado-detalle');
  // Yo con cuenta: el correo, «Cerrar sesión» y Mis respuestas.
  await page.click('#s-result #device-note button');
  await page.waitForSelector('#s-yo:not([hidden])');
  await page.evaluate(() => window.__fakeLogin());
  await page.waitForSelector('#s-yo #logout');
  await check('yo-con-cuenta');
  assert.deepEqual(errors, [], 'errores de JS (' + tag + ')');
  await ctx.close();

  // Vista docente con filas sembradas (incluida una con correo largo y otra de otra versión).
  const ctxT = await browser.newContext({ viewport, colorScheme, deviceScaleFactor: 1 });
  const t = await openHome(ctxT, { session: true, admin: true, seedJson: teacherSeedJson(), clock: TEACHER_DAY + 'T12:00:00', local: JSON.stringify(goalOnly()) });
  await t.page.click('#tabbar [data-tab=yo]');
  await t.page.click('#s-yo button:has-text("Vista docente")');
  await t.page.waitForSelector('#s-admin table.prog tbody tr');
  await t.page.waitForSelector('#s-admin .attempts details.attempt');
  assert.equal(await t.page.locator('#s-admin .scrollhint').isVisible(), viewport.width < 720, 'aviso de deslizar según el desborde real (' + tag + ')');
  await shoot(t.page, 'docente');
  assert.deepEqual(t.errors, [], 'errores de JS en la vista docente (' + tag + ')');
  await ctxT.close();
}

// Línea en miniatura de Hoy: con cada una de las nueve líneas como meta, a 320, 360 y 390 px, ninguna etiqueta se corta
// (ni en ancho ni con «…» por exceso de renglones), ninguna palabra se parte a media palabra, ninguna se encima con otra
// y la página no se desborda.
async function miniLineScenarios(browser, setStep) {
  const { LINEAS } = require('../js/data-lineas.js');
  for (const width of [320, 360, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 844 }, colorScheme: 'light', deviceScaleFactor: 1 });
    for (const line of LINEAS) {
      setStep('miniatura de Hoy: ' + line.id + ' a ' + width + ' px');
      const goal = { v: 2, goal: line.id, goalT: 1, items: {}, days: {} };
      const { page, errors } = await openHome(ctx, { local: JSON.stringify(goal) });
      await page.waitForSelector('#s-hoy .mini-labels .lab');
      const problems = await page.evaluate(() => {
        const out = [];
        const labs = Array.from(document.querySelectorAll('#s-hoy .mini-labels .lab'));
        const probe = document.createElement('span');
        document.body.append(probe);
        labs.forEach((l) => {
          const t = l.textContent;
          if (l.scrollWidth > l.clientWidth + 1 || l.scrollHeight > l.clientHeight + 1) out.push('cortada: ' + t);
          const cs = getComputedStyle(l);
          probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:' + cs.font + ';letter-spacing:' + cs.letterSpacing;
          t.split(/\s+/).forEach((w) => {
            probe.textContent = w;
            if (probe.getBoundingClientRect().width > l.clientWidth + 0.5) out.push('palabra partida «' + w + '» (' + probe.getBoundingClientRect().width.toFixed(1) + '/' + l.clientWidth.toFixed(1) + ')');
          });
        });
        probe.remove();
        const r = labs.map((l) => l.getBoundingClientRect());
        for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
          if (r[i].left < r[j].right - 0.5 && r[j].left < r[i].right - 0.5 && r[i].top < r[j].bottom - 0.5 && r[j].top < r[i].bottom - 0.5) out.push('encimadas: ' + labs[i].textContent + ' y ' + labs[j].textContent);
        }
        if (!(document.documentElement.scrollWidth <= window.innerWidth)) out.push('scroll horizontal');
        return out;
      });
      assert.deepEqual(problems, [], 'miniatura de ' + line.id + ' a ' + width + ' px');
      assert.deepEqual(errors, []);
      if (SHOTS) {
        const box = await page.locator('#s-hoy .goal').boundingBox();
        await page.screenshot({ path: path.join(SHOTS, 'mini-' + width + '-' + line.id + '.png'), clip: { x: 0, y: box.y, width, height: box.height }, animations: 'disabled' });
      }
      await page.close();
    }
    await ctx.close();
  }
}

// Revisa con las cajas reales (getBBox) que ninguna etiqueta ni insignia «L#» del mapa se encime con otra, con una
// estación ni con un tramo, y que la estimación de core.js (mapLayout) sea holgada respecto a lo dibujado.
async function mapLabelProblems(page) {
  return page.evaluate(() => {
    const svg = document.querySelector('#s-mapa svg.metro');
    const lay = mapLayout(LINEAS, ESTACIONES);
    const out = [];
    const boxes = [];
    svg.querySelectorAll('[data-station]').forEach((g) => {
      const id = g.getAttribute('data-station');
      const t = g.querySelector('text').getBBox();
      const b = { x0: t.x, x1: t.x + t.width, y0: t.y, y1: t.y + t.height, id };
      const est = lay.byId[id].label.box;
      if (b.x0 < est.x0 - 1 || b.x1 > est.x1 + 1) out.push('estimación corta: ' + id + ' ' + JSON.stringify([b.x0, b.x1, est.x0, est.x1]));
      if (b.x0 < 0 || b.x1 > 360) out.push('etiqueta fuera del lienzo: ' + id);
      boxes.push(b);
    });
    svg.querySelectorAll('[data-badge]').forEach((g) => {
      const lid = g.getAttribute('data-badge');
      const r = g.querySelector('rect').getBBox(), t = g.querySelector('text').getBBox();
      // El texto de la insignia cabe en su rectángulo, con 2 de aire a los lados.
      if (t.x < r.x + 2 || t.x + t.width > r.x + r.width - 2 || t.y < r.y - 1 || t.y + t.height > r.y + r.height + 1) out.push('texto fuera de la insignia: ' + lid);
      if (r.x < 0 || r.x + r.width > 360) out.push('insignia fuera del lienzo: ' + lid);
      boxes.push({ x0: r.x, x1: r.x + r.width, y0: r.y, y1: r.y + r.height, id: 'insignia ' + lid });
    });
    const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) if (hit(boxes[i], boxes[j])) out.push('etiquetas encimadas: ' + boxes[i].id + ' y ' + boxes[j].id);
      lay.nodes.forEach((n) => {
        if (n.id !== boxes[i].id && hit(boxes[i], { x0: n.x - n.w / 2, x1: n.x + n.w / 2, y0: n.y - n.h / 2, y1: n.y + n.h / 2 })) out.push('etiqueta sobre estación: ' + boxes[i].id + ' / ' + n.id);
      });
      Object.keys(lay.paths).forEach((lid) => {
        if (lay.paths[lid].some((sg) => coreSegHitsBox(sg, boxes[i], 3.5))) out.push('etiqueta sobre línea: ' + boxes[i].id + ' / ' + lid);
      });
    }
    return out;
  });
}

// Respuestas del atajo: índice correcto u otro, por pregunta extra.
async function shortcutAnswer(page, id, rights) {
  const oks = await page.evaluate((s) => ESTACIONES[s].extra.map((q) => q.ok), id);
  for (let i = 0; i < 2; i++) {
    const pick = rights[i] ? oks[i] : (oks[i] + 1) % 4;
    await page.click('#s-estacion .shortcut [data-q="' + i + '"] .opt >> nth=' + pick);
  }
}

async function mapaScenarios(browser, setStep) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const { page, errors } = await openHome(ctx, { clock: '2026-11-11T12:00:00', local: JSON.stringify({ v: 2, goal: 'edar-dev-jr', goalT: 1, items: {}, days: {} }) });
  await page.waitForSelector('#s-hoy:not([hidden])');
  await page.click('#tabbar [data-tab=mapa]');
  await page.waitForSelector('#s-mapa:not([hidden]) svg');
  assert.equal(await page.locator('#s-mapa svg [data-station]').count(), 32);
  assert.equal(await page.locator('#s-mapa .line-list [data-line]').count(), 9);
  assert.match(await page.getAttribute('#s-mapa svg', 'viewBox'), /^0 0 360 \d+$/);
  assert.equal(await page.getAttribute('#s-mapa svg', 'role'), 'group');
  assert.equal(await page.locator('#s-mapa svg polyline.trk').count(), 9);
  assert.equal(await page.getAttribute('#s-mapa [data-station=sql]', 'role'), 'link');
  assert.equal(await page.getAttribute('#s-mapa [data-station=sql]', 'aria-label'), 'SQL, líneas L1, L2, L4, L6 y L8, 0% de avance');
  assert.equal(await page.getAttribute('#s-mapa [data-station=apis]', 'aria-label'), 'APIs, línea L1, 0% de avance');
  // Insignias «L#» al inicio de cada línea, ocultas para lectores de pantalla.
  assert.deepEqual(await page.locator('#s-mapa svg [data-badge] text').allTextContents(), ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9']);
  assert.equal(await page.getAttribute('#s-mapa svg g.badges', 'aria-hidden'), 'true');
  const badgeFs = await page.evaluate(() => {
    const svg = document.querySelector('#s-mapa svg.metro');
    return svg.getBoundingClientRect().width / 360 * parseFloat(getComputedStyle(svg.querySelector('[data-badge] text')).fontSize);
  });
  assert.ok(badgeFs >= 10, 'letra de insignia de ' + badgeFs + ' px');
  // Las insignias no roban toques: en cada punto del área táctil (radio 22) de una estación que cae dentro
  // de una insignia, el elemento que recibe el toque es esa estación.
  const stolen = await page.evaluate(() => {
    const svg = document.querySelector('#s-mapa svg.metro');
    const lay = mapLayout(LINEAS, ESTACIONES);
    const out = [];
    let checked = 0;
    lay.nodes.forEach((n) => {
      const g = svg.querySelector('[data-station="' + n.id + '"]');
      g.scrollIntoView({ block: 'center' });
      const ctm = svg.getScreenCTM();
      lay.badges.forEach((b) => {
        for (let x = b.box.x0; x <= b.box.x1; x += 2) for (let y = b.box.y0; y <= b.box.y1; y += 2) {
          if (Math.hypot(x - n.x, y - n.y) > 21) continue;
          const p = new DOMPoint(x, y).matrixTransform(ctm);
          const hit = document.elementFromPoint(p.x, p.y);
          checked++;
          if (!hit || hit.closest('[data-badge]') || !g.contains(hit)) out.push(n.id + ' en ' + x + ',' + y + ' → ' + (hit ? hit.getAttribute('class') : 'nada'));
        }
      });
    });
    window.scrollTo(0, 0);
    return { checked, out };
  });
  assert.ok(stolen.checked > 50, 'se revisaron ' + stolen.checked + ' puntos');
  assert.deepEqual(stolen.out, [], 'toques que caen en una insignia');
  assert.match(await page.getAttribute('#s-mapa [data-station=git]', 'aria-label'), /vas aquí/);
  assert.equal(await page.locator('#s-mapa [data-station].cur').count(), 1, 'una sola estación actual');
  assert.match(await page.textContent('#s-mapa .line-list [data-line=safe-soc]'), /L5[^]*Analista SOC[^]*SAFE[^]*0% listo/);
  assert.ok(await page.evaluate(noHScroll), 'sin scroll horizontal en el mapa');
  assert.deepEqual(await mapLabelProblems(page), [], 'etiquetas del mapa');
  // Tamaño real de la letra de las etiquetas a 390 px: al menos 11 px.
  const fs = await page.evaluate(() => {
    const svg = document.querySelector('#s-mapa svg.metro');
    return svg.getBoundingClientRect().width / 360 * parseFloat(getComputedStyle(svg.querySelector('[data-station] text')).fontSize);
  });
  assert.ok(fs >= 11, 'letra de etiqueta de ' + fs + ' px');

  setStep('estaciones con teclado');
  // Teclado: las estaciones se alcanzan con Tab y se abren con Enter o Espacio.
  await page.focus('#s-mapa [data-station=sql]');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#s-estacion:not([hidden])');
  assert.equal(await page.textContent('#s-estacion h1'), 'SQL');
  assert.equal(await page.getAttribute('#tabbar [data-tab=mapa]', 'aria-current'), 'page');
  await page.click('#s-estacion .topnav button');
  await page.waitForSelector('#s-mapa:not([hidden])');
  await page.focus('#s-mapa [data-station=git]');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-station')), 'datos', 'Tab sigue el orden de la línea');
  await page.keyboard.press(' ');
  await page.waitForSelector('#s-estacion:not([hidden])');
  assert.equal(await page.textContent('#s-estacion h1'), 'Datos');
  await page.click('#s-estacion .topnav button');
  await page.waitForSelector('#s-mapa:not([hidden])');

  setStep('estación compartida cuenta en todas sus líneas');
  await page.click('#s-mapa [data-station=sql]');
  await page.waitForSelector('#s-estacion:not([hidden])');
  assert.match(await page.textContent('#s-estacion .st-lines'), /L1.*L2.*L4.*L6.*L8/s);
  assert.equal(await page.locator('#s-estacion .shortcut').count(), 1, 'tarjeta «¿Ya sabes esto?»');
  assert.match(await page.textContent('#s-estacion'), /Por descubrir en tu próxima sesión/);
  assert.equal(await page.isDisabled('#s-estacion .shortcut button.check'), true, 'Comprobar espera las dos respuestas');
  const whys = await page.evaluate(() => ESTACIONES.sql.extra.map((q) => q.why));
  assert.ok(!(await page.textContent('#s-estacion')).includes(whys[0]), 'sin explicación antes de comprobar');
  // La región viva del atajo existe vacía desde antes y es la misma después de comprobar.
  assert.equal(await page.getAttribute('#s-estacion [data-live=atajo]', 'role'), 'status');
  assert.equal(await page.textContent('#s-estacion [data-live=atajo]'), '');
  await page.evaluate(() => { window.__live = document.querySelector('#s-estacion [data-live=atajo]'); });
  await shortcutAnswer(page, 'sql', [true, true]);
  assert.equal(await page.isDisabled('#s-estacion .shortcut button.check'), false);
  await page.click('#s-estacion .shortcut button.check');
  await page.waitForSelector('#s-estacion .shortcut-result');
  assert.match(await page.textContent('#s-estacion .shortcut-result'), /Listo: la estación queda vista y la repasas en 7 días/);
  assert.equal(await page.evaluate(() => document.querySelector('#s-estacion [data-live=atajo]') === window.__live && window.__live.isConnected), true, 'misma región viva');
  assert.match(await page.textContent('#s-estacion [data-live=atajo]'), /^Listo: la estación queda vista y la repasas en 7 días\. Pregunta 1: correcto\. Pregunta 2: correcto\.$/);
  assert.ok((await page.textContent('#s-estacion')).includes(whys[0]), 'explicación después de comprobar');
  const afterSql = await localState(page);
  for (let n = 0; n < 6; n++) assert.equal(afterSql.items['sql.' + n].b, 3, 'sql.' + n + ' en caja 3');
  assert.equal(afterSql.items['sql.0'].due, '2026-11-18');
  assert.doesNotMatch(await page.textContent('#s-estacion'), /Por descubrir/, 'los pasos ya se ven');
  await page.click('#tabbar [data-tab=mapa]');
  await page.waitForSelector('#s-mapa:not([hidden])');
  for (const lid of ['sears-datos-jr', 'satori-cloud-jr']) {
    const pct = +(await page.textContent('#s-mapa .line-list [data-line=' + lid + '] .pct')).match(/(\d+)%/)[1];
    assert.ok(pct > 0, lid + ' sube con SQL');
  }
  assert.match(await page.getAttribute('#s-mapa [data-station=sql]', 'aria-label'), /SQL, líneas L1, L2, L4, L6 y L8, 80% de avance/);
  await page.click('#s-mapa [data-station=sql]');
  await page.waitForSelector('#s-estacion:not([hidden])');
  assert.equal(await page.locator('#s-estacion .shortcut').count(), 0, 'el atajo no se repite');

  setStep('atajo con un error');
  await page.click('#s-estacion .topnav button');
  await page.waitForSelector('#s-mapa:not([hidden])');
  await page.click('#s-mapa [data-station=redes]');
  await page.waitForSelector('#s-estacion .shortcut');
  await shortcutAnswer(page, 'redes', [true, false]);
  await page.click('#s-estacion .shortcut button.check');
  await page.waitForSelector('#s-estacion .shortcut-result');
  assert.match(await page.textContent('#s-estacion .shortcut-result'), /Vamos paso a paso: esta estación entra en tus sesiones/);
  assert.match(await page.textContent('#s-estacion [data-live=atajo]'), /Vamos paso a paso[^]*Pregunta 2: casi; la correcta es/);
  const afterRedes = await localState(page);
  assert.equal(afterRedes.items['redes.4'].b, 1);
  assert.equal(afterRedes.items['redes.5'].b, 1);
  assert.equal(afterRedes.items['redes.0'], undefined);

  setStep('Hoy: otras líneas abren su ficha');
  await page.click('#tabbar [data-tab=hoy]');
  await page.waitForSelector('#s-hoy:not([hidden])');
  await page.click('#s-hoy .lrow[data-line=sears-datos-jr]');
  await page.waitForSelector('#s-linea:not([hidden])');
  assert.match(await page.textContent('#s-linea h1'), /Analista de Datos Jr\./);
  assert.equal(await page.textContent('#s-linea .topnav button'), '← Hoy');
  await page.click('#s-linea .topnav button');
  await page.waitForSelector('#s-hoy:not([hidden])');
  // Desde el mapa, «Volver» regresa al mapa.
  await page.click('#tabbar [data-tab=mapa]');
  await page.click('#s-mapa .line-list [data-line=sears-datos-jr]');
  await page.waitForSelector('#s-linea:not([hidden])');
  assert.equal(await page.textContent('#s-linea .topnav button'), '← Mapa');
  await page.click('#s-linea .topnav button');
  await page.waitForSelector('#s-mapa:not([hidden])');

  setStep('línea: elegir como meta');
  await page.click('#tabbar [data-tab=mapa]');
  await page.click('#s-mapa .line-list [data-line=safe-soc]');
  await page.waitForSelector('#s-linea:not([hidden])');
  const ficha = await page.textContent('#s-linea');
  assert.match(ficha, /Analista SOC/);
  assert.match(ficha, /Lo que pide la vacante/);
  assert.match(ficha, /leída el/);
  assert.equal(await page.getAttribute('#s-linea a.vacante', 'target'), '_blank');
  assert.equal(await page.getAttribute('#s-linea a.vacante', 'rel'), 'noopener');
  assert.equal(await page.locator('#s-linea .st-rows [data-station]').count(), 5);
  await page.click('#s-linea .st-rows [data-station=redes]');
  await page.waitForSelector('#s-estacion:not([hidden])');
  assert.equal(await page.textContent('#s-estacion h1'), 'Redes');
  await page.click('#s-estacion .topnav button');
  await page.waitForSelector('#s-linea:not([hidden])');
  await page.click('#s-linea button:has-text("Elegir como meta")');
  await page.waitForSelector('#s-hoy:not([hidden])');
  assert.match(await page.textContent('#s-hoy'), /Analista SOC/);
  await page.waitForFunction(() => /Meta cambiada a Analista SOC/.test(document.getElementById('notices').textContent));
  assert.equal((await localState(page)).goal, 'safe-soc');
  await page.click('#tabbar [data-tab=mapa]');
  await page.click('#s-mapa .line-list [data-line=safe-soc]');
  await page.waitForSelector('#s-linea:not([hidden])');
  assert.equal(await page.isDisabled('#s-linea button:has-text("Es tu meta")'), true);
  assert.deepEqual(errors, [], 'errores de JS en mapa, línea y estación');
  await ctx.close();
}

// Cuestionario v3 (8 preguntas). Lo esperado se calcula aquí con las mismas funciones del sitio: ninguna prueba fija puntajes de SETS[3].
const keyAnswers = (keys) => keys.split('').map((k) => Number(k) - 1);
// Lo que debe mostrar el resultado para unas teclas: área #1, las respuestas de «Por qué te salió» y la línea sugerida.
function expectedResult(keys) {
  const ans = keyAnswers(keys);
  const ranked = scoreAnswers(ans, 3);
  const sugg = suggestLine(ranked, LINEAS);
  return {
    ans, ranked, top: ranked[0].key, name: AREAS[ranked[0].key].name,
    why: whyAnswers(SETS[3], ans, ranked[0].key).map((i) => SETS[3].qs[i].opts[ans[i]].t),
    line: LINEAS.find((l) => l.id === sugg.line), exact: sugg.exact
  };
}
// Teclas que llevan a «Investigación» primero: en cada pregunta, la opción con más puntos de inv (a igualdad, la que da menos a las demás).
function invKeys() {
  return SETS[3].qs.map((q) => {
    let best = 0, bestKey = null;
    q.opts.forEach((o, i) => {
      const inv = o.p.inv || 0;
      const rest = Object.keys(o.p).reduce((s, k) => s + (k === 'inv' ? 0 : o.p[k]), 0);
      const key = [inv, -rest];
      if (bestKey === null || key[0] > bestKey[0] || (key[0] === bestKey[0] && key[1] > bestKey[1])) { best = i; bestKey = key; }
    });
    return String(best + 1);
  }).join('');
}

// Contesta con el teclado las preguntas from…keys.length-1 (una tecla por pregunta). Antes de cada tecla espera a que la
// pregunta esté a la vista: con View Transitions, la pantalla aparece un cuadro después de show().
async function pressAnswers(page, keys, from) {
  for (let i = from || 0; i < keys.length; i++) {
    await page.waitForFunction((n) => !document.getElementById('s-quiz').hidden && document.getElementById('counter').textContent === 'Pregunta ' + n + ' de 8', i + 1);
    await page.keyboard.press(keys[i]);
  }
}
// Igual, hasta la última pregunta, y espera el resultado.
async function answerQuiz(page, keys, from) {
  await pressAnswers(page, keys, from);
  await page.waitForSelector('#s-result:not([hidden])');
}

// Cuestionario desde la pestaña Descubre: «Empezar» si no hay resultado, «Volver a hacerlo» si lo hay. keys: 8 teclas.
async function takeQuiz(page, keys) {
  await page.click('#tabbar [data-tab=descubre]');
  await page.waitForSelector('#s-descubre:not([hidden]) #descubre-start, #s-result:not([hidden]) #quiz-again');
  if (await page.isVisible('#s-descubre #descubre-start')) await page.click('#s-descubre #descubre-start');
  else await page.click('#s-result #quiz-again');
  await answerQuiz(page, keys || '11111111');
}

// Problemas de forma del resultado: encabezados con saltos, controles visibles de menos de 44 px.
const resultShape = () => {
  const levels = Array.from(document.querySelectorAll('#s-result h1, #s-result h2, #s-result h3, #s-result h4, #s-result h5, #s-result h6'), (h) => Number(h.tagName[1]));
  const jumps = levels.filter((l, i) => (i === 0 ? l !== 1 : l > levels[i - 1] + 1));
  const small = Array.from(document.querySelectorAll('#s-result button, #s-result a, #s-result summary')).filter((n) => n.getClientRects().length)
    .map((n) => { const r = n.getBoundingClientRect(); return { t: n.textContent.trim(), w: r.width, h: r.height }; })
    .filter((r) => r.w < 44 || r.h < 44);
  return { levels, jumps, h1: levels.filter((l) => l === 1).length, small, height: document.documentElement.scrollHeight };
};
const quizKey = (page) => page.evaluate(() => localStorage.getItem('mapa.quiz'));
const tipKey = (page) => page.evaluate(() => localStorage.getItem('mapa.quizTip'));
const textsOf = (page, sel) => page.locator(sel).allTextContents();

async function descubreScenarios(browser, setStep) {
  const exp = expectedResult('11111111');
  assert.equal(exp.why.length, 2, 'la trayectoria de prueba tiene dos respuestas en «Por qué te salió»');

  setStep('Descubre: la puerta 1 abre la pregunta 1; teclas y «← Atrás»');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const { page, errors } = await openHome(ctx);
  await page.click('#door-quiz');
  await page.waitForSelector('#s-quiz:not([hidden]) .opt');
  assert.equal(await page.textContent('#counter'), 'Pregunta 1 de 8');
  assert.equal(await page.getAttribute('#ticks', 'aria-valuemax'), '8');
  assert.equal(await page.locator('main h1:visible').count(), 1, 'un solo h1 visible');
  assert.equal(await page.textContent('#s-quiz h1'), SETS[3].qs[0].q, 'la pregunta es el h1');
  assert.equal(await page.locator('#s-quiz .gloss').count(), 0, 'sin glosario');
  await page.click('#back');
  await page.waitForSelector('#s-entrada:not([hidden])');
  await page.click('#door-quiz');
  await page.waitForSelector('#s-quiz:not([hidden]) .opt');
  await page.keyboard.press(String(SETS[3].qs[0].opts.length)); // la última opción (la 5) también responde
  await page.waitForFunction(() => document.getElementById('counter').textContent === 'Pregunta 2 de 8');
  await page.waitForFunction(() => document.activeElement === document.querySelector('#s-quiz h1'));
  await page.click('#back');
  await page.waitForFunction(() => document.getElementById('counter').textContent === 'Pregunta 1 de 8');
  assert.equal(await page.getAttribute('#s-quiz .opt >> nth=' + (SETS[3].qs[0].opts.length - 1), 'aria-pressed'), 'true', 'recuerda lo que contestaste');

  setStep('Descubre: el resultado corto');
  await answerQuiz(page, '11111111');
  await page.waitForFunction(() => document.activeElement === document.querySelector('#s-result h1'));
  assert.equal(await page.textContent('#s-result h1'), exp.name);
  assert.equal(await page.title(), 'Tu resultado · Mapa de áreas');
  assert.equal(await page.getAttribute('#tabbar [data-tab=descubre]', 'aria-current'), 'page');
  const shape = await page.evaluate(resultShape);
  assert.deepEqual(shape.jumps, [], 'encabezados sin saltos: ' + shape.levels.join(','));
  assert.equal(shape.h1, 1);
  assert.ok(shape.levels.includes(3), 'llega a h3');
  assert.deepEqual(shape.small, [], 'controles de menos de 44 px');
  assert.ok(shape.height <= 1300, 'el resultado mide ' + shape.height + ' px a 390');
  assert.deepEqual(await textsOf(page, '#s-result .why-list li'), exp.why, '«Por qué te salió» coincide con whyAnswers');
  assert.equal(await page.getAttribute('#s-result .line-card.sugg', 'data-line'), exp.line.id);
  assert.equal(await page.textContent('#s-result .line-card.sugg .lvl'), exp.line.level, 'la tarjeta muestra el nivel');
  assert.match(await page.textContent('#s-result .line-card.sugg'), new RegExp(exp.line.company));
  assert.equal(await page.locator('#s-result .res-other').count(), 2);
  assert.match(await page.textContent('#s-result'), /Es una afinidad para empezar a explorar, no un veredicto\./);
  assert.match(await page.textContent('#s-result #device-note'), /Tu resultado queda en este dispositivo\. Con cuenta lo conservas en todos\./);
  assert.equal(await page.locator('#s-result button:has-text("Mis respuestas")').count(), 0, 'Mis respuestas solo con sesión');
  assert.equal(await page.evaluate(() => window.__db.mapa_respuestas.length), 0, 'sin cuenta no se inserta nada');
  assert.deepEqual(JSON.parse(await quizKey(page)).answers, exp.ans, 'mapa.quiz guardado');
  assert.equal(JSON.parse(await quizKey(page)).v, 3);
  await page.setViewportSize({ width: 320, height: 640 });
  assert.equal(await page.evaluate(noHScroll), true, 'sin scroll horizontal a 320 px');
  await page.setViewportSize({ width: 390, height: 844 });

  setStep('Descubre: «Ver detalle» plegado');
  assert.equal(await page.evaluate(() => document.querySelector('#s-result details.result-more').open), false, 'cerrado al llegar');
  assert.equal(await page.isVisible('#s-result .bars'), false);
  await page.click('#s-result details.result-more > summary');
  assert.equal(await page.locator('#s-result .bar-row:visible').count(), 9, 'barras de las 9 áreas');
  assert.ok(await page.locator('#s-result .projects li:visible').count() >= 3, 'proyectos');
  assert.equal(await page.locator('#s-result .result-more .other:visible').count(), 6, 'las otras seis áreas');
  assert.equal(await page.locator('#s-result .steps li:visible').count(), 3);
  assert.deepEqual((await page.evaluate(resultShape)).small, [], 'controles de menos de 44 px con el detalle abierto');

  setStep('Descubre: copiar mi resultado');
  assert.equal(await page.locator('#s-result [role=status]').count(), 1, 'un solo role=status');
  await page.click('#copy-result');
  await page.waitForFunction(() => document.getElementById('copy-status').textContent === 'Copiado');
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), new RegExp('^Mi mapa de áreas: 1\\) ' + exp.name));
  assert.equal(await page.isDisabled('#copy-result'), false, 'el botón no se deshabilita');
  await page.waitForFunction(() => document.getElementById('copy-status').textContent === '', null, { timeout: 4000 });
  await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('sin permiso')); });
  await page.click('#copy-result');
  await page.waitForFunction(() => /No se pudo copiar/.test(document.getElementById('copy-status').textContent));
  assert.equal(await page.isVisible('#share-text'), true, 'aparece el texto seleccionable');
  assert.match(await page.inputValue('#share-text'), /^Mi mapa de áreas: /);
  assert.equal(await page.isDisabled('#copy-result'), false);
  await page.waitForTimeout(1500);
  await page.click('#copy-result'); // otro clic reinicia los 2 s
  await page.waitForTimeout(1000);
  assert.match(await page.textContent('#copy-status'), /No se pudo copiar/, 'el temporizador se reinició');
  await page.waitForFunction(() => document.getElementById('copy-status').textContent === '', null, { timeout: 4000 });

  setStep('Descubre: al recargar sin meta se entra en el resultado; «Volver a hacerlo»');
  await page.reload();
  await page.waitForSelector('#s-result:not([hidden])');
  assert.equal(await page.textContent('#s-result h1'), exp.name);
  assert.equal(await page.getAttribute('#tabbar [data-tab=descubre]', 'aria-current'), 'page');
  assert.equal(await page.evaluate(() => document.querySelector('#s-result details.result-more').open), false);
  await page.click('#s-result #quiz-again');
  await page.waitForFunction(() => !document.getElementById('s-quiz').hidden && document.getElementById('counter').textContent === 'Pregunta 1 de 8');
  await page.click('#back');
  await page.waitForSelector('#s-result:not([hidden])');

  setStep('Descubre: «Elegir como meta» y «Ver en el mapa»');
  await page.click('#s-result #result-goal');
  await page.waitForSelector('#s-hoy:not([hidden])');
  await page.waitForFunction((t) => document.getElementById('notices').textContent.includes('Meta cambiada a ' + t + '.'), exp.line.title);
  assert.equal((await localState(page)).goal, exp.line.id);
  assert.equal(await page.locator('#s-hoy .quiz-tip').count(), 0, 'con resultado no hay tarjeta en Hoy');
  await page.click('#tabbar [data-tab=descubre]');
  await page.waitForSelector('#s-result:not([hidden])');
  assert.equal(await page.textContent('#s-result #result-goal'), 'Ir a Hoy', 'la línea ya es la meta');
  assert.match(await page.textContent('#s-result .line-card.sugg'), /Tu meta actual/);
  await page.click('#s-result #result-goal');
  await page.waitForSelector('#s-hoy:not([hidden])');
  await page.click('#tabbar [data-tab=descubre]');
  await page.click('#s-result .line-card.sugg .line-link');
  await page.waitForSelector('#s-linea:not([hidden])');
  assert.equal(await page.textContent('#s-linea h1'), exp.line.title);

  setStep('Descubre: Yo sin el cuestionario; «Borrar mis datos» limpia el resultado');
  await page.click('#tabbar [data-tab=yo]');
  await page.waitForSelector('#s-yo:not([hidden])');
  assert.doesNotMatch(await page.textContent('#s-yo'), /¿Qué área va contigo\?/);
  assert.equal(await page.locator('#s-yo button:has-text("Mis respuestas")').count(), 0);
  await page.evaluate(() => localStorage.setItem('mapa.quizTip', '1'));
  const del = page.locator('#s-yo button.danger');
  await del.click();
  await del.click();
  await page.waitForSelector('#s-entrada:not([hidden])');
  assert.equal(await quizKey(page), null);
  assert.equal(await tipKey(page), null);
  assert.equal(await page.evaluate(() => savedQuiz()), null, 'ni en memoria');
  assert.deepEqual(errors, [], 'errores de JS en Descubre');
  await ctx.close();

  setStep('Descubre: «Investigación» primero no tiene vacante');
  const ik = invKeys();
  const ie = expectedResult(ik);
  assert.equal(ie.top, 'inv', 'la trayectoria de prueba deja Investigación primero');
  const ctxI = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const I = await openHome(ctxI);
  await I.page.click('#door-quiz');
  await answerQuiz(I.page, ik);
  assert.equal(await I.page.textContent('#s-result h1'), AREAS.inv.name);
  assert.match(await I.page.textContent('#s-result #no-vacancy'), /Aún no tenemos una vacante de investigación/);
  assert.equal(await I.page.getAttribute('#s-result .line-card.sugg', 'data-line'), ie.line.id, 'la línea es la de suggestLine');
  assert.deepEqual(await textsOf(I.page, '#s-result .why-list li'), ie.why);
  const ishape = await I.page.evaluate(resultShape);
  assert.deepEqual(ishape.jumps, []);
  assert.deepEqual(ishape.small, []);
  assert.ok(ishape.height <= 1300, 'el resultado de investigación mide ' + ishape.height + ' px a 390');
  assert.deepEqual(I.errors, []);
  await ctxI.close();

  setStep('Descubre: tarjeta de Hoy');
  const ctxH = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const H = await openHome(ctxH, { local: JSON.stringify(progressState()) });
  await H.page.waitForSelector('#s-hoy .quiz-tip');
  assert.equal(await H.page.evaluate(() => document.querySelector('#s-hoy').lastElementChild.classList.contains('quiz-tip')), true, 'va debajo de la sesión y de las otras líneas');
  assert.match(await H.page.textContent('#s-hoy .quiz-tip'), /¿Dudas si esta es tu área\?[^]*5 minutos/);
  await H.page.click('#s-hoy #tip-go');
  await H.page.waitForFunction(() => !document.getElementById('s-quiz').hidden && document.getElementById('counter').textContent === 'Pregunta 1 de 8');
  await H.page.click('#back');
  await H.page.waitForSelector('#s-hoy:not([hidden]) .quiz-tip');
  await H.page.click('#s-hoy #tip-no');
  assert.equal(await H.page.locator('#s-hoy .quiz-tip').count(), 0);
  assert.equal(await tipKey(H.page), '1');
  await H.page.reload();
  await H.page.waitForSelector('#s-hoy:not([hidden])');
  assert.equal(await H.page.locator('#s-hoy .quiz-tip').count(), 0, 'no vuelve tras recargar');
  await H.page.click('#s-hoy .session-cta');
  await H.page.waitForSelector('#s-sesion .ses-card');
  assert.equal(await H.page.locator('.quiz-tip:visible').count(), 0, 'no hay tarjeta dentro de la sesión');
  assert.deepEqual(H.errors, []);
  await ctxH.close();

  setStep('Descubre: con cuenta se guarda un intento v3; un intento v1 sigue legible');
  const v1 = Array(SETS[1].qs.length).fill(0);
  const oldRow = { id: 'v1old', user_id: 'u1', email: 'alumno@test.mx', created_at: '2026-10-01T12:00:00Z', answers: v1,
    scores: Object.fromEntries(scoreAnswers(v1, 1).map((r) => [r.key, r.pct])), quiz_version: 1 };
  const ctxS = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const S = await openHome(ctxS, { session: true, seed: { mapa_respuestas: [oldRow] }, local: JSON.stringify(progressState()) });
  await S.page.waitForSelector('#s-hoy:not([hidden])');
  await takeQuiz(S.page);
  await S.page.waitForFunction(() => /Guardado en tu cuenta/.test(document.getElementById('save-note').textContent));
  const rows = await S.page.evaluate(() => window.__db.mapa_respuestas);
  assert.equal(rows.length, 2, 'un insert');
  assert.equal(rows[1].quiz_version, 3);
  assert.deepEqual(rows[1].answers, exp.ans);
  assert.equal(await S.page.locator('#s-result #device-note').count(), 0);
  await S.page.click('#tabbar [data-tab=hoy]');
  await S.page.click('#tabbar [data-tab=descubre]');
  await S.page.waitForSelector('#s-result:not([hidden])');
  await S.page.waitForTimeout(300);
  assert.equal(await S.page.evaluate(() => window.__db.mapa_respuestas.length), 2, 'reabrir Descubre no inserta otro');
  await S.page.click('#s-result button:has-text("Mis respuestas")');
  await S.page.waitForSelector('#s-history:not([hidden]) table');
  assert.equal(await S.page.locator('#s-history details.attempt').count(), 2);
  const oldAttempt = S.page.locator('#s-history details.attempt').nth(1);
  assert.match(await oldAttempt.locator('summary').textContent(), new RegExp(SETS[1].name));
  await oldAttempt.locator('summary').click();
  assert.equal(await oldAttempt.locator('.qa li').count(), SETS[1].qs.length, 'el intento v1 se lee con sus preguntas');
  assert.match(await oldAttempt.locator('.qa').textContent(), new RegExp(SETS[1].qs[0].q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await S.page.click('#s-history .topnav button');
  await S.page.waitForSelector('#s-yo:not([hidden])');
  assert.doesNotMatch(await S.page.textContent('#s-yo'), /¿Qué área va contigo\?/);
  assert.equal(await S.page.locator('#s-yo #account #to-history').count(), 1, 'Mis respuestas en la tarjeta de cuenta');
  await S.page.evaluate(() => { window.__failInsert = true; });
  await takeQuiz(S.page);
  await S.page.waitForFunction(() => /No se pudo guardar en tu cuenta/.test(document.getElementById('save-note').textContent));
  assert.equal(await S.page.isVisible('#s-result h1'), true, 'el resultado sigue visible');
  assert.equal(await S.page.evaluate(() => window.__db.mapa_respuestas.length), 2);
  await S.page.evaluate(() => { window.__failInsert = false; localStorage.setItem('mapa.quizTip', '1'); });
  await S.page.click('#tabbar [data-tab=yo]');
  await S.page.click('#s-yo #logout');
  await S.page.waitForSelector('#s-entrada:not([hidden])');
  assert.equal(await quizKey(S.page), null, 'cerrar sesión borra mapa.quiz');
  assert.equal(await tipKey(S.page), null, 'y mapa.quizTip');
  assert.equal(await S.page.evaluate(() => savedQuiz()), null);
  assert.deepEqual(S.errors, []);
  await ctxS.close();

  setStep('Descubre: sin localStorage el resultado y «Elegir como meta» funcionan');
  const ctxN = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const N = await openHome(ctxN, { noStorage: true });
  await N.page.click('#door-quiz');
  await answerQuiz(N.page, '11111111');
  assert.equal(await N.page.textContent('#s-result h1'), exp.name);
  assert.match(await N.page.textContent('#s-result #device-note'), /se pierde al cerrar/);
  await N.page.click('#s-result #result-goal');
  await N.page.waitForSelector('#s-hoy:not([hidden])');
  assert.equal(await N.page.evaluate(() => state.goal), exp.line.id);
  await N.page.click('#tabbar [data-tab=descubre]');
  await N.page.waitForSelector('#s-result:not([hidden])'); // el resultado sigue en memoria durante la visita
  assert.deepEqual(N.errors, []);
  await ctxN.close();

  setStep('Descubre: recargar a media pregunta no guarda un resultado parcial');
  const ctxR = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const Rl = await openHome(ctxR);
  await Rl.page.click('#door-quiz');
  await pressAnswers(Rl.page, '111');
  await Rl.page.waitForFunction(() => document.getElementById('counter').textContent === 'Pregunta 4 de 8');
  await Rl.page.reload();
  await Rl.page.waitForSelector('#s-entrada:not([hidden])');
  assert.equal(await quizKey(Rl.page), null);
  assert.deepEqual(Rl.errors, []);
  await ctxR.close();

  setStep('Descubre: iniciar sesión a media pregunta no saca del cuestionario y se inserta una vez');
  const ctxL = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const L = await openHome(ctxL);
  await L.page.click('#door-quiz');
  await pressAnswers(L.page, '11');
  await L.page.waitForFunction(() => document.getElementById('counter').textContent === 'Pregunta 3 de 8');
  await L.page.evaluate(() => window.__fakeLogin());
  await L.page.waitForFunction(() => window.__db.mapa_progreso.length === 1 && pendingSyncs.length === 0); // el SIGNED_IN ya sincronizó
  assert.equal(await L.page.isVisible('#s-quiz'), true, 'sigue en el cuestionario');
  assert.equal(await L.page.textContent('#counter'), 'Pregunta 3 de 8');
  await answerQuiz(L.page, '11111111', 2);
  await L.page.waitForFunction(() => /Guardado en tu cuenta/.test(document.getElementById('save-note').textContent));
  assert.equal(await L.page.evaluate(() => window.__db.mapa_respuestas.length), 1, 'exactamente un insert');
  // Otro SIGNED_IN con el resultado en pantalla: no cambia de pantalla ni inserta.
  await L.page.evaluate(() => window.__fakeLogin());
  await L.page.waitForTimeout(300);
  assert.equal(await L.page.isVisible('#s-result h1'), true);
  assert.equal(await L.page.evaluate(() => window.__db.mapa_respuestas.length), 1);
  // Doble toque en la última pregunta: un solo resultado y un solo insert.
  await L.page.click('#s-result #quiz-again');
  await pressAnswers(L.page, '1111111');
  await L.page.waitForFunction(() => document.getElementById('counter').textContent === 'Pregunta 8 de 8');
  await L.page.evaluate(() => { const b = document.querySelector('#s-quiz .opt'); b.click(); b.click(); });
  await L.page.keyboard.press('1');
  await L.page.waitForSelector('#s-result:not([hidden])');
  await L.page.keyboard.press('1');
  await L.page.waitForTimeout(500);
  assert.equal(await L.page.evaluate(() => window.__db.mapa_respuestas.length), 2, 'un insert por intento');
  assert.deepEqual(L.errors, []);
  await ctxL.close();

  setStep('Descubre: borrar el resultado en otra pestaña (sin progreso) vuelve a la invitación');
  const ctxW = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const A = await openHome(ctxW);
  await A.page.click('#door-quiz');
  await answerQuiz(A.page, '11111111');
  const B = await openHome(ctxW);
  await B.page.waitForSelector('#s-result:not([hidden])');
  await B.page.click('#tabbar [data-tab=yo]');
  const delB = B.page.locator('#s-yo button.danger');
  await delB.click();
  await delB.click();
  await B.page.waitForSelector('#s-entrada:not([hidden])');
  await A.page.waitForSelector('#s-descubre:not([hidden]) #descubre-start');
  assert.equal(await A.page.evaluate(() => savedQuiz()), null);
  assert.deepEqual(A.errors, []);
  assert.deepEqual(B.errors, []);
  await ctxW.close();
}

// Filas de mapa_progreso para la vista docente. Se arman como texto JSON para que «__proto__» sea una llave propia,
// como llega de la base de datos.
const TEACHER_DAY = '2026-11-10';
const goalOnly = () => ({ v: 2, goal: 'edar-dev-jr', goalT: 1, items: {}, days: {} });
const LONG_EMAIL = 'estudiante.con.un.correo.muy.largo.de.prueba@universidad.ejemplo.edu.mx';
function teacherSeedJson() {
  const deep = '['.repeat(6000) + '1' + ']'.repeat(6000);
  const items = {};
  // Primera estación de safe-soc entera en caja 5 y la segunda empezada: el avance sale de estaciones de su meta.
  const soc = require('../js/data-lineas.js').LINEAS.find((l) => l.id === 'safe-soc').stations;
  for (let n = 0; n < 6; n++) items[soc[0] + '.' + n] = { b: 5, due: '2026-12-20', t: 1 };
  for (let n = 0; n < 2; n++) items[soc[1] + '.' + n] = { b: 2, due: '2026-12-20', t: 1 };
  const otra = { v: 2, goal: 'safe-soc', goalT: 1, items, days: {
    '2026-11-08': { xp: 50, done: true }, '2026-11-09': { xp: 60, done: true }, [TEACHER_DAY]: { xp: 70, done: true } } };
  const weird = '{"v":2,"goal":"constructor","goalT":1,"items":{"__proto__":{"b":5},"git.0":{"b":"mucho"}},"days":{"__proto__":{"xp":999,"done":true},"x":{"xp":50,"done":true},"2026-11-10":{"xp":1e12,"done":true}}}';
  const quiz = (email, n) => ({ id: 'q' + n, user_id: 'u' + n, email, created_at: '2026-11-0' + n + 'T12:00:00Z', answers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    scores: Object.fromEntries(scoreAnswers([0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 2).map((r) => [r.key, r.pct])), quiz_version: 2 });
  return '{"mapa_progreso":[' + [
    JSON.stringify({ user_id: 'u5', email: 'otra@test.mx', state: otra, updated_at: '2026-11-10T10:00:00Z' }),
    JSON.stringify({ user_id: 'u2', email: 'rara@test.mx', state: { v: 9 }, updated_at: '2026-11-10T09:00:00Z' }),
    '{"user_id":"u3","email":"weird@test.mx","state":' + weird + ',"updated_at":"2026-11-10T08:00:00Z"}',
    // Valores anidados 6000 veces: Number() sobre ellos lanza RangeError; una fila así no debe tumbar la tabla.
    '{"user_id":"u6","email":"hostil@test.mx","state":{"v":2,"goal":"safe-soc","goalT":' + deep + ',"items":{"git.0":{"b":' + deep + '}},"days":{"2026-11-10":{"xp":' + deep + ',"done":false}}},"updated_at":"2026-11-10T06:00:00Z"}',
    JSON.stringify({ user_id: 'u7', email: LONG_EMAIL, state: { v: 2, goal: null, goalT: 0, items: {}, days: {} }, updated_at: '2026-11-10T05:00:00Z' }),
    JSON.stringify({ user_id: 'u4', email: 'nuevo@test.mx', state: { v: 2, goal: null, goalT: 0, items: {}, days: {} }, updated_at: '2026-11-10T07:00:00Z' })
  ].join(',') + '],"mapa_respuestas":' + JSON.stringify([quiz('otra@test.mx', 1), quiz('nuevo@test.mx', 2), quiz('rara@test.mx', 3)]) + '}';
}

async function teacherScenarios(browser, setStep) {
  setStep('vista docente');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const o = await openHome(ctx, { session: true, admin: true, seedJson: teacherSeedJson(), clock: TEACHER_DAY + 'T12:00:00',
    local: JSON.stringify(goalOnly()) });
  const { page } = o;
  await page.click('#tabbar [data-tab=yo]');
  await page.waitForSelector('#s-yo button:has-text("Vista docente")');
  await page.click('#s-yo button:has-text("Vista docente")');
  await page.waitForSelector('#s-admin:not([hidden]) h1');
  assert.equal(await page.textContent('#s-admin h1'), 'Vista docente');
  await page.waitForSelector('#s-admin table.prog tbody tr');
  const heads = await page.locator('#s-admin table.prog thead th').allTextContents();
  assert.deepEqual(heads, ['Correo', 'Meta', '% listo', 'Racha', 'XP', 'Último día']);
  assert.match(await page.textContent('#s-admin table.prog caption'), /progreso de estudio/i);
  assert.equal(await page.locator('#s-admin .tablewrap table.prog').count(), 1);
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#s-admin .tablewrap')).overflowX), 'auto');
  const rowsOf = () => page.locator('#s-admin table.prog tbody tr').evaluateAll((trs) =>
    trs.map((tr) => Array.from(tr.children, (c) => c.tagName + ':' + c.textContent.trim())));
  const rows = await rowsOf();
  // Orden: último día desc, empate por correo, sin día al final.
  assert.deepEqual(rows.map((r) => r[0]), ['TH:otra@test.mx', 'TH:weird@test.mx', 'TH:alumno@test.mx', 'TH:' + LONG_EMAIL, 'TH:hostil@test.mx', 'TH:nuevo@test.mx', 'TH:rara@test.mx']);
  const fmt = await page.evaluate(() => fmtDay('2026-11-10'));
  assert.match(rows[0][1], /^TD:L5\s*Analista SOC Tier 2$/);
  assert.match(rows[0][2], /^TD:[1-9]\d?%$/, 'avance mayor a 0');
  assert.equal(rows[0][3], 'TD:3 días');
  assert.equal(rows[0][4], 'TD:180');
  assert.equal(rows[0][5], 'TD:' + fmt);
  // Goal 'constructor' y días con llaves peligrosas: Sin meta, XP topado (1000 + 50 del día «x» se ignora), sin romper nada.
  assert.deepEqual(rows[1].slice(1), ['TD:Sin meta', 'TD:–', 'TD:1 día', 'TD:1000', 'TD:' + fmt]);
  // alumno@test.mx es la cuenta docente: su propio progreso (sin estudio todavía) también se guardó al iniciar sesión.
  assert.deepEqual(rows[2].slice(1), ['TD:L1 Desarrollador de Software Jr.', 'TD:0%', 'TD:0 días', 'TD:0', 'TD:–']);
  assert.deepEqual(rows[3].slice(1), ['TD:Sin meta', 'TD:–', 'TD:0 días', 'TD:0', 'TD:–']);
  // Fila hostil (valores anidados): se ve con ceros, sin tumbar la sección.
  assert.match(rows[4][1], /^TD:L5\s*Analista SOC Tier 2$/);
  assert.deepEqual([rows[4][2], rows[4][3], rows[4][4], rows[4][5]], ['TD:0%', 'TD:0 días', 'TD:0', 'TD:–']);
  assert.deepEqual(rows[5].slice(1), ['TD:Sin meta', 'TD:–', 'TD:0 días', 'TD:0', 'TD:–']);
  assert.deepEqual(rows[6].slice(1), ['TD:estado no válido', 'TD:–', 'TD:–', 'TD:–', 'TD:–']);
  assert.match(await page.textContent('#s-admin'), /7 estudiantes con progreso/);
  assert.match(await page.textContent('#s-admin'), /6 con estado válido/);
  assert.equal(await page.locator('#s-admin table.prog tbody th[scope=row]').count(), 7);
  assert.equal(await page.locator('#s-admin thead th[scope=col]').count(), 6);
  // Accesibilidad de la tabla y aviso de deslizar (solo si de verdad se desborda).
  const wrapAttrs = await page.locator('#s-admin .tablewrap').evaluate((w) => [w.getAttribute('tabindex'), w.getAttribute('role'), w.getAttribute('aria-label')]);
  assert.deepEqual(wrapAttrs, ['0', 'region', 'Progreso de estudio']);
  assert.ok(await page.locator('#s-admin .scrollhint').isVisible(), 'a 390 px la tabla se desborda y el aviso se ve');
  // Correo largo: la columna fija se limita y envuelve, y al deslizar al final quedan al menos dos columnas de datos a la vista.
  const lay = await page.locator('#s-admin .tablewrap').evaluate((w) => {
    const th = Array.from(w.querySelectorAll('tbody th')).find((x) => x.title.length > 40);
    const thW = th.getBoundingClientRect().width;
    w.scrollLeft = w.scrollWidth;
    const wr = w.getBoundingClientRect(), thr = w.querySelector('tbody th').getBoundingClientRect();
    const visible = Array.from(w.querySelectorAll('thead th')).slice(1).filter((h) => {
      const r = h.getBoundingClientRect();
      return r.left >= thr.right - 1 && r.right <= wr.right + 1;
    }).map((h) => h.textContent);
    w.scrollLeft = 0;
    return { thW, visible, title: th.title, text: th.textContent };
  });
  assert.ok(lay.thW <= 150, 'columna del correo demasiado ancha: ' + lay.thW);
  assert.equal(lay.title, LONG_EMAIL);
  assert.equal(lay.text, LONG_EMAIL);
  assert.ok(lay.visible.length >= 2, 'columnas de datos visibles al final del deslizamiento: ' + lay.visible.join(','));
  // El quiz sigue: 3 intentos.
  assert.match(await page.textContent('#s-admin'), /Intentos del cuestionario/);
  assert.equal(await page.locator('#s-admin .attempts details.attempt').count(), 3);
  assert.equal(await page.locator('#s-admin h2').count(), 2);
  assert.ok(await page.evaluate(noHScroll), 'scroll horizontal de la página a 390 px');
  // El filtro actúa en las dos secciones y no vuelve a consultar.
  const selects = await page.evaluate(() => window.__selectCount);
  await page.fill('#admin-filter', 'OTRA');
  assert.equal((await rowsOf()).length, 1);
  assert.equal(await page.locator('#s-admin .attempts details.attempt').count(), 1);
  await page.fill('#admin-filter', 'zzz');
  assert.equal(await page.locator('#s-admin table.prog').count(), 0);
  assert.equal(await page.locator('#s-admin .admin-sec', { hasText: 'Sin resultados.' }).count(), 2);
  await page.fill('#admin-filter', '');
  assert.equal((await rowsOf()).length, 7);
  assert.deepEqual(o.errors, [], 'errores de JS en la vista docente');
  assert.equal(await page.evaluate(() => window.__selectCount), selects, 'el filtro no vuelve a consultar');
  // «← Volver» regresa a Yo.
  await page.click('#s-admin .topnav button');
  await page.waitForSelector('#s-yo:not([hidden])');
  await ctx.close();

  // Una consulta que falla no tumba la otra sección.
  setStep('vista docente: el progreso falla, el cuestionario sigue');
  const ctxF = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const f = await openHome(ctxF, { session: true, admin: true, failSync: true, seedJson: teacherSeedJson(), clock: TEACHER_DAY + 'T12:00:00', local: JSON.stringify(goalOnly()) });
  await f.page.click('#tabbar [data-tab=yo]');
  await f.page.click('#s-yo button:has-text("Vista docente")');
  await f.page.waitForSelector('#s-admin .attempts details.attempt');
  assert.match(await f.page.textContent('#s-admin'), /No se pudo cargar el progreso \(sin red\)/);
  assert.equal(await f.page.locator('#s-admin table.prog').count(), 0);
  assert.equal(await f.page.locator('#s-admin .attempts details.attempt').count(), 3);
  assert.deepEqual(f.errors, []);
  await ctxF.close();

  // La consulta del cuestionario falla: la tabla de progreso sigue.
  setStep('vista docente: el cuestionario falla, el progreso sigue');
  const ctxQ = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const q = await openHome(ctxQ, { session: true, admin: true, failQuiz: true, seedJson: teacherSeedJson(), clock: TEACHER_DAY + 'T12:00:00', local: JSON.stringify(goalOnly()) });
  await q.page.click('#tabbar [data-tab=yo]');
  await q.page.click('#s-yo button:has-text("Vista docente")');
  await q.page.waitForSelector('#s-admin table.prog tbody tr');
  assert.equal(await q.page.locator('#s-admin table.prog tbody tr').count(), 7);
  await q.page.waitForFunction(() => /No se pudo cargar las respuestas \(sin red\)/.test(document.getElementById('s-admin').textContent));
  assert.equal(await q.page.locator('#s-admin .attempts').count(), 0);
  assert.deepEqual(q.errors, []);
  await ctxQ.close();

  // Con exactamente 1000 filas el aviso dice que puede haber más y no afirma un total.
  setStep('vista docente: 1000 filas');
  const many = [], manyQuiz = [];
  const okState = { v: 2, goal: null, goalT: 0, items: {}, days: { '2026-11-10': { xp: 10, done: true } } };
  for (let i = 0; i < 1000; i++) {
    many.push({ user_id: 'm' + i, email: 'm' + String(i).padStart(4, '0') + '@test.mx', state: okState, updated_at: '2026-11-10T00:00:00Z' });
    manyQuiz.push({ id: 'z' + i, user_id: 'm' + i, email: 'm' + i + '@test.mx', created_at: '2026-11-01T12:00:00Z', answers: [0], scores: { ml: 10, bak: 5, dat: 3 }, quiz_version: 2 });
  }
  const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const m = await openHome(ctxM, { session: true, admin: true, seedJson: JSON.stringify({ mapa_progreso: many, mapa_respuestas: manyQuiz }), clock: TEACHER_DAY + 'T12:00:00', local: JSON.stringify(goalOnly()) });
  await m.page.click('#tabbar [data-tab=yo]');
  await m.page.click('#s-yo button:has-text("Vista docente")');
  await m.page.waitForSelector('#s-admin table.prog tbody tr');
  const txt = await m.page.textContent('#s-admin');
  assert.equal((txt.match(/Se muestran los primeros 1000; puede haber más\./g) || []).length, 2, 'aviso en las dos secciones');
  assert.match(txt, /1000 estudiantes cargados/);
  assert.match(txt, /1000 intentos cargados/);
  assert.doesNotMatch(txt, /estudiantes con progreso/);
  assert.deepEqual(m.errors, []);
  await ctxM.close();

  // Sin filas de progreso: estado vacío.
  setStep('vista docente: vacía');
  const ctxE = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const e = await openHome(ctxE, { session: true, admin: true, clock: TEACHER_DAY + 'T12:00:00', local: JSON.stringify(goalOnly()) });
  await e.page.evaluate(() => { window.__db.mapa_progreso = []; window.__db.mapa_respuestas = []; }); // el inicio de sesión guardó la fila de la cuenta docente
  await e.page.click('#tabbar [data-tab=yo]');
  await e.page.click('#s-yo button:has-text("Vista docente")');
  await e.page.waitForSelector('#s-admin:not([hidden]) h1');
  await e.page.waitForFunction(() => /Todavía nadie guarda progreso de estudio\./.test(document.getElementById('s-admin').textContent));
  assert.match(await e.page.textContent('#s-admin'), /Todavía no hay intentos del cuestionario\./);
  assert.deepEqual(e.errors, []);
  await ctxE.close();
}

// Revisión final: borrado desde otra pestaña, sincronización sin localStorage, espera acotada al borrar y correo en el upsert.
async function sharedStateScenarios(browser, setStep) {
  setStep('borrar mis datos en otra pestaña se refleja en esta');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const A = await openHome(ctx, { local: JSON.stringify(progressState()) });
  const B = await openHome(ctx, { local: JSON.stringify(progressState()) });
  await A.page.waitForSelector('#s-hoy:not([hidden])');
  await B.page.click('#tabbar [data-tab=yo]');
  const delB = B.page.locator('#s-yo button.danger');
  await delB.click();
  await delB.click();
  await B.page.waitForSelector('#s-entrada:not([hidden])');
  await A.page.waitForSelector('#s-entrada:not([hidden])');
  assert.equal(await localState(A.page), null, 'la pestaña vieja no reescribe lo borrado');
  assert.equal(await A.page.evaluate(() => Object.keys(state.items).length + (state.goal ? 1 : 0)), 0, 'y adopta el estado vacío');
  await A.page.waitForFunction(() => /desde otra pestaña/.test(document.getElementById('notices').textContent));
  assert.deepEqual(A.errors, []);
  assert.deepEqual(B.errors, []);
  await ctx.close();

  setStep('la semana y la racha coinciden con un día cuyo done no es true');
  const ctxW = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const oddDays = { v: 2, goal: 'edar-dev-jr', goalT: 1, items: {}, days: { '2026-11-09': { xp: 50, done: 1 }, '2026-11-10': { xp: 50, done: true } } };
  const W = await openHome(ctxW, { clock: '2026-11-11T12:00:00', local: JSON.stringify(oddDays) });
  await W.page.waitForSelector('#s-hoy:not([hidden])');
  const weekLabels = await W.page.locator('#s-hoy .week li .sr-only').allTextContents();
  assert.equal(weekLabels[0], 'lunes, sin sesión', 'done:1 no cuenta como día cumplido en la semana');
  assert.equal(weekLabels[1], 'martes, cumplido');
  assert.match(await W.page.textContent('#s-hoy .chip'), /Racha · 1 día/, 'y la racha lo ignora igual');
  assert.deepEqual(W.errors, []);
  await ctxW.close();

  setStep('cerrar sesión espera a una sincronización lenta antes de guardar y borrar');
  const ctxR = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const R = await openHome(ctxR, { session: true, slowSync: 1500, local: JSON.stringify(goalOnly()) }); // sin ítems: lo que responda es nuevo
  await R.page.waitForSelector('#s-hoy:not([hidden])');
  await R.page.evaluate(() => { window.__slowSync = 50; }); // la sincronización de arranque sigue lenta; las siguientes, rápidas
  await R.page.click('#s-hoy .session-cta');
  const slowAns = await answerCard(R.page, true);
  await R.page.click('#s-sesion button:has-text("Salir")');
  await R.page.click('#tabbar [data-tab=yo]');
  await R.page.click('#s-yo #logout');
  await R.page.waitForSelector('#s-entrada:not([hidden])', { timeout: 15000 });
  await R.page.waitForTimeout(2500); // más que lo que le falta a la sincronización lenta: no debe pisar la fila con su estado viejo
  assert.ok(await R.page.evaluate((id) => !!window.__db.mapa_progreso.find((r) => r.user_id === 'u1').state.items[id], slowAns.item), 'la fila remota conserva lo respondido');
  assert.equal(await localState(R.page), null);
  assert.deepEqual(R.errors, []);
  await ctxR.close();

  setStep('cerrar sesión con una sincronización colgada no borra y ofrece reintentar');
  const ctxT = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const T = await openHome(ctxT, { session: true, slowSync: 30000, local: JSON.stringify(progressState()) });
  await T.page.waitForSelector('#s-hoy:not([hidden])');
  await T.page.evaluate(() => { INVALIDATE_WAIT_MS = 300; });
  await T.page.click('#tabbar [data-tab=yo]');
  await T.page.click('#s-yo #logout');
  await T.page.waitForFunction(() => /No se pudo guardar tu avance en tu cuenta/.test(document.getElementById('logout-msg').textContent), null, { timeout: 5000 });
  assert.match(await T.page.textContent('#logout-msg'), /quien entre después en él lo combinará con su cuenta/);
  assert.equal((await localState(T.page)).goal, 'edar-dev-jr', 'no se borró nada');
  assert.equal(await T.page.evaluate(() => !!session), true);
  assert.equal(await T.page.isVisible('#s-yo #logout-keep'), true);
  await T.page.click('#s-yo #logout-keep');
  await T.page.waitForSelector('#s-yo button:has-text("Guarda tu progreso en la nube")');
  await T.page.waitForFunction(() => /quien entre después en él lo combinará con su cuenta/.test(document.getElementById('notices').textContent));
  assert.equal((await localState(T.page)).goal, 'edar-dev-jr', 'sin borrar: el avance sigue en el dispositivo');
  assert.deepEqual(T.errors, []);
  await ctxT.close();

  setStep('lo respondido durante una sincronización no se pierde sin localStorage');
  const ctxN = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const N = await openHome(ctxN, { session: true, slowSync: 600, noStorage: true });
  await N.page.waitForSelector('#s-entrada:not([hidden])');
  assert.equal(await N.page.evaluate(() => storage === null), true);
  await N.page.click('#door-goal');
  await N.page.locator('#s-pick .line-card', { hasText: 'Analista de Datos Jr.' }).click();
  await N.page.waitForFunction(() => window.__db.mapa_progreso.some((r) => r.state.goal === 'sears-datos-jr'), null, { timeout: 10000 });
  await N.page.waitForFunction(() => window.__db.mapa_progreso.length === 1 && pendingSyncs.length === 0);
  await N.page.click('#s-hoy .session-cta');
  await N.page.waitForSelector('#s-sesion .ses-card');
  await N.page.evaluate(() => { window.__p = syncNow(); }); // sincronización en vuelo...
  const during = await answerCard(N.page, true);          // ...y una respuesta mientras tanto (aún no hay otra sincronización)
  await N.page.evaluate(() => window.__p);
  assert.ok(await N.page.evaluate((id) => !!state.items[id], during.item), 'la respuesta dada durante la sincronización sigue en el estado');
  assert.deepEqual(N.errors, []);
  await ctxN.close();

  setStep('borrar con una red colgada no queda trabado');
  const ctxH = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const H = await openHome(ctxH, { session: true, slowSync: 30000, local: JSON.stringify(progressState()) });
  await H.page.waitForSelector('#s-hoy:not([hidden])');
  await H.page.evaluate(() => { INVALIDATE_WAIT_MS = 300; });
  await H.page.click('#tabbar [data-tab=yo]');
  const delH = H.page.locator('#s-yo button.danger');
  await delH.click();
  await delH.click();
  await H.page.waitForSelector('#s-entrada:not([hidden])', { timeout: 5000 });
  assert.equal(await localState(H.page), null);
  assert.equal(await H.page.evaluate(() => deleting), false, 'el borrado terminó y se pueden volver a sincronizar los datos');
  assert.deepEqual(H.errors, []);
  await ctxH.close();

  setStep('el correo viaja en el upsert: una fila con otro correo se sincroniza');
  const ctxE = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const old = { v: 2, goal: 'edar-dev-jr', goalT: 1, items: {}, days: {} };
  const E = await openHome(ctxE, { session: true, seed: { mapa_progreso: [{ user_id: 'u1', email: 'viejo@test.mx', state: old }] }, local: JSON.stringify(progressState()) });
  await E.page.waitForFunction(() => window.__db.mapa_progreso.length === 1 && window.__db.mapa_progreso[0].email === 'alumno@test.mx');
  assert.equal(await E.page.locator('#notices .notice').count(), 0, 'sin aviso de falla');
  assert.ok(Object.keys(await E.page.evaluate(() => window.__db.mapa_progreso[0].state.items)).length > 0);
  assert.deepEqual(E.errors, []);
  await ctxE.close();
}

// El servicio de cuentas (supabase-js, desde un CDN) no debe bloquear el estudio: si no carga o tarda, el sitio funciona sin cuenta.
async function cdnScenarios(browser, setStep) {
  const open = async (mode, local) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    let release = null;
    const held = new Promise((res) => { release = res; });
    await page.route(SB_URL, async (r) => {
      if (mode === 'blocked') return r.abort();
      await held;
      return r.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE });
    });
    await page.addInitScript((a) => {
      window.__seed = a.seed;
      if (a.local && !sessionStorage.getItem('e2e.seeded')) { localStorage.setItem(a.key, a.local); sessionStorage.setItem('e2e.seeded', '1'); }
    }, { seed: mode === 'slow-session' ? { session: true, mapa_progreso: [{ user_id: 'u1', email: 'alumno@test.mx', state: { v: 2, goal: 'sears-datos-jr', goalT: 9, items: {}, days: {} } }] } : {}, local: local || null, key: KEY });
    await page.goto(INDEX_URL, { waitUntil: 'commit' });
    return { context, page, errors, release };
  };

  setStep('CDN de cuentas bloqueado: se puede elegir meta y estudiar');
  let t = await open('blocked');
  await t.page.waitForSelector('#s-entrada:not([hidden])', { timeout: 5000 });
  await t.page.click('#door-goal');
  await t.page.click('#s-pick .line-card >> nth=0');
  await t.page.waitForSelector('#s-hoy:not([hidden])');
  await t.page.click('#s-hoy .session-cta');
  await answerCard(t.page, true);
  assert.equal(Object.keys((await localState(t.page)).items).length, 1, 'la respuesta se guarda sin el servicio de cuentas');
  await t.page.evaluate(() => { sesExit(); renderYo(); });
  await t.page.click('#account button[aria-controls="login"]');
  await t.page.fill('#email', 'alumno@test.mx');
  await t.page.click('#send-link');
  await t.page.waitForFunction(() => /No se pudo enviar el enlace/.test(document.getElementById('auth-msg').textContent));
  assert.deepEqual(t.errors, [], 'sin errores de script con el CDN bloqueado');
  await t.context.close();

  setStep('CDN de cuentas lento: la pantalla aparece antes y la sesión llega después');
  t = await open('slow-session');
  await t.page.waitForSelector('#s-entrada:not([hidden])', { timeout: 5000 });
  t.release();
  await t.page.waitForSelector('#s-hoy:not([hidden])'); // la meta de la nube llega al cargar el servicio
  assert.equal((await localState(t.page)).goal, 'sears-datos-jr');
  assert.deepEqual(t.errors, []);
  await t.context.close();
}

// Entrada con dos puertas, pestaña Descubre, títulos de página y transiciones entre pantallas (Tarea 3).
const QUIZ_OK = JSON.stringify({ v: 3, t: 1762905600000, answers: [0, 0, 0, 0, 0, 0, 0, 0] });
async function entradaScenarios(browser, setStep) {
  setStep('entrada: primera visita con dos puertas');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const { page, errors } = await openHome(ctx);
  await page.waitForSelector('#s-entrada:not([hidden])');
  assert.equal(await page.isVisible('#tabbar'), false, 'sin barra inferior en la entrada');
  assert.equal(await page.textContent('#s-entrada h1'), '¿Por dónde empiezas?');
  assert.equal(await page.title(), 'Mapa de áreas');
  for (const id of ['#door-quiz', '#door-goal']) {
    const box = await page.locator(id).boundingBox();
    assert.ok(box.height >= 44 && box.width >= 44, id + ' mide ' + box.width + '×' + box.height);
    assert.equal(await page.getAttribute(id, 'type'), 'button');
  }
  assert.match(await page.textContent('#door-quiz'), /No sé qué área me va[^]*8 preguntas · 5 minutos · sin cuenta/);
  assert.match(await page.textContent('#door-goal'), /Ya sé qué quiero[^]*Elige una vacante real como meta/);
  assert.equal(await page.locator('#s-entrada button:has-text("¿Ya tienes cuenta? Entra")').count(), 1);
  assert.equal(await page.evaluate(noHScroll), true, 'sin scroll horizontal en la entrada');

  setStep('entrada: «Ya sé qué quiero» abre Elegir meta y «← Volver» regresa');
  await page.click('#door-goal');
  await page.waitForSelector('#s-pick:not([hidden])');
  await page.waitForFunction(() => document.activeElement === document.querySelector('#s-pick h1'));
  assert.equal(await page.title(), 'Elige tu meta · Mapa de áreas');
  assert.equal(await page.isVisible('#tabbar'), false, 'sin barra inferior al elegir meta');
  assert.equal(await page.locator('#s-pick button:has-text("¿Ya tienes cuenta? Entra")').count(), 0, 'el acceso vive solo en la entrada');
  assert.equal(await page.evaluate(() => document.querySelectorAll('#pick-email, #pick-login, #pick-send-link, #pick-auth-msg').length), 4, 'ids únicos');
  await page.click('#s-pick .topnav button:has-text("← Volver")');
  await page.waitForSelector('#s-entrada:not([hidden])');
  await page.waitForFunction(() => document.activeElement === document.querySelector('#s-entrada h1'));

  setStep('entrada: «No sé qué área me va» abre la primera pregunta');
  await page.click('#door-quiz');
  await page.waitForSelector('#s-quiz:not([hidden]) .opt');
  assert.match(await page.textContent('#counter'), /^Pregunta 1 de /);
  assert.equal(await page.isVisible('#tabbar'), false);
  assert.equal(await page.title(), 'Cuestionario · Mapa de áreas');
  await page.click('#back');
  await page.waitForSelector('#s-entrada:not([hidden])', { timeout: 3000 });
  assert.deepEqual(errors, [], 'errores de JS en la entrada');
  await ctx.close();

  setStep('barra de 4 pestañas a 320 px, títulos y aria-current');
  const ctx3 = await browser.newContext({ viewport: { width: 320, height: 640 } });
  const n = await openHome(ctx3, { local: JSON.stringify(goalOnly()) });
  await n.page.waitForSelector('#s-hoy:not([hidden])');
  const bar = await n.page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#tabbar button[data-tab]'));
    return {
      tabs: btns.map((b) => b.getAttribute('data-tab')),
      sizes: btns.map((b) => { const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, top: Math.round(r.top), fits: b.scrollWidth <= b.clientWidth }; }),
      barH: document.getElementById('tabbar').getBoundingClientRect().height,
      vh: window.innerHeight
    };
  });
  assert.deepEqual(bar.tabs, ['hoy', 'mapa', 'descubre', 'yo']);
  bar.sizes.forEach((s, i) => {
    assert.ok(s.w >= 44 && s.h >= 44, bar.tabs[i] + ' mide ' + s.w + '×' + s.h);
    assert.ok(s.fits, 'la etiqueta ' + bar.tabs[i] + ' cabe');
    assert.equal(s.top, bar.sizes[0].top, 'las 4 pestañas en una fila');
  });
  assert.ok(bar.barH < bar.vh * 0.12, 'la barra mide ' + bar.barH + ' px de ' + bar.vh);
  assert.equal(await n.page.evaluate(noHScroll), true, 'sin scroll horizontal a 320 px');
  assert.equal(await n.page.title(), 'Hoy · Mapa de áreas');
  const current = () => n.page.evaluate(() => Array.from(document.querySelectorAll('#tabbar [aria-current]'), (b) => b.getAttribute('data-tab') + '=' + b.getAttribute('aria-current')));
  assert.deepEqual(await current(), ['hoy=page']);
  for (const [tab, title, sel] of [['mapa', 'Mapa', '#s-mapa'], ['descubre', 'Descubre', '#s-descubre'], ['yo', 'Yo', '#s-yo']]) {
    await n.page.click('#tabbar [data-tab=' + tab + ']');
    await n.page.waitForSelector(sel + ':not([hidden])');
    assert.equal(await n.page.title(), title + ' · Mapa de áreas');
    assert.deepEqual(await current(), [tab + '=page']);
    assert.equal(await n.page.evaluate(noHScroll), true, 'sin scroll horizontal en ' + tab + ' a 320 px');
  }
  setStep('Descubre: invitación y «Empezar»');
  await n.page.click('#tabbar [data-tab=descubre]');
  await n.page.waitForSelector('#s-descubre:not([hidden])');
  assert.equal(await n.page.locator('#s-descubre h1').count(), 1);
  assert.match(await n.page.textContent('#s-descubre'), /8 preguntas · 5 minutos · sin cuenta/);
  await n.page.click('#s-descubre #descubre-start');
  await n.page.waitForSelector('#s-quiz:not([hidden]) .opt');
  assert.deepEqual(await current(), ['descubre=page'], 'el cuestionario queda bajo Descubre');
  await n.page.click('#back');
  await n.page.waitForSelector('#s-descubre:not([hidden])');
  assert.deepEqual(await current(), ['descubre=page']);
  assert.deepEqual(n.errors, []);
  await ctx3.close();

  setStep('arranque: con mapa.quiz válido y sin meta se entra en Descubre (el resultado)');
  const ctxQ = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const q = await openHome(ctxQ, { quiz: QUIZ_OK });
  await q.page.waitForSelector('#s-result:not([hidden])');
  assert.equal(await q.page.isVisible('#s-entrada'), false);
  assert.equal(await q.page.isVisible('#tabbar'), true);
  assert.equal(await q.page.getAttribute('#tabbar [data-tab=descubre]', 'aria-current'), 'page');
  assert.equal(await q.page.title(), 'Tu resultado · Mapa de áreas');
  assert.deepEqual(q.errors, []);
  await ctxQ.close();
  // Un intento de otra versión no cuenta: se entra por la entrada.
  const ctxV = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const v = await openHome(ctxV, { quiz: JSON.stringify({ v: 2, t: 1, answers: [0, 0, 0, 0, 0, 0, 0, 0] }) });
  await v.page.waitForSelector('#s-entrada:not([hidden])');
  assert.deepEqual(v.errors, []);
  await ctxV.close();

  setStep('Descubre: la pestaña Hoy sin meta enfoca Elegir meta; «← Volver» regresa a Descubre');
  const ctxH = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const h = await openHome(ctxH, { quiz: QUIZ_OK });
  await h.page.waitForSelector('#s-result:not([hidden])');
  await h.page.focus('#tabbar button[data-tab="hoy"]');
  await h.page.keyboard.press('Enter');
  await h.page.waitForSelector('#s-pick:not([hidden])');
  await h.page.waitForFunction(() => document.activeElement === document.querySelector('#s-pick h1'), null, { timeout: 5000 });
  assert.equal(await h.page.isVisible('#tabbar'), false, 'sin barra inferior al elegir meta');
  await h.page.click('#s-pick .topnav button:has-text("← Volver")');
  await h.page.waitForSelector('#s-result:not([hidden])');
  assert.equal(await h.page.isVisible('#s-entrada'), false, 'con resultado guardado, «← Volver» no lleva a la entrada');
  assert.deepEqual(h.errors, [], 'errores de JS en Descubre');
  await ctxH.close();

  setStep('transiciones: dirección, foco y sin fundido repetido');
  const ctxT = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctxT.addInitScript(() => {
    window.__vt = [];
    const orig = Document.prototype.startViewTransition;
    if (!orig) return;
    Document.prototype.startViewTransition = function (arg) {
      const t = orig.call(this, arg);
      window.__vt.push(arg && arg.types ? arg.types.join(',') : 'callback');
      window.__vtDone = t.finished;
      return t;
    };
  });
  const t = await openHome(ctxT, { motion: true });
  assert.equal(await t.page.evaluate(() => typeof document.startViewTransition), 'function', 'el Chromium de la prueba tiene View Transitions');
  await t.page.click('#door-goal');
  await t.page.waitForSelector('#s-pick:not([hidden])');
  assert.equal(await t.page.evaluate(() => document.activeElement === document.querySelector('#s-pick h1')), true, 'foco al título dentro de update');
  await t.page.evaluate(() => window.__vtDone);
  const op = await t.page.evaluate(() => new Promise((res) => requestAnimationFrame(() => res(getComputedStyle(document.getElementById('s-pick')).opacity))));
  assert.equal(op, '1', 'el fundido no vuelve a empezar al terminar la transición');
  await t.page.click('#s-pick .topnav button');
  await t.page.waitForSelector('#s-entrada:not([hidden])');
  await t.page.click('#door-goal');
  await t.page.locator('#s-pick .line-card', { hasText: 'Desarrollador de Software Jr.' }).click();
  await t.page.waitForSelector('#s-hoy:not([hidden])');
  await t.page.click('#tabbar [data-tab=mapa]');
  await t.page.waitForSelector('#s-mapa:not([hidden])');
  await t.page.click('#s-mapa .line-list [data-line=edar-dev-jr]');
  await t.page.waitForSelector('#s-linea:not([hidden])');
  await t.page.click('#s-linea .st-rows [data-station=git]');
  await t.page.waitForSelector('#s-estacion:not([hidden])');
  await t.page.click('#s-estacion .topnav button');
  await t.page.waitForSelector('#s-linea:not([hidden])');
  await t.page.click('#s-linea .topnav button');
  await t.page.waitForSelector('#s-mapa:not([hidden])');
  assert.deepEqual(await t.page.evaluate(() => window.__vt),
    ['forward', 'backward', 'forward', 'forward', 'forward', 'backward', 'backward'], 'puertas, «← Volver», Línea y Estación; las pestañas y elegir meta, sin transición');
  assert.deepEqual(t.errors, []);

  setStep('transiciones: una navegación pisada no deja otra pantalla visible');
  await t.page.evaluate(() => { openLinea('edar-dev-jr', false, 'mapa'); renderHoy(); });
  await t.page.waitForSelector('#s-hoy:not([hidden])');
  await t.page.waitForTimeout(600);
  assert.deepEqual(await t.page.evaluate(() => Array.from(document.querySelectorAll('.wrap > section')).filter((s) => !s.hidden).map((s) => s.id)), ['s-hoy'], 'solo Hoy visible');
  assert.equal(await t.page.getAttribute('#tabbar button[aria-current="page"]', 'data-tab'), 'hoy');
  assert.equal(await t.page.title(), 'Hoy · Mapa de áreas');
  assert.deepEqual(t.errors, []);
  await ctxT.close();

  setStep('movimiento reducido: la navegación con dirección no anima nada');
  const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const m = await openHome(ctxM);
  await m.page.click('#door-goal');
  await m.page.waitForSelector('#s-pick:not([hidden])');
  assert.equal(await m.page.evaluate(() => document.getAnimations().length), 0, 'sin animaciones al avanzar');
  await m.page.click('#s-pick .topnav button:has-text("← Volver")');
  await m.page.waitForSelector('#s-entrada:not([hidden])');
  assert.equal(await m.page.evaluate(() => document.getAnimations().length), 0, 'sin animaciones al volver');
  assert.deepEqual(m.errors, []);
  await ctxM.close();

  setStep('transiciones: sin la forma con objeto se cambia al instante');
  const ctxF = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctxF.addInitScript(() => {
    const orig = Document.prototype.startViewTransition;
    if (orig) Document.prototype.startViewTransition = function (arg) {
      if (typeof arg !== 'function') throw new TypeError('parameter 1 is not of type Function');
      return orig.call(this, arg);
    };
  });
  const f = await openHome(ctxF, { motion: true });
  await f.page.click('#door-goal');
  await f.page.waitForSelector('#s-pick:not([hidden])');
  assert.equal(await f.page.evaluate(() => document.activeElement === document.querySelector('#s-pick h1')), true);
  assert.deepEqual(f.errors, []);
  await ctxF.close();
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  let step = '';
  try {
    if (process.env.E2E_ONLY === 'cdn') { await cdnScenarios(browser, (t) => { step = t; }); console.log('e2e (solo cdn): OK'); return; }
    if (process.env.E2E_ONLY === 'shared') { await sharedStateScenarios(browser, (t) => { step = t; }); console.log('e2e (solo shared): OK'); return; }
    if (process.env.E2E_ONLY === 'entrada') { await entradaScenarios(browser, (t) => { step = t; }); console.log('e2e (solo entrada): OK'); return; }
    if (process.env.E2E_ONLY === 'descubre') { await descubreScenarios(browser, (t) => { step = t; }); console.log('e2e (solo descubre): OK'); return; }
    step = 'primera visita sin cuenta: entrada y elegir meta';
    const { page, errors } = await openHome(context, { clock: '2026-11-10T10:00:00' });
    await page.waitForSelector('#s-entrada:not([hidden])');
    assert.equal(await page.isVisible('#tabbar'), false, 'sin barra inferior en la entrada');
    const firstFocus = await page.evaluate(() => {
      const h = document.querySelector('#s-entrada h1');
      const cs = getComputedStyle(h);
      return { onHeading: document.activeElement === h, style: cs.outlineStyle, width: cs.outlineWidth };
    });
    assert.equal(firstFocus.onHeading, false, 'al cargar no se toma el foco');
    // outline-width inicial es «medium» (3px) aunque no haya aro; lo que cuenta es que el estilo sea none.
    assert.ok(firstFocus.style === 'none' || firstFocus.width === '0px', 'sin aro de foco en el título al cargar');
    await page.click('#door-goal');
    await page.waitForSelector('#s-pick:not([hidden])');
    assert.equal(await page.locator('#s-pick .line-card').count(), 9);
    assert.match(await page.locator('#s-pick .line-card').first().textContent(), /Para empezar/);
    const levels = await page.locator('#s-pick .line-card').evaluateAll((cs) => cs.map((c) => /Para empezar/.test(c.textContent)));
    assert.deepEqual(levels, [true, true, true, true, true, true, false, false, false], 'primero las de «Para empezar»');
    for (let n = 1; n <= 9; n++) assert.equal(await page.locator('#s-pick .line-card .lbadge', { hasText: 'L' + n }).count(), 1, 'insignia L' + n);
    assert.equal(await page.isVisible('#tabbar'), false, 'sin barra inferior al elegir meta');
    await page.locator('#s-pick .line-card', { hasText: 'Desarrollador de Software Jr.' }).click();
    await page.waitForSelector('#s-hoy:not([hidden])');
    await page.waitForFunction(() => document.activeElement === document.querySelector('#s-hoy h1'));
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#s-hoy h1')).outlineStyle), 'none', 'el título enfocado no dibuja aro');
    assert.match(await page.textContent('#s-hoy'), /0%/);
    assert.match(await page.textContent('#s-hoy'), /te faltan 5 estaciones/);
    assert.match(await page.textContent('#s-hoy .session-cta'), /5 min · 5 pasos nuevos de Git y más/);
    assert.equal(await page.isVisible('#tabbar'), true);
    assert.equal(await page.getAttribute('#tabbar [data-tab=hoy]', 'aria-current'), 'page');
    assert.equal(await page.locator('#s-hoy .week li').count(), 7);
    assert.equal((await localState(page)).goal, 'edar-dev-jr');

    step = 'la meta sobrevive a la recarga';
    await page.reload();
    await page.waitForSelector('#s-hoy:not([hidden])');
    assert.match(await page.textContent('#s-hoy'), /Desarrollador de Software Jr\./);

    step = 'la sesión y el mapa se alcanzan';
    await page.click('#s-hoy .session-cta');
    await page.waitForSelector('#s-sesion:not([hidden])');
    assert.equal(await page.isVisible('#tabbar'), false, 'sin barra inferior en la sesión');
    await page.click('#s-sesion button:has-text("Salir")');
    await page.waitForSelector('#s-hoy:not([hidden])');
    assert.deepEqual((await localState(page)).items, {}, 'salir sin responder no guarda nada');
    await page.click('#tabbar [data-tab=mapa]');
    await page.waitForSelector('#s-mapa:not([hidden])');
    assert.equal(await page.getAttribute('#tabbar [data-tab=mapa]', 'aria-current'), 'page');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-tab')), 'mapa', 'el foco se queda en la pestaña');
    assert.equal(await page.getAttribute('#tabbar [data-tab=hoy]', 'aria-current'), null);

    step = 'mapa: 9 líneas, 32 estaciones';
    await mapaScenarios(browser, (t) => { step = t; });

    step = 'Yo: cuenta opcional, cambiar meta, cuestionario';
    await page.click('#tabbar [data-tab=yo]');
    await page.waitForSelector('#s-yo:not([hidden])');
    assert.match(await page.textContent('#s-yo'), /Nivel 1/);
    assert.match(await page.textContent('#s-yo'), /Guarda tu progreso en la nube/);
    assert.match(await page.textContent('#s-yo'), /Sin cuenta, nada sale de tu dispositivo/);
    assert.equal(await page.locator('#s-yo button:has-text("Mis respuestas")').count(), 0, 'Mis respuestas solo con sesión');
    assert.equal(await page.locator('#s-yo button:has-text("Vista docente")').count(), 0);
    await page.click('#s-yo button:has-text("Cambiar de meta")');
    await page.waitForSelector('#s-pick:not([hidden])');
    await page.click('#s-pick button:has-text("Volver")');
    await page.waitForSelector('#s-yo:not([hidden])');
    assert.doesNotMatch(await page.textContent('#s-yo'), /¿Qué área va contigo\?/);
    await page.click('#tabbar [data-tab=descubre]');
    await page.waitForSelector('#s-descubre:not([hidden])');
    assert.equal(await page.locator('#s-descubre #login, #s-descubre #home').count(), 0);
    assert.equal(await page.getAttribute('#tabbar [data-tab=descubre]', 'aria-current'), 'page');
    await page.click('#s-descubre #descubre-start');
    await page.waitForSelector('#s-quiz:not([hidden])');
    assert.equal(await page.isVisible('#tabbar'), false, 'sin barra inferior en el cuestionario');
    await page.click('#back');
    await page.waitForSelector('#s-descubre:not([hidden])');
    await page.click('#tabbar [data-tab=yo]');
    await page.waitForSelector('#s-yo:not([hidden])');
    assert.deepEqual(errors, [], 'errores de JS en la primera visita');

    step = 'sesión completa con teclado';
    await page.click('#tabbar [data-tab=hoy]');
    await page.waitForSelector('#s-hoy:not([hidden])');
    const oks = await page.evaluate(() => ['git.0', 'git.1', 'git.2', 'git.3'].map((id) => getQuestion(ESTACIONES, id).ok));
    await page.click('#s-hoy .session-cta');
    await page.waitForSelector('#s-sesion .ses-card.idea');
    assert.equal(await page.isVisible('#tabbar'), false);
    for (let i = 0; i < 4; i++) {
      await page.waitForSelector('#s-sesion .ses-card.idea');
      assert.match(await page.textContent('#s-sesion .ses-tag'), /Nuevo · Git/);
      assert.match(await page.textContent('#s-sesion .ses-count'), new RegExp((i + 1) + ' de 5'));
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('#s-sesion .ses-card h2')), true, 'foco en el título de la tarjeta');
      await page.keyboard.press('Enter');
      await page.waitForSelector('#s-sesion .ses-card.question[data-item="git.' + i + '"]');
      assert.equal(await page.locator('#s-sesion button.opt').count(), 4);
      assert.equal(await page.getAttribute('#s-sesion .fb', 'aria-live'), 'polite');
      await page.keyboard.press(String(oks[i] + 1));
      await page.waitForSelector('#s-sesion .fb:not(:empty)');
      const fb = await page.textContent('#s-sesion .fb');
      assert.match(fb, /Correcto/);
      assert.match(fb, /\+10 XP/);
      assert.match(fb, /Vuelve a salir mañana/);
      assert.equal(await page.locator('#s-sesion .opt.right').count(), 1);
      assert.equal(await page.getAttribute('#s-sesion .opt.right', 'aria-pressed'), 'true');
      assert.equal((await localState(page)).items['git.' + i].b, 1, 'la respuesta se guarda al momento');
      if (i === 0) {
        step = 'las teclas no cambian una respuesta dada';
        await page.keyboard.press(String(((oks[0] + 1) % 4) + 1));
        await page.keyboard.press(String(oks[0] + 1));
        assert.equal(await page.locator('#s-sesion .opt.wrong').count(), 0);
        assert.equal(await page.locator('#s-sesion .opt[aria-pressed="true"]').count(), 1);
        assert.match(await page.textContent('#s-sesion .fb'), /Correcto/);
        assert.equal((await localState(page)).days['2026-11-10'].xp, 10, 'el XP del día no cambia');
        assert.equal(await page.getAttribute('#s-sesion .opt.right', 'aria-disabled'), 'true');
        step = 'sesión completa con teclado';
      }
      assert.match(await page.textContent('#s-sesion .ses-next'), /Siguiente/);
      if (i === 1) {
        step = 'un doble clic no se salta tarjetas';
        await page.dblclick('#s-sesion .ses-next');
        await page.waitForSelector('#s-sesion .ses-card.idea[data-item="git.2"]');
        const dbl = () => page.evaluate(() => document.querySelector('#s-sesion .ses-next').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 2 })));
        await dbl(); // segundo clic de un doble clic sobre «Entendido»: no pasa a la pregunta
        assert.equal(await page.locator('#s-sesion .ses-card.idea[data-item="git.2"]').count(), 1);
        await page.keyboard.press('Enter');
        await page.waitForSelector('#s-sesion .ses-card.question[data-item="git.2"]');
        await page.keyboard.press(String(oks[2] + 1));
        await page.waitForSelector('#s-sesion .fb:not(:empty)');
        await dbl(); // ni sobre «Siguiente»
        assert.equal(await page.locator('#s-sesion .ses-card.question[data-item="git.2"]').count(), 1);
        await page.keyboard.press('Enter');
        i++;
        step = 'sesión completa con teclado';
        continue;
      }
      await page.keyboard.press('Enter');
    }
    // 5.ª tarjeta (datos.0): mal
    await page.waitForSelector('#s-sesion .ses-card.idea');
    assert.match(await page.textContent('#s-sesion .ses-tag'), /Nuevo · Datos/);
    const bad5 = await answerCard(page, false);
    assert.equal(bad5.item, 'datos.0');
    assert.match(bad5.fb, /Casi/);
    assert.doesNotMatch(bad5.fb, /Incorrecto/);
    assert.match(bad5.fb, /\+2 XP/);
    assert.match(bad5.fb, /Vuelve mañana y una vez más al final de esta sesión/);
    assert.equal(await page.locator('#s-sesion .opt.wrong').count(), 1);
    assert.equal(await page.locator('#s-sesion .opt.right').count(), 1);
    assert.match(await page.textContent('#s-sesion .ses-count'), /5 de 6/);
    await nextCard(page);
    // Tarjeta 6: la repetición de datos.0, sin idea
    await page.waitForSelector('#s-sesion .ses-card.question');
    assert.match(await page.textContent('#s-sesion .ses-count'), /6 de 6/);
    const rep = await answerCard(page, true);
    assert.equal(rep.item, 'datos.0');
    assert.match(rep.fb, /Correcto/);
    assert.match(rep.fb, /Vuelve mañana/);
    assert.doesNotMatch(rep.fb, /al final/);
    assert.equal((await localState(page)).items['datos.0'].b, 1, 'la repetición no mueve la caja');
    assert.match(await page.textContent('#s-sesion .ses-next'), /Terminar/);
    await nextCard(page);
    await page.waitForSelector('.session-end');
    const end1 = await page.textContent('.session-end');
    assert.match(end1, /\+72 XP/); // 4×10 + 2 + 10 + 20
    assert.match(end1, /Racha · 1 día/);
    assert.match(end1, /% listo \+5/); // el error de datos.0 no suma peso
    assert.match(end1, /Mañana tienes 5 repasos/);
    assert.doesNotMatch(end1, /Estación vista/);
    assert.equal(await page.locator('.session-end button:has-text("Listo")').count(), 1);
    const st1 = await localState(page);
    assert.deepEqual(st1.days['2026-11-10'], { xp: 72, done: true });

    step = 'salir a media sesión conserva lo respondido';
    await page.click('.session-end button:has-text("Otra sesión")');
    const one = await answerCard(page, true);
    assert.equal(one.item, 'datos.1');
    await page.click('#s-sesion button:has-text("Salir")');
    await page.waitForSelector('#s-hoy:not([hidden])');
    await page.reload();
    await page.waitForSelector('#s-hoy:not([hidden])');
    const st2 = await localState(page);
    assert.equal(st2.items['datos.1'].b, 1);
    assert.equal(st2.days['2026-11-10'].xp, 82);

    step = 'al día siguiente hay repasos y la racha sube';
    await page.clock.setFixedTime(new Date('2026-11-11T10:00:00'));
    await page.reload();
    await page.waitForSelector('#s-hoy:not([hidden])');
    assert.match(await page.textContent('#s-hoy .session-cta'), /repaso/);
    await page.click('#s-hoy .session-cta');
    await page.waitForSelector('#s-sesion .ses-card.question');
    const day2 = await finishAllRight(page);
    assert.equal(day2[0].item, 'datos.0');
    assert.match(day2[0].tag, /Repaso · Datos/);
    assert.match(day2[0].fb, /Vuelve a salir en 3 días/);
    await page.waitForSelector('.session-end');
    assert.match(await page.textContent('.session-end'), /Racha · 2 días/);
    await page.click('.session-end button:has-text("Listo")');
    await page.waitForSelector('#s-hoy:not([hidden])');
    assert.match(await page.textContent('#s-hoy .chip'), /Racha · 2 días/);
    assert.deepEqual(errors, [], 'errores de JS en las sesiones');

    step = 'no se empieza una sesión durante el borrado';
    const blocked = await page.evaluate(() => { deleting = true; try { startSession(); return currentScreen; } finally { deleting = false; } });
    assert.equal(blocked, 'hoy');
    await page.waitForFunction(() => /Espera a que termine el borrado/.test(document.getElementById('notices').textContent));

    step = 'el cierre cuenta solo lo ganado en la sesión aunque llegue progreso de la nube';
    // La nube trae un día viejo con 500 XP y APIs ya estudiada; la sincronización lenta llega a media sesión.
    const cloud = { v: 2, goal: 'edar-dev-jr', goalT: 1, items: {}, days: { '2026-11-01': { xp: 500, done: true } } };
    for (let n = 0; n < 6; n++) cloud.items['apis.' + n] = { b: 5, due: '2026-12-30', t: 5 };
    const ctxK = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const kc = await openHome(ctxK, { clock: '2026-11-10T10:00:00', session: true, slowSync: 600,
      seed: { mapa_progreso: [{ user_id: 'u1', email: 'alumno@test.mx', state: cloud }] },
      local: JSON.stringify({ v: 2, goal: 'edar-dev-jr', goalT: 1, items: {}, days: {} }) });
    await kc.page.click('#s-hoy .session-cta');
    await answerCard(kc.page, true);
    await kc.page.waitForFunction((k) => /apis\.0/.test(localStorage.getItem(k) || ''), KEY, { timeout: 10000 });
    await nextCard(kc.page);
    await finishAllRight(kc.page);
    const endK = await kc.page.textContent('.session-end');
    assert.match(endK, /\+70 XP/); // 5 × 10 + 20
    assert.match(endK, /% listo \+7/);
    assert.doesNotMatch(endK, /Estación vista/);
    assert.deepEqual(kc.errors, []);
    await ctxK.close();

    step = 'medianoche a media sesión';
    // Todos los pasos de L1 ya vistos: la sesión trae las preguntas extra (Reto) de Git, Datos y SQL.
    const night = { v: 2, goal: 'edar-dev-jr', goalT: 1, items: {}, days: {} };
    ['git', 'datos', 'sql', 'apis', 'pruebas-auto'].forEach((s) => { for (let n = 0; n < 4; n++) night.items[s + '.' + n] = { b: 2, due: '2026-11-20', t: 1 }; });
    const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mn = await openHome(ctxM, { clock: '2026-11-12T23:58:00', local: JSON.stringify(night) });
    await mn.page.click('#s-hoy .session-cta');
    const r1 = await answerCard(mn.page, true);
    assert.equal(r1.item, 'git.4');
    assert.match(r1.tag, /Reto · Git/);
    await nextCard(mn.page);
    await answerCard(mn.page, true);
    await nextCard(mn.page);
    await mn.page.clock.setFixedTime(new Date('2026-11-13T00:01:00'));
    await finishAllRight(mn.page);
    const endM = await mn.page.textContent('.session-end');
    assert.match(endM, /Estación vista: Git/);
    assert.match(endM, /Estación vista: Datos/);
    assert.match(endM, /Racha · 1 día/);
    const stM = await localState(mn.page);
    assert.equal(stM.days['2026-11-12'].xp, 20);
    assert.equal(!!stM.days['2026-11-12'].done, false);
    assert.equal(stM.days['2026-11-13'].done, true);
    assert.equal(stM.days['2026-11-13'].xp, 50);
    assert.deepEqual(mn.errors, []);
    await ctxM.close();

    step = 'iniciar sesión sincroniza';
    const ctxL = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const lg = await openHome(ctxL, { local: JSON.stringify({ v: 2, goal: 'edar-dev-jr', goalT: 1, items: {}, days: {} }) });
    await lg.page.waitForSelector('#s-hoy:not([hidden])');
    await lg.page.click('#tabbar [data-tab=yo]');
    await lg.page.click('#s-yo button:has-text("Guarda tu progreso en la nube")');
    await lg.page.fill('#email', 'alumno@test.mx');
    await lg.page.click('#send-link');
    await lg.page.waitForFunction(() => /Revisa tu correo/.test(document.getElementById('auth-msg').textContent));
    await lg.page.evaluate(() => window.__fakeLogin());
    await lg.page.waitForFunction(() => window.__db.mapa_progreso.length === 1 && window.__db.mapa_progreso[0].state.goal === 'edar-dev-jr');
    await lg.page.waitForFunction(() => /alumno@test\.mx/.test(document.getElementById('s-yo').textContent));
    assert.equal(await lg.page.locator('#s-yo #logout').count(), 1);
    assert.equal(await lg.page.locator('#s-yo button:has-text("Mis respuestas")').count(), 1);

    step = 'borrar mis datos con sesión';
    const del = lg.page.locator('#s-yo button.danger');
    await del.click();
    assert.equal(await lg.page.isVisible('#s-yo'), true, 'el primer clic solo pide confirmar');
    assert.notEqual(await localState(lg.page), null);
    await del.click();
    await lg.page.waitForSelector('#s-entrada:not([hidden])');
    await lg.page.waitForFunction(() => window.__db.mapa_progreso.length === 0);
    await lg.page.waitForFunction(() => document.activeElement === document.querySelector('#s-entrada h1'));
    assert.equal(await localState(lg.page), null);
    assert.equal(await lg.page.locator('#s-entrada #door-goal').count(), 1, 'sin meta ni resultado se vuelve a la entrada');
    assert.deepEqual(lg.errors, [], 'errores de JS al iniciar sesión');
    await ctxL.close();

    step = 'cerrar sesión: guarda el avance, borra la copia local y el siguiente no lo ve';
    const ctxO = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const lo = await openHome(ctxO, { session: true, local: JSON.stringify(progressState()) });
    await lo.page.waitForSelector('#s-hoy:not([hidden])');
    await lo.page.click('#s-hoy .session-cta');
    const anaAns = await answerCard(lo.page, true);
    await lo.page.click('#s-sesion button:has-text("Salir")');
    await lo.page.waitForSelector('#s-hoy:not([hidden])');
    await lo.page.click('#tabbar [data-tab=yo]');
    await lo.page.click('#s-yo #logout');
    await lo.page.waitForSelector('#s-entrada:not([hidden])');
    await lo.page.waitForFunction(() => /Tu avance quedó en tu cuenta/.test(document.getElementById('notices').textContent));
    assert.equal(await localState(lo.page), null, 'la copia de este dispositivo se borró');
    assert.equal(await lo.page.evaluate(() => Object.keys(state.items).length + (state.goal ? 1 : 0)), 0, 'y el estado en memoria quedó vacío');
    const ana = await lo.page.evaluate(() => window.__db.mapa_progreso.find((r) => r.user_id === 'u1'));
    assert.equal(ana.state.goal, 'edar-dev-jr', 'el avance quedó en la cuenta');
    assert.ok(ana.state.items[anaAns.item], 'con lo que respondió Ana');
    assert.equal(ana.email, 'alumno@test.mx');
    const anaItems = Object.keys(ana.state.items).length;
    await lo.page.evaluate(() => window.__fakeLogin({ id: 'u2', email: 'Beto@Test.mx' }));
    await lo.page.waitForFunction(() => window.__db.mapa_progreso.some((r) => r.user_id === 'u2'));
    const beto = await lo.page.evaluate(() => window.__db.mapa_progreso.find((r) => r.user_id === 'u2'));
    assert.deepEqual(beto.state, { v: 2, goal: null, goalT: 0, items: {}, days: {} }, 'Beto no sube nada de Ana');
    assert.equal(beto.email, 'beto@test.mx', 'el correo viaja en minúsculas');
    assert.equal(await lo.page.isVisible('#s-entrada'), true, 'Beto empieza desde la entrada');
    assert.equal(Object.keys((await localState(lo.page) || { items: {} }).items).length, 0);
    assert.equal(Object.keys((await lo.page.evaluate(() => window.__db.mapa_progreso.find((r) => r.user_id === 'u1'))).state.items).length, anaItems, 'la fila de Ana no cambió');
    assert.deepEqual(lo.errors, [], 'errores de JS al cerrar sesión');
    await ctxO.close();

    step = 'cerrar sesión con la sincronización fallida: no borra y ofrece reintentar o cerrar sin borrar';
    const ctxU = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const fo = await openHome(ctxU, { session: true, failSync: true, local: JSON.stringify(progressState()) });
    await fo.page.waitForSelector('#s-hoy:not([hidden])');
    await fo.page.click('#tabbar [data-tab=yo]');
    await fo.page.click('#s-yo #logout');
    await fo.page.waitForFunction(() => /No se pudo guardar tu avance en tu cuenta/.test(document.getElementById('logout-msg').textContent));
    assert.equal((await localState(fo.page)).goal, 'edar-dev-jr', 'no se borró nada');
    assert.equal(await fo.page.isVisible('#s-yo #logout-keep'), true);
    assert.equal((await fo.page.textContent('#s-yo #logout')).trim(), 'Reintentar');
    assert.equal(await fo.page.evaluate(() => !!session), true, 'la sesión sigue abierta');
    // Reintentar con la red de vuelta: guarda, cierra y borra.
    await fo.page.evaluate(() => { window.__failSync = false; });
    await fo.page.click('#s-yo #logout');
    await fo.page.waitForSelector('#s-entrada:not([hidden])');
    assert.equal(await localState(fo.page), null);
    assert.equal(await fo.page.evaluate(() => window.__db.mapa_progreso.find((r) => r.user_id === 'u1').state.goal), 'edar-dev-jr');
    assert.deepEqual(fo.errors, []);
    await ctxU.close();
    // Cerrar sin borrar: el avance se queda en el dispositivo.
    const ctxK2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const ko = await openHome(ctxK2, { session: true, failSync: true, local: JSON.stringify(progressState()) });
    await ko.page.waitForSelector('#s-hoy:not([hidden])');
    await ko.page.click('#tabbar [data-tab=yo]');
    await ko.page.click('#s-yo #logout');
    await ko.page.waitForSelector('#s-yo #logout-keep:not([hidden])');
    await ko.page.click('#s-yo #logout-keep');
    await ko.page.waitForSelector('#s-yo button:has-text("Guarda tu progreso en la nube")');
    assert.equal(await ko.page.evaluate(() => !!session), false);
    assert.equal((await localState(ko.page)).goal, 'edar-dev-jr', 'sin borrar: el avance sigue en el dispositivo');
    assert.match(await ko.page.textContent('#s-yo'), /Desarrollador de Software Jr\./);
    assert.deepEqual(ko.errors, []);
    await ctxK2.close();

    step = 'borrar mis datos mientras una sincronización sigue en curso';
    const ctxS = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const sl = await openHome(ctxS, { session: true, slowSync: 800, local: JSON.stringify(progressState()) });
    await sl.page.waitForSelector('#s-hoy:not([hidden])');
    await sl.page.click('#tabbar [data-tab=yo]');
    const delS = sl.page.locator('#s-yo button.danger');
    await delS.click();
    await delS.click();
    await sl.page.waitForSelector('#s-entrada:not([hidden])', { timeout: 10000 });
    await sl.page.waitForTimeout(2000); // más que select + upsert lentos (2 × 800 ms)
    assert.equal(await localState(sl.page), null, 'la sincronización vieja no devuelve el progreso');
    assert.equal(await sl.page.isVisible('#s-entrada'), true);
    assert.equal(await sl.page.evaluate(() => window.__db.mapa_progreso.length), 0, 'el upsert viejo no recrea la fila');
    assert.deepEqual(sl.errors, []);
    await ctxS.close();

    step = 'borrar mis datos con SIGNED_IN durante el borrado';
    const ctxR = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const rs = await openHome(ctxR, { session: true, slowSync: 800, local: JSON.stringify(progressState()) });
    await rs.page.waitForSelector('#s-hoy:not([hidden])');
    await rs.page.click('#tabbar [data-tab=yo]');
    const delR = rs.page.locator('#s-yo button.danger');
    await delR.click();
    await delR.click();
    await rs.page.evaluate(() => { setTimeout(() => window.__fakeLogin(), 100); setTimeout(() => window.__fakeLogin(), 400); });
    await rs.page.waitForSelector('#s-entrada:not([hidden])', { timeout: 10000 });
    await rs.page.waitForTimeout(2500); // más que select + upsert lentos de las sincronizaciones tardías
    assert.equal(await localState(rs.page), null, 'un SIGNED_IN durante el borrado no devuelve el progreso');
    assert.equal(await rs.page.evaluate(() => window.__db.mapa_progreso.length), 0, 'ni recrea la fila remota');
    assert.equal(await rs.page.isVisible('#s-entrada'), true);
    assert.deepEqual(rs.errors, []);
    await ctxR.close();

    step = 'borrar mis datos con falla al borrar en la nube';
    const ctxX = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const fx = await openHome(ctxX, { session: true, failDelete: true, local: JSON.stringify(progressState()) });
    await fx.page.click('#tabbar [data-tab=yo]');
    const delX = fx.page.locator('#s-yo button.danger');
    await delX.click();
    await delX.click();
    await fx.page.waitForFunction(() => /No se pudo borrar tu progreso de la nube/.test(document.getElementById('notices').textContent));
    assert.equal(await fx.page.isVisible('#s-yo'), true);
    assert.equal((await localState(fx.page)).goal, 'edar-dev-jr', 'no se borró nada');
    assert.equal(await fx.page.evaluate(() => window.__db.mapa_progreso.length), 1);
    assert.equal((await delX.textContent()).trim(), 'Borrar mis datos');
    assert.equal(await delX.isDisabled(), false);
    assert.equal(await fx.page.evaluate(() => syncNow().then((r) => r !== null)), true, 'tras la falla se puede sincronizar otra vez');
    assert.deepEqual(fx.errors, []);
    await ctxX.close();

    step = 'dispositivo nuevo con cuenta: entrar desde la entrada';
    const ctxN = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const remote = { v: 2, goal: 'safe-soc', goalT: 5, items: { 'redes.0': { b: 1, due: addDays(todayYmd(), 1), t: 5 } }, days: {} };
    const nw = await openHome(ctxN, { seed: { mapa_progreso: [{ user_id: 'u1', email: 'alumno@test.mx', state: remote }] } });
    await nw.page.waitForSelector('#s-entrada:not([hidden])');
    await nw.page.click('#s-entrada button:has-text("¿Ya tienes cuenta? Entra")');
    await nw.page.waitForSelector('#pick-email');
    await nw.page.fill('#pick-email', 'alumno@test.mx');
    await nw.page.click('#pick-send-link');
    await nw.page.waitForFunction(() => /Revisa tu correo/.test(document.getElementById('pick-auth-msg').textContent));
    await nw.page.evaluate(() => window.__fakeLogin());
    await nw.page.waitForSelector('#s-hoy:not([hidden])');
    assert.match(await nw.page.textContent('#s-hoy'), /Analista SOC/);
    assert.equal((await localState(nw.page)).goal, 'safe-soc');
    const row = await nw.page.evaluate(() => window.__db.mapa_progreso[0].state);
    assert.equal(row.goal, 'safe-soc', 'la meta de la nube no se pisó');
    assert.equal(row.goalT, 5);
    assert.ok(row.items['redes.0']);
    assert.deepEqual(nw.errors, []);
    await ctxN.close();

    step = 'Hoy con avance y fecha fija';
    // Miércoles 11 de noviembre de 2026: lunes cumplido, martes de descanso, domingo anterior cumplido.
    const fixed = { v: 2, goal: 'edar-dev-jr', goalT: 1, items: {}, days: { '2026-11-09': { xp: 50, done: true }, '2026-11-08': { xp: 40, done: true } } };
    for (let n = 0; n < 6; n++) fixed.items['git.' + n] = { b: 2, due: '2026-11-13', t: 1 };
    const ctxC = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const ck = await openHome(ctxC, { clock: '2026-11-11T12:00:00', local: JSON.stringify(fixed) });
    await ck.page.waitForSelector('#s-hoy:not([hidden])');
    const labels = await ck.page.locator('#s-hoy .week li .sr-only').allTextContents();
    assert.deepEqual(labels, ['lunes, cumplido', 'martes, día de descanso', 'miércoles, hoy, pendiente', 'jueves, por venir',
      'viernes, por venir', 'sábado, por venir', 'domingo, por venir']);
    assert.equal(await ck.page.locator('#s-hoy .week li[aria-label]').count(), 0);
    assert.match(await ck.page.textContent('#s-hoy .chip'), /Racha · 2 días/);
    assert.match(await ck.page.textContent('#s-hoy'), /12%/);
    assert.match(await ck.page.textContent('#s-hoy'), /te faltan 4 estaciones/);
    const rows = await ck.page.locator('#s-hoy .lrow').allTextContents();
    assert.equal(rows.length, 1, 'solo L4 comparte Git');
    assert.match(rows[0], /L4[^]*Ingeniero de Operaciones Cloud Jr\.[^]*12%/);
    assert.deepEqual(ck.errors, []);
    await ctxC.close();

    step = 'falla de sincronización';
    const ctxF = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const fl = await openHome(ctxF, { session: true, failSync: true });
    await fl.page.waitForSelector('#s-entrada:not([hidden])');
    await fl.page.waitForSelector('#notices .notice');
    await fl.page.click('#notices .notice button');
    await fl.page.waitForSelector('#notices .notice', { state: 'detached' });
    await fl.page.click('#door-goal');
    await fl.page.locator('#s-pick .line-card', { hasText: 'Analista de Datos Jr.' }).click();
    await fl.page.waitForSelector('#s-hoy:not([hidden])');
    await fl.page.waitForSelector('#notices .notice');
    assert.equal((await fl.page.textContent('#notices')).includes(SYNC_FAIL), true);
    assert.equal(await fl.page.getAttribute('#notices', 'role'), 'status');
    assert.equal((await localState(fl.page)).goal, 'sears-datos-jr');
    assert.equal(await fl.page.evaluate(() => window.__db.mapa_progreso.length), 0);
    assert.deepEqual(fl.errors, [], 'errores de JS con falla de sincronización');
    await ctxF.close();

    step = 'estás al día';
    const ctxD = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const ad = await openHome(ctxD, { local: JSON.stringify(allDoneState()) });
    await ad.page.waitForSelector('#s-hoy:not([hidden])');
    const hoy = await ad.page.textContent('#s-hoy');
    assert.match(hoy, /Estás al día/);
    assert.match(hoy, /Próximo repaso:/);
    assert.match(hoy, /100%/);
    assert.equal(await ad.page.locator('#s-hoy .session-cta').count(), 0);
    await ad.page.click('#s-hoy button:has-text("Otra sesión")');
    await ad.page.waitForSelector('#s-sesion:not([hidden])');
    assert.deepEqual(ad.errors, [], 'errores de JS en «estás al día»');
    await ctxD.close();

    step = 'estado guardado ilegible';
    const ctxB = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const bad = await openHome(ctxB, { local: '{esto no es json' });
    await bad.page.waitForSelector('#s-entrada:not([hidden])');
    await bad.page.waitForFunction(() => /no se pudo leer/.test(document.getElementById('notices').textContent));
    assert.deepEqual(bad.errors, []);
    await ctxB.close();

    await entradaScenarios(browser, (t) => { step = t; });

    await descubreScenarios(browser, (t) => { step = t; });

    await teacherScenarios(browser, (t) => { step = t; });

    await sharedStateScenarios(browser, (t) => { step = t; });

    await miniLineScenarios(browser, (t) => { step = t; });

    for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      for (const cs of ['light', 'dark']) {
        step = 'revisión visual ' + vp.width + ' px, tema ' + cs;
        await visualPass(browser, vp, cs);
      }
    }
    await cdnScenarios(browser, (t) => { step = t; });
    console.log('e2e: OK');
  } catch (e) {
    console.error('e2e: FALLÓ en «' + step + '»');
    console.error(e && e.message ? e.message : e);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
