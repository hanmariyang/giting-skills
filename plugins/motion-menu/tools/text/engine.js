// 글자 연출 40 — 캔버스 그리기 함수 묶음 (의존성 0)
// 갤러리 데모(demos/m10-text-motion.html)와 홍보 영상(render.mjs)이 같은 함수를 쓴다.
// 정본은 이 파일 하나. 데모를 고치려면 여기를 고치고 `node tools/text/gen.mjs` → `node build.mjs`.
//
// TX[id](c, w, h, t, k)
//   c: 2D 컨텍스트 (0,0 ~ w,h 가 칸)   t: 초. 모든 움직임은 8초에 한 바퀴 돌아 처음과 이어진다
//   k: { acc, deep, paper, ink }
// 글자 크기는 전부 h 에 비례한다. 글꼴은 시스템 고딕 굵은 것(맥은 Apple SD Gothic Neo Heavy).

/*@helpers*/
var TAU = Math.PI * 2;
var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
var io = function (t) { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
var eo = function (t) { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
var back = function (t) { t = clamp(t); var s = 1.9; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
var frac = function (v) { return v - Math.floor(v); };
var hash = function (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
var W8 = function (t, n) { return TAU * (n || 1) * t / 8; };
var bgc = function (c, w, h, col) { c.fillStyle = col; c.fillRect(0, 0, w, h); };
var FONT = function (px, wt) { return (wt || 900) + ' ' + Math.round(px) + 'px -apple-system,"Apple SD Gothic Neo",system-ui,sans-serif'; };
var say = function (c, s, x, y, px, col, al, wt) { c.font = FONT(px, wt); c.fillStyle = col; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
var tw = function (c, s, px, wt) { c.font = FONT(px, wt); return c.measureText(s).width; };
// 칸이 좁으면 글자를 줄인다(폭 mw 안에 들게)
var fit = function (c, s, px, mw, wt) { var L = tw(c, s, px, wt); return L > mw ? px * mw / L : px; };
// 글자 모양으로 오려 내기 같은 합성은 따로 그린 판에서 한다(본 칸의 바탕을 건드리지 않으려고)
var OFF = {}, LED = {};
var layer = function (c, w, h, draw) {
  var s = (c.getTransform ? c.getTransform().a : 1) || 1, W = Math.ceil(w * s), H = Math.ceil(h * s), key = W + 'x' + H;
  var o = OFF[key] || (OFF[key] = document.createElement('canvas')); o.width = W; o.height = H;
  var x = o.getContext('2d'); x.setTransform(s, 0, 0, s, 0, 0); draw(x); c.drawImage(o, 0, 0, w, h);
};
// 줄글을 한 바퀴 이어지는 띠로: 문구 폭 L 을 8초에 n 번 미끄러진다
var band = function (c, s, y, px, col, dir, n, t, w, wt) {
  var L = tw(c, s, px, wt), o = frac(t * (n || 1) / 8) * L * (dir || 1);
  c.font = FONT(px, wt); c.fillStyle = col; c.textAlign = 'left'; c.textBaseline = 'middle';
  for (var x = -L * 2 + ((o % L) + L) % L; x < w + L; x += L) c.fillText(s, x, y);
};
/*@end*/

var TX = {};

// ── PUNCH · 한 단어로 분위기를 바꿔요 ─────────────────────
TX['word-burst'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var W = ['쾅', '펑', '빵', '팡'][Math.floor(t / 2) % 4], p = frac(t / 2), cx = w / 2, cy = h / 2;
  for (var i = 0; i < 12; i++) {
    var a = hash(i) * TAU, d = eo(p / .7) * h * (.35 + .4 * hash(i + 3)), s = h * (.03 + .03 * hash(i + 5));
    c.save(); c.globalAlpha = clamp(1 - p / .8); c.translate(cx + d * Math.cos(a) * 1.6, cy + d * Math.sin(a)); c.rotate(a + p * 4);
    c.fillStyle = i % 3 ? k.deep : k.paper; c.fillRect(-s, -s / 2, s * 2, s); c.restore();
  }
  var sc = p < .12 ? 2.4 - 1.4 * eo(p / .12) : 1, sh = p < .3 && p > .12 ? Math.sin(p * 90) * h * .02 * (1 - p / .3) : 0;
  c.save(); c.translate(cx + sh, cy); c.scale(sc, sc); say(c, W, 0, 0, h * .5, k.acc); c.restore();
};
TX['letter-slam'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var S = '오늘도간다', p = t % 4, n = S.length, px = Math.min(h * .42, w * .82 / n), gap = px * 1.02, x0 = w / 2 - gap * (n - 1) / 2;
  for (var i = 0; i < n; i++) {
    var q = (p - .2 - i * .28) / .14; if (q < 0 || p > 3.7) continue;
    var sc = 1 + 1.3 * (1 - eo(q));
    c.save(); c.translate(x0 + i * gap, h / 2); c.scale(sc, sc);
    say(c, S[i], h * .02, h * .03, px, k.ink); say(c, S[i], 0, 0, px, k.paper); c.restore();
  }
};
TX['stamp-text'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var p = t % 4, S = [['확정', .26, .38, -.18], ['완료', .5, .66, .06], ['승인', .74, .4, .14]];
  S.forEach(function (s, i) {
    var q = (p - .2 - i * .9) / .22; if (q < 0 || p > 3.75) return;
    var sc = 1.7 - .7 * back(q), px = h * .3, bw = tw(c, s[0], px) + px * .5, bh = px * 1.3;
    c.save(); c.translate(s[1] * w, s[2] * h); c.rotate(s[3]); c.scale(sc, sc); c.globalAlpha = clamp(q * 3);
    c.strokeStyle = i === 2 ? k.ink : k.acc; c.lineWidth = px * .1; c.strokeRect(-bw / 2, -bh / 2, bw, bh);
    say(c, s[0], 0, px * .03, px, i === 2 ? k.ink : k.acc); c.restore();
  });
};
TX['punch-zoom'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var W = ['돌파', '전진', '질주', '출발'][Math.floor(t / 2) % 4], p = frac(t / 2), z = eo(p / .28), al = p > .85 ? 1 - (p - .85) / .15 : 1;
  for (var j = 4; j >= 0; j--) {
    var zz = eo((p - j * .03) / .28), s = .08 + .92 * zz;
    c.save(); c.globalAlpha = (j ? .22 : 1) * al; c.translate(w / 2, h / 2); c.scale(s, s);
    say(c, W, 0, 0, h * .55, j ? k.acc : k.paper); c.restore();
  }
  if (z < 1) { c.globalAlpha = 1; }
};
TX['kinetic-stack'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var L = ['지금', '바로', '시작'], p = t % 4, px = h * .27;
  L.forEach(function (s, j) {
    var q = eo((p - j * .35) / .35), out = eo((p - 3.3) / .5), dir = j % 2 ? 1 : -1;
    var x = w / 2 + dir * (1 - q) * w, y = h * (.22 + j * .28) - out * h * 1.2;
    if (q > 0) say(c, s, x, y, px, j === 1 ? k.acc : k.paper);
  });
};
TX['stretch-text'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var S = '늘어나', px = h * .38, gap = px * 1.04, x0 = w / 2 - gap;
  for (var i = 0; i < 3; i++) {
    var s = 1 + .9 * Math.max(0, Math.sin(W8(t, 4) - i * .7));
    c.save(); c.translate(x0 + i * gap, h * .78); c.scale(1, s); say(c, S[i], 0, -px * .5, px, i === 2 ? k.paper : k.ink); c.restore();
  }
};
TX['text-zoom-through'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var Wd = ['하나', '둘', '셋', '넷'], i = Math.floor(t / 2) % 4, p = frac(t / 2);
  if (p > .45) {
    var q = eo((p - .45) / .55);
    c.save(); c.globalAlpha = q; c.translate(w / 2, h / 2); c.scale(.2 + .8 * q, .2 + .8 * q); say(c, Wd[(i + 1) % 4], 0, 0, h * .5, k.ink); c.restore();
  }
  var s = p < .45 ? 1 + .08 * p : 1.04 * Math.pow(14, (p - .45) / .55);
  c.save(); c.globalAlpha = p < .75 ? 1 : 1 - (p - .75) / .25; c.translate(w / 2, h / 2); c.scale(s, s); say(c, Wd[i], 0, 0, h * .5, k.acc); c.restore();
};
TX['squeeze-swap'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var Wd = ['말랑', '쫀득', '탱탱', '물컹'], i = Math.floor(t / 2) % 4, p = frac(t / 2), sx, sy, s;
  if (p < .2) { var q = io(p / .2); sy = 1 - .65 * q; sx = 1 + .35 * q; s = Wd[(i + 3) % 4]; }
  else { var r = (p - .2) / .8, e = Math.exp(-6 * r) * Math.cos(13 * r); sy = 1 - .65 * e; sx = 1 + .35 * e; s = Wd[i]; }
  c.save(); c.translate(w / 2, h * .82); c.scale(sx, sy); say(c, s, 0, -h * .3, h * .55, k.acc); c.restore();
};

// ── FLOW · 멈추지 않고 흘러요 ─────────────────────────────
TX['giant-scroll'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var S = '오늘 밤 서울 · ', px = h * .62, L = tw(c, S, px), o = -(Math.floor(t / 2) + io(frac(t / 2) / .8)) * L / 4;
  c.font = FONT(px); c.fillStyle = k.paper; c.textAlign = 'left'; c.textBaseline = 'middle';
  for (var x = ((o % L) - L); x < w + L; x += L) c.fillText(S, x, h * .4);
  c.fillStyle = k.acc; c.fillRect(0, h * .78, w, h * .14);
  band(c, '오늘 밤 서울 · 오늘 밤 서울 · ', h * .85, h * .1, k.ink, 1, 1, t, w);
};
TX['vertical-columns'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var cols = [['고요', .12, .16, 1], ['질주', .3, .22, -1], ['고요', .52, .13, 1], ['질주', .72, .3, -2], ['고요', .9, .16, 1]];
  cols.forEach(function (C, j) {
    var px = h * C[2], s = (C[0] + '  ').split(''), L = px * 1.1 * s.length, o = frac(t * Math.abs(C[3]) / 8) * L * (C[3] > 0 ? 1 : -1);
    for (var y = ((o % L) + L) % L - L; y < h + L; y += L) s.forEach(function (ch, i) { say(c, ch, C[1] * w, y + i * px * 1.1, px, j % 2 ? k.ink : k.paper); });
  });
};
TX['repeat-wave'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var px = h * .15, cw = tw(c, '흐름', px) * 1.15, rh = px * 1.25;
  for (var r = 0; r * rh < h + rh; r++) for (var q = 0; q * cw < w + cw; q++) {
    var on = Math.sin(W8(t, 2) - q * .55 + r * .35) > .35, x = q * cw, y = r * rh;
    if (on) { c.fillStyle = k.acc; c.fillRect(x, y, cw, rh); }
    say(c, '흐름', x + cw / 2, y + rh / 2, px, on ? k.paper : k.ink, 'center', on ? 900 : 600);
  }
};
TX['diagonal-bands'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  c.save(); c.translate(w / 2, h / 2); c.rotate(-.2); c.translate(-w, -h / 2);
  [[k.acc, k.ink, 1], [k.paper, k.ink, -1], [k.acc, k.ink, 1]].forEach(function (B, j) {
    var y = h * (.02 + j * .36), bh = h * .28;
    c.fillStyle = B[0]; c.fillRect(0, y, w * 2, bh);
    band(c, '새벽 세시 · ', y + bh / 2, bh * .72, B[1], B[2], 1, t, w * 2);
  });
  c.restore();
};
TX['text-on-path'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var f = function (x) { return h * .52 + h * .2 * Math.sin(x / w * TAU * .9 + 1); }, df = function (x) { return h * .2 * Math.cos(x / w * TAU * .9 + 1) * TAU * .9 / w; };
  c.strokeStyle = k.deep; c.lineWidth = h * .3; c.beginPath();
  for (var x = -10; x <= w + 10; x += 6) { if (x > -10) c.lineTo(x, f(x)); else c.moveTo(x, f(x)); }
  c.stroke();
  var S = '물결 따라 흘러요 · '.split(''), px = h * .19, cw = px * .95, span = cw * S.length, o = frac(t / 8) * span;
  for (var rep = -1; rep * span < w + span; rep++) S.forEach(function (ch, i) {
    var x = rep * span + i * cw + o - span; if (x < -px || x > w + px) return;
    c.save(); c.translate(x, f(x)); c.rotate(Math.atan(df(x))); say(c, ch, 0, 0, px, i % 6 ? k.paper : k.acc); c.restore();
  });
};
TX['marquee-stack'] = function (c, w, h, t, k) {
  var B = [['오늘 한정 · ', .16, k.acc, k.ink, 2, 1], ['신상 공개 · ', .22, k.ink, k.paper, 1, -1], ['예약 받는 중 · ', .14, k.acc, k.ink, 3, 1], ['마지막 날 · ', .3, k.ink, k.acc, 1, -1]], y = 0;
  B.forEach(function (b) { var bh = b[1] * h * 1.12; c.fillStyle = b[2]; c.fillRect(0, y, w, bh + 1); band(c, b[0], y + bh / 2, bh * .74, b[3], b[5], b[4], t, w); y += bh; });
  c.fillStyle = k.ink; c.fillRect(0, y, w, h);
};
TX['parallax-columns'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  [[.13, 1, .35, [.06, .5, .94]], [.2, 2, .6, [.25, .78]], [.38, 3, 1, [.5]]].forEach(function (L) {
    var px = h * L[0], s = '밤비거리'.split(''), Lh = px * 1.15 * s.length;
    L[3].forEach(function (cx, j) {
      var o = frac(t * L[1] / 8 + j * .3) * Lh;
      for (var y = o - Lh; y < h + Lh; y += Lh) s.forEach(function (ch, i) { c.globalAlpha = L[2]; say(c, ch, cx * w, y + i * px * 1.15, px, L[1] === 3 ? k.ink : k.acc); });
    });
  });
  c.globalAlpha = 1;
};
TX['caution-tape'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  [[.22, 1], [-.22, -1]].forEach(function (T) {
    c.save(); c.translate(w / 2, h / 2); c.rotate(T[0]); c.translate(-w, 0);
    c.fillStyle = k.acc; c.fillRect(0, -h * .13, w * 2, h * .26);
    band(c, '출입 금지 · ', 0, h * .17, k.ink, T[1], 2, t, w * 2);
    c.restore();
  });
};

// ── DEPTH · 글자 속으로 들어가요 ───────────────────────────
TX['text-tunnel'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var f = frac(t);
  for (var i = 6; i >= 0; i--) {
    var e = i + f, s = .1 * Math.pow(1.65, e), id = i - Math.floor(t); if (s > 6) continue;
    c.save(); c.translate(w / 2, h / 2); c.scale(s, s); c.font = FONT(h * .5); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = h * .02 / s * 1.5; c.strokeStyle = ((id % 2) + 2) % 2 ? k.paper : k.acc; c.globalAlpha = clamp(1.25 - s / 2.2); c.strokeText('우주', 0, 0); c.restore();
  }
  c.globalAlpha = 1;
};
TX['text-corridor'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var f = frac(t / 2), cx = w / 2, cy = h / 2;
  c.strokeStyle = k.deep; c.lineWidth = 1;
  for (var i = -8; i <= 8; i++) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + i * w / 6, h); c.stroke(); }
  for (var j = 8; j >= 0; j--) {
    var z = j + 1 - f, s = 1 / z, id = j - Math.floor(t / 2), y = cy + h * .5 * s;
    c.globalAlpha = clamp(1.2 - z / 8); c.strokeStyle = k.deep; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
    [-1, 1].forEach(function (sd) {
      c.save(); c.translate(cx + sd * w * .42 * s, cy); c.scale(s * .5, s);
      say(c, '나아가', 0, 0, h * .5, ((id % 2) + 2) % 2 ? k.acc : k.paper); c.restore();
    });
  }
  c.globalAlpha = 1;
};
TX['text-cylinder'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var S = '계속간다·'.repeat(2).split(''), n = S.length, R = w * .3;
  [[.24, 1, .17], [.5, -1, .24], [.76, 1, .17]].forEach(function (row) {
    S.forEach(function (ch, i) {
      var a = i * TAU / n + row[1] * W8(t), z = Math.cos(a); if (z < 0) return;
      c.save(); c.translate(w / 2 + R * Math.sin(a), row[0] * h); c.scale(Math.max(.05, z), 1); c.globalAlpha = .35 + .65 * z;
      say(c, ch, 0, 0, h * row[2], ch === '·' ? k.acc : k.ink); c.restore();
    });
  });
  c.globalAlpha = 1;
};
TX['text-vortex'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var f = frac(t / 2);
  for (var i = 7; i >= 0; i--) {
    var e = i + f, s = .08 * Math.pow(1.6, e), id = i - Math.floor(t / 2);
    c.save(); c.translate(w / 2, h / 2); c.rotate(e * .32); c.scale(s, s); c.font = FONT(h * .5); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.globalAlpha = clamp(1.15 - s / 2); c.fillStyle = ((id % 2) + 2) % 2 ? k.acc : k.paper; c.fillText('회오리', 0, 0); c.restore();
  }
  c.globalAlpha = 1;
};
TX['ring-text'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var S = '빨려 든다 · '.repeat(3).split(''), f = frac(t / 2);
  for (var i = 5; i >= 0; i--) {
    var e = i + f, R = h * .08 * Math.pow(1.55, e), id = i - Math.floor(t / 2), px = R * .3;
    c.globalAlpha = clamp(1.4 - R / (w * .9));
    S.forEach(function (ch, j) {
      var a = j * TAU / S.length + (((id % 2) + 2) % 2 ? 1 : -1) * W8(t) / 3;
      c.save(); c.translate(w / 2 + R * Math.cos(a), h / 2 + R * Math.sin(a)); c.rotate(a + Math.PI / 2); say(c, ch, 0, 0, px, ((id % 2) + 2) % 2 ? k.acc : k.paper); c.restore();
    });
  }
  c.globalAlpha = 1;
};
TX['text-orbit'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var rx = Math.min(w * .36, h * .9), ry = h * .26, S = '궤도를 돈다'.split('');
  c.setLineDash([3, 6]); c.strokeStyle = k.ink; c.globalAlpha = .4; c.beginPath(); c.ellipse(w / 2, h / 2, rx, ry, 0, 0, TAU); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
  var P = S.map(function (ch, i) { var a = W8(t) - i * .26; return [ch, Math.sin(a), Math.cos(a)]; }).sort(function (a, b) { return a[1] - b[1]; });
  P.forEach(function (p) { var s = .75 + .35 * p[1]; c.globalAlpha = .5 + .5 * (p[1] + 1) / 2; say(c, p[0], w / 2 + rx * p[2], h / 2 + ry * p[1], h * .24 * s, p[1] > 0 ? k.ink : k.deep); });
  c.globalAlpha = 1;
};
TX['text-cube'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var Wd = ['봄', '여름', '가을', '겨울'], i = Math.floor(t / 2) % 4, q = io((frac(t / 2) - .55) / .45), a = q * Math.PI / 2, S = h * .64, cx = w / 2, top = h / 2 - S / 2;
  var h1 = S * Math.cos(a), h2 = S * Math.sin(a);
  var face = function (y, hh, word, col, txt) { if (hh < 1) return; c.fillStyle = col; c.fillRect(cx - S / 2, y, S, hh); c.save(); c.beginPath(); c.rect(cx - S / 2, y, S, hh); c.clip(); c.translate(cx, y + hh / 2); c.scale(1, hh / S); say(c, word, 0, 0, S * .5, txt); c.restore(); };
  face(top + (S - h1 - h2) / 2, h2, Wd[(i + 1) % 4], k.deep, k.paper);
  face(top + (S - h1 - h2) / 2 + h2, h1, Wd[i], k.acc, k.ink);
};
TX['extrude-text'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var a = W8(t), dx = Math.cos(a), dy = Math.sin(a), px = h * .5;
  for (var d = 14; d > 0; d--) say(c, '입체', w / 2 + dx * d * h * .006, h / 2 + dy * d * h * .006, px, k.deep);
  say(c, '입체', w / 2, h / 2, px, k.acc);
};

// ── SWAP · 말을 바꿔 끼워요 ───────────────────────────────
TX['split-flap'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var Wd = ['서울행', '부산행', '대전행', '광주행'], n = 3, cw = h * .5, ch = h * .66, gap = cw * .12, x0 = w / 2 - (n * cw + (n - 1) * gap) / 2, y0 = h / 2 - ch / 2;
  for (var i = 0; i < n; i++) {
    var tt = t - i * .15, idx = Math.floor(tt / 2), p = frac(tt / 2) / .3, cur = Wd[((idx % 4) + 4) % 4][i], prev = Wd[(((idx - 1) % 4) + 4) % 4][i], x = x0 + i * (cw + gap);
    var cell = function (s, part, sy) {
      c.save(); c.beginPath(); c.rect(x, part ? y0 + ch / 2 : y0, cw, ch / 2); c.clip();
      c.translate(0, y0 + ch / 2); c.scale(1, sy); c.translate(0, -(y0 + ch / 2));
      c.fillStyle = k.paper; c.beginPath(); c.roundRect(x, y0, cw, ch, cw * .1); c.fill(); say(c, s, x + cw / 2, y0 + ch / 2, ch * .62, k.ink); c.restore();
    };
    if (p >= 1) { cell(cur, 0, 1); cell(cur, 1, 1); }
    else { cell(cur, 0, 1); cell(prev, 1, 1); if (p < .5) cell(prev, 0, 1 - p * 2); else cell(cur, 1, (p - .5) * 2); }
    c.fillStyle = k.ink; c.fillRect(x, y0 + ch / 2 - 1, cw, 2);
  }
};
TX['flip-cards'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var Wd = ['새소식', '신메뉴', '오픈일', '이벤트'], cw = h * .52, gap = cw * .14, x0 = w / 2 - (3 * cw + 2 * gap) / 2;
  for (var i = 0; i < 3; i++) {
    var tt = t - i * .18, idx = Math.floor(tt / 2), p = clamp(frac(tt / 2) / .4), s = Math.abs(Math.cos(p * Math.PI)), ch = (p < .5 ? Wd[(((idx - 1) % 4) + 4) % 4] : Wd[((idx % 4) + 4) % 4])[i];
    c.save(); c.translate(x0 + i * (cw + gap) + cw / 2, h / 2); c.scale(Math.max(.02, s), 1);
    c.fillStyle = k.ink; c.beginPath(); c.roundRect(-cw / 2, -cw * .62, cw, cw * 1.24, cw * .12); c.fill(); say(c, ch, 0, 0, cw * .62, k.paper); c.restore();
  }
};
TX['typewriter-swap'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var P = ['밤이 오기 전에', '다시 한 번 더'][Math.floor(t / 4) % 2], p = t % 4, n = P.length, shown = p < 2.2 ? Math.floor(p / 2.2 * (n + 1)) : p < 3 ? n : Math.max(0, n - Math.floor((p - 3) / .7 * n));
  var s = P.slice(0, shown), px = h * .22, x = w * .08;
  say(c, s, x, h / 2, px, k.ink, 'left', 700);
  if (Math.floor(t * 2.5) % 2 === 0 || (p < 2.2 || p > 3)) { c.fillStyle = k.acc; c.fillRect(x + tw(c, s, px, 700) + px * .08, h / 2 - px * .55, px * .08, px * 1.1); }
};
TX['slot-text'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var R = ['대박', '당첨', '축하', '완판'], cw = h * .52, gap = cw * .12, x0 = w / 2 - (2 * cw + gap) / 2, ch = h * .7, p = t % 4, round = Math.floor(t / 4) % 2;
  for (var i = 0; i < 2; i++) {
    var stop = 1.4 + i * .5, x = x0 + i * (cw + gap), v;
    if (p < stop) v = p * 9; else v = stop * 9 + (1 - Math.pow(1 - clamp((p - stop) / .4), 2)) * 1.2;
    var target = round * 2 + 1, base = Math.floor(v), f = v - base;
    c.save(); c.beginPath(); c.roundRect(x, h / 2 - ch / 2, cw, ch, cw * .1); c.clip(); c.fillStyle = k.paper; c.fillRect(x, 0, cw, h);
    for (var j = -1; j <= 1; j++) {
      var idx = p >= stop + .4 ? target : base + j, word = R[((idx % 4) + 4) % 4][i], y = h / 2 + (j - (p >= stop + .4 ? 0 : f)) * ch * .9;
      if (p >= stop + .4 && j) continue;
      say(c, word, x + cw / 2, y, ch * .62, (p >= stop + .4) ? k.acc : k.ink);
    }
    c.restore();
  }
};
TX['odometer'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var p = t % 4, v = 12480 * eo(clamp(p / 2.6)), px = Math.min(h * .42, w * .11), cw = px * .68, x0 = w / 2 - cw * 2.1;
  say(c, '누적', x0 - cw * .9, h / 2, h * .16, k.acc, 'right', 800);
  for (var i = 0; i < 5; i++) {
    var unit = Math.pow(10, 4 - i), dv = v / unit, d = Math.floor(dv) % 10, f = i === 4 ? frac(dv) : clamp((frac(dv) - .9) * 10), x = x0 + i * cw + (i > 1 ? cw * .3 : 0);
    c.save(); c.fillStyle = k.paper; c.beginPath(); c.roundRect(x - cw * .44, h / 2 - px * .62, cw * .88, px * 1.24, cw * .12); c.fill(); c.clip();
    say(c, String(d), x, h / 2 - f * px * 1.2, px, k.ink, 'center', 800); say(c, String((d + 1) % 10), x, h / 2 + (1 - f) * px * 1.2, px, k.ink, 'center', 800); c.restore();
    if (i === 1) say(c, ',', x + cw * .62, h / 2 + px * .32, px * .6, k.paper);
  }
  say(c, '명', x0 + cw * 5.3, h / 2, h * .16, k.acc, 'left', 800);
};
TX['headline-swap'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var Hd = ['신제품 출시', '가격 발표', '사전 공개', '오늘 마감'], i = Math.floor(t / 2) % 4, p = frac(t / 2), bh = h * .34, y = h * .3;
  c.fillStyle = k.ink; c.fillRect(0, y, w, bh);
  var lw = h * .5; c.fillStyle = k.paper; c.fillRect(0, y, lw, bh); say(c, '속보', lw / 2, y + bh / 2, bh * .5, k.ink);
  c.save(); c.beginPath(); c.rect(lw, y, w, bh); c.clip();
  var q = io(p / .3), outY = y + bh / 2 - q * bh, inY = y + bh / 2 + (1 - q) * bh;
  say(c, Hd[(i + 3) % 4], lw + h * .12, outY, bh * .52, k.paper, 'left'); say(c, Hd[i], lw + h * .12, inY, bh * .52, k.paper, 'left');
  c.restore();
};
TX['led-text'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var rows = 15, s = h / (rows + 2), S = ' 새 소식 도착 ·', cols = Math.ceil(w / s);
  var G = LED, key = S;
  if (!G[key]) {
    var o = document.createElement('canvas'), x = o.getContext('2d'); x.font = FONT(rows * .95, 800); var L = Math.ceil(x.measureText(S).width);
    o.width = L; o.height = rows; x.font = FONT(rows * .95, 800); x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText(S, 0, rows / 2 + .5);
    G[key] = { L: L, d: x.getImageData(0, 0, L, rows).data };
  }
  var B = G[key], off = Math.floor(frac(t / 8) * B.L * 2);
  for (var cI = 0; cI < cols; cI++) for (var r = 0; r < rows; r++) {
    var sx = (cI + off) % B.L, on = B.d[(r * B.L + sx) * 4 + 3] > 110;
    c.fillStyle = on ? k.acc : k.deep; c.globalAlpha = on ? 1 : .5; c.beginPath(); c.arc(cI * s + s / 2, (r + 1) * s + s / 2, s * .38, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
};
TX['split-halves'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var Wd = ['겉모습', '첫인상'], In = ['속마음', '진심'], i = Math.floor(t / 4) % 2, p = t % 4, q = p < .4 ? 0 : p < 1 ? eo((p - .4) / .6) : p < 3 ? 1 : p < 3.6 ? 1 - io((p - 3) / .6) : 0, px = fit(c, Wd[i], h * .46, w * .7), sh = q * w * .2;
  say(c, In[i], w / 2, h / 2, h * .26 * (.4 + .6 * q), k.acc);
  [[0, -1], [1, 1]].forEach(function (H) {
    c.save(); c.beginPath(); c.rect(0, H[0] ? h / 2 : 0, w, h / 2); c.clip(); c.translate(H[1] * sh, H[1] * q * h * .12);
    say(c, Wd[i], w / 2, h / 2, px, k.paper); c.restore();
  });
};

// ── STYLE · 보여 주는 방식으로 끌어올려요 ──────────────────
TX['outline-fill'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  c.save(); c.translate(w / 2, h / 2); c.rotate(-.12); c.translate(-w * .75, -h * .75);
  var px = h * .3, S = '질풍노도 · '.repeat(4), L = tw(c, S, px);
  for (var r = 0; r < 4; r++) {
    var y = r * px * 1.15 + px * .5, fp = clamp((t % 8 - r * 1.6) / 1.2), fillW = fp * w * 1.5;
    c.font = FONT(px); c.textAlign = 'left'; c.textBaseline = 'middle'; c.lineWidth = Math.max(1, h * .012); c.strokeStyle = k.acc; c.strokeText(S, -r * px, y);
    c.save(); c.beginPath(); c.rect(-r * px, y - px, fillW, px * 2); c.clip(); c.fillStyle = k.acc; c.fillText(S, -r * px, y); c.restore();
  }
  c.restore();
};
TX['glitch-slices'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var fr = Math.floor(t * 12) % 96, on = (fr % 24) < 6 || (fr % 24) === 13, n = 7, px = h * .56;
  for (var i = 0; i < n; i++) {
    var y0 = h / 2 - px * .55 + i * px * 1.1 / n, dx = on ? (hash(i * 7 + fr) - .5) * h * .5 : 0;
    c.save(); c.beginPath(); c.rect(0, y0, w, px * 1.1 / n + .5); c.clip();
    if (on) say(c, '붕괴', w / 2 + dx + h * .04, h / 2, px, k.ink);
    say(c, '붕괴', w / 2 + dx, h / 2, px, k.paper); c.restore();
  }
};
TX['pattern-mask'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  layer(c, w, h, function (x) {
    var P = h * .16, o = frac(t / 2) * P * 2;
    x.save(); x.translate(w / 2, h / 2); x.rotate(-Math.PI / 4); x.fillStyle = k.ink; x.fillRect(-w, -w, w * 2, w * 2); x.fillStyle = k.acc;
    for (var y = -w - P * 2; y < w; y += P * 2) x.fillRect(-w, y + o, w * 2, P); x.restore();
    x.globalCompositeOperation = 'destination-in'; say(x, '축제', w / 2, h / 2, h * .66, '#000');
  });
};
TX['long-shadow'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var a = W8(t), dx = Math.cos(a), dy = Math.sin(a), px = fit(c, '빛과 그림자', h * .42, w * .8);
  for (var d = 60; d > 0; d--) say(c, '빛과 그림자', w / 2 + dx * d * h * .012, h / 2 + dy * d * h * .012, px, k.acc);
  say(c, '빛과 그림자', w / 2, h / 2, px, k.paper);
};
TX['liquid-fill'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var px = h * .7, lv = h * .85 - (h * .7) * io(clamp((t % 4) / 3)) + (t % 4 > 3.6 ? (t % 4 - 3.6) / .4 * h : 0);
  c.font = FONT(px); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = h * .015; c.strokeStyle = k.paper; c.strokeText('가득', w / 2, h / 2);
  layer(c, w, h, function (x) {
    x.fillStyle = k.acc; x.beginPath(); x.moveTo(0, h);
    for (var X = 0; X <= w; X += 6) x.lineTo(X, lv + h * .03 * Math.sin(X / w * 14 + W8(t, 4)));
    x.lineTo(w, h); x.closePath(); x.fill();
    x.globalCompositeOperation = 'destination-in'; say(x, '가득', w / 2, h / 2, px, '#000');
  });
};
TX['highlighter'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc);
  var S = '말의 힘', px = h * .34, L = tw(c, S, px, 700), p = t % 4, q = eo((p - .3) / .6), fade = p > 3.4 ? 1 - (p - 3.4) / .6 : 1;
  c.fillStyle = k.paper; c.fillRect(w / 2 - L / 2 - px * .5, h / 2 - px * .8, L + px, px * 1.6);
  c.save(); c.globalAlpha = fade; c.fillStyle = k.acc; c.globalAlpha = .55 * fade; c.beginPath();
  c.moveTo(w / 2 - L / 2 - px * .2, h / 2 + px * .05); c.lineTo(w / 2 - L / 2 - px * .2 + (L + px * .4) * q, h / 2 - px * .02); c.lineTo(w / 2 - L / 2 - px * .2 + (L + px * .4) * q, h / 2 + px * .48); c.lineTo(w / 2 - L / 2 - px * .2, h / 2 + px * .52); c.closePath(); c.fill(); c.restore();
  say(c, S, w / 2, h / 2, px, k.ink, 'center', 700);
};
TX['split-invert'] = function (c, w, h, t, k) {
  var X = w / 2 + w * .32 * Math.sin(W8(t)), sl = h * .4, px = h * .58;
  var side = function (left, bg, fg) {
    c.save(); c.beginPath(); if (left) { c.moveTo(0, 0); c.lineTo(X + sl, 0); c.lineTo(X - sl, h); c.lineTo(0, h); } else { c.moveTo(X + sl, 0); c.lineTo(w, 0); c.lineTo(w, h); c.lineTo(X - sl, h); }
    c.closePath(); c.clip(); bgc(c, w, h, bg); say(c, '반전', w / 2, h / 2, px, fg); c.restore();
  };
  side(true, k.paper, k.ink); side(false, k.ink, k.paper);
};
TX['text-echo'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var pos = function (tt) { var a = W8(tt); return [w / 2 + w * .28 * Math.sin(a), h / 2 + h * .2 * Math.sin(2 * a)]; };
  for (var j = 10; j >= 0; j--) { var P = pos(t - j * .07); c.globalAlpha = j ? .5 * (1 - j / 11) : 1; say(c, '잔상', P[0], P[1], h * .4, j ? k.acc : k.paper); }
  c.globalAlpha = 1;
};

if (typeof module !== 'undefined') module.exports = { TX: TX };
