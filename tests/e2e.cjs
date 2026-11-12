// Prueba de flujo del hub (Elegir meta, Hoy y Yo) con Playwright y un Supabase falso.
// Correr con: node tests/e2e.cjs   (capturas: SHOTS_DIR=/ruta node tests/e2e.cjs)
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { ESTACIONES } = require('../js/data-estaciones.js');
const { todayYmd, addDays, weekKey } = require('../js/core.js');

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
// opts: { seed, session, admin, failSync, slowSync (ms), failDelete, local, clock (fecha fija) }.
// `local` es el texto que se guarda en localStorage antes de cargar (null: no se toca).
async function openHome(context, opts) {
  const o = opts || {};
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await setupRoutes(page);
  await page.addInitScript((a) => {
    window.__seed = Object.assign({}, a.seed || {}, a.session ? { session: true } : {});
    if (a.admin) window.__fakeAdmin = true;
    if (a.failSync) window.__failSync = true;
    if (a.local !== null && a.local !== undefined && !sessionStorage.getItem('e2e.seeded')) {
      localStorage.setItem(a.key, a.local);
      sessionStorage.setItem('e2e.seeded', '1');
    }
    if (a.slowSync) window.__slowSync = a.slowSync;
    if (a.failDelete) window.__failDelete = true;
  }, { seed: o.seed, session: !!o.session, admin: !!o.admin, failSync: !!o.failSync, slowSync: o.slowSync || 0, failDelete: !!o.failDelete,
    local: o.local === undefined ? null : o.local, key: KEY });
  if (o.clock) await page.clock.setFixedTime(new Date(o.clock));
  await page.goto(INDEX_URL);
  await page.waitForSelector('#s-pick:not([hidden]), #s-hoy:not([hidden])');
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

// Recorre Hoy → Yo → Elegir meta → Hoy con una línea de 7 estaciones y verifica que no haya scroll horizontal.
async function visualPass(browser, viewport, colorScheme) {
  const ctx = await browser.newContext({ viewport, colorScheme, deviceScaleFactor: 1 });
  const { page, errors } = await openHome(ctx, { local: JSON.stringify(progressState()) });
  const tag = viewport.width + '-' + colorScheme;
  const check = async (name) => {
    assert.ok(await page.evaluate(noHScroll), 'scroll horizontal en ' + name + ' (' + tag + ')');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, tag + '-' + name + '.png'), fullPage: true, animations: 'disabled' });
  };
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
  assert.deepEqual(errors, [], 'errores de JS (' + tag + ')');
  await ctx.close();
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

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  let step = '';
  try {
    step = 'primera visita sin cuenta: elegir meta';
    const { page, errors } = await openHome(context, { clock: '2026-11-10T10:00:00' });
    await page.waitForSelector('#s-pick:not([hidden])');
    assert.equal(await page.locator('#s-pick .line-card').count(), 9);
    assert.match(await page.locator('#s-pick .line-card').first().textContent(), /Para empezar/);
    const levels = await page.locator('#s-pick .line-card').evaluateAll((cs) => cs.map((c) => /Para empezar/.test(c.textContent)));
    assert.deepEqual(levels, [true, true, true, true, true, true, false, false, false], 'primero las de «Para empezar»');
    for (let n = 1; n <= 9; n++) assert.equal(await page.locator('#s-pick .line-card .lbadge', { hasText: 'L' + n }).count(), 1, 'insignia L' + n);
    assert.equal(await page.isVisible('#tabbar'), false, 'sin barra inferior al elegir meta');
    const firstFocus = await page.evaluate(() => {
      const h = document.querySelector('#s-pick h1');
      const cs = getComputedStyle(h);
      return { onHeading: document.activeElement === h, style: cs.outlineStyle, width: cs.outlineWidth };
    });
    assert.equal(firstFocus.onHeading, false, 'al cargar no se toma el foco');
    // outline-width inicial es «medium» (3px) aunque no haya aro; lo que cuenta es que el estilo sea none.
    assert.ok(firstFocus.style === 'none' || firstFocus.width === '0px', 'sin aro de foco en el título al cargar');
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
    await page.click('#s-yo button:has-text("Descubre tu área")');
    await page.waitForSelector('#s-intro:not([hidden])');
    assert.equal(await page.locator('#s-intro #login, #s-intro #home').count(), 0);
    assert.equal(await page.locator('#s-intro .mode').count(), 2);
    await page.click('#s-intro #start');
    await page.waitForSelector('#s-quiz:not([hidden])');
    assert.equal(await page.isVisible('#tabbar'), false, 'sin barra inferior en el cuestionario');
    await page.click('#back');
    await page.waitForSelector('#s-intro:not([hidden])');
    await page.click('#s-intro button:has-text("Volver")');
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
    assert.match(end1, /% listo \+7/);
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
    assert.equal(await lg.page.locator('#s-yo button:has-text("Cerrar sesión")').count(), 1);
    assert.equal(await lg.page.locator('#s-yo button:has-text("Mis respuestas")').count(), 1);

    step = 'borrar mis datos con sesión';
    const del = lg.page.locator('#s-yo button.danger');
    await del.click();
    assert.equal(await lg.page.isVisible('#s-yo'), true, 'el primer clic solo pide confirmar');
    assert.notEqual(await localState(lg.page), null);
    await del.click();
    await lg.page.waitForSelector('#s-pick:not([hidden])');
    await lg.page.waitForFunction(() => window.__db.mapa_progreso.length === 0);
    await lg.page.waitForFunction(() => document.activeElement === document.querySelector('#s-pick h1'));
    assert.equal(await localState(lg.page), null);
    assert.equal(await lg.page.locator('#s-pick button:has-text("Volver")').count(), 0, 'sin meta no hay a dónde volver');
    assert.deepEqual(lg.errors, [], 'errores de JS al iniciar sesión');
    await ctxL.close();

    step = 'cerrar sesión conserva el progreso local';
    const ctxO = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const lo = await openHome(ctxO, { local: JSON.stringify(progressState()) });
    await lo.page.click('#tabbar [data-tab=yo]');
    await lo.page.evaluate(() => window.__fakeLogin());
    await lo.page.waitForSelector('#s-yo #logout');
    await lo.page.click('#s-yo #logout');
    await lo.page.waitForSelector('#s-yo button:has-text("Guarda tu progreso en la nube")');
    assert.equal(await lo.page.locator('#s-yo #logout').count(), 0);
    assert.equal((await localState(lo.page)).goal, 'edar-dev-jr');
    assert.match(await lo.page.textContent('#s-yo'), /Desarrollador de Software Jr\./);
    assert.deepEqual(lo.errors, [], 'errores de JS al cerrar sesión');
    await ctxO.close();

    step = 'borrar mis datos mientras una sincronización sigue en curso';
    const ctxS = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const sl = await openHome(ctxS, { session: true, slowSync: 800, local: JSON.stringify(progressState()) });
    await sl.page.waitForSelector('#s-hoy:not([hidden])');
    await sl.page.click('#tabbar [data-tab=yo]');
    const delS = sl.page.locator('#s-yo button.danger');
    await delS.click();
    await delS.click();
    await sl.page.waitForSelector('#s-pick:not([hidden])', { timeout: 10000 });
    await sl.page.waitForTimeout(2000); // más que select + upsert lentos (2 × 800 ms)
    assert.equal(await localState(sl.page), null, 'la sincronización vieja no devuelve el progreso');
    assert.equal(await sl.page.isVisible('#s-pick'), true);
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
    await rs.page.waitForSelector('#s-pick:not([hidden])', { timeout: 10000 });
    await rs.page.waitForTimeout(2500); // más que select + upsert lentos de las sincronizaciones tardías
    assert.equal(await localState(rs.page), null, 'un SIGNED_IN durante el borrado no devuelve el progreso');
    assert.equal(await rs.page.evaluate(() => window.__db.mapa_progreso.length), 0, 'ni recrea la fila remota');
    assert.equal(await rs.page.isVisible('#s-pick'), true);
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

    step = 'dispositivo nuevo con cuenta: entrar desde Elegir meta';
    const ctxN = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const remote = { v: 2, goal: 'safe-soc', goalT: 5, items: { 'redes.0': { b: 1, due: addDays(todayYmd(), 1), t: 5 } }, days: {} };
    const nw = await openHome(ctxN, { seed: { mapa_progreso: [{ user_id: 'u1', email: 'alumno@test.mx', state: remote }] } });
    await nw.page.waitForSelector('#s-pick:not([hidden])');
    await nw.page.click('#s-pick button:has-text("¿Ya tienes cuenta? Entra")');
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
    await fl.page.waitForSelector('#s-pick:not([hidden])');
    await fl.page.waitForSelector('#notices .notice');
    await fl.page.click('#notices .notice button');
    await fl.page.waitForSelector('#notices .notice', { state: 'detached' });
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
    await bad.page.waitForSelector('#s-pick:not([hidden])');
    await bad.page.waitForFunction(() => /no se pudo leer/.test(document.getElementById('notices').textContent));
    assert.deepEqual(bad.errors, []);
    await ctxB.close();

    step = 'vista docente desde Yo';
    const ctxA = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const adm = await openHome(ctxA, { session: true, admin: true, local: JSON.stringify(progressState()) });
    await adm.page.click('#tabbar [data-tab=yo]');
    await adm.page.waitForSelector('#s-yo button:has-text("Vista docente")');
    await adm.page.click('#s-yo button:has-text("Vista docente")');
    await adm.page.waitForSelector('#s-admin:not([hidden]) h1');
    assert.deepEqual(adm.errors, [], 'errores de JS en la vista docente');
    await ctxA.close();

    for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      for (const cs of ['light', 'dark']) {
        step = 'revisión visual ' + vp.width + ' px, tema ' + cs;
        await visualPass(browser, vp, cs);
      }
    }
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
