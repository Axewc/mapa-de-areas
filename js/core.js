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

function reviewItem(prev, correct, today, now) {
  var b = 1;
  if (correct) {
    var pb = prev && prev.b > 0 ? prev.b : 0;
    b = Math.min(5, pb + 1);
  }
  return { b: b, due: addDays(today, BOX_DAYS[b]), t: now };
}

function boxOf(state, id) {
  var it = state.items[id];
  var b = it && it.b > 0 ? it.b : 0;
  return b > 5 ? 5 : b;
}

function stationProgress(state, station) {
  var ids = itemIds(station), sum = 0;
  for (var i = 0; i < ids.length; i++) sum += BOX_WEIGHT[boxOf(state, ids[i])];
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
    for (i = 0; i < later.length && cards.length < 5; i++) push(later[i].id, 'review');
  }
  return cards;
}

// Agrega al final una repetición del error; la repetición no se vuelve a repetir.
function enqueueRepeat(queue, card, correct) {
  if (correct || card.repeat) return queue.slice();
  return queue.concat([{ kind: card.kind, item: card.item, station: card.station, repeat: true }]);
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

function coreDay(state, ymd) {
  var d = state.days[ymd];
  return { xp: d && d.xp > 0 ? d.xp : 0, done: !!(d && d.done) };
}

function coreWithDay(state, ymd, day) {
  var days = {};
  for (var k in state.days) if (Object.prototype.hasOwnProperty.call(state.days, k)) days[k] = state.days[k];
  days[ymd] = day;
  return { v: state.v, goal: state.goal, goalT: state.goalT, items: state.items, days: days };
}

// Registra una respuesta: mueve la caja (salvo en repeticiones) y suma XP al día.
function recordAnswer(state, itemId, correct, today, now, opts) {
  var items = {}, k;
  for (k in state.items) if (Object.prototype.hasOwnProperty.call(state.items, k)) items[k] = state.items[k];
  if (!(opts && opts.repeat)) items[itemId] = reviewItem(state.items[itemId], correct, today, now);
  var day = coreDay(state, today);
  var next = coreWithDay(state, today, { xp: day.xp + (correct ? XP.right : XP.wrong), done: day.done });
  next.items = items;
  return next;
}

function finishSession(state, today) {
  var day = coreDay(state, today);
  return coreWithDay(state, today, { xp: day.xp + XP.done, done: true });
}

function setGoal(state, lineId, now) {
  return { v: state.v, goal: lineId, goalT: now, items: state.items, days: state.days };
}

function totalXp(state) {
  var sum = 0;
  for (var k in state.days) {
    if (Object.prototype.hasOwnProperty.call(state.days, k) && state.days[k] && state.days[k].xp > 0) sum += state.days[k].xp;
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
  var d = state.days[ymd];
  return !!(d && d.done);
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

function coreCopyState(s) {
  var items = {}, days = {}, k;
  for (k in s.items) if (Object.prototype.hasOwnProperty.call(s.items, k)) items[k] = s.items[k];
  for (k in s.days) if (Object.prototype.hasOwnProperty.call(s.days, k)) days[k] = { xp: s.days[k].xp, done: s.days[k].done };
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

function sessionSummary(before, after, goalLine, stations, today) {
  var order = [], seen = {}, i, id;
  var lineIds = goalLine && goalLine.stations ? goalLine.stations : [];
  for (i = 0; i < lineIds.length; i++) if (!seen[lineIds[i]]) { seen[lineIds[i]] = true; order.push(lineIds[i]); }
  for (id in stations) if (Object.prototype.hasOwnProperty.call(stations, id) && !seen[id]) { seen[id] = true; order.push(id); }
  var visited = [];
  for (i = 0; i < order.length; i++) {
    var st = stations[order[i]];
    if (st && isVisited(after, st) && !isVisited(before, st)) visited.push(order[i]);
  }
  var tomorrow = addDays(today, 1), due = 0;
  for (id in after.items) {
    if (!Object.prototype.hasOwnProperty.call(after.items, id)) continue;
    var it = after.items[id];
    if (!it || !(it.b >= 1) || typeof it.due !== 'string' || it.due > tomorrow) continue;
    if (stations[coreStationOf(id)]) due++;
  }
  return {
    xp: totalXp(after) - totalXp(before),
    streak: streak(after, today).current,
    deltaPct: Math.round(100 * lineProgress(after, goalLine, stations) - 100 * lineProgress(before, goalLine, stations)),
    visited: visited,
    dueTomorrow: due
  };
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

if (typeof module !== 'undefined') module.exports = {
  BOX_DAYS: BOX_DAYS, BOX_WEIGHT: BOX_WEIGHT, todayYmd: todayYmd, addDays: addDays,
  emptyState: emptyState, validState: validState, itemIds: itemIds, getQuestion: getQuestion,
  reviewItem: reviewItem, stationProgress: stationProgress, isVisited: isVisited,
  lineProgress: lineProgress, currentStation: currentStation,
  buildSession: buildSession, enqueueRepeat: enqueueRepeat, describeSession: describeSession,
  nextDue: nextDue,
  XP: XP, recordAnswer: recordAnswer, finishSession: finishSession, setGoal: setGoal,
  totalXp: totalXp, level: level, weekKey: weekKey, streak: streak, mergeState: mergeState,
  applyShortcut: applyShortcut, sessionSummary: sessionSummary,
  segmentOffsets: segmentOffsets, lineasFor: lineasFor
};
