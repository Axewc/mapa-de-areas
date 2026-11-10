// Reglas puras del hub de estudio: cajas, avance y fechas.
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

if (typeof module !== 'undefined') module.exports = {
  BOX_DAYS: BOX_DAYS, BOX_WEIGHT: BOX_WEIGHT, todayYmd: todayYmd, addDays: addDays,
  emptyState: emptyState, validState: validState, itemIds: itemIds, getQuestion: getQuestion,
  reviewItem: reviewItem, stationProgress: stationProgress, isVisited: isVisited,
  lineProgress: lineProgress, currentStation: currentStation,
  buildSession: buildSession, enqueueRepeat: enqueueRepeat, describeSession: describeSession,
  nextDue: nextDue
};
