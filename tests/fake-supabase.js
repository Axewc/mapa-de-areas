// Cliente supabase-js falso, en memoria, para la prueba de flujo (tests/e2e.cjs).
// Reemplaza el script UMD de jsdelivr. Estado inicial en window.__seed; flags:
//   window.__fakeAdmin  → la cuenta aparece en mapa_admins y ve todas las filas
//   window.__failInsert → los insert devuelven error
//   window.__failDelete → los delete devuelven error
//   window.__seed.session → sesión iniciada al cargar (si no, desconectado)
//   window.__fakeLogin() → inicia sesión y avisa SIGNED_IN a los listeners
//   window.__failSync   → el select de mapa_progreso devuelve error
//   window.__slowSync   → ms de espera antes de responder un select o upsert de mapa_progreso
(function () {
  var seed = window.__seed || {};
  var USER = { id: 'u1', email: 'alumno@test.mx' };
  window.__db = {
    mapa_respuestas: seed.mapa_respuestas || [],
    mapa_progreso: seed.mapa_progreso || []
  };
  var session = seed.session ? { user: USER } : null;
  var listeners = [];
  window.__fakeLogin = function () {
    session = { user: USER };
    listeners.forEach(function (fn) { fn('SIGNED_IN', session); });
  };
  var clock = Date.parse('2026-11-10T12:00:00Z');
  var nextId = 1;
  var copy = function (x) { return JSON.parse(JSON.stringify(x)); };

  function Query(table) { this.table = table; this.op = 'select'; this.filters = []; this.ord = null; this.lim = null; this.payload = null; }
  Query.prototype.select = function () { return this; };
  Query.prototype.insert = function (obj) { this.op = 'insert'; this.payload = obj; return this; };
  Query.prototype.upsert = function (obj, opts) { this.op = 'upsert'; this.payload = obj; this.conflict = (opts && opts.onConflict) || 'id'; return this; };
  Query.prototype.update = function (obj) { this.op = 'update'; this.payload = obj; return this; };
  Query.prototype.delete = function () { this.op = 'delete'; return this; };
  Query.prototype.eq = function (c, v) { this.filters.push([c, v]); return this; };
  Query.prototype.order = function (c, o) { this.ord = [c, !(o && o.ascending === false)]; return this; };
  Query.prototype.limit = function (n) { this.lim = n; return this; };
  Query.prototype.run = function () {
    var self = this;
    if (this.table === 'mapa_admins') return { data: window.__fakeAdmin ? [{ email: USER.email }] : [], error: null };
    var rows = window.__db[this.table] || (window.__db[this.table] = []);
    var match = function (r) { return self.filters.every(function (f) { return r[f[0]] === f[1]; }); };
    if (this.op === 'insert') {
      if (window.__failInsert) return { data: null, error: { message: 'sin sesión' } };
      clock += 1000;
      rows.push(Object.assign({ id: 'r' + nextId++, user_id: USER.id, email: USER.email, created_at: new Date(clock).toISOString() }, copy(this.payload)));
      return { data: null, error: null };
    }
    if (this.op === 'upsert') {
      if (window.__failInsert) return { data: null, error: { message: 'sin sesión' } };
      var key = this.conflict, pl = copy(this.payload);
      var idx = -1;
      rows.forEach(function (r, i) { if (r[key] === pl[key]) idx = i; });
      clock += 1000;
      var row = Object.assign({ id: 'r' + nextId++, email: USER.email, created_at: new Date(clock).toISOString() }, pl);
      if (idx >= 0) { row.id = rows[idx].id; row.created_at = rows[idx].created_at; rows[idx] = row; } else rows.push(row);
      return { data: null, error: null };
    }
    if (this.op === 'update') {
      if (window.__failInsert) return { data: null, error: { message: 'sin sesión' } };
      var pl2 = this.payload;
      rows.forEach(function (r) { if (match(r) && r.user_id === USER.id) Object.assign(r, copy(pl2)); });
      return { data: null, error: null };
    }
    if (this.op === 'delete') {
      if (window.__failDelete) return { data: null, error: { message: 'sin permiso' } };
      window.__db[this.table] = rows.filter(function (r) { return !(match(r) && r.user_id === USER.id); });
      return { data: null, error: null };
    }
    if (this.table === 'mapa_progreso' && window.__failSync) return { data: null, error: { message: 'sin red' } };
    // RLS: cada quien ve lo suyo; la cuenta docente ve todo.
    var out = rows.filter(function (r) { return match(r) && (window.__fakeAdmin || r.user_id === USER.id); }).map(copy);
    if (this.ord) {
      var c = this.ord[0], asc = this.ord[1];
      out.sort(function (a, b) { return (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (asc ? 1 : -1); });
    }
    if (this.lim) out = out.slice(0, this.lim);
    return { data: out, error: null };
  };
  Query.prototype.then = function (resolve, reject) {
    var self = this;
    var wait = this.table === 'mapa_progreso' && this.op !== 'delete' ? (window.__slowSync || 0) : 0;
    if (!wait) return Promise.resolve(this.run()).then(resolve, reject);
    return new Promise(function (res) { setTimeout(function () { res(self.run()); }, wait); }).then(resolve, reject);
  };

  window.supabase = {
    createClient: function () {
      return {
        auth: {
          getSession: function () { return Promise.resolve({ data: { session: session }, error: null }); },
          onAuthStateChange: function (fn) { listeners.push(fn); return { data: { subscription: { unsubscribe: function () {} } } }; },
          signOut: function () { session = null; listeners.forEach(function (fn) { fn('SIGNED_OUT', null); }); return Promise.resolve({ error: null }); },
          signInWithOtp: function () { return Promise.resolve({ error: null }); }
        },
        from: function (t) { return new Query(t); }
      };
    }
  };
})();
