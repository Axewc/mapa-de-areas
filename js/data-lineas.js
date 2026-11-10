// Líneas del hub: cada una es una vacante real, leída completa en la fecha de `seen`. Van en orden L1 a L7.
// Forma (spec «Modelo de contenido»): { id, n, color, title, company, place, level, url, seen, areas, summary, asks, note?, stations, map }
// `stations` va en orden de estudio. `map` da { id: [x, y, lado?] } en un viewBox de 360 de ancho; lado 'l' o 'r' (por defecto 'r')
// es donde va la etiqueta. Una estación compartida lleva las mismas coordenadas en todas sus líneas.
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
    map: { "git": [245, 360, "r"], "datos": [195, 290, "r"], "sql": [185, 395, "l"], "apis": [160, 440, "l"], "pruebas-auto": [115, 525, "r"] }
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
    map: { "hojas": [125, 240, "l"], "datos": [195, 290, "r"], "sql": [185, 395, "l"], "tableros": [225, 395, "r"], "indicadores": [245, 430, "r"] }
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
    map: { "casos-prueba": [110, 30, "r"], "defectos": [120, 140, "r"], "hojas": [125, 240, "l"], "pruebas-auto": [115, 525, "r"] }
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
    map: { "linux": [344, 450, "l"], "nube": [320, 610, "l"], "monitoreo": [275, 545, "l"], "sql": [185, 395, "l"], "git": [245, 360, "r"] }
  }
];

if (typeof module !== 'undefined') module.exports = { LINEAS: LINEAS };
