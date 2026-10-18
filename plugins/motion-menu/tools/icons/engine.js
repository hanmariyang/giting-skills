// 아이콘·로고 몸짓 24 — 캔버스 그리기 함수 묶음 (의존성 0)
// 갤러리 데모(demos/m16-icon-motion.html)와 홍보 영상(render.mjs)이 같은 함수를 쓴다.
// 정본은 이 파일 하나. 데모를 고치려면 여기를 고치고 `node tools/icons/gen.mjs` → `node build.mjs`.
//
// IC[id](c, w, h, t, k)
//   c: 2D 컨텍스트 (0,0 ~ w,h 가 칸)   t: 초. 8초에 한 바퀴. DRAW·POP·REACT 는 0.4초 비고 → 들어와 머물고 → 7.2~8초 사라짐,
//   LOOP 는 처음부터 끝까지 이어지는 반복이다.
//   k: { acc, deep, paper, ink }
// 로고는 이 파일에서 만든 추상 도형(MARK)이다. 남의 로고를 쓰지 않는다.

/*@helpers*/
var TAU = Math.PI * 2;
var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
var eo = function (t) { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
var io = function (t) { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
var back = function (t) { t = clamp(t); var s = 1.7; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
var elastic = function (t) { t = clamp(t); return t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * TAU / 3) + 1; };
var lerp = function (a, b, t) { return a + (b - a) * t; };
var bgc = function (c, w, h, col) { c.fillStyle = col; c.fillRect(0, 0, w, h); };
var lerpC = function (a, b, t) { return '#' + [1, 3, 5].map(function (i) { return Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0'); }).join(''); };
var hash = function (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
var P8 = function (t) { var p = t % 8; return p < 0 ? p + 8 : p; };
var seg = function (t, a, d) { return clamp((P8(t) - a) / d); };
var outA = function (t) { return 1 - clamp((P8(t) - 7.2) / .8); };
var SANS = '-apple-system,"Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif';
var rrect = function (c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, Math.max(0, w), Math.max(0, h), Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))); };
var disc = function (c, x, y, r) { if (r > .2) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } };
// 점 배열(정규 좌표 -1~1)을 칸 가운데 크기 s 로 옮긴다
var place = function (pts, cx, cy, s) { return pts.map(function (p) { return [cx + p[0] * s, cy + p[1] * s]; }); };
var plen = function (pts) { var L = 0; for (var i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
var poly = function (c, pts, close) { c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); if (close) c.closePath(); };
// 선을 e(0~1)만큼만 그린다
var strokePart = function (c, pts, e) { var L = plen(pts); c.setLineDash([L * clamp(e), L + 1]); poly(c, pts, false); c.stroke(); c.setLineDash([]); };
// 마크: 둥근 사각 안에 꺾인 번개 모양 하나 (이 엔진에서 만든 추상 도형)
var MARK_OUT = (function () { var r = .78, n = 40, pts = []; for (var i = 0; i <= n; i++) { var a = -Math.PI / 2 + TAU * i / n; var sx = Math.cos(a), sy = Math.sin(a); var q = Math.pow(Math.abs(sx), .55) * Math.sign(sx), u = Math.pow(Math.abs(sy), .55) * Math.sign(sy); pts.push([q * r, u * r]); } return pts; })();
var MARK_IN = [[.12, -.5], [-.24, .06], [.06, .06], [-.12, .5], [.26, -.08], [-.04, -.08], [.12, -.5]];
var markFill = function (c, cx, cy, s, k, a) {
  c.fillStyle = k.acc; poly(c, place(MARK_OUT, cx, cy, s), true); c.fill();
  c.fillStyle = k.paper; poly(c, place(MARK_IN, cx, cy, s), true); c.fill();
};
var CHECK = [[-.5, .02], [-.14, .38], [.52, -.36]];
var HEART = (function () { var p = []; for (var i = 0; i <= 60; i++) { var a = TAU * i / 60, x = 16 * Math.pow(Math.sin(a), 3), y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); p.push([x / 17, y / 17 - .05]); } return p; })();
var STAR = (function () { var p = []; for (var i = 0; i <= 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .4 : .9; p.push([Math.cos(a) * r, Math.sin(a) * r + .05]); } return p; })();
var bell = function (c, cx, cy, s) {
  c.beginPath(); c.moveTo(cx - s * .55, cy + s * .35); c.quadraticCurveTo(cx - s * .45, cy + s * .2, cx - s * .42, cy - s * .1);
  c.bezierCurveTo(cx - s * .4, cy - s * .55, cx + s * .4, cy - s * .55, cx + s * .42, cy - s * .1);
  c.quadraticCurveTo(cx + s * .45, cy + s * .2, cx + s * .55, cy + s * .35); c.closePath(); c.fill();
  disc(c, cx, cy + s * .48, s * .11); disc(c, cx, cy - s * .52, s * .07);
};
/*@end*/

var IC = {};

// ── DRAW · 그려지며 나타나기 ───────────────────────────────────
IC['logo-trace'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var s = h * .36, cx = w / 2, cy = h / 2, e = io(seg(t, .4, 2.2)), f = io(seg(t, 2.2, 1));
  c.lineWidth = h * .03; c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = k.acc; strokePart(c, place(MARK_OUT, cx, cy, s), e);
  c.strokeStyle = k.paper; strokePart(c, place(MARK_IN, cx, cy, s), f);
  c.globalAlpha = 1;
};
IC['stroke-then-fill'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var s = h * .36, cx = w / 2, cy = h / 2, e = io(seg(t, .4, 1.6)), f = eo(seg(t, 2.1, .7));
  c.save(); c.globalAlpha *= f; markFill(c, cx, cy, s, k); c.restore();
  c.globalAlpha = outA(t) * (1 - f * .9);
  c.lineWidth = h * .025; c.lineJoin = 'round'; c.strokeStyle = k.ink;
  strokePart(c, place(MARK_OUT, cx, cy, s), e); strokePart(c, place(MARK_IN, cx, cy, s), e);
  c.globalAlpha = 1;
};
IC['logo-wipe'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var s = h * .36, cx = w / 2, cy = h / 2, e = io(seg(t, .4, 1.4)), x = cx - s * 1.1 + s * 2.2 * e;
  c.save(); c.beginPath(); c.rect(0, 0, x, h); c.clip(); markFill(c, cx, cy, s, k); c.restore();
  if (e > 0 && e < 1) { c.fillStyle = k.paper; c.fillRect(x - h * .008, cy - s, h * .016, s * 2); }
  c.globalAlpha = 1;
};
IC['dot-assemble'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var s = h * .36, cx = w / 2, cy = h / 2, pts = place(MARK_OUT, cx, cy, s), f = eo(seg(t, 2.4, .5));
  pts.forEach(function (p, i) {
    var e = io(seg(t, .4 + hash(i) * .8, 1.2)), a = hash(i + 9) * TAU, d = h * (.8 + hash(i + 3));
    var x = lerp(p[0] + Math.cos(a) * d, p[0], e), y = lerp(p[1] + Math.sin(a) * d, p[1], e);
    c.fillStyle = k.acc; disc(c, x, y, h * .025 * (1 - f));
  });
  c.save(); c.globalAlpha *= f; markFill(c, cx, cy, s, k); c.restore();
  c.globalAlpha = 1;
};
IC['stamp-in'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var s = h * .36, cx = w / 2, cy = h / 2, p = seg(t, .4, .35), sc = lerp(2.2, 1, io(p)), hit = seg(t, .75, .3);
  if (P8(t) < .4) { c.globalAlpha = 1; return; }
  var shake = hit > 0 && hit < 1 ? Math.sin(hit * 30) * h * .02 * (1 - hit) : 0;
  c.save(); c.translate(cx + shake, cy); c.rotate(-.12 * (1 - io(p))); c.scale(sc, sc); c.globalAlpha *= clamp(p * 2.5);
  markFill(c, 0, 0, s, k); c.restore();
  if (hit > 0 && hit < 1) { c.strokeStyle = k.acc; c.globalAlpha = outA(t) * (1 - hit); c.lineWidth = h * .015; c.beginPath(); c.arc(cx, cy, s * (1.1 + hit * .5), 0, TAU); c.stroke(); }
  c.globalAlpha = 1;
};
IC['split-join'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var s = h * .36, cx = w / 2, cy = h / 2, e = back(seg(t, .4, .9)), off = (1 - e) * w * .45;
  c.save(); c.beginPath(); c.rect(0, 0, cx, h); c.clip(); c.translate(-off, 0); markFill(c, cx, cy, s, k); c.restore();
  c.save(); c.beginPath(); c.rect(cx, 0, w - cx, h); c.clip(); c.translate(off, 0); markFill(c, cx, cy, s, k); c.restore();
  var fl = clamp(1 - Math.abs(P8(t) - 1.35) / .15);
  if (fl > 0) { c.fillStyle = k.paper; c.globalAlpha = outA(t) * fl; c.fillRect(cx - h * .01, cy - s, h * .02, s * 2); }
  c.globalAlpha = 1;
};

// ── POP · 튀어 오르기 ──────────────────────────────────────
IC['icon-bounce'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var s = h * .3, cx = w / 2, base = h * .5, p = seg(t, .4, 1.4), y;
  var fall = clamp(p / .35);
  y = p < .35 ? lerp(-h * .4, base, fall * fall) : base - Math.abs(Math.sin((p - .35) / .65 * Math.PI * 2)) * h * .2 * (1 - (p - .35) / .65);
  c.fillStyle = 'rgba(20,22,27,.12)'; c.beginPath(); c.ellipse(cx, base + s * .95, s * .7 * (1 - (base - y) / h), s * .12, 0, 0, TAU); c.fill();
  markFill(c, cx, y, s, k);
  c.globalAlpha = 1;
};
IC['squash-pop'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var s = h * .34, cx = w / 2, cy = h / 2, p = seg(t, .4, 1.1);
  var sx = 1 + .35 * Math.sin(p * Math.PI * 3) * (1 - p), sy = 1 - .35 * Math.sin(p * Math.PI * 3) * (1 - p), g = elastic(p);
  c.save(); c.translate(cx, cy + s); c.scale(sx * g, sy * g); markFill(c, 0, -s, s, k); c.restore();
  c.globalAlpha = 1;
};
IC['orbit-in'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var s = h * .3, cx = w / 2, cy = h / 2, e = io(seg(t, .4, 1.8)), a = (1 - e) * TAU * 1.25, r = (1 - e) * h * .6;
  for (var i = 3; i >= 1; i--) { var ee = io(seg(t, .4 - i * .06, 1.8)), aa = (1 - ee) * TAU * 1.25, rr = (1 - ee) * h * .6; c.save(); c.globalAlpha = outA(t) * .15 * (4 - i) * (1 - e); markFill(c, cx + Math.cos(aa) * rr * 1.6, cy + Math.sin(aa) * rr, s * (.4 + .6 * ee), k); c.restore(); }
  markFill(c, cx + Math.cos(a) * r * 1.6, cy + Math.sin(a) * r, s * (.4 + .6 * e), k);
  c.globalAlpha = 1;
};
IC['spin-settle'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var s = h * .34, cx = w / 2, cy = h / 2, p = seg(t, .4, 1.8), rot = (1 - eo(p)) * TAU * 2 + Math.sin(p * 14) * .25 * Math.pow(1 - p, 2) * (p > .6 ? 1 : 0);
  c.save(); c.translate(cx, cy); c.rotate(rot); c.globalAlpha *= clamp(p * 4); markFill(c, 0, 0, s * (.6 + .4 * eo(p)), k); c.restore();
  c.globalAlpha = 1;
};
IC['confetti-pop'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var s = h * .3, cx = w / 2, cy = h / 2, b = back(seg(t, .4, .5)), q = seg(t, .55, 1.6);
  var cols = [k.acc, k.ink, lerpC(k.acc, k.paper, .4), '#F0B429'];
  for (var i = 0; i < 26; i++) {
    if (q <= 0 || q >= 1) break;
    var a = hash(i) * TAU, sp = h * (.5 + hash(i + 4) * .5), x = cx + Math.cos(a) * sp * eo(q), y = cy + Math.sin(a) * sp * eo(q) + q * q * h * .5;
    c.save(); c.translate(x, y); c.rotate(q * 10 * (hash(i + 2) - .5)); c.globalAlpha = outA(t) * (1 - q); c.fillStyle = cols[i % 4]; c.fillRect(-h * .02, -h * .01, h * .04, h * .02); c.restore();
  }
  c.save(); c.translate(cx, cy); c.scale(b, b); markFill(c, 0, 0, s, k); c.restore();
  c.globalAlpha = 1;
};
IC['ripple-ring'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var s = h * .26, cx = w / 2, cy = h / 2, b = back(seg(t, .4, .5));
  for (var i = 0; i < 3; i++) {
    var q = seg(t, .7 + i * .35, 1.4);
    if (q > 0 && q < 1) { c.strokeStyle = k.acc; c.globalAlpha = outA(t) * (1 - q); c.lineWidth = h * .015; c.beginPath(); c.arc(cx, cy, s * (1 + q * 1.4), 0, TAU); c.stroke(); }
  }
  c.globalAlpha = outA(t); c.save(); c.translate(cx, cy); c.scale(b, b); markFill(c, 0, 0, s, k); c.restore();
  c.globalAlpha = 1;
};

// ── REACT · 반응 ───────────────────────────────────────────
IC['check-draw'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var s = h * .36, cx = w / 2, cy = h / 2, b = back(seg(t, .4, .45)), e = io(seg(t, .85, .55));
  c.fillStyle = k.acc; disc(c, cx, cy, s * b);
  c.strokeStyle = k.paper; c.lineWidth = h * .06; c.lineCap = 'round'; c.lineJoin = 'round';
  strokePart(c, place(CHECK, cx, cy, s * .9), e);
  c.globalAlpha = 1;
};
IC['heart-burst'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var s = h * .32, cx = w / 2, cy = h / 2, p = seg(t, .4, .6), sc = p < .4 ? lerp(.2, 1.25, io(p / .4)) : lerp(1.25, 1, io((p - .4) / .6));
  if (P8(t) < .4) { c.globalAlpha = 1; return; }
  var q = seg(t, .55, .7);
  if (q > 0 && q < 1) for (var i = 0; i < 8; i++) {
    var a = i * TAU / 8, r1 = s * (1.1 + q * .5), r2 = s * (1.1 + q * .9);
    c.strokeStyle = k.acc; c.globalAlpha = outA(t) * (1 - q); c.lineWidth = h * .02; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); c.stroke();
  }
  c.globalAlpha = outA(t); c.fillStyle = k.acc; poly(c, place(HEART, cx, cy, s * sc), true); c.fill();
  c.globalAlpha = 1;
};
IC['bell-shake'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var s = h * .36, cx = w / 2, cy = h / 2, p = seg(t, .6, 1.2), rot = Math.sin(p * Math.PI * 7) * .45 * (1 - p) * (p > 0 && p < 1 ? 1 : 0);
  c.save(); c.translate(cx, cy - s * .55); c.rotate(rot); c.fillStyle = k.ink; bell(c, 0, s * .55, s); c.restore();
  var b = back(seg(t, .5, .4)); c.fillStyle = k.acc; disc(c, cx + s * .5, cy - s * .45, h * .07 * b);
  c.globalAlpha = 1;
};
IC['star-fill'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var s = h * .4, cx = w / 2, cy = h / 2, e = io(seg(t, .4, .9)), b = back(seg(t, 1.2, .5));
  var pts = place(STAR, cx, cy, s);
  c.save(); poly(c, pts, true); c.clip(); c.fillStyle = k.acc; c.fillRect(cx - s, cy + s - s * 2 * e, s * 2, s * 2 * e); c.restore();
  c.strokeStyle = k.acc; c.lineWidth = h * .02; c.lineJoin = 'round'; poly(c, pts, true); c.stroke();
  if (b > 0) for (var i = 0; i < 4; i++) { var a = -Math.PI / 4 + i * Math.PI / 2; c.fillStyle = k.paper; disc(c, cx + Math.cos(a) * s * 1.15, cy + Math.sin(a) * s * 1.15, h * .02 * b * (1 - seg(t, 1.6, .6))); }
  c.globalAlpha = 1;
};
IC['toggle-on'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var tw = h * .9, th = h * .44, x = w / 2 - tw / 2, y = h / 2 - th / 2, e = back(seg(t, 1, .45)), col = io(seg(t, 1, .3));
  rrect(c, x, y, tw, th, th / 2); c.fillStyle = lerpC('#C9CCD3', k.acc, col); c.fill();
  var kx = lerp(x + th / 2, x + tw - th / 2, e);
  c.fillStyle = '#FFFFFF'; disc(c, kx, h / 2, th * .4);
  c.globalAlpha = 1;
};
IC['badge-count'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var s = h * .36, cx = w / 2 - h * .05, cy = h / 2 + h * .05;
  c.fillStyle = k.paper; bell(c, cx, cy, s);
  var b = back(seg(t, .8, .45)), n = P8(t) < 2.2 ? 3 : 4, pop = n === 4 ? back(seg(t, 2.2, .35)) : 1;
  c.save(); c.translate(cx + s * .55, cy - s * .55); c.scale(b * (n === 4 ? lerp(1.3, 1, pop) : 1), b * (n === 4 ? lerp(1.3, 1, pop) : 1));
  c.fillStyle = k.acc; disc(c, 0, 0, h * .14);
  c.font = '800 ' + h * .16 + 'px ' + SANS; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(n), 0, h * .005);
  c.restore();
  c.globalAlpha = 1;
};

// ── LOOP · 계속 움직이기 (8초 동안 끊김 없이) ─────────────────────
IC['spinner-arc'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var r = h * .26, cx = w / 2, cy = h / 2, rot = TAU * t * 1.5 / 1.5, len = .2 + .55 * (.5 + .5 * Math.sin(TAU * t / 1.6));
  c.lineWidth = h * .05; c.lineCap = 'round';
  c.strokeStyle = k.deep; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
  c.strokeStyle = k.acc; c.beginPath(); c.arc(cx, cy, r, rot, rot + TAU * len); c.stroke();
};
IC['dots-wave'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var cx = w / 2, cy = h / 2, gap = h * .2;
  for (var i = 0; i < 3; i++) { var q = .5 + .5 * Math.sin(TAU * t - i * .9); c.fillStyle = lerpC(lerpC(k.acc, k.paper, .55), k.acc, q); disc(c, cx + (i - 1) * gap, cy - q * h * .12, h * .065); }
};
IC['breathe-pulse'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var s = h * .3, cx = w / 2, cy = h / 2, q = .5 + .5 * Math.sin(TAU * t / 2 - Math.PI / 2);
  c.fillStyle = k.acc; c.globalAlpha = .18 * q; disc(c, cx, cy, s * (1.3 + .4 * q)); c.globalAlpha = 1;
  c.save(); c.translate(cx, cy); c.scale(1 + .06 * q, 1 + .06 * q); markFill(c, 0, 0, s, k); c.restore();
};
IC['float-bob'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper);
  var s = h * .28, cx = w / 2, by = h * .44, q = Math.sin(TAU * t / 2), y = by + q * h * .06;
  c.fillStyle = 'rgba(20,22,27,.12)'; c.beginPath(); c.ellipse(cx, h * .84, s * (.8 - .15 * q), s * .1, 0, 0, TAU); c.fill();
  c.save(); c.translate(cx, y); c.rotate(Math.sin(TAU * t / 4) * .06); markFill(c, 0, 0, s, k); c.restore();
};
IC['wiggle-hint'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var s = h * .3, cx = w / 2, cy = h / 2, p = (P8(t) % 4) / 4, q = clamp((p - .6) / .25), rot = q > 0 && q < 1 ? Math.sin(q * Math.PI * 6) * .22 * (1 - q) : 0;
  c.save(); c.translate(cx, cy); c.rotate(rot); markFill(c, 0, 0, s, k); c.restore();
};
IC['shine-sweep'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink);
  var s = h * .36, cx = w / 2, cy = h / 2, p = (P8(t) % 2.667) / 2.667, x = lerp(cx - s * 1.6, cx + s * 1.6, clamp(p / .45));
  markFill(c, cx, cy, s, k);
  c.save(); poly(c, place(MARK_OUT, cx, cy, s), true); c.clip();
  var g = c.createLinearGradient(x - s * .4, 0, x + s * .4, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.translate(x, cy); c.rotate(.35); c.fillStyle = g; c.translate(-x, -cy); c.fillRect(x - s * .4, cy - s * 1.5, s * .8, s * 3); c.restore();
};

if (typeof module !== 'undefined') module.exports = { IC: IC };
