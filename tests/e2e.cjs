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

// Abre el sitio. Por defecto sin sesión (la primera visita normal). opts: { seed, session, admin, failSync, local }.
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
  }, { seed: o.seed, session: !!o.session, admin: !!o.admin, failSync: !!o.failSync, local: o.local === undefined ? null : o.local, key: KEY });
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

// Recorre Hoy → Yo → Elegir meta → Hoy con una línea de 7 estaciones y verifica que no haya scroll horizontal.
async function visualPass(browser, viewport, colorScheme) {
  const ctx = await browser.newContext({ viewport, colorScheme, deviceScaleFactor: 1 });
  const { page, errors } = await openHome(ctx, { local: JSON.stringify(progressState()) });
  const tag = viewport.width + '-' + colorScheme;
  const check = async (name) => {
    assert.ok(await page.evaluate(noHScroll), 'scroll horizontal en ' + name + ' (' + tag + ')');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, tag + '-' + name + '.png'), fullPage: true });
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
  await page.waitForSelector('#s-mapa:not([hidden])');
  await check('mapa');
  assert.deepEqual(errors, [], 'errores de JS (' + tag + ')');
  await ctx.close();
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  let step = '';
  try {
    step = 'primera visita sin cuenta: elegir meta';
    const { page, errors } = await openHome(context);
    await page.waitForSelector('#s-pick:not([hidden])');
    assert.equal(await page.locator('#s-pick .line-card').count(), 9);
    assert.match(await page.locator('#s-pick .line-card').first().textContent(), /Para empezar/);
    const levels = await page.locator('#s-pick .line-card').evaluateAll((cs) => cs.map((c) => /Para empezar/.test(c.textContent)));
    assert.deepEqual(levels, [true, true, true, true, true, true, false, false, false], 'primero las de «Para empezar»');
    for (let n = 1; n <= 9; n++) assert.equal(await page.locator('#s-pick .line-card .lbadge', { hasText: 'L' + n }).count(), 1, 'insignia L' + n);
    assert.equal(await page.isVisible('#tabbar'), false, 'sin barra inferior al elegir meta');
    await page.locator('#s-pick .line-card', { hasText: 'Desarrollador de Software Jr.' }).click();
    await page.waitForSelector('#s-hoy:not([hidden])');
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

    step = 'la sesión y el mapa (stubs) se alcanzan';
    await page.click('#s-hoy .session-cta');
    await page.waitForSelector('#s-sesion:not([hidden])');
    assert.equal(await page.isVisible('#tabbar'), false, 'sin barra inferior en la sesión');
    await page.click('#s-sesion button:has-text("Salir")');
    await page.waitForSelector('#s-hoy:not([hidden])');
    await page.click('#tabbar [data-tab=mapa]');
    await page.waitForSelector('#s-mapa:not([hidden])');
    assert.equal(await page.getAttribute('#tabbar [data-tab=mapa]', 'aria-current'), 'page');
    assert.equal(await page.getAttribute('#tabbar [data-tab=hoy]', 'aria-current'), null);

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

    step = 'iniciar sesión sincroniza';
    const lg = await openHome(context);
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
    assert.equal(await localState(lg.page), null);
    assert.equal(await lg.page.locator('#s-pick button:has-text("Volver")').count(), 0, 'sin meta no hay a dónde volver');
    assert.deepEqual(lg.errors, [], 'errores de JS al iniciar sesión');
    await lg.page.close();

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
