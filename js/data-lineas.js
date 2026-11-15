// Líneas del hub: cada una es una vacante real, leída completa en la fecha de `seen`. Van en orden L1 a L12.
// Forma (spec «Modelo de contenido»): { id, n, color, title, company, place, level, url, seen, areas, summary, asks, note?, stations, map, badge? }
// `stations` va en orden de estudio. `map` da { id: [x, y, lado?] } en un viewBox de 360 de ancho; el lado ('l', 'r' por defecto,
// 't' arriba o 'b' abajo) es donde va la etiqueta. Una estación compartida lleva
// las mismas coordenadas en todas sus líneas. `badge` [x, y] es el centro de la insignia «L#» junto a la primera estación.
// tests/content.test.mjs revisa el mapa con mapIssues (js/core.js).
// De la vacante solo se guarda lo necesario para estudiar: nada de correos ni datos de contacto.
// Script clásico (ES5): define la global LINEAS y se exporta para las pruebas con Node.

var LINEAS = [
  {
    id: "edar-dev-jr",
    n: 1,
    color: "l1",
    title: "Desarrollador de Software Jr.",
    company: "EDAR Tech",
    place: "Polanco, Ciudad de México · híbrido",
    level: "Para empezar",
    url: "https://to.indeed.com/aatdz7r8llx4",
    seen: "2026-11-10",
    areas: ["bak", "web"],
    summary: "Desarrollar y mantener aplicaciones en equipo, en un puesto pensado para quien cursa el último semestre o acaba de egresar. Piden fundamentos técnicos sólidos, no años de experiencia, y cuentan los proyectos de la universidad.",
    asks: [
      "Buenos fundamentos de programación en al menos un lenguaje, como Python, Java, C# o PHP.",
      "Bases de datos relacionales y consultas SQL.",
      "Nociones de APIs y servicios web.",
      "Git y GitHub para trabajar en equipo.",
      "Suman puntos: aplicaciones web con React, Node o Next.js, APIs REST, algo de nube y proyectos propios en GitHub."
    ],
    note: "De $12,000 a $15,000 al mes. Para estudiantes del último semestre o recién egresados, con 0 a 2 años de experiencia.",
    stations: ["git", "datos", "sql", "apis", "pruebas-auto"],
    map: { "git": [215, 125, "t"], "datos": [140, 135, "l"], "sql": [215, 200, "r"], "apis": [185, 255, "b"], "pruebas-auto": [175, 105, "l"] },
    badge: [222, 88]
  },
  {
    id: "sears-datos-jr",
    n: 2,
    color: "l2",
    title: "Analista de Datos Jr. (People Analytics)",
    company: "Sears",
    place: "Miguel Hidalgo, Ciudad de México · presencial",
    level: "Para empezar",
    url: "https://to.indeed.com/aaldbdtkrfpw",
    seen: "2026-11-10",
    areas: ["dat"],
    summary: "Analizar los indicadores de recursos humanos, como rotación, retención y ausentismo, para que la empresa decida con datos. Limpias y validas las bases, armas tableros en Power BI y automatizas los reportes para directivos.",
    asks: [
      "Power BI para construir tableros y reportes ejecutivos.",
      "Excel intermedio.",
      "Limpiar y validar las bases de datos de personal.",
      "Automatizar reportes que hoy se hacen a mano.",
      "De 1 a 2 años de experiencia en análisis de datos."
    ],
    note: "Temporal por proyecto y 100% presencial. Pide de 1 a 2 años de experiencia en análisis de datos.",
    stations: ["hojas", "datos", "sql", "tableros", "indicadores"],
    map: { "hojas": [135, 200, "l"], "datos": [140, 135, "l"], "sql": [215, 200, "r"], "tableros": [290, 315, "b"], "indicadores": [344, 220, "l"] },
    badge: [102, 219]
  },
  {
    id: "mvs-tester-jr",
    n: 3,
    color: "l3",
    title: "Tester Funcional Jr. (Salesforce)",
    company: "Grupo MVS",
    place: "Coyoacán, Ciudad de México · presencial",
    level: "Para empezar",
    url: "https://to.indeed.com/aa4ldtjsjhgg",
    seen: "2026-11-10",
    areas: ["bak", "web"],
    summary: "Ejecutar pruebas funcionales en Salesforce, documentar con evidencia lo que falla y validar datos en Excel. También das soporte de primer nivel a quienes usan el sistema.",
    asks: [
      "Lo básico de pruebas: pruebas funcionales, casos de prueba y reporte de bugs.",
      "Excel intermedio: filtros, validaciones y tablas.",
      "Documentar incidencias con evidencia.",
      "Un año de experiencia o conocimientos que puedas demostrar; cuentan los proyectos escolares."
    ],
    note: "$13,000 al mes. Temporal y presencial, con turnos rotativos que incluyen fines de semana.",
    stations: ["casos-prueba", "defectos", "hojas", "pruebas-auto"],
    map: { "casos-prueba": [55, 100, "t"], "defectos": [85, 160, "l"], "hojas": [135, 200, "l"], "pruebas-auto": [175, 105, "l"] },
    badge: [21, 116]
  },
  {
    id: "satori-cloud-jr",
    n: 4,
    color: "l4",
    title: "Ingeniero de Operaciones Cloud Jr. (AWS)",
    company: "SatoriTech",
    place: "Tlalpan (Perisur), Ciudad de México · presencial",
    level: "Para empezar",
    url: "https://to.indeed.com/aadcj6rbvmmm",
    seen: "2026-11-10",
    areas: ["inf"],
    summary: "Vigilar servidores y servicios en AWS, dar el primer diagnóstico cuando algo falla y escalar con evidencia. Revisas métricas y logs en CloudWatch, atiendes solicitudes de acceso y documentas todo en tickets.",
    asks: [
      "Consola de AWS (EC2 y CloudWatch), lo básico de AWS CLI y nociones de IAM y RDS.",
      "Linux y shell: servicios, procesos, disco y logs.",
      "Consultas y validaciones en SQL, sobre Oracle.",
      "Título y experiencia previa en soporte o infraestructura.",
      "Suman puntos: Git, scripts y la certificación AWS Cloud Practitioner."
    ],
    note: "De $20,000 a $25,000 al mes. 100% presencial, de lunes a viernes de 9 a 19 h. Pide título y experiencia previa en soporte o infraestructura.",
    stations: ["linux", "nube", "monitoreo", "sql", "git"],
    map: { "linux": [300, 522, "b"], "nube": [262, 485, "l"], "monitoreo": [260, 360, "r"], "sql": [215, 200, "r"], "git": [215, 125, "t"] },
    badge: [332, 522]
  },
  {
    id: "safe-soc",
    n: 5,
    color: "l5",
    title: "Analista SOC Tier 2",
    company: "SAFE",
    place: "Miguel Hidalgo, Ciudad de México · presencial",
    level: "Meta a 2 años",
    url: "https://to.indeed.com/aabbr778kp7b",
    seen: "2026-11-10",
    areas: ["sec", "inf"],
    summary: "Monitorear, analizar y dar seguimiento a los eventos de seguridad: investigas alertas, respondes a incidentes y analizas amenazas y vulnerabilidades para encontrar patrones y riesgos. También entregas reportes periódicos de lo que encontraste.",
    asks: [
      "Al menos 2 años de experiencia en un puesto parecido.",
      "Herramientas SIEM, como Splunk, QRadar o ArcSight.",
      "Investigar alertas y responder a incidentes de seguridad.",
      "Analizar amenazas, vulnerabilidades y riesgos, y detectar patrones.",
      "Carrera en ciberseguridad, sistemas o tecnologías de la información."
    ],
    note: "De $20,000 a $26,000 al mes, 100% presencial. Pide al menos 2 años de experiencia en un puesto parecido: es una meta, no un primer empleo.",
    stations: ["redes", "linux", "monitoreo", "amenazas", "incidentes"],
    map: { "redes": [338, 485, "t"], "linux": [300, 522, "b"], "monitoreo": [260, 360, "r"], "amenazas": [230, 395, "l"], "incidentes": [235, 445, "l"] },
    badge: [338, 450]
  },
  {
    id: "banorte-ds-jr",
    n: 6,
    color: "l6",
    title: "Científico de Datos Jr.",
    company: "Grupo Financiero Banorte",
    place: "Santa Fe, Ciudad de México · híbrido",
    level: "Meta a 2 o 3 años",
    url: "https://to.indeed.com/aa2js7jv6y78",
    seen: "2026-11-10",
    areas: ["ml", "dat"],
    summary: "Desarrollar, documentar, poner en marcha y monitorear modelos de ML e IA junto con científicos de datos senior y las áreas de negocio. Haces análisis exploratorio, trabajas en soluciones de IA generativa y agéntica, y presentas los resultados con claridad.",
    asks: [
      "Carrera en Actuaría, Matemáticas, Estadística, Física, Computación o Ciencia de Datos.",
      "De 2 a 4 años de experiencia en ciencia de datos, ML o IA.",
      "Python y SQL en la práctica; modelos supervisados y no supervisados, estadística aplicada, ingeniería de variables, evaluación de modelos e interpretabilidad básica (SHAP).",
      "Fundamentos de LLM, prompt engineering, embeddings y RAG, y evaluación básica de respuestas generativas.",
      "Git, TensorFlow o PyTorch, nube (GCP, AWS o Azure) e inglés."
    ],
    note: "Híbrido. Pide de 2 a 4 años de experiencia en ciencia de datos, ML o IA.",
    stations: ["python", "sql", "estadistica", "ml", "llm", "rag", "evaluacion"],
    map: { "python": [255, 180, "r"], "sql": [215, 200, "r"], "estadistica": [110, 295, "r"], "ml": [105, 420, "r"], "llm": [110, 510, "r"], "rag": [110, 565, "l"], "evaluacion": [190, 565, "t"] },
    badge: [267, 148]
  },
  {
    id: "getnet-ai-deploy",
    n: 7,
    color: "l7",
    title: "AI Deployment Engineer",
    company: "Getnet (Grupo Santander)",
    place: "Ciudad de México · híbrido",
    level: "Meta a 2 o 3 años",
    url: "https://job-boards.eu.greenhouse.io/getnet/jobs/5019637101",
    seen: "2026-11-10",
    areas: ["ml", "bak", "inf"],
    summary: "Diseñar, construir y poner en marcha soluciones con IA dentro de la empresa: primero agentes individuales y luego sistemas de varios agentes que trabajan juntos.",
    asks: [
      "Proactividad y capacidad de ejecución: tomar la iniciativa y llevar las ideas a resultados concretos.",
      "Aprendizaje continuo en orquestación de agentes, sistemas multiagente, evaluación y monitoreo, guardrails y seguridad, RAG, MCP, y observabilidad y métricas.",
      "Sentido de responsabilidad: hacerte dueño de tus proyectos y de sus resultados.",
      "Puntos extra: haber construido algo real con IA, en el trabajo, en un proyecto personal o en un emprendimiento."
    ],
    note: "Híbrido. No pide años de experiencia: valora haber construido algo real con IA, en el trabajo, en un proyecto propio o en un emprendimiento.",
    stations: ["agentes", "multiagente", "guardrails", "mcp", "observabilidad", "rag", "evaluacion"],
    map: { "agentes": [230, 710, "r"], "multiagente": [250, 770, "r"], "guardrails": [160, 770, "b"], "mcp": [110, 705, "l"], "observabilidad": [220, 640, "r"], "rag": [110, 565, "l"], "evaluacion": [190, 565, "t"] },
    badge: [203, 730]
  },
  {
    id: "liverpool-negocio-jr",
    n: 8,
    color: "l8",
    title: "Analista de Negocios Jr. (Business Analysis)",
    company: "El Puerto de Liverpool (Corporativo)",
    place: "Santa Fe, Cuajimalpa, Ciudad de México · híbrido",
    level: "Para empezar",
    url: "https://to.indeed.com/aapw7vcyjhrb",
    seen: "2026-11-10",
    areas: ["con", "web"],
    summary: "Hacer de enlace entre los usuarios de negocio y el área de sistemas: recabas información, analizas necesidades y procesos, elaboras los requerimientos funcionales y preparas la documentación para desarrollo y pruebas. También explicas a directivos el impacto de los cambios y capacitas a los equipos de pruebas.",
    asks: [
      "Ingeniería en sistemas, informática, computación o una carrera afín.",
      "Metodologías ágiles.",
      "Desarrollo en Java, HTML o ambos.",
      "Bases de datos relacionales y Excel intermedio.",
      "Herramientas de diagramación."
    ],
    note: "Híbrido: en el corporativo por la mañana y remoto por la tarde, con varios horarios.",
    stations: ["requerimientos", "diagramas", "agil", "sql", "hojas"],
    map: { "requerimientos": [210, 60, "t"], "diagramas": [255, 60, "r"], "agil": [255, 105, "r"], "sql": [215, 200, "r"], "hojas": [135, 200, "l"] },
    badge: [175, 60]
  },
  {
    id: "mapfre-suscriptor-jr",
    n: 9,
    color: "l9",
    title: "Suscriptor Jr. (Daños)",
    company: "MAPFRE",
    place: "San Pedro de los Pinos, Benito Juárez, Ciudad de México",
    level: "Para empezar",
    url: "https://to.indeed.com/aaj9dyj24vr8",
    seen: "2026-11-10",
    areas: ["rsk"],
    summary: "Apoyar el análisis, la evaluación y la gestión de riesgos para suscribir pólizas del ramo de daños. Revisas contratos, administras endosos y expedientes, das asesoría técnica a clientes, visitas sus instalaciones y te coordinas con Siniestros, Verificación y Reaseguro.",
    asks: [
      "Ingeniería Mecánica, Industrial, Petroquímica, Petrolera, Geociencias o afín, como pasante o titulado.",
      "Deseable: 1 año en el sector asegurador, en suscripción o reaseguro de daños, energía, administración de riesgos, finanzas o seguridad industrial.",
      "Conocimientos de administración de riesgos, finanzas o seguridad industrial.",
      "Inglés B2."
    ],
    note: "Pide una ingeniería afín, como mecánica o industrial, e inglés B2. Si estudias computación, estas estaciones te dan la base de seguros y riesgos que el puesto da por hecha, para esta vacante o para otras parecidas del sector. Ofrece bono anual, vales y prestaciones superiores.",
    stations: ["hojas", "estadistica", "seguros", "riesgo"],
    map: { "hojas": [135, 200, "l"], "estadistica": [110, 295, "r"], "seguros": [80, 360, "l"], "riesgo": [55, 430, "b"] },
    badge: [159, 219]
  },
  {
    id: "clivi-growth-ai",
    n: 10,
    color: "l10",
    title: "Growth Modeling & AI Associate",
    company: "Clivi",
    place: "Ciudad de México · presencial",
    level: "Para empezar",
    url: "https://www.linkedin.com/jobs/view/4481760468/",
    seen: "2026-11-15",
    areas: ["dat", "ml"],
    summary: "Entender con datos cómo llegan los pacientes a una healthtech mexicana que atiende diabetes, sobrepeso y obesidad. Relacionas posicionamiento orgánico, tráfico, leads e ingresos, investigas cómo recomiendan servicios de salud ChatGPT, Claude y Perplexity (GEO), diseñas experimentos y armas dashboards que lo conectan todo.",
    asks: [
      "Licenciatura concluida en actuaría, matemáticas, estadística, economía, ingeniería, física, computación o una carrera afín.",
      "De 1 a 3 años de experiencia, o ser recién egresado con proyectos propios que muestren lo que sabes hacer.",
      "Facilidad para trabajar con datos, encontrar patrones y construir modelos; interés por la estadística, la optimización y la IA, y haber experimentado con LLM.",
      "Buen inglés oral y escrito: parte del proceso de selección es en inglés.",
      "Suman puntos: Python, SQL o herramientas de visualización, modelos predictivos, olimpiadas de matemáticas o programación y haber probado SEO o GEO."
    ],
    note: "Tiempo completo y presencial en la Ciudad de México. Pide de 1 a 3 años de experiencia o ser recién egresado con proyectos propios, y buen inglés. Dice que no busca un expediente perfecto, sino evidencia de lo que puedes hacer. Se postula en LinkedIn con Easy Apply (solicitud sencilla). Ofrece participación en la empresa (equity).",
    stations: ["estadistica", "experimentos", "embudo", "seo-geo", "tableros"],
    map: { "estadistica": [110, 295, "r"], "experimentos": [60, 295, "t"], "embudo": [150, 335, "b"], "seo-geo": [195, 330, "t"], "tableros": [290, 315, "b"] },
    badge: [144, 312]
  },
  {
    id: "toku-software-eng",
    n: 11,
    color: "l11",
    title: "Software Engineer MX",
    company: "Toku",
    place: "México · híbrido",
    level: "Para empezar",
    url: "https://jobs.ashbyhq.com/Toku/2ab175a3-eda8-48a4-bee0-4e1db97fa007",
    seen: "2026-11-15",
    areas: ["web", "bak"],
    summary: "Diseñar, desarrollar y mantener aplicaciones web full stack, con Vue.js en el frontend y Python con FastAPI en el backend. Defines requisitos con el equipo, pruebas y despliegas, y hablas directo con clientes para entender sus procesos y convertir sus problemas en funciones del producto.",
    asks: [
      "Bases de datos relacionales, como PostgreSQL, y control de versiones con Git.",
      "Explicar problemas y soluciones técnicas con claridad a clientes o a personas no técnicas.",
      "Escribir código legible, sostenible y eficiente, y trabajar en todas las partes del full stack.",
      "Resolver problemas con varios sistemas o fuentes de datos, y conocer los pros y contras de cada tecnología.",
      "Deseable: TypeScript y Vue.js, Python y FastAPI, nube (Google Cloud o AWS), Scrum o Kanban, y pruebas automatizadas y revisiones de código."
    ],
    note: "Híbrido y de tiempo completo. No dice cuántos años de experiencia pide y aclara que no busca a alguien perfecto ni con todas las habilidades, sino comprometido con aprender. También te invita a participar en la elección de futuros integrantes del equipo.",
    stations: ["frontend", "apis", "sql", "git", "pruebas-auto", "requerimientos"],
    map: { "frontend": [105, 250, "l"], "apis": [185, 255, "b"], "sql": [215, 200, "r"], "git": [215, 125, "t"], "pruebas-auto": [175, 105, "l"], "requerimientos": [210, 60, "t"] },
    badge: [69, 231]
  },
  {
    id: "nubank-ai-design",
    n: 12,
    color: "l12",
    title: "AI Engineer, Design",
    company: "Nubank",
    place: "Ciudad de México u otras sedes de Nu · híbrido",
    level: "Meta a 4 o 5 años",
    url: "https://jobs.ashbyhq.com/nubank/fac13a25-9ede-43a9-b644-ad0e2760cb6d",
    seen: "2026-11-15",
    areas: ["ml", "web"],
    summary: "Ser el primer ingeniero del Centro de Excelencia de Diseño de Nu y construir los sistemas, cada vez más agénticos, con los que trabajan unas 260 personas de diseño e investigación. Lo primero es NuBrain, un sistema global de conocimiento que une más de 30 repositorios locales; también decides si cada herramienta debe ser un plugin, un servidor MCP, un agente o una plataforma, y la mides desde el primer día.",
    asks: [
      "Años construyendo sistemas sobre los que otros equipos construyen, y experiencia reciente con modelos de IA: consumo de tokens, límites de tasa, latencia y servidores MCP.",
      "Haber diseñado y construido bases de experiencia de usuario a escala: sistemas de diseño, plataformas de componentes o infraestructura de frontend que usan muchos equipos.",
      "Gusto por el diseño que se note en tu trabajo y, lo que más pesa para el puesto, haber construido agentes o herramientas que ayuden a diseñadores a hacer más.",
      "Llevar proyectos por tu cuenta en una organización grande, sin un PM detrás, y explicar decisiones técnicas a quien no lee código.",
      "Evidencia de lo que construiste: GitHub, herramientas en uso y demos que puedas explicar."
    ],
    note: "Híbrido, en la Ciudad de México o en otra sede de Nu. No da una cifra, pero busca a alguien con mucha experiencia: años construyendo sistemas para otros equipos y experiencia reciente con IA. Es una meta a 4 o 5 años, no un primer empleo. La vacante se publicó en inglés.",
    stations: ["sistemas-diseno", "llm", "rag", "costo-latencia", "mcp", "agentes", "observabilidad"],
    map: { "sistemas-diseno": [60, 510, "b"], "llm": [110, 510, "r"], "rag": [110, 565, "l"], "costo-latencia": [120, 635, "l"], "mcp": [110, 705, "l"], "agentes": [230, 710, "r"], "observabilidad": [220, 640, "r"] },
    badge: [84, 485]
  }
];

if (typeof module !== 'undefined') module.exports = { LINEAS: LINEAS };
