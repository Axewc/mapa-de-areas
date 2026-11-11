// Líneas del hub: cada una es una vacante real, leída completa en la fecha de `seen`. Van en orden L1 a L9.
// Forma (spec «Modelo de contenido»): { id, n, color, title, company, place, level, url, seen, areas, summary, asks, note?, stations, map }
// `stations` va en orden de estudio. `map` da { id: [x, y, lado?] } en un viewBox de 360 de ancho; el lado ('l', 'r' por defecto,
// 't' arriba o 'b' abajo) es donde va la etiqueta. Una estación compartida lleva
// las mismas coordenadas en todas sus líneas. tests/content.test.mjs revisa el mapa con mapIssues (js/core.js).
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
    map: { "git": [215, 120, "l"], "datos": [175, 160, "l"], "sql": [215, 200, "r"], "apis": [160, 270, "r"], "pruebas-auto": [150, 325, "b"] }
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
    map: { "hojas": [135, 200, "l"], "datos": [175, 160, "l"], "sql": [215, 200, "r"], "tableros": [295, 280, "b"], "indicadores": [344, 220, "l"] }
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
    map: { "casos-prueba": [85, 90, "t"], "defectos": [85, 150, "l"], "hojas": [135, 200, "l"], "pruebas-auto": [150, 325, "b"] }
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
    map: { "linux": [300, 522, "b"], "nube": [262, 485, "l"], "monitoreo": [260, 355, "r"], "sql": [215, 200, "r"], "git": [215, 120, "l"] }
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
    map: { "redes": [338, 485, "t"], "linux": [300, 522, "b"], "monitoreo": [260, 355, "r"], "amenazas": [235, 395, "l"], "incidentes": [235, 445, "l"] }
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
    map: { "python": [220, 300, "l"], "sql": [215, 200, "r"], "estadistica": [95, 285, "l"], "ml": [110, 420, "r"], "llm": [110, 510, "r"], "rag": [110, 565, "l"], "evaluacion": [195, 565, "b"] }
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
    map: { "agentes": [265, 580, "r"], "multiagente": [265, 640, "r"], "guardrails": [200, 705, "b"], "mcp": [110, 705, "l"], "observabilidad": [110, 650, "l"], "rag": [110, 565, "l"], "evaluacion": [195, 565, "b"] }
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
    map: { "requerimientos": [305, 40, "t"], "diagramas": [255, 85, "l"], "agil": [255, 160, "r"], "sql": [215, 200, "r"], "hojas": [135, 200, "l"] }
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
    map: { "hojas": [135, 200, "l"], "estadistica": [95, 285, "l"], "seguros": [80, 360, "l"], "riesgo": [55, 430, "b"] }
  }
];

if (typeof module !== 'undefined') module.exports = { LINEAS: LINEAS };
