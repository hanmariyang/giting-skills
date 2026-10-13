// 화면 전환 40 — 캔버스 그리기 함수 묶음 (의존성 0)
// 갤러리 데모(demos/m8-screen-transition.html)와 홍보 영상(render.html)이 같은 함수를 쓴다.
// 정본은 이 파일 하나. 데모를 고치려면 여기를 고치고 `node tools/transitions/gen.mjs` → `node build.mjs`.
//
// TR[id](c, w, h, p, A, B, k)
//   c: 2D 컨텍스트 (0,0 ~ w,h 가 칸)   p: 0→1 진행
//   A(), B(): 지금 클립 안에 장면 A·B 를 그린다
//   k: { acc, deep, paper, ink, n }  n = 몇 번째 반복인지(원 와이프 위치 바꾸기용)

/*@helpers*/
var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
var io = function (t) { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
var eo = function (t) { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
var ei = function (t) { t = clamp(t); return t * t * t; };
var back = function (t) { t = clamp(t); var s = 1.9; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
var hash = function (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
var fillWith = function (c, path, draw) { c.save(); c.beginPath(); path(); c.clip(); draw(); c.restore(); };
var solid = function (c, w, h, col) { return function () { c.fillStyle = col; c.fillRect(0, 0, w, h); }; };
var poly = function (c, pts) { c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
var scene = function (c, w, h, bg, fg, ch) {
  return function () {
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '800 ' + Math.round(h * .42) + 'px -apple-system,system-ui,sans-serif';
    c.fillText(ch, w / 2, h / 2 + h * .03);
  };
};
/*@end*/

var TR = {};

// ── SWEEP · 색면이 가로지른다 ──────────────────────────────
TR['color-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var L = [solid(c, w, h, k.deep), solid(c, w, h, k.paper), B];
  for (var i = 0; i < 3; i++) {
    var q = io((p - i * .14) / .72);
    if (q > 0) fillWith(c, function () { c.rect(0, 0, w * q, h); }, L[i]);
  }
};
TR['diagonal-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var sl = h * .55, X = -sl + (w + sl * 2) * io(p);
  fillWith(c, function () { poly(c, [[-w, 0], [X + sl / 2, 0], [X - sl / 2, h], [-w, h]]); }, B);
  c.save(); c.strokeStyle = k.ink; c.lineWidth = Math.max(3, h * .05);
  [h * .1, h * .26].forEach(function (o) { c.beginPath(); c.moveTo(X + sl / 2 + o, 0); c.lineTo(X - sl / 2 + o, h); c.stroke(); });
  c.restore();
};
TR['multi-stripe-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var n = 6, bh = h / n;
  fillWith(c, function () {
    for (var i = 0; i < n; i++) {
      var q = io(p * 1.6 - i * .12);
      if (i % 2) c.rect(w - w * q, i * bh - .5, w * q, bh + 1); else c.rect(0, i * bh - .5, w * q, bh + 1);
    }
  }, B);
};
TR['zigzag-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var a = h * .14, n = 6;
  var edge = function (q) {
    var X = -a + (w + a * 2) * q;
    var pts = [[-1, 0], [X, 0]];
    for (var j = 1; j <= n; j++) pts.push([X + (j % 2 ? a : 0), h * j / n]);
    pts.push([-1, h]);
    return pts;
  };
  fillWith(c, function () { poly(c, edge(io(p * 1.25))); }, solid(c, w, h, k.paper));
  fillWith(c, function () { poly(c, edge(io(p * 1.25 - .25))); }, B);
};
TR['slice-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var sk = .45, n = 5, U = w + sk * h, bw = U / n;
  fillWith(c, function () {
    for (var i = 0; i < n; i++) {
      var q = io(p * 1.5 - i * .1), y0, y1, u = i * bw;
      if (i % 2) { y0 = h - q * h; y1 = h; } else { y0 = 0; y1 = q * h; }
      if (q <= 0) continue;
      poly(c, [[u - sk * y0, y0], [u + bw + 1 - sk * y0, y0], [u + bw + 1 - sk * y1, y1], [u - sk * y1, y1]]);
    }
  }, B);
};
TR['bars-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var n = 9, bw = w / n;
  fillWith(c, function () {
    for (var i = 0; i < n; i++) {
      var q = eo(p * 1.5 - hash(i) * .5);
      c.rect(i * bw - .5, h / 2 - q * h / 2, bw + 1, q * h);
    }
  }, B);
};
TR['brush-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var n = 4, bh = h / n;
  fillWith(c, function () {
    for (var i = 0; i < n; i++) {
      var q = io(p * n * .8 - i * .6);
      if (q <= 0) continue;
      var len = (w + bh) * q, y = i * bh - bh * .15, hh = bh * 1.3;
      if (i % 2) c.roundRect(w - len, y, len + bh, hh, hh / 2); else c.roundRect(-bh, y, len + bh, hh, hh / 2);
    }
  }, B);
};
TR['curtain-slide'] = function (c, w, h, p, A, B, k) {
  A();
  var q = back(io(p) * 1.05);
  fillWith(c, function () { c.rect(0, 0, w / 2 * q, h); c.rect(w - w / 2 * q, 0, w / 2 * q, h); }, B);
  if (q < 1) {
    c.save(); c.fillStyle = k.ink; c.globalAlpha = .35;
    c.fillRect(w / 2 * q - 3, 0, 3, h); c.fillRect(w - w / 2 * q, 0, 3, h); c.restore();
  }
};

// ── SHAPE · 모양이 퍼지며 덮는다 ───────────────────────────
TR['circle-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var spots = [[.24, .7], [.76, .3], [.62, .78], [.3, .24]], s = spots[(k.n || 0) % 4];
  var cx = s[0] * w, cy = s[1] * h, R = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
  fillWith(c, function () { c.arc(cx, cy, R * io(p), 0, Math.PI * 2); }, B);
};
TR['block-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var cols = 10, rows = 4, cw = w / cols, ch = h / rows, q = clamp(p * 1.15);
  fillWith(c, function () {
    for (var i = 0; i < cols * rows; i++) if (q > hash(i + 3) * .92) c.rect((i % cols) * cw - .5, Math.floor(i / cols) * ch - .5, cw + 1, ch + 1);
  }, B);
};
TR['shutter-wipe'] = function (c, w, h, p, A, B, k) {
  B();
  var q = io(p), R = Math.hypot(w, h) * .62 * (1 - q), rot = q * Math.PI / 3, cx = w / 2, cy = h / 2, pts = [];
  for (var j = 0; j < 6; j++) pts.push([cx + R * Math.cos(rot + j * Math.PI / 3), cy + R * Math.sin(rot + j * Math.PI / 3)]);
  if (R > .5) fillWith(c, function () { poly(c, pts); }, A);
  c.save(); c.strokeStyle = k.ink; c.globalAlpha = .45; c.lineWidth = 2;
  for (var j2 = 0; j2 < 6; j2++) {
    var a = pts[j2], b = pts[(j2 + 1) % 6], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0] - dx / L * w, a[1] - dy / L * w); c.stroke();
  }
  c.restore();
};
TR['clock-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var q = io(p), cx = w / 2, cy = h / 2, R = Math.hypot(w, h);
  if (q > 0) fillWith(c, function () { c.moveTo(cx, cy); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + q * Math.PI * 2); c.closePath(); }, B);
};
TR['diamond-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var g = h / 3.2, cx = w / 2, cy = h / 2, D = Math.hypot(cx, cy);
  fillWith(c, function () {
    for (var x = -g; x <= w + g; x += g) for (var y = -g; y <= h + g; y += g) {
      var d = Math.hypot(x - cx, y - cy) / D, s = eo(p * 1.9 - d * .9) * g * 1.02;
      if (s > 0) poly(c, [[x, y - s], [x + s, y], [x, y + s], [x - s, y]]);
    }
  }, B);
};
TR['star-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var q = ei(p) * .4 + io(p) * .6, R = Math.hypot(w, h) * 1.15 * q, r = R * .45, rot = q * Math.PI * .9 - Math.PI / 2, pts = [];
  for (var j = 0; j < 10; j++) { var rr = j % 2 ? r : R, a = rot + j * Math.PI / 5; pts.push([w / 2 + rr * Math.cos(a), h / 2 + rr * Math.sin(a)]); }
  if (R > .5) fillWith(c, function () { poly(c, pts); }, B);
};
TR['pinwheel-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var n = 6, q = io(p), cx = w / 2, cy = h / 2, R = Math.hypot(w, h), off = q * .6;
  if (q > 0) fillWith(c, function () {
    for (var j = 0; j < n; j++) { var a = off + j * Math.PI * 2 / n; c.moveTo(cx, cy); c.arc(cx, cy, R, a, a + q * Math.PI * 2 / n + .01); c.closePath(); }
  }, B);
};
TR['corner-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  // 귀퉁이마다 따로 칠한다. 한 경로에 넣으면 감는 방향이 반대인 삼각형이 겹친 곳에서 서로 지운다
  [[0, 0, 1, 1], [w, 0, -1, 1], [w, h, -1, -1], [0, h, 1, -1]].forEach(function (o, i) {
    var q = io(p * 1.3 - i * .1), lx = w * 1.02 * q * o[2], ly = h * 1.02 * q * o[3];
    if (q > 0) fillWith(c, function () { poly(c, [[o[0], o[1]], [o[0] + lx, o[1]], [o[0], o[1] + ly]]); }, B);
  });
};

// ── FLUID & IMPACT · 액체·파문·충격 ───────────────────────
TR['liquid-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var surf = function (q, ph) {
    return function () {
      var Y = h + h * .18 - (h * 1.4) * q, amp = h * .08 * (1 - q * .6);
      c.moveTo(0, h + 2);
      for (var x = 0; x <= w; x += 6) c.lineTo(x, Y + amp * Math.sin(x / w * Math.PI * 3 + ph));
      c.lineTo(w, h + 2); c.closePath();
    };
  };
  fillWith(c, surf(io(p * 1.2), p * 9), solid(c, w, h, k.deep));
  fillWith(c, surf(io(p * 1.2 - .18), p * 9 + 1.6), B);
};
TR['drip-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var n = 5, cw = w / n, q = io(p);
  fillWith(c, function () {
    c.rect(0, 0, w, h * .2 * q);
    for (var i = 0; i < n; i++) {
      var L = clamp(q * 1.45 - hash(i + 7) * .4) * h * 1.25, dw = cw * (.62 + .38 * q) + 1, x = i * cw + (cw - dw) / 2;
      if (L > 0) c.roundRect(x, -dw, dw, L + dw, [0, 0, dw / 2, dw / 2]);
    }
  }, B);
};
TR['ripple-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var R = Math.hypot(w, h) / 2 * 1.05, cx = w / 2, cy = h / 2, e = eo(p);
  c.save(); c.strokeStyle = k.acc;
  for (var j = 0; j < 3; j++) {
    var r = R * (e * 1.25 - j * .18);
    if (r <= 0) continue;
    c.globalAlpha = (1 - j * .28) * (1 - clamp((p - .7) / .3)); c.lineWidth = h * (.06 - j * .015);
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
  }
  c.restore();
  var rf = R * io((p - .3) / .7);
  if (rf > 0) fillWith(c, function () { c.arc(cx, cy, rf, 0, Math.PI * 2); }, B);
};
TR['text-wipe'] = function (c, w, h, p, A, B, k) {
  A();
  var s = .35 + Math.pow(io(p), 3) * 14;
  c.save(); c.translate(w * .505, h / 2); c.scale(s, s);
  c.fillStyle = k.acc; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '900 ' + Math.round(h * .5) + 'px -apple-system,system-ui,sans-serif';
  c.fillText('WIPE', 0, 0); c.restore();
  var f = clamp((p - .78) / .16);
  if (f > 0) { c.save(); c.globalAlpha = f; B(); c.restore(); }
};
TR['impact-flash'] = function (c, w, h, p, A, B, k) {
  (p < .5 ? A : B)();
  var R = Math.hypot(w, h) * .7, r = R * eo((p - .45) / .45);
  if (r > 0 && p < .95) { c.save(); c.strokeStyle = k.paper; c.globalAlpha = 1 - clamp((p - .45) / .5); c.lineWidth = h * .08 * (1 - clamp((p - .45) / .5)) + 1; c.beginPath(); c.arc(w / 2, h / 2, r, 0, Math.PI * 2); c.stroke(); c.restore(); }
  var fl = 1 - clamp(Math.abs(p - .5) / .14);
  if (fl > 0) { c.save(); c.globalAlpha = fl; c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.restore(); }
};
TR['wave-split'] = function (c, w, h, p, A, B, k) {
  A();
  var a = h * .12, Y = -a + (h + a * 2) * io(p);
  fillWith(c, function () {
    c.moveTo(0, -2);
    for (var x = 0; x <= w; x += 6) c.lineTo(x, Y + a * Math.sin(x / w * Math.PI * 2 + p * 5));
    c.lineTo(w, -2); c.closePath();
  }, B);
};
TR['zigzag-split'] = function (c, w, h, p, A, B, k) {
  A();
  var a = h * .09, Y = -a + (h + a * 2) * io(p), per = w / 7, sh = p * per * 3;
  fillWith(c, function () {
    c.moveTo(-per, -2);
    for (var x = -per * 2; x <= w + per; x += per / 2) { var t = Math.round((x + sh) / (per / 2)); c.lineTo(x + (sh % (per / 2)), Y + (t % 2 ? a : -a)); }
    c.lineTo(w + per, -2); c.closePath();
  }, B);
};
TR['circle-split'] = function (c, w, h, p, A, B, k) {
  A();
  var R = Math.hypot(w, h) / 2 + 2, r = R * io(p * 1.1), rot = io(p) * Math.PI, g = r * .22 * (1 - io(p));
  if (r <= 0) return;
  fillWith(c, function () {
    c.save(); c.translate(w / 2, h / 2); c.rotate(rot);
    c.moveTo(r, -g); c.arc(0, -g, r, 0, Math.PI, true); c.closePath();
    c.moveTo(-r, g); c.arc(0, g, r, Math.PI, 0, true); c.closePath();
    c.restore();
  }, B);
};

// ── PANEL · 판이 바뀐다 ──────────────────────────────────
TR['horizontal-split'] = function (c, w, h, p, A, B, k) {
  A();
  var q = io(p);
  fillWith(c, function () { c.rect(0, 0, w * q, h / 2 + .5); c.rect(w - w * q, h / 2 - .5, w * q, h / 2 + .5); }, B);
};
TR['vertical-split'] = function (c, w, h, p, A, B, k) {
  A();
  var q = back(io(p));
  fillWith(c, function () { c.rect(0, 0, w / 2 + .5, h * q); c.rect(w / 2 - .5, h - h * q, w / 2 + .5, h * q); }, B);
};
TR['triple-split'] = function (c, w, h, p, A, B, k) {
  A();
  var sk = .35, U = w + sk * h, bw = U / 3;
  fillWith(c, function () {
    for (var i = 0; i < 3; i++) {
      var q = io(p * 1.7 - i * .35), y1 = q * h, u = i * bw;
      if (q > 0) poly(c, [[u, 0], [u + bw + 1, 0], [u + bw + 1 - sk * y1, y1], [u - sk * y1, y1]]);
    }
  }, B);
};
TR['four-panel'] = function (c, w, h, p, A, B, k) {
  A();
  var order = [[0, 0], [1, 0], [1, 1], [0, 1]], qw = w / 2, qh = h / 2;
  fillWith(c, function () {
    order.forEach(function (o, i) {
      var q = io(p * 2 - i * .33), ww = qw * q;
      if (q > 0) c.rect(o[0] * qw + (qw - ww) / 2 - .5, o[1] * qh - .5, ww + 1, qh + 1);
    });
  }, B);
};
TR['sliding-panels'] = function (c, w, h, p, A, B, k) {
  A();
  var n = 4, pw = w / n;
  for (var i = 0; i < n; i++) {
    var q = eo(p * 1.8 - i * .25), off = (1 - q) * h;
    if (q <= 0) continue;
    (function (i, off) {
      fillWith(c, function () { c.rect(i * pw - .5, off, pw + 1, h); }, function () { c.save(); c.translate(0, off); B(); c.restore(); });
    })(i, off);
  }
};
TR['diagonal-panels'] = function (c, w, h, p, A, B, k) {
  A();
  var sk = .6, n = 4, U = w + sk * h, bw = U / n;
  fillWith(c, function () {
    for (var i = 0; i < n; i++) {
      var q = eo(p * 1.7 - i * .22), sh = (1 - q) * U, u = i * bw + sh;
      if (q > 0) poly(c, [[u, 0], [u + bw + 1, 0], [u + bw + 1 - sk * h, h], [u - sk * h, h]]);
    }
  }, B);
};
TR['quad-open'] = function (c, w, h, p, A, B, k) {
  B();
  var q = io(p), dx = w / 2 * q, dy = h / 2 * q;
  [[0, 0, -1, -1], [1, 0, 1, -1], [0, 1, -1, 1], [1, 1, 1, 1]].forEach(function (o) {
    var ox = o[2] * dx, oy = o[3] * dy;
    fillWith(c, function () { c.rect(o[0] * w / 2 + ox, o[1] * h / 2 + oy, w / 2, h / 2); }, function () { c.save(); c.translate(ox, oy); A(); c.restore(); });
  });
};
TR['checker-panels'] = function (c, w, h, p, A, B, k) {
  A();
  var cols = 10, rows = 4, cw = w / cols, ch = h / rows;
  fillWith(c, function () {
    for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
      var q = io(p * 2.1 - i / cols - ((i + j) % 2) * .18), ww = cw * q;
      if (q > 0) c.rect(i * cw + (cw - ww) / 2 - .5, j * ch - .5, ww + 1, ch + 1);
    }
  }, B);
};

// ── MOSAIC · 나누고 모자이크로 ────────────────────────────
TR['diagonal-split'] = function (c, w, h, p, A, B, k) {
  A();
  var q = io(p), X = -w * .6 + w * 2.2 * q, th = (60 + 60 * q) * Math.PI / 180, L = w + h;
  var dx = Math.cos(th) * L, dy = Math.sin(th) * L;
  fillWith(c, function () { poly(c, [[X - dx, h / 2 - dy], [X + dx, h / 2 + dy], [-L * 2, h / 2 + dy], [-L * 2, h / 2 - dy]]); }, B);
};
TR['mosaic-flash'] = function (c, w, h, p, A, B, k) {
  var steps = 6, s = Math.min(steps, Math.floor(p * (steps + 1))), cols = 4, rows = 3, cw = w / cols, ch = h / rows;
  if (s >= steps) { B(); return; }
  if (s === 0) { A(); return; }
  var pal = [A, B, solid(c, w, h, k.deep), solid(c, w, h, k.paper)];
  for (var i = 0; i < cols * rows; i++) {
    var v = hash(i * 13 + s * 7), f = v < s / steps ? 1 : Math.floor(hash(i + s * 31) * 4);
    (function (i, f) { fillWith(c, function () { c.rect((i % cols) * cw - .5, Math.floor(i / cols) * ch - .5, cw + 1, ch + 1); }, pal[f]); })(i, f);
  }
};
TR['frame-stack'] = function (c, w, h, p, A, B, k) {
  A();
  var q = function (i) { return io(p * 1.5 - i * .14); };
  fillWith(c, function () {
    c.rect(0, 0, w, h / 2 * q(0) + .5);
    c.rect(w - w / 2 * q(1) - .5, 0, w / 2 * q(1) + .5, h);
    c.rect(0, h - h / 2 * q(2) - .5, w, h / 2 * q(2) + .5);
    c.rect(0, 0, w / 2 * q(3) + .5, h);
  }, B);
};
TR['bar-panels'] = function (c, w, h, p, A, B, k) {
  A();
  var n = 11, bw = w / n;
  fillWith(c, function () {
    for (var i = 0; i < n; i++) {
      var base = eo(p * 1.45 - hash(i + 2) * .45), wob = Math.sin(p * 22 + i * 1.7) * .14 * (1 - base) * (base > 0 ? 1 : 0);
      var hh = clamp(base + wob) * h;
      c.rect(i * bw - .5, h - hh, bw + 1, hh);
    }
  }, B);
};
TR['band-split'] = function (c, w, h, p, A, B, k) {
  A();
  var sp = [1.5, 1.05, 1.3, .95, 1.2], n = sp.length, bh = h / n;
  fillWith(c, function () { for (var i = 0; i < n; i++) { var q = io(p * sp[i] * 1.1); c.rect(0, i * bh - .5, w * q, bh + 1); } }, B);
};
TR['grid-flip'] = function (c, w, h, p, A, B, k) {
  c.fillStyle = k.ink; c.fillRect(0, 0, w, h);
  var n = 3, cw = w / n, ch = h / n;
  for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
    var q = io(p * 1.7 - (i + j) * .12), ang = q * Math.PI, sx = Math.abs(Math.cos(ang)), cx = i * cw + cw / 2;
    (function (i, j, sx, cx, ang) {
      c.save(); c.translate(cx, 0); c.scale(Math.max(sx, .001), 1); c.translate(-cx, 0);
      c.beginPath(); c.rect(i * cw + 1, j * ch + 1, cw - 2, ch - 2); c.clip();
      (ang < Math.PI / 2 ? A : B)(); c.restore();
    })(i, j, sx, cx, ang);
  }
};
TR['panel-zoom-out'] = function (c, w, h, p, A, B, k) {
  A();
  var L = [solid(c, w, h, k.deep), solid(c, w, h, k.paper), B];
  for (var i = 0; i < 3; i++) {
    var q = io(p * 1.55 - i * .25), ww = w * q, hh = h * q;
    if (q > 0) fillWith(c, function () { c.rect((w - ww) / 2, (h - hh) / 2, ww, hh); }, L[i]);
  }
};
TR['strip-shuffle'] = function (c, w, h, p, A, B, k) {
  A();
  var n = 8, sw = w / n, ord = [3, 6, 0, 5, 2, 7, 1, 4];
  for (var i = 0; i < n; i++) {
    var q = io(p * 1.9 - ord[i] * .11), off = (1 - q) * h * (i % 2 ? 1 : -1);
    if (q <= 0) continue;
    (function (i, off) { fillWith(c, function () { c.rect(i * sw - .5, off, sw + 1, h); }, function () { c.save(); c.translate(0, off); B(); c.restore(); }); })(i, off);
  }
};

if (typeof module !== 'undefined') module.exports = { TR: TR };
