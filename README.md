# Mapa de áreas

Sitio para estudiantes de computación en México con dos partes que forman un solo recorrido: primero un cuestionario corto que sugiere qué área de computación podría irte y una vacante real para empezar; después, un hub de estudio. Cada vacante real es una **línea** de color y cada habilidad que pide es una **estación**; lo que aprendes en una estación cuenta para todas las líneas que pasan por ella. Se estudia en sesiones de 5 tarjetas con repasos espaciados, y el avance hacia la vacante elegida se ve en un porcentaje.

Es una página estática (`index.html`, `css/` y `js/`, sin build ni dependencias que instalar) que usa Supabase solo para el acceso por correo y para guardar datos si la persona crea una cuenta. Este documento está pensado para quien mantiene el sitio: agregar vacantes, cambiar el cuestionario, revisar el progreso del grupo y desplegar.

El hábito se construye con sesiones cortas que terminan, progreso visible y repasos. No hay notificaciones, mensajes de culpa ni castigo por faltar, y nada pide cuenta: el cuestionario y el estudio funcionan sin ella.

## Cómo se usa

1. **Primera visita (entrada).** Quien no tiene meta ni un resultado guardado ve «¿Por dónde empiezas?» con dos puertas: **«No sé qué área me va»** («8 preguntas · 5 minutos · sin cuenta») abre directo la primera pregunta, y **«Ya sé qué quiero»** abre «Elige tu meta». Debajo está «¿Ya tienes cuenta? Entra», para traer de la nube una meta guardada sin pisarla. La entrada no lleva barra inferior.
2. **Pantalla al abrir** (`renderInicio()` en `js/app.js`): con meta, Hoy; sin meta pero con un resultado del cuestionario guardado, Descubre (el resultado); si no, la entrada. Es también a donde se llega tras «Borrar mis datos» y tras cerrar sesión borrando la copia local.
3. **Barra inferior:** Hoy · Mapa · Descubre · Yo. El título de la pestaña del navegador cambia con la pantalla («Descubre · Mapa de áreas», «Tu resultado · Mapa de áreas»…; la entrada usa solo «Mapa de áreas»).
4. **Elegir meta.** Las nueve vacantes en dos grupos, «Para empezar» y «Para más adelante», cada una con su insignia «L#» y su nivel. «← Volver» regresa a Yo (con meta), a Descubre (sin meta y con resultado) o a la entrada.
5. **Hoy.** Racha y semana, tarjeta de la meta con su «% listo», línea en miniatura y el botón «Sesión de hoy», que dice qué trae («5 min · 3 repasos · 2 pasos nuevos de SQL»). Si no hay nada pendiente dice «Estás al día» y cuándo toca el próximo repaso; «Otra sesión» adelanta los repasos más próximos. Debajo, las otras líneas que ya avanzaste. Al final, mientras no haya un resultado del cuestionario, una tarjeta descartable: «¿Dudas si esta es tu área?» con «Descubrir mi área» y «Ahora no». «Ahora no» la cierra para siempre en ese dispositivo (`mapa.quizTip`). No cuenta como tarea ni toca racha ni XP.
6. **Sesión.** Pantalla completa de hasta 5 tarjetas, más las repeticiones de los errores (teclas 1 a 4 para responder y Enter para avanzar). Un paso nuevo muestra una idea y luego su pregunta; un repaso, solo la pregunta. Al responder se marca la correcta y se explica por qué. Al final, el cierre muestra XP, racha, cuánto subió el «% listo» y cuántos repasos tocan mañana. Salir a media sesión conserva lo ya respondido.
7. **Mapa.** Las nueve líneas dibujadas como mapa de transporte. Tocar una estación abre su página; debajo está la misma información en lista.
8. **Línea.** Ficha de la vacante (lo que piden, nivel, enlace, «leída el…»), sus estaciones en orden con su avance y «Elegir como meta».
9. **Estación.** Qué es, para qué sirve, pasos ya vistos, ejercicio, recursos y glosario. Si no se ha empezado, ofrece el atajo «¿Ya sabes esto?».
10. **Descubre.** Sin resultado, la invitación («¿Qué área de computación va contigo?», 8 preguntas, 5 minutos, sin cuenta) y «Empezar». Con resultado, el resultado corto (abajo). El cuestionario y el resultado quedan bajo esta pestaña.
11. **Cuestionario.** 8 preguntas (versión 3), sin elegir modo y sin pantalla intermedia. Se responde tocando una opción o con las teclas 1 a 4 o 5; pasa sola a la siguiente. «← Atrás» vuelve a la pregunta anterior y, en la primera, a la pantalla desde la que se empezó (entrada, Hoy, Descubre o Mis respuestas). Recargar a media pregunta no guarda nada.
12. **Resultado corto** (`renderResult` en `js/pantallas-cuestionario.js`), de arriba abajo:
    - «Tu resultado» y el nombre del área #1 como título, con su frase.
    - **«Por qué te salió»:** las dos respuestas que más puntos dieron al área #1 (`whyAnswers`). Solo se ve el texto de la respuesta; la pregunta va oculta para lectores de pantalla y en `title`, para no pasar del alto acordado.
    - **«Tu línea sugerida»:** tarjeta con insignia, nivel, título y empresa, **«Elegir como meta»** (entra a Hoy con el aviso «Meta cambiada a…») y «Ver en el mapa» (abre la pantalla Línea). Si esa línea ya es tu meta, dice «Tu meta actual» y el botón es «Ir a Hoy». Si la línea es «Meta a…», una nota dice que es una meta a mediano plazo y en cuánto se llega. Si el área #1 es Investigación, avisa que aún no hay vacante de investigación y sugiere la de la siguiente área.
    - **«Tus otras dos áreas»:** nombre, su frase en un renglón (recortada con «…»; completa en el detalle) y su línea sugerida como enlace, o «Es la línea sugerida arriba.» o «Aún sin vacante en el mapa.».
    - «Es una afinidad para empezar a explorar, no un veredicto.»
    - **«Ver detalle»** (plegado; nada se abre solo): afinidad de las 9 áreas en barras, las tres primeras a fondo (proyectos, materias y una pregunta para alguien que trabaja ahí), las otras seis y tres pasos para usar el resultado.
    - Pie: «Copiar mi resultado» (con respaldo seleccionable si el portapapeles falla), «Volver a hacerlo» y, sin cuenta, «Tu resultado queda en este dispositivo. Con cuenta lo conservas en todos.» con «Crear una cuenta en Yo»; con cuenta, el aviso del guardado («Guardado en tu cuenta.») y «Mis respuestas».
13. **Yo.** Nivel, XP, mejor racha, tu meta («Cambiar de meta»), cuenta opcional («Guarda tu progreso en la nube» con correo y enlace mágico; con sesión, «Mis respuestas» y «Cerrar sesión»), «Borrar mis datos» y, solo para el correo docente, la vista docente. El cuestionario ya no vive aquí.
    - **«Borrar mis datos»** pide confirmación en dos pasos. Borra el progreso de estudio, el último resultado del cuestionario y la tarjeta cerrada de Hoy del dispositivo y, con cuenta, la fila de progreso de la nube. No borra tus intentos del cuestionario guardados en la cuenta ni tu cuenta.
    - **«Cerrar sesión»** primero espera a las sincronizaciones en curso, guarda tu avance en la cuenta y borra la copia de este dispositivo (progreso, resultado y tarjeta), para que quien use el equipo después no mezcle su avance con el tuyo. Si no se pudo guardar, no borra y ofrece reintentar o «Cerrar sesión sin borrar», y avisa que quien entre después en ese navegador combinará ese avance con su cuenta.
14. **Mis respuestas** (con sesión, desde el resultado o desde Yo). Tabla de tus intentos por fecha y cada intento con sus preguntas y respuestas; se borran uno por uno. Los intentos de las versiones 1 y 2 se siguen leyendo con sus propias preguntas.
15. **Vista docente.** Tabla de progreso por alumno (correo, meta, «% listo», racha, XP, último día) e intentos del cuestionario (con el nombre de su versión), con un filtro por correo.

**Transiciones.** Al avanzar o volver entre pantallas (puertas, cuestionario, resultado, Línea…) la página se desliza 24 px en esa dirección con View Transitions (`document.startViewTransition({ update, types })` en `show()`, `js/ui.js`), como mejora progresiva: sin soporte, o si la llamada con objeto lanza, la pantalla cambia al instante; los cambios desde la barra inferior no se deslizan. Todo el movimiento está dentro de `@media (prefers-reduced-motion: no-preference)`; con movimiento reducido no hay deslizamiento ni fundido. Al cambiar de pantalla el foco va al título (salvo desde la barra inferior, donde se queda en la pestaña), y con Tab el foco no queda tapado por la barra fija (`scroll-padding-bottom`).

## Reglas de aprendizaje

Son funciones puras en `js/core.js`, con pruebas en `tests/core.test.mjs`.

- **Preguntas («ítems»).** Cada estación tiene 6: las 4 de sus pasos y 2 de aplicación. Su id es `estación.n` (`sql.2`), con n de 0 a 3 para los pasos y 4 y 5 para las extra. Cada pregunta tiene exactamente 4 opciones.
- **Cajas.** Cada ítem está en una caja de 0 («sin ver») a 5. Un acierto sube una caja (tope 5) y programa el repaso a **1, 3, 7, 16 y 35 días** para las cajas 1 a 5. Un error baja a la caja 1, vuelve mañana y además se repite una vez al final de la misma sesión; esa repetición no mueve la caja. Si el ítem nunca se había acertado (por ejemplo, la primera vez que lo ves), el error lo guarda con `ok: false` hasta que lo aciertes: cuenta como visto, pero no suma al «% listo». Un error en un ítem que ya habías acertado no lleva esa marca y pesa como la caja 1 (un estado guardado sin el campo se asume acertado). Un ítem atrasado no pierde caja. Un repaso adelantado («Otra sesión», con un ítem que aún no vence) da XP pero no mueve la caja, ni siquiera con un error; por eso adelantar repasos no sube el avance.
- **Sesión.** 5 tarjetas como máximo: hasta 3 repasos vencidos (los más atrasados primero) y el resto, tarjetas nuevas. Las nuevas recorren las estaciones de la línea meta en orden (los 4 pasos de cada una); cuando la meta ya no tiene pasos nuevos siguen las preguntas de aplicación («Reto») de sus estaciones y después las de otras líneas. Si faltan tarjetas, se completa con más repasos vencidos y, con «Otra sesión», con repasos que aún no vencen.
- **XP y nivel.** 10 por acierto, 2 por error y 20 por terminar la sesión; el bono de 20 se da una sola vez por día. Nivel = 1 + piso(XP / 200).
- **Racha.** Días cumplidos consecutivos hasta hoy o ayer; un día cumplido es aquel en que terminas al menos una sesión. Se tolera un día faltante por semana (de lunes a domingo), que se muestra como «día de descanso». Las fechas son las locales del dispositivo, en `AAAA-MM-DD`; la fecha se calcula en cada respuesta y al cerrar la sesión, no al empezarla.
- **Avance.** Peso por caja: 0, 0.4, 0.6, 0.8, 0.9 y 1. El avance de una estación es el promedio del peso de sus 6 ítems, y el **«% listo»** de una línea es el promedio del avance de sus estaciones. Un ítem que nunca se ha acertado y falla pesa 0 hasta que se acierte. Un solo día no lleva una línea a 100 %: en cada ítem solo el primer acierto del día sube la caja, y las cajas altas tardan días, así que el porcentaje sigue subiendo durante semanas. Una estación está «visitada» cuando sus 6 ítems están en caja 1 o más.
- **Atajo «¿Ya sabes esto?».** En una estación sin empezar, 2 preguntas de aplicación. Si aciertas las dos, los 6 ítems pasan a la caja 3 y vuelven en 7 días. Si fallas alguna, la estación se estudia normal y esas respuestas cuentan como cualquier otra. El atajo no da XP ni cuenta como día cumplido: solo mueve las cajas.

## Cuestionario de áreas

### Áreas, versiones y puntaje

- Las 9 áreas están en `AREAS` (`js/data-areas.js`), en este orden: `dat` Analítica e ingeniería de datos, `ml` Ciencia de datos y aprendizaje automático, `bak` Desarrollo backend, `web` Desarrollo full-stack y producto, `rsk` Riesgos, seguros y finanzas cuantitativas, `con` Consultoría tecnológica, `sec` Ciberseguridad, `inf` Infraestructura, nube y DevOps, `inv` Investigación y posgrado. Cada una trae `name`, `short` (la frase), `projects`, `courses` y `ask`.
- Las preguntas están en `SETS`. **Solo se ofrece la versión 3** (`SETS[3]`, nombre «Descubre»): 8 preguntas de 4 o 5 opciones, escenarios cotidianos en segunda persona, sin nombres de herramientas; 3 de ellas plantean cómo cambia la IA el trabajo. `SETS[1]` («Con herramientas») y `SETS[2]` («Explorar»), de 10 preguntas cada uno, ya no se ofrecen: se conservan solo para que Mis respuestas y la vista docente lean los intentos antiguos guardados con `quiz_version` 1 o 2 (`qaList`; una versión desconocida se lee como la 1).
- Cada opción es `{ t: 'texto', p: { área: puntos } }`. `MAXP[v][área]` es la suma, pregunta por pregunta, de los puntos más altos que el área puede recibir; se calcula solo al cargar `js/data-areas.js`. Para la versión 3: `dat 14, ml 12, bak 15, web 13, rsk 14, con 13, sec 12, inf 13, inv 12`.
- `scoreAnswers(answers, v)` devuelve las 9 áreas `{ key, pct, idx }` ordenadas. `pct` es `round(puntos / MAXP × 100)`; el orden **no** usa el redondeo. Desempate, en este orden:
  1. mayor proporción exacta puntos / MAXP (por multiplicación cruzada, sin redondeo);
  2. más puntos brutos;
  3. gana quien recibió más puntos en la pregunta **más reciente** en que las dos áreas difieren (de la última a la primera);
  4. solo si fueron idénticas en todas las preguntas, el orden de `AREAS`.
- Los intentos guardados (Mis respuestas, vista docente) no se recalculan: se ordenan con `topOf(scores)` sobre los porcentajes guardados, desempatando por el orden de `AREAS`.

### Línea sugerida y «Por qué te salió»

Funciones puras en `js/core.js`:

- **`lineForArea(área, LINEAS)`:** de las líneas cuyo `areas` contiene el área, gana la que la tiene **más al frente** de su lista; a igualdad, la de nivel «Para empezar»; luego, la de menor número. Sin ninguna, `null`. Con las líneas actuales: `dat` L2, `ml` L6, `bak` L1, `web` L1, `rsk` L9, `con` L8, `sec` L5, `inf` L4 e `inv` ninguna.
- **`suggestLine(ranked, LINEAS)`:** recorre el orden de `scoreAnswers` y devuelve la línea de la primera área que tenga una: `{ line, area, exact }`, con `exact` falso si no fue la #1 (hoy solo pasa con Investigación primero). Para `ml` (L6) y `sec` (L5) la línea es una «Meta a…», y el resultado lo dice.
- **`whyAnswers(set, answers, área)`:** índices de las (hasta) dos preguntas cuya respuesta dio más puntos al área, de más a menos; a igualdad, la más temprana; las que dieron 0 no cuentan.
- **`validQuiz(q, set)`:** acepta `{ v: 3, t, answers }` con `t` numérico finito y exactamente un entero válido por pregunta del set; tolera campos extra (`up`, `c`).

### Cómo agregar o cambiar una pregunta

1. Edita `SETS[3].qs` en `js/data-areas.js`. **No reordenes ni quites preguntas u opciones de una versión ya publicada** si quieres que los resultados guardados sigan valiendo: `mapa.quiz` guarda índices y se descarta si ya no encajan (longitud o índice fuera de rango), y los intentos de la cuenta se leen con `qaList` por índice. Para un cambio de fondo, crea `SETS[4]`, cambia `QUESTIONS` (`js/pantallas-cuestionario.js`), las llamadas `scoreAnswers(…, 3)`, `saveAttempt(…, 3)`, `loadQuiz(storage, SETS[3])` y `validQuiz` (exige `v === 3`), y deja `SETS[3]` para los intentos viejos.
2. Reglas que fijan las pruebas de `tests/quiz.test.mjs` (todas se recalculan con el contenido real, salvo donde se dice):
   - 8 preguntas de 4 o 5 opciones, sin preguntas ni opciones repetidas; cada pregunta termina en «?».
   - cada opción da enteros de 1 a 3 a entre 1 y 3 áreas válidas, y cada pregunta reparte puntos a 4 áreas o más;
   - la opción más larga de cada pregunta mide como mucho 1.6 veces la más corta;
   - al menos 3 preguntas mencionan la IA («IA» o «asistente»), y ningún texto nombra herramientas (Python, SQL, Docker, Power BI, Excel, AWS, Git, Linux, Java, Kubernetes, React);
   - cada área puede quedar sola en primer lugar, con al menos 20 puntos porcentuales sobre la segunda, eligiendo en cada pregunta la opción que más le da;
   - `MAXP[3]` equilibrado (el mayor ≤ 1.5 × el menor) y cada área suma en 4 preguntas o más;
   - **`MAXP[3]` fijo** («detecta errores al copiar pesos»): si cambias pesos a propósito, actualiza ahí los nueve valores;
   - **prueba exhaustiva de empates y reparto:** recorre las 160,000 combinaciones de respuestas (el producto de opciones por pregunta; la prueba fija ese total) y exige menos de 8 % de empates exactos en el primer lugar (misma proporción y mismos puntos brutos) y que cada área quede primera en entre 8 % y 14.5 % de las combinaciones. Con los pesos actuales: 6.14 % de empates y un reparto de 8.91 % a 12.96 %. Agregar una opción cambia el total de 160,000.
3. `tests/e2e.cjs` no fija puntajes de la versión 3: calcula lo esperado con `scoreAnswers`, `suggestLine` y `whyAnswers`, y busca con `keysFor(área)` las teclas que dejan un área primero. Sí supone que `keysFor('inv')` deja Investigación primero y sin vacante, y que `keysFor('ml')` lleva a una línea «Meta a…».
4. Si cambias textos, revisa la altura del resultado (abajo) y corre las dos suites.

### Guardado del resultado

- **En el dispositivo**, `localStorage` `mapa.quiz` = `{ v: 3, t, answers }` (`t`: milisegundos en que se terminó). Solo se guardan las respuestas; los porcentajes, la línea y «Por qué te salió» se recalculan al leer. Si el valor no valida (`validQuiz`), se ignora sin error y Descubre muestra la invitación; no se borra hasta que haya un resultado nuevo. Sin `localStorage`, el resultado vive en memoria durante la visita (`quizMem`) y el pie avisa que se pierde al cerrar.
- **Campos de la subida** que agrega `js/store.js` a `mapa.quiz` (y que `validQuiz` tolera): `up: 1` cuando el intento ya está en `mapa_respuestas`; `c`: milisegundos en que una pestaña reclamó la subida (`claimQuizUpload`), para que otra no lo suba a la vez. Un reclamo de más de 60 s (`QUIZ_CLAIM_MS`), o con el reloj al revés, se considera abandonado. `finishQuizUpload` quita `c` y, si salió bien, pone `up: 1`.
- **En la cuenta**, cada intento es un renglón de `mapa_respuestas` con `answers`, `scores` (porcentaje por área) y `quiz_version = 3`; sin cambios de esquema. `uploadQuiz()` sube **una sola vez** el último intento que aún no tiene `up: 1`, hecho con o sin sesión. Se llama al mostrar un resultado, al iniciar sesión (`SIGNED_IN`, también al volver por el enlace mágico) y al abrir el sitio con la sesión ya iniciada. Si el insert falla, no se marca: el resultado se queda, el pie lo avisa y se reintenta en la siguiente ocasión. Reabrir el resultado no vuelve a insertar.
- **Riesgo en equipos compartidos:** un resultado hecho sin cuenta se sube a la primera cuenta que inicie sesión en ese navegador, aunque sea de otra persona (lo mismo pasa con el progreso local). También tras «Cerrar sesión sin borrar»: si el último resultado no alcanzó a subirse, la siguiente cuenta lo sube. «Cerrar sesión» normal y «Borrar mis datos» borran `mapa.quiz`, así que no hay nada que subir después.
- **`mapa.quizTip` = `'1'`** cuando se tocó «Ahora no» en la tarjeta de Hoy. Es una comodidad por dispositivo: no se sincroniza. Sin `localStorage`, «Ahora no» solo dura la visita.
- Si otra pestaña borra `mapa.quiz` (por «Borrar mis datos» o al cerrar sesión), esta olvida su resultado en memoria y, si estaba en Descubre o en el resultado, vuelve a la invitación.

### Alto del resultado

Lo visible antes de «Ver detalle» mide como máximo **1,300 px a 390 px de ancho** (la meta del spec eran unas 1.5 pantallas de teléfono). Medido en las 3,531 combinaciones que dan un resultado distinto (área #1, otras dos y «Por qué te salió»): como máximo 1,258 px sin sesión o con el aviso de fallo, y 1,239 px con «Guardado en tu cuenta.». `tests/e2e.cjs` lo comprueba en varios casos, incluido el peor (Investigación primero, con sesión y aviso de fallo). A 360 px llega a 1,412 px y a 320 px a 1,509 px; el límite acordado es solo a 390 px. **Estas alturas se midieron con las fuentes del sistema** (las pruebas bloquean Google Fonts); con IBM Plex Sans y Bricolage Grotesque reales pueden variar unos píxeles.

## Contenido

### Líneas

Nueve vacantes reales de la Ciudad de México, leídas completas el 10 de noviembre de 2026 (`seen`). Están en `js/data-lineas.js`, en orden L1 a L9.

| Línea | Puesto | Empresa | Nivel | Áreas |
| --- | --- | --- | --- | --- |
| L1 | Desarrollador de Software Jr. | EDAR Tech | Para empezar | bak, web |
| L2 | Analista de Datos Jr. (People Analytics) | Sears | Para empezar | dat |
| L3 | Tester Funcional Jr. (Salesforce) | Grupo MVS | Para empezar | bak, web |
| L4 | Ingeniero de Operaciones Cloud Jr. (AWS) | SatoriTech | Para empezar | inf |
| L5 | Analista SOC Tier 2 | SAFE | Meta a 2 años | sec, inf |
| L6 | Científico de Datos Jr. | Grupo Financiero Banorte | Meta a 2 o 3 años | ml, dat |
| L7 | AI Deployment Engineer | Getnet (Grupo Santander) | Meta a 2 o 3 años | ml, bak, inf |
| L8 | Analista de Negocios Jr. (Business Analysis) | El Puerto de Liverpool (Corporativo) | Para empezar | con, web |
| L9 | Suscriptor Jr. (Daños) | MAPFRE | Para empezar | rsk |

L5 a L7 están marcadas como metas a mediano plazo (nivel «Meta a 2 años» o «Meta a 2 o 3 años») y se presentan como mapa de lo que hay que aprender. Cada línea dice en su nota (`note`) cuánta experiencia pide la vacante, si lo dice: L5 pide al menos 2 años y L6 de 2 a 4; L7 no pide años, pero valora haber construido algo real con IA. También L2 y L4, aunque son «Para empezar», listan requisitos de experiencia en su nota (L2 de 1 a 2 años en análisis de datos; L4, título y experiencia previa en soporte o infraestructura); L9 pide una ingeniería afín e inglés B2. De cada vacante solo se guarda lo necesario para estudiar (puesto, empresa, lugar, lo que piden y el enlace); no se copian correos ni datos de contacto.

**Las vacantes caducan.** Cada línea muestra «leída el…», y el enlace puede dejar de funcionar sin que la línea se rompa. Conviene revisarlas de vez en cuando.

### Estaciones

Hay 32, en `js/data-estaciones.js` (objeto `{ id: Estacion }`). Las compartidas más importantes: SQL (L1, L2, L4, L6 y L8), Hojas de cálculo (L2, L3, L8 y L9), Estadística (L6 y L9), Datos, Git, Pruebas automáticas, Linux y terminal, Monitoreo y registros, RAG y Evaluación (en dos líneas cada una). Las siete de Getnet (agentes, multiagente, evaluación, guardrails, RAG, MCP y observabilidad) se adaptaron de la ruta anterior, que conservó sus 21 preguntas.

### Forma de los objetos

```js
// Estación
{
  id: "sql", name: "SQL",
  plain: "…",                 // qué es, en una frase sin jerga
  why: "…",                   // para qué sirve en un trabajo real
  steps: [                    // 4 pasos: una idea (hasta 280 caracteres) y la pregunta que la comprueba
    { idea: "…", q: { q: "…", opts: ["…", "…", "…", "…"], ok: 1, why: "…" } }
  ],
  extra: [ { q, opts, ok, why }, { q, opts, ok, why } ],   // 2 preguntas de aplicación
  task: { n: "…", d: "…", t: "1 tarde" },                  // ejercicio para hacer fuera del sitio
  res: [ { n: "…", u: "https://…" } ]                      // de 1 a 3 recursos
}

// Línea
{
  id: "edar-dev-jr", n: 1, color: "l1",
  title: "…", company: "…", place: "…", level: "Para empezar",   // o «Meta a 2 o 3 años»
  url: "https://…", seen: "2026-11-10",
  areas: ["bak", "web"],      // claves de AREAS, por prioridad: la línea sugerida de un área sale de aquí
  summary: "…", asks: ["…"],  // de 3 a 5 requisitos
  note: "…",                  // opcional: sueldo, modalidad, experiencia
  stations: ["git", "datos", "sql", "apis", "pruebas-auto"],       // en orden de estudio
  map: { git: [215, 120, "t"], datos: [175, 160, "l"] },           // [x, y, lado de la etiqueta]
  badge: [183, 120]           // opcional: centro de la insignia «L1»
}

// Opción del cuestionario (en SETS[3].qs[i].opts)
{ t: "Buscar el punto débil por donde alguien podría colarse", p: { sec: 3, inf: 1 } }

// Glosario (en js/data-areas.js): [nombre, clave en minúsculas, explicación]
["Llave primaria", "llave primaria", "…"]
```

### Cómo agregar una línea o una estación

1. **Estaciones nuevas** (si la vacante pide algo que aún no existe): agrega el objeto a `ESTACIONES` en `js/data-estaciones.js`.
   - El `id` va en minúsculas y con guiones, y no cambia una vez publicado; tampoco el orden de las 6 preguntas, porque el progreso guardado se apoya en `id.n`.
   - Cada estación lleva 4 pasos, 2 preguntas extra, `task.t` igual a `"1 tarde"` y de 1 a 3 recursos con URL `https`.
   - Cada término técnico que aparezca debe tener su entrada en `GLOSS` (`js/data-areas.js`); la clave solo cuenta como palabra completa.
2. **La línea:** agrega un objeto al final de `LINEAS` en `js/data-lineas.js`.
   - `n` es el siguiente número (consecutivo desde 1) y `color` es `"l" + n`. Los colores `l1` a `l9` están en `css/app.css` (claro y oscuro); para una décima línea hay que agregar `--l10` y `.l10`.
   - `areas` usa claves de `AREAS`, de la más a la menos propia: el orden decide la línea sugerida del cuestionario (`lineForArea`). Una línea con `inv` le daría por fin vacante a Investigación.
   - `seen` es la fecha de lectura (`AAAA-MM-DD`); `url` es `https`.
   - `stations` va en orden de estudio; `map` debe tener exactamente las mismas estaciones.
3. **Coordenadas del mapa** (`map`): el lienzo mide 360 de ancho y crece hacia abajo; `x` va de 16 a 344 y `y` es 16 o más. El tercer valor (`"l"`, `"r"`, `"t"` o `"b"`) es el lado de la etiqueta (por defecto `"r"`). `badge` coloca la insignia «L#» a 20 o menos de la primera estación.
4. **Reglas que hacen cumplir las pruebas** (`tests/content.test.mjs`):
   - cada pregunta tiene exactamente 4 opciones distintas, `ok` de 0 a 3 y una explicación (`why`) de más de 20 caracteres;
   - la correcta no delata: es la más larga y la más corta en no más del 40 % de las preguntas (y en no menos del 10 %), y en cada estación ocupa al menos 3 posiciones distintas;
   - una estación compartida lleva coordenadas idénticas en todas sus líneas;
   - dos estaciones distintas quedan al menos a 44 px una de otra;
   - ninguna etiqueta se encima con otra, con una estación ni con una línea;
   - todas las áreas salvo `inv` tienen al menos una línea.
5. **Lugares donde las pruebas fijan los conteos y los nombres** (se actualizan al agregar; los números de línea son los actuales):
   - `tests/content.test.mjs`, prueba «hay 32 estaciones y 9 líneas, en orden L1 a L9» (línea 103): el conteo de estaciones y la lista de ids de las líneas. Las pruebas por línea (líneas 83, 113 y 134) fijan las nueve existentes; conviene agregar ahí la nueva. La prueba de la línea 108 exige que toda área salvo `inv` tenga al menos una línea.
   - `tests/content.test.mjs`, prueba «cada estación tiene en el glosario sus términos» (línea 252): la lista `need` es manual. Los términos de una estación nueva solo se exigen si los agregas ahí; hazlo siempre.
   - `tests/quiz.test.mjs` (líneas 20 a 24, con `SETS[2]`) y `tests/core.test.mjs` (`lineasFor`, línea 263; `lineForArea` con las líneas reales, línea 674; `suggestLine` con `SETS[2]`, línea 738): las líneas esperadas por área. Una línea nueva con un área que ya tiene línea, o con `inv`, los cambia.
   - `tests/e2e.cjs`: 9 líneas y 32 estaciones en el mapa (`mapaScenarios`), 9 tarjetas y el orden de sus niveles en «Elegir meta» (al inicio de `main`, paso «primera visita sin cuenta»), Investigación sin vacante (`descubreScenarios`) y la prueba de la miniatura de Hoy, que recorre todas las líneas (`miniLineScenarios`).
6. Corre `node --test tests/*.test.mjs` y `node tests/e2e.cjs`; con `SHOTS_DIR=… node tests/e2e.cjs` revisa en las capturas que el mapa y la miniatura de Hoy se vean bien.

## Datos y privacidad

Sin cuenta, nada sale del dispositivo. Todo vive en `localStorage`:

| Llave | Contenido |
| --- | --- |
| `mapa.v2` | Progreso de estudio: `{ v: 2, goal, goalT, items, days }`. El XP, el nivel y la racha se calculan a partir de `days`. |
| `mapa.quiz` | Último resultado del cuestionario: `{ v: 3, t, answers }`, más `up` y `c` durante y después de subirlo a la cuenta (ver «Guardado del resultado»). |
| `mapa.quizTip` | `'1'` si se cerró la tarjeta del cuestionario en Hoy. |

Si `localStorage` no está disponible, el sitio funciona en memoria y avisa que el progreso no se guardará; el cuestionario y su resultado también funcionan, solo que no se conservan.

Con cuenta se guardan el correo, los intentos del cuestionario y el progreso de estudio, y el profesor puede verlos. El texto de la app (`PRIVACIDAD` en `js/pantallas-cuenta.js`) dice: «Sin cuenta, nada sale de tu dispositivo. Con cuenta se guardan tu correo, tus respuestas del cuestionario y tu progreso de estudio; el profesor puede verlos; puedes borrar tu progreso aquí y tus respuestas desde Mis respuestas. Si tienes la sesión abierta en otros dispositivos, pueden volver a subir su copia hasta que cierres sesión o borres allí también.»

Lo que se puede borrar desde la app:
- **«Borrar mis datos» (Yo):** `mapa.quiz`, `mapa.quizTip` y `mapa.v2` del dispositivo (en ese orden) y, con cuenta, la fila de `mapa_progreso`. Otras pestañas del mismo navegador se enteran (evento `storage`) y adoptan el estado vacío. **Limitación conocida:** otro dispositivo con la sesión abierta conserva su copia y la puede volver a subir en su próxima sincronización, hasta que cierre sesión o borre allí también; no hay una marca de borrado remota.
- **«Cerrar sesión» (Yo):** espera (hasta 8 s) a las sincronizaciones en curso para que ninguna con un estado más viejo pise la fila, hace una última sincronización y, si todo salió bien, borra la copia local (las tres llaves; el avance queda en la cuenta). Si no, no borra y ofrece «Reintentar» o «Cerrar sesión sin borrar»; en ese caso todo se queda en el navegador y quien entre después en él lo combinará con su cuenta. Si la sesión caduca por sí sola o se cierra desde otro lado, la copia local también se queda en el dispositivo.
- **«Borrar este intento» (Mis respuestas):** cada intento del cuestionario, uno por uno.
- **La cuenta en sí no se borra desde la app:** el usuario (y su correo) queda en Supabase, en Authentication, Users. Si alguien pide que se elimine su cuenta, el docente o administrador lo hace en Supabase (Authentication, Users); al eliminar al usuario, su fila de `mapa_progreso` se borra en cascada.

Proyecto de Supabase: `fbd-lab-tracker`. La URL del proyecto y la llave publicable (`sb_publishable_…`) están escritas en `js/app.js`; son públicas por diseño, y lo que protege los datos son las políticas RLS, no el secreto de la llave.

| Tabla | Para qué sirve | Políticas (RLS activado) |
| --- | --- | --- |
| `public.mapa_progreso` | Una fila por usuario: `user_id` (llave primaria), `email`, `state jsonb` (versión 2, menos de 200 KB) y `updated_at`. SQL en `sql/mapa_progreso.sql`. | Cada quien ve, crea, actualiza y borra su fila. El correo docente ve todas. El rol anónimo, nada. Nadie puede escribir ni borrar la fila de otra persona. |
| `public.mapa_respuestas` | Un renglón por intento del cuestionario (usuario, correo, fecha, `answers`, `scores`, `quiz_version`). Los intentos nuevos llevan `quiz_version = 3`; los de 1 y 2 son de las versiones anteriores. | Cada alumno ve, crea y borra solo sus intentos. El correo docente ve todos. No se puede insertar un intento a nombre de otra persona. |
| `public.mapa_admins` | Correos con vista docente. Hoy solo `axewcasas@gmail.com`. | Sus políticas no están en este repositorio: viven en Supabase (la app solo la consulta para saber si el correo de la sesión es docente). Se edita con el SQL de abajo. |
| `public.mapa_aprendizaje` | **En desuso.** Era de las rutas por vacante (`sql/mapa_aprendizaje.sql`); la app ya no la usa. Tiene una fila, de una prueba. | Se conserva sin tocar; puede borrarse. |

Para agregar otro docente, inserta el correo **en minúsculas**: las políticas comparan `lower(auth.jwt() ->> 'email')` con `a.email` tal cual.

```sql
insert into public.mapa_admins (email) values ('correo@ejemplo.com');
```

La vista docente lee como máximo 1000 filas por tabla (`ADMIN_LIMIT` en `js/pantallas-cuenta.js`), sin paginación; si hay más, la pantalla avisa que puede haber más.

**Sincronización del progreso.** Con sesión, la app sincroniza `mapa.v2` al abrir el sitio con la sesión ya iniciada, al iniciar sesión, al elegir o cambiar de meta, al terminar una sesión de estudio (o al salir de ella habiendo respondido algo), al usar el atajo «¿Ya sabes esto?» y al cerrar sesión; no sincroniza en cada respuesta. En cada una, la app lee la fila, la combina con el estado local y guarda el resultado en los dos lados. La combinación es optimista y por ítem: gana el de cambio más reciente (`t`); por día, el XP mayor y `done` si lo está en cualquiera; de la meta, la del estado con el cambio más reciente. Si la fila remota es de otra versión o tiene forma rara, no se sobrescribe y el estudio sigue en el dispositivo. Si lo respondido cambia mientras una sincronización está en vuelo, se vuelve a combinar al terminar para no perderlo. El correo de la sesión viaja en minúsculas en cada guardado (la política de actualización lo exige igual al del token). Si la sincronización falla, aparece un aviso y se reintenta en la siguiente. Si al iniciar sesión desde la entrada o Elegir meta la nube trae una meta, se entra a Hoy. El resultado del cuestionario no viaja en esta fila: va aparte, como intento de `mapa_respuestas`.

**Dato no confiable.** El progreso lo escribe el navegador, así que un alumno podría inflar el suyo desde la API. Es autoevaluación y solo afecta sus propios datos. La vista docente lo trata como no confiable: normaliza valores, topa el XP de cada día y descarta lo que no tiene forma válida. Se retomará al diseñar el ranking.

## Estructura de archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Estructura de las pantallas (`#s-entrada`, `#s-pick`, `#s-hoy`, `#s-mapa`, `#s-linea`, `#s-estacion`, `#s-sesion`, `#s-yo`, `#s-descubre`, `#s-quiz`, `#s-result`, `#s-history`, `#s-admin`), barra inferior de 4 pestañas y carga de scripts |
| `css/app.css` | Tokens (claro y oscuro, nueve colores de línea), estilos y transiciones entre pantallas |
| `js/data-areas.js` | `AREAS`, `SETS` (cuestionario: versión 3 y las dos anteriores), `GLOSS`, `MAXP` y `scoreAnswers` |
| `js/data-estaciones.js` · `js/data-lineas.js` | `ESTACIONES` y `LINEAS` |
| `js/core.js` | Reglas puras: cajas, avance, sesión, XP, racha, combinación de estados, atajo, geometría del mapa, `lineForArea`, `suggestLine`, `whyAnswers`, `validQuiz` y la fila de la vista docente |
| `js/store.js` | `localStorage` (`mapa.v2`, `mapa.quiz`, `mapa.quizTip`, reclamo y marca de subida del resultado) y sincronización con Supabase |
| `js/ui.js` | Utilidades de interfaz: `el`, `show` (barra inferior, título, foco y View Transitions), `withDir`, avisos y glosario |
| `js/app.js` | Cliente de Supabase, `state` global, sincronización, pantalla inicial (`renderInicio`) y arranque |
| `js/pantallas-estudio.js` | Elegir meta, Hoy (con la tarjeta del cuestionario) y Sesión |
| `js/pantallas-mapa.js` | Mapa, Línea y Estación |
| `js/pantallas-cuenta.js` | Yo y vista docente |
| `js/pantallas-descubre.js` | Entrada (dos puertas) y pestaña Descubre (invitación o último resultado) |
| `js/pantallas-cuestionario.js` | Cuestionario, resultado corto, subida del intento (`uploadQuiz`) y Mis respuestas |
| `sql/` | Copia de las migraciones aplicadas (`mapa_progreso`, `mapa_aprendizaje`) |
| `tests/` | Pruebas (ver abajo) |
| `docs/superpowers/specs` · `docs/superpowers/plans` | Historia del diseño: spec y plan de cada entrega |

Son scripts clásicos (ES5), no módulos, para que el sitio también abra desde `file://`. Los archivos de datos, `core.js`, `store.js` y `ui.js` exportan con `module.exports` cuando corren en Node (para las pruebas).

## Pruebas

```sh
node --test tests/*.test.mjs                  # 155 pruebas de lógica y contenido
node tests/e2e.cjs                            # flujo completo en Chromium con un Supabase falso
SHOTS_DIR=/tmp/capturas node tests/e2e.cjs    # además guarda capturas en esa carpeta
E2E_ONLY=visual SHOTS_DIR=/tmp/capturas node tests/e2e.cjs   # solo la revisión visual a 360 y 390 px
```

`E2E_ONLY` también acepta `entrada`, `descubre`, `shared` y `cdn` para correr un solo grupo.

- `tests/core.test.mjs` (82): cajas (incluido `ok: false` y los repasos adelantados), avance, `buildSession`, XP, racha, `mergeState`, días con valores raros, atajo, geometría del mapa, la fila de la vista docente, `lineForArea`, `suggestLine`, `whyAnswers` y `validQuiz`.
- `tests/content.test.mjs` (23): integridad de las 32 estaciones y 9 líneas, reglas de preguntas, glosario y legibilidad del mapa.
- `tests/store.test.mjs` (33): `localStorage` (estado inválido, dos pestañas, cuota llena), `mapa.quiz` y su reclamo y marca de subida, `mapa.quizTip`, el orden de borrado y la sincronización con Supabase (fila de otra versión, fallas de red).
- `tests/quiz.test.mjs` (17): contenido y puntaje del cuestionario v3 (ver «Cómo agregar o cambiar una pregunta»), desempates, la prueba exhaustiva de empates y reparto, y el puntaje de la versión 2.
- `tests/e2e.cjs`: la entrada y sus dos puertas; la barra de 4 pestañas a 320 px; Descubre (invitación, cuestionario con teclado y «← Atrás», resultado corto con su altura, «Por qué te salió», línea sugerida, «Ver detalle», copiar, «Elegir como meta», Investigación y «Meta a…», tarjeta de Hoy, subida única del resultado al iniciar sesión, fallas de la subida, sin `localStorage`, recarga e inicio de sesión a media pregunta, borrado desde otra pestaña); transiciones (dirección, foco, navegaciones encadenadas y movimiento reducido); sesión con teclado, repasos con el reloj adelantado, mapa, atajo, cuenta (incluido cerrar sesión con y sin falla de sincronización y el cambio de cuenta en un mismo equipo), borrado (también desde otra pestaña y con la red colgada), sincronización sin `localStorage`, CDN de cuentas bloqueado o lento y vista docente. Sin `motion`, cada página prefiere movimiento reducido. Termina con una revisión visual de todas las pantallas a 360 × 780, 390 × 844 y 1280 × 900, en tema claro y oscuro (incluidos Descubre vacío, la pregunta 1, el resultado cerrado, abierto, con cuenta, con Investigación primero y con una línea «Meta a…», Hoy con la tarjeta, Yo con cuenta y Mis respuestas), que verifica que no haya scroll horizontal ni errores de JavaScript y, con `SHOTS_DIR`, guarda `{ancho}-{tema}-{pantalla}.png` (página completa: la barra inferior fija aparece donde estaba la ventana). Además recorre la línea en miniatura de Hoy con cada una de las nueve líneas como meta, a 320, 360 y 390 px, y falla si una etiqueta se corta, se parte a media palabra o se encima con otra.
- `tests/fake-supabase.js` y `tests/fixtures/`: Supabase falso y las preguntas originales de Getnet.

Playwright ya está instalado en el entorno; no hace falta `playwright install`. La revisión de accesibilidad con axe-core (WCAG 2.2 AA y buenas prácticas) se corrió aparte, sin instalarlo en el repositorio, sobre la entrada, Descubre, la pregunta, el resultado (cerrado y abierto), Hoy con la tarjeta y Yo con cuenta, en claro y oscuro, a 360 y 390 px: 0 violaciones.

## Desplegar

Si el proyecto de Vercel de este sitio está conectado a este repositorio, despliega solo al hacer merge a `main`; no hay build.

1. El proyecto de Vercel de este sitio sirve la carpeta tal cual (`index.html`, `css/` y `js/`); no necesita framework ni comando de build. Si no está conectado al repositorio, se puede subir la carpeta completa (arrastrándola al panel o con `vercel deploy --prod` dentro de ella).
2. **No lo subas al proyecto `pilates-project`**: reemplazaría BersamaFlow.

Para usarlo en un subdominio de bersama.dev, agrega el dominio al proyecto en Vercel y crea el registro DNS que Vercel indique en el proveedor donde administras bersama.dev.

### Antes de que lo usen los alumnos

1. En Supabase, Authentication, URL Configuration, agrega la URL final del sitio en Redirect URLs. No cambies el Site URL, porque lo usa el laboratorio.
2. Configura un SMTP propio (por ejemplo Resend) en Authentication. El envío de correos que trae Supabase por defecto está muy limitado por hora y un grupo completo lo agotaría.
3. Revisa el texto de privacidad de Yo y ajústalo a lo que quieras prometer.
4. En el plan gratuito, Supabase pausa el proyecto después de unos días sin uso. Mientras está pausado, nadie puede entrar ni guardar (el estudio y el cuestionario sin cuenta siguen funcionando). Si el sitio deja de enviar enlaces o de guardar, revisa en el panel de Supabase que `fbd-lab-tracker` esté activo.

## Decisiones y límites conocidos

- Entregas: la 1 (hub de estudio) y la 2 (entrada, pestaña Descubre y cuestionario de 8 preguntas) están hechas. Faltan el **ranking con alias** (entrega 1b, porque necesita cuentas y progreso sincronizado) y **más vacantes** (entrega 3; el área Investigación, `inv`, no tiene línea todavía).
- **View Transitions es una mejora progresiva.** Solo se probó en Chromium (Playwright); en Safari y Firefox reales no se ha verificado. Límite conocido: un toque durante los ~220 ms que dura el deslizamiento se pierde (mientras dura, lo que se ve es una captura de las dos pantallas). Para acortarlo, la barra inferior tiene su propio `view-transition-name` y no se anima. La apertura animada de «Ver detalle» (`::details-content` con `interpolate-size`) solo existe en Chromium; en otros navegadores abre al instante.
- Las alturas del resultado se midieron con las fuentes del sistema, no con las de Google; tampoco se han probado lectores de pantalla reales.
- «Por qué te salió» muestra solo las respuestas, no las preguntas (que se leen con lector de pantalla o en `title`): con la pregunta visible el resultado pasaba de 1,300 px. La frase de las otras dos áreas se recorta a un renglón por la misma razón.
- `lineasFor` en `js/core.js` ya no la usa el sitio, solo las pruebas.
- La subida del resultado hecho sin cuenta va a la primera cuenta que inicie sesión en ese navegador (ver «Guardado del resultado»).
- Las cuentas dependen del script de `supabase-js`, que se carga desde jsdelivr (`index.html`, con `async`) con el flujo implícito. El script no bloquea la página: el sitio arranca con un cliente sin conexión (`offlineClient` en `js/app.js`) y se conecta cuando el script llega. Sin red o con ese CDN bloqueado, el estudio y el cuestionario sin cuenta funcionan igual y las acciones de cuenta avisan que no hay conexión con el servicio. Aun así el sitio no funciona sin conexión desde cero: no hay service worker, así que el HTML, el CSS y el JS se piden a la red en cada visita (Vercel los sirve con revalidación). El enlace mágico no puede volver a una URL `file://`: para probar el sitio en local, sírvelo por http (por ejemplo `python3 -m http.server` dentro de la carpeta) y agrega esa URL a Redirect URLs de Supabase.
- El script de `supabase-js` se carga de jsdelivr sin `integrity` (SRI): no se pudo descargar el archivo exacto del CDN para calcular su hash, y un hash equivocado dejaría el sitio sin cuenta. Para agregarlo, descarga la misma URL de `index.html`, calcula `openssl dgst -sha384 -binary archivo | openssl base64 -A` y añade `integrity="sha384-…" crossorigin="anonymous"` (la prueba de flujo reemplaza ese script por uno falso, así que no se ve afectada).
- Una marca de borrado remota (para que «Borrar mis datos» alcance también a otros dispositivos con sesión abierta) se difiere: hoy cada dispositivo conserva su copia hasta que cierre sesión o borre allí también.
- La sincronización es optimista y combina por ítem; no hay validación en servidor. Un reloj mal puesto o un viaje entre zonas horarias puede hacer que un día cuente doble o no cuente.
- Un estado local ilegible o de otra versión se ignora, se empieza de cero y se avisa; no se borra hasta que haya un estado nuevo que guardar. Lo mismo con un `mapa.quiz` que no valida, pero sin aviso.
- El cuestionario sugiere una afinidad para empezar a explorar, no un veredicto, y el contenido de las líneas es orientativo: resume lo que pedían las vacantes en la fecha de lectura y no es asesoría laboral.
