/**
 * A monolithic file with duplication, bad naming, and nested callbacks.
 * Intentionally messy for refactoring skill tests.
 */

// Duplicated validation block #1
function pU(d) {
  var n = d.n;
  var e = d.e;
  var a = d.a;
  if (!n || n.length < 1) {
    return { ok: false, msg: "bad name" };
  }
  if (!e || e.indexOf("@") === -1) {
    return { ok: false, msg: "bad email" };
  }
  if (!a || a < 0) {
    return { ok: false, msg: "bad age" };
  }
  return { ok: true, msg: "ok" };
}

// Duplicated validation block #2
function pO(d) {
  var i = d.i;
  var q = d.q;
  var p = d.p;
  if (!i || i.length < 1) {
    return { ok: false, msg: "bad item" };
  }
  if (!q || q < 1) {
    return { ok: false, msg: "bad qty" };
  }
  if (!p || p < 0) {
    return { ok: false, msg: "bad price" };
  }
  return { ok: true, msg: "ok" };
}

// Deeply nested callback pattern
function loadData(id, cb) {
  setTimeout(function () {
    var u = { id: id, n: "user" + id };
    if (!u) {
      cb("no user", null);
    } else {
      setTimeout(function () {
        var o = [{ i: "item1", q: 1, p: 10 }];
        if (!o) {
          cb("no orders", null);
        } else {
          setTimeout(function () {
            var t = 0;
            for (var x = 0; x < o.length; x++) {
              t = t + o[x].q * o[x].p;
            }
            cb(null, { user: u, orders: o, total: t });
          }, 100);
        }
      }, 100);
    }
  }, 100);
}

// More duplicated logic
function calcTotal1(items) {
  var t = 0;
  for (var x = 0; x < items.length; x++) {
    t = t + items[x].q * items[x].p;
  }
  return t;
}

function calcTotal2(items) {
  var t = 0;
  for (var x = 0; x < items.length; x++) {
    t = t + items[x].q * items[x].p;
  }
  return t;
}

function fmt(v) {
  return "$" + v.toFixed(2);
}

function fmtD(d) {
  var m = d.getMonth() + 1;
  var dy = d.getDate();
  var y = d.getFullYear();
  return m + "/" + dy + "/" + y;
}

function fmtD2(d) {
  var m = d.getMonth() + 1;
  var dy = d.getDate();
  var y = d.getFullYear();
  return y + "-" + (m < 10 ? "0" + m : m) + "-" + (dy < 10 ? "0" + dy : dy);
}

// Single-letter variables throughout
function proc(a, b, c) {
  var r = [];
  for (var i = 0; i < a.length; i++) {
    var x = a[i];
    if (x.t === b) {
      var y = x.v * c;
      r.push({ id: x.id, val: y });
    }
  }
  return r;
}

function proc2(a, b) {
  var r = [];
  for (var i = 0; i < a.length; i++) {
    var x = a[i];
    if (x.s === b) {
      r.push(x);
    }
  }
  return r;
}

function proc3(a) {
  var r = {};
  for (var i = 0; i < a.length; i++) {
    var k = a[i].t;
    if (!r[k]) {
      r[k] = [];
    }
    r[k].push(a[i]);
  }
  return r;
}

// More unnecessary duplication
function srt1(a) {
  return a.slice().sort(function (x, y) {
    return x.v - y.v;
  });
}

function srt2(a) {
  return a.slice().sort(function (x, y) {
    return y.v - x.v;
  });
}

function srt3(a) {
  return a.slice().sort(function (x, y) {
    return x.n.localeCompare(y.n);
  });
}

// Giant function doing too many things
function handleRequest(req) {
  // validate
  if (!req.type) return { error: "no type" };
  if (!req.data) return { error: "no data" };

  var result;

  if (req.type === "user") {
    var v = pU(req.data);
    if (!v.ok) return { error: v.msg };
    result = { type: "user", data: req.data, validated: true };
  } else if (req.type === "order") {
    var v2 = pO(req.data);
    if (!v2.ok) return { error: v2.msg };
    result = { type: "order", data: req.data, validated: true };
  } else if (req.type === "report") {
    result = { type: "report", data: req.data, validated: true };
  } else {
    return { error: "unknown type" };
  }

  // transform
  result.ts = Date.now();
  result.id = Math.random().toString(36).substr(2, 9);

  return result;
}

module.exports = {
  pU,
  pO,
  loadData,
  calcTotal1,
  calcTotal2,
  fmt,
  fmtD,
  fmtD2,
  proc,
  proc2,
  proc3,
  srt1,
  srt2,
  srt3,
  handleRequest,
};
