# Entrada al sitio y cuestionario nuevo: diseño (entrega 2)

Fecha: 12 nov 2026 · Estado: decisiones aprobadas en conversación, pendiente de revisión escrita

## Por qué

El hub (entrega 1) dejó el cuestionario enterrado y sigue siendo el propósito original del sitio: ayudar a una persona a orientarse en qué área de computación podría desarrollarse.

- **La primera pantalla pide la respuesta que el cuestionario debería dar.** Un visitante nuevo ve «Elige tu meta» con 9 vacantes y ninguna otra salida.
- **Cuatro pasos y un scroll hasta el cuestionario:** elegir vacante, ir a Yo, bajar pasando «Tu meta» y «Cuenta», tocar «Descubre tu área».
- **Nada en Hoy, Mapa ni Línea lo menciona.** Quien duda de su meta no tiene camino desde ahí.
- **El resultado mide unos 6,660 px en teléfono:** barras de afinidad, tres tarjetas largas, otras seis áreas, pasos, panel de vacantes y botones. No deja una acción clara.
- **Hay que elegir entre dos versiones antes de ver la primera pregunta.**

## Objetivo

Que el sitio oriente primero (¿qué área me va?) y después lleve a estudiar la vacante que corresponda. Orientación y estudio forman un solo recorrido.

**Éxito:**
- El cuestionario se encuentra en un toque desde cualquier pantalla.
- Se contesta sin cuenta y sin elegir modo.
- El resultado cabe en unas 1.5 pantallas de celular (≈ 1,200 px antes del detalle plegado) y termina en una acción: elegir una línea como meta.

### Lo que decidió Axel

- **Entrada con dos puertas + pestaña «Descubre»** (frente a solo pestaña, o cuestionario obligatorio primero).
- **Resultado:** una sugerencia clara (área #1 y su línea) con detalle opcional plegado.
- **Cuestionario:** una sola versión, 8 preguntas, sin elegir modo.
- Del hub: sin notificaciones, sin culpa, sin cuenta obligatoria.

### Lo que decidí yo (corregible)

- **Línea sugerida por área:** de las líneas cuyo `areas` contiene el área, gana la que la trae **primero** en su lista; en empate, la de nivel «Para empezar»; en empate, la de menor número. «Investigación» no tiene línea: el resultado lo dice y ofrece la línea de la siguiente área del ranking que sí tenga.
- **«Por qué te salió»:** las dos respuestas que más puntos dieron al área #1 (empate: la más temprana).
- **Último resultado en el dispositivo** (`mapa.quiz`), sin cuenta. Solo guarda `{ v: 3, t, answers }`; los porcentajes se recalculan al leer. Si el valor no valida (8 enteros dentro del rango de cada pregunta), se ignora.
- **La tarjeta descartable de Hoy** se recuerda en `mapa.quizTip`: una comodidad por dispositivo, no parte del progreso sincronizado.
- **Borrar y cerrar sesión limpian también `mapa.quiz` y `mapa.quizTip`**, igual que el progreso.
- **Los intentos con cuenta** siguen yendo a `mapa_respuestas` con `quiz_version = 3`. Sin cambio de esquema.
- **Quién ve la entrada:** solo quien no tiene meta ni resultado guardado. Quien ya tiene meta entra en Hoy, como hoy. Quien tiene resultado pero no meta entra en Descubre, con su sugerencia y «Elegir como meta». Si inicia sesión y la nube trae una meta, la lógica actual de `syncAndRefresh` lo lleva a Hoy.

## Alcance

**Entra:**
- Pantalla de entrada con dos puertas.
- Pestaña «Descubre» (cuarta en la barra): invitación o último resultado.
- Cuestionario v3: 8 preguntas nuevas, sin pantalla de modos.
- Resultado corto con detalle plegado.
- Tarjeta descartable en Hoy.
- Retirar el bloque del cuestionario de Yo.
- Pruebas de contenido del cuestionario y e2e; README.

**No entra:** ranking con alias (1b), más vacantes (3), nuevas tablas o columnas, cambios al modelo de líneas y estaciones.

## Entrada

### Primera visita (`entrada`)
Aparece cuando no hay meta ni resultado guardado. Contiene:
- Marca «Mapa de áreas» y un título corto («¿Por dónde empiezas?»).
- **Puerta 1, «No sé qué área me va»:** subtítulo «8 preguntas · 5 minutos · sin cuenta». Abre la primera pregunta directo.
- **Puerta 2, «Ya sé qué quiero»:** «Elige una vacante real como meta». Abre la pantalla de elegir meta de hoy.
- El bloque «¿Ya tienes cuenta? Entra» (el mismo de la pantalla de elegir meta), para traer la meta de la nube sin pisarla.

Las dos puertas son botones de al menos 44 px de alto con texto completo; ninguna depende del color.

### Pestaña Descubre
Barra: Hoy · Mapa · **Descubre** · Yo.
- **Sin resultado:** la invitación (qué es, 8 preguntas, 5 minutos, sin cuenta) y el botón «Empezar». Nada de modos.
- **Con resultado:** la pantalla de resultado corto (misma que al terminar), «Volver a hacerlo» y, con cuenta, «Mis respuestas».
- Quiz y resultado quedan bajo esta pestaña; «Mis respuestas» e historial siguen bajo Yo.

### Hoy
Si no hay resultado y la tarjeta no se descartó: una tarjeta sobria, debajo de la sesión, «¿Dudas si esta es tu área? Son 5 minutos» con «Descubrir mi área» y «Ahora no». «Ahora no» la cierra para siempre en ese dispositivo. No cuenta como tarea ni afecta racha ni XP.

### Yo
Se retira «¿Qué área va contigo?». Se conserva «Mis respuestas» (con sesión) como una fila propia de la tarjeta de cuenta.

## Cuestionario v3

- **8 preguntas, 4–5 opciones cada una,** en `SETS[3]` (`js/data-areas.js`). `SETS[1]` y `SETS[2]` se conservan porque `qaList` y la vista docente los usan para intentos antiguos; ya no se ofrecen.
- **Estilo:** escenarios y actividades cotidianas, sin nombres de herramientas, en segunda persona, español de México, sin glosario. Opciones de longitud parecida (la más larga ≤ 1.6 veces la más corta de la pregunta).
- **Contenido:** diseñadas para separar pares parecidos (backend/web, datos/ML, seguridad/infraestructura, consultoría/riesgos). Al menos 3 de 8 preguntas plantean cómo cambia la IA el trabajo («un asistente escribe el primer borrador: ¿qué parte quieres hacer tú?»), sin favorecer a ninguna área.
- **Puntuación:** la actual. Cada opción da `p: { área: puntos }`; `scoreAnswers(3, answers)` devuelve el porcentaje de cada área contra su máximo posible (`MAXP[3]`).
- **Guardado:** al terminar, `mapa.quiz` en el dispositivo y, con sesión, un insert en `mapa_respuestas` (`quiz_version: 3`). Si el insert falla se avisa sin bloquear el resultado.

## Resultado corto

Orden y contenido:
1. **Encabezado:** «Tu resultado» y el nombre del área #1 como título.
2. **Frase** del área (`short`) y **«Por qué te salió»**: las dos respuestas que más puntos dieron.
3. **Línea sugerida:** tarjeta con la insignia, el título, la empresa y el nivel; botón **«Elegir como meta»** (usa `chooseGoal(id, true)`) y enlace «Ver en el mapa» (abre la pantalla Línea).
4. **Tus otras dos áreas:** fichas compactas con nombre, una línea de frase y su línea sugerida (enlace a Línea).
5. **Nota breve:** «Es una afinidad para empezar a explorar, no un veredicto.»
6. **«Ver detalle»** (`<details>`, plegado): afinidad por área (las barras actuales, más compactas), proyectos para probar, materias que ayudan y la pregunta para alguien que trabaja ahí de las tres áreas, las otras seis áreas, y los tres pasos para usar el resultado.
7. **Pie:** «Copiar mi resultado», «Volver a hacerlo», «Mis respuestas» (con sesión). Sin cuenta, una línea: «Tu resultado queda en este dispositivo. Con cuenta lo conservas en todos.»

**Sin vacante:** si el área #1 es «Investigación», la línea sugerida es la de la siguiente área del ranking que tenga una, con la frase «Aún no tenemos una vacante de investigación; esta línea es la más cercana».
**Foco y lectores de pantalla:** al llegar al resultado, el foco va al `h1`; la región de «copiado» y el guardado son `aria-live`.

## Datos y estado

| Dato | Dónde | Notas |
|---|---|---|
| Último resultado | `localStorage` `mapa.quiz` | `{ v: 3, t, answers }`; se valida al leer; se borra al «Borrar mis datos» y al cerrar sesión con sync correcto |
| Tarjeta de Hoy cerrada | `localStorage` `mapa.quizTip` | `'1'`; mismo trato que arriba |
| Intento con cuenta | `mapa_respuestas` | `quiz_version = 3`; sin cambios de esquema |

`store.js` (acceso seguro a `localStorage`) lee y escribe `mapa.quiz` con `try/catch`; sin almacenamiento, el resultado vive en memoria durante la visita. La vista docente no cambia: muestra `quiz_version` y `topLine(scores)` como ahora.

## Pruebas

**Unitarias** (`node --test tests/*.test.mjs`):
- Contenido de `SETS[3]`: 8 preguntas; 4–5 opciones; cada opción con puntos válidos; cada una de las 9 áreas es **alcanzable** como #1; ninguna opción delata por longitud (≤ 1.6); cada pregunta reparte puntos a al menos dos áreas; al menos 3 preguntas mencionan IA.
- `scoreAnswers(3, …)` con trayectorias que favorecen a cada área, y desempates deterministas.
- Línea sugerida por área (`lineForArea`): reglas de empate, «Investigación» sin línea, y que todas las demás áreas tengan una.
- «Por qué te salió»: las dos respuestas correctas, empate por posición.
- Validación de `mapa.quiz`: acepta lo válido; ignora longitud errónea, índices fuera de rango, cadenas y `null`.
- Guardado y limpieza en `store.js`.

**e2e** (`node tests/e2e.cjs`, Supabase falso):
- Primera visita ve las dos puertas; «No sé…» llega a la pregunta 1 en un toque; «Ya sé…» llega a elegir meta.
- Barra con cuatro pestañas; Descubre sin resultado muestra la invitación y con resultado el resumen.
- Contesta las 8 preguntas, ve el resultado corto (altura bajo el límite acordado a 390 px), «Elegir como meta» lleva a Hoy con el aviso.
- Tarjeta de Hoy: aparece sin resultado, «Ahora no» la quita y no vuelve tras recargar.
- Con cuenta: se inserta el intento con `quiz_version: 3`; «Mis respuestas» lo muestra; un intento v1/v2 sembrado sigue legible.
- «Borrar mis datos» y «Cerrar sesión» limpian `mapa.quiz`.
- Accesibilidad: foco al `h1` del resultado, botones ≥ 44 px, teclado en las puertas, `prefers-reduced-motion`.

**Revisión visual:** capturas a 360 y 390 px en claro y oscuro de entrada, Descubre (vacío y con resultado) y resultado completo.

## Riesgos

- **Calidad de las 8 preguntas:** una pregunta ambigua o que favorezca un área sesga el resultado. Mitigación: pruebas de alcanzabilidad y revisión de contenido independiente, como en las estaciones.
- **Menos preguntas, menos resolución entre áreas parecidas.** Se mide con la prueba de separación y se documenta como límite si hace falta.
- **La barra pasa de 3 a 4 pestañas:** hay que comprobar que las etiquetas caben a 320 px.

## Fuera de alcance, para después

- Ranking con alias (entrega 1b).
- Más vacantes y sus estaciones (entrega 3).
- Mostrar el resultado en la vista docente de otra forma, o análisis agregados.
