// Reglas puras del hub de estudio: cajas, avance, fechas, sesión, racha y geometría del mapa.
// Script clásico (ES5): define globales y se exporta para las pruebas con Node.

var BOX_DAYS = [0, 1, 3, 7, 16, 35];
var BOX_WEIGHT = [0, 0.4, 0.6, 0.8, 0.9, 1];

function pad2(n) { return (n < 10 ? '0' : '') + n; }

// Fecha local del dispositivo como 'AAAA-MM-DD'.
function todayYmd(date) {
  var d = date || new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

// Suma n días a 'AAAA-MM-DD' con aritmética en UTC.
function addDays(ymd, n) {
  var p = ymd.split('-');
  var t = Date.UTC(+p[0], +p[1] - 1, +p[2]) + n * 86400000;
  var d = new Date(t);
  return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
}

function emptyState() {
  return { v: 2, goal: null, goalT: 0, items: {}, days: {} };
}

function isPlainObj(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function validState(x) {
  return isPlainObj(x) && x.v === 2 && isPlainObj(x.items) && isPlainObj(x.days);
}

function itemIds(station) {
  var out = [];
  for (var n = 0; n < 6; n++) out.push(station.id + '.' + n);
  return out;
}

function getQuestion(stations, itemId) {
  var i = String(itemId).lastIndexOf('.');
  if (i < 0) return null;
  var st = stations[itemId.slice(0, i)];
  var s = itemId.slice(i + 1);
  if (!st || !/^[0-9]+$/.test(s)) return null;
  var n = +s;
  if (n < 4) return st.steps && st.steps[n] ? st.steps[n].q : null;
  if (n < 6) return st.extra && st.extra[n - 4] ? st.extra[n - 4] : null;
  return null;
}

// Un error baja el ítem a la caja 1. Si el ítem nunca se había acertado (sin caja o ya marcado), queda con ok:false:
// cuenta como visto, pero no suma al avance hasta que se acierte. Un error en un ítem que ya se había acertado
// no lleva marca y pesa como la caja 1. Un ítem sin el campo (estados guardados antes) se asume acertado.
function reviewItem(prev, correct, today, now) {
  var b = 1;
  var pb = prev && prev.b > 0 ? prev.b : 0;
  if (correct) b = Math.min(5, pb + 1);
  var out = { b: b, due: addDays(today, BOX_DAYS[b]), t: now };
  if (!correct && (pb === 0 || prev.ok === false)) out.ok = false;
  return out;
}

function boxOf(state, id) {
  var it = state.items[id];
  var b = it && it.b > 0 ? it.b : 0;
  return b > 5 ? 5 : b;
}

// Peso de un ítem en el avance: el de su caja, o 0 si su último resultado fue un error.
function coreWeight(state, id) {
  var it = state.items[id];
  return it && it.ok === false ? 0 : BOX_WEIGHT[boxOf(state, id)];
}

function stationProgress(state, station) {
  var ids = itemIds(station), sum = 0;
  for (var i = 0; i < ids.length; i++) sum += coreWeight(state, ids[i]);
  return sum / ids.length;
}

function isVisited(state, station) {
  var ids = itemIds(station);
  for (var i = 0; i < ids.length; i++) if (boxOf(state, ids[i]) < 1) return false;
  return true;
}

function lineProgress(state, line, stations) {
  var sum = 0, n = 0;
  for (var i = 0; i < line.stations.length; i++) {
    var st = stations[line.stations[i]];
    if (!st) continue;
    sum += stationProgress(state, st);
    n++;
  }
  return n ? sum / n : 0;
}

function currentStation(state, line, stations) {
  for (var i = 0; i < line.stations.length; i++) {
    var st = stations[line.stations[i]];
    if (!st) continue;
    for (var n = 0; n < 4; n++) {
      if (boxOf(state, st.id + '.' + n) === 0) return st.id;
    }
  }
  return null;
}

// Ítems con caja 1 o más cuya estación existe y cuyo índice es 0 a 5.
function coreSeenItems(state, stations) {
  var out = [];
  for (var id in state.items) {
    if (!Object.prototype.hasOwnProperty.call(state.items, id)) continue;
    var it = state.items[id];
    if (!it || !(it.b >= 1) || typeof it.due !== 'string') continue;
    var i = id.lastIndexOf('.');
    if (i < 0 || !stations[id.slice(0, i)] || !/^[0-5]$/.test(id.slice(i + 1))) continue;
    out.push({ id: id, due: it.due });
  }
  return out;
}

function coreByDue(a, b) {
  if (a.due !== b.due) return a.due < b.due ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function coreStationOf(id) { return id.slice(0, id.lastIndexOf('.')); }

// Sesión de hasta 5 tarjetas: hasta 3 repasos vencidos, el resto pasos nuevos.
function buildSession(state, today, lines, stations, opts) {
  var seen = coreSeenItems(state, stations);
  var due = seen.filter(function (x) { return x.due <= today; }).sort(coreByDue);
  var goal = null, order = [], i, j, k;
  for (i = 0; i < lines.length; i++) if (lines[i].id === state.goal) { goal = lines[i]; break; }
  if (!goal && lines.length) goal = lines[0];
  if (goal) order.push(goal);
  for (i = 0; i < lines.length; i++) if (lines[i] !== goal) order.push(lines[i]);

  var fresh = [], inFresh = {};
  function add(id) {
    if (inFresh[id] || boxOf(state, id) >= 1) return;
    inFresh[id] = true;
    fresh.push(id);
  }
  function addRange(line, from, to) {
    for (j = 0; j < line.stations.length; j++) {
      var st = stations[line.stations[j]];
      if (!st) continue;
      for (k = from; k < to; k++) add(st.id + '.' + k);
    }
  }
  if (goal) { addRange(goal, 0, 4); addRange(goal, 4, 6); }
  for (i = 1; i < order.length; i++) { addRange(order[i], 0, 4); addRange(order[i], 4, 6); }

  var cards = [], used = {};
  function push(id, kind) {
    used[id] = true;
    cards.push({ kind: kind, item: id, station: coreStationOf(id) });
  }
  for (i = 0; i < due.length && i < 3; i++) push(due[i].id, 'review');
  for (i = 0; i < fresh.length && cards.length < 5; i++) {
    push(fresh[i], +fresh[i].slice(fresh[i].lastIndexOf('.') + 1) < 4 ? 'new' : 'extra');
  }
  for (i = 3; i < due.length && cards.length < 5; i++) push(due[i].id, 'review');
  if (opts && opts.ahead && cards.length < 5) {
    var later = seen.filter(function (x) { return x.due > today && !used[x.id]; }).sort(coreByDue);
    for (i = 0; i < later.length && cards.length < 5; i++) { push(later[i].id, 'review'); cards[cards.length - 1].ahead = true; }
  }
  return cards;
}

// Agrega al final una repetición del error; la repetición no se vuelve a repetir.
function enqueueRepeat(queue, card, correct) {
  if (correct || card.repeat) return queue.slice();
  var again = { kind: card.kind, item: card.item, station: card.station, repeat: true };
  if (card.ahead) again.ahead = true;
  return queue.concat([again]);
}

function coreCount(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

function coreWhere(cards, kind, stations) {
  var first = null, more = false;
  for (var i = 0; i < cards.length; i++) {
    if (cards[i].kind !== kind) continue;
    if (first === null) first = cards[i].station;
    else if (cards[i].station !== first) more = true;
  }
  var st = stations[first];
  return ' de ' + (st && st.name ? st.name : first) + (more ? ' y más' : '');
}

function describeSession(cards, stations) {
  if (!cards.length) return '';
  var n = { review: 0, 'new': 0, extra: 0 }, i;
  for (i = 0; i < cards.length; i++) n[cards[i].kind]++;
  var parts = [cards.length + ' min'];
  if (n.review) parts.push(coreCount(n.review, 'repaso', 'repasos'));
  if (n['new']) parts.push(coreCount(n['new'], 'paso nuevo', 'pasos nuevos') + coreWhere(cards, 'new', stations));
  if (n.extra) parts.push(coreCount(n.extra, 'pregunta extra', 'preguntas extra') + coreWhere(cards, 'extra', stations));
  return parts.join(' \u00b7 ');
}

// Fecha más cercana entre los ítems con caja 1 o más; null si no hay.
function nextDue(state, today) {
  var best = null;
  for (var id in state.items) {
    if (!Object.prototype.hasOwnProperty.call(state.items, id)) continue;
    var it = state.items[id];
    if (!it || !(it.b >= 1) || typeof it.due !== 'string') continue;
    if (best === null || it.due < best) best = it.due;
  }
  return best;
}

var XP = { right: 10, wrong: 2, done: 20 };

// Día normalizado: xp es un número finito y no negativo (acepta números en texto); cualquier otra cosa vale 0.
// Un día que no es un objeto (null, número, texto) vale { xp: 0, done: false }.
function coreDay(state, ymd) {
  var d = state.days[ymd];
  if (!isPlainObj(d)) return { xp: 0, done: false };
  var x = Number(d.xp);
  return { xp: isFinite(x) && x > 0 ? x : 0, done: d.done === true };
}

function coreWithDay(state, ymd, day) {
  var days = {};
  for (var k in state.days) if (Object.prototype.hasOwnProperty.call(state.days, k)) days[k] = state.days[k];
  days[ymd] = day;
  return { v: state.v, goal: state.goal, goalT: state.goalT, items: state.items, days: days };
}

// Registra una respuesta: mueve la caja (salvo en repeticiones y en repasos adelantados) y suma XP al día.
function recordAnswer(state, itemId, correct, today, now, opts) {
  var items = {}, k;
  for (k in state.items) if (Object.prototype.hasOwnProperty.call(state.items, k)) items[k] = state.items[k];
  if (!(opts && (opts.repeat || opts.ahead))) items[itemId] = reviewItem(state.items[itemId], correct, today, now);
  var day = coreDay(state, today);
  var next = coreWithDay(state, today, { xp: day.xp + (correct ? XP.right : XP.wrong), done: day.done });
  next.items = items;
  return next;
}

// Marca el día como cumplido. El bono de XP se da una sola vez por día.
function finishSession(state, today) {
  var day = coreDay(state, today);
  return coreWithDay(state, today, { xp: day.xp + (day.done ? 0 : XP.done), done: true });
}

function setGoal(state, lineId, now) {
  return { v: state.v, goal: lineId, goalT: now, items: state.items, days: state.days };
}

function totalXp(state) {
  var sum = 0;
  for (var k in state.days) {
    if (Object.prototype.hasOwnProperty.call(state.days, k)) sum += coreDay(state, k).xp;
  }
  return sum;
}

function level(xp) { return 1 + Math.floor(xp / 200); }

// Lunes de la semana de esa fecha.
function weekKey(ymd) {
  var p = ymd.split('-');
  var dow = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay();
  return addDays(ymd, -((dow + 6) % 7));
}

function coreIsDone(state, ymd) {
  return coreDay(state, ymd).done;
}

// Racha que termina en E (o en el día anterior si E no está cumplido).
function coreStreakAt(state, end, oldest) {
  var d = coreIsDone(state, end) ? end : addDays(end, -1);
  var count = 0, rest = [], used = {}, pending = [];
  while (oldest !== null && d >= oldest) {
    if (coreIsDone(state, d)) {
      count++;
      rest = rest.concat(pending);
      pending = [];
    } else {
      var wk = weekKey(d);
      if (used[wk]) break;
      used[wk] = true;
      pending.push(d);
    }
    d = addDays(d, -1);
  }
  return { count: count, rest: rest };
}

function streak(state, today) {
  var oldest = null, done = [], k;
  for (k in state.days) {
    if (Object.prototype.hasOwnProperty.call(state.days, k) && coreIsDone(state, k)) {
      done.push(k);
      if (oldest === null || k < oldest) oldest = k;
    }
  }
  if (!done.length) return { current: 0, best: 0, rest: [] };
  var cur = coreStreakAt(state, today, oldest);
  var best = cur.count;
  for (var i = 0; i < done.length; i++) {
    var c = coreStreakAt(state, done[i], oldest).count;
    if (c > best) best = c;
  }
  return { current: cur.count, best: best, rest: cur.rest };
}

// Solo la racha actual (igual a streak().current) sin calcular la mejor, que es O(n²) en días cumplidos.
function streakCurrent(state, today) {
  var oldest = null, k;
  for (k in state.days) {
    if (Object.prototype.hasOwnProperty.call(state.days, k) && coreIsDone(state, k) && (oldest === null || k < oldest)) oldest = k;
  }
  return oldest === null ? 0 : coreStreakAt(state, today, oldest).count;
}

function coreCopyState(s) {
  var items = {}, days = {}, k;
  for (k in s.items) if (Object.prototype.hasOwnProperty.call(s.items, k)) items[k] = s.items[k];
  for (k in s.days) if (Object.prototype.hasOwnProperty.call(s.days, k)) days[k] = coreDay(s, k);
  return { v: 2, goal: s.goal === undefined ? null : s.goal, goalT: s.goalT > 0 ? s.goalT : 0, items: items, days: days };
}

// Combina dos estados: ítem más reciente, XP máximo, done si cualquiera, meta más reciente.
function mergeState(a, b) {
  var va = validState(a), vb = validState(b);
  if (!va && !vb) return emptyState();
  if (!vb) return coreCopyState(a);
  if (!va) return coreCopyState(b);
  var out = coreCopyState(a), k;
  for (k in b.items) {
    if (!Object.prototype.hasOwnProperty.call(b.items, k)) continue;
    var cur = out.items[k], bt = b.items[k] && b.items[k].t > 0 ? b.items[k].t : 0;
    if (!cur || bt > (cur.t > 0 ? cur.t : 0)) out.items[k] = b.items[k];
  }
  for (k in b.days) {
    if (!Object.prototype.hasOwnProperty.call(b.days, k)) continue;
    var d = coreDay(b, k), e = out.days[k];
    out.days[k] = e ? { xp: Math.max(coreDay(out, k).xp, d.xp), done: coreDay(out, k).done || d.done } : { xp: d.xp, done: d.done };
  }
  if ((b.goalT > 0 ? b.goalT : 0) > out.goalT) { out.goal = b.goal === undefined ? null : b.goal; out.goalT = b.goalT; }
  return out;
}

// Atajo de una estación: dos aciertos en las preguntas extra la dan por sabida.
function applyShortcut(state, station, answers, today, now) {
  var ok0 = answers[0] === station.extra[0].ok, ok1 = answers[1] === station.extra[1].ok;
  var items = {}, k, ids = itemIds(station);
  for (k in state.items) if (Object.prototype.hasOwnProperty.call(state.items, k)) items[k] = state.items[k];
  var passed = ok0 && ok1;
  if (passed) {
    for (var i = 0; i < ids.length; i++) items[ids[i]] = { b: 3, due: addDays(today, BOX_DAYS[3]), t: now };
  } else {
    items[station.id + '.4'] = reviewItem(state.items[station.id + '.4'], ok0, today, now);
    items[station.id + '.5'] = reviewItem(state.items[station.id + '.5'], ok1, today, now);
  }
  return {
    state: { v: state.v, goal: state.goal, goalT: state.goalT, items: items, days: state.days },
    passed: passed
  };
}

// Lo que muestra el cierre de la sesión y depende del estado final: la racha y los repasos que tocan mañana.
function sessionTail(state, stations, today) {
  var tomorrow = addDays(today, 1), due = 0;
  for (var id in state.items) {
    if (!Object.prototype.hasOwnProperty.call(state.items, id)) continue;
    var it = state.items[id];
    if (!it || !(it.b >= 1) || typeof it.due !== 'string' || it.due > tomorrow) continue;
    if (stations[coreStationOf(id)]) due++;
  }
  return { streak: streak(state, today).current, dueTomorrow: due };
}

// Geometría del mapa: los tramos que comparten varias líneas (misma pareja de estaciones)
// se separan (i - (n - 1) / 2) * 7 px, en el orden de `lines`. Clave: pareja ordenada unida con '|'.
function coreSegKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }

function segmentOffsets(lines) {
  var by = {}, out = {}, i, j, k, l;
  for (i = 0; i < lines.length; i++) {
    l = lines[i];
    for (j = 1; j < l.stations.length; j++) {
      k = coreSegKey(l.stations[j - 1], l.stations[j]);
      if (!by[k]) by[k] = [];
      if (by[k].indexOf(l.id) === -1) by[k].push(l.id);
    }
  }
  for (i = 0; i < lines.length; i++) {
    l = lines[i];
    out[l.id] = {};
    for (j = 1; j < l.stations.length; j++) {
      k = coreSegKey(l.stations[j - 1], l.stations[j]);
      out[l.id][k] = (by[k].indexOf(l.id) - (by[k].length - 1) / 2) * 7;
    }
  }
  return out;
}

// Dibujo del mapa (unidades del viewBox de 360 de ancho; a 390 px de pantalla 1 unidad ≈ 1 px).
// Etiquetas de 12 con interlineado 14. Una estación normal es un círculo de radio r; una compartida,
// una píldora con un punto por línea. Lado de la etiqueta: 'l', 'r' (por defecto), 't' (arriba) o 'b' (abajo).
var MAP_GEO = { width: 360, font: 12, lineH: 14, r: 7, dotGap: 8, pillH: 18, gap: 7, stroke: 7, wrapW: 120, badgeW: 26, badgeH: 16 };

// Ancho estimado de un texto a 12 px, holgado: el mayor entre IBM Plex Sans e Inter en negrita (la estación actual va en negrita).
function mapTextW(t) {
  var w = 0;
  for (var i = 0; i < t.length; i++) {
    var ch = t.charAt(i);
    if (ch === ' ') w += 2.9;
    else if ('ijlíI'.indexOf(ch) !== -1) w += ch === 'I' ? 5.2 : 3.7;
    else if ('frt'.indexOf(ch) !== -1) w += 4.9;
    else if (ch === 'm' || ch === 'M' || ch === 'w' || ch === 'W') w += 11.2;
    else if (ch !== ch.toLowerCase()) w += 9.4;
    else w += 7.6;
  }
  return w;
}

// Nombre en 1 renglón o, si mide más de wrapW, en 2: se corta en el espacio que deja el renglón más largo más corto,
// sin empezar el segundo renglón con una palabra de 1 o 2 letras («Respuesta a / incidentes», no «Respuesta / a incidentes»).
function mapLabelLines(name) {
  if (mapTextW(name) <= MAP_GEO.wrapW) return [name];
  var best = -1, bestW = Infinity;
  for (var i = 0; i < name.length; i++) {
    if (name.charAt(i) !== ' ') continue;
    var next = name.slice(i + 1).split(' ')[0];
    if (next.length <= 2) continue;
    var w = Math.max(mapTextW(name.slice(0, i)), mapTextW(name.slice(i + 1)));
    if (w < bestW) { bestW = w; best = i; }
  }
  return best === -1 ? [name] : [name.slice(0, best), name.slice(best + 1)];
}

function mapMarkerW(n) { return n > 1 ? (n - 1) * MAP_GEO.dotGap + MAP_GEO.pillH : 2 * MAP_GEO.r; }

// Geometría completa: estaciones (en orden de línea, sin repetir), tramos de cada línea con su desplazamiento
// paralelo (segmentOffsets, perpendicular al tramo en el sentido de su clave) y caja estimada de cada etiqueta.
function mapLayout(lines, stations) {
  var G = MAP_GEO, offs = segmentOffsets(lines), nodes = [], byId = {}, paths = {}, maxY = 0, i, j;
  for (i = 0; i < lines.length; i++) {
    var l = lines[i];
    for (j = 0; j < l.stations.length; j++) {
      var id = l.stations[j], c = l.map[id];
      if (!c || !stations[id]) continue;
      if (!byId[id]) {
        byId[id] = { id: id, x: c[0], y: c[1], side: c[2] || 'r', lines: [] };
        nodes.push(byId[id]);
      }
      byId[id].lines.push(l.id);
    }
  }
  for (i = 0; i < nodes.length; i++) {
    var nd = nodes[i], w = mapMarkerW(nd.lines.length), h = nd.lines.length > 1 ? G.pillH : 2 * G.r;
    nd.w = w; nd.h = h;
    var txt = mapLabelLines(stations[nd.id].name), tw = 0;
    for (j = 0; j < txt.length; j++) tw = Math.max(tw, mapTextW(txt[j]));
    var th = txt.length * G.lineH, side = nd.side, lab;
    if (side === 't' || side === 'b') {
      var ty0 = side === 't' ? nd.y - h / 2 - 4 - th : nd.y + h / 2 + 4;
      lab = { x: nd.x, anchor: 'middle', cy: ty0 + th / 2, box: { x0: nd.x - tw / 2, x1: nd.x + tw / 2, y0: ty0, y1: ty0 + th } };
    } else {
      var lx = side === 'l' ? nd.x - w / 2 - G.gap : nd.x + w / 2 + G.gap;
      lab = { x: lx, anchor: side === 'l' ? 'end' : 'start', cy: nd.y,
        box: { x0: side === 'l' ? lx - tw : lx, x1: side === 'l' ? lx : lx + tw, y0: nd.y - th / 2, y1: nd.y + th / 2 } };
    }
    lab.lines = txt;
    nd.label = lab;
    if (nd.y > maxY) maxY = nd.y;
  }
  for (i = 0; i < lines.length; i++) {
    var ln = lines[i], segs = [];
    for (j = 1; j < ln.stations.length; j++) {
      var a = byId[ln.stations[j - 1]], b = byId[ln.stations[j]];
      if (!a || !b) continue;
      var k = coreSegKey(a.id, b.id), o = offs[ln.id][k] || 0;
      var p = a.id < b.id ? a : b, q = a.id < b.id ? b : a;
      var dx = q.x - p.x, dy = q.y - p.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len * o, ny = dx / len * o;
      segs.push([a.x + nx, a.y + ny, b.x + nx, b.y + ny]);
    }
    paths[ln.id] = segs;
  }
  // Insignia «L#» junto a la estación donde empieza cada línea: en line.badge [x, y] (centro) o, si no hay, 24 arriba.
  var badges = [];
  for (i = 0; i < lines.length; i++) {
    var bl = lines[i], first = byId[bl.stations[0]];
    if (!first) continue;
    var bc = bl.badge || [first.x, first.y - 24];
    badges.push({ line: bl.id, n: bl.n, x: bc[0], y: bc[1],
      box: { x0: bc[0] - G.badgeW / 2, x1: bc[0] + G.badgeW / 2, y0: bc[1] - G.badgeH / 2, y1: bc[1] + G.badgeH / 2 } });
    if (bc[1] > maxY) maxY = bc[1];
  }
  return { width: G.width, height: maxY + 40, nodes: nodes, byId: byId, paths: paths, badges: badges };
}

// ¿El tramo (x1,y1)-(x2,y2) toca la caja (agrandada en pad)? Recorte de Liang-Barsky.
function coreSegHitsBox(s, b, pad) {
  var x0 = b.x0 - pad, x1 = b.x1 + pad, y0 = b.y0 - pad, y1 = b.y1 + pad;
  var dx = s[2] - s[0], dy = s[3] - s[1], t0 = 0, t1 = 1;
  var P = [-dx, dx, -dy, dy], Q = [s[0] - x0, x1 - s[0], s[1] - y0, y1 - s[1]];
  for (var i = 0; i < 4; i++) {
    if (P[i] === 0) { if (Q[i] < 0) return false; continue; }
    var t = Q[i] / P[i];
    if (P[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
    else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}
function coreBoxesHit(a, b, pad) { return a.x0 - pad < b.x1 && b.x0 - pad < a.x1 && a.y0 - pad < b.y1 && b.y0 - pad < a.y1; }
function coreMarkerBox(n) { return { x0: n.x - n.w / 2, x1: n.x + n.w / 2, y0: n.y - n.h / 2, y1: n.y + n.h / 2 }; }

// Problemas de legibilidad del mapa (lista vacía = limpio): estaciones más cerca de minDist, etiquetas que se enciman
// entre sí, con una estación o con un tramo, tramos que cruzan una estación ajena y cosas fuera del lienzo.
function mapIssues(layout, minDist) {
  var out = [], ns = layout.nodes, half = MAP_GEO.stroke / 2, i, j, k, lid, segs;
  var md = minDist || 0;
  for (i = 0; i < ns.length; i++) {
    var a = ns[i], lb = a.label.box, mb = coreMarkerBox(a);
    if (lb.x0 < 2 || lb.x1 > layout.width - 2 || lb.y0 < 2) out.push('etiqueta fuera: ' + a.id);
    if (mb.x0 < 2 || mb.x1 > layout.width - 2 || mb.y0 < 2) out.push('estación fuera: ' + a.id);
    for (j = 0; j < ns.length; j++) {
      if (i === j) continue;
      var b = ns[j];
      if (j > i && Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)) < md) out.push('estaciones juntas: ' + a.id + ' y ' + b.id);
      if (j > i && coreBoxesHit(lb, b.label.box, 2)) out.push('etiquetas encimadas: ' + a.id + ' y ' + b.id);
      if (coreBoxesHit(lb, coreMarkerBox(b), 2)) out.push('etiqueta sobre estación: ' + a.id + ' sobre ' + b.id);
    }
    for (lid in layout.paths) {
      segs = layout.paths[lid];
      for (k = 0; k < segs.length; k++) {
        if (coreSegHitsBox(segs[k], lb, half + 1)) { out.push('etiqueta sobre línea: ' + a.id + ' y ' + lid); break; }
      }
    }
  }
  // Insignias de línea: dentro del lienzo y sin tocar etiquetas, estaciones, tramos ni otras insignias.
  var bs = layout.badges || [];
  for (i = 0; i < bs.length; i++) {
    var bx = bs[i].box, bn = 'insignia L' + bs[i].n;
    if (bx.x0 < 2 || bx.x1 > layout.width - 2 || bx.y0 < 2) out.push(bn + ' fuera');
    for (j = 0; j < ns.length; j++) {
      if (coreBoxesHit(bx, ns[j].label.box, 2)) out.push(bn + ' sobre la etiqueta de ' + ns[j].id);
      if (coreBoxesHit(bx, coreMarkerBox(ns[j]), 2)) out.push(bn + ' sobre la estación ' + ns[j].id);
    }
    for (j = i + 1; j < bs.length; j++) if (coreBoxesHit(bx, bs[j].box, 2)) out.push(bn + ' sobre insignia L' + bs[j].n);
    for (lid in layout.paths) {
      segs = layout.paths[lid];
      for (k = 0; k < segs.length; k++) {
        if (coreSegHitsBox(segs[k], bx, half + 1)) { out.push(bn + ' sobre línea: ' + lid); break; }
      }
    }
  }
  // Un tramo no pasa por encima de una estación que no es la suya.
  for (lid in layout.paths) {
    segs = layout.paths[lid];
    for (k = 0; k < segs.length; k++) {
      for (i = 0; i < ns.length; i++) {
        var n = ns[i];
        if (Math.abs(segs[k][0] - n.x) < 8 && Math.abs(segs[k][1] - n.y) < 8) continue;
        if (Math.abs(segs[k][2] - n.x) < 8 && Math.abs(segs[k][3] - n.y) < 8) continue;
        if (coreSegHitsBox(segs[k], coreMarkerBox(n), half)) out.push('línea sobre estación: ' + lid + ' cruza ' + n.id);
      }
    }
  }
  return out;
}

// Líneas cuyas áreas coinciden con las del cuestionario, en el orden de LINEAS.
// `lines` es opcional: sin él usa la global LINEAS (js/data-lineas.js).
function lineasFor(topKeys, lines) {
  var ls = lines !== undefined ? lines : (typeof LINEAS !== 'undefined' ? LINEAS : []);
  var out = [];
  for (var i = 0; i < ls.length; i++) {
    var a = ls[i].areas || [];
    for (var j = 0; j < a.length; j++) if (topKeys.indexOf(a[j]) !== -1) { out.push(ls[i].id); break; }
  }
  return out;
}

// Vista docente. El estado de cada alumno lo escribe su navegador: nada de él es confiable.
// Todo número se coerciona (no finito: 0), el XP de cada día se limita a 0…1000 y solo cuentan
// días con llave 'AAAA-MM-DD' real entre 2020-01-01 y mañana; la racha mira solo los últimos 400 días (hoy incluido).
var ADMIN_XP_DAY = 1000;
var ADMIN_STREAK_DAYS = 400; // tope deliberado: una racha de más de 400 días se muestra como 400

// Solo acepta primitivos: Number() sobre un arreglo anidado miles de veces desborda la pila (y lanzaría).
function adminNum(x) {
  var n = typeof x === 'number' ? x : typeof x === 'string' ? Number(x) : 0;
  return isFinite(n) ? n : 0;
}

// today: 'AAAA-MM-DD'. lines y stations: LINEAS y ESTACIONES (se reciben para poder probar sin globales).
// Devuelve { valid, goalId, pct, streak, xp, lastDay }; con estado inválido, valid false y lo demás null.
function adminRow(state, today, lines, stations) {
  var out = { valid: false, goalId: null, pct: null, streak: null, xp: null, lastDay: null };
  if (!validState(state)) return out;
  out.valid = true;
  var hasOwn = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

  var line = null, i, j, k;
  if (typeof state.goal === 'string') {
    for (i = 0; i < lines.length; i++) if (lines[i].id === state.goal) { line = lines[i]; break; }
  }
  if (line) {
    out.goalId = line.id;
    var items = {};
    for (i = 0; i < line.stations.length; i++) {
      var st = stations[line.stations[i]];
      if (!st || !hasOwn(stations, line.stations[i])) continue;
      var ids = itemIds(st);
      for (j = 0; j < ids.length; j++) {
        if (!hasOwn(state.items, ids[j]) || !isPlainObj(state.items[ids[j]])) continue;
        var b = Math.floor(adminNum(state.items[ids[j]].b));
        items[ids[j]] = { b: b < 0 ? 0 : b > 5 ? 5 : b, ok: state.items[ids[j]].ok === false ? false : undefined };
      }
    }
    var p = Math.round(100 * lineProgress({ v: 2, items: items, days: {} }, line, stations));
    out.pct = p < 0 ? 0 : p > 100 ? 100 : p;
  }

  var minDay = '2020-01-01', maxDay = addDays(today, 1), streakFrom = addDays(today, 1 - ADMIN_STREAK_DAYS);
  var recent = {}, xp = 0, last = null;
  var keys = Object.keys(state.days);
  for (k = 0; k < keys.length; k++) {
    var key = keys[k], d = state.days[key];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || key < minDay || key > maxDay || addDays(key, 0) !== key || !isPlainObj(d)) continue;
    var dxp = adminNum(d.xp);
    dxp = dxp < 0 ? 0 : dxp > ADMIN_XP_DAY ? ADMIN_XP_DAY : dxp;
    var done = d.done === true;
    xp += dxp;
    if ((done || dxp > 0) && (last === null || key > last)) last = key;
    if (key >= streakFrom) recent[key] = { xp: dxp, done: done };
  }
  out.xp = Math.round(xp);
  out.lastDay = last;
  out.streak = streakCurrent({ v: 2, items: {}, days: recent }, today);
  return out;
}

// Orden de la tabla docente: último día de estudio más reciente primero, sin día al final y, a igualdad, por correo.
// a y b: { email, row: { lastDay } }.
function adminCompare(a, b) {
  var da = a.row.lastDay, db = b.row.lastDay;
  if (da !== db) {
    if (da === null) return 1;
    if (db === null) return -1;
    return da < db ? 1 : -1;
  }
  return a.email < b.email ? -1 : a.email > b.email ? 1 : 0;
}

if (typeof module !== 'undefined') module.exports = {
  adminRow: adminRow, adminCompare: adminCompare,
  BOX_DAYS: BOX_DAYS, BOX_WEIGHT: BOX_WEIGHT, todayYmd: todayYmd, addDays: addDays,
  emptyState: emptyState, validState: validState, itemIds: itemIds, getQuestion: getQuestion,
  reviewItem: reviewItem, stationProgress: stationProgress, isVisited: isVisited,
  lineProgress: lineProgress, currentStation: currentStation,
  buildSession: buildSession, enqueueRepeat: enqueueRepeat, describeSession: describeSession,
  nextDue: nextDue,
  XP: XP, recordAnswer: recordAnswer, finishSession: finishSession, setGoal: setGoal,
  totalXp: totalXp, level: level, weekKey: weekKey, streak: streak, streakCurrent: streakCurrent, mergeState: mergeState,
  applyShortcut: applyShortcut, sessionTail: sessionTail,
  segmentOffsets: segmentOffsets, lineasFor: lineasFor,
  MAP_GEO: MAP_GEO, mapTextW: mapTextW, coreSegHitsBox: coreSegHitsBox, mapLabelLines: mapLabelLines, mapMarkerW: mapMarkerW, mapLayout: mapLayout, mapIssues: mapIssues
};
