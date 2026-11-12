// Pruebas del cuestionario de áreas (js/data-areas.js).
// Correr con: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const dataAreas = require('../js/data-areas.js');
const { scoreAnswers, MAXP } = dataAreas;
const { lineasFor } = require('../js/core.js');
const { LINEAS } = require('../js/data-lineas.js');

test('scoreAnswers v2 con la opción 1 en todo: ml, bak, dat arriba', () => {
  const r = scoreAnswers([0,0,0,0,0,0,0,0,0,0], 2).slice(0, 3).map(x => x.key + ':' + x.pct);
  assert.deepEqual(r, ['ml:57', 'bak:43', 'dat:36']);
});
test('MAXP tiene las 9 áreas en las dos versiones', () => {
  for (const v of [1, 2]) assert.equal(Object.keys(MAXP[v]).length, 9);
});
test('el resultado enlaza con las líneas de sus tres áreas', () => {
  const top = scoreAnswers([0,0,0,0,0,0,0,0,0,0], 2).slice(0, 3).map(x => x.key);
  assert.deepEqual([...lineasFor(top, LINEAS)], ['edar-dev-jr', 'sears-datos-jr', 'mvs-tester-jr', 'banorte-ds-jr', 'getnet-ai-deploy']);
  assert.deepEqual([...lineasFor(['inv'], LINEAS)], []);
});
test('data-areas.js solo exporta el cuestionario y el glosario', () => {
  assert.deepEqual(Object.keys(dataAreas).sort(), ['AREAS', 'GLOSS', 'MAXP', 'SETS', 'scoreAnswers']);
});
