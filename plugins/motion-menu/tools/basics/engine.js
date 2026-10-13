// 모션 기본기 24 — 캔버스 그리기 함수 묶음 (의존성 0)
// 메뉴판 여기저기(③ 전환 · ④ 키네틱 · ⑤ 타이밍 · ⑥ 효과 · ⑦ 화면 전환)에 흩어진 기본기 24개를 한 결로 다시 그린 것.
// 홍보 영상(render.mjs)은 24개 전부를, 갤러리 데모(demos/m11-basics.html)는 메뉴판에 새로 넣은 8개만 쓴다.
// 나머지 16개의 갤러리 데모는 원래 코스의 CSS 데모 그대로다.
//
// BS[id](c, w, h, t, k)   t: 초, 8초에 한 바퀴   k: { acc, deep, paper, ink }

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
var dot = function (c, x, y, r) { if (r > .3) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } };
var heart = function (c, x, y, s) { c.beginPath(); c.moveTo(x, y + s * .35); c.bezierCurveTo(x - s * .9, y - s * .3, x - s * .45, y - s * .95, x, y - s * .45); c.bezierCurveTo(x + s * .45, y - s * .95, x + s * .9, y - s * .3, x, y + s * .35); c.fill(); };
// 밤 · 낮 두 장면 (바꿈 묶음이 같이 쓴다)
var night = function (c, w, h, k) { bgc(c, w, h, k.ink); c.fillStyle = k.paper; for (var i = 0; i < 9; i++) dot(c, hash(i) * w, hash(i + 9) * h, h * .012); say(c, '밤', w * .4, h / 2, h * .5, k.paper); c.fillStyle = k.acc; dot(c, w * .66, h * .45, h * .16); c.fillStyle = k.ink; dot(c, w * .7, h * .4, h * .15); };
var day = function (c, w, h, k) { bgc(c, w, h, k.paper); c.fillStyle = k.acc; c.globalAlpha = .25; dot(c, w * .3, h / 2, h * .26); c.globalAlpha = 1; dot(c, w * .3, h / 2, h * .18); say(c, '낮', w * .62, h / 2, h * .5, k.ink); };
/*@end*/

var BS = {};

// ── APPEAR · 나오는 법 ────────────────────────────────────
BS['pop-in'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var p = frac(t / 2), s = p < .3 ? back(p / .3) : p > .85 ? 1 - io((p - .85) / .15) : 1, S = h * .5;
  c.fillStyle = k.deep; c.globalAlpha = .5; c.beginPath(); c.ellipse(w / 2, h * .84, S * .45 * s, S * .07 * s, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
  c.save(); c.translate(w / 2, h / 2); c.scale(s, s); c.rotate((1 - s) * .4);
  c.fillStyle = k.acc; c.beginPath(); c.roundRect(-S / 2, -S / 2, S, S, S * .24); c.fill();
  c.fillStyle = k.paper; c.beginPath(); for (var i = 0; i < 10; i++) { var r = i % 2 ? S * .14 : S * .3, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(r * Math.cos(a), r * Math.sin(a)); } c.closePath(); c.fill();
  c.restore();
};
BS['stagger'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var p = t % 4, n = 7, bw = w * .07, gap = (w * .8 - n * bw) / (n - 1), base = h * .86, cols = [k.acc, k.paper, k.deep];
  c.fillStyle = k.deep; c.fillRect(w * .08, base, w * .84, 2);
  for (var i = 0; i < n; i++) {
    var q = back((p - .2 - i * .14) / .45) * (p > 3.5 ? 1 - io((p - 3.5) / .4) : 1), H = h * (.2 + .09 * i) * Math.max(0, q), x = w * .1 + i * (bw + gap);
    c.fillStyle = cols[i % 3]; c.beginPath(); c.roundRect(x, base - H, bw, H, [bw * .3, bw * .3, 0, 0]); c.fill();
    c.fillStyle = k.paper; if (q > .9) dot(c, x + bw / 2, base - H - h * .06, h * .02);
  }
};
BS['burst'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var p = frac(t / 2), s = p < .12 ? .6 + .7 * eo(p / .12) : 1.3 - .3 * eo((p - .12) / .3);
  for (var i = 0; i < 10; i++) {
    var a = i * TAU / 10, d = h * (.18 + .3 * eo((p - .08) / .5)), al = clamp(1 - (p - .1) / .5);
    if (p < .08 || al <= 0) continue;
    c.globalAlpha = al; c.fillStyle = i % 2 ? k.acc : k.paper; dot(c, w / 2 + d * Math.cos(a) * 1.3, h / 2 + d * Math.sin(a), h * .025);
  }
  c.globalAlpha = 1; c.fillStyle = k.acc; heart(c, w / 2, h / 2 + h * .06, h * .34 * s);
};
BS['line-draw'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var p = t % 4, q = io(clamp((p - .2) / 1.6)) * (p > 3.5 ? 0 : 1), x0 = w * .1, x1 = w * .88, y0 = h * .8;
  c.strokeStyle = k.deep; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, h * .12); c.lineTo(x0, y0); c.lineTo(x1, y0); c.stroke();
  var f = function (u) { return y0 - h * (.08 + .5 * u) - h * .12 * Math.sin(u * TAU * 1.5); }, N = 60, M = Math.floor(N * q);
  c.strokeStyle = k.acc; c.lineWidth = h * .035; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
  for (var i = 0; i <= M; i++) { var u = i / N, x = x0 + (x1 - x0 - w * .04) * u; if (i) c.lineTo(x, f(u)); else c.moveTo(x, f(u)); }
  c.stroke();
  if (M > 2) { var u2 = M / N, ux = x0 + (x1 - x0 - w * .04) * u2, uy = f(u2), a = Math.atan2(f(u2) - f(u2 - .02), (x1 - x0 - w * .04) * .02); c.save(); c.translate(ux, uy); c.rotate(a); c.beginPath(); c.moveTo(-h * .08, -h * .06); c.lineTo(0, 0); c.lineTo(-h * .08, h * .06); c.stroke(); c.restore(); }
};
BS['mask-reveal'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var p = t % 4, q = eo((p - .2) / .6), u = eo((p - .7) / .5), out = p > 3.5 ? io((p - 3.5) / .4) : 0, px = Math.min(h * .4, w * .17);
  c.save(); c.beginPath(); c.rect(0, h * .1, w, h * .48); c.clip(); say(c, '안녕하세요', w / 2, h * .36 + (1 - q + out) * h * .5, px, k.paper); c.restore();
  c.fillStyle = k.acc; var L = tw(c, '안녕하세요', px) * u * (1 - out); c.fillRect(w / 2 - L / 2, h * .62, L, h * .03);
  c.save(); c.beginPath(); c.rect(0, h * .66, w, h * .3); c.clip(); say(c, '처음 뵙겠습니다', w / 2, h * .78 + (1 - eo((p - .9) / .5) + out) * h * .3, px * .38, k.acc, 'center', 800); c.restore();
};
BS['type-on'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var p = t % 4, S = '고양이 영상', n = Math.min(S.length, Math.floor(clamp((p - .3) / 1.8) * (S.length + 1))), bw = w * .78, bh = h * .4, x = w / 2 - bw / 2, y = h / 2 - bh / 2;
  if (p > 3.6) n = 0;
  c.fillStyle = k.paper; c.beginPath(); c.roundRect(x, y, bw, bh, bh / 2); c.fill();
  var s = S.slice(0, n), px = bh * .42; say(c, s, x + bh * .45, h / 2, px, k.ink, 'left', 700);
  if (Math.floor(t * 2.5) % 2 === 0 || n < S.length) { c.fillStyle = k.acc; c.fillRect(x + bh * .45 + tw(c, s, px, 700) + 2, h / 2 - px * .55, px * .09, px * 1.1); }
  c.fillStyle = n === S.length ? k.acc : k.deep; dot(c, x + bw - bh / 2, h / 2, bh * .32);
  c.strokeStyle = k.paper; c.lineWidth = bh * .07; c.beginPath(); c.moveTo(x + bw - bh / 2, h / 2 + bh * .16); c.lineTo(x + bw - bh / 2, h / 2 - bh * .14); c.moveTo(x + bw - bh / 2 - bh * .12, h / 2 - bh * .02); c.lineTo(x + bw - bh / 2, h / 2 - bh * .14); c.lineTo(x + bw - bh / 2 + bh * .12, h / 2 - bh * .02); c.stroke();
};
BS['count-up'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var p = t % 4, q = eo(clamp((p - .2) / 2.4)) * (p > 3.6 ? 0 : 1), v = Math.round(2454 * q), px = Math.min(h * .42, w * .14);
  c.fillStyle = k.acc; dot(c, w * .2, h * .44, px * .42);
  c.strokeStyle = k.ink; c.lineWidth = px * .08; c.lineCap = 'round'; c.beginPath(); c.moveTo(w * .2, h * .44 + px * .2); c.lineTo(w * .2, h * .44 - px * .2); c.moveTo(w * .2 - px * .16, h * .44 - px * .04); c.lineTo(w * .2, h * .44 - px * .2); c.lineTo(w * .2 + px * .16, h * .44 - px * .04); c.stroke();
  say(c, v.toLocaleString('en-US'), w * .3, h * .44, px, k.paper, 'left');
  c.fillStyle = k.deep; c.beginPath(); c.roundRect(w * .14, h * .74, w * .72, h * .06, h * .03); c.fill();
  c.fillStyle = k.acc; c.beginPath(); c.roundRect(w * .14, h * .74, w * .72 * q, h * .06, h * .03); c.fill();
};
BS['kinetic-typography'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var S = '빙글빙글', px = Math.min(h * .36, w * .2), gap = px * 1.02, x0 = w / 2 - gap * 1.5;
  for (var i = 0; i < 4; i++) {
    var a = W8(t, 4) - i * .9, y = h / 2 - Math.abs(Math.sin(a)) * h * .16;
    c.save(); c.translate(x0 + i * gap, y); c.rotate(Math.sin(a) * .35); say(c, S[i], 0, 0, px, i % 2 ? k.paper : k.acc); c.restore();
  }
};

// ── FEEL · 움직임의 맛 ────────────────────────────────────
BS['easing'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var p = frac(t / 2), u = p < .5 ? p * 2 : 2 - p * 2, x0 = w * .3, x1 = w * .88, s = h * .2;
  [['일정', u, .32, k.deep], ['완급', io(u), .7, k.acc]].forEach(function (r) {
    say(c, r[0], w * .05, h * r[2], h * .14, r[3] === k.acc ? k.acc : k.paper, 'left', 800);
    c.fillStyle = k.deep; for (var i = 0; i < 9; i++) dot(c, x0 + (x1 - x0) * i / 8, h * r[2], h * .012);
    c.fillStyle = r[3] === k.acc ? k.acc : k.paper; c.beginPath(); c.roundRect(x0 + (x1 - x0) * r[1] - s / 2, h * r[2] - s / 2, s, s, s * .25); c.fill();
  });
};
BS['overshoot'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var p = t % 4, q = p < 2 ? back(p / .9) : 1 - io((p - 3) / .8), cx = w / 2, cy = h * .84, R = h * .62, a = Math.PI + q * Math.PI * .78;
  c.strokeStyle = k.deep; c.lineWidth = h * .08; c.beginPath(); c.arc(cx, cy, R, Math.PI, TAU); c.stroke();
  c.strokeStyle = k.acc; c.lineWidth = h * .025; c.beginPath(); var ta = Math.PI * 1.78; c.moveTo(cx + R * .85 * Math.cos(ta), cy + R * .85 * Math.sin(ta)); c.lineTo(cx + R * 1.12 * Math.cos(ta), cy + R * 1.12 * Math.sin(ta)); c.stroke();
  c.strokeStyle = k.paper; c.lineWidth = h * .03; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + R * .78 * Math.cos(a), cy + R * .78 * Math.sin(a)); c.stroke();
  c.fillStyle = k.acc; dot(c, cx, cy, h * .05);
};
BS['squash-stretch'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var p = frac(t), y = Math.abs(Math.cos(p * Math.PI)), gy = h * .82, r = h * .14, near = 1 - y;
  var sx = near > .85 ? 1 + (near - .85) * 3 : 1 - y * .12, sy = near > .85 ? 1 - (near - .85) * 3 : 1 + y * .18;
  c.fillStyle = k.deep; c.fillRect(w * .1, gy, w * .8, 2);
  c.save(); c.translate(w / 2, gy - y * h * .42); c.scale(sx, sy); c.fillStyle = k.acc; c.beginPath(); c.ellipse(0, -r, r * 1.2, r, 0, 0, TAU); c.fill();
  c.fillStyle = k.paper; dot(c, -r * .4, -r * 1.1, r * .16); dot(c, r * .4, -r * 1.1, r * .16); c.restore();
};
BS['shape-morph'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var i = ((Math.floor(t / 2) % 4) + 4) % 4, q = io(clamp((frac(t / 2) - .5) / .5)), S = [[1, .24], [1, .5], [1.5, .2], [.8, .08]], a = S[i], b = S[(i + 1) % 4];
  var sx = a[0] + (b[0] - a[0]) * q, rr = a[1] + (b[1] - a[1]) * q, H = h * .5, W = H * sx;
  c.save(); c.translate(w / 2, h * .46); c.rotate(q * Math.PI / 2 * (i % 2 ? 1 : 0)); c.fillStyle = k.acc; c.beginPath(); c.roundRect(-W / 2, -H / 2, W, H, Math.min(W, H) * rr); c.fill(); c.restore();
  for (var j = 0; j < 4; j++) { c.fillStyle = j === i ? k.paper : k.deep; dot(c, w / 2 + (j - 1.5) * h * .1, h * .86, h * .025); }
};
BS['liquid-motion'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var cx = w / 2 + w * .3 * Math.sin(W8(t)), cy = h / 2 + h * .06 * Math.sin(W8(t, 2)), R = h * .26, v = Math.cos(W8(t));
  c.fillStyle = k.acc; c.beginPath();
  for (var a = 0; a <= TAU + .01; a += TAU / 64) {
    var r = R * (1 + .12 * Math.sin(3 * a + W8(t, 3)) + .08 * Math.sin(5 * a - W8(t, 2)) - .18 * v * Math.cos(a));
    if (a) c.lineTo(cx + r * Math.cos(a) * 1.1, cy + r * Math.sin(a)); else c.moveTo(cx + r * Math.cos(a) * 1.1, cy + r * Math.sin(a));
  }
  c.fill(); c.fillStyle = k.paper; c.globalAlpha = .7; c.beginPath(); c.ellipse(cx - R * .35, cy - R * .4, R * .16, R * .1, -.5, 0, TAU); c.fill(); c.globalAlpha = 1;
};
BS['motion-trail'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var pos = function (tt) { var p = frac(tt / 2), a = Math.PI * (1.05 + .9 * io(p)); return [w / 2 + w * .32 * Math.cos(a), h * .85 + h * .62 * Math.sin(a)]; };
  for (var j = 14; j >= 0; j--) { var P = pos(t - j * .025); if (frac((t - j * .025) / 2) > frac(t / 2)) continue; c.globalAlpha = j ? .55 * (1 - j / 15) : 1; c.fillStyle = j ? k.acc : k.paper; dot(c, P[0], P[1], h * (.09 - j * .003)); }
  c.globalAlpha = 1;
};
BS['particles'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var p = frac(t / 2), cols = [k.acc, k.paper, k.deep];
  for (var i = 0; i < 40; i++) {
    var a = -Math.PI / 2 + (hash(i) - .5) * 1.8, v = h * (1 + 1.4 * hash(i + 4)), tt = p * 1.1;
    var x = w / 2 + Math.cos(a) * v * tt * .9, y = h * .9 + Math.sin(a) * v * tt + h * 1.6 * tt * tt, s = h * (.02 + .02 * hash(i + 8));
    c.save(); c.globalAlpha = clamp(1.2 - p * 1.2); c.translate(x, y); c.rotate(tt * 6 + i); c.fillStyle = cols[i % 3];
    if (i % 3 === 0) c.fillRect(-s, -s, s * 2, s * 2); else if (i % 3 === 1) dot(c, 0, 0, s); else { c.beginPath(); c.moveTo(0, -s * 1.2); c.lineTo(s, s); c.lineTo(-s, s); c.closePath(); c.fill(); }
    c.restore();
  }
  c.fillStyle = k.paper; c.beginPath(); c.roundRect(w / 2 - h * .12, h * .86, h * .24, h * .1, h * .03); c.fill();
};
BS['parallax'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  c.fillStyle = k.paper; for (var i = 0; i < 12; i++) dot(c, frac(hash(i) - t / 8) * w, hash(i + 5) * h * .5, h * .01);
  c.fillStyle = k.acc; dot(c, w * .78, h * .26, h * .1);
  var layer = function (L, col, hh, sp, kind) {
    var o = frac(t * sp / 8) * L; c.fillStyle = col;
    for (var x = -o - L; x < w + L; x += L) {
      if (kind === 0) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + L * .5, h * (1 - hh)); c.lineTo(x + L, h); c.fill(); }
      else if (kind === 1) { c.beginPath(); c.moveTo(x + L * .5, h * (1 - hh)); c.lineTo(x + L * .7, h * .86); c.lineTo(x + L * .3, h * .86); c.fill(); c.fillRect(x + L * .48, h * .86, L * .04, h * .1); }
      else { c.beginPath(); c.ellipse(x + L / 2, h * 1.02, L * .55, h * hh, 0, Math.PI, TAU); c.fill(); }
    }
  };
  layer(w * .32, k.deep, .55, 1, 0); layer(w * .22, k.acc, .5, 2, 1); layer(w * .5, k.paper, .16, 4, 2);
};

// ── SWITCH · 바꿈과 보여 주기 ─────────────────────────────
var dir2 = function (t) { var i = Math.floor(t / 2) % 2, p = frac(t / 2); return [i, p]; };
BS['wipe'] = function (c, w, h, t, k) {
  var d = dir2(t), q = io((d[1] - .3) / .6), S = [night, day];
  S[d[0]](c, w, h, k);
  c.save(); c.beginPath(); c.rect(0, 0, w * q, h); c.clip(); S[1 - d[0]](c, w, h, k); c.restore();
  if (q > 0 && q < 1) { c.fillStyle = k.acc; c.fillRect(w * q - h * .03, 0, h * .03, h); }
};
BS['circle-wipe'] = function (c, w, h, t, k) {
  var d = dir2(t), q = io((d[1] - .3) / .6), S = [night, day], cx = d[0] ? w * .66 : w * .3;
  S[d[0]](c, w, h, k);
  c.save(); c.beginPath(); c.arc(cx, h / 2, Math.hypot(w, h) * q, 0, TAU); c.clip(); S[1 - d[0]](c, w, h, k); c.restore();
};
BS['drip-wipe'] = function (c, w, h, t, k) {
  var d = dir2(t), q = io((d[1] - .2) / .7), S = [night, day];
  S[d[0]](c, w, h, k);
  c.save(); c.beginPath(); c.moveTo(0, 0); var n = 9;
  for (var i = 0; i <= n; i++) { var x = w * i / n, L = h * (q * 1.6 - .3 + .3 * hash(i + d[0] * 9)); if (q <= 0) L = -h; c.lineTo(x - w / n * .3, L - h * .1); c.arc(x, L, w / n * .3, Math.PI, 0, true); }
  c.lineTo(w, 0); c.closePath(); c.clip(); S[1 - d[0]](c, w, h, k); c.restore();
};
BS['screen-dive'] = function (c, w, h, t, k) {
  var d = dir2(t), p = d[1], S = [night, day], q = ei3((p - .25) / .6);
  function ei3(v) { v = clamp(v); return v * v * v; }
  S[1 - d[0]](c, w, h, k);
  var s = 1 + q * 30, cx = d[0] ? w * .3 : w * .66;
  var hr = h * .17 * eo((p - .1) / .15);
  if (q < 1) { c.save(); c.translate(cx, h / 2); c.scale(s, s); c.translate(-cx, -h / 2); c.beginPath(); c.rect(-w * 2, -h * 2, w * 5, h * 5); if (hr > .5) c.arc(cx, h / 2, hr, 0, TAU, true); c.clip(); S[d[0]](c, w, h, k); c.restore(); }
};
BS['grid-flip'] = function (c, w, h, t, k) {
  var d = dir2(t), S = [night, day], cols = 6, rows = 3, cw = w / cols, ch = h / rows;
  if (d[1] < .25) return S[d[0]](c, w, h, k);
  if (d[1] > .84) return S[1 - d[0]](c, w, h, k);
  bgc(c, w, h, k.ink);
  for (var i = 0; i < cols * rows; i++) {
    var cx = i % cols, cy = Math.floor(i / cols), q = clamp((d[1] - .25 - (cx + cy) * .04) / .3), s = Math.cos(q * Math.PI), sc = S[s > 0 ? d[0] : 1 - d[0]];
    c.save(); c.translate((cx + .5) * cw, 0); c.scale(Math.max(.02, Math.abs(s)), 1); c.translate(-(cx + .5) * cw, 0);
    c.beginPath(); c.rect(cx * cw + .5, cy * ch + .5, cw - 1, ch - 1); c.clip(); sc(c, w, h, k); c.restore();
  }
};
BS['light-sweep'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var bw = w * .74, bh = h * .44, x = w / 2 - bw / 2, y = h / 2 - bh / 2, p = frac(t / 2), sx = x - bw * .3 + (bw * 1.6) * io(clamp((p - .3) / .5));
  c.fillStyle = k.acc; c.beginPath(); c.roundRect(x, y, bw, bh, bh * .3); c.fill();
  c.save(); c.beginPath(); c.roundRect(x, y, bw, bh, bh * .3); c.clip();
  c.fillStyle = k.paper; c.globalAlpha = .55; c.beginPath(); c.moveTo(sx, y); c.lineTo(sx + bh * .35, y); c.lineTo(sx + bh * .05, y + bh); c.lineTo(sx - bh * .3, y + bh); c.closePath(); c.fill(); c.restore();
  say(c, '★ 프리미엄', w / 2, h / 2, bh * .44, k.paper);
};
BS['glitch'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var fr = Math.floor(t * 12) % 96, on = (fr % 24) < 4 || (fr % 24) === 11, px = Math.min(h * .48, w * .24), j = on ? (hash(fr) - .5) * h * .2 : 0;
  if (on) { c.globalAlpha = .9; say(c, '글리치', w / 2 + j - h * .03, h / 2, px, k.acc); say(c, '글리치', w / 2 - j + h * .03, h / 2, px, '#3FB8E8'); c.globalAlpha = 1; }
  say(c, '글리치', w / 2 + j * .3, h / 2, px, k.paper);
  if (on) for (var i = 0; i < 3; i++) { c.fillStyle = k.ink; c.fillRect(0, hash(fr + i) * h, w, h * .03); }
};
BS['impact-shake'] = function (c, w, h, t, k) {
  var p = frac(t / 2), sh = p > .14 && p < .5 ? (1 - (p - .14) / .36) * h * .05 : 0, dx = Math.sin(p * 120) * sh, dy = Math.cos(p * 97) * sh * .7;
  bgc(c, w, h, k.ink);
  c.save(); c.translate(dx, dy);
  c.fillStyle = k.deep; [[.06, .5], [.2, .62], [.72, .55], [.86, .42]].forEach(function (b) { c.fillRect(b[0] * w, h * b[1], w * .1, h); });
  c.fillRect(0, h * .9, w, 2);
  var s = p < .14 ? 2.6 - 1.6 * ei(p / .14) : 1; function ei(v) { return v * v; }
  c.translate(w / 2, h * .58); c.scale(s, s); c.rotate(-.05);
  c.fillStyle = k.acc; c.beginPath(); c.roundRect(-h * .55, -h * .2, h * 1.1, h * .4, h * .06); c.fill(); say(c, '세일', 0, 0, h * .3, k.paper);
  c.restore();
};

if (typeof module !== 'undefined') module.exports = { BS: BS };
