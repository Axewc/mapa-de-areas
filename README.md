# Mapa de áreas

Hub de estudio para estudiantes de computación en México. Cada vacante real es una **línea** de color y cada habilidad que pide es una **estación**; lo que aprendes en una estación cuenta para todas las líneas que pasan por ella. Se estudia en sesiones de 5 tarjetas con repasos espaciados, y el avance hacia la vacante elegida se ve en un porcentaje.

Es una página estática (`index.html`, `css/` y `js/`, sin build ni dependencias que instalar) que usa Supabase solo para el acceso por correo y para guardar datos si la persona crea una cuenta. Está pensada para quien mantiene el sitio: agregar vacantes, revisar el progreso del grupo y desplegar.

El hábito se construye con sesiones cortas que terminan, progreso visible y repasos. No hay notificaciones, mensajes de culpa ni castigo por faltar.

## Cómo se usa

1. **Primera visita, sin cuenta.** Aparece «Elige tu meta» con las nueve vacantes (primero las de «Para empezar»). No se pide correo.
2. **Hoy.** Racha y semana, tarjeta de la meta con su «% listo», línea en miniatura y el botón «Sesión de hoy», que dice qué trae («5 min · 3 repasos · 2 pasos nuevos de SQL»). Si no hay nada pendiente dice «Estás al día» y cuándo toca el próximo repaso; «Otra sesión» adelanta los repasos más próximos.
3. **Sesión.** Pantalla completa de hasta 5 tarjetas, más las repeticiones de los errores (teclas 1 a 4 para responder y Enter para avanzar). Un paso nuevo muestra una idea y luego su pregunta; un repaso, solo la pregunta. Al responder se marca la correcta y se explica por qué. Al final, el cierre muestra XP, racha, cuánto subió el «% listo» y cuántos repasos tocan mañana. Salir a media sesión conserva lo ya respondido.
4. **Mapa.** Las nueve líneas dibujadas como mapa de transporte. Tocar una estación abre su página; debajo hay la misma información en lista.
5. **Línea.** Ficha de la vacante (lo que piden, nivel, enlace, «leída el…»), sus estaciones en orden con su avance y «Elegir como meta».
6. **Estación.** Qué es, para qué sirve, pasos ya vistos, ejercicio, recursos y glosario. Si no se ha empezado, ofrece el atajo «¿Ya sabes esto?».
7. **Yo.** Nivel, XP, mejor racha, cambiar de meta, cuenta opcional («Guarda tu progreso en la nube» con correo y enlace mágico), el cuestionario de áreas, «Borrar mis datos» (confirmación en dos pasos; borra el progreso de estudio del dispositivo y, con cuenta, de la nube; no borra tus intentos del cuestionario ni tu cuenta), «Cerrar sesión» (primero espera a las sincronizaciones en curso, guarda tu avance en la cuenta y borra la copia de este dispositivo, para que quien use el equipo después no mezcle su avance con el tuyo; si no se pudo guardar, no borra y ofrece reintentar o cerrar sin borrar, y avisa que quien entre después en ese navegador combinará ese avance con su cuenta) y, solo para el correo docente, la vista docente.
8. **Cuestionario de áreas** («Descubre tu área»). Diez preguntas que sugieren tres áreas. Se puede hacer sin cuenta; el resultado se guarda solo con sesión y enlaza con las líneas que encajan («Elegir como meta»). Hay dos versiones: «Explorar» (actividades cotidianas, sin nombres de herramientas) y «Con herramientas» (menciona Python, Docker, Power BI…). Las áreas están en `AREAS` de `js/data-areas.js`.
9. **Vista docente.** Tabla de progreso por alumno (correo, meta, «% listo», racha, XP, último día) e intentos del cuestionario, con un filtro por correo.

## Reglas de aprendizaje

Son funciones puras en `js/core.js`, con pruebas en `tests/core.test.mjs`.

- **Preguntas («ítems»).** Cada estación tiene 6: las 4 de sus pasos y 2 de aplicación. Su id es `estación.n` (`sql.2`), con n de 0 a 3 para los pasos y 4 y 5 para las extra. Cada pregunta tiene exactamente 4 opciones.
- **Cajas.** Cada ítem está en una caja de 0 («sin ver») a 5. Un acierto sube una caja (tope 5) y programa el repaso a **1, 3, 7, 16 y 35 días** para las cajas 1 a 5. Un error baja a la caja 1, vuelve mañana y además se repite una vez al final de la misma sesión; esa repetición no mueve la caja. Si el ítem nunca se había acertado (por ejemplo, la primera vez que lo ves), el error lo guarda con `ok: false` hasta que lo aciertes: cuenta como visto, pero no suma al «% listo». Un error en un ítem que ya habías acertado no lleva esa marca y pesa como la caja 1 (un estado guardado sin el campo se asume acertado). Un ítem atrasado no pierde caja. Un repaso adelantado («Otra sesión», con un ítem que aún no vence) da XP pero no mueve la caja, ni siquiera con un error; por eso adelantar repasos no sube el avance.
- **Sesión.** 5 tarjetas como máximo: hasta 3 repasos vencidos (los más atrasados primero) y el resto, tarjetas nuevas. Las nuevas recorren las estaciones de la línea meta en orden (los 4 pasos de cada una); cuando la meta ya no tiene pasos nuevos siguen las preguntas de aplicación («Reto») de sus estaciones y después las de otras líneas. Si faltan tarjetas, se completa con más repasos vencidos y, con «Otra sesión», con repasos que aún no vencen.
- **XP y nivel.** 10 por acierto, 2 por error y 20 por terminar la sesión; el bono de 20 se da una sola vez por día. Nivel = 1 + piso(XP / 200).
- **Racha.** Días cumplidos consecutivos hasta hoy o ayer; un día cumplido es aquel en que terminas al menos una sesión. Se tolera un día faltante por semana (de lunes a domingo), que se muestra como «día de descanso». Las fechas son las locales del dispositivo, en `AAAA-MM-DD`; la fecha se calcula en cada respuesta y al cerrar la sesión, no al empezarla.
- **Avance.** Peso por caja: 0, 0.4, 0.6, 0.8, 0.9 y 1. El avance de una estación es el promedio del peso de sus 6 ítems, y el **«% listo»** de una línea es el promedio del avance de sus estaciones. Un ítem que nunca se ha acertado y falla pesa 0 hasta que se acierte. Un solo día no lleva una línea a 100 %: en cada ítem solo el primer acierto del día sube la caja, y las cajas altas tardan días, así que el porcentaje sigue subiendo durante semanas. Una estación está «visitada» cuando sus 6 ítems están en caja 1 o más.
- **Atajo «¿Ya sabes esto?».** En una estación sin empezar, 2 preguntas de aplicación. Si aciertas las dos, los 6 ítems pasan a la caja 3 y vuelven en 7 días. Si fallas alguna, la estación se estudia normal y esas respuestas cuentan como cualquier otra. El atajo no da XP ni cuenta como día cumplido: solo mueve las cajas.

## Contenido

### Líneas

Nueve vacantes reales de la Ciudad de México, leídas completas el 10 de noviembre de 2026 (`seen`). Están en `js/data-lineas.js`, en orden L1 a L9.

| Línea | Puesto | Empresa | Nivel |
| --- | --- | --- | --- |
| L1 | Desarrollador de Software Jr. | EDAR Tech | Para empezar |
| L2 | Analista de Datos Jr. (People Analytics) | Sears | Para empezar |
| L3 | Tester Funcional Jr. (Salesforce) | Grupo MVS | Para empezar |
| L4 | Ingeniero de Operaciones Cloud Jr. (AWS) | SatoriTech | Para empezar |
| L5 | Analista SOC Tier 2 | SAFE | Meta a 2 años |
| L6 | Científico de Datos Jr. | Grupo Financiero Banorte | Meta a 2 o 3 años |
| L7 | AI Deployment Engineer | Getnet (Grupo Santander) | Meta a 2 o 3 años |
| L8 | Analista de Negocios Jr. (Business Analysis) | El Puerto de Liverpool (Corporativo) | Para empezar |
| L9 | Suscriptor Jr. (Daños) | MAPFRE | Para empezar |

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
  areas: ["bak", "web"],      // claves de AREAS, para enlazar desde el cuestionario
  summary: "…", asks: ["…"],  // de 3 a 5 requisitos
  note: "…",                  // opcional: sueldo, modalidad, experiencia
  stations: ["git", "datos", "sql", "apis", "pruebas-auto"],       // en orden de estudio
  map: { git: [215, 120, "t"], datos: [175, 160, "l"] },           // [x, y, lado de la etiqueta]
  badge: [183, 120]           // opcional: centro de la insignia «L1»
}

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
   - `areas` usa claves de `AREAS`; `seen` es la fecha de lectura (`AAAA-MM-DD`); `url` es `https`.
   - `stations` va en orden de estudio; `map` debe tener exactamente las mismas estaciones.
3. **Coordenadas del mapa** (`map`): el lienzo mide 360 de ancho y crece hacia abajo; `x` va de 16 a 344 y `y` es 16 o más. El tercer valor (`"l"`, `"r"`, `"t"` o `"b"`) es el lado de la etiqueta (por defecto `"r"`). `badge` coloca la insignia «L#» a 20 o menos de la primera estación.
4. **Reglas que hacen cumplir las pruebas** (`tests/content.test.mjs`):
   - cada pregunta tiene exactamente 4 opciones distintas, `ok` de 0 a 3 y una explicación (`why`) de más de 20 caracteres;
   - la correcta no delata: es la más larga y la más corta en no más del 40 % de las preguntas (y en no menos del 10 %), y en cada estación ocupa al menos 3 posiciones distintas;
   - una estación compartida lleva coordenadas idénticas en todas sus líneas;
   - dos estaciones distintas quedan al menos a 44 px una de otra;
   - ninguna etiqueta se encima con otra, con una estación ni con una línea.
5. **Lugares donde las pruebas fijan los conteos y los nombres** (se actualizan al agregar; los números de línea son los actuales):
   - `tests/content.test.mjs`, prueba «hay 32 estaciones y 9 líneas, en orden L1 a L9» (línea 103): el conteo de estaciones y la lista de ids de las líneas. Las pruebas por línea (líneas 83, 113 y 134) fijan las nueve existentes; conviene agregar ahí la nueva.
   - `tests/content.test.mjs`, prueba «cada estación tiene en el glosario sus términos» (línea 252): la lista `need` es manual. Los términos de una estación nueva solo se exigen si los agregas ahí; hazlo siempre.
   - `tests/quiz.test.mjs` (líneas 20 a 24) y `tests/core.test.mjs` (`lineasFor`, línea 263): las líneas esperadas por área. Una línea nueva con un área que ya tiene línea, o con `inv`, los cambia.
   - `tests/e2e.cjs`: 9 líneas y 32 estaciones en el mapa (líneas 326, 327, 330 y 335), 9 tarjetas y sus niveles en «Elegir meta» (líneas 885 a 889), las líneas que enlaza el resultado del cuestionario (línea 523) y la prueba de la miniatura de Hoy, que recorre todas las líneas (`miniLineScenarios`).
6. Corre `node --test tests/*.test.mjs` y `node tests/e2e.cjs`; con `SHOTS_DIR=… node tests/e2e.cjs` revisa en las capturas que el mapa y la miniatura de Hoy se vean bien.

## Datos y privacidad

Sin cuenta, nada sale del dispositivo: el progreso vive en una sola clave de `localStorage`, `mapa.v2` (`{ v: 2, goal, goalT, items, days }`). El XP, el nivel y la racha se calculan a partir de `days`. Si `localStorage` no está disponible, el sitio funciona en memoria y avisa que el progreso no se guardará.

Con cuenta se guardan el correo, las respuestas del cuestionario y el progreso de estudio, y el profesor puede verlos. El texto de la app (`PRIVACIDAD` en `js/pantallas-cuenta.js`) dice: «Sin cuenta, nada sale de tu dispositivo. Con cuenta se guardan tu correo, tus respuestas del cuestionario y tu progreso de estudio; el profesor puede verlos; puedes borrar tu progreso aquí y tus respuestas desde Mis respuestas. Si tienes la sesión abierta en otros dispositivos, pueden volver a subir su copia hasta que cierres sesión o borres allí también.»

Lo que se puede borrar desde la app:
- **«Borrar mis datos» (Yo):** el progreso de estudio del dispositivo y, con cuenta, la fila de `mapa_progreso`. Otras pestañas del mismo navegador se enteran (evento `storage`) y adoptan el estado vacío. **Limitación conocida:** otro dispositivo con la sesión abierta conserva su copia y la puede volver a subir en su próxima sincronización, hasta que cierre sesión o borre allí también; no hay una marca de borrado remota.
- **«Cerrar sesión» (Yo):** espera (hasta 8 s) a las sincronizaciones en curso para que ninguna con un estado más viejo pise la fila, hace una última sincronización y, si todo salió bien, borra la copia local (el avance queda en la cuenta). Si no, no borra y ofrece «Reintentar» o «Cerrar sesión sin borrar»; en ese caso el avance se queda en el navegador y quien entre después en él lo combinará con su cuenta. Si la sesión caduca por sí sola o se cierra desde otro lado, la copia local también se queda en el dispositivo.
- **«Borrar este intento» (Mis respuestas):** cada intento del cuestionario, uno por uno.
- **La cuenta en sí no se borra desde la app:** el usuario (y su correo) queda en Supabase, en Authentication, Users. Si alguien pide que se elimine su cuenta, el docente o administrador lo hace en Supabase (Authentication, Users); al eliminar al usuario, su fila de `mapa_progreso` se borra en cascada.

Proyecto de Supabase: `fbd-lab-tracker`. La URL del proyecto y la llave publicable (`sb_publishable_…`) están escritas en `js/app.js`; son públicas por diseño, y lo que protege los datos son las políticas RLS, no el secreto de la llave.

| Tabla | Para qué sirve | Políticas (RLS activado) |
| --- | --- | --- |
| `public.mapa_progreso` | Una fila por usuario: `user_id` (llave primaria), `email`, `state jsonb` (versión 2, menos de 200 KB) y `updated_at`. SQL en `sql/mapa_progreso.sql`. | Cada quien ve, crea, actualiza y borra su fila. El correo docente ve todas. El rol anónimo, nada. Nadie puede escribir ni borrar la fila de otra persona. |
| `public.mapa_respuestas` | Un renglón por intento del cuestionario (usuario, correo, fecha, respuestas, puntajes, `quiz_version`). | Cada alumno ve, crea y borra solo sus intentos. El correo docente ve todos. No se puede insertar un intento a nombre de otra persona. |
| `public.mapa_admins` | Correos con vista docente. Hoy solo `axewcasas@gmail.com`. | Sus políticas no están en este repositorio: viven en Supabase (la app solo la consulta para saber si el correo de la sesión es docente). Se edita con el SQL de abajo. |
| `public.mapa_aprendizaje` | **En desuso.** Era de las rutas por vacante (`sql/mapa_aprendizaje.sql`); la app ya no la usa. Tiene una fila, de una prueba. | Se conserva sin tocar; puede borrarse. |

Para agregar otro docente, inserta el correo **en minúsculas**: las políticas comparan `lower(auth.jwt() ->> 'email')` con `a.email` tal cual.

```sql
insert into public.mapa_admins (email) values ('correo@ejemplo.com');
```

La vista docente lee como máximo 1000 filas por tabla (`ADMIN_LIMIT` en `js/pantallas-cuenta.js`), sin paginación; si hay más, la pantalla avisa que puede haber más.

**Sincronización.** Con sesión, la app sincroniza al abrir el sitio con la sesión ya iniciada, al iniciar sesión, al elegir o cambiar de meta, al terminar una sesión de estudio (o al salir de ella habiendo respondido algo), al usar el atajo «¿Ya sabes esto?» y al cerrar sesión; no sincroniza en cada respuesta. En cada una, la app lee la fila, la combina con el estado local y guarda el resultado en los dos lados. La combinación es optimista y por ítem: gana el de cambio más reciente (`t`); por día, el XP mayor y `done` si lo está en cualquiera; de la meta, la del estado con el cambio más reciente. Si la fila remota es de otra versión o tiene forma rara, no se sobrescribe y el estudio sigue en el dispositivo. Si lo respondido cambia mientras una sincronización está en vuelo, se vuelve a combinar al terminar para no perderlo. El correo de la sesión viaja en minúsculas en cada guardado (la política de actualización lo exige igual al del token). Si la sincronización falla, aparece un aviso y se reintenta en la siguiente.

**Dato no confiable.** El progreso lo escribe el navegador, así que un alumno podría inflar el suyo desde la API. Es autoevaluación y solo afecta sus propios datos. La vista docente lo trata como no confiable: normaliza valores, topa el XP de cada día y descarta lo que no tiene forma válida. Se retomará al diseñar el ranking.

## Estructura de archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Estructura de las pantallas, barra inferior y carga de scripts |
| `css/app.css` | Tokens (claro y oscuro, nueve colores de línea) y estilos |
| `js/data-areas.js` | `AREAS`, `SETS` (cuestionario), `GLOSS`, `MAXP` y `scoreAnswers` |
| `js/data-estaciones.js` · `js/data-lineas.js` | `ESTACIONES` y `LINEAS` |
| `js/core.js` | Reglas puras: cajas, avance, sesión, XP, racha, combinación de estados, atajo y geometría del mapa |
| `js/store.js` | `localStorage` y sincronización con Supabase |
| `js/ui.js` · `js/app.js` | Utilidades de interfaz; cliente de Supabase, `state` global y arranque |
| `js/pantallas-estudio.js` | Elegir meta, Hoy y Sesión |
| `js/pantallas-mapa.js` | Mapa, Línea y Estación |
| `js/pantallas-cuenta.js` | Yo y vista docente |
| `js/pantallas-cuestionario.js` | Cuestionario, resultado y Mis respuestas |
| `sql/` | Copia de las migraciones aplicadas (`mapa_progreso`, `mapa_aprendizaje`) |
| `tests/` | Pruebas (ver abajo) |
| `docs/superpowers/specs` · `docs/superpowers/plans` | Historia del diseño: spec y plan de cada entrega |

Son scripts clásicos, no módulos, para que el sitio también abra desde `file://`. Los archivos de datos y `core.js` exportan con `module.exports` cuando corren en Node.

## Pruebas

```sh
node --test tests/*.test.mjs                  # 111 pruebas de lógica y contenido
node tests/e2e.cjs                            # flujo completo en Chromium con un Supabase falso
SHOTS_DIR=/tmp/capturas node tests/e2e.cjs    # además guarda capturas en esa carpeta
```

- `tests/core.test.mjs`: cajas (incluido `ok: false` y los repasos adelantados), avance, `buildSession`, XP, racha, `mergeState`, días con valores raros, atajo, geometría del mapa y la fila de la vista docente.
- `tests/content.test.mjs`: integridad de las 32 estaciones y 9 líneas, reglas de preguntas, glosario y legibilidad del mapa.
- `tests/store.test.mjs`: `localStorage` (estado inválido, dos pestañas, cuota llena) y sincronización con Supabase (fila de otra versión, fallas de red).
- `tests/quiz.test.mjs`: puntaje del cuestionario y su enlace con las líneas.
- `tests/e2e.cjs`: recorridos de primera visita, sesión con teclado, repasos con el reloj adelantado, mapa, atajo, cuenta (incluido cerrar sesión con y sin falla de sincronización y el cambio de cuenta en un mismo equipo), borrado (también desde otra pestaña y con la red colgada), sincronización sin `localStorage`, cuestionario sin cuenta y vista docente. Termina con una revisión visual de todas las pantallas a 390 × 844 y 1280 × 900, en tema claro y oscuro, que verifica que no haya scroll horizontal ni errores de JavaScript y, con `SHOTS_DIR`, guarda `{ancho}-{tema}-{pantalla}.png`. Además recorre la línea en miniatura de Hoy con cada una de las nueve líneas como meta, a 320, 360 y 390 px, y falla si una etiqueta se corta, se parte a media palabra o se encima con otra.
- `tests/fake-supabase.js` y `tests/fixtures/`: Supabase falso y las preguntas originales de Getnet.

Playwright ya está instalado en el entorno; no hace falta `playwright install`.

## Desplegar

Si el proyecto de Vercel de este sitio está conectado a este repositorio, despliega solo al hacer merge a `main`; no hay build.

1. El proyecto de Vercel de este sitio sirve la carpeta tal cual (`index.html`, `css/` y `js/`); no necesita framework ni comando de build. Si no está conectado al repositorio, se puede subir la carpeta completa (arrastrándola al panel o con `vercel deploy --prod` dentro de ella).
2. **No lo subas al proyecto `pilates-project`**: reemplazaría BersamaFlow.

Para usarlo en un subdominio de bersama.dev, agrega el dominio al proyecto en Vercel y crea el registro DNS que Vercel indique en el proveedor donde administras bersama.dev.

### Antes de que lo usen los alumnos

1. En Supabase, Authentication, URL Configuration, agrega la URL final del sitio en Redirect URLs. No cambies el Site URL, porque lo usa el laboratorio.
2. Configura un SMTP propio (por ejemplo Resend) en Authentication. El envío de correos que trae Supabase por defecto está muy limitado por hora y un grupo completo lo agotaría.
3. Revisa el texto de privacidad de Yo y ajústalo a lo que quieras prometer.
4. En el plan gratuito, Supabase pausa el proyecto después de unos días sin uso. Mientras está pausado, nadie puede entrar ni guardar (el estudio sin cuenta sigue funcionando). Si el sitio deja de enviar enlaces o de guardar, revisa en el panel de Supabase que `fbd-lab-tracker` esté activo.

## Decisiones y límites conocidos

- Esta es la entrega 1 de 3. El **ranking con alias** va en la entrega 1b, porque necesita cuentas y progreso sincronizado; el **cuestionario nuevo**, en la entrega 2; y **más vacantes**, en la 3 (el área Investigación, `inv`, no tiene línea todavía).
- Las cuentas dependen del script de `supabase-js`, que se carga desde jsdelivr (`index.html`, con `async`) con el flujo implícito. El script no bloquea la página: el sitio arranca con un cliente sin conexión (`offlineClient` en `js/app.js`) y se conecta cuando el script llega. Sin red o con ese CDN bloqueado, el estudio sin cuenta funciona igual y las acciones de cuenta avisan que no hay conexión con el servicio. Aun así el sitio no funciona sin conexión desde cero: no hay service worker, así que el HTML, el CSS y el JS se piden a la red en cada visita (Vercel los sirve con revalidación). El enlace mágico no puede volver a una URL `file://`: para probar el sitio en local, sírvelo por http (por ejemplo `python3 -m http.server` dentro de la carpeta) y agrega esa URL a Redirect URLs de Supabase.
- El script de `supabase-js` se carga de jsdelivr sin `integrity` (SRI): no se pudo descargar el archivo exacto del CDN para calcular su hash, y un hash equivocado dejaría el sitio sin cuenta. Para agregarlo, descarga la misma URL de `index.html`, calcula `openssl dgst -sha384 -binary archivo | openssl base64 -A` y añade `integrity="sha384-…" crossorigin="anonymous"` (la prueba de flujo reemplaza ese script por uno falso, así que no se ve afectada).
- Una marca de borrado remota (para que «Borrar mis datos» alcance también a otros dispositivos con sesión abierta) se difiere: hoy cada dispositivo conserva su copia hasta que cierre sesión o borre allí también.
- Mientras llega la entrega 2, el cuestionario actual se conserva tal cual y su resultado es largo en teléfono.
- La sincronización es optimista y combina por ítem; no hay validación en servidor. Un reloj mal puesto o un viaje entre zonas horarias puede hacer que un día cuente doble o no cuente.
- Un estado local ilegible o de otra versión se ignora, se empieza de cero y se avisa; no se borra hasta que haya un estado nuevo que guardar.
- El contenido es orientativo: resume lo que pedían las vacantes en la fecha de lectura y no es asesoría laboral.
