// 배경 40 — 캔버스 그리기 함수 묶음 (의존성 0)
// 갤러리 데모(demos/m9-background.html)와 홍보 영상(render.mjs)이 같은 함수를 쓴다.
// 정본은 이 파일 하나. 데모를 고치려면 여기를 고치고 `node tools/backgrounds/gen.mjs` → `node build.mjs`.
//
// BG[id](c, w, h, t, k)
//   c: 2D 컨텍스트 (0,0 ~ w,h 가 칸)   t: 초. 모든 움직임은 8초에 한 바퀴 돌아 처음과 이어진다
//   k: { acc, deep, paper, ink }
// 크기는 전부 h 에 비례한다. 칸이 커져도 무늬 밀도가 같다.

/*@helpers*/
var TAU = Math.PI * 2;
var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
var io = function (t) { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
var eo = function (t) { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
var back = function (t) { t = clamp(t); var s = 1.9; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
var frac = function (v) { return v - Math.floor(v); };
var hash = function (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
var W8 = function (t, n) { return TAU * (n || 1) * t / 8; };
var fill = function (c, col) { c.fillStyle = col; };
var dot = function (c, x, y, r) { if (r > .3) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } };
var bgc = function (c, w, h, col) { c.fillStyle = col; c.fillRect(0, 0, w, h); };
var lerpC = function (a, b, t) { return '#' + [1, 3, 5].map(function (i) { return Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0'); }).join(''); };
var ngon = function (c, x, y, r, n, rot) { c.beginPath(); for (var i = 0; i < n; i++) { var a = rot + i * TAU / n; if (i) c.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); else c.moveTo(x + r * Math.cos(a), y + r * Math.sin(a)); } c.closePath(); };
/*@end*/

var BG = {};

// ── DOTS · 점으로 질감 ─────────────────────────────────────
BG['halftone-pulse'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var s = h / 8, cx = w / 2, cy = h / 2, D = Math.hypot(w, h) / 2;
  for (var y = s / 2; y < h; y += s) for (var x = s / 2; x < w + s; x += s) {
    var d = Math.hypot(x - cx, y - cy) / D, q = clamp(.5 + .5 * Math.sin(W8(t, 2) - d * 7));
    fill(c, q > .7 ? k.paper : k.acc); dot(c, x, y, s * .48 * q);
  }
};
BG['dot-wave'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var s = h / 7;
  for (var y = s / 2; y < h; y += s) for (var x = s / 2; x < w + s; x += s) {
    var q = .5 + .5 * Math.sin(W8(t, 2) - x / w * 5 + y / h * 2);
    fill(c, k.paper); dot(c, x, y, s * .44 * q);
    fill(c, k.ink); dot(c, x + s / 2, y + s / 2, s * .3 * (1 - q));
  }
};
BG['halftone-gradient'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var s = h / 9, span = w + h * 1.6, pos = -h * .8 + span * frac(t / 4);
  for (var y = s / 2; y < h; y += s) for (var x = s / 2; x < w + s; x += s) {
    var u = x + (y - h / 2) * .6, q = clamp(1 - Math.abs(u - pos) / (h * 1.1));
    fill(c, k.acc); dot(c, x, y, s * (.08 + .4 * q));
  }
};
BG['polka-drift'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var s = h / 3, o = frac(t / 4) * s;
  for (var y = -s; y < h + s; y += s) for (var x = -s; x < w + s; x += s) {
    fill(c, k.acc); dot(c, x + o, y + o, s * .26);
    fill(c, k.ink); dot(c, x + o + s / 2, y + o + s / 2, s * .1);
  }
};
BG['dot-spiral'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var cx = w / 2, cy = h / 2, n = 720, sc = h * .034, rot = W8(t);
  for (var i = 1; i < n; i++) {
    var a = i * 2.39996 + rot, r = sc * Math.sqrt(i) * (1 + .05 * Math.sin(W8(t, 2) - i * .06));
    var x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    if (x < -10 || x > w + 10) continue;
    fill(c, i % 3 ? k.paper : k.acc); dot(c, x, y, h * (.01 + .02 * Math.sqrt(i / n)));
  }
};
BG['dot-matrix'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var s = h / 10, cols = Math.ceil(w / s);
  for (var i = 0; i < cols; i++) {
    var lv = .45 + .3 * Math.sin(i * .5 + W8(t, 3)) + .2 * Math.sin(i * 1.3 - W8(t, 5)), top = Math.round((1 - lv) * 10);
    for (var j = 0; j < 10; j++) {
      fill(c, j >= top ? (j === top ? k.paper : k.acc) : k.deep);
      dot(c, i * s + s / 2, j * s + s / 2, s * .36);
    }
  }
};
BG['dot-rings'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var cx = w / 2, cy = h / 2, gap = h * .085;
  for (var r = 1; r * gap < Math.hypot(w, h) / 2; r++) {
    var n = 7 * r, rot = (r % 2 ? 1 : -1) * (TAU / n) * 2 * t / 8;
    fill(c, r % 2 ? k.paper : k.ink);
    for (var i = 0; i < n; i++) { var a = rot + i * TAU / n; dot(c, cx + r * gap * Math.cos(a), cy + r * gap * Math.sin(a), h * .022); }
  }
};
BG['comic-dots'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var s = h / 8, ox = s * .22 * Math.sin(W8(t)), oy = s * .18 * Math.cos(W8(t));
  for (var y = s / 2; y < h + s; y += s) for (var x = s / 2; x < w + s; x += s) {
    var q = clamp(1 - x / w * .9 + .15 * Math.sin(W8(t) + y / h * 3));
    fill(c, k.acc); dot(c, x + ox, y + oy, s * .45 * q);
    fill(c, k.ink); dot(c, x, y, s * .3 * q);
  }
};

// ── GRID · 칸으로 정돈 ─────────────────────────────────────
BG['perspective-grid'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var cx = w / 2, hz = h / 2, f = frac(t / 2);
  c.lineWidth = Math.max(1, h / 110);
  [1, -1].forEach(function (side) {
    c.strokeStyle = side > 0 ? k.acc : k.paper; c.globalAlpha = side > 0 ? 1 : .55;
    for (var i = -14; i <= 14; i++) { c.beginPath(); c.moveTo(cx, hz); c.lineTo(cx + i * w / 6, hz + side * h / 2); c.stroke(); }
    for (var j = 0; j < 9; j++) {
      var z = 9 - j - f, y = hz + side * (h / 2) / (z * .5 + .4) * .4;
      c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
    }
  });
  c.globalAlpha = 1;
};
BG['grid-zoom'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var z = Math.pow(2, frac(t / 2)), G = h / 4 * z, cx = w / 2, cy = h / 2;
  c.strokeStyle = k.ink;
  for (var pass = 0; pass < 2; pass++) {
    var sp = pass ? G / 2 : G;
    c.globalAlpha = pass ? z - 1 : 1; c.lineWidth = Math.max(1, h / 80) * (pass ? 1 : 1.4);
    for (var i = -Math.ceil(cx / sp) - 1; i <= Math.ceil(cx / sp) + 1; i++) { if (pass && i % 2 === 0) continue; c.beginPath(); c.moveTo(cx + i * sp, 0); c.lineTo(cx + i * sp, h); c.stroke(); }
    for (var j = -Math.ceil(cy / sp) - 1; j <= Math.ceil(cy / sp) + 1; j++) { if (pass && j % 2 === 0) continue; c.beginPath(); c.moveTo(0, cy + j * sp); c.lineTo(w, cy + j * sp); c.stroke(); }
  }
  c.globalAlpha = 1; fill(c, k.paper); c.fillRect(cx - h * .03, cy - h * .03, h * .06, h * .06);
};
BG['grid-wave'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var s = h / 7, A = h * .06;
  var P = function (x, y) { return [x + A * Math.sin(y / h * 5 + W8(t)), y + A * Math.sin(x / w * 7 + W8(t, 2))]; };
  c.lineWidth = Math.max(1, h / 90);
  for (var pass = 0; pass < 2; pass++) for (var a = -s; a < (pass ? h : w) + s; a += s) {
    c.strokeStyle = pass ? k.deep : k.acc; c.beginPath();
    for (var b = -s; b <= (pass ? w : h) + s; b += s / 4) { var p = pass ? P(b, a) : P(a, b); if (b === -s) c.moveTo(p[0], p[1]); else c.lineTo(p[0], p[1]); }
    c.stroke();
  }
};
BG['moire-grid'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var s = h / 7, R = Math.hypot(w, h);
  [[k.acc, 1], [k.paper, -1]].forEach(function (L) {
    c.save(); c.translate(w / 2, h / 2); c.rotate(L[1] * (TAU / 4) * t / 8);
    c.strokeStyle = L[0]; c.globalAlpha = .8; c.lineWidth = Math.max(1, h / 100);
    for (var i = -Math.ceil(R / s) * s; i <= R; i += s) { c.beginPath(); c.moveTo(i, -R); c.lineTo(i, R); c.stroke(); c.beginPath(); c.moveTo(-R, i); c.lineTo(R, i); c.stroke(); }
    c.restore();
  });
  c.globalAlpha = 1;
};
BG['isometric-grid'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var s = h / 4, dy = s * Math.tan(Math.PI / 6);
  c.strokeStyle = k.paper; c.globalAlpha = .22; c.lineWidth = Math.max(1, h / 130);
  for (var i = -20; i < 40; i++) {
    c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, h); c.stroke();
    c.beginPath(); c.moveTo(i * s - w, -w * dy / s + 0); c.lineTo(i * s + w, w * dy / s); c.stroke();
    c.beginPath(); c.moveTo(i * s - w, w * dy / s); c.lineTo(i * s + w, -w * dy / s); c.stroke();
  }
  c.globalAlpha = 1;
  var spots = [[.18, .62], [.42, .38], [.66, .7], [.86, .34], [.3, .9]];
  spots.forEach(function (p, j) {
    var up = eo(Math.max(0, Math.sin(W8(t) + j * 1.3))), x = p[0] * w, y = p[1] * h, e = s * .42, lift = up * s * .5;
    var top = y - lift - e * .55;
    c.fillStyle = k.acc; c.beginPath(); c.moveTo(x, top - e * .55); c.lineTo(x + e, top); c.lineTo(x, top + e * .55); c.lineTo(x - e, top); c.closePath(); c.fill();
    c.fillStyle = k.paper; c.beginPath(); c.moveTo(x - e, top); c.lineTo(x, top + e * .55); c.lineTo(x, y + e * .55 - lift + e * .2); c.lineTo(x - e, y - lift + e * .2); c.closePath(); c.fill();
    c.fillStyle = lerpC(k.paper, k.ink, .45); c.beginPath(); c.moveTo(x + e, top); c.lineTo(x, top + e * .55); c.lineTo(x, y + e * .55 - lift + e * .2); c.lineTo(x + e, y - lift + e * .2); c.closePath(); c.fill();
  });
};
BG['hex-grid'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.deep);
  var r = h / 6, hw = r * Math.sqrt(3);
  for (var row = -1; row * r * 1.5 < h + r; row++) for (var col = -1; col * hw < w + hw; col++) {
    var x = col * hw + (row % 2 ? hw / 2 : 0), y = row * r * 1.5;
    var q = .5 + .5 * Math.sin(W8(t, 2) - Math.hypot(x - w / 2, y - h / 2) / h * 3 + hash(row * 31 + col) * 2);
    c.fillStyle = lerpC(k.acc, k.paper, q * q * .7); ngon(c, x, y, r * .86, 6, Math.PI / 6); c.fill();
  }
};
BG['truchet-tiles'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var s = h / 3.2, i = 0;
  for (var y = 0; y < h; y += s) for (var x = 0; x < w; x += s, i++) {
    var st = hash(i * 3.7) * 4, ph = frac((t + st) / 4) * 4, turn = Math.floor((t + st) / 4) + (ph < .6 ? io(ph / .6) : 1);
    if ((Math.floor(x / s) + Math.floor(y / s)) % 2) { c.fillStyle = lerpC(k.paper, k.acc, .14); c.fillRect(x, y, s, s); }
    c.save(); c.translate(x + s / 2, y + s / 2); c.rotate((hash(i) > .5 ? 1 : 0) * Math.PI / 2 + turn * Math.PI / 2);
    c.strokeStyle = (i % 3) ? k.ink : k.acc; c.lineWidth = s * .11; c.lineCap = 'round';
    c.beginPath(); c.arc(-s / 2, -s / 2, s / 2, 0, Math.PI / 2); c.stroke();
    c.beginPath(); c.arc(s / 2, s / 2, s / 2, Math.PI, Math.PI * 1.5); c.stroke();
    c.restore();
  }
};
BG['checker-scroll'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var s = h / 4, o = frac(t / 4) * s * 2;
  c.save(); c.translate(w / 2, h / 2); c.rotate(-Math.PI / 12); c.translate(-w, -w);
  fill(c, k.ink);
  for (var y = -s * 2; y < w * 2; y += s) for (var x = -s * 2; x < w * 2; x += s)
    if ((Math.round((x + s * 2) / s) + Math.round((y + s * 2) / s)) % 2 === 0) c.fillRect(x + o, y + o, s, s);
  c.restore();
};

// ── LINES · 선으로 속도 ────────────────────────────────────
BG['speed-lines'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  for (var i = 0; i < 26; i++) {
    var L = w * (.15 + .4 * hash(i + 9)), lap = w + L, sp = (1 + Math.floor(hash(i + 3) * 3)) * lap / 8;
    var x = frac((hash(i) * lap + t * sp) / lap) * lap - L, y = hash(i + 17) * h, th = h * (.008 + .03 * hash(i + 5));
    c.fillStyle = i % 4 ? k.paper : k.acc; c.globalAlpha = .5 + .5 * hash(i + 2);
    c.fillRect(x, y, L, th);
  }
  c.globalAlpha = 1;
};
BG['equalizer-stripes'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var n = 12, sl = h / n;
  for (var i = 0; i < n; i++) {
    var q = .2 + .8 * Math.abs(Math.sin(W8(t, 2) + i * .7) * Math.cos(W8(t) - i * .3));
    c.fillStyle = i % 2 ? k.acc : k.paper; c.fillRect(0, i * sl + sl * (1 - q) / 2, w, sl * q * .9);
  }
};
BG['radial-burst'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var cx = w / 2, cy = h / 2, R = Math.hypot(w, h) / 2 + 4, fr = Math.floor(t * 6) % 48, rot = 0;
  for (var i = 0; i < 70; i++) {
    var a = rot + i * TAU / 70 + hash(i) * .05, r0 = R * (.32 + .35 * hash(i * 7 + fr)), wd = .012 + .02 * hash(i + 4);
    c.fillStyle = i % 9 ? k.ink : k.acc;
    c.beginPath(); c.moveTo(cx + r0 * Math.cos(a), cy + r0 * Math.sin(a));
    c.lineTo(cx + R * Math.cos(a - wd), cy + R * Math.sin(a - wd)); c.lineTo(cx + R * Math.cos(a + wd), cy + R * Math.sin(a + wd)); c.closePath(); c.fill();
  }
};
BG['wave-lines'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  c.lineWidth = Math.max(1.2, h / 70);
  for (var i = 0; i < 12; i++) {
    c.strokeStyle = i % 3 ? k.paper : k.acc; c.globalAlpha = i % 3 ? .75 : 1; c.beginPath();
    for (var x = 0; x <= w; x += 4) {
      var y = h * (.08 + i * .075) + h * .16 * Math.sin(x / w * 4 + W8(t) + i * .25) * Math.sin(x / w * 2 - W8(t, 2) * .5 + 1);
      if (x) c.lineTo(x, y); else c.moveTo(x, y);
    }
    c.stroke();
  }
  c.globalAlpha = 1;
};
BG['ripple-interference'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var sp = h / 5, R = Math.hypot(w, h);
  [[.3, .55, k.paper], [.7, .45, k.acc]].forEach(function (S) {
    c.strokeStyle = S[2]; c.lineWidth = Math.max(1.4, h / 60);
    for (var j = 0; j * sp < R; j++) {
      var r = (j + frac(t / 2)) * sp; c.globalAlpha = clamp(1 - r / R * 1.3);
      c.beginPath(); c.arc(S[0] * w, S[1] * h, r, 0, TAU); c.stroke();
    }
  });
  c.globalAlpha = 1;
};
BG['barber-stripes'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var P = h / 2.2, o = frac(t / 2) * P;
  c.fillStyle = k.ink;
  for (var x = -h - P; x < w + h; x += P) {
    var a = x + o, sway = h * .08 * Math.sin(W8(t) + x / w * 3);
    c.beginPath(); c.moveTo(a, 0); c.lineTo(a + P * .45, 0); c.lineTo(a + P * .45 - h * .7 + sway, h); c.lineTo(a - h * .7 + sway, h); c.closePath(); c.fill();
  }
};
BG['line-tunnel'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var f = frac(t), base = h * .05;
  for (var i = 0; i < 10; i++) {
    var e = i + f, s = base * Math.pow(1.55, e), id = i - Math.floor(t);
    if (s > w * 1.6) break;
    c.strokeStyle = ((id % 4) + 4) % 4 ? k.ink : k.acc; c.lineWidth = Math.max(1, s * .04);
    c.strokeRect(w / 2 - s, h / 2 - s * .62, s * 2, s * 1.24);
  }
};
BG['crosshatch'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var sp = h / 6, o = frac(t / 8) * sp * 2;
  c.lineWidth = Math.max(1, h / 110);
  [[k.acc, 1, o], [k.paper, -1, -o * .5]].forEach(function (L) {
    c.strokeStyle = L[0]; c.globalAlpha = .85;
    for (var x = -h * 2; x < w + h * 2; x += sp) { c.beginPath(); c.moveTo(x + L[2], 0); c.lineTo(x + L[2] + L[1] * h, h); c.stroke(); }
  });
  c.globalAlpha = 1;
};

// ── SHAPES · 도형으로 북적 ─────────────────────────────────
BG['bubble-pop'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var cols = [k.acc, k.paper, k.deep];
  for (var i = 0; i < 16; i++) {
    var ph = frac(t / 2 + hash(i)), sc = ph < .35 ? back(ph / .35) : 1 - io((ph - .75) / .25) * (ph > .75 ? 1 : 0);
    var cyc = Math.floor(t / 2 + hash(i)) % 4, x = hash(i * 5 + cyc) * w, y = hash(i * 11 + cyc) * h;
    c.fillStyle = cols[i % 3]; dot(c, x, y, h * (.08 + .14 * hash(i + 20)) * Math.max(0, sc));
  }
};
BG['floating-shapes'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  for (var i = 0; i < 9; i++) {
    var x = hash(i) * w + h * .3 * Math.sin(W8(t) + i), y = hash(i + 4) * h + h * .12 * Math.sin(W8(t, 2) + i * 2), a = .5 * Math.sin(W8(t) + i * 1.7), L = h * (.25 + .25 * hash(i + 8));
    c.save(); c.translate(x, y); c.rotate(a);
    if (i % 3 === 2) {
      c.strokeStyle = k.paper; c.lineWidth = h * .035; c.lineCap = 'round'; c.beginPath();
      for (var s = 0; s <= 1; s += .05) { var px = (s - .5) * L, py = Math.sin(s * TAU * 1.5 + W8(t, 2)) * h * .04; if (s) c.lineTo(px, py); else c.moveTo(px, py); }
      c.stroke();
    } else { c.fillStyle = i % 3 ? k.ink : k.paper; c.globalAlpha = i % 3 ? .85 : .9; c.beginPath(); c.roundRect(-L / 2, -h * .07, L, h * .14, h * .07); c.fill(); }
    c.restore(); c.globalAlpha = 1;
  }
};
BG['polygon-tunnel'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var f = frac(t), base = h * .04;
  for (var i = 0; i < 12; i++) {
    var e = i + f, r = base * Math.pow(1.45, e), id = i - Math.floor(t);
    if (r > w) break;
    c.strokeStyle = ((id % 4) + 4) % 4 ? k.ink : k.acc; c.lineWidth = Math.max(1, r * .05);
    ngon(c, w / 2, h / 2, r, 6, e * .22); c.stroke();
  }
};
BG['orbit-shapes'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var cx = w / 2, cy = h / 2;
  for (var i = 0; i < 4; i++) {
    var rx = h * (.35 + i * .32), ry = rx * .32, tl = -.18;
    c.save(); c.translate(cx, cy); c.rotate(tl);
    c.setLineDash([2, 6]); c.strokeStyle = k.paper; c.globalAlpha = .35; c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    var a = W8(t, i % 2 ? -1 : 1 + (i > 1 ? 1 : 0)) + i * 1.9, x = rx * Math.cos(a), y = ry * Math.sin(a), sz = h * (.045 + .015 * i);
    c.translate(x, y); c.rotate(W8(t, 2));
    c.fillStyle = i % 2 ? k.acc : k.paper;
    if (i % 2) c.fillRect(-sz, -sz, sz * 2, sz * 2); else dot(c, 0, 0, sz);
    c.restore();
  }
  c.fillStyle = k.acc; dot(c, cx, cy, h * .05);
};
BG['kaleidoscope'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var n = 12, R = Math.hypot(w, h) / 2;
  for (var i = 0; i < n; i++) {
    c.save(); c.translate(w / 2, h / 2); c.rotate(i * TAU / n + W8(t) / 6); if (i % 2) c.scale(1, -1);
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, 0, TAU / n + .003); c.closePath(); c.clip();
    var d = h * (.25 + .15 * Math.sin(W8(t, 2)));
    c.fillStyle = k.acc; c.beginPath(); c.moveTo(d, 0); c.lineTo(d + h * .3, h * .02); c.lineTo(d + h * .12, h * .14); c.closePath(); c.fill();
    c.fillStyle = k.paper; dot(c, h * (.45 + .1 * Math.cos(W8(t))), h * .06, h * .05);
    c.fillStyle = k.deep; dot(c, d * .5, h * .03, h * .03);
    c.restore();
  }
};
BG['confetti-fall'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  for (var i = 0; i < 40; i++) {
    var lap = h * 1.2, sp = (1 + Math.floor(hash(i + 2) * 2)) * lap / 8, y = frac((hash(i) * lap + t * sp) / lap) * lap - h * .1;
    var x = hash(i + 6) * w + h * .05 * Math.sin(W8(t, 2) + i), sz = h * (.025 + .025 * hash(i + 9));
    c.save(); c.translate(x, y); c.rotate(W8(t, 1 + i % 3) + i);
    c.scale(Math.cos(W8(t, 2) + i), 1); c.fillStyle = i % 3 ? k.paper : k.ink; c.fillRect(-sz, -sz * .6, sz * 2, sz * 1.2);
    c.restore();
  }
};
BG['blob-morph'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  [[.28, .55, .3, k.acc, 0], [.62, .42, .36, k.ink, 2], [.85, .66, .2, k.deep, 4], [.5, .8, .16, k.acc, 1]].forEach(function (b) {
    var cx = b[0] * w + h * .08 * Math.sin(W8(t) + b[4]), cy = b[1] * h + h * .06 * Math.cos(W8(t) + b[4]), R = b[2] * h;
    c.fillStyle = b[3]; c.beginPath();
    for (var a = 0; a <= TAU + .01; a += TAU / 60) {
      var r = R * (1 + .12 * Math.sin(3 * a + W8(t) + b[4]) + .07 * Math.sin(5 * a - W8(t, 2)));
      if (a) c.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); else c.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    c.fill();
  });
};
BG['pinwheels'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  [[.15, .45, .28, 1], [.38, .7, .2, -2], [.56, .32, .33, 1], [.8, .62, .24, -1], [.95, .2, .14, 2]].forEach(function (p) {
    var R = p[2] * h; c.save(); c.translate(p[0] * w, p[1] * h); c.rotate(W8(t, p[3]) / 2);
    for (var j = 0; j < 8; j++) {
      c.fillStyle = j % 2 ? k.paper : k.acc; c.beginPath(); c.moveTo(0, 0);
      c.lineTo(R * Math.cos(j * TAU / 8), R * Math.sin(j * TAU / 8)); c.lineTo(R * .7 * Math.cos((j + 1) * TAU / 8), R * .7 * Math.sin((j + 1) * TAU / 8)); c.closePath(); c.fill();
    }
    c.restore();
  });
};

// ── MINIMAL · 여백으로 차분 ────────────────────────────────
BG['color-blocks'] = function (c, w, h, t, k) {
  var L = [[.4, .38, .22], [.2, .5, .3], [.33, .2, .47], [.5, .3, .2]], s = Math.floor(t / 2) % 4, q = io(frac(t / 2) / .6);
  var a = L[s], b = L[(s + 1) % 4], cols = [k.acc, k.paper, k.ink], x = 0;
  for (var i = 0; i < 3; i++) {
    var ww = (a[i] + (b[i] - a[i]) * q) * w; c.fillStyle = cols[i]; c.fillRect(x, 0, ww + 1, h);
    if (i === 1) { c.fillStyle = k.ink; c.fillRect(x, h * (.62 + .1 * Math.sin(W8(t))), ww + 1, h); }
    x += ww;
  }
};
BG['eclipse-circle'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var R = h * .36, cx = w / 2, cy = h / 2;
  c.fillStyle = k.paper; dot(c, cx, cy, R);
  c.strokeStyle = k.ink; c.lineWidth = Math.max(2, h * .025);
  c.beginPath(); c.arc(cx + R * .16 * Math.cos(W8(t)), cy + R * .16 * Math.sin(W8(t)), R * 1.04, 0, TAU); c.stroke();
};
BG['bauhaus-tiles'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var s = h / 2, i = 0;
  for (var y = 0; y < h; y += s) for (var x = 0; x < w; x += s, i++) {
    var st = hash(i) * 2, ph = frac((t + st) / 2) * 2, turn = Math.floor((t + st) / 2) + (ph < .5 ? io(ph / .5) : 1), kind = i % 4;
    if (i % 3 === 1) { c.fillStyle = lerpC(k.paper, k.ink, .12); c.fillRect(x, y, s, s); }
    c.save(); c.translate(x + s / 2, y + s / 2); c.rotate(turn * Math.PI / 2);
    c.fillStyle = kind === 1 ? k.ink : k.acc; c.beginPath();
    if (kind === 0) c.arc(0, 0, s * .4, 0, TAU);
    else if (kind === 1) { c.moveTo(-s / 2, -s / 2); c.arc(-s / 2, -s / 2, s, 0, Math.PI / 2); }
    else if (kind === 2) { c.arc(0, 0, s * .42, 0, Math.PI); }
    else { c.moveTo(-s / 2, s / 2); c.lineTo(s / 2, s / 2); c.lineTo(s / 2, -s / 2); }
    c.fill(); if (kind === 2) { c.fillStyle = k.ink; c.beginPath(); c.arc(0, 0, s * .42, Math.PI, TAU); c.fill(); }
    c.restore();
  }
};
BG['concentric-arcs'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  c.lineCap = 'butt';
  [[.38, 1, k.acc, 1.3], [.27, -2, k.paper, .9], [.15, 1, k.acc, 1.7]].forEach(function (A) {
    c.strokeStyle = A[2]; c.lineWidth = h * .07; var a = W8(t, A[1]);
    c.beginPath(); c.arc(w / 2, h / 2, A[0] * h, a, a + A[3] * Math.PI); c.stroke();
  });
};
BG['sliding-bands'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var bh = h / 3, P = w * .8;
  for (var i = 0; i < 3; i++) {
    var step = Math.floor(t / 2), q = io(frac(t / 2) / .7), o = (step + q) * P / 2 * (i % 2 ? -1 : 1);
    o = ((o % P) + P) % P;
    for (var x = -P * 2; x < w + P; x += P) {
      c.fillStyle = i === 1 ? k.paper : k.acc; c.fillRect(x + o, i * bh + bh * .14, P * .42, bh * .72);
    }
  }
};
BG['square-snap'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var ph = frac(t / 2), turn = Math.floor(t / 2) + (ph < .55 ? (ph < .25 ? -.06 * Math.sin(ph / .25 * Math.PI) : back((ph - .25) / .3)) : 1), S = h * .62;
  c.save(); c.translate(w / 2, h / 2); c.rotate(turn * Math.PI / 2);
  c.strokeStyle = k.ink; c.lineWidth = h * .035; c.strokeRect(-S / 2, -S / 2, S, S);
  c.fillStyle = k.paper; c.fillRect(-S * .34, -S * .34, S * .68, S * .68);
  c.restore();
};
BG['soft-wave'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  [[k.acc, h * .11, 0, .42], [k.ink, h * .018, 1.2, .62]].forEach(function (L) {
    c.strokeStyle = L[0]; c.lineWidth = L[1]; c.lineCap = 'round'; c.beginPath();
    for (var x = -10; x <= w + 10; x += 4) { var y = h * L[3] + h * .17 * Math.sin(x / w * 2.4 * Math.PI + W8(t) + L[2]); if (x > -10) c.lineTo(x, y); else c.moveTo(x, y); }
    c.stroke();
  });
};
BG['nested-squares'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  for (var i = 9; i >= 1; i--) {
    var S = h * .11 * i, a = .45 * Math.sin(W8(t) - i * .38);
    c.save(); c.translate(w / 2, h / 2); c.rotate(a);
    c.strokeStyle = i % 2 ? k.paper : k.acc; c.lineWidth = Math.max(1.4, h * .016); c.strokeRect(-S / 2, -S / 2, S, S);
    c.restore();
  }
};

// ══ 배경 2 (⑯): 같은 BG 묶음에 둔다. 갤러리는 demos/m19-background-2.html ══
// ── FLOW · 흐르고 번져요 ───────────────────────────────────
BG['fluid-gradient'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.deep);
  var cols = [k.acc, lerpC(k.acc, k.paper, .55), lerpC(k.acc, '#6B5AE0', .65), lerpC(k.deep, k.ink, .5)];
  for (var i = 0; i < 4; i++) {
    var a = W8(t, i % 2 ? 1 : -1) + i * 1.7, x = w * (.5 + .36 * Math.cos(a)), y = h * (.5 + .4 * Math.sin(a * (i % 2 ? 2 : 1) + i));
    var r = h * (.8 + .18 * Math.sin(W8(t, 2) + i)), g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, cols[i]); g.addColorStop(1, cols[i] + '00'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  }
};
BG['flow-field'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var N = Math.round(90 * w / h) + 40, st = h * .024, S = 40;
  var ang = function (x, y) { return Math.sin(x / h * 1.7) * 1.6 + Math.cos(y / h * 2.3 + x / h * .6) * 1.4; };
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (var i = 0; i < N; i++) {
    var age = frac(t / 4 + hash(i + 7)), head = Math.floor(age * S), x = hash(i) * (w + h) - h * .5, y = hash(i + 99) * h, pts = [];
    for (var s = 0; s <= head; s++) { pts.push(x, y); var a = ang(x, y); x += Math.cos(a) * st; y += Math.sin(a) * st; }
    var from = Math.max(0, head - 12); if (head - from < 1) continue;
    c.globalAlpha = Math.sin(Math.PI * age) * .8; c.strokeStyle = i % 6 ? k.ink : k.acc; c.lineWidth = i % 6 ? h * .007 : h * .013;
    c.beginPath(); c.moveTo(pts[from * 2], pts[from * 2 + 1]); for (var j = from + 1; j <= head; j++) c.lineTo(pts[j * 2], pts[j * 2 + 1]); c.stroke();
  }
  c.globalAlpha = 1;
};
BG['reaction-diffusion'] = function (c, w, h, t, k) {
  var s = (c.getTransform ? c.getTransform().a : 1) || 1, W = Math.max(2, Math.ceil(w * s / 2)), H = Math.max(2, Math.ceil(h * s / 2)), key = '_rd' + W + 'x' + H;
  var o = c[key]; if (!o) { o = document.createElement('canvas'); o.width = W; o.height = H; c[key] = o; }
  var x2 = o.getContext('2d'), img = x2.createImageData(W, H), d = img.data;
  var rgb = function (hx) { return [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)]; };
  var A = rgb(k.acc), B = rgb(k.ink), kf = TAU * 4.2 / H, thr = .32 * Math.sin(W8(t)), ph = [], cs = [], sn = [], NW = 9;
  for (var j = 0; j < NW; j++) { var th = j * Math.PI / NW + hash(j) * .25, kk = kf * (.9 + .2 * hash(j + 5)); cs.push(Math.cos(th) * kk); sn.push(Math.sin(th) * kk); ph.push(W8(t, 1 + j % 2) * (j % 3 ? 1 : -1) + hash(j + 9) * TAU); }
  var wa = W8(t), wv = H * .05;
  for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
    var xx = x + wv * Math.sin(y * kf * .45 + wa), yy = y + wv * Math.cos(x * kf * .45 - wa), v = 0;
    for (j = 0; j < NW; j++) v += Math.cos(xx * cs[j] + yy * sn[j] + ph[j]);
    var q = clamp((v / 3 - thr) / .12 + .5), n = (y * W + x) * 4;
    d[n] = B[0] + (A[0] - B[0]) * q; d[n + 1] = B[1] + (A[1] - B[1]) * q; d[n + 2] = B[2] + (A[2] - B[2]) * q; d[n + 3] = 255;
  }
  x2.putImageData(img, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(o, 0, 0, w, h);
};
BG['neon-contour'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var cs = h / 22, nx = Math.ceil(w / cs) + 1, ny = Math.ceil(h / cs) + 1, F = [], i, j;
  for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
    var x = i * cs / h, y = j * cs / h;
    F.push(Math.sin(x * 2.1 + W8(t)) + Math.sin(y * 2.7 - W8(t)) + .8 * Math.sin((x + y) * 1.6 + W8(t, 2)) + .5 * Math.cos(x * 3.3 - y * 1.1 - W8(t)));
  }
  var at = function (i, j) { return F[j * nx + i]; };
  for (var L = 0; L < 7; L++) {
    var lv = -1.8 + L * .6; c.beginPath();
    for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) {
      var a = at(i, j) - lv, b = at(i + 1, j) - lv, e = at(i + 1, j + 1) - lv, f = at(i, j + 1) - lv, P = [], x0 = i * cs, y0 = j * cs;
      if ((a > 0) !== (b > 0)) P.push([x0 + cs * a / (a - b), y0]);
      if ((b > 0) !== (e > 0)) P.push([x0 + cs, y0 + cs * b / (b - e)]);
      if ((e > 0) !== (f > 0)) P.push([x0 + cs * (1 - e / (e - f)), y0 + cs]);
      if ((f > 0) !== (a > 0)) P.push([x0, y0 + cs * (1 - f / (f - a))]);
      for (var m = 0; m + 1 < P.length; m += 2) { c.moveTo(P[m][0], P[m][1]); c.lineTo(P[m + 1][0], P[m + 1][1]); }
    }
    var col = L % 2 ? lerpC(k.acc, k.paper, .45) : k.acc;
    c.lineCap = 'round'; c.strokeStyle = col; c.globalAlpha = .22; c.lineWidth = h * .03; c.stroke();
    c.globalAlpha = 1; c.lineWidth = Math.max(1, h * .008); c.stroke();
  }
};
BG['network-pulse'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var g = h * .3, cols = Math.ceil(w / g) + 1, rows = 4, N = [], E = [], i, j;
  for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
    var n = j * cols + i, a = W8(t) + hash(n) * TAU, r = g * .12;
    N.push([i * g + (j % 2) * g * .5 - g * .25 + (hash(n + 3) - .5) * g * .5 + r * Math.cos(a), h * .14 + j * h * .24 + (hash(n + 5) - .5) * h * .1 + r * Math.sin(a)]);
  }
  for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
    var n0 = j * cols + i;
    if (i < cols - 1) E.push([n0, n0 + 1]);
    if (j < rows - 1 && hash(n0 + 11) < .7) E.push([n0, n0 + cols]);
    if (j < rows - 1 && i < cols - 1 && hash(n0 + 17) < .35) E.push([n0, n0 + cols + 1]);
  }
  c.strokeStyle = k.deep; c.lineWidth = Math.max(1, h * .008); c.beginPath();
  E.forEach(function (e) { c.moveTo(N[e[0]][0], N[e[0]][1]); c.lineTo(N[e[1]][0], N[e[1]][1]); }); c.stroke();
  var glow = N.map(function () { return 0; });
  E.forEach(function (e, m) {
    if (hash(m * 3 + 1) > .5) return;
    var p = frac(t / 2 + hash(m)), A = N[e[0]], B = N[e[1]];
    for (var q = 0; q < 6; q++) {
      var u = p - q * .035; if (u < 0) break;
      c.globalAlpha = (1 - q / 6) * .9; c.fillStyle = q ? k.acc : k.paper; dot(c, A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, h * (.02 - q * .002));
    }
    var arrive = clamp(1 - Math.abs(p - .97) / .12); glow[e[1]] = Math.max(glow[e[1]], arrive);
  });
  c.globalAlpha = 1;
  N.forEach(function (P, n) { fill(c, glow[n] > .05 ? lerpC(k.deep, k.paper, glow[n]) : k.deep); dot(c, P[0], P[1], h * (.022 + .02 * glow[n])); });
};
BG['aperture-grid'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var s = h / 2.6, R = s * .42;
  for (var y = s / 2; y < h + s / 2; y += s) for (var x = s / 2; x < w + s / 2; x += s) {
    var o = .5 + .5 * Math.sin(W8(t, 2) - (x + y) / h * 2.2), hole = R * (.12 + .78 * o), rot = o * Math.PI / 3;
    fill(c, k.deep); dot(c, x, y, R);
    c.fillStyle = k.acc; ngon(c, x, y, hole, 6, rot); c.fill();
    c.strokeStyle = lerpC(k.deep, k.ink, .5); c.lineWidth = Math.max(1, h * .008); c.beginPath();
    for (var b = 0; b < 6; b++) {
      var a = rot + b * TAU / 6, px = x + hole * Math.cos(a), py = y + hole * Math.sin(a), a2 = a + Math.PI / 2 + .35;
      c.moveTo(px, py); c.lineTo(x + R * Math.cos(a2 - .9), y + R * Math.sin(a2 - .9));
    }
    c.stroke();
    c.strokeStyle = k.paper; c.lineWidth = Math.max(1.2, h * .014); c.beginPath(); c.arc(x, y, R, 0, TAU); c.stroke();
  }
};

// ── DEPTH · 멀리까지 펼쳐져요 ──────────────────────────────
BG['dot-ocean'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var hz = h * .3, f = h * .5, cam = 1.1;
  for (var zi = 0; zi < 26; zi++) {
    var z = 1 + zi * .45, sp = .28, X = w / 2 / (f / z) + 1;
    for (var x = -X; x <= X; x += sp) {
      var yv = .22 * Math.sin(x * 1.1 + z * .7 - W8(t, 2)) + .14 * Math.sin(x * .45 - z * 1.3 + W8(t));
      var sx = w / 2 + x * f / z, sy = hz + (cam - yv) * f / z * .55;
      if (sx < -4 || sx > w + 4) continue;
      c.globalAlpha = clamp(1.25 - zi / 22); fill(c, yv > .18 ? k.paper : k.acc); dot(c, sx, sy, Math.max(.6, h * .028 / z));
    }
  }
  c.globalAlpha = 1;
};
BG['wireframe-terrain'] = function (c, w, h, t, k) {
  var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, k.ink); g.addColorStop(.36, k.deep); g.addColorStop(.37, k.ink); g.addColorStop(1, k.ink);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  var hz = h * .36, f = h * .9, Zp = 8, scr = frac(t / 8) * Zp, dz = .5, zn = .6, cols = 22, rows = 18, P = [];
  var HT = function (x, Z) { var v = Math.abs(x); return Math.pow(v, 1.4) * .32 * (.7 + .3 * Math.sin(Z * TAU / Zp * 2 + x)) + .12 * Math.sin(Z * TAU / Zp * 3 + x * 1.7); };
  var off = scr % dz;
  for (var r = 0; r < rows; r++) {
    var zc = zn + r * dz - off, Z = zc + scr, row = [];
    for (var q = 0; q <= cols; q++) {
      var x = (q / cols - .5) * 9, y = HT(x, Z);
      row.push([w / 2 + x * f / zc * .35, hz + (1 - y) * f / zc * .22, zc]);
    }
    P.push(row);
  }
  c.strokeStyle = k.acc; c.lineWidth = Math.max(1, h * .007);
  for (r = 0; r < rows; r++) { c.globalAlpha = clamp(1.4 - r / rows * 1.6) * clamp((P[r][0][2] - .25) * 3); c.beginPath(); P[r].forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke(); }
  for (q = 0; q <= cols; q++) for (r = 0; r < rows - 1; r++) {
    c.globalAlpha = clamp(1.4 - r / rows * 1.6) * clamp((P[r][q][2] - .25) * 3);
    c.beginPath(); c.moveTo(P[r][q][0], P[r][q][1]); c.lineTo(P[r + 1][q][0], P[r + 1][q][1]); c.stroke();
  }
  c.globalAlpha = 1; c.fillStyle = k.paper; c.fillRect(0, hz - 1, w, Math.max(1, h * .006));
};
BG['cloud-sky'] = function (c, w, h, t, k) {
  var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, lerpC(k.acc, k.ink, .35)); g.addColorStop(1, lerpC(k.acc, k.paper, .55));
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  [[1, .5, .26, .55], [2, .75, .5, .78], [3, 1, .78, .95]].forEach(function (L, li) {
    var cw = h * .9 * L[1], span = w + cw * 2, n = Math.max(2, Math.ceil(w / (cw * 1.4))), o = frac(t * L[0] / 8) * span;
    for (var i = 0; i < n; i++) {
      var cx = ((i * span / n + o + hash(i + li * 9) * cw) % span) - cw, cy = h * L[2] + (hash(i + li * 5) - .5) * h * .12;
      c.globalAlpha = L[3];
      fill(c, lerpC(k.paper, k.acc, .1 * (2 - li)));
      for (var b = 0; b < 5; b++) { var u = (b + .5) / 5; dot(c, cx + (u - .5) * cw * .8, cy - Math.sin(u * Math.PI) * cw * .16 * (.7 + .6 * hash(b + i * 7 + li)), cw * (.13 + .07 * Math.sin(u * Math.PI))); }
      for (b = 0; b < 4; b++) dot(c, cx + ((b + .5) / 4 - .5) * cw * .78, cy + cw * .05, cw * .1);
    }
  });
  c.globalAlpha = 1;
};

if (typeof module !== 'undefined') module.exports = { BG: BG };
