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

    // --- Tarea 5: diagnóstico ---
    step = 'diagnóstico completo con teclado';
    const diagOks = await page.evaluate((id) => RUTAS[id].topics.map((t) => t.diag.ok), RUTA);
    await page.click('text=Hacer el diagnóstico');
    await page.waitForSelector('#s-quiz:not([hidden])');
    assert.match(await page.textContent('#counter'), /Pregunta 1 de 7/);
    assert.equal(await page.locator('#quiz-body .opt').count(), 5);
    assert.match(await page.locator('#quiz-body .opt').nth(4).textContent(), /Aún no lo sé/);
    await answer(page, '5'); // «Aún no lo sé» en el primer tema
    for (let i = 1; i < 7; i++) await answer(page, String(diagOks[i] + 1));
    await page.waitForSelector('#s-learn:not([hidden]) .diag-result');
    assert.match(await page.textContent('#s-learn'), /Dominas 6 de 7/);
    await page.waitForFunction(() => window.__db.mapa_aprendizaje.length === 1);
    const row = await page.evaluate(() => window.__db.mapa_aprendizaje[0]);
    assert.equal(row.kind, 'diagnostico');
    assert.equal(row.topic, null);
    assert.equal(row.ruta, RUTA);
    assert.deepEqual(row.answers, [4, ...diagOks.slice(1)]);
    assert.equal(row.scores.agentes, 0);
    assert.equal(row.scores.multiagente, 1);
    await page.waitForFunction(() => /Guardado/.test(document.getElementById('s-learn').textContent));

    step = 'volver a la ruta tras el diagnóstico';
    await page.click('text=Volver a la ruta');
    await page.waitForSelector('#s-learn .topic-row');
    const first = page.locator('#s-learn .topic-row').first();
    assert.match(await first.textContent(), /Orquestación de agentes/);
    assert.match(await first.locator('.state').textContent(), /Por aprender/);
    assert.equal(await page.locator('#s-learn .state', { hasText: 'Ya lo dominas' }).count(), 6);
    assert.equal(await page.locator('#s-learn button', { hasText: 'Repetir el diagnóstico' }).count(), 1);

    step = 'el cuestionario del mapa sigue terminando en áreas';
    await page.click('text=← Inicio');
    await page.click('#start');
    for (let i = 0; i < 10; i++) await answer(page, '1');
    await page.waitForSelector('#s-result:not([hidden])');
    assert.match(await page.textContent('#s-result'), /Tres áreas para probar primero/);

    step = 'falla al guardar el diagnóstico';
    await page.click('#s-result .vacancy button');
    await page.waitForSelector('#s-learn .topic-row');
    await page.evaluate(() => { window.__failInsert = true; });
    await page.click('text=Repetir el diagnóstico');
    for (let i = 0; i < 7; i++) await answer(page, '5');
    await page.waitForSelector('#s-learn .diag-result');
    await page.waitForFunction(() => /No se pudo guardar/.test(document.getElementById('s-learn').textContent));
    assert.match(await page.textContent('#s-learn'), /Dominas 0 de 7/);
    await page.evaluate(() => { window.__failInsert = false; });
    assert.equal(await page.evaluate(() => window.__db.mapa_aprendizaje.length), 1);
    await page.click('text=Volver a la ruta');
    await page.waitForSelector('#s-learn .topic-row');

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
