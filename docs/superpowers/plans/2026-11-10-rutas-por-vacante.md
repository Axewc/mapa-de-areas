# Rutas por vacante: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** agregar al Mapa de áreas una ruta de aprendizaje por vacante real. La primera es AI Deployment Engineer de Getnet. Incluye diagnóstico, lecciones por tema, repasos guardados en Supabase y una sección en la vista docente.

**Architecture:**
- Todo vive en `index.html`. Datos y funciones puras van en `//DATA-START … //DATA-END`, y la interfaz en el script existente, con `el()` y `show()`.
- El diagnóstico reutiliza el motor del cuestionario (`s-quiz`) mediante una variable `mode`.
- El progreso es una tabla de solo inserción, `mapa_aprendizaje`, con las mismas reglas de RLS que `mapa_respuestas`.

**Tech Stack:**
- HTML, CSS y JS sin build.
- supabase-js 2.45.4 (UMD).
- Pruebas de lógica con `node --test` (Node 22).
- Prueba de flujo con Playwright, ya instalado: `require('playwright')`.
- Supabase MCP para la migración.

**Spec:** `docs/superpowers/specs/2026-11-10-rutas-por-vacante-design.md`

## Global Constraints

- Un solo `index.html`, sin build ni dependencias nuevas en el navegador.
- Todo el texto de la interfaz va en español de México, de tú, sin jerga. Cada término técnico que aparezca en una lección debe estar en `GLOSS`.
- Los estados se muestran como *Sin evaluar* (`nuevo`), *Por aprender* (`pendiente`) y *Ya lo dominas* (`dominado`).
- Diagnóstico: una pregunta por tema, con 4 opciones más «Aún no lo sé», que corresponde al índice `opts.length` y cuenta 0. Nota visible: «7 preguntas · 4 minutos · sí hay respuestas correctas».
- Repaso: 2 preguntas por tema. Con 2 de 2 el tema queda dominado.
- Para cada tema, gana la evidencia más reciente por `created_at`.
- Ruta `getnet-ai-deploy`:
  - areas `["ml", "bak", "inf"]`
  - url `https://job-boards.eu.greenhouse.io/getnet/jobs/5019637101`
  - seen `2026-11-10`
  - lugar «Ciudad de México · híbrido»
- Ids de los temas, en este orden: `agentes`, `multiagente`, `evaluacion`, `guardrails`, `rag`, `mcp`, `observabilidad`.
- Proyecto Supabase `vhdrnrzerjysjzpyzgif` (fbd-lab-tracker). No hay política de `update`.
- Ancho mínimo de 390 px sin scroll horizontal. Los enlaces externos llevan `target="_blank" rel="noopener"`.

## Review Focus

1. **Arrastre de `mode`:** después de un diagnóstico, al hacer el cuestionario del mapa debe aparecer el resultado de áreas, no el del diagnóstico. → prueba de flujo, Tarea 5.
2. **Falla al guardar** (sesión vencida o RLS): el resultado del diagnóstico o del repaso se muestra igual, con el aviso «No se pudo guardar…». → prueba de flujo con `__failInsert`, Tareas 5 y 6.
3. **Filas con temas que ya no existen o con `scores` incompleto:** se ignoran sin romper la ruta. → prueba de lógica, Tarea 1.
4. **Teclado:**
   - En el diagnóstico, la tecla 5 elige «Aún no lo sé».
   - En la pantalla de un tema, las teclas 1 a 5 no hacen nada.

   → prueba de flujo, Tareas 5 y 6.
5. **Teléfono (390 px):** el título, la URL de la vacante y los recursos no provocan scroll horizontal. → prueba de flujo, Tarea 8.

---

## Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Datos de la ruta y funciones puras (bloque DATA); pantallas, estilos y acceso a Supabase |
| `tests/logic.test.mjs` | Pruebas de las funciones puras y de la integridad del contenido; extraen el bloque DATA |
| `tests/fake-supabase.js` | Cliente supabase-js falso en memoria para la prueba de flujo |
| `tests/e2e.cjs` | Prueba de flujo con Playwright sobre `file://…/index.html` |
| `sql/mapa_aprendizaje.sql` | Copia de la migración aplicada, como registro |
| `README.md` | Documentación de la tabla y de cómo agregar una vacante |

---

### Tarea 1: lógica pura de rutas

**Files:**
- Modify: `index.html`, dentro del bloque `//DATA-START … //DATA-END` (líneas 236 a 642), después de `scoreAnswers`.
- Create: `tests/logic.test.mjs`

**Interfaces:**
- Produces:
  - `RUTAS`: objeto `{ [rutaId]: Ruta }` con la forma de la sección «Datos de la ruta» del spec. En esta tarea `topics: []`, y la Tarea 2 los llena.
  - `NO_SE = 'Aún no lo sé'`
  - `scoreDiag(ruta, answers: number[]) -> { [topicId]: 0|1 }`
  - `scoreReview(topic, answers: number[]) -> { [topicId]: 0|1|2 }`
  - `topicStatus(ruta, rows) -> { [topicId]: { state: 'nuevo'|'pendiente'|'dominado', kind: null|'diagnostico'|'repaso', score: number|null, at: string|null } }`. Las filas tienen la forma `{ kind, topic, scores, created_at }`.
  - `rutasFor(topKeys: string[]) -> string[]`: ids de `RUTAS` en orden de declaración.

- [ ] **Paso 1: escribir las pruebas que fallan**

  `tests/logic.test.mjs` hace lo siguiente:
  - lee `index.html`;
  - extrae el texto entre `//DATA-START` y `//DATA-END`;
  - lo evalúa con `vm.runInNewContext(code + ';({AREAS,RUTAS,NO_SE,scoreDiag,scoreReview,topicStatus,rutasFor,GLOSS})', {})`;
  - y exporta el resultado.

  Las pruebas usan una ruta de prueba `R` con dos temas `a` y `b` (cada uno con `diag.ok` = 1 y `review[*].ok` = 0):

```js
test('scoreDiag: acierto, error y «Aún no lo sé»', () => {
  assert.deepEqual(scoreDiag(R, [1, 0]), { a: 1, b: 0 });
  assert.deepEqual(scoreDiag(R, [4, 1]), { a: 0, b: 1 }); // 4 = opts.length = NO_SE
});
test('scoreReview cuenta aciertos del tema', () => {
  assert.deepEqual(scoreReview(R.topics[0], [0, 0]), { a: 2 });
  assert.deepEqual(scoreReview(R.topics[0], [0, 3]), { a: 1 });
});
test('topicStatus: sin filas todo es nuevo', () => {
  assert.equal(topicStatus(R, []).a.state, 'nuevo');
});
test('topicStatus: gana la evidencia más reciente', () => {
  const rows = [
    { kind: 'diagnostico', topic: null, scores: { a: 0, b: 1 }, created_at: '2026-11-10T10:00:00Z' },
    { kind: 'repaso', topic: 'a', scores: { a: 2 }, created_at: '2026-11-10T11:00:00Z' },
    { kind: 'diagnostico', topic: null, scores: { a: 1, b: 0 }, created_at: '2026-11-10T09:00:00Z' },
  ];
  const s = topicStatus(R, rows);
  assert.deepEqual(s.a, { state: 'dominado', kind: 'repaso', score: 2, at: '2026-11-10T11:00:00Z' });
  assert.deepEqual(s.b, { state: 'dominado', kind: 'diagnostico', score: 1, at: '2026-11-10T10:00:00Z' });
});
test('topicStatus: repaso 1 de 2 deja pendiente; diagnóstico nuevo gana a repaso viejo', () => {
  const s = topicStatus(R, [
    { kind: 'repaso', topic: 'a', scores: { a: 1 }, created_at: '2026-11-10T10:00:00Z' },
    { kind: 'repaso', topic: 'b', scores: { b: 2 }, created_at: '2026-11-10T10:00:00Z' },
    { kind: 'diagnostico', topic: null, scores: { a: 0, b: 0 }, created_at: '2026-11-11T10:00:00Z' },
  ]);
  assert.equal(s.a.state, 'pendiente'); assert.equal(s.b.state, 'pendiente');
});
test('topicStatus ignora temas desconocidos y scores incompletos', () => {
  const s = topicStatus(R, [
    { kind: 'repaso', topic: 'zzz', scores: { zzz: 2 }, created_at: '2026-11-10T10:00:00Z' },
    { kind: 'diagnostico', topic: null, scores: { a: 1 }, created_at: '2026-11-10T10:00:00Z' },
  ]);
  assert.equal(s.a.state, 'dominado'); assert.equal(s.b.state, 'nuevo'); assert.ok(!('zzz' in s));
});
test('rutasFor', () => {
  assert.deepEqual(rutasFor(['ml', 'web', 'con']), ['getnet-ai-deploy']);
  assert.deepEqual(rutasFor(['web', 'con', 'sec']), []);
});
```

- [ ] **Paso 2:** correr `node --test tests/`. Resultado esperado: FAIL con «RUTAS is not defined».

- [ ] **Paso 3:** agregar `RUTAS` (con metadatos de Getnet y `topics: []`), `NO_SE` y las cuatro funciones al bloque DATA, en ES5 como el resto del archivo (`var` y `function`).
  - El resumen va en `summary`: «Diseñar, construir y poner en marcha soluciones con IA dentro de la empresa: primero agentes individuales y luego sistemas de varios agentes».
  - `asks`: proactividad y ejecución; aprendizaje continuo; sentido de responsabilidad; haber construido algo real con IA (puntos extra).
  - En `topicStatus`, una fila de diagnóstico es evidencia de un tema solo si `topic.id in row.scores`.

- [ ] **Paso 4:** correr `node --test tests/`. Resultado esperado: todas pasan.

- [ ] **Paso 5:** commit con el mensaje «Agrega lógica de rutas por vacante con pruebas».

---

### Tarea 2: contenido de la ruta Getnet

**Files:**
- Modify: `index.html` (`RUTAS['getnet-ai-deploy'].topics` y `GLOSS`)
- Test: `tests/logic.test.mjs`

**Interfaces:**
- Consumes: la forma de `Ruta` de la Tarea 1.
- Produces: 7 temas con `id, name, plain, why, ideas[3..4], task{n,d,t}, res[2..3]{n,u}, diag{q,opts[4],ok,why}, review[2]{q,opts[4],ok,why}`.

- [ ] **Paso 1: escribir las pruebas de integridad que fallan**

```js
test('ruta Getnet: 7 temas en orden', () => {
  assert.deepEqual(RUTAS['getnet-ai-deploy'].topics.map(t => t.id),
    ['agentes','multiagente','evaluacion','guardrails','rag','mcp','observabilidad']);
});
test('cada tema está completo', () => {
  for (const t of RUTAS['getnet-ai-deploy'].topics) {
    assert.ok(t.ideas.length >= 3 && t.ideas.length <= 4, t.id);
    assert.ok(t.res.length >= 2 && t.res.length <= 3, t.id);
    t.res.forEach(r => assert.match(r.u, /^https:\/\//));
    [t.diag, ...t.review].forEach(q => {
      assert.equal(q.opts.length, 4, t.id); assert.ok(q.ok >= 0 && q.ok < 4, t.id); assert.ok(q.why.length > 20, t.id);
    });
    assert.equal(t.review.length, 2, t.id);
  }
});
test('la respuesta correcta no siempre está en la misma posición', () => {
  const oks = RUTAS['getnet-ai-deploy'].topics.flatMap(t => [t.diag.ok, ...t.review.map(r => r.ok)]);
  assert.ok(new Set(oks).size >= 3);
});
test('términos técnicos de las lecciones están en el glosario', () => {
  const keys = GLOSS.map(g => g[1]);
  ['llm', 'token', 'embedding', 'prompt'].forEach(k => assert.ok(keys.includes(k), k));
});
```

- [ ] **Paso 2:** correr `node --test tests/`. Resultado esperado: FAIL, porque los temas están vacíos.

- [ ] **Paso 3:** escribir los 7 temas.
  - Se parte de la tabla «Temas de la ruta Getnet» del spec.
  - El campo `why` aterriza cada tema en una empresa de pagos, con ejemplos como estos:
    - un agente que consulta el estado de una transacción para un comercio;
    - nunca mandar un número de tarjeta al modelo;
    - responder con los manuales de producto;
    - conectar el agente a sistemas internos;
    - el costo por conversación.
  - Ejercicios: una tarde, en Python, gratis y sin depender de un proveedor:
    - `agentes`: un ciclo con dos herramientas (calcular la comisión de un cobro y buscar una transacción en un JSON), con un máximo de 5 pasos.
    - `multiagente`: un orquestador que divide una pregunta en dos subtareas y une las respuestas.
    - `evaluacion`: 20 casos con su respuesta esperada y un script que compara dos versiones del prompt.
    - `guardrails`: validar la salida con Pydantic, poner un tope al monto y enmascarar tarjetas con la verificación de Luhn antes de llamar al modelo. Además, probar 5 inyecciones de instrucciones.
    - `rag`: 10 preguntas frecuentes, búsqueda BM25 o embeddings locales, top 3, una respuesta que cite y la medición de cuántas veces el fragmento correcto queda en el top 3.
    - `mcp`: un servidor con dos herramientas, probado con MCP Inspector.
    - `observabilidad`: un envoltorio que registre en SQLite la latencia, los tokens, el costo y los errores de cada llamada.
  - Recursos (`res`), exactamente estos:
    - `agentes`: https://www.anthropic.com/engineering/building-effective-agents
    - `multiagente`: https://www.anthropic.com/engineering/multi-agent-research-system
    - `evaluacion`: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
    - `guardrails`: https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/
    - `rag`: https://www.anthropic.com/news/contextual-retrieval y https://arxiv.org/abs/2005.11401
    - `mcp`: https://modelcontextprotocol.io/docs/develop/build-server
    - `observabilidad`: https://opentelemetry.io/docs/specs/semconv/gen-ai/

    A cada tema le falta un segundo recurso, salvo a `rag`, que ya tiene dos. Cada uno debe ser una página oficial verificada con WebSearch antes de escribirla. Si no hay una buena, se usa la de otro tema que también aplique.
  - Preguntas: miden comprensión, no memoria. Los distractores son plausibles, y `why` explica por qué la correcta lo es y por qué falla el distractor más tentador.
  - Al `GLOSS` se agregan `LLM`, `Token`, `Embedding` y `Prompt` (con claves de búsqueda `llm`, `token`, `embedding`, `prompt`), además de cualquier otro término que use una lección y no esté (por ejemplo `bm25` o `json`).

- [ ] **Paso 4:** correr `node --test tests/`. Resultado esperado: todas pasan.

- [ ] **Paso 5:** commit con el mensaje «Agrega contenido de la ruta AI Deployment Engineer (Getnet)».

---

### Tarea 3: tabla `mapa_aprendizaje` en Supabase

**Files:**
- Create: `sql/mapa_aprendizaje.sql`

**Interfaces:**
- Produces: la tabla `public.mapa_aprendizaje(id, user_id, email, created_at, ruta, kind, topic, answers smallint[], scores jsonb)`, que las Tareas 4 a 7 leen y escriben con supabase-js.

- [ ] **Paso 1:** escribir `sql/mapa_aprendizaje.sql`.
  - Usa el DDL del spec, con dos ajustes para igualar `mapa_respuestas`:
    - `email` tiene como default `lower((auth.jwt() ->> 'email'))`;
    - `answers smallint[] not null check (cardinality(answers) between 1 and 30 and answers <@ array[0,1,2,3,4]::smallint[])` y `scores jsonb not null check (jsonb_typeof(scores) = 'object')`.
  - Índice `mapa_aprendizaje_user_ruta_idx` sobre `(user_id, ruta, created_at desc)`.
  - RLS activado y tres políticas `to authenticated`, con los mismos nombres y expresiones que las de `mapa_respuestas`:
    - «insertar propio»: `with check (user_id = (select auth.uid()) and email = lower((select auth.jwt() ->> 'email')))`
    - «ver propio o docente»: `using (user_id = (select auth.uid()) or exists (select 1 from public.mapa_admins a where a.email = lower((select auth.jwt() ->> 'email'))))`
    - «borrar propio»: `using (user_id = (select auth.uid()))`
- [ ] **Paso 2:** aplicarlo con `apply_migration`, con `name: "mapa_aprendizaje"` y `project_id: vhdrnrzerjysjzpyzgif`.
- [ ] **Paso 3:** verificar las políticas. `select policyname, cmd from pg_policies where tablename = 'mapa_aprendizaje'` debe devolver 3 filas (INSERT, SELECT, DELETE).
- [ ] **Paso 4: verificar RLS dentro de una transacción que termina en `rollback`**
  - Se usa `set local role authenticated` y `set local request.jwt.claims` con el `sub` y el `email` de un usuario existente de `auth.users`.
  - Debe pasar:
    1. `insert` de una fila `diagnostico` propia;
    2. `select count(*)`, que debe ver esa fila.
  - Debe fallar:
    1. un `insert` con otro `email` (violación de RLS);
    2. un `insert` con `kind = 'repaso'` y `topic` nulo (violación del check).
- [ ] **Paso 5:** correr `get_advisors` de tipo `security`. No debe aparecer ningún aviso nuevo que mencione `mapa_aprendizaje`.
- [ ] **Paso 6:** commit con el mensaje «Agrega tabla mapa_aprendizaje con RLS».

---

### Tarea 4: prueba de flujo, pantalla de ruta y entradas

**Files:**
- Create: `tests/fake-supabase.js`, `tests/e2e.cjs`
- Modify: `index.html` (sección `s-learn`, CSS, `screens`, botón `to-learn`, panel en `renderResult`, funciones de datos y de ruta)

**Interfaces:**
- Consumes: `RUTAS`, `topicStatus` y `rutasFor` de la Tarea 1, y el contenido de la Tarea 2.
- Produces:
  - `loadRutaRows(rutaId) -> Promise<row[]>`: selecciona `id,created_at,kind,topic,answers,scores` del usuario y la ruta, en orden descendente.
  - `saveRutaRow({ ruta, kind, topic, answers, scores }) -> Promise<void>`: lanza el error si falla.
  - `deleteRutaRows(rutaId) -> Promise<void>`
  - `openRuta(rutaId)`: dibuja la ruta en `screens.learn` y llama a `show('learn')`.
  - `renderTopic(rutaId, topicId)`: la crea la Tarea 6. En esta tarea queda como stub que solo muestra el nombre.
  - `startDiag(rutaId)`: la crea la Tarea 5. En esta tarea, stub.
  - Fake: `window.__db = { mapa_respuestas: [], mapa_aprendizaje: [], mapa_admins: [] }`, y los flags `window.__fakeAdmin` y `window.__failInsert`.

- [ ] **Paso 1: escribir `tests/fake-supabase.js`**
  - Define `window.supabase.createClient()` y devuelve:
    - `auth.getSession()`, que resuelve una sesión `{ user: { id: 'u1', email: 'alumno@test.mx' } }`;
    - `auth.onAuthStateChange(cb)`, que no hace nada;
    - `auth.signOut()` y `auth.signInWithOtp()`;
    - `from(table)`, que da un constructor encadenable: `select`, `eq`, `order(col, { ascending })`, `limit`, `insert(obj)` y `delete()`. Es un thenable que resuelve `{ data, error }`.
  - En `insert` agrega `id`, `user_id: 'u1'`, `email` y `created_at` (ISO, que aumenta 1 s por cada inserción). Si `__failInsert` está activo, devuelve `{ error: { message: 'sin sesión' } }`.
  - `mapa_admins` devuelve una fila solo si `__fakeAdmin` está activo.

- [ ] **Paso 2: escribir `tests/e2e.cjs` con la primera parte del flujo**
  - Lanza Chromium y crea `context`. Define `INDEX_URL = 'file://' + path.resolve(__dirname, '../index.html')` y `setupRoutes(page)`, que hace las dos intercepciones siguientes.
  - Aborta las peticiones a `fonts.googleapis.com` y `fonts.gstatic.com`.
  - Responde la URL `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js` con `tests/fake-supabase.js`.
  - Abre `file://<repo>/index.html` y define dos helpers:
    - `noHScroll()`: `document.documentElement.scrollWidth <= innerWidth`.
    - `answer(key)`: pulsa la tecla y espera 250 ms a que `#counter` cambie o se oculte `#s-quiz`. `choose()` bloquea la entrada durante 170 ms, así que las teclas pulsadas en ese lapso se pierden. En todas las pruebas, `for (...) await answer('1')` reemplaza a `page.keyboard.press` dentro del cuestionario.
  - El fake toma su estado inicial de `window.__seed`, y `__fakeAdmin` se lee en cada consulta. Para escenarios con estado previo se abre una página nueva con `page.addInitScript(() => { window.__seed = {...}; window.__fakeAdmin = true; })`, porque `reload()` borra la memoria.
  - Asserts:

```js
await page.click('#to-learn');
await page.waitForSelector('#s-learn:not([hidden])');
assert.match(await page.textContent('#s-learn'), /AI Deployment Engineer/);
assert.equal(await page.locator('#s-learn .topic-row').count(), 7);
assert.equal(await page.locator('#s-learn .topic-row .state', { hasText: 'Sin evaluar' }).count(), 7);
assert.ok(await page.locator('#s-learn a[href*="greenhouse.io/getnet/jobs/5019637101"]').count() === 1);
// Desde el resultado del mapa: responder el cuestionario v2 eligiendo siempre la opción 1
await page.click('text=← Inicio'); await page.click('#start');
for (let i = 0; i < 10; i++) await page.keyboard.press('1');
await page.waitForSelector('#s-result:not([hidden])');
assert.ok(await page.locator('#s-result .vacancy').count() === 1);
```

  Con la opción 1 en todas las preguntas, el top 3 incluye `dat` o `ml`. Si no incluye ninguna clave de `["ml","bak","inf"]`, se cambian las teclas para elegir respuestas de Ciencia de datos y se anota el porqué en la prueba.

- [ ] **Paso 3:** correr `node tests/e2e.cjs`. Resultado esperado: FAIL, porque no existe `#to-learn`.

- [ ] **Paso 4: implementar en `index.html`**
  - `<section id="s-learn" class="result" hidden>` y `screens.learn`.
  - En `#home .actions`, `<button class="btn ghost" id="to-learn">Aprender para una vacante</button>`, que llama a `openRuta(Object.keys(RUTAS)[0])`.
  - `openRuta` dibuja lo siguiente:
    - `navBack()`;
    - la ficha: mono «Ruta por vacante», `h1` con el título, «empresa · lugar», el resumen, la lista `asks` y el enlace «Ver la vacante original» junto a «leída el 10 nov 2026»;
    - el botón del diagnóstico («Hacer el diagnóstico» o «Repetir el diagnóstico», según haya fila `diagnostico`) con la nota de los globales;
    - la lista `.topics` con un `button.topic-row` por tema, que contiene el nombre, un `span.state` con la etiqueta del estado y, si existe, la última evidencia, por ejemplo «Diagnóstico: correcto» o «Último repaso: 1 de 2». Si hay diagnóstico, los temas `pendiente` van primero.
  - Mientras carga se ve «Cargando tu progreso…». Si `loadRutaRows` falla, aparece el aviso `.note` «No se pudo cargar tu progreso (…)» y todos los temas quedan en *Sin evaluar*.
  - En `renderResult`, después de las tarjetas y del glosario y antes de `others`, si `rutasFor(top.map(r => r.key))` no está vacío, se agrega `<article class="panel vacancy">` con:
    - mono «Una vacante real para tus áreas»;
    - `h3` con «título · empresa»;
    - el resumen;
    - el botón «Ver qué piden y aprenderlo».
  - CSS nuevo en el bloque `<style>`, con las variables existentes:
    - `.topics` en columna con `gap: 10px`;
    - `.topic-row` con el estilo de `.opt`, en grid de `1fr auto` que pasa a una columna con `@media (max-width: 480px)`;
    - `.state` con la tipografía mono, donde *Ya lo dominas* lleva `background: var(--tint)`;
    - `overflow-wrap: anywhere` en enlaces.

- [ ] **Paso 5:** correr `node tests/e2e.cjs` y `node --test tests/`. Resultado esperado: ambas pasan.
- [ ] **Paso 6:** commit con el mensaje «Agrega pantalla de ruta por vacante y entradas desde inicio y resultado».

---

### Tarea 5: diagnóstico

**Files:**
- Modify: `index.html` (`renderQuestion`, `choose`, el `keydown`, `startQuiz`, más `startDiag` y `renderDiagResult`)
- Test: `tests/e2e.cjs`

**Interfaces:**
- Consumes: `scoreDiag`, `NO_SE`, `saveRutaRow` y `openRuta`.
- Produces:
  - `startDiag(rutaId)`: fija `mode = 'diag'`, `diagRuta = rutaId` y `QUESTIONS` = los temas mapeados a `{ q: t.diag.q, opts: t.diag.opts.map(t => ({ t })).concat([{ t: NO_SE }]) }`. Luego llama a `renderQuestion()` y `show('quiz')`.
  - `renderDiagResult(rutaId, answers)`
  - `startQuiz(v)` ahora fija `mode = 'mapa'`.

- [ ] **Paso 1: agregar al flujo las pruebas que fallan**

```js
await page.click('#to-learn');
await page.click('text=Hacer el diagnóstico');
assert.match(await page.textContent('#counter'), /Pregunta 1 de 7/);
assert.equal(await page.locator('#quiz-body .opt').count(), 5);
await page.keyboard.press('5');                     // «Aún no lo sé»
// Responder las 6 restantes con la opción correcta leída del DOM de prueba:
for (let i = 1; i < 7; i++) await page.keyboard.press(String(okIndex(i) + 1));
await page.waitForSelector('#s-learn:not([hidden]) .diag-result');
assert.match(await page.textContent('#s-learn'), /Dominas 6 de 7/);
assert.equal((await page.evaluate(() => window.__db.mapa_aprendizaje)).length, 1);
assert.deepEqual(await page.evaluate(() => window.__db.mapa_aprendizaje[0].answers.length), 7);
// Review Focus 1: el cuestionario del mapa sigue terminando en áreas
await page.click('text=← Inicio'); await page.click('#start');
for (let i = 0; i < 10; i++) await page.keyboard.press('1');
await page.waitForSelector('#s-result:not([hidden])');
// Review Focus 2: falla al guardar
await page.evaluate(() => { window.__failInsert = true; });
/* repetir diagnóstico */ assert.match(await page.textContent('#s-learn'), /No se pudo guardar/);
await page.evaluate(() => { window.__failInsert = false; });
```

  `okIndex(i)` lee los índices correctos desde `page.evaluate(() => RUTAS['getnet-ai-deploy'].topics.map(t => t.diag.ok))`.

- [ ] **Paso 2:** correr `node tests/e2e.cjs`. Resultado esperado: FAIL en «Hacer el diagnóstico».

- [ ] **Paso 3: implementar**
  - `renderQuestion`:
    - fija `ticks.style.gridTemplateColumns = 'repeat(' + QUESTIONS.length + ', 1fr)'`;
    - con `mode === 'diag'`, muestra el glosario de la pregunta y la pista «Puedes responder con las teclas 1 a 5. Si no lo sabes, elige «Aún no lo sé»: sirve más que adivinar».
  - `choose`: al terminar, si `mode === 'diag'`, llama a `renderDiagResult(diagRuta, answers.slice())`; si no, a `renderResult()`.
  - `renderDiagResult`:
    - calcula `scoreDiag`;
    - dibuja en `screens.learn` un `div.diag-result` con `h1` «Dominas X de 7», el aviso de guardado (el mismo patrón y textos que en `renderResult`, «Guardando…», «Guardado.» y «No se pudo guardar tu resultado (…)») y, por tema, un `details` con tu respuesta, la correcta y `why`;
    - termina con el botón «Volver a la ruta» → `openRuta`, llama a `show('learn')` y luego a `saveRutaRow({ ruta, kind: 'diagnostico', topic: null, answers, scores })`.
  - El texto de «Volver a empezar» y los botones de `renderResult` no cambian.

- [ ] **Paso 4:** correr `node tests/e2e.cjs` y `node --test tests/`. Resultado esperado: ambas pasan.
- [ ] **Paso 5:** commit con el mensaje «Agrega diagnóstico de la ruta reutilizando el motor del cuestionario».

---

### Tarea 6: lección y repaso por tema

**Files:**
- Modify: `index.html` (`renderTopic`, CSS de `.lesson`)
- Test: `tests/e2e.cjs`

**Interfaces:**
- Consumes: `scoreReview`, `topicStatus`, `loadRutaRows`, `saveRutaRow`, `glossFor` y `openRuta`.
- Produces: `renderTopic(rutaId, topicId)`, que reemplaza el stub de la Tarea 4.

- [ ] **Paso 1: agregar al flujo las pruebas que fallan**

```js
await page.click('#s-learn .topic-row:has-text("RAG")');
assert.match(await page.textContent('#s-learn'), /Qué es/);
assert.match(await page.textContent('#s-learn'), /Por qué le importa a una empresa de pagos/);
assert.ok(await page.locator('#s-learn .lesson a[target="_blank"][rel="noopener"]').count() >= 2);
await page.keyboard.press('1');                    // Review Focus 4: no hace nada aquí
assert.equal(await page.locator('#s-learn .review .opt[aria-pressed="true"]').count(), 0);
// Responder las 2 preguntas de repaso con la correcta
for (const [qi, ok] of reviewOks('rag').entries())
  await page.locator(`#s-learn .review .rq:nth-of-type(${qi + 1}) .opt`).nth(ok).click();
await page.waitForSelector('#s-learn .review .verdict');
assert.match(await page.textContent('#s-learn .review .verdict'), /2 de 2/);
await page.click('text=Volver a la ruta');
assert.match(await page.locator('#s-learn .topic-row:has-text("RAG") .state').textContent(), /Ya lo dominas/);
```

- [ ] **Paso 2:** correr `node tests/e2e.cjs`. Resultado esperado: FAIL en «Qué es».

- [ ] **Paso 3: implementar `renderTopic`**
  - Contenido:
    - `navBack` hacia la ruta («← La ruta»);
    - mono con el nombre de la ruta;
    - `h1` con el nombre del tema y el estado (calculado con `loadRutaRows` y `topicStatus`);
    - bloques con mono «Qué es» (`plain`), «Por qué le importa a una empresa de pagos» (`why`) e «Ideas clave» (`ideas`, en `ul`);
    - «Ejercicio para una tarde», con el formato de `.projects li` y su tiempo estimado;
    - «Para leer más», con enlaces `target="_blank" rel="noopener"`;
    - el glosario de los textos del tema, con `glossFor`.
  - Repaso: `div.review` con dos `div.rq`, cada uno con su pregunta y 4 `button.opt`.
    - Al elegir una opción, esa queda en `aria-pressed`.
    - Cuando las dos tienen respuesta:
      - se marca la correcta con la clase `.right`;
      - si elegiste otra, se marca con `.wrong`;
      - se muestra `why`;
      - aparece un `p.verdict` con «X de 2»;
      - se guarda con `saveRutaRow({ ruta, kind: 'repaso', topic: id, answers, scores: scoreReview(...) })` y el aviso de guardado sigue el patrón de la Tarea 5.
    - Botón «Repetir el repaso», que vuelve a dibujar.
  - Las teclas no aplican aquí: el `keydown` existente ya filtra por `screens.quiz.hidden`, y no se agrega ningún otro.

- [ ] **Paso 4:** correr `node tests/e2e.cjs` y `node --test tests/`. Resultado esperado: ambas pasan.
- [ ] **Paso 5:** commit con el mensaje «Agrega lección y repaso por tema».

---

### Tarea 7: borrar progreso, privacidad y vista docente

**Files:**
- Modify: `index.html` (`openRuta`, texto de privacidad en `#login`, `renderAdmin`)
- Test: `tests/e2e.cjs`

**Interfaces:**
- Consumes: `deleteRutaRows`, `topicStatus` y `RUTAS`.
- Produces: nada nuevo para otras tareas.

- [ ] **Paso 1: agregar al flujo las pruebas que fallan**

```js
await page.click('text=Borrar mi progreso en esta ruta');
await page.click('text=Confirmar borrado');
await page.waitForSelector('#s-learn .topic-row');
assert.equal(await page.locator('#s-learn .topic-row .state', { hasText: 'Sin evaluar' }).count(), 7);
assert.equal((await page.evaluate(() => window.__db.mapa_aprendizaje)).length, 0);
// Vista docente: página nueva con estado sembrado
const admin = await context.newPage(); await setupRoutes(admin);
await admin.addInitScript(() => { window.__fakeAdmin = true; window.__seed = { mapa_aprendizaje: [
  { id: 'x1', user_id: 'u2', email: 'otra@test.mx', created_at: '2026-11-10T10:00:00Z', ruta: 'getnet-ai-deploy',
    kind: 'diagnostico', topic: null, answers: [0,0,0,0,0,0,0],
    scores: { agentes:1, multiagente:0, evaluacion:1, guardrails:1, rag:0, mcp:1, observabilidad:0 } }] }; });
await admin.goto(INDEX_URL); await admin.click('#to-admin');   // a partir de aquí, los asserts usan `admin`
assert.match(await page.textContent('#s-admin'), /Rutas por vacante/);
assert.match(await page.textContent('#s-admin'), /otra@test\.mx.*Domina 4 de 7/s);
await page.fill('#admin-filter', 'nadie'); assert.match(await page.textContent('#s-admin'), /Sin resultados/);
```

- [ ] **Paso 2:** correr `node tests/e2e.cjs`. Resultado esperado: FAIL en «Borrar mi progreso».

- [ ] **Paso 3: implementar**
  - **Borrar progreso:** al final de `openRuta`, un `btn ghost` «Borrar mi progreso en esta ruta» con confirmación en dos clics, igual que «Borrar este intento». Llama a `deleteRutaRows` y luego a `openRuta`. Si falla, el botón cambia a «No se pudo borrar. Intentar de nuevo».
  - **Privacidad:** el texto del `#login` queda así:

    > Guardamos tu correo, tus respuestas y la fecha de cada intento, además de tus diagnósticos y repasos de las rutas por vacante, para que puedas revisarlos después. Tu profesor, Axel Casas, puede ver esos datos. Puedes borrar cualquier intento desde Mis respuestas y tu progreso de una ruta desde la ruta misma. No se usan para nada más que este cuestionario.

  - **`renderAdmin`:**
    - Además de la consulta actual, consulta `mapa_aprendizaje` con `select('id,email,created_at,ruta,kind,topic,scores').order('created_at', { ascending: false }).limit(1000)`.
    - Debajo de la lista actual va un mono «Rutas por vacante» y una lista `.attempts`.
    - Cada `details.attempt` lleva un `summary` con «email · fecha · título de la ruta» y el resultado: «Domina N de 7» para un diagnóstico, o «Tema: X de 2» para un repaso.
    - En los diagnósticos, el contenido desplegado muestra la lista por tema (✓/✗ y el nombre).
    - `draw()` filtra las dos listas con el mismo campo, y una lista vacía muestra «Sin resultados.».
    - Si la consulta de aprendizaje falla, solo esa sección muestra el aviso.

- [ ] **Paso 4:** correr `node tests/e2e.cjs` y `node --test tests/`. Resultado esperado: ambas pasan.
- [ ] **Paso 5:** commit con el mensaje «Agrega borrado de progreso, aviso de privacidad y sección docente de rutas».

---

### Tarea 8: revisión visual, README y entrega

**Files:**
- Modify: `README.md`, `tests/e2e.cjs`

- [ ] **Paso 1: agregar al flujo la revisión de ancho**
  - Repite el recorrido de ruta, diagnóstico y tema en dos tamaños: `viewport: { width: 390, height: 844 }` y `{ width: 1280, height: 900 }`.
  - En cada pantalla, `assert.ok(await page.evaluate(noHScroll))`.
  - Guarda capturas con `deviceScaleFactor: 1` en el scratchpad: ruta, diagnóstico, resultado del diagnóstico y tema, en ambos anchos.
- [ ] **Paso 2:** correr `node tests/e2e.cjs`. Resultado esperado: pasa. Luego revisar las capturas a mano, en tema claro y oscuro (con `colorScheme: 'dark'`).
- [ ] **Paso 3: README**
  - Agregar la sección «Rutas por vacante», que explique:
    - qué es;
    - la tabla `mapa_aprendizaje` y sus políticas, que están en `sql/mapa_aprendizaje.sql`;
    - cómo agregar una vacante: un objeto en `RUTAS`, con la forma del spec y `areas` con claves de `AREAS`;
    - cómo correr las pruebas: `node --test tests/` y `node tests/e2e.cjs`.
  - Aclarar en «Antes de que lo usen los alumnos» que el proyecto de Supabase en el plan gratuito se pausa por inactividad.
- [ ] **Paso 4:** `node --test tests/ && node tests/e2e.cjs`. Resultado esperado: todo pasa.
- [ ] **Paso 5:** commit con el mensaje «Documenta rutas por vacante» y `git push -u origin claude/jolly-goldberg-1ikegc`.
