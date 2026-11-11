// Estaciones del hub: cada una es una habilidad que se aprende una vez y cuenta en todas las líneas que pasan por ella.
// Forma (spec «Modelo de contenido»): { id, name, plain, why, steps: [4 × { idea, q }], extra: [2 × q], task: { n, d, t }, res: [1 a 3 × { n, u }] }
// Cada q es { q, opts: [4 textos], ok: índice de la correcta, why }. Los ítems son «id.0» a «id.5»: no cambies el orden de las preguntas publicadas.
// Script clásico (ES5): define la global ESTACIONES y se exporta para las pruebas con Node.

var ESTACIONES = {
  "git": {
    id: "git",
    name: "Git",
    plain: "Git guarda la historia de tu código: cada cambio queda registrado y puedes volver a cualquier versión.",
    why: "EDAR Tech pide Git y GitHub para trabajar en equipo, y SatoriTech lo cuenta como punto extra. Además, tu perfil de GitHub es lo primero que revisan cuando dices que tienes proyectos: ahí se ve qué hiciste y cómo lo hiciste.",
    steps: [
      {
        idea: "Un repositorio es una carpeta que Git vigila. Cada commit es una foto de tus archivos con un mensaje que dice qué cambió. La historia es la lista de esos commits, y puedes volver a cualquiera de ellos.",
        q: { q: "¿Qué guarda un commit?", opts: ["Una foto de tus archivos y un mensaje", "Una copia de seguridad automática en la nube", "Solo los nombres de los archivos que modificaste", "Los permisos de cada archivo del proyecto"], ok: 0, why: "Un commit registra cómo estaban los archivos que preparaste, junto con tu mensaje. No se sube solo a ningún lado: eso lo haces tú con git push. Por eso no es una copia automática en la nube." }
      },
      {
        idea: "Antes de un commit eliges qué entra con git add: es el «área de preparación». Así un commit lleva solo los cambios que van juntos, aunque hayas tocado más archivos.",
        q: { q: "Modificaste tres archivos, pero solo dos tienen que ver con el error que corregiste. ¿Qué haces?", opts: ["Haces commit de los tres y lo explicas en el mensaje", "Borras el tercer archivo para que no estorbe", "Agregas solo esos dos con git add y haces commit", "Esperas a terminar todo y haces un solo commit"], ok: 2, why: "git add te deja armar un commit con los cambios que van juntos, así la historia es fácil de leer y de revertir. Meter los tres «y explicarlo en el mensaje» parece práctico, pero mezcla dos cambios en uno." }
      },
      {
        idea: "Una rama (branch) es una línea de trabajo aparte. Creas una para cada cambio, trabajas ahí sin tocar la rama principal (main) y, cuando está lista, la unes con un merge.",
        q: { q: "¿Para qué sirve crear una rama antes de agregar una función nueva?", opts: ["Para que Git trabaje más rápido", "Para trabajar sin afectar la rama principal hasta que esté listo", "Para tener un respaldo si se descompone el disco", "Para que nadie más pueda ver tu código"], ok: 1, why: "La rama aísla tu trabajo: main sigue funcionando mientras tú pruebas. No es un respaldo, porque vive en el mismo repositorio, y tampoco oculta tu código: si la subes, tu equipo la ve." }
      },
      {
        idea: "GitHub guarda una copia de tu repositorio en internet. Con git push subes tus commits y con git pull bajas los de los demás. Un pull request pide que otra persona revise tu rama antes de unirla a main.",
        q: { q: "Terminaste tu rama y quieres que una compañera revise el código antes de unirlo a main. ¿Qué abres en GitHub?", opts: ["Un issue con el código pegado en la descripción", "Una copia del repositorio en tu computadora", "Un repositorio nuevo solo para la revisión", "Un pull request de tu rama hacia main"], ok: 3, why: "El pull request muestra las diferencias, permite comentar línea por línea y, al aprobarlo, une la rama. Un issue sirve para reportar o discutir un problema, no para revisar y unir código." }
      }
    ],
    extra: [
      { q: "Hiciste git pull y Git avisa que hay un conflicto en app.py. ¿Qué significa?", opts: ["Que el archivo se dañó y hay que bajarlo otra vez", "Que tú y otra persona cambiaron las mismas líneas y Git no sabe cuál dejar", "Que no tienes permiso para modificar ese archivo", "Que tu versión de Git es vieja"], ok: 1, why: "Git une solo los cambios que no se pisan. Cuando dos personas tocan las mismas líneas, marca el conflicto para que tú elijas qué queda; luego haces add y commit. El archivo no está dañado: solo tiene las dos versiones marcadas." },
      { q: "Subiste por error un archivo con la contraseña de la base de datos y en el siguiente commit lo borraste. ¿Ya está resuelto?", opts: ["Sí, porque el último commit ya no tiene el archivo", "Sí: si el repositorio es privado, nadie lo verá", "No: sigue en la historia; cambia la contraseña", "No: hay que borrar el repositorio y crearlo de nuevo"], ok: 2, why: "La historia guarda todos los commits, así que cualquiera con acceso puede ver la versión que tenía la contraseña. Lo primero es cambiarla; luego se limpia la historia. Borrar el repositorio pierde el trabajo y no invalida la contraseña que ya se expuso." }
    ],
    task: { n: "Tu primer repositorio con historia", d: "Crea en GitHub un repositorio para un proyecto escolar que ya tengas. Haz al menos cinco commits con mensajes claros, crea una rama para un cambio pequeño (por ejemplo, un README que explique cómo correrlo), abre un pull request y únelo. Al terminar, tu perfil ya muestra un proyecto con historia.", t: "1 tarde" },
    res: [
      { n: "Pro Git, en español (git-scm.com): los capítulos 1 a 3 cubren todo lo de esta estación", u: "https://git-scm.com/book/es/v2" },
      { n: "Hola mundo (GitHub Docs): repositorio, rama, commit y pull request desde el navegador", u: "https://docs.github.com/es/get-started/start-your-journey/hello-world" }
    ]
  },

  "datos": {
    id: "datos",
    name: "Datos",
    plain: "Organizar la información en tablas limpias y conectadas, para que se pueda consultar sin errores.",
    why: "EDAR Tech pide bases de datos relacionales, y en Sears buena parte del trabajo es limpiar y validar las bases de recursos humanos antes de analizarlas. Si los datos están mal, el tablero y la consulta también lo estarán.",
    steps: [
      {
        idea: "Una base de datos relacional guarda la información en tablas. Cada fila es un registro (un empleado, una venta) y cada columna es un dato de ese registro, siempre del mismo tipo: texto, número o fecha.",
        q: { q: "En una tabla de empleados, ¿qué representa cada fila?", opts: ["Un tipo de dato, como texto o fecha", "Un empleado, con todos sus datos", "La lista de nombres de todos", "Un archivo distinto de la base"], ok: 1, why: "Cada fila es un registro completo: un empleado con su nombre, puesto y fecha de ingreso. Las columnas son los datos que tiene cada registro, como «puesto»; el tipo de dato es una propiedad de la columna, no una fila." }
      },
      {
        idea: "La llave primaria es la columna que identifica cada fila sin repetirse, como el número de empleado. El nombre no sirve: dos personas pueden llamarse igual.",
        q: { q: "¿Qué columna conviene como llave primaria de una tabla de empleados?", opts: ["El nombre completo", "El correo personal", "El número de empleado", "El área donde trabaja"], ok: 2, why: "La llave tiene que ser única y no cambiar, y el número de empleado cumple las dos cosas. El correo parece único, pero la persona puede cambiarlo, y entonces habría que corregirlo en todas las tablas que lo usan." }
      },
      {
        idea: "Una llave foránea conecta tablas: la tabla de ausencias guarda el número de empleado en vez de copiar su nombre y su área. Así cada dato vive en un solo lugar y, si cambia, se corrige una vez.",
        q: { q: "¿Por qué la tabla de ausencias guarda el número de empleado y no su nombre y su área?", opts: ["Para corregir un cambio de área en un solo lugar", "Porque una llave foránea solo puede guardar números", "Porque una base no puede guardar texto en dos tablas", "Para que nadie sepa quién faltó"], ok: 0, why: "Si copias el área en cada ausencia, un cambio de área deja datos que se contradicen. Con la llave foránea, el dato vive solo en la tabla de empleados. Y no es que la llave foránea solo acepte números: también puede ser texto, mientras apunte a la llave de la otra tabla." }
      },
      {
        idea: "Antes de analizar, limpia: quita filas duplicadas, revisa celdas vacías (NULL), unifica formatos («CDMX» y «Ciudad de México») y busca valores imposibles, como una fecha de baja anterior a la de ingreso.",
        q: { q: "Al contar empleados por estado te salen «CDMX», «Cdmx» y «Ciudad de México» por separado. ¿Qué pasó?", opts: ["Hay tres estados distintos en la base", "El programa que cuenta tiene un error", "Faltan llaves foráneas en la tabla de estados", "El mismo lugar se capturó de formas distintas"], ok: 3, why: "Para la computadora son tres textos distintos, aunque para ti sean el mismo lugar. Se arregla unificando el formato antes de contar. Una tabla de estados con llave foránea lo evita desde el diseño, pero lo que pasó aquí es un problema de captura." }
      }
    ],
    extra: [
      { q: "En la base de recursos humanos, un empleado aparece dos veces con el mismo número pero con distinta fecha de ingreso. ¿Qué haces primero?", opts: ["Borras la fila más reciente", "Promedias las dos fechas", "Revisas la fuente original y anotas el cambio", "Dejas las dos filas, porque casi no se nota"], ok: 2, why: "Un duplicado con datos distintos no se resuelve adivinando: se revisa la fuente (el expediente, el sistema de nómina) y se deja registro del cambio. Borrar la más reciente es rápido, pero podrías quitar justo la fecha buena." },
      { q: "Diseñas la base de una tienda en línea con clientes, productos y pedidos. Un pedido puede tener varios productos. ¿Cómo lo guardas?", opts: ["Una tabla de pedidos con una columna de texto que liste los productos separados por comas", "Una tabla de detalle: una fila por producto de cada pedido, con sus llaves", "Una sola tabla con los datos del cliente, del producto y del pedido en cada fila", "Una tabla por cada cliente"], ok: 1, why: "La tabla de detalle (una fila por cada producto de cada pedido) permite sumar, filtrar y contar con SQL. La lista separada por comas parece más sencilla, pero no se puede consultar bien: para saber cuántas veces se vendió un producto tendrías que partir textos." }
    ],
    task: { n: "Diseña y limpia una base pequeña", d: "Descarga un CSV de datos abiertos (en datos.gob.mx hay muchos) o inventa uno de 50 empleados. Ábrelo en una hoja de cálculo, busca duplicados, celdas vacías y formatos distintos, y anota cada corrección. Luego dibuja en papel cómo lo separarías en dos tablas conectadas por una llave.", t: "1 tarde" },
    res: [
      { n: "Restricciones: llaves primarias y foráneas (documentación de PostgreSQL)", u: "https://www.postgresql.org/docs/current/ddl-constraints.html" },
      { n: "Las diez formas principales de limpiar los datos (Soporte de Microsoft)", u: "https://support.microsoft.com/es-es/Excel/top-ten-ways-to-clean-your-data" }
    ]
  },

  "sql": {
    id: "sql",
    name: "SQL",
    plain: "SQL es el lenguaje con el que le pides datos a una base: qué columnas, de qué tabla y con qué condiciones.",
    why: "EDAR Tech pide consultas SQL y SatoriTech pide consultas y validaciones en Oracle. Sears no lo pide por nombre, pero en un puesto como ese los datos de los reportes casi siempre salen de una base que se consulta con SQL.",
    steps: [
      {
        idea: "La consulta básica es SELECT columnas FROM tabla WHERE condición. SELECT dice qué columnas quieres, FROM de qué tabla y WHERE qué filas. Ejemplo: SELECT nombre FROM empleados WHERE area = 'Ventas'.",
        q: { q: "¿Qué hace WHERE en una consulta?", opts: ["Elige qué columnas se muestran", "Ordena el resultado de la consulta", "Filtra filas con una condición", "Dice de qué tabla salen los datos"], ok: 2, why: "WHERE se queda solo con las filas que cumplen la condición, como area = 'Ventas'. Las columnas se eligen en SELECT y el orden se da con ORDER BY, que a veces se confunde con WHERE porque los dos van después de FROM." }
      },
      {
        idea: "GROUP BY junta las filas que comparten un valor y te deja contarlas o sumarlas por grupo. SELECT area, COUNT(*) FROM empleados GROUP BY area te dice cuántas personas hay en cada área.",
        q: { q: "Quieres saber cuántas ausencias hubo en cada área. ¿Qué parte de la consulta lo hace posible?", opts: ["GROUP BY area con COUNT(*)", "ORDER BY area y luego COUNT(*)", "WHERE area IS NOT NULL", "SELECT DISTINCT area, COUNT(*)"], ok: 0, why: "GROUP BY arma un grupo por área y COUNT(*) cuenta las filas de cada uno. SELECT DISTINCT quita los repetidos, pero sin GROUP BY no arma un conteo por área." }
      },
      {
        idea: "JOIN une tablas por una columna en común. SELECT e.nombre, a.fecha FROM ausencias a JOIN empleados e ON a.num_empleado = e.num_empleado muestra el nombre junto a cada ausencia, sin haberlo copiado.",
        q: { q: "Tienes ausencias (con num_empleado) y empleados (con num_empleado y nombre). ¿Cómo ves el nombre de quien faltó?", opts: ["Con WHERE nombre = num_empleado", "Copiando la columna nombre a la tabla de ausencias", "Con GROUP BY num_empleado", "Con un JOIN de las dos tablas por num_empleado"], ok: 3, why: "JOIN empareja cada ausencia con el empleado que tiene el mismo número. Copiar la columna funciona una vez, pero repite datos y se desactualiza en cuanto alguien cambie de nombre o de área." }
      },
      {
        idea: "Un JOIN normal (INNER JOIN) solo deja las filas que tienen pareja en las dos tablas. Para ver a todos los empleados, aunque no tengan ausencias, usa LEFT JOIN: los que no tienen pareja salen con NULL.",
        q: { q: "Con un JOIN normal, tu lista de empleados con sus ausencias trae menos personas que la plantilla. ¿Por qué?", opts: ["Porque JOIN borra filas de la tabla original", "Porque el INNER JOIN deja fuera a quien no tiene ausencias", "Porque hay empleados duplicados", "Porque falta un ORDER BY"], ok: 1, why: "INNER JOIN solo muestra a quien tiene al menos una ausencia; los demás no tienen pareja y no aparecen. Con LEFT JOIN salen todos. JOIN nunca borra datos de la tabla: solo cambia lo que muestra la consulta." }
      }
    ],
    extra: [
      { q: "Necesitas las áreas con más de 10 bajas en 2026. ¿Qué consulta lo hace?", opts: ["SELECT area, COUNT(*) FROM bajas WHERE anio = 2026 AND COUNT(*) > 10 GROUP BY area", "SELECT area, COUNT(*) FROM bajas WHERE anio = 2026 GROUP BY area HAVING COUNT(*) > 10", "SELECT area FROM bajas WHERE anio = 2026 AND area > 10", "SELECT area, COUNT(*) FROM bajas GROUP BY area ORDER BY COUNT(*) > 10"], ok: 1, why: "WHERE filtra filas antes de agrupar, así que ahí va el año; HAVING filtra los grupos ya contados, así que ahí va COUNT(*) > 10. Poner COUNT(*) en el WHERE es el error más común, y da error porque en ese momento todavía no hay grupos." },
      { q: "Te piden validar que ninguna orden apunte a un cliente que no existe. Las órdenes guardan id_cliente. ¿Qué consulta muestra esas órdenes?", opts: ["SELECT * FROM ordenes o LEFT JOIN clientes c ON o.id_cliente = c.id WHERE c.id IS NULL", "SELECT * FROM ordenes o JOIN clientes c ON o.id_cliente = c.id", "SELECT * FROM ordenes WHERE id_cliente = NULL", "SELECT id_cliente, COUNT(*) FROM ordenes GROUP BY id_cliente"], ok: 0, why: "El LEFT JOIN conserva todas las órdenes y pone NULL donde no hay cliente que coincida; el WHERE se queda justo con esas. El JOIN normal hace lo contrario: muestra solo las que sí tienen cliente. Y «= NULL» nunca es verdadero: se escribe IS NULL." }
    ],
    task: { n: "Veinte preguntas a una base de práctica", d: "Instala SQLite (o PostgreSQL) y crea dos tablas: empleados (num_empleado, nombre, area, ingreso) y ausencias (num_empleado, fecha, motivo), con 30 filas inventadas. Escribe consultas que respondan cuántas personas hay por área, quién faltó más, qué áreas pasan de 5 ausencias y quién nunca ha faltado. Guárdalas en un archivo .sql en GitHub.", t: "1 tarde" },
    res: [
      { n: "El lenguaje SQL, capítulo 2 del tutorial de PostgreSQL: tablas, consultas, JOIN y funciones de agregación", u: "https://www.postgresql.org/docs/current/tutorial-sql.html" },
      { n: "Joins entre tablas (tutorial de PostgreSQL)", u: "https://www.postgresql.org/docs/current/tutorial-join.html" }
    ]
  },

  "apis": {
    id: "apis",
    name: "APIs",
    plain: "Una API es la forma en que un programa le pide datos o acciones a otro por internet, con mensajes que los dos entienden.",
    why: "EDAR Tech pide conocer APIs y servicios web, y te suma puntos si ya hiciste una API REST. Casi toda aplicación web es una pantalla (frontend) que le habla a una API.",
    steps: [
      {
        idea: "Con HTTP, el cliente manda una petición y el servidor contesta. La petición lleva un método y una dirección, el endpoint: GET /empleados/42 pide los datos del empleado 42.",
        q: { q: "En GET /empleados/42, ¿qué es /empleados/42?", opts: ["El método de la petición", "El endpoint del recurso", "El código de respuesta del servidor", "El formato de los datos"], ok: 1, why: "El endpoint dice qué recurso quieres y el método (GET) dice qué quieres hacer con él. Se confunden porque van juntos en la misma línea, pero son dos partes distintas." }
      },
      {
        idea: "Los métodos HTTP más usados: GET consulta, POST crea, PUT o PATCH actualizan y DELETE borra. Una API REST usa esos métodos sobre recursos con nombre, como /empleados.",
        q: { q: "Quieres registrar un empleado nuevo en la API. ¿Qué método usas?", opts: ["GET", "DELETE", "POST", "PATCH"], ok: 2, why: "POST crea un recurso nuevo. PATCH también manda datos, por eso tienta, pero sirve para cambiar uno que ya existe, como el puesto de un empleado ya registrado." }
      },
      {
        idea: "La respuesta trae un código de estado: 200 salió bien, 201 se creó, 400 la petición venía mal, 401 o 403 falta permiso, 404 no existe y 500 falló el servidor. Los 4xx son del cliente; los 5xx, del servidor.",
        q: { q: "Tu app pide /empleados/999 y recibe un 404. ¿Qué significa?", opts: ["Que el servidor se cayó y hay que reiniciarlo", "Que no tienes permiso para ver a ese empleado", "Que todo salió bien, pero la respuesta está vacía", "Que no existe nada en esa dirección"], ok: 3, why: "404 quiere decir «no encontrado»: no hay empleado 999 o la dirección está mal escrita. Si el servidor hubiera fallado sería un 500, y si faltara permiso sería un 401 o un 403." }
      },
      {
        idea: "Los datos viajan casi siempre en JSON: {\"nombre\": \"Ana\", \"area\": \"Ventas\"}. En JavaScript, fetch hace la petición y response.json() convierte la respuesta en un objeto que puedes usar.",
        q: { q: "¿Por qué casi todas las APIs mandan sus datos en JSON?", opts: ["Porque casi cualquier lenguaje sabe leerlo", "Porque cifra los datos para que nadie más los lea", "Porque es el único formato que acepta HTTP", "Porque ocupa menos que cualquier otro formato"], ok: 0, why: "JSON es texto sencillo y cada lenguaje tiene cómo leerlo, así que un servidor en Java y una app en JavaScript se entienden. No cifra nada (eso lo hace HTTPS), y HTTP también lleva otros formatos, como HTML o imágenes." }
      }
    ],
    extra: [
      { q: "Tu formulario manda los datos de un empleado nuevo y la API contesta 400 con {\"error\": \"falta el campo correo\"}. ¿Dónde está el problema?", opts: ["En el servidor, que se cayó", "En tu petición", "En la red, que perdió parte del mensaje", "En la base de datos, que está llena"], ok: 1, why: "Los 4xx indican que la petición del cliente viene mal, y el mensaje dice qué campo falta. Si el servidor hubiera fallado, la respuesta sería un 5xx, como un 500." },
      { q: "Diseñas una API de ausencias. ¿Qué endpoint para consultar las del empleado 42 sigue mejor el estilo REST?", opts: ["POST /obtenerAusencias?empleado=42", "GET /ausencias/borrar/42", "GET /empleados/42/ausencias", "DELETE /empleados/42/ausencias"], ok: 2, why: "En REST la dirección nombra el recurso (las ausencias del empleado 42) y el método dice la acción: GET para consultar. Usar POST con un verbo en la dirección funciona, pero mezcla las dos cosas y hace la API más difícil de entender." }
    ],
    task: { n: "Una API pequeña con dos endpoints", d: "Con Python y FastAPI, o con Node y Express, haz una API con GET /empleados y POST /empleados que guarde en una lista o en SQLite. Pruébala con curl o desde el navegador, haz que conteste 400 si falta el nombre y súbela a GitHub con un README que muestre ejemplos de petición y respuesta.", t: "1 tarde" },
    res: [
      { n: "Generalidades de HTTP (MDN): peticiones, respuestas y métodos", u: "https://developer.mozilla.org/docs/Web/HTTP/Guides/Overview" },
      { n: "Códigos de estado de respuesta HTTP (MDN)", u: "https://developer.mozilla.org/docs/Web/HTTP/Reference/Status" },
      { n: "Usando Fetch (MDN): pedirle datos a una API desde JavaScript", u: "https://developer.mozilla.org/docs/Web/API/Fetch_API/Using_Fetch" }
    ]
  },

  "pruebas-auto": {
    id: "pruebas-auto",
    name: "Pruebas automáticas",
    plain: "Código que revisa tu código: corre tu programa con datos conocidos y te avisa si el resultado no es el esperado.",
    why: "Un proyecto en GitHub con pruebas es de lo que más distingue a un desarrollador junior como el que busca EDAR Tech. Y para quien empieza como tester, como en MVS, automatizar las pruebas que hoy hace a mano es el siguiente paso.",
    steps: [
      {
        idea: "Una prueba unitaria revisa una función sola: le das una entrada y comparas la salida con la esperada. Si calcular_iva(100) debe dar 16, la prueba dice assert calcular_iva(100) == 16.",
        q: { q: "¿Qué comprueba una prueba unitaria?", opts: ["Que una función dé el resultado esperado", "Que la página se vea bien en el teléfono", "Que el servidor aguante a mil usuarios", "Que el código siga las reglas de estilo"], ok: 0, why: "La prueba unitaria aísla una pieza pequeña y verifica su resultado. Revisar el estilo también se automatiza, pero lo hace otra herramienta, un linter, y no dice si el resultado es correcto." }
      },
      {
        idea: "Prueba también los casos raros, no solo el normal: cero, números negativos, listas vacías, texto donde esperabas un número. Ahí suelen esconderse los errores.",
        q: { q: "Escribiste una prueba para promedio([8, 9, 10]) y pasa. ¿Qué otra prueba agrega más valor?", opts: ["promedio([7, 8, 9]), para confirmar", "promedio([]), con una lista vacía", "promedio([8, 9, 10]) otra vez, con otro nombre", "promedio([80, 90, 100]), con números más grandes"], ok: 1, why: "Con una lista vacía hay que dividir entre cero: es un caso raro donde la función puede fallar. Probar con números más grandes parece distinto, pero recorre exactamente el mismo camino del código que la prueba que ya tienes." }
      },
      {
        idea: "Con pytest, cada función cuyo nombre empieza con test_, dentro de un archivo test_*.py, es una prueba, y el comando pytest las corre todas. Si una falla, te dice cuál, qué esperaba y qué obtuvo.",
        q: { q: "Corres pytest y una prueba falla con «assert 15 == 16». ¿Qué te dice?", opts: ["Que pytest está mal instalado", "Que la prueba tiene un error de sintaxis", "Que la función dio 15 y se esperaba 16", "Que hay que borrar esa prueba"], ok: 2, why: "pytest muestra el valor que obtuvo y el que esperabas; luego revisas si el error está en la función o en lo que la prueba espera. Un error de sintaxis se vería distinto: el archivo ni siquiera correría." }
      },
      {
        idea: "Las pruebas valen más si corren solas. Con integración continua (por ejemplo, GitHub Actions), cada vez que subes cambios se corren todas, y si una falla te enteras antes de unir tu rama.",
        q: { q: "¿Qué ganas al correr las pruebas con GitHub Actions en cada push?", opts: ["Que tu código corra más rápido en producción", "Que ya no necesites escribir pruebas nuevas", "Que GitHub corrija tus errores solo", "Que una prueba rota se note antes de unir"], ok: 3, why: "La integración continua corre las pruebas por ti en cada cambio, así un error se nota antes de llegar a main. No escribe ni corrige pruebas: solo las ejecuta y te avisa." }
      }
    ],
    extra: [
      { q: "Cambiaste la función que calcula descuentos y ahora fallan dos pruebas viejas que antes pasaban. ¿Qué es lo más probable?", opts: ["Que las pruebas viejas ya no sirven y hay que borrarlas", "Que tu cambio rompió algo: una regresión", "Que pytest tiene un error", "Que la computadora está lenta"], ok: 1, why: "Si pasaban antes y fallan después de tu cambio, lo más probable es que rompiste algo: eso es una regresión, justo lo que las pruebas atrapan. Borrarlas tienta, pero esconde el problema; solo se actualizan si el comportamiento debía cambiar a propósito." },
      { q: "Una función manda un correo de bienvenida al registrar a alguien. ¿Cómo la pruebas sin mandar correos reales?", opts: ["No se puede probar: solo a mano", "Usas tu correo personal y revisas la bandeja", "Cambias el envío por un mock y revisas cómo se llamó", "Comentas la línea que envía el correo"], ok: 2, why: "Un mock es un objeto falso que toma el lugar del servicio de correo y registra cómo lo llamaron, así la prueba es rápida y no depende de internet. Comentar la línea hace que la prueba pase, pero ya no comprueba nada del envío." }
    ],
    task: { n: "Diez pruebas para un proyecto tuyo", d: "Toma un proyecto escolar en Python (o escribe una función que calcule la nómina de una semana) y escríbele 10 pruebas con pytest: casos normales, casos límite y entradas inválidas. Luego agrega un flujo de GitHub Actions que las corra en cada push y anota en el README cómo correrlas.", t: "1 tarde" },
    res: [
      { n: "Get Started (pytest): instalar y escribir tus primeras pruebas", u: "https://docs.pytest.org/en/stable/getting-started.html" },
      { n: "The Practical Test Pyramid (martinfowler.com): qué tipos de prueba conviene tener y en qué proporción", u: "https://martinfowler.com/articles/practical-test-pyramid.html" }
    ]
  },

  "hojas": {
    id: "hojas",
    name: "Hojas de cálculo",
    plain: "Excel y programas parecidos: tablas donde ordenas, filtras, calculas y resumes datos sin programar.",
    why: "Sears pide Excel intermedio para analizar indicadores, y MVS lo pide para validar datos durante las pruebas: filtros, validaciones y tablas. Es la herramienta que usa todo mundo en la oficina.",
    steps: [
      {
        idea: "Convierte tus datos en tabla (Insertar > Tabla): cada columna lleva encabezado, los filtros aparecen solos y las fórmulas se copian a las filas nuevas. Primero ordena y filtra; luego calcula.",
        q: { q: "Tienes 2,000 registros de empleados y solo quieres ver los del área de Ventas. ¿Qué usas?", opts: ["Un filtro en la columna de área", "Borrar las filas de las otras áreas", "Una gráfica de pastel", "Copiar a mano los de Ventas a otra hoja"], ok: 0, why: "El filtro oculta lo que no te interesa sin borrar nada, y lo quitas con un clic. Copiar a mano también funciona, pero con 2,000 filas es lento y es fácil saltarte alguna." }
      },
      {
        idea: "Una fórmula empieza con =. Las básicas: SUMA, PROMEDIO, CONTAR.SI y SUMAR.SI. =CONTAR.SI(C:C, \"Ventas\") cuenta cuántas celdas de la columna C dicen Ventas.",
        q: { q: "¿Qué fórmula te dice cuántos empleados hay en el área de Ventas, si el área está en la columna C?", opts: ["=SUMA(C:C)", "=CONTAR.SI(C:C, \"Ventas\")", "=PROMEDIO(C:C)", "=SI(C:C=\"Ventas\", 1, 0)"], ok: 1, why: "CONTAR.SI cuenta las celdas que cumplen una condición. SI tienta porque también lleva una condición, pero contesta caso por caso; no te da el conteo." }
      },
      {
        idea: "BUSCARX trae un dato de otra tabla. =BUSCARX(A2, Plantilla!A:A, Plantilla!B:B) busca el número de empleado de A2 en la columna A de la hoja Plantilla y devuelve lo que hay en la columna B de esa fila: su nombre.",
        q: { q: "Tienes una hoja de ausencias (solo con el número de empleado) y otra con la plantilla. ¿Cómo pones el nombre junto a cada ausencia?", opts: ["Copiando y pegando los nombres en el mismo orden", "Con CONTAR.SI sobre la plantilla", "Con una tabla dinámica de la plantilla", "Con BUSCARX usando el número de empleado"], ok: 3, why: "BUSCARX encuentra cada número en la plantilla y trae el nombre de esa fila, aunque las hojas estén en distinto orden. Copiar y pegar solo sirve si las filas coinciden una a una, y casi nunca es así." }
      },
      {
        idea: "Una tabla dinámica resume miles de filas en segundos: arrastras «área» a filas y «número de empleado» a valores (como cuenta) y obtienes cuántas personas hay por área, sin escribir fórmulas.",
        q: { q: "Tu jefa quiere el número de bajas por mes y por área, de un archivo con 5,000 filas. ¿Qué es lo más rápido?", opts: ["Un CONTAR.SI.CONJUNTO para cada mes y área", "Ordenar por mes y contar a mano", "Una tabla dinámica", "Una gráfica de líneas con todos los datos"], ok: 2, why: "La tabla dinámica arma el cruce de mes y área de una vez y se actualiza si cambian los datos. CONTAR.SI.CONJUNTO también llega al resultado, pero tendrías que escribir una fórmula por cada celda del cuadro." }
      }
    ],
    extra: [
      { q: "En tu hoja de control de pruebas se captura la edad del cliente, y solo debe aceptar números enteros de 18 a 70. ¿Qué usas?", opts: ["Formato de celda de número", "Validación de datos: número entero entre 18 y 70", "Un filtro en la columna de edad", "Un comentario en la celda que diga «solo de 18 a 70»"], ok: 1, why: "La validación de datos rechaza lo que no cumple la regla al momento de capturarlo. El formato de número solo cambia cómo se ve el valor: no impide escribir 150 ni un texto." },
      { q: "Un BUSCARX te devuelve #N/D en varios empleados que sí están en la plantilla. ¿Qué es lo más probable?", opts: ["Que BUSCARX no funciona con números", "Que la plantilla tiene demasiadas filas", "Que hay que usar una tabla dinámica", "Que el número quedó como texto o con espacios en una hoja"], ok: 3, why: "Para Excel, 1024 como número y «1024» como texto (o «1024 » con un espacio al final) son valores distintos, así que no encuentra coincidencia. Se arregla limpiando con la función ESPACIOS o convirtiendo a número. BUSCARX sí funciona con números." }
    ],
    task: { n: "Un reporte de plantilla en una hoja", d: "Arma una hoja con 100 empleados inventados (número, nombre, área, fecha de ingreso y, si aplica, fecha de baja). Limpia los datos, trae el nombre del área con BUSCARX desde otra hoja, valida que las fechas tengan sentido y haz una tabla dinámica con altas y bajas por mes. Puedes usar Excel para la web, gratis con una cuenta de Microsoft, o Google Sheets.", t: "1 tarde" },
    res: [
      { n: "Función BUSCARX (Soporte de Microsoft)", u: "https://support.microsoft.com/es-es/Excel/functions/xlookup-function" },
      { n: "Crear una tabla dinámica para analizar datos (Soporte de Microsoft)", u: "https://support.microsoft.com/es-es/Excel/get-started/create-a-pivottable-to-analyze-worksheet-data" },
      { n: "Filtrar valores únicos o quitar valores duplicados (Soporte de Microsoft)", u: "https://support.microsoft.com/es-es/Excel/get-started/filter-for-unique-values-or-remove-duplicate-values" }
    ]
  },

  "tableros": {
    id: "tableros",
    name: "Tableros",
    plain: "Una pantalla con gráficas y cifras que se actualizan con los datos, para que alguien entienda de un vistazo cómo va algo.",
    why: "Lo central de la vacante de Sears es construir tableros en Power BI y reportes para directivos. Un buen tablero contesta una pregunta; uno malo solo junta gráficas.",
    steps: [
      {
        idea: "Un tablero empieza por la pregunta, no por la gráfica. «¿En qué áreas se va más gente y desde cuándo?» te dice qué cifras van arriba, qué filtros hacen falta y qué sobra.",
        q: { q: "Te piden un tablero de recursos humanos. ¿Qué haces primero?", opts: ["Escoges los colores de la empresa", "Preguntas qué decisión quieren tomar con él", "Pones todas las gráficas posibles para que no falte nada", "Descargas todos los datos disponibles"], ok: 1, why: "La decisión que quieren tomar define qué se muestra. Poner «todo, por si acaso» parece completo, pero entierra lo importante entre gráficas que nadie usa." }
      },
      {
        idea: "Elige la gráfica según lo que quieres mostrar: líneas para cambios en el tiempo, barras para comparar categorías y un visual de tarjeta (un número grande) para la cifra principal. El pastel solo sirve con muy pocas partes.",
        q: { q: "Quieres mostrar cómo cambió la rotación mes a mes durante el año. ¿Qué gráfica usas?", opts: ["Un pastel con los 12 meses", "Una tabla con todos los datos", "Una gráfica de líneas", "Un mapa de calor por estado"], ok: 2, why: "La línea muestra la tendencia en el tiempo de un vistazo. Un pastel con 12 rebanadas obliga a comparar ángulos, y así es muy difícil ver si subió o bajó." }
      },
      {
        idea: "En Power BI, Power Query limpia y da forma a los datos antes de graficar, y el modelo une las tablas por sus llaves. Si los datos llegan sucios, el tablero se ve bien pero miente.",
        q: { q: "Tu tablero cuenta 1,200 empleados, pero la plantilla real es de 1,000. ¿Dónde buscas primero?", opts: ["En los colores y el formato de la gráfica", "En la versión de Power BI que tienes instalada", "En el tamaño de la pantalla del reporte", "En los datos y en cómo se unieron las tablas"], ok: 3, why: "Si la cifra está mal, el problema casi siempre está en los datos o en cómo se unieron las tablas, por ejemplo una relación que duplica filas. El formato cambia cómo se ve el número, no cuánto vale." }
      },
      {
        idea: "Las segmentaciones (filtros en pantalla) dejan que cada quien vea su parte: una gerente elige su tienda y todo el tablero se ajusta. Así un tablero sirve a varias personas, en vez de diez reportes casi iguales.",
        q: { q: "Cinco gerentes quieren el mismo reporte, cada uno solo con su tienda. ¿Qué conviene?", opts: ["Un tablero con una segmentación por tienda", "Cinco archivos, uno por gerente", "Mandar los datos crudos para que cada quien filtre", "Un tablero con cinco páginas iguales"], ok: 0, why: "Una segmentación por tienda resuelve a los cinco con un solo tablero que mantienes una vez. Cinco archivos funcionan el primer mes, pero cada cambio hay que repetirlo cinco veces." }
      }
    ],
    extra: [
      { q: "En una junta, el director ve en tu tablero que la rotación de marzo fue de 12% y pregunta: «¿eso es mucho?». ¿Qué le faltó al tablero?", opts: ["Más colores para resaltar la cifra", "Contexto: el mes anterior, el promedio del año o una meta", "Una gráfica de pastel", "La lista de quienes se fueron en marzo"], ok: 1, why: "Una cifra sola no dice si es buena o mala: necesita algo con qué compararse, como la meta o el promedio. La lista de nombres da detalle, pero no contesta si 12% es mucho." },
      { q: "Tu tablero tarda un minuto en abrir porque carga cinco años de datos, y solo se consultan los últimos 12 meses. ¿Qué haces?", opts: ["Le pides a la gente que tenga paciencia", "Quitas gráficas hasta que abra rápido", "Cargas solo los últimos 12 meses", "Lo pasas a Excel"], ok: 2, why: "Si filtras en Power Query para cargar solo ese periodo, el modelo pesa menos y todo responde más rápido. Quitar gráficas ayuda un poco, pero el problema está en el volumen de datos, no en lo que se dibuja." }
    ],
    task: { n: "Tu primer tablero en Power BI", d: "Instala Power BI Desktop (es gratis en Windows) y carga la hoja de empleados de la estación Hojas de cálculo, o cualquier CSV de datos abiertos. Haz un tablero de una página que conteste una pregunta concreta, con un visual de tarjeta para la cifra principal, una línea en el tiempo, barras por categoría y una segmentación. Si no tienes Windows, usa Looker Studio.", t: "1 tarde" },
    res: [
      { n: "Introducción a Power BI Desktop (Microsoft Learn): de los datos a tu primer reporte", u: "https://learn.microsoft.com/power-bi/desktop-getting-started" },
      { n: "Crear tu primer reporte de Power BI (módulo gratuito de Microsoft Learn)", u: "https://learn.microsoft.com/training/modules/build-your-first-power-bi-report/1-introduction" }
    ]
  },

  "indicadores": {
    id: "indicadores",
    name: "Indicadores",
    plain: "Un indicador es una cifra que se mide igual cada mes para saber si algo va mejor o peor, como el porcentaje de personas que se van de la empresa.",
    why: "En Sears vas a analizar rotación, retención y ausentismo. Saber calcularlos bien, y explicar qué significan, es lo que convierte un tablero en una recomendación.",
    steps: [
      {
        idea: "Un indicador tiene una definición fija: qué se cuenta, sobre qué total y en qué periodo. Si un mes cuentas solo renuncias y al siguiente también despidos, la cifra cambia aunque no haya cambiado nada.",
        q: { q: "¿Por qué un indicador necesita una definición escrita?", opts: ["Para comparar de un mes a otro", "Para que el tablero se vea más profesional", "Porque Power BI no lo calcula sin ella", "Para que nadie pueda cambiarlo nunca"], ok: 0, why: "Si cada mes se calcula distinto, las subidas y bajadas no significan nada. La definición puede cambiar si hace falta, pero se anota y se avisa, para no comparar peras con manzanas." }
      },
      {
        idea: "La rotación mensual se calcula, por lo común, como las bajas del mes entre la plantilla promedio del mes, por 100. La plantilla promedio es (personas al inicio + personas al final) / 2.",
        q: { q: "En un mes hubo 6 bajas; la plantilla empezó con 190 personas y terminó con 210. ¿Cuál fue la rotación?", opts: ["6%", "3%", "3.2%", "2.9%"], ok: 1, why: "La plantilla promedio es (190 + 210) / 2 = 200, y 6 / 200 × 100 = 3%. Si divides entre la plantilla final (210) sale 2.9%: parece válido, pero subestima la rotación cuando la plantilla está creciendo." }
      },
      {
        idea: "El ausentismo mide el tiempo perdido: días de ausencia no planeada entre los días que se debían trabajar, por 100. Las vacaciones no cuentan, porque estaban planeadas.",
        q: { q: "¿Cuál de estas ausencias entra en el ausentismo?", opts: ["Las vacaciones autorizadas", "Un día festivo oficial", "Una falta sin aviso", "El día de descanso semanal"], ok: 2, why: "El ausentismo cuenta lo no planeado, como las faltas sin aviso. Las vacaciones también son días sin trabajar, por eso confunden, pero estaban programadas y el equipo pudo organizarse." }
      },
      {
        idea: "Un indicador solo dice algo comparado: contra el mes anterior, el mismo mes del año pasado, otra área o una meta. 5% de rotación es alto en un corporativo y puede ser bajo en una tienda en temporada.",
        q: { q: "La rotación de diciembre en tiendas subió a 8%. ¿Con qué conviene compararla primero?", opts: ["Con la de oficinas centrales en diciembre", "Con diciembre del año pasado en tiendas", "Con la meta anual de toda la empresa", "Con el promedio nacional de todas las industrias"], ok: 1, why: "Diciembre tiene contratación de temporada, así que el mismo mes del año anterior en tiendas es la comparación justa. Contra oficinas centrales siempre se verá alta, porque son grupos de personas muy distintos." }
      }
    ],
    extra: [
      { q: "La retención a 90 días de los nuevos ingresos bajó de 80% a 60%, pero la rotación total casi no cambió. ¿Qué te dice esto?", opts: ["Que hay un error, porque los dos deberían moverse igual", "Que todo está bien, porque la rotación total no cambió", "Que conviene dejar de medir la retención", "Que el problema está en los primeros meses de los nuevos ingresos"], ok: 3, why: "La rotación total mezcla a toda la plantilla; si los nuevos son pocos, su salida casi no la mueve. La retención de nuevos ingresos aísla a ese grupo y muestra que ahí está el problema. Que la total no cambie no quiere decir que todo esté bien." },
      { q: "Un gerente te pide «el número de bajas» para comparar su tienda de 40 personas con otra de 400. ¿Qué le entregas?", opts: ["El número de bajas de cada tienda, como lo pidió", "La tasa de rotación de cada una", "Solo la tienda con más bajas", "El total de las dos tiendas juntas"], ok: 1, why: "Diez bajas en una tienda de 40 personas pesan mucho más que diez en una de 400; la tasa divide entre la plantilla y así sí se pueden comparar. Darle solo el número es lo que pidió, pero lo llevaría a una conclusión equivocada: explícale por qué le das la tasa." }
    ],
    task: { n: "Tres indicadores bien definidos", d: "Con la hoja de 100 empleados que armaste (o una nueva), escribe la definición de rotación mensual, retención a 90 días y ausentismo: qué cuentas, sobre qué total y en qué periodo. Calcula los tres para seis meses, grafícalos y escribe un párrafo de conclusiones como si se lo presentaras a una directora: qué pasó, por qué crees que pasó y qué propondrías.", t: "1 tarde" },
    res: [
      { n: "Crear medidas para el análisis de datos en Power BI Desktop (Microsoft Learn)", u: "https://learn.microsoft.com/power-bi/transform-model/desktop-measures" },
      { n: "Crear visualizaciones de indicadores clave (KPI) en Power BI (Microsoft Learn)", u: "https://learn.microsoft.com/power-bi/visuals/power-bi-visualization-kpi" }
    ]
  },

  "casos-prueba": {
    id: "casos-prueba",
    name: "Casos de prueba",
    plain: "Un caso de prueba es una receta para revisar una función del sistema: qué datos usar, qué pasos seguir y qué debería pasar.",
    why: "En MVS el trabajo diario es ejecutar pruebas funcionales en Salesforce, y la vacante pide entender qué es un caso de prueba. Diseñarlos bien distingue a quien prueba con método de quien solo da clics.",
    steps: [
      {
        idea: "Un caso de prueba tiene un identificador, la condición inicial (por ejemplo, «usuario con sesión iniciada»), los pasos, los datos y el resultado esperado. Sin resultado esperado no sabes si pasó o falló.",
        q: { q: "¿Qué parte de un caso de prueba te permite decir si pasó o falló?", opts: ["El identificador", "El resultado esperado", "La fecha en que se escribió", "El nombre de quien lo ejecuta"], ok: 1, why: "Comparas lo que pasó contra el resultado esperado: si coinciden, pasó. El identificador sirve para encontrar el caso y citarlo en un reporte, pero no dice nada de si funcionó." }
      },
      {
        idea: "Una prueba funcional revisa que el sistema haga lo que dice el requerimiento, desde fuera, como lo usaría una persona, sin ver el código. Si el requerimiento dice «no guardar un cliente sin teléfono», lo intentas.",
        q: { q: "El requerimiento dice: «el sistema no debe permitir registrar un cliente sin correo». ¿Qué caso lo revisa mejor?", opts: ["Registrar un cliente con todos los datos y ver que se guarde", "Revisar el código del formulario de registro", "Intentar guardar un cliente con el correo vacío y ver que el sistema lo impida", "Abrir la lista de clientes y contar cuántos hay"], ok: 2, why: "El requerimiento habla de algo que no debe pasar, así que la prueba tiene que intentarlo. Registrar un cliente completo también es un caso útil, pero no comprueba esta regla." }
      },
      {
        idea: "Partición de equivalencia: agrupas las entradas que el sistema trata igual y pruebas una de cada grupo. Si la edad válida es de 18 a 65, hay tres grupos: menos de 18, de 18 a 65 y más de 65.",
        q: { q: "Un campo acepta edades de 18 a 65. Con partición de equivalencia, ¿cuántos casos necesitas como mínimo?", opts: ["Uno, con una edad válida", "Dos: uno válido y uno inválido", "48, uno por cada edad válida", "Tres, uno por grupo"], ok: 3, why: "Hay tres grupos que el sistema trata distinto, y uno de cada grupo los cubre. Dos casos parecen suficientes, pero «inválido» son dos grupos (muy joven y muy mayor), y uno puede fallar sin que el otro lo muestre." }
      },
      {
        idea: "Los errores se juntan en los bordes. Con el análisis de valores límite pruebas justo en el límite y a su lado: para 18 a 65, prueba 17, 18, 65 y 66. Un «<» donde iba «<=» solo se nota ahí.",
        q: { q: "Para el mismo campo de 18 a 65 años, ¿qué valores revisan los límites?", opts: ["17, 18, 65 y 66", "20, 30, 40 y 50", "0, 100 y 1000", "Solo el 18 y el 65"], ok: 0, why: "Los errores típicos, como escribir < en vez de <=, aparecen justo en el borde. Probar solo 18 y 65 revisa que entren los extremos, pero no que 17 y 66 se rechacen." }
      }
    ],
    extra: [
      { q: "Vas a probar un formulario de Salesforce para dar de alta prospectos, con 8 campos, y tienes una tarde. ¿Cómo empiezas?", opts: ["Probando combinaciones al azar hasta que algo falle", "Leyendo los requerimientos, campo por campo", "Probando solo que se guarde un prospecto normal", "Pidiéndole al programador que te diga qué probar"], ok: 1, why: "Los requerimientos te dicen qué debe pasar, y los campos obligatorios, formatos y límites son donde más fallan los formularios. Probar al azar encuentra cosas a veces, pero no te dice qué quedó sin revisar." },
      { q: "Un caso dice: «Paso 3: capturar datos. Resultado esperado: funciona bien». ¿Qué le corregirías?", opts: ["Nada, así está claro", "Poner datos exactos y un resultado visible, como «Cliente guardado»", "Que tenga menos pasos", "Que lo ejecute otra persona"], ok: 1, why: "«Funciona bien» no se puede comparar contra nada: dos personas podrían marcarlo distinto. Con datos exactos y un resultado que se observa, cualquiera repite la prueba y llega a la misma conclusión. Tener menos pasos no quita la vaguedad." }
    ],
    task: { n: "Quince casos para un formulario real", d: "Elige un formulario que uses, como el registro de una tienda en línea o uno de tu facultad. Escribe en una hoja de cálculo 15 casos de prueba (identificador, condición inicial, pasos, datos y resultado esperado) con partición de equivalencia y valores límite. Ejecútalos solo como lo haría cualquier usuario, sin mandar datos reales, marca cuáles pasaron y guarda capturas de lo que falló.", t: "1 tarde" },
    res: [
      { n: "Glosario de ISTQB: definiciones de caso de prueba, partición de equivalencia y valor límite", u: "https://glossary.istqb.org/" },
      { n: "Programa ISTQB Foundation Level v4.0.1 (PDF, en inglés): el capítulo 4 trata las técnicas de diseño de pruebas", u: "https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf" }
    ]
  },

  "defectos": {
    id: "defectos",
    name: "Reporte de defectos",
    plain: "Escribir lo que falló de forma que otra persona lo pueda repetir, entender y arreglar sin tener que preguntarte.",
    why: "MVS pide documentar incidencias con evidencia y reportar bugs. Un reporte claro se arregla rápido; uno vago regresa con un «no lo pude reproducir».",
    steps: [
      {
        idea: "Un buen reporte tiene un título que dice qué falla y dónde, los pasos exactos para reproducirlo, el resultado esperado, el obtenido y el ambiente: navegador, tipo de usuario y versión.",
        q: { q: "¿Cuál título de reporte es mejor?", opts: ["Error en el sistema", "No funciona, urgente", "Al guardar un cliente sin teléfono sale «Error 500» en vez del aviso de campo obligatorio", "Bug en el módulo de clientes"], ok: 2, why: "Un buen título dice qué acción, qué pasó y qué se esperaba; con eso el programador ya sospecha dónde buscar. «No funciona, urgente» comunica prisa, pero no da ninguna pista." }
      },
      {
        idea: "Si no se puede reproducir, casi no se puede arreglar. Escribe cada paso desde el inicio con los datos exactos que usaste, y repítelo tú antes de mandarlo. Anota si falla siempre o solo a veces.",
        q: { q: "Encontraste un error, pero al repetirlo solo falla 1 de cada 5 veces. ¿Qué haces?", opts: ["Lo reportas tal cual, con la frecuencia", "No lo reportas hasta que falle siempre", "Lo reportas como si fallara siempre, para que le den prioridad", "Esperas a que alguien más lo encuentre"], ok: 0, why: "Un error intermitente es real, y suele ser de los difíciles; la frecuencia y lo que notaste ayudan a encontrar la causa. Exagerar que falla siempre hace perder tiempo al programador y le quita confianza a tus reportes." }
      },
      {
        idea: "La evidencia ahorra explicaciones: captura de pantalla, video corto, el mensaje de error completo y la hora. Con la hora, alguien encuentra en los registros del servidor (logs) qué pasó en ese momento.",
        q: { q: "¿Para qué anotas la hora exacta en que ocurrió el error?", opts: ["Para medir cuánto tardaste en probar", "Para encontrar en los logs qué pasó", "Porque el sistema de reportes lo exige", "Para saber si fue en horario laboral"], ok: 1, why: "Con la hora, quien revisa los logs encuentra el error del servidor que corresponde a tu prueba y ve la causa. Medir tu tiempo de prueba puede servirle a tu jefe, pero no ayuda a arreglar el defecto." }
      },
      {
        idea: "Severidad es cuánto daño hace el defecto; prioridad, qué tan pronto hay que arreglarlo. Una falta de ortografía en la pantalla de inicio es de severidad baja, pero puede tener prioridad alta porque la ve todo mundo.",
        q: { q: "La app se cierra al generar un reporte que se usa una vez al año, y faltan diez meses para usarlo. ¿Cómo lo clasificas?", opts: ["Severidad baja y prioridad alta", "Severidad baja y prioridad baja", "Severidad alta y prioridad alta", "Severidad alta y prioridad baja"], ok: 3, why: "Que la app se cierre es grave (severidad alta), pero hay meses para arreglarlo antes de que alguien lo use (prioridad baja). Es común marcar todo lo grave como urgente; separar las dos cosas ayuda al equipo a decidir qué va primero." }
      }
    ],
    extra: [
      { q: "Reportaste un defecto y el programador lo regresa con «no se reproduce». ¿Qué haces?", opts: ["Lo cierras, porque él conoce mejor el sistema", "Lo vuelves a abrir sin cambios", "Buscas qué cambia en su ambiente y completas el reporte", "Lo reportas otra vez con otro título"], ok: 2, why: "Muchas veces el defecto depende de algo que no anotaste: el tipo de usuario, un dato o el navegador. Encontrar esa diferencia es parte del trabajo de prueba. Reabrirlo igual solo repite la discusión." },
      { q: "Al validar en Excel los datos que exportó el sistema, ves que 30 de 2,000 clientes tienen la fecha de alta en el futuro. ¿Qué incluyes en el reporte?", opts: ["Solo «hay fechas mal»", "Los 30 registros y la regla", "Una captura de toda la hoja de Excel", "Tu opinión sobre quién cometió el error"], ok: 1, why: "Con los registros exactos, la regla y cómo los encontraste, el equipo puede ver si es un problema de captura o del sistema, y luego confirmar la corrección. Una captura de toda la hoja parece evidencia, pero obliga a buscar los 30 casos a mano." }
    ],
    task: { n: "Cinco reportes que se puedan reproducir", d: "Usa un sitio hecho para practicar pruebas, como Sauce Demo (saucedemo.com), que tiene usuarios de prueba con errores a propósito. Encuentra cinco defectos y escribe cada reporte con título, pasos, resultado esperado, resultado obtenido, ambiente, evidencia, severidad y prioridad. Pídele a alguien que intente reproducir uno solo con tu reporte.", t: "1 tarde" },
    res: [
      { n: "Filing good bugs (documentación de Firefox, en inglés): cómo escribir un reporte que se pueda atender", u: "https://firefox-source-docs.mozilla.org/contributing/filing-good-bugs.html" },
      { n: "Programa ISTQB Foundation Level v4.0.1 (PDF, en inglés): la sección 5.5 trata la gestión de defectos", u: "https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf" }
    ]
  },

  "linux": {
    id: "linux",
    name: "Linux y terminal",
    plain: "Manejar un servidor escribiendo órdenes en una pantalla de texto: ver archivos, revisar programas y leer qué pasó.",
    why: "SatoriTech pide Linux y shell para dar el primer diagnóstico en servidores: revisar servicios, procesos, disco y logs. Casi todos los servidores en la nube usan Linux y no tienen pantalla ni ratón.",
    steps: [
      {
        idea: "En la terminal te mueves con pocas órdenes: pwd dice en qué carpeta estás, ls lista lo que hay, cd entra a otra carpeta y cat muestra un archivo. Los logs del sistema suelen estar en /var/log.",
        q: { q: "Entraste a un servidor y quieres ver qué archivos hay en la carpeta donde estás. ¿Qué escribes?", opts: ["pwd", "ls", "cd", "cat"], ok: 1, why: "ls lista el contenido de la carpeta. pwd confunde porque también te orienta, pero solo dice en qué carpeta estás, no qué hay dentro." }
      },
      {
        idea: "Los logs crecen rápido. tail -n 50 archivo muestra las últimas 50 líneas, tail -f lo sigue en vivo y grep busca una palabra: grep ERROR /var/log/app.log muestra solo las líneas con ERROR.",
        q: { q: "La aplicación falla y su log tiene 200,000 líneas. ¿Qué te muestra solo los errores?", opts: ["cat /var/log/app.log", "ls /var/log", "cd /var/log/app.log", "grep ERROR /var/log/app.log"], ok: 3, why: "grep filtra y deja solo las líneas que contienen ERROR. cat también muestra los errores, pero revueltos con las otras miles de líneas, así que no te ayuda a encontrarlos." }
      },
      {
        idea: "Un servicio es un programa que corre en segundo plano, como un servidor web. systemctl status nginx dice si está activo y muestra sus últimos mensajes; sudo systemctl restart nginx lo reinicia. sudo pide permisos de administrador.",
        q: { q: "Te reportan que la página no carga. ¿Qué revisas primero en el servidor?", opts: ["El estado del servicio web", "Reinstalar el sistema operativo", "Borrar los logs para liberar espacio", "Apagar el servidor"], ok: 0, why: "Primero confirmas el estado: systemctl status dice si el servicio corre y muestra sus últimos mensajes, que suelen explicar la falla. Borrar los logs libera espacio, pero también borra la evidencia que necesitas para el diagnóstico." }
      },
      {
        idea: "Para un diagnóstico rápido: df -h muestra el espacio en disco, free -h la memoria, y el comando top los procesos y cuánto CPU usa cada uno. Con el disco al 100%, muchas aplicaciones se detienen porque ya no pueden escribir.",
        q: { q: "Una aplicación dejó de guardar archivos y su log dice «No space left on device». ¿Qué orden lo confirma?", opts: ["free -h", "df -h", "top", "pwd"], ok: 1, why: "df -h muestra cuánto espacio queda en cada disco. free -h tienta porque también habla de espacio, pero es el de la memoria RAM, no el del disco donde se guardan los archivos." }
      }
    ],
    extra: [
      { q: "En un servidor, top muestra un proceso de respaldo usando todo el CPU desde hace dos horas, y la aplicación está lenta. Antes de detenerlo, ¿qué haces?", opts: ["Lo detienes con kill -9 de inmediato", "Reinicias el servidor completo", "Averiguas qué es y si debía correr, y lo anotas en el ticket", "Esperas a que termine solo"], ok: 2, why: "Un respaldo puede ser importante: matarlo a la mitad podría dejar datos incompletos. En operación, primero se entiende y se escala con evidencia. kill -9 lo detiene al instante, pero sin dejar que el proceso cierre bien lo que estaba haciendo." },
      { q: "Quieres ver en vivo los errores que va escribiendo la aplicación mientras alguien reproduce la falla. ¿Qué usas?", opts: ["tail -f /var/log/app.log | grep ERROR", "cat /var/log/app.log", "ls -l /var/log", "df -h /var/log"], ok: 0, why: "tail -f sigue el archivo mientras crece, y la barra | pasa cada línea nueva a grep, que solo deja los errores. cat muestra el archivo una vez, tal como está en ese momento, y no lo que se escriba después." }
    ],
    task: { n: "Tu propio servidor de práctica", d: "Instala Ubuntu en una máquina virtual, o usa WSL si tienes Windows. Instala nginx, revisa su estado con systemctl, rómpelo a propósito (detén el servicio) y diagnostícalo como si fuera un ticket: qué viste, qué órdenes usaste y qué hiciste. Practica ls, cd, grep, tail -f, df -h y top hasta que no tengas que buscarlas.", t: "1 tarde" },
    res: [
      { n: "The Linux command line for beginners (Ubuntu, en inglés): el tutorial oficial para empezar", u: "https://documentation.ubuntu.com/desktop/en/latest/tutorial/the-linux-command-line-for-beginners/" },
      { n: "The Linux Command Line, de William Shotts (linuxcommand.org): libro gratuito en PDF", u: "https://www.linuxcommand.org/tlcl.php" }
    ]
  },

  "nube": {
    id: "nube",
    name: "Nube",
    plain: "Usar computadoras y servicios de otra empresa, como Amazon Web Services (AWS), por internet: los rentas por uso en lugar de comprarlos.",
    why: "SatoriTech pide la consola de AWS (EC2 y CloudWatch), nociones de IAM y RDS, y lo básico de AWS CLI; EDAR Tech cuenta la nube como punto extra. La certificación AWS Cloud Practitioner también le suma a la vacante de SatoriTech.",
    steps: [
      {
        idea: "EC2 te renta servidores virtuales llamados instancias. Eliges cuánto CPU y memoria (el tipo de instancia), el sistema operativo y la región de AWS, el lugar del mundo donde corre. El cómputo se cobra mientras está encendida.",
        q: { q: "En AWS, ¿qué es una instancia de EC2?", opts: ["Un servidor virtual", "Una base de datos administrada", "Un usuario con permisos", "Una copia de seguridad"], ok: 0, why: "Una instancia es una computadora virtual en los centros de datos de AWS. La base de datos administrada es otro servicio, RDS, aunque por dentro también corra en servidores." }
      },
      {
        idea: "IAM controla quién puede hacer qué. La regla es dar el mínimo permiso necesario: quien solo revisa métricas no necesita poder borrar servidores. La cuenta raíz (root) no se usa para el trabajo diario.",
        q: { q: "Un compañero nuevo solo va a revisar métricas en CloudWatch. ¿Qué permisos le das?", opts: ["Los de administrador, para que no se atore", "Los de la cuenta raíz", "Solo lectura de CloudWatch", "Ninguno: que te pida capturas a ti"], ok: 2, why: "Con el mínimo permiso, un error o una contraseña robada hace menos daño. Darle administrador parece práctico porque nunca se atora, pero también podría apagar o borrar servidores por accidente." }
      },
      {
        idea: "RDS es una base de datos administrada: AWS se encarga de instalarla, respaldarla y actualizarla, y tú la usas con SQL como cualquier otra. Así no tienes que administrar el servidor de la base.",
        q: { q: "¿Qué ganas al usar RDS en lugar de instalar tú la base de datos en una instancia EC2?", opts: ["Que la base de datos es gratis", "Que ya no necesitas saber SQL", "Que nadie puede borrar los datos", "Que AWS hace los respaldos"], ok: 3, why: "Con RDS, AWS hace el trabajo de administrar el servidor de la base: respaldos automáticos, parches y mantenimiento. Sigues usando SQL igual. Y no es gratis: pagas por la instancia de base de datos y su almacenamiento." }
      },
      {
        idea: "Lo que haces en la consola de AWS también se puede hacer con AWS CLI desde la terminal: aws ec2 describe-instances lista tus instancias. Sirve para repetir tareas y guardarlas en un script.",
        q: { q: "Cada mañana revisas a mano en la consola el estado de 20 instancias. ¿Qué te ahorra tiempo?", opts: ["Un script con AWS CLI", "Abrir más pestañas de la consola de AWS", "Apagar las instancias en la noche", "Pedirle a AWS un reporte por correo"], ok: 0, why: "Con AWS CLI, la consulta de las 20 instancias es una orden que puedes guardar y repetir. Apagar instancias en la noche ahorra dinero en algunos casos, pero no te dice su estado." }
      }
    ],
    extra: [
      { q: "Un usuario pide acceso a una instancia para «revisar unas cosas», sin decir cuáles. ¿Qué haces?", opts: ["Le das acceso de administrador para que no vuelva a pedir", "Le pides que diga qué necesita, das el mínimo y lo registras", "Le prestas tu usuario un rato", "Le dices que no, sin más"], ok: 1, why: "En operación, cada acceso se justifica, se limita y queda registrado en el ticket. Prestar tu usuario parece rápido, pero después ya no se sabe quién hizo qué, y rompe la regla de una cuenta por persona." },
      { q: "La factura de AWS subió mucho este mes. Ves cinco instancias grandes que nadie usa desde hace semanas. ¿Qué haces?", opts: ["Las borras de inmediato", "Avisas con evidencia y confirmas de quién es cada una", "Las dejas, porque alguien las creó por algo", "Cambias todo a otra región"], ok: 1, why: "Antes de borrar algo hay que confirmar que no guarda datos importantes; por eso se avisa con evidencia y se identifica al dueño. Borrarlas de inmediato ahorra dinero, pero podrías perder información que no tiene copia." }
    ],
    task: { n: "Tu primera instancia, sin sustos en la factura", d: "Crea una cuenta de AWS (pide una tarjeta), crea un presupuesto con alerta de 1 dólar y un usuario de IAM para no usar la cuenta raíz. Lanza una instancia EC2 pequeña de la capa gratuita, entra por SSH, instala nginx y mira sus métricas en CloudWatch. Al final, termina la instancia y revisa que no quede nada encendido.", t: "1 tarde" },
    res: [
      { n: "¿Qué es Amazon EC2? (documentación de AWS)", u: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html" },
      { n: "¿Qué es IAM? (documentación de AWS)", u: "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html" }
    ]
  },

  "monitoreo": {
    id: "monitoreo",
    name: "Monitoreo y registros",
    plain: "Vigilar que servidores y aplicaciones estén sanos con números (métricas), con el diario de lo que hacen (logs) y con alarmas que avisan cuando algo se sale de lo normal.",
    why: "SatoriTech pide monitorear EC2 con las métricas y los logs de CloudWatch, dar un primer diagnóstico y escalar con evidencia en el ticket. Es el trabajo diario de un puesto de operaciones.",
    steps: [
      {
        idea: "Una métrica es un número que se mide cada cierto tiempo, como el CPU de una instancia cada minuto. Un log es un texto con hora que describe un evento: «12:03 ERROR no se pudo conectar a la base». Las métricas dicen que algo pasa; los logs, qué.",
        q: { q: "El CPU de una instancia subió a 95%. ¿Dónde buscas por qué?", opts: ["En los logs de esa hora", "En la misma gráfica de CPU, más grande", "En la factura de AWS", "En la lista de usuarios de IAM"], ok: 0, why: "La métrica te avisó que algo pasa; los logs de ese momento suelen decir qué estaba haciendo la aplicación. Ampliar la gráfica muestra mejor cuándo empezó, pero no por qué." }
      },
      {
        idea: "El libro de SRE de Google recomienda vigilar cuatro señales: latencia (cuánto tarda en responder), tráfico (cuántas peticiones llegan), errores (cuántas fallan) y saturación (qué tan lleno está un recurso, como el CPU o el disco).",
        q: { q: "Los usuarios dicen que la página tarda mucho, aunque no da errores. ¿Qué señal mide eso?", opts: ["El tráfico", "Los errores", "La latencia", "La saturación"], ok: 2, why: "La latencia es el tiempo de respuesta: justo lo que sienten los usuarios. La saturación puede ser la causa (un CPU al tope hace lenta la página), pero lo que mide la queja es la latencia." }
      },
      {
        idea: "Una alarma avisa cuando una métrica cruza un límite durante cierto tiempo, como «CPU arriba de 80% por 5 minutos». Pedir varios minutos evita alarmas por picos de segundos que se resuelven solos.",
        q: { q: "Una alarma suena cada vez que el CPU pasa de 80%, aunque sea un instante, y el equipo ya la ignora. ¿Qué cambias?", opts: ["Quitas la alarma para que deje de molestar", "Subes el límite a 99%", "La mandas a más personas", "Pides que dure unos minutos"], ok: 3, why: "Si la alarma pide que el problema dure unos minutos, ignora los picos breves y solo avisa cuando hay algo real. Subir el límite a 99% también la calla, pero entonces avisaría cuando ya es demasiado tarde." }
      },
      {
        idea: "Al escalar un incidente, el ticket lleva evidencia: qué viste, desde qué hora, la gráfica o la línea del log, qué revisaste y qué descartaste. Así el siguiente equipo no repite tu trabajo.",
        q: { q: "Vas a escalar al equipo de base de datos una falla que no pudiste resolver. ¿Qué pones en el ticket?", opts: ["«La base no sirve, favor de revisar»", "La hora, el error del log y lo que descartaste", "Solo tu nombre y el del servidor", "Una captura de la consola de AWS"], ok: 1, why: "Con la hora, la evidencia y lo que ya descartaste, el otro equipo empieza donde te quedaste. «La base no sirve» obliga a alguien a repetir todo tu diagnóstico desde cero." }
      }
    ],
    extra: [
      { q: "A las 3:00 se disparan las alarmas de errores. En CloudWatch ves que a las 2:58 el disco de la instancia llegó a 100%, y el log dice «No space left on device». ¿Cuál es tu primer diagnóstico?", opts: ["Un ataque a la red", "Se llenó el disco", "La base de datos está caída", "El CPU está muy alto"], ok: 1, why: "El orden de los hechos cuenta la historia: primero se llenó el disco, dos minutos después empezaron los errores, y el log lo confirma. Pensar en un ataque tienta cuando todo falla de golpe, pero la evidencia apunta a algo mucho más simple." },
      { q: "En el log de una aplicación aparece cada minuto «WARN reintentando conexión», pero los usuarios no notan nada. ¿Qué haces?", opts: ["Nada, porque nadie se queja", "Borras el log para que no ocupe espacio", "Abres un ticket con la frecuencia", "Reinicias el servidor de inmediato"], ok: 2, why: "Una advertencia que se repite suele anunciar una falla futura; registrarla con datos permite atenderla con calma. Reiniciar de inmediato quizá la quite un rato, pero sin entender la causa y con riesgo de cortar el servicio." }
    ],
    task: { n: "Una alarma que sí suena", d: "En la instancia EC2 de la estación Nube, crea en CloudWatch una alarma de CPU arriba de 70% durante 5 minutos y provócala con un programa que ocupe el CPU (por ejemplo, stress). Escribe el ticket como si fuera real: qué alarma sonó, qué viste en las métricas y en los logs, la causa y qué hiciste. Al final, termina la instancia.", t: "1 tarde" },
    res: [
      { n: "¿Qué es Amazon CloudWatch? (documentación de AWS)", u: "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html" },
      { n: "Monitoring Distributed Systems (libro de SRE de Google, en inglés): las cuatro señales que conviene vigilar", u: "https://sre.google/sre-book/monitoring-distributed-systems/" }
    ]
  }
};

if (typeof module !== 'undefined') module.exports = { ESTACIONES: ESTACIONES };
