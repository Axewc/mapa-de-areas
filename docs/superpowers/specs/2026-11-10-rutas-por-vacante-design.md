# Rutas por vacante: diseño

Fecha: 10 nov 2026 · Estado: aprobado en conversación, pendiente de revisión escrita

## Objetivo

Que el mapa, además de sugerir áreas, enseñe los temas que pide una vacante real. La primera ruta es la vacante **AI Deployment Engineer de Getnet** (Ciudad de México, híbrido; [publicación](https://job-boards.eu.greenhouse.io/getnet/jobs/5019637101)), y sirve para probar la idea antes de agregar más vacantes.

### Lo que pidió Axel

- Un apartado para aprender los temas, empezando por esta vacante.
- Forma: «Rutas por vacante». Eliges una vacante, haces un diagnóstico corto y cada tema trae su lección.
- El progreso se guarda en Supabase y se ve en la vista docente.
- Enfoque A: todo dentro de `index.html`, sin build.
- Reactivar el proyecto `fbd-lab-tracker` de Supabase, que estaba pausado.

### Supuestos (corregibles)

- Lo usan los alumnos, no solo Axel.
- No se agrega una décima área al cuestionario. Los intentos guardados en `mapa_respuestas` siguen siendo comparables.
- Los ejercicios usan Python y opciones gratuitas (modelos locales, capas gratuitas de proveedores o embeddings locales). No dependen de un proveedor en particular.

## Alcance

**Entra:**
- Bloque de datos `RUTAS` con una ruta (Getnet, 7 temas).
- Pantallas de ruta, diagnóstico y tema.
- Panel de entrada en el resultado del cuestionario y un botón en el inicio.
- La tabla `mapa_aprendizaje` con RLS.
- Una sección en la vista docente.
- Borrar el propio progreso de una ruta.
- Pruebas y README.

**No entra:**
- Generar rutas con un LLM a partir de una vacante pegada (enfoque C).
- Rutas en archivos aparte (enfoque B).
- Una décima área.
- Notificaciones o recordatorios.
- Editar rutas desde la interfaz.

## Datos de la ruta

Las rutas viven en `index.html`, dentro de `//DATA-START … //DATA-END`, junto a `AREAS`, para que las pruebas las puedan extraer. Agregar una vacante significa agregar un objeto.

```js
var RUTAS = {
  "getnet-ai-deploy": {
    title: "AI Deployment Engineer",
    company: "Getnet",
    place: "Ciudad de México · híbrido",
    url: "https://job-boards.eu.greenhouse.io/getnet/jobs/5019637101",
    seen: "2026-11-10",          // fecha en que se leyó la vacante
    areas: ["ml", "bak", "inf"], // claves de AREAS que conectan con la ruta
    summary: "…",                 // qué hace el puesto, en dos frases
    asks: ["…"],                  // lo que la vacante pide de la persona
    topics: [ /* 7 temas */ ]
  }
};
```

Cada tema:

```js
{
  id: "rag",                    // único dentro de la ruta; se guarda en Supabase
  name: "RAG",
  plain: "…",                   // qué es, en una frase sin jerga
  why: "…",                     // por qué le importa a una empresa de pagos
  ideas: ["…", "…", "…"],       // 3 o 4 ideas clave
  task: { n: "…", d: "…", t: "1 tarde" }, // ejercicio, con el mismo formato que los proyectos de AREAS
  res: [{ n: "…", u: "https://…" }],      // 2 o 3 recursos, verificados
  diag: { q: "…", opts: ["…", "…", "…", "…"], ok: 2, why: "…" },  // pregunta del diagnóstico
  review: [ { q, opts, ok, why }, { q, opts, ok, why } ]          // 2 preguntas de repaso
}
```

### Temas de la ruta Getnet

Son los siete que lista la vacante, en este orden:

| id | Tema | Idea central |
| --- | --- | --- |
| `agentes` | Orquestación de agentes | Un LLM que decide qué herramienta usar, la usa, mira el resultado y repite hasta terminar, con un límite de pasos |
| `multiagente` | Sistemas multiagente | Un orquestador que reparte subtareas entre agentes especializados y une sus resultados; cuesta más tokens y solo conviene cuando la tarea se divide bien |
| `evaluacion` | Evaluación y monitoreo de modelos | Un conjunto fijo de casos con su forma de calificar (código, otro modelo o una persona), que se corre antes de cada cambio |
| `guardrails` | Guardrails y seguridad | Validar lo que entra y lo que sale del modelo: inyección de instrucciones, datos sensibles (tarjetas), límites numéricos y aprobación humana |
| `rag` | RAG | Buscar primero los fragmentos relevantes de tus documentos y dárselos al modelo para que responda con ellos y los cite |
| `mcp` | MCP | Un estándar para conectar un modelo con herramientas y datos: escribes el servidor una vez y lo usa cualquier cliente compatible |
| `observabilidad` | Observabilidad y métricas | Registrar cada llamada (latencia, tokens, costo, errores, herramienta usada) para saber qué pasó y cuánto cuesta |

**Recursos verificados** (se asignan por tema al implementar):
- Agentes: [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents).
- Multiagente: [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system).
- Evaluación: [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).
- Guardrails: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/).
- RAG: [Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) y el artículo original de [Lewis et al., 2020](https://arxiv.org/abs/2005.11401).
- MCP: [Build an MCP server](https://modelcontextprotocol.io/docs/develop/build-server).
- Observabilidad: [Convenciones de OpenTelemetry para IA generativa](https://opentelemetry.io/docs/specs/semconv/gen-ai/).

## Puntaje y estado de cada tema

Son funciones puras dentro de `DATA-START … DATA-END`:

- **`scoreDiag(ruta, answers)`:** `answers[i]` es el índice elegido en la pregunta del tema `i`. El índice `opts.length` significa «Aún no lo sé». Devuelve `{ topicId: 1 | 0 }`, y «Aún no lo sé» cuenta 0.
- **`scoreReview(topic, answers)`:** devuelve `{ [topic.id]: aciertos }`, con valores de 0 a 2.
- **`topicStatus(ruta, rows)`:** recibe las filas del usuario en `mapa_aprendizaje` para esa ruta y devuelve, por tema, uno de tres estados:
  - `nuevo`: no hay evidencia del tema.
  - `dominado`: la evidencia más reciente del tema es un diagnóstico acertado o un repaso con 2 de 2.
  - `pendiente`: la evidencia más reciente no llega a eso.

  También devuelve el detalle de esa última evidencia, para mostrar textos como «Último repaso: 1 de 2». Por evidencia del tema se entiende una fila `diagnostico`, que siempre trae todos los temas, o una fila `repaso` de ese tema. Gana la más reciente por `created_at`.
- **`rutasFor(topKeys)`:** devuelve las rutas cuyas `areas` incluyen alguna de las claves del top 3 del cuestionario.

## Pantallas

Siguen el patrón actual: una sección por pantalla, `show(name)`, `el()` para construir nodos y el mismo estilo de cuaderno. La sección nueva es `<section id="s-learn">`, y en ella se dibujan la ruta, el diagnóstico y los temas.

1. **Entradas**
   - En el inicio, con sesión, un botón «Aprender para una vacante». Abre la ruta directamente, porque por ahora solo hay una. Con varias, abre una lista.
   - En el resultado del cuestionario, si `rutasFor(top3)` no está vacío, va un panel después de las tarjetas de áreas: «Una vacante real para tus áreas», con el título, la empresa y un botón «Ver qué piden y aprenderlo».
2. **Ruta**
   - Ficha con el título, la empresa, el lugar, el resumen, lo que pide la vacante, el enlace a la publicación y la fecha en que se leyó.
   - Botón «Hacer el diagnóstico» o «Repetir el diagnóstico», con la nota «7 preguntas · 4 minutos · sí hay respuestas correctas».
   - Lista de los 7 temas con su estado (*Sin evaluar*, *Por aprender* o *Ya lo dominas*). Cada tema abre su lección. Después de un diagnóstico, los temas pendientes van primero.
   - Al final, «Borrar mi progreso en esta ruta», con confirmación en dos clics como en Mis respuestas.
3. **Diagnóstico**
   - Usa el mismo mecanismo que el cuestionario: barra de avance, teclas 1 a 5 y «← Atrás».
   - Cada pregunta trae sus 4 opciones más «Aún no lo sé».
   - Al terminar se guarda la fila. Luego se muestra «Dominas X de 7» y, por tema, si acertaste y la explicación (`why`). Al final hay un botón para volver a la ruta.
4. **Tema**
   - Muestra el nombre y su estado, «Qué es», «Por qué le importa a una empresa de pagos», las ideas clave, el ejercicio con su tiempo estimado y los recursos (enlaces externos con `rel="noopener"`).
   - Al final, «Repaso: 2 preguntas». Al responder se marca cuál era la correcta, se muestra la explicación y se guarda una fila `repaso`.
   - El glosario existente (`glossFor`) se aplica al texto del tema. Se agregan los términos nuevos que hagan falta (LLM, token, embedding, prompt).

## Supabase

Antes de escribir la migración, se leen las políticas reales de `mapa_respuestas` (`pg_policies`) y la forma de comprobar quién es docente. La tabla nueva copia ese patrón.

```sql
create table public.mapa_aprendizaje (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  email text not null default (auth.jwt() ->> 'email'),
  created_at timestamptz not null default now(),
  ruta text not null check (char_length(ruta) between 1 and 64),
  kind text not null check (kind in ('diagnostico', 'repaso')),
  topic text check (topic is null or char_length(topic) between 1 and 64),
  answers jsonb not null,
  scores jsonb not null,
  check ((kind = 'repaso') = (topic is not null))
);
create index on public.mapa_aprendizaje (user_id, ruta, created_at desc);
alter table public.mapa_aprendizaje enable row level security;
```

**Políticas** (las mismas reglas que `mapa_respuestas`):
- Cada alumno puede ver, crear y borrar solo sus propias filas. Al insertar, `user_id` debe ser `auth.uid()` y `email` el del JWT.
- El correo docente, el que está en `mapa_admins`, puede ver todas las filas.
- El rol anónimo no puede hacer nada.
- No hay política de `update`: las filas solo se agregan.

Después de aplicarla se corren los advisors de seguridad de Supabase.

## Vista docente

Debajo de la lista actual va una sección «Rutas por vacante», que usa el mismo filtro por correo. Cada fila muestra el correo, la fecha, la ruta, el tipo y el resultado: «Domina 4 de 7» en un diagnóstico, o «RAG: 2 de 2» en un repaso. Al desplegar una fila de diagnóstico se ve el detalle por tema.

## Errores y casos límite

- **Sin sesión:** las entradas solo aparecen con sesión. Si la sesión expira y falla el guardado, se muestra el mismo aviso que en el cuestionario («No se pudo guardar… (motivo)»), y la pantalla sigue mostrando el resultado.
- **Falla al cargar el progreso:** la ruta se muestra con todos los temas en *Sin evaluar* y un aviso.
- **Filas con temas que ya no existen en la ruta** (si se edita el contenido): se ignoran.
- **Privacidad:** el texto de la pantalla de acceso se actualiza para decir que también se guardan los diagnósticos y repasos, y que se pueden borrar desde la ruta.

## Pruebas

- **Lógica:** `tests/logic.test.mjs` con `node --test`, sin dependencias. Extrae el bloque `DATA-START … DATA-END` y prueba:
  - `scoreDiag`, incluido «Aún no lo sé».
  - `scoreReview`.
  - `topicStatus`: la evidencia más reciente gana, un repaso 2 de 2 domina y un tema sin filas queda `nuevo`.
  - `rutasFor`.
  - Integridad del contenido: 7 temas con ids únicos, `ok` dentro de rango, 2 repasos por tema y URLs `https`.
- **Flujo:** `tests/e2e.cjs` con Playwright (ya instalado). Sirve `index.html` en local y reemplaza `supabase-js` por un cliente falso en memoria, con sesión iniciada y una tabla. Recorre este camino:
  1. inicio → ruta → diagnóstico completo con teclado → resultado guardado;
  2. un tema → repaso → estado *Ya lo dominas*;
  3. volver a la ruta → borrar progreso;
  4. resultado del cuestionario → aparece el panel de la vacante.

  Toma capturas a 390 px y a 1280 px para revisar que no haya scroll horizontal.
- **Contra el Supabase real:** después de la migración, un `select` en `pg_policies` confirma que las políticas existen, y los advisors de seguridad no muestran avisos nuevos.

## Criterios de éxito

1. Un alumno con sesión puede entrar a la ruta desde el inicio o desde su resultado, hacer el diagnóstico, abrir un tema, hacer su repaso y ver cómo cambia el estado. Todo queda guardado en `mapa_aprendizaje`.
2. Axel ve esas filas en la vista docente, y un alumno no ve las de otro.
3. Agregar una segunda vacante solo requiere agregar un objeto a `RUTAS`.
4. Las pruebas de lógica y de flujo pasan, y los advisors de seguridad no muestran avisos nuevos.
