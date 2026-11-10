// Prueba de flujo de Rutas por vacante con Playwright y un Supabase falso.
// Correr con: node tests/e2e.cjs   (capturas: SHOTS_DIR=/ruta node tests/e2e.cjs)
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const INDEX_URL = 'file://' + path.resolve(__dirname, '../index.html');
const FAKE = fs.readFileSync(path.join(__dirname, 'fake-supabase.js'), 'utf8');
const SB_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
const RUTA = 'getnet-ai-deploy';

async function setupRoutes(page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.route(SB_URL, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE }));
}

// choose() bloquea la entrada 170 ms: espera a que cambie la pregunta o termine el cuestionario.
async function answer(page, key) {
  const before = await page.textContent('#counter');
  await page.keyboard.press(key);
  await page.waitForFunction((b) => document.getElementById('s-quiz').hidden || document.getElementById('counter').textContent !== b, before);
}

const noHScroll = () => document.documentElement.scrollWidth <= window.innerWidth;

async function openHome(context) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await setupRoutes(page);
  await page.goto(INDEX_URL);
  await page.waitForSelector('#home:not([hidden])');
  return { page, errors };
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const { page, errors } = await openHome(context);
  let step = '';
  try {
    // --- Tarea 4: ruta y entradas ---
    step = 'abrir la ruta desde el inicio';
    await page.click('#to-learn');
    await page.waitForSelector('#s-learn:not([hidden]) .topic-row');
    assert.match(await page.textContent('#s-learn'), /AI Deployment Engineer/);
    assert.equal(await page.locator('#s-learn .topic-row').count(), 7);
    assert.equal(await page.locator('#s-learn .topic-row .state', { hasText: 'Sin evaluar' }).count(), 7);
    assert.equal(await page.locator('#s-learn a[href*="greenhouse.io/getnet/jobs/5019637101"]').count(), 1);
    assert.equal(await page.locator('#s-learn a[href*="greenhouse.io"][target="_blank"][rel="noopener"]').count(), 1);
    assert.match(await page.textContent('#s-learn'), /7 preguntas · 4 minutos · sí hay respuestas correctas/);

    step = 'panel de vacante en el resultado del mapa';
    await page.click('text=← Inicio');
    await page.click('#start');
    for (let i = 0; i < 10; i++) await answer(page, '1');
    await page.waitForSelector('#s-result:not([hidden])');
    assert.equal(await page.locator('#s-result .vacancy').count(), 1);
    await page.click('#s-result .vacancy button');
    await page.waitForSelector('#s-learn:not([hidden]) .topic-row');

    assert.deepEqual(errors, [], 'errores de JS en la página');
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
