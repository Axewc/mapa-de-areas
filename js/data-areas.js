// Datos y lógica pura: AREAS, SETS, GLOSS (glosario de todo el sitio), MAXP, scoreAnswers.
var AREAS = {
  "dat": {
    "name": "Analítica e ingeniería de datos",
    "short": "Reúnes datos de sistemas distintos, los limpias, los modelas en bases de datos y armas tableros para que una empresa decida con ellos.",
    "ask": "¿Qué parte de tu semana se va en limpiar datos y cuánta en analizarlos?",
    "courses": "Bases de datos, Estructuras de datos, Estadística.",
    "projects": [
      {
        "n": "Tablero de tus propios gastos",
        "d": "Junta los gastos del último mes en una hoja, limpia los datos y arma un tablero (Power BI o Looker Studio, ambos gratis) que conteste: ¿en qué se me va el dinero?",
        "t": "1 fin de semana"
      },
      {
        "n": "Preguntas a datos abiertos de México",
        "d": "Baja un conjunto de datos de datos.gob.mx o del INEGI (transporte, población, precios), hazle tres preguntas con SQL y muestra las respuestas en gráficas.",
        "t": "2 semanas"
      },
      {
        "n": "Base de datos de algo que te importe",
        "d": "Diseña las tablas de un torneo, tu biblioteca o tu equipo favorito en PostgreSQL y escribe diez consultas que respondan cosas interesantes.",
        "t": "2 semanas"
      }
    ]
  },
  "ml": {
    "name": "Ciencia de datos y aprendizaje automático",
    "short": "Entrenas y evalúas modelos que predicen o clasifican, y verificas que sigan funcionando fuera del cuaderno donde nacieron.",
    "ask": "¿Cuánto de tu trabajo es modelar y cuánto es conseguir buenos datos y llevar el modelo a producción?",
    "courses": "Probabilidad, Álgebra lineal, Inteligencia artificial, Estadística.",
    "projects": [
      {
        "n": "Tu primer modelo, con guía",
        "d": "Haz el curso gratis \"Intro to Machine Learning\" de Kaggle y entrena un modelo que prediga precios de casas. No hace falta entender todo a la primera.",
        "t": "1 semana"
      },
      {
        "n": "Un clasificador con tus propias fotos",
        "d": "Junta unas 100 fotos de dos cosas (tacos y tortas, perros y gatos), entrena un modelo en Teachable Machine y averigua cuándo se equivoca y por qué.",
        "t": "1 fin de semana"
      },
      {
        "n": "Reproduce un resultado",
        "d": "Elige un artículo de divulgación con código público, corre su ejemplo y anota qué cambia cuando modificas los datos.",
        "t": "2 semanas"
      }
    ]
  },
  "bak": {
    "name": "Desarrollo backend",
    "short": "Construyes lo que no se ve: APIs, reglas de negocio y bases de datos, cuidando que la aplicación responda rápido y sin errores.",
    "ask": "¿Cómo deciden en tu equipo qué se arregla primero cuando algo falla en producción?",
    "courses": "Estructuras de datos, Ingeniería de software, Bases de datos, Sistemas operativos.",
    "projects": [
      {
        "n": "Una API de tareas",
        "d": "Una API es la ventanilla con la que otros programas le piden cosas al tuyo. Haz una que guarde y devuelva tareas, con FastAPI o Spring Boot y una base de datos.",
        "t": "2 semanas"
      },
      {
        "n": "Un bot de Telegram o Discord útil",
        "d": "Que te recuerde fechas de entrega o consulte el clima. Es backend real con un resultado que ves de inmediato.",
        "t": "1 fin de semana"
      },
      {
        "n": "Pruebas para lo que ya hiciste",
        "d": "Toma un proyecto de una materia, escríbele pruebas automáticas y súbelo a GitHub con un README que otra persona pueda seguir.",
        "t": "1 semana"
      }
    ]
  },
  "web": {
    "name": "Desarrollo full-stack y producto",
    "short": "Conviertes una idea en una aplicación que alguien usa: interfaz, lógica y despliegue, cuidando cómo se siente usarla.",
    "ask": "¿Quién decide qué se construye y cómo saben si funcionó?",
    "courses": "Ingeniería de software, Bases de datos.",
    "projects": [
      {
        "n": "Página de un club de la Facultad",
        "d": "Horarios y eventos con HTML y CSS, publicada gratis en Vercel. Es el proyecto más corto para tener algo real en internet.",
        "t": "1 fin de semana"
      },
      {
        "n": "Una app pequeña con usuarios reales",
        "d": "Una lista de pendientes compartida o un buscador de tiendas con React. Pídele a cinco personas que la usen y anota qué les confunde.",
        "t": "3 semanas"
      },
      {
        "n": "Rediseña algo que te frustre",
        "d": "Elige un trámite o sistema que uses, dibuja en Figma cómo lo harías y explica cada cambio.",
        "t": "1 semana"
      }
    ]
  },
  "rsk": {
    "name": "Riesgos, seguros y finanzas cuantitativas",
    "short": "Usas probabilidad y programación para estimar pérdidas posibles, como lo que costaría un sismo o un huracán a una aseguradora, y ayudas a decidir cuánto riesgo se acepta y a qué precio.",
    "ask": "¿Cómo le explican el modelo a un comité que no es técnico?",
    "courses": "Probabilidad, Estadística, Simulación, Bases de datos.",
    "projects": [
      {
        "n": "Un volado mil veces",
        "d": "Con Python, simula lanzar monedas o dados miles de veces y compara con la probabilidad teórica. Es el mismo truco (Monte Carlo) con el que se estiman pérdidas.",
        "t": "1 fin de semana"
      },
      {
        "n": "Sismos en México",
        "d": "Baja el catálogo del Servicio Sismológico Nacional y calcula cuántos sismos grandes ocurren por región y por año.",
        "t": "2 semanas"
      },
      {
        "n": "¿Cuánto cuesta asegurar algo?",
        "d": "Inventa un seguro sencillo (celular, bicicleta), estima con datos cuánto pagaría en promedio y qué precio cobrarías para no perder.",
        "t": "2 semanas"
      }
    ]
  },
  "con": {
    "name": "Consultoría tecnológica",
    "short": "Entras a empresas distintas, entiendes su problema, propones una solución técnica y la implementas o la coordinas. Aprendes rápido de muchos sectores.",
    "ask": "¿Cuánto cambia tu proyecto cada seis meses y cuánto puedes elegir tú?",
    "courses": "Ingeniería de software, Bases de datos, Redes de computadoras.",
    "projects": [
      {
        "n": "Diagnóstico de un negocio cercano",
        "d": "Entrevista a la persona dueña de una papelería o cafetería y escribe una página con su problema, tres opciones y tu recomendación.",
        "t": "2 semanas"
      },
      {
        "n": "Explícalo en cinco minutos",
        "d": "Elige un tema de una materia, explícaselo a alguien que no programa y pídele que te diga dónde se perdió.",
        "t": "1 fin de semana"
      },
      {
        "n": "Habla con alguien de una consultora",
        "d": "Busca en LinkedIn a una persona egresada y pregúntale cómo fue su primer año y qué habría querido saber.",
        "t": "1 semana"
      }
    ]
  },
  "sec": {
    "name": "Ciberseguridad",
    "short": "Piensas como atacante para proteger sistemas: buscas vulnerabilidades, revisas configuraciones y ayudas a responder cuando algo sale mal.",
    "ask": "¿Qué parte del trabajo es ofensiva y qué parte es monitoreo y documentación?",
    "courses": "Redes de computadoras, Sistemas operativos, optativas de criptografía.",
    "projects": [
      {
        "n": "Dos semanas de picoCTF",
        "d": "Un CTF es una competencia donde buscas una \"bandera\" escondida en un sistema hecho a propósito. Anota qué aprendiste en cada reto.",
        "t": "2 semanas"
      },
      {
        "n": "¿Cuánto tarda en adivinarse una contraseña?",
        "d": "Aprende cómo se guardan las contraseñas (hash) y escribe un programa que compare una débil con una fuerte.",
        "t": "1 fin de semana"
      },
      {
        "n": "Un laboratorio vulnerable en casa",
        "d": "Monta una máquina virtual hecha para practicar (DVWA o Metasploitable), encuentra una falla y luego corrígela.",
        "t": "3 semanas"
      }
    ]
  },
  "inf": {
    "name": "Infraestructura, nube y DevOps",
    "short": "Haces que el software corra de forma estable: servidores, contenedores, despliegues automáticos, monitoreo y costos en la nube.",
    "ask": "¿Con qué frecuencia tiene el equipo guardias o alertas fuera de horario?",
    "courses": "Sistemas operativos, Redes de computadoras.",
    "projects": [
      {
        "n": "Un servidor Linux de práctica",
        "d": "Monta o renta una máquina Linux barata, conéctate por terminal, instala un servicio sencillo y mantenlo un mes.",
        "t": "1 mes"
      },
      {
        "n": "Empaqueta un proyecto con Docker",
        "d": "Docker es una caja que lleva tu programa con todo lo que necesita para correr igual en cualquier computadora. Empaqueta uno tuyo.",
        "t": "1 semana"
      },
      {
        "n": "Despliegue automático",
        "d": "Configura GitHub Actions para que cada cambio que subas se pruebe y se publique solo.",
        "t": "1 semana"
      }
    ]
  },
  "inv": {
    "name": "Investigación y posgrado",
    "short": "Haces preguntas que todavía no tienen respuesta, diseñas experimentos o demostraciones y publicas. El camino suele pasar por la tesis y una maestría.",
    "ask": "¿Cómo entraste a tu grupo de investigación y cómo se financió tu posgrado?",
    "courses": "Las materias donde quisiste saber más allá del temario.",
    "projects": [
      {
        "n": "Platica con un profesor",
        "d": "Pregunta por su línea de investigación y pide una lectura para un mes.",
        "t": "1 semana"
      },
      {
        "n": "Resume un artículo",
        "d": "Elige un artículo reciente de algo que te guste, léelo en tres pasadas y resúmelo en una página con tus palabras.",
        "t": "2 semanas"
      },
      {
        "n": "Ayudantía o servicio social en un laboratorio",
        "d": "Averigua qué laboratorios reciben estudiantes de quinto semestre y qué te pedirían saber.",
        "t": "1 semana"
      }
    ]
  }
};

// Versión 1: usa nombres de herramientas. Versión 2: solo actividades cotidianas.
var SETS = {
  1: { name: 'Con herramientas', qs: [
  { q: "Tienes un fin de semana libre y ganas de hacer un proyecto propio. ¿Cuál eliges?", opts: [
    { t: "Analizar un conjunto de datos que me intriga y ver qué encuentro", p: {dat: 2, ml: 2, rsk: 1} },
    { t: "Construir una aplicación que otras personas puedan usar", p: {web: 3, bak: 1} },
    { t: "Montar un servidor en casa o automatizar mi entorno de trabajo", p: {inf: 3, sec: 1, bak: 1} },
    { t: "Leer un artículo científico e intentar reproducir sus resultados", p: {inv: 3, ml: 2} },
    { t: "Resolver retos de seguridad tipo CTF", p: {sec: 3, inf: 1} }
  ]},
  { q: "¿Qué parte de un problema te engancha más?", opts: [
    { t: "Encontrar el patrón escondido en los números", p: {ml: 2, dat: 1, rsk: 2, inv: 1} },
    { t: "Diseñar cómo encajan las piezas del sistema", p: {bak: 3, inf: 1, con: 1} },
    { t: "Lograr que a quien lo use le resulte claro y agradable", p: {web: 3, con: 1} },
    { t: "Encontrar dónde se puede romper o abusar", p: {sec: 3, inf: 1} },
    { t: "Explicarlo bien para que otros puedan decidir", p: {con: 3, dat: 1} }
  ]},
  { q: "¿Cómo imaginas un buen día de trabajo?", opts: [
    { t: "Horas de concentración en un problema difícil, casi sin interrupciones", p: {inv: 2, ml: 1, sec: 1, bak: 1} },
    { t: "Conversaciones con gente distinta y problemas nuevos cada semana", p: {con: 3, web: 1} },
    { t: "Con un equipo estable, entregando mejoras a un producto", p: {web: 2, bak: 2, inf: 1} },
    { t: "Vigilando que todo funcione y atendiendo lo que se caiga", p: {inf: 3, sec: 2} },
    { t: "Armando modelos y reportes para que otros tomen decisiones", p: {dat: 2, rsk: 2, con: 1} }
  ]},
  { q: "¿Cómo te llevas con probabilidad, estadística y álgebra?", opts: [
    { t: "Son lo que más disfruto de la carrera", p: {rsk: 3, ml: 3, inv: 2} },
    { t: "Me gustan cuando tienen una aplicación clara", p: {dat: 2, ml: 1, rsk: 1} },
    { t: "Las uso cuando toca, pero prefiero programar", p: {bak: 2, web: 1, inf: 1} },
    { t: "Me atraen más la lógica, los algoritmos y la criptografía", p: {sec: 3, inv: 1, bak: 1} },
    { t: "Las aprobé, pero no es donde quiero estar", p: {web: 2, inf: 2, con: 1} }
  ]},
  { q: "En un proyecto en equipo, ¿qué rol terminas tomando?", opts: [
    { t: "Organizo qué hay que entregar y cuándo", p: {con: 3, web: 1} },
    { t: "Me quedo con la parte técnica más complicada", p: {bak: 2, inv: 1, sec: 1} },
    { t: "Limpio los datos y armo los resultados", p: {dat: 3, ml: 1} },
    { t: "Me encargo de que todo corra y se pueda desplegar", p: {inf: 3, bak: 1} },
    { t: "Hago la interfaz y la presentación", p: {web: 3, con: 1} }
  ]},
  { q: "¿Qué pesa más para ti al elegir un primer trabajo?", opts: [
    { t: "Aprender rápido de muchas industrias", p: {con: 3, dat: 1} },
    { t: "Profundizar en una técnica hasta dominarla", p: {inv: 2, ml: 2, sec: 1} },
    { t: "Una industria grande con carrera clara y estabilidad", p: {rsk: 2, dat: 1, bak: 1, con: 1} },
    { t: "Ver que personas reales usan lo que construyo", p: {web: 3, bak: 1} },
    { t: "Que el trabajo tenga impacto científico o social", p: {inv: 2, ml: 1, rsk: 1, dat: 1} }
  ]},
  { q: "Algo falla y no entiendes por qué. ¿Qué haces primero?", opts: [
    { t: "Reviso registros y trazas hasta ubicar dónde se rompe", p: {bak: 2, inf: 2} },
    { t: "Pruebo con los datos para ver si el problema está en ellos", p: {dat: 3, ml: 1} },
    { t: "Me pregunto cómo podría alguien aprovechar esa falla", p: {sec: 3} },
    { t: "Lo reproduzco en el navegador y reviso qué ve la persona usuaria", p: {web: 3} },
    { t: "Busco el fundamento teórico de lo que debería pasar", p: {inv: 2, ml: 1, rsk: 1} }
  ]},
  { q: "¿Qué sector te da más curiosidad?", opts: [
    { t: "Seguros, banca o finanzas", p: {rsk: 3, dat: 1, con: 1} },
    { t: "Salud, ciencia o educación", p: {inv: 1, ml: 2, dat: 1} },
    { t: "Startups y productos digitales", p: {web: 2, bak: 2} },
    { t: "Gobierno, telecomunicaciones o grandes empresas", p: {con: 2, inf: 1, sec: 1} },
    { t: "Aún no sé, me gustaría probar varios", p: {con: 2, dat: 1}, unsure: true }
  ]},
  { q: "¿Qué abrirías con más ganas mañana?", opts: [
    { t: "Un notebook de Python o un tablero de Power BI", p: {dat: 2, ml: 2} },
    { t: "Un editor con un framework de backend", p: {bak: 3} },
    { t: "La terminal con Docker o Wireshark", p: {inf: 2, sec: 2, bak: 1} },
    { t: "Figma o un proyecto de React", p: {web: 3} },
    { t: "LaTeX o un paquete estadístico", p: {inv: 2, rsk: 2, ml: 1} }
  ]},
  { q: "Dentro de cinco años, ¿qué te gustaría que fuera cierto?", opts: [
    { t: "Soy la persona a quien consultan sobre un tema técnico específico", p: {inv: 1, ml: 1, sec: 1, bak: 1, inf: 1} },
    { t: "Lidero equipos o proyectos", p: {con: 3, web: 1} },
    { t: "Terminé un posgrado", p: {inv: 3, ml: 1, rsk: 1} },
    { t: "Tengo un producto o negocio propio", p: {web: 3, bak: 1, con: 1} },
    { t: "Tomo decisiones con datos en una empresa", p: {dat: 3, rsk: 1, con: 1} }
  ]}
] },
  2: { name: 'Explorar', qs: [
  { q: "Te dan una semana libre y un pretexto para crear algo. ¿Qué te emociona más?", opts: [
    { t: "Descubrir qué patrones hay en algo que me gusta (mis gastos, el futbol, mi música)", p: {dat: 2, ml: 2, rsk: 1} },
    { t: "Hacer una aplicación o página que mis amigos de verdad usen", p: {web: 3, bak: 1} },
    { t: "Armar algo que funcione solo en segundo plano: avisos, respaldos, tareas automáticas", p: {inf: 3, bak: 1} },
    { t: "Investigar cómo funciona algo a fondo, aunque no sirva para nada inmediato", p: {inv: 3, ml: 1} },
    { t: "Intentar “romper” un juego o un candado digital para ver cómo se hace", p: {sec: 3, inf: 1} }
  ]},
  { q: "Un amigo te pide ayuda con un problema. ¿Qué papel te sale natural?", opts: [
    { t: "Ordenar su información en una tabla y mostrarle qué dice", p: {dat: 3, con: 1} },
    { t: "Preguntarle mucho hasta entender qué necesita y proponerle opciones", p: {con: 3, web: 1} },
    { t: "Predecir qué pasará si sigue igual: “si sigues así, en tres meses…”", p: {ml: 2, rsk: 2} },
    { t: "Construirle la herramienta que le resuelva el problema", p: {web: 2, bak: 2} },
    { t: "Revisar qué podría salirle mal y cómo protegerlo", p: {sec: 2, rsk: 2, inf: 1} }
  ]},
  { q: "¿Qué tipo de juego o actividad te absorbe más?", opts: [
    { t: "Rompecabezas y lógica, de los que dejas y retomas al día siguiente", p: {inv: 2, sec: 2, ml: 1} },
    { t: "Administrar recursos: ciudades, equipos o economías", p: {inf: 1, rsk: 2, con: 1, dat: 1} },
    { t: "Estrategia donde calculas probabilidades y riesgos", p: {rsk: 3, ml: 1} },
    { t: "Diseñar y decorar: mundos, personajes, pantallas", p: {web: 3} },
    { t: "Juegos de equipo donde coordinas a los demás", p: {con: 3, web: 1} }
  ]},
  { q: "Cuando algo en tu celular o computadora falla, ¿qué haces?", opts: [
    { t: "Busco qué cambió y lo arreglo yo, aunque tenga que abrir configuraciones raras", p: {inf: 3, bak: 1, sec: 1} },
    { t: "Me pregunto quién podría aprovechar esa falla", p: {sec: 3} },
    { t: "Me molesta que sea confuso de usar y pienso cómo lo haría más claro", p: {web: 3, con: 1} },
    { t: "Leo foros hasta entender la causa de fondo", p: {inv: 2, bak: 2} },
    { t: "Se lo paso a alguien que sepa; prefiero no meterme", p: {con: 1, dat: 1} }
  ]},
  { q: "Te ofrecen leer una sola noticia completa. ¿Cuál eliges?", opts: [
    { t: "Cómo un programa logró predecir el clima o una epidemia", p: {ml: 3, rsk: 1, inv: 1} },
    { t: "Cómo una empresa decidió sus precios según lo que compran sus clientes", p: {dat: 3, con: 1} },
    { t: "Cómo un hackeo filtró datos de millones de personas", p: {sec: 3} },
    { t: "Cuánto le costaría a las aseguradoras un huracán o un sismo grande", p: {rsk: 3, dat: 1} },
    { t: "Cómo una app pequeña llegó a millones de usuarios", p: {web: 2, bak: 2, inf: 1} }
  ]},
  { q: "¿Cómo prefieres aprender algo nuevo?", opts: [
    { t: "Haciéndolo yo, equivocándome y arreglándolo", p: {bak: 2, web: 1, inf: 2} },
    { t: "Leyendo con calma la explicación completa, incluso la demostración", p: {inv: 3, ml: 1, rsk: 1} },
    { t: "Viendo ejemplos con números reales y comparándolos", p: {dat: 2, ml: 1, rsk: 2} },
    { t: "Platicando con alguien que ya lo hace", p: {con: 3, web: 1} },
    { t: "Con un reto de reglas claras y meta clara, como una competencia", p: {sec: 2, ml: 1, inf: 1} }
  ]},
  { q: "¿Qué sientes con los números?", opts: [
    { t: "Me gusta más el dibujo que cuenta lo que dicen: gráficas y tableros", p: {dat: 3, web: 1} },
    { t: "Me gusta deducir con ellos: “¿qué tan probable es que…?”", p: {rsk: 3, ml: 2, inv: 1} },
    { t: "Me gustan cuando son parte de una idea más grande, como una demostración", p: {inv: 3, ml: 1} },
    { t: "Los uso cuando toca, sin más", p: {bak: 1, web: 1, inf: 1} },
    { t: "No son lo mío; prefiero construir cosas", p: {web: 2, inf: 2, con: 1} }
  ]},
  { q: "¿Cómo imaginas una jornada de trabajo ideal?", opts: [
    { t: "Con audífonos, concentrado en algo complicado casi sin interrupciones", p: {inv: 2, sec: 1, bak: 1, ml: 1} },
    { t: "Platicando con gente distinta y cambiando de tema cada semana", p: {con: 3, web: 1} },
    { t: "Con un equipo fijo, sacando mejoras para algo que ya existe", p: {web: 2, bak: 2, inf: 1} },
    { t: "Pendiente de que nada se caiga, listo para atender urgencias", p: {inf: 3, sec: 2} },
    { t: "Con hojas y reportes que ayudan a tomar decisiones importantes", p: {dat: 2, rsk: 2, con: 1} }
  ]},
  { q: "¿Dónde te gustaría que trabajaran tus ideas?", opts: [
    { t: "En algo que use gente común todos los días", p: {web: 3, bak: 1} },
    { t: "En una empresa grande: banco, aseguradora, hospital", p: {rsk: 2, dat: 2, con: 1} },
    { t: "En un laboratorio o universidad, descubriendo cosas nuevas", p: {inv: 3, ml: 1} },
    { t: "En proteger a otras personas de fraudes o ataques", p: {sec: 3, inf: 1} },
    { t: "Aún no sé, prefiero probar un poco de todo", p: {con: 2, dat: 1}, unsure: true }
  ]},
  { q: "Dentro de cinco años, ¿qué te dejaría contento?", opts: [
    { t: "Que me pidan opinión por saber mucho de un tema específico", p: {inv: 1, ml: 1, sec: 1, bak: 1, inf: 1} },
    { t: "Coordinar un proyecto y ver cómo sale", p: {con: 3, web: 1} },
    { t: "Haber estudiado un posgrado", p: {inv: 3, ml: 1, rsk: 1} },
    { t: "Tener mi propio producto o negocio", p: {web: 3, bak: 1, con: 1} },
    { t: "Que las decisiones de mi trabajo se apoyen en lo que yo encontré", p: {dat: 3, rsk: 1, con: 1} }
  ]}
] },
  3: { name: 'Descubre', qs: [
  { q: "Te encuentras con un problema que te deja pensando. ¿Qué parte te engancha más?", opts: [
    { t: "Ordenar toda la información que hay hasta que por fin se entienda", p: {dat: 3} },
    { t: "Descubrir un patrón que sirva para anticipar qué va a pasar", p: {ml: 3, rsk: 2, inv: 1} },
    { t: "Que nadie conozca la respuesta todavía y haya que encontrarla", p: {inv: 3} },
    { t: "Buscar el punto débil por donde alguien podría colarse", p: {sec: 3, inf: 1} },
    { t: "Entender bien a la persona que lo tiene y qué necesita", p: {con: 3, web: 1} }
  ]},
  { q: "Un programa que hiciste deja de funcionar y un asistente de IA te propone un arreglo. ¿Qué haces primero?", opts: [
    { t: "Reviso qué cambió en la conexión o la configuración antes de aceptarlo", p: {inf: 3, sec: 1} },
    { t: "Leo el arreglo línea por línea para ver si la lógica cuadra", p: {bak: 3} },
    { t: "Me fijo si el arreglo deja abierta una puerta que antes estaba cerrada", p: {sec: 3, bak: 1} },
    { t: "Me quedo con la duda de por qué falló, aunque el arreglo funcione", p: {inv: 3} },
    { t: "Reproduzco la falla como la viviría quien usa el programa", p: {web: 3} }
  ]},
  { q: "Tu equipo va a hacer una app para pedir comida en la cafetería de la escuela. ¿Qué parte te gustaría tomar?", opts: [
    { t: "Diseñar las pantallas para que pedir sea claro y rápido", p: {web: 3} },
    { t: "Programar las reglas de precios, pedidos y lo que ya se acabó", p: {bak: 3} },
    { t: "Vigilar que siga en pie a la hora de la comida, cuando todos piden", p: {inf: 3} },
    { t: "Preguntarle a quien atiende qué le complica más el día", p: {con: 3, web: 1} }
  ]},
  { q: "La cafetería ya tiene un año de pedidos guardados. ¿Qué te gustaría hacer con ellos?", opts: [
    { t: "Explicar qué se vendió más cada mes y por qué fue así", p: {dat: 3, inv: 1} },
    { t: "Predecir cuántas tortas habrá que preparar mañana", p: {ml: 3} },
    { t: "Estimar cuánto se pierde un día de lluvia, cuando llegan pocos", p: {rsk: 3, ml: 1} },
    { t: "Buscar si hay una regla general en cómo elige la gente", p: {inv: 3, ml: 1} },
    { t: "Proponerle a la dueña un cambio que le haga ganar más", p: {con: 3, dat: 1} }
  ]},
  { q: "Vas a ayudar con el sistema de inscripciones de tu facultad en la semana de altas y bajas. ¿De qué parte te gustaría encargarte?", opts: [
    { t: "Cuidar que nadie entre con la cuenta de otro ni cambie calificaciones", p: {sec: 3} },
    { t: "Lograr que siga funcionando aunque miles entren a la misma hora", p: {inf: 3, bak: 1} },
    { t: "Asegurar que las reglas de cupo y horarios se cumplan sin errores", p: {bak: 3} },
    { t: "Estimar qué tan probable es una falla y cuánto afectaría", p: {rsk: 3} }
  ]},
  { q: "Una tiendita de tu colonia quiere vender más y te pide ayuda. ¿Por dónde empiezas?", opts: [
    { t: "Platico con la dueña hasta entender cómo funciona su negocio", p: {con: 3} },
    { t: "Calculo cuánto podría perder si las ventas tardan en llegar", p: {rsk: 3} },
    { t: "Le armo una página sencilla donde reciba pedidos en línea", p: {web: 3, bak: 2} },
    { t: "Reviso sus ventas de este año para ver qué le conviene vender", p: {dat: 3, con: 1} }
  ]},
  { q: "En tu próximo proyecto, un asistente de IA hace el primer borrador. ¿Qué parte del trabajo quieres hacer tú?", opts: [
    { t: "Afinar cómo se ve y se siente hasta que sea cómodo de usar", p: {web: 3} },
    { t: "Ordenar la lógica por dentro para que sea fácil de cambiar", p: {bak: 3} },
    { t: "Escoger los ejemplos con los que el programa aprende a predecir", p: {ml: 3, dat: 2} },
    { t: "Atacarlo por mi cuenta para encontrar sus huecos antes que otros", p: {sec: 3} },
    { t: "Diseñar el experimento que muestre si la idea funciona", p: {inv: 3} }
  ]},
  { q: "Un asistente de IA hace propuestas y alguien debe decidir cuáles se aceptan. ¿Qué te gustaría revisar tú?", opts: [
    { t: "Si sus predicciones siguen acertando con los datos de este mes", p: {ml: 3, dat: 1} },
    { t: "Cuánto costaría equivocarse y si vale la pena el riesgo", p: {rsk: 3, con: 1} },
    { t: "Si el cambio se puede aplicar sin interrumpir a nadie", p: {inf: 3, bak: 1} },
    { t: "Si los datos en que se basó la propuesta están completos", p: {dat: 3} }
  ]}
] }
};

// [nombre, texto a buscar en minúsculas, explicación]
var GLOSS = [
  ["Permisos mínimos", "permisos mínimos", "Darle a una persona o a un programa solo los permisos que necesita para su tarea y nada más, así un error o una contraseña robada hace menos daño. También se le llama principio de mínimo privilegio."],
  ["Mínimo permiso", "mínimo permiso", "Darle a una persona o a un programa solo el permiso que necesita para su tarea y nada más, así un error o una contraseña robada hace menos daño. También se le llama principio de mínimo privilegio."],
  ["Jupyter notebook", "notebook", "Un documento donde escribes código por partes y ves el resultado al instante, con gráficas y notas. Es la herramienta más común para analizar datos."],
  ["Power BI", "power bi", "Programa de Microsoft para armar tableros: gráficas y tablas que se pueden filtrar, hechas a partir de datos."],
  ["API", "api", "La ventanilla con la que un programa le pide cosas a otro. Ejemplo: la app del clima le pregunta a un servidor qué temperatura hay."],
  ["Framework", "framework", "Un kit de piezas ya armadas para construir más rápido cierto tipo de programa, en lugar de empezar de cero."],
  ["Backend y frontend", "backend", "Frontend es lo que ves y tocas en una aplicación. Backend es lo que no se ve: guarda los datos y aplica las reglas."],
  ["Docker", "docker", "Una caja que lleva tu programa con todo lo que necesita, para que corra igual en cualquier computadora."],
  ["Terminal", "terminal", "Una pantalla de texto donde le das órdenes a la computadora escribiendo, sin ratón. En pagos, «terminal» también es el aparato donde se cobra con tarjeta."],
  ["Wireshark", "wireshark", "Programa que te deja ver los mensajes que viajan por una red."],
  ["CTF", "ctf", "Competencia de seguridad: retos donde buscas una \"bandera\" escondida en un sistema hecho a propósito para practicar."],
  ["Registros y trazas", "traza", "El diario que un programa escribe de lo que hace. Sirve para ver dónde se rompió. Una traza junta todos los pasos de una misma petición, con su tiempo."],
  ["Figma", "figma", "Programa para dibujar cómo se verá una aplicación antes de programarla."],
  ["React", "react", "Un framework muy popular para construir páginas y aplicaciones web interactivas."],
  ["LaTeX", "latex", "Sistema para escribir documentos con mucha matemática (artículos, tesis)."],
  ["SQL", "sql", "Lenguaje para hacerle preguntas a una base de datos: “dame las ventas de marzo por tienda”."],
  ["Monte Carlo", "monte carlo", "Técnica que repite un experimento al azar miles de veces en la computadora para estimar qué tan probable es algo."],
  ["GitHub Actions", "github actions", "Una forma de que GitHub ejecute tareas solo cada vez que subes cambios, como probar y publicar tu programa."],
  ["Hash", "hash", "Una forma de guardar una contraseña sin guardarla tal cual: se convierte en una cadena que no se puede deshacer fácilmente."],
  ["Vercel", "vercel", "Servicio gratuito para publicar una página en internet con un enlace."],
  ["Producción", "producción", "Cuando el programa ya lo usan personas reales, no solo tú probándolo."],
  ["Desplegar", "desplegar", "Publicar el programa para que otras personas puedan usarlo."],
  ["Kaggle", "kaggle", "Sitio con datos, cursos gratis y competencias de ciencia de datos para principiantes."],
  ["Looker Studio", "looker studio", "Herramienta gratuita de Google para hacer tableros con datos."],
  ["LLM", "llm", "Modelo de lenguaje grande: un programa entrenado con muchísimo texto que predice qué palabras siguen. Es lo que hay detrás de los asistentes de chat."],
  ["Token", "token", "El pedazo de texto con el que trabaja un modelo: una palabra corta o parte de una larga. Los proveedores cobran por tokens de entrada y de salida."],
  ["Embedding", "embedding", "Una lista de números que representa el significado de un texto. Textos que dicen cosas parecidas quedan con números parecidos, y así se pueden buscar por significado."],
  ["Prompt", "prompt", "Las instrucciones y el texto que le mandas al modelo en cada llamada."],
  ["Chunk o fragmento", "chunk", "Un pedazo de un documento, del tamaño de un párrafo o poco más, que se guarda por separado para poder buscarlo."],
  ["BM25", "bm25", "Un método clásico para buscar documentos por las palabras que comparten con la pregunta, dando más peso a las palabras poco comunes."],
  ["JSON", "json", "Un formato de texto para guardar datos con nombre y valor, como {\"monto\": 120}. Casi todos los programas lo entienden."],
  ["Pydantic", "pydantic", "Librería de Python que revisa que los datos tengan la forma y los tipos que esperas, y avisa si no."],
  ["Algoritmo de Luhn", "luhn", "Una fórmula sencilla que verifica si un número de tarjeta es válido. Sirve para detectarlos dentro de un texto."],
  ["PCI DSS", "pci dss", "Las reglas de seguridad que deben cumplir quienes procesan pagos con tarjeta."],
  ["Ollama", "ollama", "Programa gratuito para correr modelos de lenguaje en tu propia computadora."],
  ["SDK", "sdk", "Una librería oficial que facilita usar un servicio o un protocolo desde tu lenguaje de programación."],
  ["MCP", "mcp", "Model Context Protocol: un estándar para conectar modelos con herramientas y datos."],
  ["HTTP", "http", "El protocolo con el que se comunican los navegadores y los servidores en internet."],
  ["Orquestador", "orquestador", "El agente o programa que reparte el trabajo entre otros agentes y junta sus resultados."],
  ["Latencia", "latencia", "El tiempo que tarda en llegar una respuesta."],
  ["Temperatura", "temperatura", "Un ajuste que controla qué tan variadas son las respuestas del modelo: baja da respuestas más repetibles; alta, más creativas."],
  ["CSV", "csv", "Un archivo de texto con datos en columnas separadas por comas. Se abre en Excel."],
  ["SQLite", "sqlite", "Una base de datos que vive en un solo archivo, sin servidor. Ideal para prácticas."],
  ["Decorador", "decorador", "En Python, una función que envuelve a otra para agregarle algo, como medir cuánto tarda."],
  ["OpenTelemetry", "opentelemetry", "Un estándar abierto para registrar trazas, métricas y registros de cualquier aplicación."],
  ["Conciliación", "conciliación", "Comparar lo que se cobró con lo que de verdad se depositó, para encontrar diferencias."],
  ["Git", "git", "Programa que guarda la historia de los cambios de tu código, para ver qué cambió, quién lo cambió y volver a una versión anterior."],
  ["GitHub", "github", "Sitio donde se guardan repositorios de Git en internet, para trabajar en equipo y mostrar tus proyectos."],
  ["Repositorio", "repositorio", "La carpeta de un proyecto que Git vigila, junto con toda su historia de cambios."],
  ["Commit", "commit", "Una foto de tus archivos en un momento, con un mensaje que dice qué cambió. La historia de un proyecto es la lista de sus commits."],
  ["Rama (branch)", "branch", "Una línea de trabajo aparte dentro del repositorio, para hacer un cambio sin tocar la versión principal."],
  ["Merge", "merge", "Unir los cambios de una rama con otra, por ejemplo con la rama principal."],
  ["Pull request", "pull request", "En GitHub, la petición de que alguien revise tu rama antes de unirla a la principal. Muestra las diferencias y deja comentar cada línea."],
  ["Push y pull", "git push", "git push sube tus commits a GitHub; git pull baja los que subieron los demás."],
  ["Issue", "issue", "En GitHub, una nota para reportar un problema o proponer una mejora, con su propia conversación."],
  ["README", "readme", "El archivo de presentación de un proyecto: qué es, cómo se instala y cómo se usa."],
  ["Base de datos relacional", "relacional", "Una base que guarda la información en tablas conectadas entre sí por columnas en común."],
  ["Llave primaria", "llave primaria", "La columna que identifica cada fila de una tabla sin repetirse, como el número de empleado."],
  ["Llave foránea", "llave foránea", "Una columna que apunta a la llave primaria de otra tabla, para conectarlas sin copiar datos."],
  ["NULL", "null", "En una base de datos, una celda vacía: no hay valor. No es cero ni texto vacío, y se busca con IS NULL."],
  ["SELECT y FROM", "select", "Las dos primeras partes de una consulta SQL: SELECT dice qué columnas quieres y FROM, de qué tabla."],
  ["WHERE", "where", "En SQL, la parte de la consulta que filtra filas: solo quedan las que cumplen la condición. Por ejemplo, WHERE area = 'Ventas' deja solo las filas del área de Ventas."],
  ["JOIN", "join", "En SQL, unir dos tablas por una columna en común. INNER JOIN deja solo las filas con pareja; LEFT JOIN conserva todas las de la primera tabla."],
  ["GROUP BY", "group by", "En SQL, juntar las filas que comparten un valor para contarlas o sumarlas por grupo."],
  ["HAVING", "having", "En SQL, el filtro que se aplica a los grupos ya contados, como «solo las áreas con más de 10»."],
  ["ORDER BY", "order by", "En SQL, ordenar el resultado de una consulta por una o más columnas."],
  ["COUNT", "count(", "En SQL, la función que cuenta filas. COUNT(*) cuenta todas las filas de cada grupo."],
  ["Oracle", "oracle", "Una base de datos comercial muy usada en empresas grandes y bancos. Se consulta con SQL."],
  ["PostgreSQL", "postgresql", "Una base de datos relacional gratuita y muy usada. Se consulta con SQL."],
  ["Endpoint", "endpoint", "La dirección de una API a la que le haces una petición, como /empleados/42."],
  ["API REST", "api rest", "Un estilo de API donde cada dirección nombra un recurso (como /empleados) y el método HTTP dice qué hacer: GET consulta, POST crea, DELETE borra."],
  ["Código de estado", "código de estado", "El número con el que el servidor dice cómo le fue a tu petición: 200 bien, 404 no existe, 500 falló el servidor."],
  ["Frontend", "frontend", "La parte de una aplicación que ves y tocas: pantallas, botones y formularios."],
  ["JavaScript", "javascript", "El lenguaje de programación que corre en los navegadores. Con él se hacen las páginas interactivas."],
  ["fetch", "fetch", "La función de JavaScript para hacer peticiones HTTP a una API desde el navegador."],
  ["Python", "python", "Un lenguaje de programación fácil de leer, muy usado para datos, automatización y servidores."],
  ["FastAPI", "fastapi", "Una librería de Python para crear APIs con poco código."],
  ["Express", "express", "Una librería de Node para crear servidores y APIs en JavaScript."],
  ["Node", "node", "Programa que permite correr JavaScript fuera del navegador, por ejemplo en un servidor."],
  ["curl", "curl", "Programa de la terminal para hacer peticiones HTTP, útil para probar una API sin navegador."],
  ["Prueba unitaria", "prueba unitaria", "Una prueba que revisa una sola función: le da una entrada conocida y compara el resultado con el esperado."],
  ["assert", "assert", "En una prueba, la línea que afirma qué debe pasar, como assert suma(2, 2) == 4. Si no se cumple, la prueba falla."],
  ["pytest", "pytest", "La herramienta más usada en Python para escribir y correr pruebas automáticas."],
  ["Linter", "linter", "Programa que revisa el estilo de tu código y errores comunes, sin correrlo."],
  ["Integración continua", "integración continua", "Que un servicio corra tus pruebas solo cada vez que subes cambios, para detectar errores antes de unirlos."],
  ["Regresión", "regresión", "En pruebas de software, cuando un cambio rompe algo que antes funcionaba. En estadística, un modelo que estima un número a partir de otros, como la regresión lineal."],
  ["Mock", "mock", "Un objeto falso que toma el lugar de algo real en una prueba, como el envío de correos, y registra cómo lo llamaron."],
  ["Prueba funcional", "prueba funcional", "Revisar que el sistema haga lo que dice el requerimiento, usándolo como lo haría una persona, sin ver el código."],
  ["Requerimiento", "requerimiento", "La descripción de lo que el sistema debe hacer, como «no guardar un cliente sin correo»."],
  ["Partición de equivalencia", "partición de equivalencia", "Técnica para diseñar pruebas: agrupas las entradas que el sistema trata igual y pruebas una de cada grupo."],
  ["Valores límite", "valores límite", "Técnica para diseñar pruebas: revisas justo los bordes de un rango y sus vecinos, como 17, 18, 65 y 66 para edades de 18 a 65."],
  ["Salesforce", "salesforce", "Un sistema en la nube que usan muchas empresas para manejar clientes, ventas y atención (un CRM)."],
  ["Bug o defecto", "bug", "Un error en un programa: hace algo distinto de lo que debería."],
  ["Severidad", "severidad", "En pruebas, la severidad es cuánto daño hace un defecto y la prioridad, qué tan pronto hay que arreglarlo; no siempre van juntas. En seguros, la severidad es cuánto cuesta un siniestro, en promedio."],
  ["Excel", "excel", "La hoja de cálculo de Microsoft. Excel para la web es gratis con una cuenta de Microsoft."],
  ["BUSCARX", "buscarx", "Función de Excel que busca un valor en una columna y devuelve el dato de la misma fila en otra columna."],
  ["CONTAR.SI", "contar.si", "Función de Excel que cuenta las celdas que cumplen una condición. CONTAR.SI.CONJUNTO acepta varias condiciones."],
  ["Tabla dinámica", "tabla dinámica", "Herramienta de Excel que resume miles de filas en un cuadro, como bajas por mes y por área, sin escribir fórmulas."],
  ["Validación de datos", "validación de datos", "Regla de Excel que solo deja capturar ciertos valores en una celda, como números enteros de 18 a 70."],
  ["#N/D", "#n/d", "El error de Excel que significa «no se encontró»: la búsqueda no halló el valor."],
  ["Power Query", "power query", "La parte de Excel y Power BI que limpia y da forma a los datos antes de usarlos."],
  ["Segmentación", "segmentación", "En un tablero de Power BI, un filtro en pantalla: eliges una tienda o una fecha y todo el tablero se ajusta. En marketing, dividir a los clientes en grupos parecidos."],
  ["KPI", "kpi", "Indicador clave de desempeño: una de las pocas cifras que una empresa vigila para saber si va bien."],
  ["Plantilla", "plantilla", "En recursos humanos, el conjunto de personas que trabajan en una empresa, o cuántas son. En otros contextos, un formato base que se copia y se llena."],
  ["Rotación", "rotación", "El porcentaje de personas que dejan la empresa en un periodo, sobre la plantilla promedio."],
  ["Retención", "retención", "El porcentaje de personas que siguen en la empresa después de cierto tiempo, como 90 días después de entrar."],
  ["Ausentismo", "ausentismo", "El porcentaje del tiempo de trabajo que se pierde por faltas no planeadas."],
  ["Linux", "linux", "Un sistema operativo gratuito, como Windows o macOS. Casi todos los servidores de internet lo usan."],
  ["Shell", "shell", "El programa que lee lo que escribes en la terminal y lo ejecuta. Un script de shell es una lista de esas órdenes guardada en un archivo."],
  ["Log o registro", "log", "El archivo donde un programa anota lo que hace, con fecha y hora. Es lo primero que se revisa cuando algo falla."],
  ["pwd, ls, cd y cat", "pwd", "Órdenes básicas de la terminal: pwd dice dónde estás, ls lista archivos, cd cambia de carpeta y cat muestra un archivo."],
  ["grep", "grep", "Orden de la terminal que busca una palabra en un archivo y muestra solo las líneas que la contienen."],
  ["tail", "tail", "Orden de la terminal que muestra el final de un archivo; con -f lo sigue mostrando mientras crece."],
  ["systemctl", "systemctl", "Orden de Linux para ver, arrancar, detener o reiniciar servicios, como un servidor web."],
  ["sudo", "sudo", "Antepuesto a una orden, la ejecuta con permisos de administrador."],
  ["nginx", "nginx", "Un servidor web muy usado: es el programa que entrega las páginas a los navegadores."],
  ["df -h", "df -h", "Orden de Linux que muestra cuánto espacio queda en cada disco."],
  ["Memoria RAM", "memoria ram", "La memoria rápida donde corren los programas mientras están abiertos. No es el disco donde se guardan los archivos."],
  ["CPU", "cpu", "El procesador: la parte de la computadora que hace los cálculos. Su uso se mide en porcentaje."],
  ["kill", "kill", "Orden de Linux para detener un proceso. kill -9 lo detiene a la fuerza, sin dejar que termine bien."],
  ["Ubuntu", "ubuntu", "Una de las versiones de Linux más usadas, gratuita y con mucha documentación."],
  ["WSL", "wsl", "Función de Windows para correr Linux dentro de Windows, sin instalar otro sistema."],
  ["Máquina virtual", "máquina virtual", "Una computadora simulada dentro de la tuya, con su propio sistema operativo."],
  ["Ticket", "ticket", "El registro de una solicitud o un problema en un sistema de soporte: qué pasó, quién lo atiende y qué se hizo."],
  ["AWS", "aws", "Amazon Web Services: la nube de Amazon, que renta servidores, bases de datos y otros servicios por uso."],
  ["EC2", "ec2", "El servicio de AWS que renta servidores virtuales, llamados instancias."],
  ["Instancia", "instancia", "En la nube, un servidor virtual que rentas y puedes encender, apagar o eliminar. En programación, un objeto creado a partir de una clase."],
  ["IAM", "de iam", "El servicio de AWS que controla quién puede entrar y qué puede hacer cada quien."],
  ["Cuenta raíz", "cuenta raíz", "El usuario con el que se crea una cuenta de AWS. Puede hacer todo, por eso no se usa para el trabajo diario."],
  ["RDS", "rds", "El servicio de AWS que te da una base de datos ya instalada, con respaldos y actualizaciones a cargo de AWS."],
  ["AWS CLI", "aws cli", "El programa para manejar AWS desde la terminal, con órdenes como aws ec2 describe-instances."],
  ["Consola de AWS", "consola de aws", "La página web de AWS donde ves y manejas tus servicios con clics."],
  ["Script", "script", "Un archivo con una lista de órdenes que la computadora ejecuta de corrido."],
  ["SSH", "ssh", "La forma segura de conectarte a la terminal de un servidor remoto."],
  ["Capa gratuita", "capa gratuita", "Lo que un servicio en la nube deja usar sin costo, con límites; en AWS, a las cuentas nuevas. Lo que pase de ahí se cobra."],
  ["AWS Cloud Practitioner", "cloud practitioner", "La certificación de entrada de AWS: comprueba que conoces los servicios y conceptos básicos de su nube."],
  ["CloudWatch", "cloudwatch", "El servicio de AWS que junta métricas y logs de tus servidores y manda alarmas."],
  ["Métrica", "métrica", "Un número que se mide cada cierto tiempo, como el uso del CPU cada minuto."],
  ["Saturación", "saturación", "Qué tan lleno o al límite está un recurso, como el CPU, la memoria o el disco."],
  ["Alarma", "alarma", "Un aviso automático cuando una métrica cruza un límite durante cierto tiempo."],
  ["Escalar", "escalar", "En soporte, pasarle un problema que no pudiste resolver al equipo que sigue, con la evidencia de lo que ya revisaste. En sistemas, también es hacer que algo aguante más uso."],
  ["stress", "stress", "Programa de Linux que pone a trabajar el CPU a propósito, para probar alarmas y límites."],
  ["Next.js", "next.js", "Un framework sobre React para hacer sitios y aplicaciones web completas."],
  ["Métodos HTTP", "métodos http", "Lo que una petición le pide al servidor: GET consulta, POST crea, PUT o PATCH actualizan y DELETE borra."],
  ["DISTINCT", "distinct", "En SQL, SELECT DISTINCT quita las filas repetidas del resultado. No cuenta nada: para contar por grupo se usa GROUP BY."],
  ["SUMA, PROMEDIO y SUMAR.SI", "sumar.si", "Funciones básicas de Excel: SUMA suma un rango, PROMEDIO saca el promedio y SUMAR.SI suma solo las celdas que cumplen una condición."],
  ["ESPACIOS", "función espacios", "Función de Excel que quita los espacios de más al inicio, al final y entre palabras de un texto."],
  ["free -h", "free -h", "Orden de Linux que muestra cuánta memoria RAM hay y cuánta está en uso."],
  ["top", "comando top", "Orden de Linux que muestra en vivo los procesos que corren y cuánto CPU y memoria usa cada uno."],
  ["Región de AWS", "región de aws", "El lugar del mundo donde están los centros de datos en los que corre tu servicio, como Ohio o São Paulo. Afecta la latencia y el precio."],
  ["SRE", "sre", "Site Reliability Engineering: la forma en que Google y otras empresas mantienen sus sistemas funcionando, con métricas, alarmas y reglas claras."],
  ["Visual de tarjeta", "visual de tarjeta", "En Power BI, un recuadro que muestra una sola cifra grande, como el total de bajas del mes."],
  ["Google Sheets", "google sheets", "La hoja de cálculo gratuita de Google, que se usa desde el navegador."],
  ["Dirección IP", "dirección ip", "El número que identifica a un equipo en una red, como 192.168.1.20. Las que empiezan con 10. o 192.168. son privadas: solo existen dentro de una red local."],
  ["Puerto", "puerto", "En redes, el número que indica a qué servicio de un equipo va una conexión: 22 es SSH, 80 es HTTP y 443 es HTTPS."],
  ["DNS", "dns", "El sistema que traduce nombres como ejemplo.com a direcciones IP. Es como la agenda de contactos de internet."],
  ["Firewall", "firewall", "Un programa o aparato que deja pasar o bloquea el tráfico de red según reglas: de dónde viene, a dónde va y a qué puerto."],
  ["TCP", "tcp", "Protocolo de red que abre una conexión y confirma que cada parte llegó. Lo usan SSH, el correo y, tradicionalmente, la web."],
  ["UDP", "udp", "Protocolo de red que manda los datos sin confirmar que llegaron. Es más rápido; lo usan el DNS y las videollamadas."],
  ["ss -tulpn", "ss -tulpn", "Orden de Linux que lista los puertos en los que el equipo está escuchando y qué programa usa cada uno."],
  ["Dominio", "dominio", "En internet, el nombre de un sitio, como ejemplo.com. El DNS lo traduce a una dirección IP."],
  ["NVD", "nvd", "La base de datos nacional de vulnerabilidades de Estados Unidos (nvd.nist.gov): trae, para cada CVE, su descripción y su calificación CVSS."],
  ["Malware", "malware", "Un programa hecho para hacer daño: robar datos, cifrar archivos para pedir rescate o dar control del equipo a alguien de fuera."],
  ["Vulnerabilidad", "vulnerabilidad", "Una debilidad de un sistema que alguien podría aprovechar, como un programa sin actualizar o una contraseña por defecto."],
  ["Amenaza", "amenaza", "En seguridad, quien o lo que podría aprovechar una vulnerabilidad: un grupo de atacantes, un programa malicioso o un error humano."],
  ["CVE", "cve", "El nombre único de una vulnerabilidad pública, como CVE-2021-44228. Así todos hablan de la misma falla."],
  ["CVSS", "cvss", "La calificación de gravedad de una vulnerabilidad, de 0 a 10. Mide qué tan grave es la falla, no si alguien ya la está usando."],
  ["CISA y el catálogo KEV", "kev", "CISA es la agencia de ciberseguridad de Estados Unidos. Su catálogo KEV lista las vulnerabilidades que se sabe que los atacantes ya están aprovechando."],
  ["OWASP", "owasp", "Una fundación abierta que publica guías de seguridad, como el Top 10 de los riesgos más comunes en aplicaciones web."],
  ["Parche", "parche", "Una actualización que corrige una falla de un programa. Parchar es instalarla."],
  ["Phishing", "phishing", "Un correo o mensaje falso que se hace pasar por alguien de confianza para que des tu contraseña o abras un archivo."],
  ["Password spraying", "password spraying", "Un ataque que prueba una o pocas contraseñas comunes en muchas cuentas, un intento por cuenta, para no activar el bloqueo."],
  ["SOC", "soc", "Centro de operaciones de seguridad: el equipo que vigila las alertas de seguridad de una empresa todo el día y responde cuando algo pasa."],
  ["SIEM", "siem", "Un sistema que junta los logs de muchos equipos en un solo lugar, los relaciona y lanza alertas de seguridad. Splunk, QRadar y ArcSight son SIEM."],
  ["Splunk", "splunk", "Un SIEM muy usado: guarda logs de muchas fuentes y te deja buscarlos, hacer tableros y crear alertas."],
  ["Incidente", "incidente", "Un evento que afecta o pone en riesgo la operación o la seguridad: una caída del servicio, una cuenta robada o un equipo infectado."],
  ["Falso positivo y falso negativo", "falso positivo", "Un falso positivo es una alerta por algo que resultó normal. Un falso negativo es lo contrario: algo malo que no generó alerta."],
  ["Contención", "contención", "En un incidente, el primer paso para detener el daño: aislar el equipo afectado o bloquear la cuenta para que no se extienda."],
  ["Erradicar", "erradicar", "En un incidente, quitar lo malicioso y cerrar la puerta por donde entró, después de contenerlo."],
  ["NIST", "nist", "El instituto de estándares de Estados Unidos. Publica guías de seguridad muy usadas, como la SP 800-61 para responder a incidentes."],
  ["MITRE ATT&CK", "att&ck", "Un catálogo público de las técnicas que usan los atacantes, ordenadas por lo que buscan lograr. Sirve para describir y detectar ataques."],
  ["pandas", "pandas", "La librería de Python para trabajar con tablas de datos: cargarlas, limpiarlas, filtrarlas y resumirlas."],
  ["DataFrame", "dataframe", "En pandas, una tabla con filas y columnas con nombre, como una hoja de cálculo dentro de tu programa."],
  ["Diccionario", "diccionario", "En Python, una colección de pares de nombre y valor, como {\"edad\": 22}. Cada dato se pide por su nombre."],
  ["NaN", "nan", "En pandas, una celda vacía: no hay valor. Se cuentan con isna()."],
  ["groupby", "groupby", "En pandas, juntar las filas que comparten un valor para sumarlas, contarlas o promediarlas por grupo, como GROUP BY en SQL."],
  ["Google Colab", "google colab", "Notebooks de Jupyter gratuitos que corren en el navegador, sin instalar nada."],
  ["Media y mediana", "mediana", "La media es el promedio. La mediana es el valor de en medio al ordenar los datos; los valores extremos no la mueven."],
  ["Desviación estándar", "desviación estándar", "Un número que dice qué tan lejos de la media suelen quedar los datos. Grande quiere decir que varían mucho."],
  ["Correlación", "correlación", "Qué tanto dos variables se mueven juntas, de -1 a 1. No prueba que una cause la otra."],
  ["Prueba de hipótesis", "prueba de hipótesis", "Un método para decidir si una diferencia en los datos es real o pudo salir por azar, comparando contra la idea de que no hay diferencia."],
  ["Valor p", "valor p", "Qué tan probable sería ver un resultado así de extremo, o más, si no hubiera ninguna diferencia real. No es la probabilidad de que la hipótesis sea cierta."],
  ["Prueba A/B", "prueba a/b", "Comparar dos versiones de algo (una página, una campaña) mostrándole cada una a un grupo distinto, al azar, para ver cuál funciona mejor."],
  ["Sesgo", "sesgo", "Un error que empuja los resultados siempre hacia un lado, por ejemplo cuando la muestra no representa a todos."],
  ["Histograma", "histograma", "Una gráfica de barras que muestra cuántos datos caen en cada rango de valores."],
  ["Análisis exploratorio", "análisis exploratorio", "Revisar los datos antes de modelar: cómo se reparten, qué falta, qué valores son raros y qué variables se relacionan."],
  ["Aprendizaje supervisado", "aprendizaje supervisado", "Entrenar un modelo con ejemplos que ya traen la respuesta. Si la respuesta es un número es regresión; si es una categoría, clasificación."],
  ["Aprendizaje no supervisado", "aprendizaje no supervisado", "Buscar patrones en datos sin respuesta conocida, como agrupar clientes que se parecen."],
  ["Agrupamiento", "agrupamiento", "Técnica no supervisada que junta los datos que se parecen en grupos. En inglés se le dice clustering."],
  ["k-means", "k-means", "Un método de agrupamiento: reparte los datos en k grupos, cada uno alrededor de un centro."],
  ["Conjuntos de entrenamiento y de prueba", "conjunto de prueba", "Los datos se separan en dos: con los de entrenamiento el modelo aprende y con los de prueba, que nunca vio, se mide qué tan bien le va."],
  ["Sobreajuste", "sobreajuste", "Cuando un modelo memoriza los ejemplos de entrenamiento, con todo y su ruido, y falla con datos nuevos."],
  ["Ingeniería de variables", "feature engineering", "Convertir datos crudos en variables útiles para un modelo, como sacar la edad de la fecha de nacimiento."],
  ["Fuga de datos", "fuga de datos", "Cuando el modelo se entrena con información que no tendría al momento de predecir. Luce perfecto en las pruebas y falla en la realidad."],
  ["Precisión", "precisión", "De todo lo que el modelo marcó (por ejemplo, como fraude), la parte que de verdad lo era. Si marca 100 cobros y 90 eran fraude, su precisión es 90%."],
  ["Recall", "recall", "De todo lo que había que encontrar, la parte que el modelo sí encontró. Si hubo 300 fraudes y encontró 90, su recall es 30%."],
  ["Interpretabilidad", "interpretabilidad", "Poder explicar por qué un modelo dio cierta predicción, por ejemplo qué variables pesaron más en un rechazo."],
  ["SHAP", "shap", "Un método para explicar una predicción: reparte el resultado de un caso entre sus variables, para ver cuál empujó hacia qué lado."],
  ["scikit-learn", "scikit-learn", "La librería de Python más usada para ML clásico: regresión, clasificación, agrupamiento y evaluación de modelos."],
  ["Regresión logística", "regresión logística", "A pesar del nombre, un modelo de clasificación: estima la probabilidad de que algo pase, como que un cliente no pague."],
  ["Árbol de decisión", "árbol de decisión", "Un modelo que decide con una serie de preguntas de sí o no sobre las variables, como «¿ingreso mayor a 20,000?»."],
  ["IA generativa", "ia generativa", "Modelos que crean contenido nuevo, como texto o imágenes, en lugar de solo clasificar o predecir un número. Los LLM son IA generativa."],
  ["IA agéntica", "agéntica", "Soluciones donde uno o varios agentes de IA deciden qué pasos dar y qué herramientas usar para cumplir una tarea, en lugar de solo contestar."],
  ["Ventana de contexto", "ventana de contexto", "El máximo de tokens que un modelo de lenguaje puede leer y escribir en una sola llamada. Lo que no cabe, el modelo no lo ve."],
  ["Alucinación", "alucinación", "Cuando un modelo de lenguaje da con toda seguridad un dato inventado o falso."],
  ["Similitud coseno", "similitud coseno", "Una forma de medir qué tan parecidos son dos embeddings: cerca de 1, significan casi lo mismo."],
  ["sentence-transformers", "sentence-transformers", "Librería gratuita de Python para sacar embeddings de textos en tu propia computadora."],
  ["RAG", "rag", "Generación con búsqueda: antes de responder, se buscan en tus documentos los fragmentos que sirven y se le dan al modelo para que conteste con ellos y cite la fuente."],
  ["Agente", "agente", "En IA, un programa donde un modelo de lenguaje decide qué herramienta usar, la usa, mira el resultado y repite hasta terminar la tarea."],
  ["Flujo fijo", "flujo fijo", "Un programa donde tu código decide el orden de los pasos y el modelo solo hace cada uno. Es más barato y predecible que un agente."],
  ["Sistema multiagente", "multiagente", "Varios agentes que trabajan juntos: un orquestador reparte la tarea y junta lo que devuelven los demás."],
  ["Conjunto de evaluación", "conjunto de evaluación", "Una lista fija de casos con lo que esperas de cada uno, para medir si un cambio mejoró o empeoró el sistema."],
  ["Rúbrica", "rúbrica", "La lista de criterios con que se califica una respuesta, como «saluda» o «da el monto correcto»."],
  ["promptfoo", "promptfoo", "Herramienta libre para correr evaluaciones de prompts y modelos desde la terminal."],
  ["Guardrails", "guardrail", "Revisiones alrededor de un modelo de lenguaje: qué datos pueden entrar, qué respuestas pueden salir y qué acciones necesitan aprobación."],
  ["Inyección de instrucciones", "inyección de instrucciones", "Un ataque donde un texto que el modelo lee (un correo, un PDF) trae órdenes escondidas, como «ignora tus reglas»."],
  ["Enmascarar", "enmascara", "Ocultar parte de un dato sensible antes de usarlo o guardarlo, como mostrar una tarjeta como «**** 1234»."],
  ["Servidor MCP", "servidor mcp", "El programa que ofrece herramientas, recursos y prompts a cualquier aplicación compatible con MCP."],
  ["Host (MCP)", "host", "En MCP, la aplicación donde escribe la persona, como un asistente de escritorio o un editor de código. Dentro vive el cliente que habla con los servidores."],
  ["Entrada y salida estándar", "salida estándar", "Los canales por donde un programa recibe y escribe texto en la terminal. Un servidor MCP local los usa para hablar con el cliente."],
  ["MCP Inspector", "mcp inspector", "La herramienta oficial para probar un servidor MCP: muestra sus herramientas y te deja llamarlas a mano."],
  ["Observabilidad", "observabilidad", "Registrar lo que pasa dentro de un sistema (trazas, métricas y registros) para poder explicar cualquier resultado después."],
  ["Langfuse", "langfuse", "Herramienta libre para ver las trazas, los costos y las evaluaciones de aplicaciones con modelos de lenguaje."],
  ["TensorFlow y PyTorch", "pytorch", "Las dos librerías más usadas para entrenar redes neuronales en Python."],
  ["Requerimiento no funcional", "no funcional", "Un requerimiento que no dice qué hace el sistema sino qué tan bien lo hace: qué tan rápido responde, qué tan seguro es o cuánto tiempo está disponible."],
  ["Historia de usuario", "historia de usuario", "Un requerimiento escrito desde quien lo usa: «Como [quién], quiero [qué] para [para qué]». Va con sus criterios de aceptación."],
  ["Criterios de aceptación", "criterios de aceptación", "Las condiciones, que se comprueban con un sí o un no, para decir que una historia de usuario está terminada."],
  ["Análisis de impacto", "análisis de impacto", "Revisar, antes de aprobar un cambio, qué otros sistemas, procesos, reportes y pruebas cambian o se pueden romper con él."],
  ["Usuarios funcionales", "usuarios funcionales", "Las personas de las áreas de negocio que usan un sistema en su trabajo diario, como ventas o finanzas, a diferencia del área de sistemas."],
  ["Sistemas legados", "sistemas legados", "Sistemas viejos que una empresa sigue usando porque la operación depende de ellos, aunque sean difíciles de cambiar."],
  ["Diagrama de flujo", "diagrama de flujo", "Un dibujo de un proceso con figuras sencillas: óvalos para el inicio y el fin, rectángulos para las actividades, rombos para las decisiones y flechas para el orden."],
  ["BPMN", "bpmn", "Business Process Model and Notation: un estándar internacional para dibujar procesos de negocio, con carriles, actividades, decisiones y eventos."],
  ["Carril", "carril", "En un diagrama de procesos, la franja que junta las actividades de una persona o un área, para ver quién hace qué."],
  ["UML", "uml", "Unified Modeling Language: un estándar con varios tipos de diagramas para describir software, como los de casos de uso y los de secuencia."],
  ["Caso de uso", "caso de uso", "Una función que el sistema ofrece a alguien, como «apartar un producto». El diagrama de casos de uso muestra qué actores usan qué funciones."],
  ["Actor", "actor", "En un diagrama de casos de uso, quien usa el sistema: una persona, como el cliente, u otro sistema, como el del banco."],
  ["Diagrama de secuencia", "diagrama de secuencia", "Un diagrama de UML que muestra, en orden de arriba abajo, los mensajes que se mandan los participantes de una acción, como la app, el servidor y el banco."],
  ["draw.io", "draw.io", "Programa gratuito para hacer diagramas desde el navegador. También se llama diagrams.net."],
  ["Metodologías ágiles", "ágil", "Formas de trabajar que entregan software en partes pequeñas y frecuentes, y ajustan el plan con lo que aprenden en cada entrega. Scrum y Kanban son las más conocidas."],
  ["Incremento", "incremento", "En el trabajo ágil, una parte del producto que ya funciona y se suma a lo que ya había. En Scrum, cada sprint entrega al menos uno."],
  ["Scrum", "scrum", "Una forma ágil de trabajar en sprints, con un Product Owner, un Scrum Master y un equipo que construye, y con eventos fijos para planear, revisar y mejorar."],
  ["Sprint", "sprint", "En Scrum, un periodo fijo de un mes o menos, a menudo de dos semanas, en el que el equipo construye una parte del producto."],
  ["Backlog", "backlog", "La lista ordenada de todo lo que falta hacer en un producto. En Scrum, el Product Owner la ordena por valor."],
  ["Product Owner", "product owner", "En Scrum, la persona responsable de que el producto dé el mayor valor posible: ordena el backlog y decide qué va primero."],
  ["Scrum Master", "scrum master", "En Scrum, la persona que ayuda al equipo a trabajar con Scrum y le quita obstáculos. No es el jefe ni reparte las tareas."],
  ["Daily Scrum", "daily scrum", "En Scrum, la reunión diaria de 15 minutos en la que el equipo revisa cómo va hacia la meta del sprint y ajusta el plan del día."],
  ["Revisión del sprint", "revisión del sprint", "En Scrum, la reunión al final del sprint donde el equipo muestra lo que hizo a los interesados y juntos deciden qué sigue."],
  ["Planeación del sprint", "planeación del sprint", "En Scrum, la reunión al inicio del sprint donde el equipo elige qué va a hacer y cómo."],
  ["Retrospectiva", "retrospectiva", "En Scrum, la reunión al final del sprint donde el equipo revisa cómo trabajó y decide qué cambiar para mejorar."],
  ["Kanban", "kanban", "Una forma ágil de trabajar con un tablero de columnas, como por hacer, en curso y hecho, donde cada tarjeta es una tarea. Limita cuánto trabajo hay en curso a la vez."],
  ["Límite de trabajo en curso", "trabajo en curso", "En Kanban, el máximo de tarjetas que puede haber en una columna. Si se llena, primero se termina lo que hay antes de meter más."],
  ["Trello", "trello", "Programa en línea para hacer tableros con tarjetas, como los de Kanban. Tiene un plan gratuito."],
  ["Jira", "jira", "Programa de Atlassian para organizar el trabajo de equipos de software, con backlog, sprints y tableros. Tiene un plan gratuito para equipos pequeños."],
  ["Póliza", "póliza", "El contrato de seguro por escrito: qué cubre, qué no cubre, hasta cuánto y en qué condiciones."],
  ["Prima", "prima", "En seguros, el precio del seguro: lo que pagas para estar protegido, por ejemplo cada año."],
  ["Suma asegurada", "suma asegurada", "Lo máximo que la aseguradora pagaría por un siniestro cubierto."],
  ["Deducible", "deducible", "La parte del daño que pagas tú antes de que la aseguradora empiece a pagar."],
  ["Coaseguro", "coaseguro", "Un porcentaje del daño que también pagas tú. Muchas pólizas lo calculan después de restar el deducible, pero el orden lo dice cada póliza. También se llama coaseguro a repartir un mismo riesgo entre varias aseguradoras."],
  ["Siniestro", "siniestro", "El daño que ocurre y se reclama al seguro, como un incendio o un robo."],
  ["Exclusiones", "exclusiones", "Lo que una póliza dice expresamente que no cubre."],
  ["Endoso", "endoso", "Un documento que modifica una póliza ya existente: agrega una cobertura, cambia la suma asegurada o corrige un dato."],
  ["Reaseguro", "reaseguro", "El seguro de las aseguradoras: le ceden parte de un riesgo grande a una reaseguradora, que paga su parte si hay siniestro."],
  ["Ramo de daños", "ramo de daños", "Los seguros que cubren bienes y responsabilidades, como edificios, maquinaria, mercancía o autos, y no a personas, como los de vida o gastos médicos."],
  ["Suscripción", "suscripción", "En una aseguradora, evaluar un riesgo y decidir si se acepta y en qué condiciones: prima, deducible y exclusiones."],
  ["Indemnización", "indemnización", "Lo que la aseguradora paga por un siniestro cubierto."],
  ["Condiciones generales", "condiciones generales", "El documento de una póliza con todas sus reglas: coberturas, exclusiones, deducibles y cómo reclamar."],
  ["CONDUSEF", "condusef", "La Comisión Nacional para la Protección y Defensa de los Usuarios de Servicios Financieros: el organismo público que orienta y defiende a los usuarios de bancos y aseguradoras en México."],
  ["NAIC", "naic", "La asociación de los reguladores de seguros de los estados de Estados Unidos. Publica guías sobre cómo funciona el sector."],
  ["Frecuencia y severidad", "frecuencia y severidad", "En seguros y riesgos, la frecuencia es qué tan seguido pasa un siniestro y la severidad, cuánto cuesta cada uno en promedio."],
  ["Pérdida esperada", "pérdida esperada", "Lo que se espera perder en promedio en un periodo: frecuencia × severidad promedio."],
  ["Prima de riesgo", "prima de riesgo", "La parte de la prima que cubre la pérdida esperada. A la prima final se le suman gastos y un margen."],
  ["Exposición", "exposición", "Qué tanto está algo al alcance de un daño. En seguridad, por ejemplo, si un sistema está abierto a internet; en seguros, cuánto valor asegurado hay y dónde está."],
  ["Cúmulo", "cúmulo", "En seguros, muchas pólizas expuestas al mismo evento, como edificios de una misma zona ante un sismo. También se le dice acumulación."],
  ["Modelo catastrófico", "modelo catastrófico", "Un programa que simula miles de eventos posibles, como sismos o huracanes, y estima cuánto se perdería en cada uno con los datos de cada bien asegurado."],
  ["Zona de lago", "zona de lago", "La parte de la Ciudad de México construida sobre el suelo blando del antiguo lago. Ahí un sismo se siente más fuerte y dura más."],
  ["Rociadores contra incendio", "rociadores", "Regaderas en el techo que se abren solas con el calor de un incendio y echan agua para apagarlo o frenarlo."],
  ["Ambiente", "ambiente", "En pruebas, todo lo que rodea al sistema cuando lo pruebas: navegador, versión, tipo de usuario y datos. Un defecto puede aparecer en un ambiente y en otro no."]
];

var MAXP = {};
Object.keys(SETS).forEach(function (v) {
  MAXP[v] = {};
  Object.keys(AREAS).forEach(function (k) {
    MAXP[v][k] = SETS[v].qs.reduce(function (sum, q) {
      return sum + Math.max.apply(null, q.opts.map(function (o) { return o.p[k] || 0; }));
    }, 0);
  });
});

function scoreAnswers(answers, v) {
  var qs = SETS[v].qs, M = MAXP[v], raw = {}, picked = [];
  Object.keys(AREAS).forEach(function (k) { raw[k] = 0; });
  answers.forEach(function (choice, i) {
    var p = qs[i].opts[choice].p;
    picked.push(p);
    Object.keys(p).forEach(function (k) { raw[k] += p[k]; });
  });
  var list = Object.keys(AREAS).map(function (k, idx) {
    return { key: k, pct: Math.round(raw[k] / M[k] * 100), idx: idx };
  });
  // Orden: proporción exacta raw/MAXP (multiplicación cruzada, sin errores de redondeo);
  // luego puntos brutos; luego gana quien recibió más puntos en la pregunta más reciente
  // en que las dos áreas difieren (de la última a la primera); solo si son idénticas, índice.
  return list.sort(function (a, b) {
    var ka = a.key, kb = b.key, i, pa, pb;
    var d = (raw[kb] * M[ka] - raw[ka] * M[kb]) || (raw[kb] - raw[ka]);
    if (d) return d;
    for (i = picked.length - 1; i >= 0; i--) {
      pa = picked[i][ka] || 0;
      pb = picked[i][kb] || 0;
      if (pa !== pb) return pb - pa;
    }
    return a.idx - b.idx;
  });
}

if (typeof module !== 'undefined') module.exports = { AREAS: AREAS, SETS: SETS, GLOSS: GLOSS, MAXP: MAXP, scoreAnswers: scoreAnswers };
