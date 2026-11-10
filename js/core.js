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

if (typeof module !== 'undefined') module.exports = {
  BOX_DAYS: BOX_DAYS, BOX_WEIGHT: BOX_WEIGHT, todayYmd: todayYmd, addDays: addDays,
  emptyState: emptyState, validState: validState, itemIds: itemIds, getQuestion: getQuestion,
  reviewItem: reviewItem, stationProgress: stationProgress, isVisited: isVisited,
  lineProgress: lineProgress, currentStation: currentStation
};
