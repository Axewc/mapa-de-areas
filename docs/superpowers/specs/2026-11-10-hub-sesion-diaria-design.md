# Hub de estudio con sesión diaria: diseño (entrega 1)

Fecha: 10 nov 2026 · Estado: dirección y maquetas aprobadas en conversación, pendiente de revisión escrita

## Por qué

El sitio se usa una vez y se abandona: 5 personas, 7 intentos, todos entre el 30 de septiembre y el 1 de octubre. Las causas que encontré:

- Pide correo y enlace mágico antes de mostrar una sola pregunta.
- El resultado del cuestionario mide 5,500 px en teléfono y no deja un siguiente paso.
- El hub tiene 1 vacante, 7 temas y 21 preguntas: unos 20 minutos de material.
- Nada da una razón para volver mañana.

## Objetivo

Convertir Mapa de áreas en un hub de estudio que se abre a diario: sesiones de 5 minutos, repasos espaciados y avance visible hacia vacantes reales.

### Lo que decidió Axel

- Carta libre en diseño, metodología y lenguaje visual.
- El aprendizaje debe crear hábito («adictivo»).
- Se puede probar sin cuenta; la cuenta por correo es opcional.
- Ranking opcional con alias.
- Orden: primero el hub y la sesión diaria; después el cuestionario nuevo; después más vacantes.

### Lo que decidí yo (corregible)

- **El ranking va en la entrega 1b**, justo después de esta. Necesita cuentas y progreso sincronizado, que nacen aquí.
- **Hábito sin manipulación:** sesiones cortas que terminan, progreso visible y repasos espaciados. No hay notificaciones, ni mensajes de culpa, ni castigo por faltar.
- **El cuestionario actual se conserva** tal cual hasta la entrega 2, pero se puede hacer sin cuenta.

## Alcance

**Entra:**
- Modelo de habilidades compartidas entre vacantes («líneas» y «estaciones»).
- Sesión diaria con repetición espaciada, XP y racha.
- Pantallas Hoy, Sesión, Mapa, Línea, Estación y Yo, con diseño nuevo.
- 3 líneas y 15 estaciones: la de Getnet y dos vacantes nuevas de Indeed.
- Progreso guardado en el dispositivo, con sincronización opcional a Supabase.
- Vista docente del progreso.
- Separar `index.html` en archivos, sin build.

**No entra:**
- Ranking (entrega 1b).
- Cuestionario nuevo (entrega 2).
- Más vacantes (entrega 3).
- Notificaciones, correo de recordatorio o app instalable.
- Borrar la tabla `mapa_aprendizaje`: deja de usarse, pero no se toca. Tiene una fila, de la prueba de Axel.

## Modelo de contenido

### Estación (habilidad)

Una estación se aprende una vez y cuenta para todas las líneas que pasan por ella.

```js
{
  id: "sql",
  name: "SQL",
  plain: "…",              // qué es, en una frase sin jerga
  why: "…",                // para qué sirve en un trabajo real
  steps: [                 // 4 pasos: una idea y una pregunta que la comprueba
    { idea: "…", q: { q: "…", opts: ["…", "…", "…", "…"], ok: 1, why: "…" } }
  ],
  extra: [ { q, opts, ok, why }, { q, opts, ok, why } ],  // 2 preguntas de aplicación
  task: { n: "…", d: "…", t: "1 tarde" },                 // ejercicio para hacer fuera del sitio
  res: [ { n: "…", u: "https://…" } ]                     // 2 o 3 recursos oficiales
}
```

- Cada estación tiene **6 preguntas** («ítems»): las 4 de los pasos y las 2 de aplicación.
- El id de un ítem es `estación.n`, con `n` de 0 a 5 (por ejemplo `sql.2`). No cambia una vez publicado.
- Cada pregunta lleva exactamente 4 opciones. La posición y la longitud de la correcta varían; la prueba de longitud que ya existe se aplica a todas las estaciones.

### Línea (vacante)

```js
{
  id: "edar-dev-jr",
  n: 1,                         // número de línea
  color: "l1",                  // token de color
  title: "Desarrollador de Software Jr.",
  company: "EDAR Tech",
  place: "Ciudad de México · híbrido",
  level: "Para empezar",        // o «Meta a 2 o 3 años»
  url: "https://…",
  seen: "2026-11-10",           // fecha en que se leyó la vacante
  areas: ["bak", "web"],        // claves de AREAS, para enlazar desde el cuestionario
  summary: "…",
  asks: ["…"],
  stations: ["git", "datos", "sql", "apis", "pruebas"],   // en orden de estudio
  map: { git: [30, 30], datos: [30, 110] }                 // coordenadas de cada estación en el mapa
}
```

### Las tres líneas de esta entrega

| Línea | Vacante | Nivel | Estaciones |
| --- | --- | --- | --- |
| L1 | Desarrollador de Software Jr., EDAR Tech ([Indeed](https://to.indeed.com/aatdz7r8llx4)) | Para empezar | Git, Datos, SQL, APIs, Pruebas |
| L2 | Desarrollador de IA, Corporativo UBK ([Indeed](https://to.indeed.com/aawdsps4hdr2)) | Meta a 2 o 3 años | Python, SQL, APIs, ML clásico, LLM y embeddings, RAG, Evaluación |
| L3 | AI Deployment Engineer, Getnet ([Greenhouse](https://job-boards.eu.greenhouse.io/getnet/jobs/5019637101)) | Meta a 2 o 3 años | Agentes, Multiagente, Guardrails, MCP, Observabilidad, RAG, Evaluación |

- Son 15 estaciones distintas. SQL y APIs unen L1 con L2; RAG y Evaluación unen L2 con L3.
- **Contenido nuevo:** 8 estaciones (Git, Datos, SQL, APIs, Pruebas, Python, ML clásico, LLM y embeddings).
- **Contenido que se adapta:** las 7 de Getnet. Sus ideas clave pasan a ser pasos, sus 3 preguntas se conservan y se agregan 3 por estación.
- En total: 90 preguntas, de las cuales 21 ya existen.
- La vacante de UBK pide de 3 a 5 años de experiencia. La línea lo dice y se presenta como mapa de lo que hay que aprender, no como vacante para aplicar hoy.
- De las vacantes solo se guarda lo necesario para estudiar: puesto, empresa, lugar, lo que piden y el enlace. No se copian correos ni datos de contacto.
- Las vacantes caducan. Cada línea muestra «leída el…» y el enlace puede dejar de funcionar sin romper la línea.

## Reglas de aprendizaje

Todas son funciones puras en `js/core.js`, con pruebas.

### Repetición espaciada

Cada ítem vive en una caja del 0 al 5. La caja 0 significa «sin ver».

| Caja | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| Vuelve a salir en | 1 día | 3 días | 7 días | 16 días | 35 días |

- **Acierto:** sube una caja (máximo 5) y se programa según la tabla.
- **Error:** baja a la caja 1 y vuelve mañana. Además se repite una vez al final de la misma sesión; esa repetición no cambia la caja.
- Un ítem atrasado no pierde caja. Faltar unos días no castiga.

### Avance

- **Peso de cada caja:** 0, 0.4, 0.6, 0.8, 0.9 y 1, para las cajas 0 a 5. El primer acierto da un salto grande y consolidar suma el resto.
- **Avance de una estación:** el promedio del peso de sus 6 ítems.
- **«% listo» de una línea:** el promedio del avance de sus estaciones.
- **Estación visitada:** sus 6 ítems están en caja 1 o más. En el mapa se dibuja rellena.

Como las cajas altas tardan días, el porcentaje sigue subiendo durante semanas. Esa es la razón para volver.

### Atajo «ya sé esto»

Cada estación sin empezar ofrece una prueba rápida con sus 2 preguntas de aplicación. Si aciertas las dos, los 6 ítems pasan a la caja 3 y vuelven en 7 días. Si fallas alguna, la estación se estudia normal y esas respuestas cuentan como cualquier otra.

### Sesión

`buildSession(estado, hoy)` arma 5 tarjetas:

1. Hasta 3 repasos pendientes, primero los más atrasados, de cualquier estación.
2. El resto, pasos nuevos de la estación actual: la primera de la línea meta que tenga pasos sin ver. Un paso nuevo muestra la idea y luego su pregunta, y cuenta como una tarjeta.
3. Si no hay pasos nuevos, se completa con repasos pendientes. Si no hay repasos pendientes, con pasos nuevos, hasta 3.
4. Cuando la línea meta ya no tiene pasos nuevos, siguen las preguntas de aplicación de sus estaciones, y luego los pasos de otras líneas.

Si no hay nada pendiente ni nuevo, Hoy muestra «Estás al día» y cuándo toca el próximo repaso. «Otra sesión» adelanta los repasos más próximos.

### XP y racha

- **XP:** 10 por acierto, 2 por error y 20 por terminar la sesión.
- **Día cumplido:** el día en que terminas al menos una sesión.
- **Racha:** días cumplidos consecutivos hasta hoy o ayer. Un día faltante por semana (de lunes a domingo) no la rompe; se aplica solo y se muestra como «día de descanso».
- Los días se calculan con la fecha local del dispositivo, en formato `AAAA-MM-DD`.

## Estado y sincronización

### En el dispositivo

Una sola clave de `localStorage`, `mapa.v2`:

```js
{
  v: 2,
  goal: "edar-dev-jr",                                   // línea meta
  items: { "sql.2": { b: 3, due: "2026-11-17", t: 1794330000000 } },  // caja, próxima fecha, último cambio
  days: { "2026-11-10": { xp: 64, done: true } }
}
```

- El XP total, el nivel y la racha se calculan a partir de `days`; no se guardan.
- Si `localStorage` no está disponible, el sitio funciona en memoria y avisa que el progreso no se guardará.

### Con cuenta

- Tabla nueva `public.mapa_progreso`: `user_id` (llave primaria), `email`, `state jsonb`, `updated_at`.
- **RLS:** cada quien ve, crea, actualiza y borra su fila. El correo docente (`mapa_admins`) ve todas. El rol anónimo, nada.
- Un check limita `state` a un objeto de menos de 200 KB.
- **Cuándo sincroniza:** al iniciar sesión y al terminar cada sesión de estudio. Lee la fila, la combina con el estado local y guarda el resultado en los dos lados.
- **Cómo combina** (`mergeState`, función pura):
  - por ítem, gana el de `t` más reciente;
  - por día, el XP mayor, y `done` si lo está en cualquiera;
  - la meta, la del estado con el cambio más reciente.
- Si la sincronización falla, el estudio sigue en el dispositivo, aparece un aviso discreto y se reintenta en la siguiente sesión.
- El progreso lo escribe el navegador, así que un alumno podría inflarlo desde la API. Es autoevaluación y solo afecta sus propios datos; se documenta y se retoma al diseñar el ranking.

## Pantallas

El sitio se piensa para teléfono. Hay una barra inferior con tres pestañas: **Hoy**, **Mapa** y **Yo**. Las maquetas aprobadas muestran Hoy, Sesión y Mapa.

1. **Primera visita:** «Elige tu meta», con las tres líneas como tarjetas (puesto, empresa, nivel, número de estaciones). Al elegir, entra a Hoy. Sin correo.
2. **Hoy:**
   - racha y semana (siete puntos, de lunes a domingo);
   - tarjeta de la meta: «% listo», estaciones que faltan y la línea en miniatura con la estación actual;
   - botón grande «Sesión de hoy», con lo que trae («5 min · 3 repasos · 1 paso nuevo de SQL»);
   - otras líneas donde ya hay avance, con su porcentaje.
3. **Sesión:** pantalla completa, sin barra inferior.
   - Barra de 5 segmentos y «✕ Salir». Salir a media sesión conserva lo ya respondido.
   - Tarjeta de idea: la idea y «Entendido».
   - Tarjeta de pregunta: etiqueta («Repaso · SQL» o «Nuevo · SQL»), pregunta y 4 opciones; teclas 1 a 4.
   - Al responder: se marca la correcta, aparece «Correcto» o «Casi» con la explicación, el XP y cuándo vuelve a salir. Luego «Siguiente».
   - Cierre: XP ganado, racha, cuánto subió el «% listo», estación visitada si la hubo, y cuántos repasos tocan mañana. Botones «Listo» y «Otra sesión».
4. **Mapa:** las líneas dibujadas como mapa de transporte en SVG, con las coordenadas de cada línea.
   - Estación visitada, rellena; estación actual, resaltada; estación compartida, con doble punto.
   - Tocar una estación abre su página. Debajo, la lista de líneas con su porcentaje, que también sirve a lectores de pantalla.
   - Se usa el lenguaje genérico de los mapas de transporte (líneas de color, estaciones, transbordos), sin logotipos ni iconografía de ningún sistema real.
5. **Línea:** ficha de la vacante (lo que pide, nivel, enlace, «leída el…»), sus estaciones en orden con el avance de cada una y el botón «Elegir como meta».
6. **Estación:** qué es, para qué sirve, los pasos ya vistos (los no vistos aparecen como «por descubrir»), el ejercicio, los recursos, el glosario y el avance. Si no se ha empezado, ofrece el atajo «ya sé esto».
7. **Yo:**
   - nivel, XP total y racha más larga;
   - cambiar de meta;
   - cuenta opcional: «Guarda tu progreso en la nube» con correo y enlace mágico, o el correo de la sesión y «Cerrar sesión»;
   - «Descubre tu área»: el cuestionario actual y, con cuenta, Mis respuestas;
   - «Borrar mis datos»: borra el progreso del dispositivo y, con cuenta, la fila de `mapa_progreso`. Confirmación en dos pasos;
   - Vista docente, solo para el correo docente.
8. **Vista docente:** se agrega una tabla de progreso por alumno: correo, meta, «% listo» de la meta, racha, XP y último día de estudio. Usa el filtro por correo que ya existe.

### Cuestionario actual

- Se puede hacer sin cuenta. El resultado se guarda en Supabase solo si hay sesión; sin sesión, el aviso dice que no se guardó y ofrece crear cuenta.
- El panel «Una vacante real para tus áreas» lista las líneas cuyas `areas` coinciden y ofrece «Elegir como meta».
- Las pantallas de ruta, diagnóstico y lección de la versión anterior se retiran: las reemplazan Línea, el atajo y Estación.

## Lenguaje visual

- **Idea:** mapa de transporte sobre papel. Cada vacante es una línea de color; cada habilidad, una estación.
- **Color:** papel cálido claro, tinta casi negra, resaltador amarillo para lo que está activo y un color por línea (verde, magenta y azul). Tema oscuro con los mismos papeles.
- **Tipografía:** se conservan Bricolage Grotesque para títulos, IBM Plex Sans para texto e IBM Plex Mono para etiquetas.
- **Movimiento:** breve y con función (avance de la barra, aparición de la explicación). Se respeta `prefers-reduced-motion`.
- **Accesibilidad:** el acierto y el error se dicen con texto, no solo con color; la explicación se anuncia con `aria-live`; todo funciona con teclado; objetivos táctiles de 44 px como mínimo; sin scroll horizontal a 390 px.

## Estructura de archivos

Sigue sin build: archivos estáticos que Vercel sirve tal cual.

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Estructura de la página y carga de los scripts |
| `css/app.css` | Estilos y tokens |
| `js/data-areas.js` | `AREAS`, `SETS` y `GLOSS` (lo que hoy está en el bloque DATA) |
| `js/data-estaciones.js` | `ESTACIONES` |
| `js/data-lineas.js` | `LINEAS` |
| `js/core.js` | Reglas puras: cajas, avance, sesión, XP, racha, combinación de estados y puntaje del cuestionario |
| `js/store.js` | `localStorage` y sincronización con Supabase |
| `js/ui.js` | Utilidades de interfaz (`el`, navegación, barra inferior) |
| `js/pantallas-*.js` | Una por grupo de pantallas: estudio (Hoy y Sesión), mapa (Mapa, Línea y Estación), cuenta (Yo y docente) y cuestionario |

Son scripts clásicos, no módulos, para que el sitio también abra desde `file://` en las pruebas. Los archivos de datos y `core.js` exportan con `module.exports` cuando corren en Node.

## Errores y casos límite

- **Reloj del dispositivo cambiado o viaje entre zonas horarias:** un día puede contar doble o no contar. Se acepta; no hay validación en servidor.
- **Estado local corrupto o de otra versión:** se ignora, se empieza de cero y se avisa. No se borra hasta que haya un estado nuevo que guardar.
- **Ítems guardados que ya no existen en el contenido:** se ignoran al calcular y se conservan al combinar.
- **Meta que ya no existe:** se pide elegir otra.
- **Dos dispositivos sin cuenta:** cada uno tiene su progreso. Al iniciar sesión en ambos, se combinan.
- **Privacidad:** el aviso se reescribe. Sin cuenta, nada sale del dispositivo. Con cuenta, se guardan el correo, las respuestas del cuestionario y el progreso de estudio; el profesor puede verlos; todo se puede borrar desde Yo.

## Pruebas

- **Lógica** (`node --test`), sobre `core.js` y los datos:
  - cajas: acierto, error y tope en 5;
  - avance de estación y de línea, incluida una estación compartida;
  - `buildSession`: mezcla de repasos y pasos, orden por atraso, caso sin pendientes y caso sin nada;
  - XP, día cumplido y racha, con el día de descanso y el cambio de semana;
  - `mergeState`: gana el más reciente por ítem, máximo por día, ítems desconocidos conservados;
  - atajo: dos aciertos llevan los 6 ítems a la caja 3;
  - integridad: 15 estaciones con 4 pasos y 2 preguntas extra, ids únicos, 4 opciones, URLs `https`, cada estación de cada línea existe y tiene coordenadas, y la prueba de longitud de las opciones.
- **Flujo** (Playwright con el Supabase falso), todo sin cuenta salvo donde se indica:
  1. primera visita → elegir meta → sesión completa con teclado → cierre con XP y racha de 1;
  2. recargar la página → el progreso sigue ahí;
  3. un error se repite al final de la sesión;
  4. con el reloj adelantado un día (`page.clock`), aparecen los repasos y la racha sube a 2;
  5. Mapa → tocar una estación compartida → su avance cuenta en las dos líneas;
  6. atajo «ya sé esto» con dos aciertos;
  7. iniciar sesión → el progreso local se combina con el remoto y se guarda;
  8. falla de sincronización → el estudio sigue y hay aviso;
  9. vista docente con el progreso de otro alumno;
  10. cuestionario sin cuenta, y panel de líneas en el resultado;
  11. borrar mis datos;
  12. 390 y 1280 px, tema claro y oscuro, sin scroll horizontal.
- **Supabase real:** migración aplicada, políticas comprobadas en una transacción con rollback, y advisors de seguridad sin avisos nuevos.

## Criterios de éxito

1. Una persona nueva puede abrir el sitio, elegir meta y terminar su primera sesión sin dar su correo, en menos de 6 minutos.
2. Al volver al día siguiente encuentra repasos pendientes, su racha y un «% listo» mayor que el de ayer al terminar.
3. Lo aprendido en una estación compartida se refleja en todas las líneas que pasan por ella.
4. Con cuenta, el progreso aparece en otro dispositivo y Axel lo ve en la vista docente.
5. Agregar una línea requiere un objeto en `js/data-lineas.js` y, si trae estaciones nuevas, sus objetos en `js/data-estaciones.js`.
6. Todas las pruebas pasan y los advisors de seguridad no muestran avisos nuevos.
