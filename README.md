# Mapa de áreas

Página estática (un solo `index.html`) que usa Supabase para el acceso por correo y para guardar los intentos.

## Qué ya está hecho en Supabase (proyecto fbd-lab-tracker)

- `public.mapa_respuestas`: un renglón por intento (usuario, correo, fecha, respuestas, puntajes). RLS activado.
- `public.mapa_admins`: correos con vista docente. Hoy solo `axewcasas@gmail.com`.
- Políticas: cada alumno ve, crea y borra solo sus intentos. El correo docente ve todos. El rol anónimo no ve nada. No se puede insertar un intento a nombre de otra persona.

Para agregar otro docente:

```sql
insert into public.mapa_admins (email) values ('correo@ejemplo.com');
```

## Dos versiones del cuestionario

- Versión 2, «Explorar»: preguntas sobre actividades cotidianas, sin nombres de herramientas. Es la recomendada para quien apenas decide.
- Versión 1, «Con herramientas»: menciona Python, Docker, Power BI, etc., y explica cada término junto a la pregunta.

Ambas tienen 10 preguntas de 5 opciones y puntúan las mismas nueve áreas, así que los intentos son comparables. La versión se guarda en `quiz_version` (1 o 2) y aparece en Mis respuestas y en la vista docente. Las áreas y sus proyectos están en el bloque `AREAS` de `index.html`.

## Rutas por vacante

Una ruta toma una vacante real y enseña los temas que pide. La primera es **AI Deployment Engineer de Getnet**, con siete temas: agentes, multiagente, evaluación, guardrails, RAG, MCP y observabilidad.

- **Entradas:** el botón «Aprender para una vacante» en el inicio. También aparece un panel en el resultado del cuestionario cuando alguna de las tres primeras áreas está en `areas` de la ruta.
- **Diagnóstico:** una pregunta por tema, con respuesta correcta y la opción «Aún no lo sé».
- **Lección:** cada tema trae qué es, por qué le importa a una empresa de pagos, ideas clave, un ejercicio de una tarde, recursos y un repaso de 2 preguntas.
- **Estado de cada tema:** decide la evidencia más reciente. Un diagnóstico acertado o un repaso con 2 de 2 lo dejan como *Ya lo dominas*.
- **Datos:** se guardan en `public.mapa_aprendizaje`, una fila por diagnóstico o repaso. Las políticas son las mismas que las de `mapa_respuestas`: cada quien crea, ve y borra lo suyo, y el docente ve todo. No hay `update`. El SQL aplicado está en `sql/mapa_aprendizaje.sql`.
- **Vista docente:** la sección «Rutas por vacante» lista diagnósticos y repasos y usa el mismo filtro por correo.

Para agregar una vacante, agrega un objeto a `RUTAS` en `index.html`, dentro del bloque `//DATA-START … //DATA-END`:

- Copia la forma de `getnet-ai-deploy`: `title`, `company`, `place`, `url`, `seen`, `areas`, `summary`, `asks` y `topics`.
- Cada tema lleva `id`, `name`, `plain`, `why`, `ideas`, `task`, `res`, `diag` y `review`.
- `areas` usa las claves de `AREAS`.
- No cambies los `id` de temas que ya tengan progreso guardado.

El diseño y el plan están en `docs/superpowers/`.

## Pruebas

```sh
node --test tests/logic.test.mjs   # puntaje, estado de cada tema e integridad del contenido
node tests/e2e.cjs                 # flujo completo en Chromium con un Supabase falso (tests/fake-supabase.js)
SHOTS_DIR=/tmp/capturas node tests/e2e.cjs   # además guarda capturas a 390 y 1280 px, claro y oscuro
```

## Desplegar

Con cualquiera de estas opciones, el sitio queda en una URL pública:

1. Crea un proyecto nuevo en Vercel llamado `mapa-de-areas` y sube la carpeta con `index.html` (arrastrando la carpeta al panel o con `vercel deploy --prod` dentro de esta carpeta). No necesita framework ni comando de build.
2. No lo subas al proyecto `pilates-project`, porque reemplazaría BersamaFlow.

Para usarlo en un subdominio de bersama.dev, agrega el dominio al proyecto nuevo en Vercel y crea el registro DNS que Vercel te indique en el proveedor donde administras bersama.dev.

## Antes de que lo usen los alumnos

1. En Supabase, Authentication, URL Configuration, agrega la URL final del sitio en Redirect URLs. No cambies el Site URL, porque lo usa el laboratorio.
2. Configura un SMTP propio (por ejemplo Resend) en Authentication. El envío de correos que trae Supabase por defecto está muy limitado por hora y un grupo completo lo agotaría.
3. Revisa el texto de privacidad de la pantalla de acceso y ajústalo a lo que quieras prometer.
4. En el plan gratuito, Supabase pausa el proyecto después de unos días sin uso. Mientras está pausado, nadie puede entrar ni guardar. Si el sitio deja de enviar enlaces o de guardar, revisa en el panel de Supabase que `fbd-lab-tracker` esté activo.
