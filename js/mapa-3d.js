// Mapa en 3D (maqueta sobre papel) con Three.js. Script clásico (ES5): define la global Metro3D.
// Three.js (build UMD r159, global THREE) se carga bajo demanda desde jsdelivr la primera vez que se pide el 3D;
// si no hay WebGL o el script no llega, la pantalla Mapa se queda con el SVG de siempre (js/pantallas-mapa.js).
// Geometría: la misma de mapLayout (js/core.js), en unidades del viewBox de 360 de ancho, sobre el plano XZ (Y hacia arriba).
// Accesibilidad: el lienzo es decorativo (aria-hidden); cada estación es un <button data-station> encima, con su
// etiqueta para lectores de pantalla, colocado en cada cuadro donde cae la estación en pantalla.

var Metro3D = (function () {
  var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js';
  var loading = null;      // { done: [fn], fail: [fn] } mientras llega el script
  var loadFailed = false;
  var glOk = null;         // cache de supported()
  var renderer = null;     // un solo WebGLRenderer para toda la visita: se vuelve a usar en cada montaje
  var cur = null;          // montaje activo
  var introDone = false;   // la animación de entrada (las vías se dibujan) solo va la primera vez
  var view = null;         // cámara guardada entre redibujos de la misma pantalla { az, tilt, zoom, tx, tz }

  var TILT0 = 0.14, AZ0 = 0, ZOOM_MIN = 1, ZOOM_MAX = 2.6;
  var TILT_MIN = 0, TILT_MAX = 0.9, AZ_MAX = 0.45;
  var FOV = 16;

  function supported() {
    if (glOk !== null) return glOk;
    try {
      var c = document.createElement('canvas');
      glOk = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { glOk = false; }
    return glOk;
  }

  function ready() { return typeof THREE !== 'undefined' && !!THREE.WebGLRenderer; }

  // Carga Three.js una sola vez. ok() si llega; fail() si no (sin red, CDN bloqueado).
  function load(ok, fail) {
    if (ready()) { ok(); return; }
    if (loadFailed) { fail(); return; }
    if (loading) { loading.done.push(ok); loading.fail.push(fail); return; }
    loading = { done: [ok], fail: [fail] };
    var s = document.createElement('script');
    s.src = THREE_URL;
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.onload = function () {
      var l = loading; loading = null;
      if (!ready()) { loadFailed = true; l.fail.forEach(function (f) { f(); }); return; }
      l.done.forEach(function (f) { f(); });
    };
    s.onerror = function () {
      var l = loading; loading = null; loadFailed = true;
      l.fail.forEach(function (f) { f(); });
    };
    document.head.appendChild(s);
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888888';
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // ---------- Geometría ----------
  // Puntos de la polilínea de una línea (como el SVG), sin repetidos.
  function linePoints(segs) {
    var pts = [];
    segs.forEach(function (s) {
      [[s[0], s[1]], [s[2], s[3]]].forEach(function (p) {
        var last = pts[pts.length - 1];
        if (!last || Math.abs(last[0] - p[0]) > 0.01 || Math.abs(last[1] - p[1]) > 0.01) pts.push(p);
      });
    });
    return pts;
  }

  // Camino 3D con esquinas redondeadas (radio r) por la polilínea, a la altura y.
  function roundedPath(pts, y, r, ox, oz) {
    var path = new THREE.CurvePath();
    var V = function (p) { return new THREE.Vector3(p[0] - ox, y, p[1] - oz); };
    if (pts.length < 2) return null;
    var prev = V(pts[0]);
    for (var i = 1; i < pts.length; i++) {
      var p = V(pts[i]);
      if (i === pts.length - 1) { path.add(new THREE.LineCurve3(prev, p)); break; }
      var nx = V(pts[i + 1]);
      var a = prev.distanceTo(p), b = p.distanceTo(nx);
      var rr = Math.min(r, a / 2, b / 2);
      var p1 = p.clone().add(prev.clone().sub(p).setLength(rr));
      var p2 = p.clone().add(nx.clone().sub(p).setLength(rr));
      if (prev.distanceTo(p1) > 0.01) path.add(new THREE.LineCurve3(prev, p1));
      path.add(new THREE.QuadraticBezierCurve3(p1, p, p2));
      prev = p2;
    }
    return path;
  }

  function roundedRect(w, h) {
    var r = h / 2, s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.absarc(x + w - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
    s.lineTo(x + r, y + h);
    s.absarc(x + r, 0, r, Math.PI / 2, Math.PI * 1.5, false);
    return s;
  }

  function roundedBoard(w, h, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  // Pieza extruida acostada sobre el plano: la forma va en XZ y la altura en Y (de y0 a y0 + depth).
  function slab(shape, depth, y0, bevel) {
    var g = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: !!bevel, bevelSize: bevel || 0, bevelThickness: bevel || 0, bevelSegments: 2, curveSegments: 18 });
    g.rotateX(Math.PI / 2);         // la cara de la forma queda boca abajo en y = 0 … depth hacia -Y
    g.translate(0, y0 + depth, 0);  // de y0 a y0 + depth
    return g;
  }

  // ---------- Montaje ----------
  // model: { width, height, lines: [{ id, color, n, goal }], nodes: [{ id, x, y, w, h, side, lines, name, labelLines, label, done, cur, onGoal }], badges, goal }
  // handlers: { open(id), firstFrame() }
  function mount(host, model, handlers) {
    destroy();
    if (!renderer) {
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      } catch (e) { renderer = null; return false; }
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x000000, 0);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var m = { host: host, model: model, handlers: handlers, disposables: [], raf: 0, alive: true,
      motion: !reducedMotion(), hoverLines: null, hoverId: null, t0: performance.now(), lastT: performance.now() };
    cur = m;

    var canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'm3-canvas';
    host.textContent = '';
    host.append(canvas);
    var labels = el('div', { class: 'm3-labels', role: 'group', 'aria-label': 'Mapa de líneas y estaciones' });
    var badges = el('div', { class: 'm3-badges', 'aria-hidden': 'true' });
    host.append(badges, labels);
    m.labels = labels;

    buildScene(m);
    buildOverlay(m, labels, badges);
    bindControls(m);

    // Cámara: la guardada (redibujo tras sincronizar) o la de inicio.
    m.cam = view ? Object.assign({}, view) : { az: AZ0, tilt: TILT0, zoom: 1, tx: 0, tz: 0 };
    m.want = Object.assign({}, m.cam);
    m.intro = introDone || !m.motion ? 1 : 0;
    introDone = true;

    m.ro = new ResizeObserver(function () { resize(m); });
    m.ro.observe(host);
    m.onVis = function () { kick(m); };
    document.addEventListener('visibilitychange', m.onVis);
    m.mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    m.onScheme = function () { recolor(m); kick(m); };
    if (m.mq && m.mq.addEventListener) m.mq.addEventListener('change', m.onScheme);
    resize(m);
    frame(m, performance.now());
    if (handlers.firstFrame) handlers.firstFrame();
    kick(m);
    return true;
  }

  function track(m, o) { m.disposables.push(o); return o; }

  function buildScene(m) {
    var md = m.model, W = md.width, H = md.height, ox = W / 2, oz = H / 2;
    m.ox = ox; m.oz = oz;
    var scene = new THREE.Scene();
    m.scene = scene;
    m.camera = new THREE.PerspectiveCamera(FOV, 1, 20, 30000);

    // Luz: cielo/suelo cálidos más un sol que proyecta sombras suaves hacia abajo a la derecha.
    m.hemi = new THREE.HemisphereLight(0xffffff, 0xd8d2c0, 2.1);
    scene.add(m.hemi);
    var sun = new THREE.DirectionalLight(0xffffff, 1.35);
    sun.position.set(-160, 420, -220);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 2048);
    var sc = sun.shadow.camera;
    sc.left = -W / 2 - 40; sc.right = W / 2 + 40; sc.top = H / 2 + 40; sc.bottom = -H / 2 - 40; sc.near = 50; sc.far = 1200;
    sun.shadow.radius = 6;
    sun.shadow.bias = -0.0008;
    scene.add(sun);
    scene.add(sun.target);
    m.sun = sun;

    // Tablero: una cartulina con esquinas redondeadas y canto, sobre una sombra en la página.
    var boardShape = roundedBoard(W + 24, H + 8, 18);
    m.matBoard = track(m, new THREE.MeshLambertMaterial({ color: 0xffffff }));
    m.matEdge = track(m, new THREE.MeshLambertMaterial({ color: 0xffffff }));
    var boardG = track(m, slab(boardShape, 6, -6, 0));
    var board = new THREE.Mesh(boardG, [m.matBoard, m.matEdge]);
    board.receiveShadow = true;
    scene.add(board);
    var shadowG = track(m, new THREE.PlaneGeometry(W * 3, H * 3));
    shadowG.rotateX(-Math.PI / 2);
    m.matShadow = track(m, new THREE.ShadowMaterial({ opacity: 0.12 }));
    var ground = new THREE.Mesh(shadowG, m.matShadow);
    ground.position.y = -6.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Vías: tubos con la meta más gruesa y un poco más alta, encima de las demás.
    m.tracks = {};
    md.lines.forEach(function (l) {
      var segs = md.paths[l.id] || [];
      var pts = linePoints(segs);
      var goal = l.goal;
      var rad = goal ? 4.1 : 3.3;
      var path = roundedPath(pts, rad + (goal ? 0.6 : 0), 9, ox, oz);
      if (!path) return;
      var len = path.getLength();
      var g = track(m, new THREE.TubeGeometry(path, Math.max(24, Math.round(len / 2.5)), rad, 10, false));
      var mat = track(m, new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.0, transparent: true, opacity: 1 }));
      var mesh = new THREE.Mesh(g, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.renderOrder = goal ? 2 : 1;
      scene.add(mesh);
      // Tapas redondas en las puntas.
      var capG = track(m, new THREE.SphereGeometry(rad, 14, 10));
      [path.getPoint(0), path.getPoint(1)].forEach(function (p) {
        var cap = new THREE.Mesh(capG, mat);
        cap.position.copy(p);
        cap.castShadow = true;
        scene.add(cap);
      });
      m.tracks[l.id] = { mesh: mesh, mat: mat, color: l.color, path: path, len: len, goal: goal, count: g.index.count, opacity: 1 };
    });

    // Estaciones: fichas de cartulina con borde de tinta (compartidas) o discos con aro de color (de una línea).
    m.matPanel = track(m, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }));
    m.matInk = track(m, new THREE.MeshStandardMaterial({ color: 0x16201e, roughness: 0.6 }));
    m.matMark = track(m, new THREE.MeshStandardMaterial({ color: 0xffe27a, roughness: 0.6, emissive: 0x000000 }));
    m.lineMats = {};
    md.lines.forEach(function (l) {
      m.lineMats[l.id] = track(m, new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.45, emissive: 0x000000 }));
    });
    m.stations = {};
    var top = 11; // altura de la cara de arriba de una ficha
    md.nodes.forEach(function (n) {
      var grp = new THREE.Group();
      grp.position.set(n.x - ox, 0, n.y - oz);
      var parts = [];
      if (n.lines.length > 1) {
        var outer = track(m, slab(roundedRect(n.w + 6, n.h + 6), top - 0.5, 0, 0));
        var o = new THREE.Mesh(outer, m.matInk); o.castShadow = true; o.receiveShadow = true; grp.add(o);
        var inner = track(m, slab(roundedRect(n.w, n.h), 1.2, top - 0.6, 0));
        var face = new THREE.Mesh(inner, n.cur ? m.matMark : m.matPanel); face.receiveShadow = true; grp.add(face);
        parts.push(o, face);
        n.lines.forEach(function (lid, i) {
          var cx = -(n.lines.length - 1) * 8 / 2 + i * 8;
          var dot = new THREE.Mesh(track(m, new THREE.CylinderGeometry(n.done ? 2.9 : 2.9, 2.9, 1.6, 18)), n.done ? m.lineMats[lid] : m.matPanel);
          dot.position.set(cx, top + 1.2, 0);
          grp.add(dot);
          if (!n.done) {
            var ring = new THREE.Mesh(track(m, new THREE.TorusGeometry(2.9, 0.85, 8, 24)), m.lineMats[lid]);
            ring.rotation.x = Math.PI / 2;
            ring.position.set(cx, top + 2, 0);
            grp.add(ring);
          }
        });
      } else {
        var lid = n.lines[0];
        var body = new THREE.Mesh(track(m, new THREE.CylinderGeometry(8.2, 8.6, top, 32)), m.lineMats[lid]);
        body.position.y = top / 2; body.castShadow = true; body.receiveShadow = true; grp.add(body);
        var cap = new THREE.Mesh(track(m, new THREE.CylinderGeometry(n.done ? 0.01 : 4.6, n.done ? 0.01 : 4.6, 1, 28)), n.cur ? m.matMark : m.matPanel);
        cap.position.y = top + 0.3; grp.add(cap);
        parts.push(body, cap);
      }
      // Estación actual: halo amarillo en el tablero que late despacio.
      if (n.cur) {
        var hw = (n.lines.length > 1 ? n.w : 16) + 18, hh = (n.lines.length > 1 ? n.h : 16) + 18;
        var halo = new THREE.Mesh(track(m, slab(roundedRect(Math.max(hw, hh), hh), 0.6, 0.05, 0)), m.matMark);
        halo.receiveShadow = true;
        grp.add(halo);
        m.halo = halo;
      }
      scene.add(grp);
      m.stations[n.id] = { grp: grp, lift: 0, want: 0, node: n };
    });

    // Tren: una cápsula de tinta con ventanas amarillas que recorre la meta, ida y vuelta.
    if (md.goal && m.tracks[md.goal]) {
      var tr = new THREE.Group();
      var bodyG = track(m, new THREE.CapsuleGeometry(4.2, 12, 6, 14));
      bodyG.rotateZ(Math.PI / 2);
      var tb = new THREE.Mesh(bodyG, m.matInk); tb.castShadow = true; tr.add(tb);
      var winG = track(m, new THREE.BoxGeometry(14, 2.2, 8.8));
      var win = new THREE.Mesh(winG, m.matMark); win.position.y = 1.4; tr.add(win);
      tr.scale.setScalar(0.9);
      scene.add(tr);
      m.train = tr;
    }
    recolor(m);
  }

  function recolor(m) {
    var md = m.model, C = function (v) { return new THREE.Color(cssVar(v)); };
    m.matBoard.color = C('--panel');
    m.matEdge.color = C('--line');
    var pc = C('--paper');
    var dark = 0.2126 * pc.r + 0.7152 * pc.g + 0.0722 * pc.b < 0.2; // papel oscuro: tema de noche
    m.dark = dark;
    m.matShadow.opacity = dark ? 0.35 : 0.13;
    m.hemi.intensity = dark ? 1.5 : 2.1;
    m.hemi.groundColor = dark ? new THREE.Color(0x1d2421) : new THREE.Color(0xd8d2c0);
    m.sun.intensity = dark ? 1.0 : 1.35;
    m.matPanel.color = C('--panel');
    m.matInk.color = C('--ink');
    m.matMark.color = C('--mark');
    md.lines.forEach(function (l) {
      var c = C('--' + l.color);
      if (m.tracks[l.id]) m.tracks[l.id].mat.color = c;
      m.lineMats[l.id].color = c.clone();
      m.lineMats[l.id].emissive = c.clone().multiplyScalar(dark ? 0.25 : 0.12);
    });
  }

  // ---------- Capa HTML: botones de estación e insignias ----------
  function buildOverlay(m, labels, badges) {
    var md = m.model;
    m.btns = [];
    md.nodes.forEach(function (n) {
      var t = el('span', { class: 'm3-t side-' + n.side, 'aria-hidden': 'true' });
      n.labelLines.forEach(function (s) { t.append(el('span', { text: s })); });
      var b = el('button', { type: 'button', class: 'm3-st' + (n.done ? ' done' : '') + (n.cur ? ' cur' : '') + (n.onGoal ? ' on-goal' : ''),
        'data-station': n.id, 'aria-label': n.label }, t);
      // El botón cubre la ficha (las compartidas son más anchas): la etiqueta empieza donde termina, como en el SVG.
      b.style.setProperty('--bw', String(Math.max(n.w, 16)));
      b.style.setProperty('--bh', String(Math.max(n.h, 16)));
      b.addEventListener('click', function (e) {
        if (m.dragged) { e.preventDefault(); e.stopPropagation(); return; }
        m.handlers.open(n.id);
      });
      b.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') hover(m, n.id); });
      b.addEventListener('pointerleave', function () { if (m.hoverId === n.id) hover(m, null); });
      b.addEventListener('focus', function () { hover(m, n.id); ensureVisible(m, n); });
      b.addEventListener('blur', function () { if (m.hoverId === n.id) hover(m, null); });
      labels.append(b);
      m.btns.push({ b: b, n: n, v: new THREE.Vector3(n.x - m.ox, 12, n.y - m.oz) });
    });
    m.badgeEls = [];
    md.badges.forEach(function (bd) {
      var line = md.lines.filter(function (l) { return l.id === bd.line; })[0];
      var s = el('span', { class: 'm3-badge ' + (line ? line.color : ''), text: 'L' + bd.n });
      badges.append(s);
      m.badgeEls.push({ s: s, v: new THREE.Vector3(bd.x - m.ox, 8, bd.y - m.oz) });
    });
  }

  // Resalta una estación (y sus líneas) o, con lineId, una línea. null: nada.
  function hover(m, id) {
    m.hoverId = id;
    var n = id ? m.stations[id] && m.stations[id].node : null;
    m.hoverLines = n ? n.lines : null;
    Object.keys(m.stations).forEach(function (k) { m.stations[k].want = k === id ? 5 : 0; });
    kick(m);
  }

  function highlightLine(lineId) {
    if (!cur) return;
    cur.hoverId = null;
    cur.hoverLines = lineId ? [lineId] : null;
    Object.keys(cur.stations).forEach(function (k) {
      cur.stations[k].want = lineId && cur.stations[k].node.lines.indexOf(lineId) !== -1 ? 3 : 0;
    });
    kick(cur);
  }

  // ---------- Cámara ----------
  function resize(m) {
    if (!m.alive) return;
    var w = m.host.clientWidth || 1, h = m.host.clientHeight || 1;
    if (w === m.w && h === m.h) return;
    m.w = w; m.h = h;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = w + 'px';
    renderer.domElement.style.height = h + 'px';
    m.camera.aspect = w / h;
    m.camera.updateProjectionMatrix();
    kick(m);
  }

  // Distancia de la cámara para que, con giro e inclinación de inicio, todo el tablero quepa con margen.
  function fitDistance(m, az, tilt) {
    var W = m.model.width + 24, H = m.model.height + 8;
    var corners = [[-W / 2, -H / 2], [W / 2, -H / 2], [-W / 2, H / 2], [W / 2, H / 2]];
    var lo = 100, hi = 25000, cam = m.camera, v = new THREE.Vector3();
    for (var it = 0; it < 30; it++) {
      var d = (lo + hi) / 2;
      place(m, { az: az, tilt: tilt, zoom: 1, tx: 0, tz: 0 }, d);
      var ok = true;
      for (var i = 0; i < corners.length && ok; i++) {
        v.set(corners[i][0], 0, corners[i][1]).project(cam);
        if (Math.abs(v.x) > 0.97 || Math.abs(v.y) > 0.97 || Math.abs(v.z) > 1) ok = false;
      }
      if (ok) hi = d; else lo = d;
    }
    return hi;
  }

  function place(m, c, dist) {
    var cam = m.camera, d = dist / c.zoom;
    var sinT = Math.sin(c.tilt), cosT = Math.cos(c.tilt);
    cam.position.set(c.tx + d * sinT * Math.sin(c.az), d * cosT, c.tz + d * sinT * Math.cos(c.az));
    cam.up.set(0, 1, 0);
    // Mirando casi desde arriba, «arriba» de la pantalla es el norte del mapa (-Z), girado con el azimut.
    if (c.tilt < 0.05) cam.up.set(-Math.sin(c.az), 0, -Math.cos(c.az));
    cam.lookAt(c.tx, 0, c.tz);
    cam.updateMatrixWorld();
  }

  function clampWant(m) {
    var c = m.want;
    c.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, c.zoom));
    c.tilt = Math.max(TILT_MIN, Math.min(TILT_MAX, c.tilt));
    c.az = Math.max(-AZ_MAX, Math.min(AZ_MAX, c.az));
    // Sin zoom, el centro vuelve al centro; con zoom, puede moverse hasta los bordes del tablero.
    var k = (c.zoom - 1) / (ZOOM_MAX - 1);
    var lx = (m.model.width / 2) * Math.min(1, k * 1.6), lz = (m.model.height / 2) * Math.min(1, k * 1.6);
    c.tx = Math.max(-lx, Math.min(lx, c.tx));
    c.tz = Math.max(-lz, Math.min(lz, c.tz));
  }

  // Si la estación enfocada con el teclado queda fuera de la vista, la cámara se mueve hacia ella.
  function ensureVisible(m, n) {
    if (!m.w) return;
    var v = new THREE.Vector3(n.x - m.ox, 10, n.y - m.oz).project(m.camera);
    var sx = (v.x + 1) / 2 * m.w, sy = (1 - v.y) / 2 * m.h;
    var inBox = sx > 30 && sx < m.w - 30 && sy > 30 && sy < m.h - 30;
    if (!inBox && m.want.zoom > 1.01) {
      m.want.tx = n.x - m.ox; m.want.tz = n.y - m.oz;
      clampWant(m);
      kick(m);
    }
  }

  function resetView() {
    if (!cur) return;
    cur.want = { az: AZ0, tilt: TILT0, zoom: 1, tx: 0, tz: 0 };
    kick(cur);
  }

  function zoomBy(f) {
    if (!cur) return;
    cur.want.zoom *= f;
    clampWant(cur);
    kick(cur);
  }

  // Arrastre: con ratón gira (horizontal) e inclina (vertical); con Mayús o botón derecho, desplaza.
  // Con el dedo: horizontal gira (el vertical se queda para el scroll de la página); dos dedos, pellizco y desplazamiento.
  function bindControls(m) {
    var host = m.host, ptrs = {}, start = null;
    function count() { return Object.keys(ptrs).length; }
    function pinchInfo() {
      var ks = Object.keys(ptrs), a = ptrs[ks[0]], b = ptrs[ks[1]];
      return { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    }
    m.onDown = function (e) {
      if (e.button !== undefined && e.button > 2) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY, type: e.pointerType };
      m.dragged = false;
      start = { x: e.clientX, y: e.clientY, az: m.want.az, tilt: m.want.tilt, tx: m.want.tx, tz: m.want.tz, zoom: m.want.zoom,
        pan: e.shiftKey || e.button === 2, touch: e.pointerType === 'touch' };
      if (count() === 2) start.pinch = pinchInfo();
    };
    m.onMove = function (e) {
      var p = ptrs[e.pointerId];
      if (!p || !start) return;
      p.x = e.clientX; p.y = e.clientY;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!m.dragged && Math.hypot(dx, dy) > 6) {
        // Con el dedo, un gesto vertical es scroll de la página: no se toma.
        if (start.touch && count() === 1 && Math.abs(dy) > Math.abs(dx)) { delete ptrs[e.pointerId]; start = null; return; }
        m.dragged = true;
        try { host.setPointerCapture(e.pointerId); } catch (er) { /* sin captura */ }
      }
      if (!m.dragged) return;
      var unit = (m.model.width / Math.max(1, m.w)) / m.want.zoom;
      if (count() >= 2 && start.pinch) {
        var pi = pinchInfo();
        m.want.zoom = start.zoom * (pi.d / Math.max(1, start.pinch.d));
        var px = (pi.cx - start.pinch.cx) * unit, pz = (pi.cy - start.pinch.cy) * unit;
        m.want.tx = start.tx - (px * Math.cos(m.want.az) + pz * Math.sin(m.want.az));
        m.want.tz = start.tz - (-px * Math.sin(m.want.az) + pz * Math.cos(m.want.az));
      } else if (start.pan) {
        var qx = dx * unit, qz = dy * unit / Math.max(0.4, Math.cos(m.want.tilt));
        m.want.tx = start.tx - (qx * Math.cos(m.want.az) + qz * Math.sin(m.want.az));
        m.want.tz = start.tz - (-qx * Math.sin(m.want.az) + qz * Math.cos(m.want.az));
      } else {
        m.want.az = start.az - dx * 0.006;
        if (!start.touch) m.want.tilt = start.tilt + dy * 0.004;
      }
      clampWant(m);
      kick(m);
    };
    m.onUp = function (e) {
      delete ptrs[e.pointerId];
      if (count() === 1 && start) {
        // Queda un dedo tras el pellizco: sigue desde aquí, sin saltos.
        var k = Object.keys(ptrs)[0];
        start = { x: ptrs[k].x, y: ptrs[k].y, az: m.want.az, tilt: m.want.tilt, tx: m.want.tx, tz: m.want.tz, zoom: m.want.zoom, pan: false, touch: true };
      }
      if (!count()) {
        start = null;
        // El clic que sigue al arrastre no abre la estación; se limpia después de ese clic.
        setTimeout(function () { m.dragged = false; }, 0);
      }
    };
    // Rueda: solo con Ctrl (o el pellizco del trackpad, que llega como Ctrl+rueda); sin Ctrl, la página se desplaza.
    m.onWheel = function (e) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      m.want.zoom *= Math.exp(-e.deltaY * 0.01);
      clampWant(m);
      kick(m);
    };
    m.onCtx = function (e) { if (m.dragged) e.preventDefault(); };
    m.onDbl = function (e) { if (e.target === renderer.domElement) resetView(); };
    host.addEventListener('pointerdown', m.onDown);
    host.addEventListener('pointermove', m.onMove);
    host.addEventListener('pointerup', m.onUp);
    host.addEventListener('pointercancel', m.onUp);
    host.addEventListener('wheel', m.onWheel, { passive: false });
    host.addEventListener('contextmenu', m.onCtx);
    host.addEventListener('dblclick', m.onDbl);
  }

  // ---------- Cuadros ----------
  function kick(m) {
    if (!m || !m.alive || m.raf) return;
    m.raf = requestAnimationFrame(function (t) { m.raf = 0; frame(m, t); });
  }

  function ease(a, b, k) { return a + (b - a) * k; }

  function frame(m, t) {
    if (!m.alive) return;
    var dt = Math.min(0.05, (t - m.lastT) / 1000);
    m.lastT = t;
    var busy = false;
    if (!m.w) resize(m);

    // Cámara: se acerca a la deseada con suavidad (de golpe con movimiento reducido).
    var k = m.motion ? 1 - Math.pow(0.0005, dt) : 1;
    var c = m.cam, wv = m.want;
    ['az', 'tilt', 'zoom', 'tx', 'tz'].forEach(function (key) {
      var nv = ease(c[key], wv[key], k);
      if (Math.abs(nv - wv[key]) < 1e-4) nv = wv[key]; else busy = true;
      c[key] = nv;
    });
    view = Object.assign({}, wv);
    // Con zoom 1 todo el tablero cabe, también girado o inclinado.
    m.fit = fitDistance(m, c.az, c.tilt);
    place(m, c, m.fit);
    if (m.resetBtn) m.resetBtn.hidden = Math.abs(wv.az - AZ0) < 0.01 && Math.abs(wv.tilt - TILT0) < 0.01 && Math.abs(wv.zoom - 1) < 0.01;

    // Entrada: las vías se dibujan de su primera a su última estación.
    if (m.intro < 1) {
      m.intro = Math.min(1, (t - m.t0) / 1100);
      busy = true;
    }
    var e = 1 - Math.pow(1 - m.intro, 3);
    Object.keys(m.tracks).forEach(function (id) {
      var tr = m.tracks[id];
      var cnt = Math.round(tr.count * e / 3) * 3;
      tr.mesh.geometry.setDrawRange(0, m.intro >= 1 ? Infinity : cnt);
      var want = m.hoverLines && m.hoverLines.indexOf(id) === -1 ? 0.18 : 1;
      var o = m.motion ? ease(tr.opacity, want, 1 - Math.pow(0.0001, dt)) : want;
      if (Math.abs(o - want) < 0.005) o = want; else busy = true;
      tr.opacity = o;
      tr.mat.opacity = o;
      tr.mat.depthWrite = o > 0.99;
    });

    // Estaciones que se levantan al pasar por encima o al enfocarlas.
    Object.keys(m.stations).forEach(function (id) {
      var s = m.stations[id];
      var l = m.motion ? ease(s.lift, s.want, 1 - Math.pow(0.0005, dt)) : s.want;
      if (Math.abs(l - s.want) < 0.02) l = s.want; else busy = true;
      s.lift = l;
      s.grp.position.y = l;
      var sc = 1 + l * 0.03;
      s.grp.scale.set(sc, 1, sc);
    });

    if (m.motion) {
      var secs = (t - m.t0) / 1000;
      if (m.halo) {
        var p = 1 + 0.08 * Math.sin(secs * 2.4);
        m.halo.scale.set(p, 1, p);
        busy = true;
      }
      if (m.train && m.intro >= 1) {
        var tr0 = m.tracks[m.model.goal];
        var period = Math.max(6, tr0.len / 34);
        var u = (secs % (2 * period)) / period;
        u = u > 1 ? 2 - u : u;                       // ida y vuelta
        u = u * u * (3 - 2 * u) * 0.98 + 0.01;       // frena en las puntas
        var pt = tr0.path.getPointAt(u), tg = tr0.path.getTangentAt(u);
        m.train.position.set(pt.x, pt.y + 4.3, pt.z);
        m.train.rotation.y = Math.atan2(-tg.z, tg.x);
        m.train.visible = true;
        busy = true;
      } else if (m.train) m.train.visible = false;
    } else if (m.train) {
      // Sin movimiento: el tren espera quieto en la estación actual (o al inicio de la línea).
      var tr1 = m.tracks[m.model.goal];
      var p0 = tr1.path.getPointAt(0.02), t0 = tr1.path.getTangentAt(0.02);
      m.train.position.set(p0.x, p0.y + 4.3, p0.z);
      m.train.rotation.y = Math.atan2(-t0.z, t0.x);
    }

    renderer.render(m.scene, m.camera);
    placeOverlay(m);

    // Se detiene si la página está oculta o el mapa salió de la pantalla; vuelve con kick().
    var hidden = document.hidden || !m.host.isConnected || m.host.closest('[hidden]');
    if (busy && !hidden) kick(m);
  }

  // Coloca cada botón donde cae su estación en pantalla. El texto escala un poco con la cercanía.
  function placeOverlay(m) {
    var v = new THREE.Vector3(), w = m.w, h = m.h, cam = m.camera;
    // Píxeles de pantalla por unidad del mapa a la distancia de cada estación.
    var focal = h / (2 * Math.tan(FOV * Math.PI / 360));
    m.btns.forEach(function (o) {
      v.copy(o.v);
      v.y += m.stations[o.n.id].lift;
      var ppu = focal / Math.max(1, cam.position.distanceTo(v));
      v.project(cam);
      var x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
      var s = Math.max(0.85, Math.min(1.6, ppu));
      o.b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)';
      o.b.style.setProperty('--s', s.toFixed(3));
      var off = v.z > 1 || x < -40 || x > w + 40 || y < -40 || y > h + 40;
      o.b.classList.toggle('off', off);
      // Muy lejos, los nombres se enciman: se ocultan (vuelven al pasar por encima o al enfocar la estación).
      o.b.classList.toggle('tiny', ppu < 0.8);
    });
    m.badgeEls.forEach(function (o) {
      v.copy(o.v).project(cam);
      var x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
      o.s.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)';
    });
  }

  function destroy() {
    var m = cur;
    if (!m) return;
    m.alive = false;
    cur = null;
    if (m.raf) cancelAnimationFrame(m.raf);
    if (m.ro) m.ro.disconnect();
    document.removeEventListener('visibilitychange', m.onVis);
    if (m.mq && m.mq.removeEventListener) m.mq.removeEventListener('change', m.onScheme);
    var host = m.host;
    host.removeEventListener('pointerdown', m.onDown);
    host.removeEventListener('pointermove', m.onMove);
    host.removeEventListener('pointerup', m.onUp);
    host.removeEventListener('pointercancel', m.onUp);
    host.removeEventListener('wheel', m.onWheel);
    host.removeEventListener('contextmenu', m.onCtx);
    host.removeEventListener('dblclick', m.onDbl);
    m.disposables.forEach(function (d) { if (d && d.dispose) d.dispose(); });
    if (renderer && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    if (renderer) renderer.renderLists.dispose();
  }

  // Vuelve a pintar (por ejemplo, al regresar a la pantalla Mapa ya montada).
  function refresh() { if (cur) { cur.w = 0; kick(cur); } }

  function setResetButton(b) { if (cur) cur.resetBtn = b; }
  function active() { return !!cur; }

  return { supported: supported, ready: ready, load: load, mount: mount, destroy: destroy, refresh: refresh,
    highlightLine: highlightLine, resetView: resetView, zoomBy: zoomBy, setResetButton: setResetButton, active: active };
})();
