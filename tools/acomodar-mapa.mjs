// Acomoda el mapa de líneas: busca posiciones de estaciones, lados de etiqueta, quiebres de tramo e insignias «L#»
// que dejen el mapa legible (las reglas de tests/content.test.mjs) con los menos cruces, quiebres y zonas llenas posibles.
// Recocido simulado en una rejilla de 5, partiendo de lo que ya está en js/data-lineas.js. Determinista con --seed.
//
// Uso:
//   node tools/acomodar-mapa.mjs                 # solo mide y muestra el resultado (no escribe)
//   node tools/acomodar-mapa.mjs --write         # escribe map, bends y badge en js/data-lineas.js
//   node tools/acomodar-mapa.mjs --iter 400000 --seed 7 --write
//
// Escribe solo las propiedades map, bends y badge de cada línea; el resto del archivo queda igual.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'js/data-lineas.js');
const { LINEAS } = require(path.join(ROOT, 'js/data-lineas.js'));
const { ESTACIONES } = require(path.join(ROOT, 'js/data-estaciones.js'));
const { mapLayout, mapIssues, mapCrossings, mapOverlaps, octiRoute, MAP_GEO } = require(path.join(ROOT, 'js/core.js'));

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i === -1 ? def : Number(args[i + 1]); };
const ITER = opt('iter', 250000);
const SEED = opt('seed', 42);
const MAX_Y = opt('maxy', 900);
const WRITE = args.includes('--write');

// Generador pseudoaleatorio con semilla (mulberry32).
let seed = SEED >>> 0;
function rnd() {
  seed = (seed + 0x6D2B79F5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (a) => a[Math.floor(rnd() * a.length)];
const snap = (v) => Math.round(v / 5) * 5;
const key = (a, b) => (a < b ? a + '|' + b : b + '|' + a);

// ---------- Estado ----------
const ids = [];
const lineOf = {};
LINEAS.forEach((l) => l.stations.forEach((s) => { if (!(s in lineOf)) { lineOf[s] = []; ids.push(s); } lineOf[s].push(l.id); }));
const edges = [...new Set(LINEAS.flatMap((l) => l.stations.slice(1).map((s, i) => key(l.stations[i], s))))];

function initial() {
  const st = { pos: {}, side: {}, bend: {}, badge: {} };
  LINEAS.forEach((l) => {
    l.stations.forEach((s) => {
      const c = l.map[s];
      st.pos[s] = [snap(c[0]), snap(c[1])];
      st.side[s] = c[2] || 'r';
    });
    Object.assign(st.bend, l.bends || {});
    st.badge[l.id] = 0;
  });
  return st;
}

// Candidatos de insignia alrededor de la primera estación: a los lados, arriba, abajo y en diagonal, cerca o un poco más lejos.
function badgeSpots(n) {
  const out = [], bw = MAP_GEO.badgeW / 2, bh = MAP_GEO.badgeH / 2;
  for (const g of [5, 13]) {
    const rx = n.w / 2 + g + bw, ry = n.h / 2 + g + bh;
    out.push([-rx, 0], [rx, 0], [0, -ry], [0, ry], [-rx, -ry], [rx, -ry], [-rx, ry], [rx, ry]);
  }
  return out;
}

function toLines(st) {
  return LINEAS.map((l) => {
    const map = {};
    l.stations.forEach((s) => { map[s] = [st.pos[s][0], st.pos[s][1], st.side[s]]; });
    const bends = {};
    for (let i = 1; i < l.stations.length; i++) {
      const k = key(l.stations[i - 1], l.stations[i]);
      if (st.bend[k] === 's') bends[k] = 's';
    }
    return Object.assign({}, l, { map, bends });
  });
}

// Coloca las insignias según el candidato elegido (necesita el ancho de la primera estación, que da mapLayout).
function withBadges(st, lines) {
  const lay0 = mapLayout(lines, ESTACIONES);
  return lines.map((l) => {
    const n = lay0.byId[l.stations[0]];
    const spots = badgeSpots(n);
    const o = spots[st.badge[l.id] % spots.length];
    return Object.assign({}, l, { badge: [Math.round(n.x + o[0]), Math.round(n.y + o[1])] });
  });
}

// ---------- Costo ----------
function evaluate(st) {
  const lines = withBadges(st, toLines(st));
  const lay = mapLayout(lines, ESTACIONES);
  const issues = mapIssues(lay, 44);
  let hard = issues.length;
  for (const s of ids) {
    const [x, y] = st.pos[s];
    if (x < 16 || x > 344 || y < 16 || y > MAX_Y) hard++;
  }
  // Insignia a 20 o menos de su estación (tests/content.test.mjs).
  for (const l of lines) {
    const b = lay.badges.find((x) => x.line === l.id).box, s = lay.byId[l.stations[0]];
    const dx = Math.max(0, b.x0 - (s.x + s.w / 2), (s.x - s.w / 2) - b.x1);
    const dy = Math.max(0, b.y0 - (s.y + s.h / 2), (s.y - s.h / 2) - b.y1);
    if (Math.hypot(dx, dy) > 20) hard++;
  }
  const crossings = mapCrossings(lay, lines).length;
  // Dos tramos distintos en la misma recta se ven como una sola vía: peor que un cruce. Que dos tramos salgan juntos de
  // la misma estación por un trecho corto (≤ 30) se permite, pero cuesta un poco.
  const overlaps = mapOverlaps(lay, lines, 30).length;
  const nearOverlaps = mapOverlaps(lay, lines).length - overlaps;
  let bends = 0, ink = 0, shortE = 0;
  for (const k of edges) {
    const [a, b] = k.split('|');
    const r = octiRoute(st.pos[a], st.pos[b], st.bend[k]);
    if (r.length > 2) bends++;
    for (let i = 1; i < r.length; i++) ink += Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]);
    // Un quiebre muy cerca de una estación se ve como un codo pegado a la ficha.
    if (r.length > 2) {
      const d1 = Math.hypot(r[1][0] - r[0][0], r[1][1] - r[0][1]), d2 = Math.hypot(r[2][0] - r[1][0], r[2][1] - r[1][1]);
      if (Math.min(d1, d2) < 18) shortE++;
    }
  }
  // Densidad: estaciones por franja de 100 de alto, al cuadrado (castiga las franjas llenas).
  const bands = {};
  for (const s of ids) { const b = Math.floor(st.pos[s][1] / 100); bands[b] = (bands[b] || 0) + 1; }
  let dens = 0;
  for (const b in bands) dens += bands[b] * bands[b];
  const height = lay.height;
  const cost = hard * 6000 + overlaps * 1500 + nearOverlaps * 120 + crossings * 900 + bends * 14 + shortE * 60 + ink * 0.25 + dens * 6 + height * 0.6;
  return { cost, hard, crossings, overlaps, nearOverlaps, bends, ink: Math.round(ink), dens, height, issues, lines, lay, bands };
}

// ---------- Búsqueda ----------
function clone(st) {
  return { pos: Object.fromEntries(Object.entries(st.pos).map(([k, v]) => [k, v.slice()])), side: { ...st.side }, bend: { ...st.bend }, badge: { ...st.badge } };
}

function mutate(st) {
  const r = rnd();
  if (r < 0.55) {
    const s = pick(ids), big = rnd() < 0.25 ? 60 : 20;
    st.pos[s][0] = snap(st.pos[s][0] + (rnd() * 2 - 1) * big);
    st.pos[s][1] = snap(st.pos[s][1] + (rnd() * 2 - 1) * big);
  } else if (r < 0.62) {
    // Desliza un grupo: todas las estaciones por debajo de una altura bajan o suben (abre espacio).
    const y0 = pick(ids.map((s) => st.pos[s][1])), dy = pick([-10, -5, 5, 10, 15]);
    for (const s of ids) if (st.pos[s][1] >= y0) st.pos[s][1] += dy;
  } else if (r < 0.72) {
    st.side[pick(ids)] = pick(['l', 'r', 't', 'b']);
  } else if (r < 0.84) {
    const k = pick(edges);
    st.bend[k] = st.bend[k] === 's' ? 'd' : 's';
  } else if (r < 0.92) {
    st.badge[pick(LINEAS).id] = Math.floor(rnd() * 16);
  } else {
    // Intercambia dos estaciones (con sus lados).
    const a = pick(ids), b = pick(ids);
    [st.pos[a], st.pos[b]] = [st.pos[b], st.pos[a]];
    [st.side[a], st.side[b]] = [st.side[b], st.side[a]];
  }
}

function summary(tag, e) {
  const bands = Object.keys(e.bands).sort((a, b) => a - b).map((b) => e.bands[b]);
  console.log(`${tag}: reglas rotas ${e.hard}, vías encimadas ${e.overlaps} (+${e.nearOverlaps} salidas juntas), cruces ${e.crossings}, quiebres ${e.bends}, tinta ${e.ink}, alto ${e.height}, estaciones por franja de 100 [${bands.join(' ')}]`);
}

// Elige la insignia que cumple (con el resto fijo): ayuda a arrancar desde el mapa actual.
function fixBadges(st) {
  for (const l of LINEAS) {
    let best = st.badge[l.id], bestC = Infinity;
    for (let i = 0; i < 16; i++) {
      st.badge[l.id] = i;
      const c = evaluate(st).cost;
      if (c < bestC) { bestC = c; best = i; }
    }
    st.badge[l.id] = best;
  }
}

const start = initial();
const before = evaluate(start);
summary('antes (con tramos a 45°)', before);
fixBadges(start);

let cur = start, curE = evaluate(cur), best = clone(cur), bestE = curE;
const T0 = 1500, T1 = 0.5;
for (let it = 0; it < ITER; it++) {
  const T = T0 * Math.pow(T1 / T0, it / ITER);
  const cand = clone(cur);
  mutate(cand);
  const e = evaluate(cand);
  if (e.cost < curE.cost || rnd() < Math.exp((curE.cost - e.cost) / T)) {
    cur = cand; curE = e;
    if (e.cost < bestE.cost) { best = clone(cand); bestE = e; }
  }
  if (it % 25000 === 0) summary('  vuelta ' + it, bestE);
}
fixBadges(best);
bestE = evaluate(best);
summary('después', bestE);
if (bestE.issues.length) console.log('Reglas rotas:\n  ' + bestE.issues.join('\n  '));
if (bestE.overlaps) console.log('Vías encimadas: ' + mapOverlaps(bestE.lay, bestE.lines, 30).join(', '));
console.log('Cruces que quedan: ' + (mapCrossings(bestE.lay, bestE.lines).join(', ') || 'ninguno'));

// ---------- Escritura ----------
if (WRITE) {
  if (bestE.hard) { console.error('No se escribe: el resultado rompe reglas del mapa.'); process.exit(1); }
  let src = fs.readFileSync(DATA, 'utf8');
  for (const l of bestE.lines) {
    const at = src.indexOf('id: "' + l.id + '"');
    if (at === -1) throw new Error('no encuentro ' + l.id);
    const end = src.indexOf('\n  }', at);
    let block = src.slice(at, end);
    const mapTxt = '{ ' + l.stations.map((s) => JSON.stringify(s) + ': [' + l.map[s][0] + ', ' + l.map[s][1] + ', ' + JSON.stringify(l.map[s][2]) + ']').join(', ') + ' }';
    // En cada línea, map es la penúltima propiedad y badge la última: se reemplazan las dos (y bends, si había).
    block = block.replace(/\n    bends: \{[^\n]*\},?/, '').replace(/\n    badge: \[[^\n]*\],?/, '');
    const bendsTxt = Object.keys(l.bends).length ? ',\n    bends: ' + JSON.stringify(l.bends).replace(/,/g, ', ').replace(/:/g, ': ') : '';
    block = block.replace(/\n    map: \{[^\n]*\},?/, '\n    map: ' + mapTxt + bendsTxt + ',\n    badge: [' + l.badge[0] + ', ' + l.badge[1] + ']');
    src = src.slice(0, at) + block + src.slice(end);
  }
  fs.writeFileSync(DATA, src);
  console.log('Escrito en js/data-lineas.js');
}
