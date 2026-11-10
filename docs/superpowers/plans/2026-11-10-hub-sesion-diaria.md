# Hub de estudio con sesión diaria: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** convertir Mapa de áreas en un hub de estudio diario. Siete líneas (vacantes reales) y 27 estaciones (habilidades); sesiones de 5 tarjetas con repetición espaciada, XP y racha; uso sin cuenta y sincronización opcional con Supabase.

**Architecture:**
- Sitio estático sin build. `index.html` se reparte en `css/` y `js/`, y los scripts son clásicos.
- Las reglas de aprendizaje son funciones puras en `js/core.js`, probadas con Node.
- El estado vive en `localStorage` (`mapa.v2`). Con cuenta se combina con una fila de `public.mapa_progreso`.

**Tech Stack:**
- HTML, CSS y JS (ES5 en el navegador, como el código actual).
- supabase-js 2.45.4 (UMD).
- Node 22: `node --test`.
- Playwright 1.63, que trae `page.clock`.
- Supabase MCP para la migración.

**Spec:** `docs/superpowers/specs/2026-11-10-hub-sesion-diaria-design.md`

## Global Constraints

- Sin build ni dependencias nuevas en el navegador. Scripts clásicos que abren desde `file://`. Los archivos de datos y `js/core.js` terminan con `if (typeof module !== 'undefined') module.exports = {…}`.
- Cajas: `BOX_DAYS = [0, 1, 3, 7, 16, 35]` y `BOX_WEIGHT = [0, 0.4, 0.6, 0.8, 0.9, 1]`. Un acierto sube una caja (tope 5); un error baja a la caja 1 y vuelve en 1 día.
- Ítems: `«estación».n`, con n de 0 a 3 para las preguntas de los pasos y 4 y 5 para las 2 preguntas extra. Exactamente 4 opciones por pregunta.
- Sesión: 5 tarjetas como máximo. Hasta 3 repasos y el resto pasos nuevos. Un error se repite una vez al final, y esa repetición no mueve la caja.
- XP: 10 por acierto, 2 por error y 20 por terminar la sesión. Nivel: `1 + floor(xp / 200)`.
- Racha: días cumplidos consecutivos hasta hoy o ayer. Se tolera un día faltante por semana (de lunes a domingo).
- Fechas: texto `AAAA-MM-DD` con la fecha local del dispositivo. La fecha de hoy se calcula en cada respuesta y al cerrar la sesión, no al empezarla.
- Siete líneas con los ids, números y estaciones de la tabla «Las siete líneas» del spec. Ids de las estaciones:
  - nuevas: `git`, `datos`, `sql`, `apis`, `pruebas-auto`, `hojas`, `tableros`, `indicadores`, `casos-prueba`, `defectos`, `linux`, `nube`, `monitoreo`, `redes`, `amenazas`, `incidentes`, `python`, `estadistica`, `ml`, `llm`;
  - adaptadas de Getnet: `agentes`, `multiagente`, `evaluacion`, `guardrails`, `rag`, `mcp`, `observabilidad`.
- Ids de las líneas: `edar-dev-jr`, `sears-datos-jr`, `mvs-tester-jr`, `satori-cloud-jr`, `safe-soc`, `banorte-ds-jr`, `getnet-ai-deploy`.
- Interfaz en español de México, de tú, sin jerga. Cada término técnico de una estación aparece en `GLOSS`.
- Hábito sin manipulación: sin notificaciones, sin mensajes de culpa y sin castigo por faltar.
- Teléfono primero: sin scroll horizontal a 390 px, objetivos táctiles de 44 px, teclas 1 a 4 y Enter en la sesión, `aria-live` en la explicación, y `prefers-reduced-motion`.
- Proyecto Supabase `vhdrnrzerjysjzpyzgif`. `mapa_aprendizaje` no se toca.
- Comandos de prueba: `node --test tests/*.test.mjs` y `node tests/e2e.cjs`.

## Review Focus

1. **Dos pestañas abiertas:** la pestaña vieja no debe borrar al guardar lo que respondiste en la nueva. `saveLocal` combina con lo guardado antes de escribir. → Tarea 7.
2. **Medianoche a media sesión:** si empiezas a las 23:58 y terminas a las 00:01, las respuestas cuentan en el día en que las diste y la sesión cuenta como cumplida el día en que la terminas. → Tarea 10.
3. **Fila remota de otra versión** (`v` distinto de 2 o con forma rara): la sincronización no la sobrescribe ni la combina; avisa y sigue en el dispositivo. → Tarea 8.
4. **Todo estudiado y nada pendiente:** Hoy dice «Estás al día» y cuándo toca el próximo repaso. «Otra sesión» adelanta repasos y, si no hay ninguno, lo dice sin romperse. → Tareas 3 y 9.
5. **Teclas después de responder:** las teclas 1 a 4 no vuelven a contestar ni cambian la respuesta; Enter avanza. → Tarea 10.

---

## Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Estructura: secciones de pantalla, barra inferior y carga de scripts |
| `css/app.css` | Tokens (claro y oscuro, 7 colores de línea) y estilos |
| `js/data-areas.js` | `AREAS`, `SETS`, `GLOSS`, `MAXP` y `scoreAnswers` (el bloque DATA actual, sin RUTAS desde la Tarea 12) |
| `js/data-estaciones.js` | `ESTACIONES`: objeto `{ id: Estacion }` |
| `js/data-lineas.js` | `LINEAS`: arreglo de `Linea`, en orden L1 a L7 |
| `js/core.js` | Reglas puras: cajas, avance, sesión, XP, racha, combinación de estados, atajo y geometría del mapa |
| `js/store.js` | `localStorage` y sincronización con Supabase |
| `js/ui.js` | `el`, `show`, `screens`, `glossFor`, `extLink`, `fmtDate`, `showNotice`, barra inferior |
| `js/app.js` | Cliente de Supabase, sesión, `state` global, arranque y enrutamiento inicial |
| `js/pantallas-estudio.js` | Elegir meta, Hoy y Sesión |
| `js/pantallas-mapa.js` | Mapa, Línea y Estación (con el atajo) |
| `js/pantallas-cuenta.js` | Yo y vista docente |
| `js/pantallas-cuestionario.js` | Cuestionario, resultado y Mis respuestas |
| `sql/mapa_progreso.sql` | Copia de la migración aplicada |
| `tests/core.test.mjs` · `tests/content.test.mjs` · `tests/store.test.mjs` · `tests/quiz.test.mjs` | Pruebas con Node; cargan los scripts con `createRequire` |
| `tests/fake-supabase.js` · `tests/e2e.cjs` | Supabase falso y prueba de flujo |

---

### Tarea 1: separar `index.html` en archivos, sin cambiar el comportamiento

**Files:**
- Create: `css/app.css`, `js/data-areas.js`, `js/ui.js`, `js/app.js`, `js/pantallas-cuestionario.js`, `tests/quiz.test.mjs`
- Modify: `index.html`, `tests/logic.test.mjs` (se renombra a `tests/rutas.test.mjs`)

**Interfaces:**
- Produces:
  - `js/data-areas.js` define en global, y exporta en Node, `AREAS`, `SETS`, `GLOSS`, `MAXP`, `scoreAnswers`, `RUTAS`, `NO_SE`, `scoreDiag`, `scoreReview`, `topicStatus` y `rutasFor`.
  - `js/ui.js` define `el`, `show`, `screens`, `glossFor`, `hasOwn`, `extLink`, `fmtDate`, `fmtDay` y `navBack`.
  - El orden de carga en `index.html` es: supabase UMD, `data-areas`, `ui`, `pantallas-cuestionario`, `app`.

- [ ] **Paso 1:** correr `node --test tests/logic.test.mjs && node tests/e2e.cjs`. Resultado esperado: 15/15 y «e2e: OK». Es la línea base.
- [ ] **Paso 2:** escribir `tests/quiz.test.mjs`, que carga `js/data-areas.js` con `createRequire` y prueba lo siguiente:

```js
test('scoreAnswers v2 con la opción 1 en todo: ml, bak, dat arriba', () => {
  const r = scoreAnswers([0,0,0,0,0,0,0,0,0,0], 2).slice(0, 3).map(x => x.key + ':' + x.pct);
  assert.deepEqual(r, ['ml:57', 'bak:43', 'dat:36']);
});
test('MAXP tiene las 9 áreas en las dos versiones', () => {
  for (const v of [1, 2]) assert.equal(Object.keys(MAXP[v]).length, 9);
});
```

  En `tests/rutas.test.mjs` (el actual `logic.test.mjs`) se cambia la extracción del bloque `DATA` por `require('../js/data-areas.js')`.
- [ ] **Paso 3:** correr `node --test tests/*.test.mjs`. Resultado esperado: FAIL, porque no existe `js/data-areas.js`.
- [ ] **Paso 4: mover el código**
  - el bloque `<style>` a `css/app.css`;
  - el contenido de `//DATA-START … //DATA-END` a `js/data-areas.js`;
  - las utilidades de interfaz a `js/ui.js`;
  - el cliente de Supabase, la sesión y los listeners de autenticación a `js/app.js`;
  - todo lo demás a `js/pantallas-cuestionario.js`.

  No cambia ninguna línea de lógica. Cada archivo empieza con un comentario de una línea que dice qué contiene.
- [ ] **Paso 5:** correr `node --test tests/*.test.mjs && node tests/e2e.cjs`. Resultado esperado: todo pasa (17 pruebas de Node y «e2e: OK»). Si `README.md` menciona el bloque DATA en `index.html`, se corrige.
- [ ] **Paso 6:** commit con el mensaje «Separa index.html en css/ y js/ sin cambiar comportamiento».

---

### Tarea 2: cajas y avance

**Files:**
- Create: `js/core.js` y `tests/core.test.mjs`

**Interfaces:**
- Produces, en `js/core.js`:
  - `BOX_DAYS` y `BOX_WEIGHT`.
  - `todayYmd(date?: Date) -> 'AAAA-MM-DD'`, con la fecha local.
  - `addDays(ymd, n) -> ymd`, con aritmética en UTC sobre la fecha.
  - `emptyState() -> { v: 2, goal: null, goalT: 0, items: {}, days: {} }`.
  - `validState(x) -> boolean`: `v === 2` y `items` y `days` son objetos.
  - `itemIds(station) -> string[]`: `['sql.0', …, 'sql.5']`.
  - `getQuestion(stations, itemId) -> { q, opts, ok, why } | null`: n < 4 es `steps[n].q` y n de 4 a 5 es `extra[n - 4]`.
  - `reviewItem(prev | undefined, correct, today, now) -> { b, due, t }`.
  - `stationProgress(state, station) -> número entre 0 y 1`.
  - `isVisited(state, station) -> boolean`.
  - `lineProgress(state, line, stations) -> número entre 0 y 1`.
  - `currentStation(state, line, stations) -> id | null`: la primera estación de la línea, en orden, que tiene algún paso (ítems .0 a .3) en caja 0. Si la línea tiene estaciones que no existen en `stations`, se saltan.

- [ ] **Paso 1: escribir las pruebas que fallan**

  Usan estaciones de prueba `A` y `B` con 4 pasos y 2 extra, y la línea `L = { stations: ['a', 'b'] }`.

```js
test('reviewItem: acierto sube de caja y programa', () => {
  assert.deepEqual({ ...reviewItem(undefined, true, '2026-11-10', 1) }, { b: 1, due: '2026-11-11', t: 1 });
  assert.deepEqual({ ...reviewItem({ b: 2, due: 'x', t: 0 }, true, '2026-11-10', 2) }, { b: 3, due: '2026-11-17', t: 2 });
  assert.equal(reviewItem({ b: 5 }, true, '2026-11-10', 3).b, 5);
  assert.equal(reviewItem({ b: 5 }, true, '2026-11-10', 3).due, '2026-12-15');
});
test('reviewItem: error baja a la caja 1 y vuelve mañana', () => {
  assert.deepEqual({ ...reviewItem({ b: 4 }, false, '2026-12-31', 9) }, { b: 1, due: '2027-01-01', t: 9 });
});
test('avance de estación y de línea con pesos por caja', () => {
  const s = { ...emptyState(), items: { 'a.0': { b: 1 }, 'a.1': { b: 5 } } };
  assert.equal(stationProgress(s, A), (0.4 + 1) / 6);
  assert.equal(lineProgress(s, L, { a: A, b: B }), ((0.4 + 1) / 6) / 2);
});
test('visitada: los 6 ítems en caja 1 o más', () => {
  const items = Object.fromEntries(itemIds(A).map(id => [id, { b: 1 }]));
  assert.equal(isVisited({ ...emptyState(), items }, A), true);
  delete items['a.5'];
  assert.equal(isVisited({ ...emptyState(), items }, A), false);
});
test('estación compartida cuenta en las dos líneas', () => {
  const items = Object.fromEntries(itemIds(A).map(id => [id, { b: 5 }]));
  const st = { ...emptyState(), items }, S = { a: A, b: B };
  assert.equal(lineProgress(st, { stations: ['a', 'b'] }, S), 0.5);
  assert.equal(lineProgress(st, { stations: ['a'] }, S), 1);
});
test('currentStation salta estaciones con todos los pasos vistos y las desconocidas', () => {
  const items = { 'a.0': { b: 1 }, 'a.1': { b: 1 }, 'a.2': { b: 1 }, 'a.3': { b: 1 } };
  assert.equal(currentStation({ ...emptyState(), items }, { stations: ['zzz', 'a', 'b'] }, { a: A, b: B }), 'b');
});
test('ítems desconocidos no cambian el avance', () => {
  const s = { ...emptyState(), items: { 'zzz.0': { b: 5 } } };
  assert.equal(stationProgress(s, A), 0);
});
test('getQuestion y validState', () => {
  assert.equal(getQuestion({ a: A }, 'a.4'), A.extra[0]);
  assert.equal(getQuestion({ a: A }, 'a.9'), null);
  assert.equal(validState(emptyState()), true);
  assert.equal(validState({ v: 3, items: {}, days: {} }), false);
});
```

- [ ] **Paso 2:** correr `node --test tests/core.test.mjs`. Resultado esperado: FAIL, porque no existe `js/core.js`.
- [ ] **Paso 3:** implementar las funciones en ES5, sin mutar sus argumentos.
- [ ] **Paso 4:** correr `node --test tests/*.test.mjs`. Resultado esperado: todas pasan.
- [ ] **Paso 5:** commit con el mensaje «Agrega cajas y avance del hub (core.js)».

---

### Tarea 3: armar la sesión

**Files:**
- Modify: `js/core.js`, `tests/core.test.mjs`

**Interfaces:**
- Consumes: lo de la Tarea 2.
- Produces:
  - `buildSession(state, today, lines, stations, opts?: { ahead?: boolean }) -> Card[]`, con `Card = { kind: 'review' | 'new' | 'extra', item: 'sql.2', station: 'sql', repeat?: true }`.
  - `enqueueRepeat(queue, card, correct) -> Card[]`: si la respuesta es incorrecta y la tarjeta no es repetición, la agrega al final con `repeat: true`.
  - `describeSession(cards, stations) -> string`, por ejemplo «5 min · 3 repasos · 1 paso nuevo de SQL». Un minuto por tarjeta, las partes en cero se omiten y el singular va sin «s».
    - «paso nuevo» cuenta las tarjetas `new` y nombra la estación de la primera. Si las tarjetas nuevas son de dos o más estaciones, se agrega «y más».
    - «pregunta extra» cuenta las `extra` y sigue la misma regla.
  - `nextDue(state, today) -> ymd | null`: la fecha más cercana entre los ítems con caja 1 o más.
- **Algoritmo de `buildSession`:**
  1. `D` = ítems con `b ≥ 1` y `due ≤ today`, ordenados por `due` ascendente y luego por id.
  2. `N` = ítems nuevos (`b = 0`, o sin registro) en este orden: pasos de las estaciones de la meta (en el orden de la línea y de los pasos), extras de las estaciones de la meta y pasos y luego extras de las demás líneas, en orden de `lines`. Sin duplicados y sin estaciones desconocidas.
  3. Se toman hasta 3 de `D`; se completa hasta 5 con `N`; si `N` se acaba, se completa con el resto de `D`.
  4. Con `ahead`, si el resultado tiene menos de 5, se completa con ítems de `b ≥ 1` todavía no vencidos, del `due` más próximo al más lejano.
  5. `kind`: `review` si viene de `D` o de `ahead`; `new` si es un paso (n < 4); `extra` si es una pregunta extra.
  6. Sin meta, la meta es `lines[0]`.

- [ ] **Paso 1: escribir las pruebas que fallan**

```js
test('primera sesión: 5 pasos nuevos de la primera estación de la meta', () => {
  const c = buildSession(emptyState(), '2026-11-10', [L], S);
  assert.deepEqual(c.map(x => x.item), ['a.0', 'a.1', 'a.2', 'a.3', 'b.0']);
  assert.ok(c.every(x => x.kind === 'new'));
});
test('mezcla: hasta 3 repasos vencidos, del más atrasado al menos', () => {
  const st = stWith({ 'b.0': [1, '2026-11-09'], 'b.1': [1, '2026-11-01'], 'b.2': [1, '2026-11-10'], 'b.3': [1, '2026-11-05'], 'a.0': [2, '2026-11-20'] });
  const c = buildSession(st, '2026-11-10', [L], S);
  assert.deepEqual(c.slice(0, 3).map(x => x.item), ['b.1', 'b.3', 'b.0']);
  assert.deepEqual(c.slice(3).map(x => x.kind), ['new', 'new']);
});
test('sin pasos nuevos se completa con más repasos; luego extras', () => { /* … */ });
test('todo al día: [] y nextDue da la fecha más cercana', () => {
  const st = stWith(allItems({ b: 5, due: '2026-12-01' }));
  assert.deepEqual(buildSession(st, '2026-11-10', [L], S), []);
  assert.equal(nextDue(st, '2026-11-10'), '2026-12-01');
});
test('ahead adelanta repasos no vencidos; sin ítems vistos sigue en []', () => {
  const st = stWith(allItems({ b: 5, due: '2026-12-01' }));
  assert.equal(buildSession(st, '2026-11-10', [L], S, { ahead: true }).length, 5);
  assert.deepEqual(buildSession(stWith({}), '2026-11-10', [], S, { ahead: true }), []);
});
test('enqueueRepeat solo repite errores y una vez', () => {
  const c = { kind: 'new', item: 'a.0', station: 'a' };
  assert.equal(enqueueRepeat([c], c, true).length, 1);
  const q = enqueueRepeat([c], c, false);
  assert.deepEqual(q[1], { ...c, repeat: true });
  assert.equal(enqueueRepeat(q, q[1], false).length, 2);
});
test('describeSession', () => {
  assert.equal(describeSession([rev, rev, rev, newSql, newSql], REAL), '5 min · 3 repasos · 2 pasos nuevos de SQL');
  assert.equal(describeSession([newGit, newGit, newGit, newGit, newDatos], REAL), '5 min · 5 pasos nuevos de Git y más');
  assert.equal(describeSession([rev], REAL), '1 min · 1 repaso');
});
```

  `stWith`, `allItems` y las estaciones de prueba van como helpers al inicio del archivo. La prueba con `/* … */` se escribe completa con el mismo estilo: todos los pasos vistos, 2 repasos vencidos, 3 extras.
- [ ] **Paso 2:** correr `node --test tests/core.test.mjs`. Resultado esperado: FAIL, porque `buildSession` no está definida.
- [ ] **Paso 3:** implementar según el algoritmo de arriba.
- [ ] **Paso 4:** correr `node --test tests/*.test.mjs`. Resultado esperado: todas pasan.
- [ ] **Paso 5:** commit con el mensaje «Agrega armado de la sesión diaria».

---

### Tarea 4: XP, racha, combinación de estados y atajo

**Files:**
- Modify: `js/core.js`, `tests/core.test.mjs`

**Interfaces:**
- Produces:
  - `XP = { right: 10, wrong: 2, done: 20 }`.
  - `recordAnswer(state, itemId, correct, today, now, opts?: { repeat?: boolean }) -> state`: actualiza el ítem con `reviewItem` (salvo en repeticiones) y suma XP a `days[today]`. Las repeticiones también dan XP.
  - `finishSession(state, today) -> state`: suma 20 y marca `done: true`.
  - `setGoal(state, lineId, now) -> state`: fija `goal` y `goalT`.
  - `totalXp(state) -> number`.
  - `level(xp) -> number`.
  - `weekKey(ymd) -> ymd`: el lunes de esa semana.
  - `streak(state, today) -> { current, best, rest: ymd[] }`.
  - `mergeState(a, b) -> state`.
  - `applyShortcut(state, station, answers: [i, i], today, now) -> { state, passed }`.
  - `sessionSummary(before, after, goalLine, stations, today) -> { xp, streak, deltaPct, visited: id[], dueTomorrow }`, donde `deltaPct` son puntos enteros redondeados y `dueTomorrow` cuenta los ítems con `due ≤ mañana`.
- **Algoritmo de `streak`**, para una fecha final E (`current` usa E = hoy):
  1. Si E no está cumplido, se empieza el día anterior. Hoy pendiente no rompe la racha ni cuenta.
  2. Se recorre hacia atrás:
     - día cumplido: cuenta +1;
     - día faltante: si su semana no ha usado descanso, se marca como descanso y se sigue;
     - si la semana ya usó su descanso, se detiene.
  3. También se detiene antes del día más antiguo registrado.
  4. Al final se quitan los descansos que quedaron después del último día contado: un descanso solo cuenta si hay días cumplidos antes de él.
  5. `best` es el máximo de `current` calculado con cada día cumplido como fecha final.

- [ ] **Paso 1: escribir las pruebas que fallan**

```js
test('recordAnswer suma XP y mueve la caja; la repetición solo suma XP', () => {
  let s = recordAnswer(emptyState(), 'a.0', true, '2026-11-10', 1);
  assert.equal(s.items['a.0'].b, 1); assert.equal(s.days['2026-11-10'].xp, 10);
  s = recordAnswer(s, 'a.0', false, '2026-11-10', 2, { repeat: true });
  assert.equal(s.items['a.0'].b, 1); assert.equal(s.days['2026-11-10'].xp, 12);
});
test('finishSession marca el día y suma 20', () => {
  const s = finishSession(emptyState(), '2026-11-10');
  assert.deepEqual({ ...s.days['2026-11-10'] }, { xp: 20, done: true });
});
test('racha: hoy pendiente no la rompe', () => {
  assert.equal(streak(daysDone(['2026-11-08', '2026-11-09']), '2026-11-10').current, 2);
});
test('racha: un día faltante por semana se tolera, dos no', () => {
  // semana del lunes 2: cumplidos lun 2, mar 3, jue 5 y vie 6; falta mié 4 → 4
  assert.equal(streak(daysDone(['2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06']), '2026-11-06').current, 4);
  assert.equal(streak(daysDone(['2026-11-02', '2026-11-05', '2026-11-06']), '2026-11-06').current, 2);
});
test('racha: el descanso es por semana de lunes a domingo', () => {
  // dom 8 falta (semana del 2) y lun 9 falta (semana del 9): sigue
  assert.equal(streak(daysDone(['2026-11-06', '2026-11-07', '2026-11-10']), '2026-11-10').current, 3);
});
test('best toma la racha más larga del historial', () => { /* 5 días, hueco de 3, 2 días → best 5, current 2 */ });
test('mergeState: ítem más reciente, XP máximo, done si cualquiera, meta más reciente, desconocidos se conservan', () => {
  const a = { ...emptyState(), goal: 'x', goalT: 5, items: { 'a.0': { b: 1, due: 'd', t: 10 }, 'zzz.0': { b: 2, due: 'd', t: 1 } }, days: { '2026-11-10': { xp: 30, done: false } } };
  const b = { ...emptyState(), goal: 'y', goalT: 9, items: { 'a.0': { b: 3, due: 'e', t: 20 } }, days: { '2026-11-10': { xp: 12, done: true } } };
  const m = mergeState(a, b);
  assert.equal(m.items['a.0'].b, 3); assert.ok(m.items['zzz.0']);
  assert.deepEqual({ ...m.days['2026-11-10'] }, { xp: 30, done: true });
  assert.equal(m.goal, 'y');
});
test('atajo: dos aciertos llevan los 6 ítems a la caja 3 con repaso en 7 días', () => {
  const r = applyShortcut(emptyState(), A, [A.extra[0].ok, A.extra[1].ok], '2026-11-10', 1);
  assert.equal(r.passed, true);
  assert.ok(itemIds(A).every(id => r.state.items[id].b === 3 && r.state.items[id].due === '2026-11-17'));
});
test('atajo: un error estudia normal y cuenta esas dos respuestas', () => {
  const r = applyShortcut(emptyState(), A, [A.extra[0].ok, (A.extra[1].ok + 1) % 4], '2026-11-10', 1);
  assert.equal(r.passed, false);
  assert.equal(r.state.items['a.4'].b, 1); assert.equal(r.state.items['a.5'].b, 1); assert.equal(r.state.items['a.0'], undefined);
});
test('sessionSummary', () => { /* deltaPct, visitada nueva y dueTomorrow sobre un caso armado */ });
test('las funciones no mutan sus argumentos', () => {
  const s = emptyState(); const frozen = JSON.stringify(s);
  recordAnswer(s, 'a.0', true, '2026-11-10', 1); finishSession(s, '2026-11-10');
  assert.equal(JSON.stringify(s), frozen);
});
```

  Las pruebas marcadas con `/* … */` se escriben completas con los valores del comentario.
- [ ] **Paso 2:** correr `node --test tests/core.test.mjs`. Resultado esperado: FAIL, porque `recordAnswer` no está definida.
- [ ] **Paso 3:** implementar.
- [ ] **Paso 4:** correr `node --test tests/*.test.mjs`. Resultado esperado: todas pasan.
- [ ] **Paso 5:** commit con el mensaje «Agrega XP, racha, combinación de estados y atajo».

---

### Tarea 5: contenido, parte A (L1 a L4)

**Files:**
- Create: `js/data-estaciones.js`, `js/data-lineas.js`, `tests/content.test.mjs`
- Modify: `js/data-areas.js` (`GLOSS`) y `js/core.js` (geometría del mapa)

**Interfaces:**
- Produces:
  - `ESTACIONES` con la forma `Estacion` del spec. `res` lleva de 1 a 3 recursos.
  - `LINEAS` con la forma `Linea` del spec. `map` es `{ id: [x, y, lado?] }`, en un `viewBox` de 360 de ancho; `lado` es `'l'` o `'r'` (por defecto `'r'`) y dice dónde va la etiqueta.
  - En `core.js`:
    - `segmentOffsets(lines) -> { [lineId]: { [segKey]: px } }`: los tramos que comparten dos o más líneas, con la misma pareja de estaciones, se separan `(i - (n - 1) / 2) * 7` px, en el orden de `lines`. `segKey` es la pareja de ids ordenada y unida con `|`.
    - `lineasFor(topKeys) -> lineId[]`, en el lugar de `rutasFor`.
- Estaciones de esta tarea, 13 en total: `git`, `datos`, `sql`, `apis`, `pruebas-auto`, `hojas`, `tableros`, `indicadores`, `casos-prueba`, `defectos`, `linux`, `nube` y `monitoreo`.
- Líneas de esta tarea: L1 a L4, con los datos de la tabla del spec (puesto, empresa, lugar, nivel, áreas, URL de Indeed y `seen: '2026-11-10'`).
  - `asks`: de 3 a 5 frases, resumidas de la vacante.
  - `summary`: 2 frases.
  - `level`: `'Para empezar'`.
  - `note` (opcional): lo que conviene saber de la vacante, por ejemplo «temporal, 100% presencial».

- [ ] **Paso 1: escribir `tests/content.test.mjs`**, que corre sobre lo que exista en `ESTACIONES` y `LINEAS`:

```js
test('cada estación: plain, why, 4 pasos con idea y pregunta, 2 extra, tarea y de 1 a 3 recursos https', () => { … });
test('preguntas: 4 opciones, ok de 0 a 3, why de más de 20 caracteres', () => { … });
test('la longitud de las opciones no delata la respuesta correcta', () => {
  // sobre todas las preguntas: la correcta es la más larga en ≤ 40% y la más corta en ≤ 40%
});
test('la correcta no siempre va en la misma posición dentro de cada estación', () => {
  // en cada estación, las 6 preguntas usan al menos 3 posiciones distintas
});
test('líneas: ids únicos, n consecutivos desde 1, areas válidas, URL https, seen AAAA-MM-DD', () => { … });
test('cada estación de cada línea existe y tiene coordenadas dentro del lienzo (16 ≤ x ≤ 344, y ≥ 16)', () => { … });
test('una estación compartida tiene las mismas coordenadas en todas sus líneas', () => { … });
test('dos estaciones distintas quedan al menos a 28 px', () => { … });
test('términos técnicos en el glosario', () => {
  ['sql', 'api', 'git', 'linux', 'terminal', 'log', 'json'].forEach(k => assert.ok(GLOSS.some(g => g[1] === k), k));
});
```

  En `tests/core.test.mjs` se agregan:

```js
test('segmentOffsets separa tramos compartidos', () => {
  const o = segmentOffsets([{ id: 'p', stations: ['a', 'b', 'c'] }, { id: 'q', stations: ['x', 'a', 'b'] }]);
  assert.equal(o.p['a|b'], -3.5); assert.equal(o.q['a|b'], 3.5); assert.equal(o.p['b|c'], 0);
});
test('lineasFor', () => { assert.deepEqual([...lineasFor(['inf'])], ['satori-cloud-jr']); });
```

- [ ] **Paso 2:** correr `node --test tests/*.test.mjs`. Resultado esperado: FAIL, porque no existe `js/data-estaciones.js`.
- [ ] **Paso 3: escribir las 13 estaciones y las 4 líneas**
  - `plain`: una frase sin jerga.
  - `why`: aterrizado en lo que pide alguna vacante de esa estación.
  - **Pasos:** 4, de lo más básico a lo aplicado. Cada `idea` mide como máximo 280 caracteres y cada pregunta comprueba esa idea.
  - **Extra:** 2 preguntas de aplicación, que son las que usa el atajo.
  - **Tarea:** se hace en una tarde y es gratis.
  - **Recursos:** documentación oficial o guías reconocidas. Cada URL se verifica con WebSearch antes de escribirla.
  - **Preguntas:** miden comprensión, con distractores plausibles. `why` explica la correcta y el distractor más tentador.
  - **Glosario:** se agregan a `GLOSS` los términos nuevos.
  - **Coordenadas:** se colocan pensando también en las líneas de la Tarea 6, que reutilizan `sql`, `git`, `hojas`, `linux` y `monitoreo`.
- [ ] **Paso 4:** correr `node --test tests/*.test.mjs`. Resultado esperado: todas pasan.
- [ ] **Paso 5:** commit con el mensaje «Agrega estaciones y líneas L1 a L4».

---

### Tarea 6: contenido, parte B (L5 a L7)

**Files:**
- Modify: `js/data-estaciones.js`, `js/data-lineas.js`, `js/data-areas.js` (`GLOSS`) y `tests/content.test.mjs`

**Interfaces:**
- Consumes: las formas y pruebas de la Tarea 5.
- Produces:
  - 7 estaciones nuevas: `redes`, `amenazas`, `incidentes`, `python`, `estadistica`, `ml` y `llm`.
  - 7 adaptadas desde `RUTAS['getnet-ai-deploy'].topics`: `agentes`, `multiagente`, `evaluacion`, `guardrails`, `rag`, `mcp` y `observabilidad`.
  - Las líneas L5, L6 y L7.

- [ ] **Paso 1:** agregar a `tests/content.test.mjs` las pruebas que fallan:

```js
test('hay 27 estaciones y 7 líneas, en orden L1 a L7', () => {
  assert.equal(Object.keys(ESTACIONES).length, 27);
  assert.deepEqual(LINEAS.map(l => l.id), ['edar-dev-jr','sears-datos-jr','mvs-tester-jr','satori-cloud-jr','safe-soc','banorte-ds-jr','getnet-ai-deploy']);
});
test('las 21 preguntas de Getnet se conservan', () => {
  // cada diag.q y review[*].q de RUTAS['getnet-ai-deploy'] aparece, con sus mismas opts y ok, en alguna pregunta de la estación del mismo id
});
test('L5 a L7 declaran la experiencia que piden', () => {
  for (const id of ['safe-soc', 'banorte-ds-jr', 'getnet-ai-deploy']) assert.match(LINEAS.find(l => l.id === id).note, /año/);
});
```

- [ ] **Paso 2:** correr `node --test tests/*.test.mjs`. Resultado esperado: FAIL, con 13 estaciones en lugar de 27.
- [ ] **Paso 3: escribir el contenido**, con las mismas reglas de la Tarea 5.
  - **Adaptación de Getnet:**
    - sus `ideas` pasan a ser los 4 pasos; si solo tiene 3, se escribe un cuarto;
    - la pregunta del diagnóstico pasa a ser la pregunta del paso que le corresponde;
    - los dos repasos pasan a ser `extra`;
    - se escriben las 3 preguntas que faltan;
    - `task` y `res` se conservan.
  - **Las notas de experiencia** dicen cuánta experiencia pide cada vacante (2 años; de 2 a 4 años; «construir algo real con IA»).
- [ ] **Paso 4:** correr `node --test tests/*.test.mjs`. Resultado esperado: todas pasan.
- [ ] **Paso 5:** commit con el mensaje «Agrega estaciones y líneas L5 a L7».

---

### Tarea 7: guardado en el dispositivo

**Files:**
- Create: `js/store.js` y `tests/store.test.mjs`

**Interfaces:**
- Consumes: `emptyState`, `validState` y `mergeState`.
- Produces:
  - `STORE_KEY = 'mapa.v2'`.
  - `safeStorage() -> Storage | null`: prueba `setItem` y `removeItem` dentro de un try.
  - `loadLocal(storage) -> { state, warning: null | 'sin-almacenamiento' | 'estado-invalido' }`.
  - `saveLocal(storage, state) -> { state, ok }`: lee lo guardado y, si es válido, guarda `mergeState(state, guardado)` y lo devuelve. Si el estado guardado no es válido, lo sobrescribe.
  - `clearLocal(storage)`.

- [ ] **Paso 1: escribir las pruebas que fallan**, con un `Storage` falso hecho a partir de un `Map`:

```js
test('sin storage: estado vacío y aviso', () => { assert.equal(loadLocal(null).warning, 'sin-almacenamiento'); });
test('estado guardado inválido: vacío y aviso, sin borrarlo hasta guardar', () => {
  const st = fake({ 'mapa.v2': '{"v":3}' });
  assert.equal(loadLocal(st).warning, 'estado-invalido'); assert.equal(st.getItem('mapa.v2'), '{"v":3}');
});
test('JSON roto se trata como inválido', () => { … });
test('guardar y cargar ida y vuelta', () => { … });
test('dos pestañas: guardar combina con lo que otra pestaña guardó después', () => {
  const st = fake({});
  const viejo = recordAnswer(emptyState(), 'a.0', true, '2026-11-10', 1);
  saveLocal(st, recordAnswer(emptyState(), 'a.1', true, '2026-11-10', 2)); // la otra pestaña
  const r = saveLocal(st, viejo);
  assert.ok(r.state.items['a.0'] && r.state.items['a.1']);
});
test('si setItem lanza (cuota llena), ok es false y no lanza', () => { … });
```

- [ ] **Paso 2:** correr `node --test tests/store.test.mjs`. Resultado esperado: FAIL, porque no existe `js/store.js`.
- [ ] **Paso 3:** implementar. `store.js` requiere `core.js` en Node y lo lee del global en el navegador.
- [ ] **Paso 4:** correr `node --test tests/*.test.mjs`. Resultado esperado: todas pasan.
- [ ] **Paso 5:** commit con el mensaje «Agrega guardado local del progreso».

---

### Tarea 8: tabla `mapa_progreso` y sincronización

**Files:**
- Create: `sql/mapa_progreso.sql`
- Modify: `js/store.js`, `tests/store.test.mjs` y `tests/fake-supabase.js` (soporte de `upsert`)

**Interfaces:**
- Produces:
  - `syncRemote(sb, userId, state) -> Promise<{ state, error: null | string }>`:
    - lee `select('state').eq('user_id', userId)`;
    - si la fila existe y su estado no es válido, devuelve `{ state, error: 'estado-remoto-invalido' }` sin escribir nada;
    - en otro caso combina con `mergeState(state, remoto)`, hace `upsert({ user_id, state: combinado }, { onConflict: 'user_id' })` y devuelve el estado combinado;
    - si cualquier llamada falla, devuelve `{ state, error: mensaje }` sin lanzar.
  - `deleteRemote(sb, userId) -> Promise<void>`.
  - Tabla `public.mapa_progreso`: `user_id uuid primary key default auth.uid() references auth.users on delete cascade`, `email text not null default lower(auth.jwt() ->> 'email')`, `state jsonb not null` con check `jsonb_typeof(state) = 'object' and pg_column_size(state) < 200000`, y `updated_at timestamptz not null default now()`.
  - Un trigger `before update` pone `updated_at = now()`. Su función es `public.mapa_progreso_touch()` con `set search_path = ''`.
  - **Políticas `to authenticated`**, copiando las expresiones de `mapa_respuestas`:
    - «ver propio o docente»;
    - «insertar propio», con `user_id = (select auth.uid())` y el correo del JWT;
    - «actualizar propio»: `using (user_id = (select auth.uid()))` y `with check` igual que «insertar propio»;
    - «borrar propio».

- [ ] **Paso 1: escribir las pruebas que fallan**, con un `sb` falso mínimo dentro de la prueba (`from().select().eq()` y `upsert()`, que regresan promesas y guardan las llamadas):

```js
test('sin fila remota: sube el estado local', async () => { … assert.equal(calls.upsert.length, 1); });
test('con fila remota: combina y sube la combinación', async () => { … });
test('fila remota de otra versión: no escribe y avisa', async () => {
  const r = await syncRemote(sbCon({ v: 3 }), 'u1', local);
  assert.equal(r.error, 'estado-remoto-invalido'); assert.equal(calls.upsert.length, 0); assert.equal(r.state, local);
});
test('falla de red: devuelve el estado local y el error, sin lanzar', async () => { … });
```

- [ ] **Paso 2:** correr `node --test tests/store.test.mjs`. Resultado esperado: FAIL, porque `syncRemote` no está definida.
- [ ] **Paso 3:** implementar `syncRemote` y `deleteRemote`. Agregar a `tests/fake-supabase.js`:
  - `upsert(obj, { onConflict })`, que reemplaza la fila con la misma llave;
  - `update()`;
  - el estado inicial de la sesión: desconectado, salvo que exista `__seed.session`;
  - `window.__fakeLogin()`, que fija la sesión y llama a los listeners de `onAuthStateChange` con `'SIGNED_IN'`;
  - `__failSync`, que hace fallar el `select` de `mapa_progreso`.
- [ ] **Paso 4:** correr `node --test tests/*.test.mjs`. Resultado esperado: todas pasan.
- [ ] **Paso 5:** escribir `sql/mapa_progreso.sql` y aplicarlo con `apply_migration` (nombre `mapa_progreso`). Antes, `to_regclass('public.mapa_progreso')` debe dar nulo.
- [ ] **Paso 6:** verificar RLS con una transacción que termina en `rollback`, usando `set local role authenticated` y los claims de un usuario existente:
  - insertar lo propio funciona;
  - actualizar lo propio funciona y cambia `updated_at`;
  - insertar con otro correo da 42501;
  - un `state` que no es objeto da 23514.
  - Al final no quedan filas.
- [ ] **Paso 7:** `get_advisors security`: no debe haber avisos nuevos que mencionen `mapa_progreso` ni `mapa_progreso_touch`.
- [ ] **Paso 8:** commit con el mensaje «Agrega tabla mapa_progreso y sincronización».

---

### Tarea 9: estructura nueva, Elegir meta, Hoy y Yo

**Files:**
- Create: `js/pantallas-estudio.js` y `js/pantallas-cuenta.js`
- Modify: `index.html`, `css/app.css`, `js/ui.js`, `js/app.js`, `js/pantallas-cuestionario.js`, `tests/e2e.cjs` y `tests/fake-supabase.js`

**Interfaces:**
- Consumes: `core.js`, `store.js`, `ESTACIONES` y `LINEAS`.
- Produces:
  - **Globales en `app.js`:** `state`, `storage`, `session`, `isAdmin` y `commit(nuevo)`, que guarda con `saveLocal` y actualiza `state` con lo que devuelve. También `syncNow() -> Promise`, que llama a `syncRemote` si hay sesión y, si hay error, muestra `showNotice('No se pudo sincronizar. Tu progreso sigue en este dispositivo.')`.
  - **Secciones** `s-pick`, `s-hoy` y `s-yo`.
  - **Barra inferior** `#tabbar`, con botones `data-tab` de valor `hoy`, `mapa` y `yo`. Se oculta en `s-sesion`, `s-quiz` y `s-pick`.
  - **Funciones:** `renderPick()`, `renderHoy()`, `renderYo()` y `startSession(opts?)`. `startSession` queda como stub hasta la Tarea 10. `renderMapa` y `openLinea` quedan como stubs hasta la Tarea 11.
  - **Arranque:**
    1. Se carga `state` con `loadLocal`. Si hay aviso, se muestra.
    2. Si `state.goal` no existe en `LINEAS`, se abre `s-pick`; si existe, `s-hoy`.
    3. Al ocurrir `SIGNED_IN`, se llama a `syncNow()` y se vuelve a dibujar la pantalla actual.
  - **Cuestionario:**
    - `s-intro` pierde `#login` y `#home`.
    - Se queda con el título, la descripción, el selector de versión y «Hacer el cuestionario».
    - Se llega a él desde Yo.

- [ ] **Paso 1: reescribir `tests/e2e.cjs` con escenarios nuevos que fallan**
  - Las pruebas de rutas y diagnóstico se retiran: esas pantallas dejan de ser alcanzables (ver Rulings).
  - Se conservan los helpers `setupRoutes`, `noHScroll` y `openHome`, con `localStorage` limpio por contexto.
  - Escenarios:

```js
step = 'primera visita sin cuenta: elegir meta';
await page.goto(INDEX_URL);
await page.waitForSelector('#s-pick:not([hidden])');
assert.equal(await page.locator('#s-pick .line-card').count(), 7);
assert.match(await page.locator('#s-pick .line-card').first().textContent(), /Para empezar/);
await page.locator('#s-pick .line-card', { hasText: 'Desarrollador de Software Jr.' }).click();
await page.waitForSelector('#s-hoy:not([hidden])');
assert.match(await page.textContent('#s-hoy'), /0%/);
assert.match(await page.textContent('#s-hoy .session-cta'), /5 min · 5 pasos nuevos de Git y más/);
assert.equal(await page.isVisible('#tabbar'), true);

step = 'la meta sobrevive a la recarga';
await page.reload(); await page.waitForSelector('#s-hoy:not([hidden])');

step = 'Yo: cuenta opcional, cambiar meta, cuestionario';
await page.click('#tabbar [data-tab=yo]');
assert.match(await page.textContent('#s-yo'), /Guarda tu progreso en la nube/);
assert.match(await page.textContent('#s-yo'), /Sin cuenta, nada sale de tu dispositivo/);
await page.click('#s-yo button:has-text("Descubre tu área")');
await page.waitForSelector('#s-intro:not([hidden])');

step = 'iniciar sesión sincroniza';
// en una página nueva: __seed sin sesión; clic «Guarda tu progreso…», escribir correo, enviar → «Revisa tu correo»;
// luego page.evaluate(() => __fakeLogin()) → espera a que __db.mapa_progreso tenga 1 fila con state.goal === 'edar-dev-jr'

step = 'falla de sincronización';
// con sesión y __failSync: terminar una acción que sincroniza → aparece «No se pudo sincronizar. Tu progreso sigue en este dispositivo.» y el estado local está guardado

step = 'estás al día';
// sembrar en localStorage un estado con todos los ítems de L1 en caja 5 y due futuro → Hoy dice «Estás al día» y «Próximo repaso:»
```

- [ ] **Paso 2:** correr `node tests/e2e.cjs`. Resultado esperado: FAIL, porque no existe `#s-pick`.
- [ ] **Paso 3: implementar las pantallas según el spec y las maquetas aprobadas**
  - **Elegir meta:** tarjetas `.line-card`; primero las de «Para empezar» y luego las demás, en orden de `n`.
  - **Hoy:**
    - semana de lunes a domingo, con los días cumplidos y los de descanso;
    - racha;
    - tarjeta de la meta con el «% listo», «te faltan N estaciones» y la línea en miniatura con la estación actual;
    - `.session-cta` con `describeSession`;
    - otras líneas con avance mayor que cero;
    - sin pendientes: «Estás al día · Próximo repaso: {fmtDay}» y el botón «Otra sesión».
  - **Yo:**
    - nivel, XP total y racha más larga;
    - «Cambiar de meta»;
    - la tarjeta de cuenta, con el formulario de correo y `signInWithOtp` del código actual; con sesión, el correo y «Cerrar sesión»;
    - el aviso de privacidad del spec;
    - «Descubre tu área» y, con sesión, «Mis respuestas»;
    - «Borrar mis datos», con confirmación en dos clics: `clearLocal`, `deleteRemote` si hay sesión, y luego `s-pick`;
    - «Vista docente», si `isAdmin`.
  - **CSS:** tokens nuevos del spec (papel cálido, `--l1` a `--l7` en claro y oscuro, resaltador), con el lenguaje visual de las maquetas.
  - **Colores de línea en claro:** `--l1 #1B8F5A`, `--l2 #E0722B`, `--l3 #7A4CC2`, `--l4 #0F8FA8`, `--l5 #C2323C`, `--l6 #C2327E`, `--l7 #1F4FD8`. En oscuro se aclaran hasta tener un contraste de al menos 3:1 sobre el papel oscuro.
  - **Distinción sin color:** cada línea se muestra siempre con su número (`L1` a `L7`) en un `.lbadge`.
- [ ] **Paso 4:** correr `node tests/e2e.cjs && node --test tests/*.test.mjs`. Resultado esperado: todo pasa.
- [ ] **Paso 5:** commit con el mensaje «Agrega estructura del hub: elegir meta, Hoy y Yo».

---

### Tarea 10: sesión de estudio

**Files:**
- Modify: `js/pantallas-estudio.js`, `css/app.css` y `tests/e2e.cjs`

**Interfaces:**
- Consumes: `buildSession`, `enqueueRepeat`, `recordAnswer`, `finishSession`, `sessionSummary`, `getQuestion`, `commit` y `syncNow`.
- Produces: `startSession(opts?: { ahead })`, que abre `s-sesion`. Al responder se llama a `commit()` de inmediato, así que salir a media sesión conserva lo respondido. Al cerrar se llama a `finishSession`, `commit` y `syncNow`.
- **Tarjetas:**
  - Un paso nuevo muestra primero una tarjeta de idea («Nuevo · SQL», la idea y «Entendido») y después su pregunta.
  - La pregunta lleva la etiqueta, el texto, las 4 opciones (`button.opt`, teclas 1 a 4) y, al responder:
    - se marca la correcta y, si la tuya fue otra, también la tuya;
    - aparece `.fb` con `aria-live="polite"`: «Correcto» o «Casi», `+N XP`, el `why` y una línea de cuándo vuelve: «Vuelve a salir en N días», «Vuelve mañana y una vez más al final de esta sesión» o, en una repetición, «Vuelve mañana»;
    - aparece el botón «Siguiente», al que Enter también activa.
- **Teclado:** con la respuesta ya dada, las teclas 1 a 4 no hacen nada.
- **Cierre (`.session-end`):** «+N XP», la racha, «% listo +N», la estación visitada si la hubo, «Mañana tienes N repasos», y los botones «Listo» y «Otra sesión».
- **Fecha:** se calcula con `todayYmd()` en cada respuesta y al cerrar.

- [ ] **Paso 1: agregar los escenarios que fallan**

```js
step = 'sesión completa con teclado';
const oks = await page.evaluate(() => ['git.0','git.1','git.2','git.3'].map(id => getQuestion(ESTACIONES, id).ok));
await page.click('#s-hoy .session-cta');
// por cada paso: Enter en la idea, tecla de la correcta, comprobar «Correcto» y «+10 XP», Enter
// 5.ª tarjeta (datos.0): responder mal → «Casi» y «al final de esta sesión»
// tarjeta 6 = repetición de datos.0 → responder bien → «Vuelve mañana»
await page.waitForSelector('.session-end');
assert.match(await page.textContent('.session-end'), /\+72 XP/); // 4×10 + 2 + 10 + 20
assert.match(await page.textContent('.session-end'), /Racha · 1 día/);

step = 'las teclas no cambian una respuesta dada';
// en una tarjeta ya respondida, presionar otra tecla → la opción marcada sigue igual y el XP del día no cambia

step = 'salir a media sesión conserva lo respondido';
// iniciar «Otra sesión», responder 1, ✕ Salir → Hoy; recargar; el ítem respondido sigue en localStorage

step = 'al día siguiente hay repasos y la racha sube';
await page.clock.setFixedTime(new Date('2026-11-11T10:00:00'));
await page.reload();
assert.match(await page.textContent('#s-hoy .session-cta'), /repaso/);
// completar la sesión → «Racha · 2 días»

step = 'medianoche a media sesión';
// página nueva con page.clock en 2026-11-12T23:58; responder 2 tarjetas; clock.setFixedTime('2026-11-13T00:01'); terminar
// → state.days['2026-11-12'].xp === 20 y state.days['2026-11-13'].done === true
```

  Antes de abrir la página, `page.clock.setFixedTime(new Date('2026-11-10T10:00:00'))` fija la fecha de inicio de todos los escenarios.
- [ ] **Paso 2:** correr `node tests/e2e.cjs`. Resultado esperado: FAIL en «sesión completa con teclado».
- [ ] **Paso 3:** implementar según la maqueta 2.
- [ ] **Paso 4:** correr `node tests/e2e.cjs && node --test tests/*.test.mjs`. Resultado esperado: todo pasa.
- [ ] **Paso 5:** commit con el mensaje «Agrega la sesión de estudio con repetición espaciada».

---

### Tarea 11: Mapa, Línea y Estación

**Files:**
- Create: `js/pantallas-mapa.js`
- Modify: `css/app.css` y `tests/e2e.cjs`

**Interfaces:**
- Consumes: `LINEAS`, `ESTACIONES`, `segmentOffsets`, `lineProgress`, `stationProgress`, `isVisited`, `currentStation`, `applyShortcut` y `setGoal`.
- Produces: `renderMapa()`, `openLinea(id)` y `openEstacion(id)`.
- **Mapa:**
  - Un SVG con `viewBox="0 0 360 H"`, donde H es la mayor y de las líneas más 40.
  - Cada línea es una polilínea por sus estaciones, desplazada en los tramos compartidos según `segmentOffsets`, con trazo de 7 px y su color.
  - Estaciones:
    - normal, un círculo de 7 de radio;
    - visitada, rellena;
    - actual de la meta, con halo resaltado;
    - compartida, un círculo blanco con aro de tinta de 3 px y radio 9.
  - Etiquetas al lado indicado por `lado`.
  - Cada estación es un `<a>` dentro del SVG, con `role="link"` y `aria-label` «SQL, 3 líneas, 40%», que abre `openEstacion`.
  - Debajo, la lista `.line-list`: número, puesto, empresa y %. Cada fila abre `openLinea`.
- **Línea:** ficha (lo que pide, nivel, nota, enlace con `extLink`, «leída el…»), estaciones en orden con su avance y el botón «Elegir como meta», o «Es tu meta».
- **Estación:**
  - qué es y para qué sirve;
  - pasos: el texto de la idea si el ítem del paso tiene caja 1 o más; si no, «Por descubrir»;
  - ejercicio, recursos y glosario (`glossFor`);
  - avance y las líneas que pasan por ella;
  - si no se ha empezado (los 6 ítems en caja 0), la tarjeta «¿Ya sabes esto?» con las 2 preguntas extra. Al responder ambas se aplica `applyShortcut`, luego `commit` y `syncNow`, y aparece el resultado: «Listo: la estación queda vista y la repasas en 7 días» o «Vamos paso a paso: la estación entra en tus sesiones».

- [ ] **Paso 1: agregar los escenarios que fallan**

```js
step = 'mapa: 7 líneas, 27 estaciones';
await page.click('#tabbar [data-tab=mapa]');
assert.equal(await page.locator('#s-mapa svg [data-station]').count(), 27);
assert.equal(await page.locator('#s-mapa .line-list [data-line]').count(), 7);

step = 'estación compartida cuenta en todas sus líneas';
await page.click('#s-mapa [data-station=sql]');
assert.match(await page.textContent('#s-estacion'), /L1.*L2.*L4.*L6/s);
// atajo con las 2 correctas → «Listo: la estación queda vista»
// Mapa → la lista muestra L2 > 0% y L4 > 0%

step = 'atajo con un error';
// otra estación sin empezar: una correcta y una incorrecta → «Vamos paso a paso»; sus ítems .4 y .5 en caja 1

step = 'línea: elegir como meta';
await page.click('#s-mapa .line-list [data-line=safe-soc]');
await page.click('#s-linea button:has-text("Elegir como meta")');
await page.click('#tabbar [data-tab=hoy]');
assert.match(await page.textContent('#s-hoy'), /Analista SOC/);
```

- [ ] **Paso 2:** correr `node tests/e2e.cjs`. Resultado esperado: FAIL en «mapa: 7 líneas».
- [ ] **Paso 3:** implementar según la maqueta 3 y revisar con una captura a 390 px que ninguna etiqueta se encime. Si se enciman, se ajustan las coordenadas en `data-lineas.js` y `content.test.mjs` debe seguir pasando.
- [ ] **Paso 4:** correr `node tests/e2e.cjs && node --test tests/*.test.mjs`. Resultado esperado: todo pasa.
- [ ] **Paso 5:** commit con el mensaje «Agrega Mapa, Línea y Estación con atajo».

---

### Tarea 12: cuestionario sin cuenta y retiro de las rutas viejas

**Files:**
- Modify: `js/pantallas-cuestionario.js`, `js/data-areas.js`, `index.html` y `tests/e2e.cjs`
- Delete: `tests/rutas.test.mjs`

**Interfaces:**
- Consumes: `lineasFor` y `setGoal`.
- Produces:
  - Se retiran `RUTAS`, `NO_SE`, `scoreDiag`, `scoreReview`, `topicStatus` y `rutasFor`.
  - También `mode`, `diagRuta`, `s-learn` y todas las funciones de ruta, diagnóstico y lección: `openLearn`, `openRuta`, `drawRuta`, `startDiag`, `renderDiagResult`, `renderTopic`, `drawReview`, `loadRutaRows`, `saveRutaRow`, `deleteRutaRows`, `lastSave`, `STATE_LABEL` y `evidenceText`.
  - `saveNoteFor` se queda si alguien lo usa; si no, se borra.

- [ ] **Paso 1: agregar los escenarios que fallan**

```js
step = 'cuestionario sin cuenta';
// Yo → Descubre tu área → Hacer el cuestionario → 10× answer('1') → resultado
assert.match(await page.textContent('#s-result'), /No se guardó: no tienes cuenta/);
assert.ok(await page.locator('#s-result .vacancy [data-line]').count() >= 2); // ml, bak → L1, L3, L6, L7…
await page.locator('#s-result .vacancy [data-line=banorte-ds-jr] button').click(); // «Elegir como meta»
await page.waitForSelector('#s-hoy:not([hidden])');
assert.match(await page.textContent('#s-hoy'), /Científico de Datos Jr\./);

step = 'cuestionario con cuenta guarda el intento';
// tras __fakeLogin → cuestionario → «Guardado.» y __db.mapa_respuestas.length === 1
```

- [ ] **Paso 2:** correr `node tests/e2e.cjs`. Resultado esperado: FAIL en «No se guardó».
- [ ] **Paso 3: implementar**
  - `saveAttempt` solo se llama con sesión. Sin sesión, la nota dice: «No se guardó: no tienes cuenta. Puedes crear una en Yo.»
  - El panel `.vacancy` lista las líneas de `lineasFor(top3)` con su número, puesto, empresa y nivel, y el botón «Elegir como meta».
  - Al terminar, se borra el código listado en Interfaces y `tests/rutas.test.mjs`.
  - `grep -n "RUTAS\|s-learn\|mapa_aprendizaje\|rutasFor" js/ index.html tests/` no debe encontrar nada fuera de `sql/` ni de `docs/`.
- [ ] **Paso 4:** correr `node tests/e2e.cjs && node --test tests/*.test.mjs`. Resultado esperado: todo pasa.
- [ ] **Paso 5:** commit con el mensaje «Cuestionario sin cuenta enlazado a las líneas; retira las rutas viejas».

---

### Tarea 13: vista docente del progreso

**Files:**
- Modify: `js/pantallas-cuenta.js`, `js/pantallas-cuestionario.js` (`renderAdmin` se mueve a `pantallas-cuenta.js`) y `tests/e2e.cjs`

**Interfaces:**
- Consumes: `mapa_progreso` (`select('email,state,updated_at')`), `lineProgress`, `streak` y `totalXp`.
- Produces: `renderAdmin()`, con dos secciones y el filtro por correo que ya existe:
  1. «Progreso de estudio»: una tabla con correo, meta (`L#` y puesto), % listo, racha, XP y último día, ordenada por el último día, del más reciente al más antiguo.
  2. «Intentos del cuestionario»: la lista actual.
- Una fila con estado inválido muestra «estado no válido» en la meta y guiones en lo demás. La sección «Rutas por vacante» desaparece.

- [ ] **Paso 1: agregar el escenario que falla**

```js
step = 'vista docente';
// página nueva con __seed: session y __fakeAdmin; mapa_progreso con 2 filas: otra@test.mx (meta safe-soc, 3 días cumplidos)
// y rara@test.mx con state {v:9}
// Yo → Vista docente → la tabla tiene «otra@test.mx», «L5», «3» y «estado no válido»; filtrar «otra» → 1 fila
```

- [ ] **Paso 2:** correr `node tests/e2e.cjs`. Resultado esperado: FAIL.
- [ ] **Paso 3:** implementar. La tabla va dentro de `.tablewrap` con `overflow-x: auto`.
- [ ] **Paso 4:** correr `node tests/e2e.cjs && node --test tests/*.test.mjs`. Resultado esperado: todo pasa.
- [ ] **Paso 5:** commit con el mensaje «Agrega progreso de estudio a la vista docente».

---

### Tarea 14: revisión visual, README y entrega

**Files:**
- Modify: `tests/e2e.cjs` y `README.md`

- [ ] **Paso 1:** el recorrido visual (`visualPass`) cubre Elegir meta, Hoy, Sesión (pregunta respondida), Cierre, Mapa, Línea, Estación y Yo, a 390 × 844 y 1280 × 900, en tema claro y oscuro. En cada pantalla verifica `noHScroll` y, con `SHOTS_DIR`, guarda una captura.
- [ ] **Paso 2:** correr `SHOTS_DIR=<scratchpad>/shots node tests/e2e.cjs`. Resultado esperado: pasa. Después se revisan las capturas a mano y se corrige lo que se vea mal: etiquetas del mapa encimadas, contraste, espaciado.
- [ ] **Paso 3: reescribir el README**
  - qué es el hub;
  - líneas y estaciones, y cómo agregar una línea o una estación;
  - reglas de aprendizaje (cajas, sesión, racha);
  - datos: `mapa_progreso` y sus políticas, `mapa_respuestas` y `mapa_aprendizaje` (en desuso);
  - pruebas;
  - despliegue: Vercel despliega solo al hacer merge a `main`.
- [ ] **Paso 4:** `node --test tests/*.test.mjs && node tests/e2e.cjs`. Resultado esperado: todo pasa.
- [ ] **Paso 5:** commit con el mensaje «Documenta el hub y agrega revisión visual», y push.

---

## Rulings del plan (decisiones sobre el spec)

- **`goalT`** se agrega al estado. El spec pide que, al combinar, gane «la meta del estado con el cambio más reciente», y sin esa marca de tiempo no hay forma de saberlo.
- **`js/app.js`** se agrega a la tabla de archivos: el arranque y la sesión de Supabase no encajan en ningún otro archivo.
- **Las pruebas de rutas y diagnóstico se retiran en la Tarea 9**, no en la 12, porque en la 9 esas pantallas dejan de ser alcanzables. El código se borra en la 12.
- **Regla 3 de la sesión:** «si no hay repasos pendientes, con pasos nuevos, hasta 3» se interpreta como completar hasta 5 tarjetas. Lo que manda es el tope de 5 que fija el spec.
- **Distinción sin color:** el spec pide que las líneas se distingan «por su número y por el patrón de su punto». El número `L1` a `L7` va siempre junto al color. El patrón del punto no se implementa, porque con el número ya se distinguen sin depender del color.
- **Nivel:** `1 + floor(xp / 200)`. El spec menciona el nivel pero no su fórmula.
