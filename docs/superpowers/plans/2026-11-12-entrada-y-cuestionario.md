# Entrada al sitio y cuestionario nuevo: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el sitio oriente primero: entrada con dos puertas, pestaña «Descubre», cuestionario de 8 preguntas sin modos y un resultado corto que termina en «Elegir como meta».

**Architecture:** Sitio estático sin build, scripts ES5 clásicos con globales. La lógica pura nueva (línea sugerida, «por qué te salió», validación del resultado guardado) va en `js/core.js` y `js/store.js` con pruebas de Node; el contenido en `js/data-areas.js` (`SETS[3]`); las pantallas en `js/pantallas-cuestionario.js` (se reescribe quiz y resultado) y un archivo nuevo `js/pantallas-descubre.js` (entrada, Descubre, tarjeta de Hoy).

**Tech Stack:** HTML/CSS/JS sin dependencias; `node --test tests/*.test.mjs`; Playwright (`node tests/e2e.cjs`) con `tests/fake-supabase.js`.

**Spec:** `docs/superpowers/specs/2026-11-12-entrada-y-cuestionario-design.md`

## Global Constraints

- ES5 en `js/` (sin `let`/`const`, flechas, módulos ni plantillas); debe abrir desde `file://`. Sin dependencias nuevas.
- Nada de `innerHTML`: solo `el()`/`textContent`.
- Sin notificaciones, sin culpa, sin cuenta obligatoria. El cuestionario funciona sin sesión y sin `localStorage`.
- Objetivos táctiles ≥ 44 px; el color nunca es la única señal; foco al encabezado al cambiar de pantalla (`show()` ya lo hace).
- Español de México, segunda persona, sin nombres de herramientas en las preguntas.
- `mapa_respuestas` no cambia; intentos nuevos con `quiz_version: 3`. `SETS[1]` y `SETS[2]` se conservan para intentos antiguos.
- Llaves de `localStorage`: `mapa.quiz` = `{ v: 3, t, answers }`; `mapa.quizTip` = `'1'`.
- Resultado: altura ≤ 1,300 px a 390 px de ancho con «Ver detalle» cerrado.
- Mensajes de commit en español, con las dos líneas de atribución de la sesión.

### Guía web (modern-web-guidance, recuperada el 12 nov; cada regla es obligatoria en la tarea que la toca)

- **`directional-navigation-transitions`:** las transiciones entre pantallas usan `document.startViewTransition({ update, types })` con detección de soporte (`if (!document.startViewTransition) { update(); return; }`), animando solo `transform`/`opacity`, con curva no lineal y `::view-transition-group(root) { animation: none }` bajo `prefers-reduced-motion: reduce`. `types` solo existe en navegadores recientes: si la llamada con objeto lanza, se cae a `update()` directo.
- **`motion`:** el movimiento se declara dentro de `@media (prefers-reduced-motion: no-preference)` (opt-in), no se anula después; las transiciones de color se conservan. El código nunca espera `animationend`/`transitionend` para continuar.
- **`content-first-noise-reduction`:** el contenido secundario del resultado va en `<details>` cerrado; nada se abre solo al cargar; la barra fija sigue en una fila y bajo el 12 % del alto; la tarjeta de Hoy no empuja contenido que el usuario ya está leyendo (va debajo de la sesión).
- **`animate-to-intrinsic-sizes`:** la apertura de `<details>` se anima con `interpolate-size: allow-keywords` como mejora progresiva (solo Chromium); sin soporte abre al instante. Sin trucos de `max-height`.
- **`copy-button`:** copiar usa `navigator.clipboard.writeText` en `try/catch`; el fallo también se muestra; el mismo elemento `role="status"` sirve de aviso visible y región viva; el botón **no** se deshabilita mientras muestra el aviso; el aviso se limpia tras ~2 s y los clics repetidos reinician el temporizador.
- **`accessibility` (2.4.2):** `document.title` cambia con la pantalla («Descubre · Mapa de áreas», etc.).

## Review Focus

1. **`mapa.quiz` corrupto o de otra versión** (arreglo corto, índices fuera de rango, `v: 2`, cadena): se ignora sin error y Descubre muestra la invitación. → prueba en Tarea 1.
2. **Empate total de áreas** (todas las respuestas reparten igual): el orden sigue siendo determinista y siempre hay una línea sugerida. → prueba en Tarea 1.
3. **Sin `localStorage`:** el resultado se muestra y «Elegir como meta» funciona; solo no se conserva. → e2e en Tarea 4.
4. **Recargar a mitad del cuestionario:** vuelve a la pantalla que corresponda (entrada u Hoy) sin resultado parcial guardado. → e2e en Tarea 4.
5. **Inicio de sesión mientras se contesta:** el `SIGNED_IN` no saca al usuario del cuestionario ni del resultado, y el intento se guarda al terminar. → e2e en Tarea 4.

---

### Task 1: Lógica pura y guardado del resultado

**Files:**
- Modify: `js/core.js`, `js/store.js`
- Test: `tests/core.test.mjs`, `tests/store.test.mjs`

**Interfaces:**
- Produces (en `core.js`, exportadas):
  - `lineForArea(areaKey, lines) → string|null`: id de la línea sugerida. Entre las líneas cuyo `areas` contiene `areaKey` gana la que lo tiene en el índice menor; empate: `level === 'Para empezar'`; empate: menor `n`. Sin ninguna: `null`.
  - `suggestLine(ranked, lines) → { line: string|null, area: string|null, exact: boolean }`: recorre `ranked` (`[{ key, pct }]`, ya ordenado) y devuelve la primera área con línea; `exact` es `true` si fue `ranked[0]`.
  - `whyAnswers(set, answers, areaKey) → number[]`: índices de las (hasta) 2 preguntas cuya opción elegida dio más puntos a `areaKey`, de mayor a menor; empate: la pregunta más temprana; se omiten las que dieron 0.
  - `validQuiz(q, set) → boolean`: `q.v === 3`, `q.answers` arreglo de `set.qs.length` enteros con `0 ≤ a < opts.length`, `q.t` número finito.
- Produces (en `store.js`, exportadas): `QUIZ_KEY = 'mapa.quiz'`, `TIP_KEY = 'mapa.quizTip'`, `loadQuiz(storage, set) → object|null`, `saveQuiz(storage, answers, now) → boolean`, `tipDismissed(storage) → boolean`, `dismissTip(storage)`, y `clearLocal(storage)` borra también las dos llaves. Todas toleran `storage === null` y excepciones de `Storage`.

- [ ] **Step 1: Pruebas que fallan** en `tests/core.test.mjs` (usa `LINEAS` y `SETS[2]` reales como datos): `lineForArea` para las 9 áreas con el valor esperado escrito a mano tras aplicar la regla a `js/data-lineas.js` (por ejemplo `bak` → `'edar-dev-jr'`, `rsk` → `'mapfre-suscriptor-jr'`, `inv` → `null`), más casos sintéticos de cada desempate; `suggestLine` con `inv` primero devuelve `exact:false` y la línea del segundo; con todos en 0 % devuelve la línea del primero por orden; `whyAnswers` con empates y con ceros; `validQuiz` rechaza longitud 7, índice 9, `-1`, `1.5`, `'0'`, `v:2`, `null`, y acepta uno válido.
- [ ] **Step 2:** `node --test tests/*.test.mjs` → fallan las nuevas.
- [ ] **Step 3: Implementa** las cuatro funciones en `core.js`.
- [ ] **Step 4: Pruebas que fallan** en `tests/store.test.mjs`: ida y vuelta de `saveQuiz`/`loadQuiz`; `loadQuiz` devuelve `null` con JSON roto, objeto inválido o `storage` nulo; `saveQuiz` devuelve `false` si `setItem` lanza; `clearLocal` borra `mapa.v2`, `mapa.quiz` y `mapa.quizTip`; `isWipeEvent` no cambia.
- [ ] **Step 5: Implementa** en `store.js`. `loadQuiz` usa `validQuiz` (vía `storeCore` como el resto del archivo).
- [ ] **Step 6:** `node --test tests/*.test.mjs` → todo pasa. Commit: «Agrega la lógica del resultado del cuestionario y su guardado local».

### Task 2: Contenido del cuestionario v3

**Files:**
- Modify: `js/data-areas.js` (`SETS[3]`)
- Test: `tests/quiz.test.mjs`

**Interfaces:**
- Produces: `SETS[3] = { name: 'Descubre', qs: [ { q, opts: [ { t, p: { area: puntos } } ] } × 8 ] }`; `MAXP[3]` se calcula solo; `scoreAnswers(3, answers)` funciona sin cambios.

- [ ] **Step 1: Pruebas que fallan** en `tests/quiz.test.mjs`:
  - 8 preguntas; cada una con 4 o 5 opciones; puntos enteros 1–3 solo sobre las 9 llaves de `AREAS`.
  - Cada pregunta reparte puntos a ≥ 4 áreas distintas en total y cada opción a 1–3 áreas.
  - **Alcanzabilidad:** para cada una de las 9 áreas existe una combinación de respuestas (búsqueda voraz: en cada pregunta la opción que más le da) con la que queda **sola** en primer lugar.
  - **Equilibrio:** `max(MAXP[3]) / min(MAXP[3]) ≤ 1.5` y cada área puede sumar en ≥ 4 preguntas.
  - **Sin pistas por longitud:** en cada pregunta, la opción más larga ≤ 1.6 × la más corta.
  - Al menos 3 preguntas contienen «IA» o «asistente» en `q`.
  - Ningún texto menciona herramientas: lista negra `['Python','SQL','Docker','Power BI','Excel','AWS','Git','Linux','Java','Kubernetes','React']` (palabra completa, sin distinguir mayúsculas).
  - Ninguna pregunta ni opción repetida; todas las preguntas terminan en «?».
- [ ] **Step 2:** corre y ve fallar.
- [ ] **Step 3: Escribe las 8 preguntas.** Escenarios cotidianos en segunda persona. Cubre estos ejes, uno por pregunta, para separar pares parecidos: (1) qué te engancha de un problema; (2) qué haces cuando algo falla; (3) construir lo que se ve vs. lo que sostiene (web/bak); (4) explicar con datos vs. predecir (dat/ml); (5) proteger vs. mantener funcionando (sec/inf); (6) entender el negocio vs. medir el riesgo (con/rsk); (7) IA: un asistente escribe el primer borrador, ¿qué parte quieres hacer tú?; (8) IA: ¿qué te gustaría revisar o decidir cuando la máquina propone? Una tercera pregunta de las anteriores también debe plantear IA (p. ej. la 2: «un asistente de IA propone un arreglo…»). `inv` (investigación) debe poder ganar: dale opciones propias en ≥ 4 preguntas. Ninguna opción debe sonar «mejor» que otra.
- [ ] **Step 4:** pruebas en verde. Ajusta pesos hasta cumplir equilibrio y alcanzabilidad.
- [ ] **Step 5:** actualiza la prueba existente «MAXP tiene las 9 áreas en las dos versiones» para las tres. Commit: «Agrega el cuestionario de 8 preguntas (versión 3)».

### Task 3: Navegación: cuatro pestañas, títulos y transiciones

**Files:**
- Modify: `index.html`, `js/ui.js`, `js/app.js`, `css/app.css`
- Create: `js/pantallas-descubre.js` (solo `renderDescubre` mínimo y `renderEntrada`; se completa en Tarea 4)
- Test: `tests/e2e.cjs`

**Interfaces:**
- Produces:
  - Secciones nuevas en `index.html`: `#s-entrada` y `#s-descubre` (clase `hub`); `#s-intro` se elimina. Botón `data-tab="descubre"` entre Mapa y Yo. `<script src="js/pantallas-descubre.js">` antes de `app.js`.
  - `ui.js`: `TAB_OF` con `descubre: 'descubre', quiz: 'descubre', result: 'descubre'`; `history` y `admin` siguen en `yo`; `NO_TABBAR = { sesion, quiz, pick, entrada }`; `SCREEN_TITLE` (mapa nombre → texto) y `show()` pone `document.title = SCREEN_TITLE[name] + ' · Mapa de áreas'` (o solo «Mapa de áreas» si no hay entrada).
  - `ui.js`: `show(name, keep, dir)`; `dir` opcional `'forward' | 'backward'`. Sin `dir` o con `keep`, cambia al instante como hoy. Con `dir`, envuelve el cambio de `hidden` en `document.startViewTransition` según la guía (detección de soporte y `try/catch` alrededor de la forma con objeto). El foco y `scrollTo` ocurren dentro de `update`.
  - `renderEntrada()` y `renderDescubre(keep)` globales. `app.js`: arranque `goal → renderHoy`; si no, `quizSaved → renderDescubre`; si no, `renderEntrada`. La pestaña llama `renderDescubre()`.
- Consumes: `loadQuiz` (Tarea 1).

- [ ] **Step 1: e2e que falla** (`entradaScenarios`): primera visita muestra `#s-entrada` con dos botones (`#door-quiz`, `#door-goal`) ≥ 44 px y sin barra; `#door-goal` abre `#s-pick` y su «← Volver» regresa a la entrada cuando no hay meta; la barra tiene 4 botones, cada uno ≥ 44 px a 320 px de ancho y sin scroll horizontal; `document.title` cambia al ir a Mapa, Descubre y Yo; el botón de pestaña activo lleva `aria-current="page"`; con `mapa.quiz` válido y sin meta el arranque cae en Descubre.
- [ ] **Step 2:** `node tests/e2e.cjs` → falla en el paso nuevo.
- [ ] **Step 3: Implementa.** Entrada: `hubHead()`, `h1` «¿Por dónde empiezas?», dos botones-tarjeta (título + subtítulo «8 preguntas · 5 minutos · sin cuenta» / «Elige una vacante real como meta») y `signInBlock('pick-', '¿Ya tienes cuenta? Entra', true)` (el de `renderPick` se quita cuando no hay meta para no duplicar ids). CSS de la barra: `grid-template-columns: repeat(4, 1fr)`. Las pantallas que dependían de `'intro'` en listas (`app.js` storage/refresh, `TAB_OF`) se actualizan.
- [ ] **Step 4: Transiciones.** CSS: `@keyframes` de deslizamiento corto (`translate: 24px 0` + opacidad, 0.22 s, `ease-out`) aplicados con `html:active-view-transition-type(forward|backward)::view-transition-old/new(root)`, todo dentro de `@media (prefers-reduced-motion: no-preference)`; fuera de él, `::view-transition-group(root) { animation: none; }`. El fundido `screen-in` actual se conserva como respaldo para navegadores sin View Transitions y se desactiva cuando hay transición activa (`html:active-view-transition .wrap > section { animation: none; }`). Usa `dir` solo en: puertas de entrada (forward), «← Volver» (backward), abrir Línea/Estación (forward) y sus regresos (backward). Las pestañas cambian sin dirección.
- [ ] **Step 5:** e2e y unitarias en verde (los escenarios existentes que entraban por `#s-pick` en la primera visita pasan ahora por `#door-goal`: actualiza `openHome` y sus esperas). Commit: «Entrada con dos puertas, pestaña Descubre y transiciones entre pantallas».

### Task 4: Cuestionario sin modos, resultado corto y Descubre

**Files:**
- Modify: `js/pantallas-cuestionario.js`, `js/pantallas-descubre.js`, `js/pantallas-cuenta.js`, `js/pantallas-estudio.js`, `index.html` (sección `#s-quiz`), `css/app.css`
- Test: `tests/e2e.cjs`

**Interfaces:**
- Consumes: `SETS[3]`, `scoreAnswers`, `suggestLine`, `lineForArea`, `whyAnswers`, `loadQuiz`, `saveQuiz`, `tipDismissed`, `dismissTip`, `chooseGoal(id, true)`, `openLinea(id, false, from)`.
- Produces: `startQuiz()` (siempre v3), `renderResult(answers, opts)` donde `opts.fresh` indica recién terminado (guarda e inserta) frente a reabierto desde Descubre (no inserta); `renderDescubre` muestra invitación o resultado; `quizTipCard()` devuelve el nodo de la tarjeta de Hoy o `null`.

- [ ] **Step 1: e2e que falla** (`descubreScenarios`, reemplaza a `cuestionarioScenarios` conservando sus casos de historial y de la vista docente):
  - Puerta 1 → pregunta 1 en un toque; la pantalla tiene **un `h1`** (la pregunta) y contador «Pregunta 1 de 8»; teclas 1–5 responden; «← Atrás» vuelve a la anterior y en la primera sale a donde se entró.
  - Tras 8 respuestas: `#s-result` visible, foco en el `h1` con el nombre del área #1, encabezados sin saltos de nivel (h1 → h2 → h3), `scrollHeight ≤ 1300` a 390 px con el detalle cerrado, sin scroll horizontal a 320 px y ningún botón, enlace o `summary` de menos de 44 px.
  - «Por qué te salió» lista 2 respuestas que coinciden con `whyAnswers`.
  - «Elegir como meta» → `#s-hoy`, aviso «Meta cambiada a …», `mapa.v2.goal` = línea sugerida. «Ver en el mapa» abre la Línea.
  - Trayectoria que deja `inv` primero: aparece el texto «Aún no tenemos una vacante de investigación» y la línea ofrecida es la de `suggestLine`.
  - «Ver detalle» es un `<details>` cerrado al llegar; al abrirlo aparecen las barras de las 9 áreas, proyectos y las otras seis áreas.
  - «Copiar mi resultado»: con permiso de portapapeles el `role="status"` dice «Copiado» y se limpia; con `navigator.clipboard.writeText` forzado a rechazar dice «No se pudo copiar» y aparece el texto seleccionable; el botón nunca queda `disabled`.
  - `mapa.quiz` guardado; al recargar sin meta se entra en Descubre con el resultado; «Volver a hacerlo» empieza en la pregunta 1.
  - Con sesión: un insert en `mapa_respuestas` con `quiz_version: 3` y `answers` de 8; reabrir Descubre **no** inserta otro; `__failInsert` muestra el aviso sin ocultar el resultado; un intento sembrado con `quiz_version: 1` sigue legible en «Mis respuestas».
  - Tarjeta de Hoy: visible sin resultado; «Ahora no» la quita y no vuelve tras recargar; con resultado no aparece; no hay tarjeta dentro de la sesión.
  - Yo ya no contiene «¿Qué área va contigo?»; «Mis respuestas» sigue con sesión.
  - «Borrar mis datos» y «Cerrar sesión» (con sync correcto) dejan `mapa.quiz` y `mapa.quizTip` en `null`.
  - **Review Focus 3–5:** sin `localStorage` (`noStorage`) el resultado y «Elegir como meta» funcionan; recargar en la pregunta 4 no deja `mapa.quiz`; `__fakeLogin()` durante la pregunta 3 no cambia de pantalla y al terminar hay exactamente un insert.
- [ ] **Step 2:** corre y ve fallar.
- [ ] **Step 3: Cuestionario.** Elimina modos (`drawModes`, `chosen`, `openIntro`, `setVersion`); `QUESTIONS = SETS[3].qs`; la pregunta pasa a `h1`; el `aria-valuemax` y el contador usan 8; se quita el glosario del cuestionario. `qaList(ans, v)` sigue aceptando 1, 2 y 3.
- [ ] **Step 4: Resultado corto** en el orden del spec (encabezado, frase, por qué, línea sugerida, otras dos áreas, nota, `<details>`, pie). Reutiliza `lineBadge`, `.line-card`, `.bars` y `.panel` existentes; el detalle agrupa lo que hoy es `cards`, `others` y `steps`. Sin sesión, la línea «Tu resultado queda en este dispositivo…» enlaza a Yo. Copiar: sigue la guía `copy-button` de Global Constraints (un `span role="status"` junto al botón; temporizador de 2 s reiniciable).
- [ ] **Step 5: CSS del detalle:** `:root { interpolate-size: allow-keywords; }` y, dentro de `@media (prefers-reduced-motion: no-preference)`, `details.result-more::details-content { block-size: 0; overflow: clip; transition: block-size 0.25s ease-out, content-visibility 0.25s allow-discrete; }` con `[open]::details-content { block-size: auto; }`. `summary` ≥ 44 px (corrige el de 33 px que marcó la auditoría).
- [ ] **Step 6: Descubre, tarjeta de Hoy y Yo.** `renderDescubre`: sin resultado, invitación con «Empezar»; con resultado, `renderResult(saved.answers, { fresh: false })` dentro de la pestaña. `renderHoy` inserta `quizTipCard()` **después** de la sesión y de «Otras líneas». `renderYo` pierde la tarjeta del cuestionario y gana «Mis respuestas» dentro de la tarjeta de cuenta (solo con sesión). Borrar y cerrar sesión ya limpian por `clearLocal`; además vacía el resultado en memoria.
- [ ] **Step 7:** `node --test tests/*.test.mjs` y `node tests/e2e.cjs` en verde. Commit: «Cuestionario sin modos, resultado corto y pestaña Descubre».

### Task 5: Revisión visual, auditoría y README

**Files:**
- Modify: `tests/e2e.cjs` (`visualPass`), `README.md`, `css/app.css` (ajustes que salgan de la revisión)

- [ ] **Step 1:** amplía `visualPass` para capturar entrada, Descubre vacío, pregunta 1, resultado cerrado y resultado con detalle abierto a 360 y 390 px, claro y oscuro (`SHOTS_DIR`). Mira cada captura: texto cortado, encimados, contraste, alineación de la barra de 4 pestañas.
- [ ] **Step 2:** corre axe-core (WCAG 2.2 AA + best-practice) sobre entrada, Descubre, pregunta y resultado en claro y oscuro; debe dar **0 violaciones** (las dos de la auditoría del 12 nov, `page-has-heading-one` y `heading-order`, quedan resueltas). Instálalo en un directorio temporal, no en el repo.
- [ ] **Step 3:** corrige lo que aparezca; vuelve a correr ambas suites.
- [ ] **Step 4: README:** flujo nuevo (entrada, Descubre, resultado), llaves `mapa.quiz` y `mapa.quizTip`, reglas de línea sugerida, cómo agregar o cambiar una pregunta (y qué pruebas lo fijan), `quiz_version = 3`, conteo de pruebas, y que las transiciones usan View Transitions como mejora progresiva. Verifica cada afirmación contra el código.
- [ ] **Step 5:** Commit: «Revisión visual y documentación de la entrada y el cuestionario nuevo». Push.
