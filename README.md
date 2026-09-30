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

## Desplegar

Con cualquiera de estas opciones, el sitio queda en una URL pública:

1. Crea un proyecto nuevo en Vercel llamado `mapa-de-areas` y sube la carpeta con `index.html` (arrastrando la carpeta al panel o con `vercel deploy --prod` dentro de esta carpeta). No necesita framework ni comando de build.
2. No lo subas al proyecto `pilates-project`, porque reemplazaría BersamaFlow.

Para usarlo en un subdominio de bersama.dev, agrega el dominio al proyecto nuevo en Vercel y crea el registro DNS que Vercel te indique en el proveedor donde administras bersama.dev.

## Antes de que lo usen los alumnos

1. En Supabase, Authentication, URL Configuration, agrega la URL final del sitio en Redirect URLs. No cambies el Site URL, porque lo usa el laboratorio.
2. Configura un SMTP propio (por ejemplo Resend) en Authentication. El envío de correos que trae Supabase por defecto está muy limitado por hora y un grupo completo lo agotaría.
3. Revisa el texto de privacidad de la pantalla de acceso y ajústalo a lo que quieras prometer.
