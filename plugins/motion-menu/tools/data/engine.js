// 데이터 모션 24 — 캔버스 그리기 함수 묶음 (의존성 0)
// 갤러리 데모(demos/m15-data-motion.html)와 홍보 영상(render.mjs)이 같은 함수를 쓴다.
// 정본은 이 파일 하나. 데모를 고치려면 여기를 고치고 `node tools/data/gen.mjs` → `node build.mjs`.
//
// DM[id](c, w, h, t, k)
//   c: 2D 컨텍스트 (0,0 ~ w,h 가 칸)   t: 초. 8초에 한 바퀴: 0~0.4 비어 있고, 들어와서 머물고, 7.2~8 사라진다
//   k: { acc, deep, paper, ink }
// 크기는 전부 h 에 비례한다. 숫자는 전부 지어낸 예시 값이고, 글자는 숫자와 짧은 라벨만 쓴다.

/*@helpers*/
var TAU = Math.PI * 2;
var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
var eo = function (t) { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
var io = function (t) { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
var back = function (t) { t = clamp(t); var s = 1.7; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
var lerp = function (a, b, t) { return a + (b - a) * t; };
var bgc = function (c, w, h, col) { c.fillStyle = col; c.fillRect(0, 0, w, h); };
var lerpC = function (a, b, t) { return '#' + [1, 3, 5].map(function (i) { return Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0'); }).join(''); };
// 8초 한 바퀴의 위치(0~8)와 들어가는 정도: p 가 a 에서 시작해 d 초 동안 0→1
var P8 = function (t) { var p = t % 8; return p < 0 ? p + 8 : p; };
var seg = function (t, a, d) { return clamp((P8(t) - a) / d); };
// 끝에서 사라짐: 7.2 초부터 0.8 초 동안 1→0
var outA = function (t) { return 1 - clamp((P8(t) - 7.2) / .8); };
var SANS = '-apple-system,"Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif';
var MONO = '"SF Mono",Menlo,Consolas,monospace';
var label = function (c, s, x, y, px, col, al, wt) { c.font = (wt || 600) + ' ' + px + 'px ' + SANS; c.fillStyle = col; c.textAlign = al || 'left'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
var num = function (c, s, x, y, px, col, al, wt) { c.font = (wt || 800) + ' ' + px + 'px ' + SANS; c.fillStyle = col; c.textAlign = al || 'left'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
var rrect = function (c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, Math.max(0, w), Math.max(0, h), Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)); };
var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
// 차트 칸: 왼쪽·오른쪽·위·아래 여백
var box = function (w, h) { var m = h * .14; return { x: m * 1.4, y: m, w: w - m * 2.8, h: h - m * 2.2 }; };
// 차트 공용 값과 도우미 (데모 파일에도 같이 들어가야 해서 helpers 안에 둔다)
var BARS = [62, 88, 45, 97, 71];
var SERIES = [20, 34, 28, 46, 41, 58, 52, 70, 64, 82];
var linePts = function (b, arr, max) { return arr.map(function (v, i) { return [b.x + b.w * i / (arr.length - 1), b.y + b.h - b.h * v / max]; }); };
var pathTo = function (c, pts, e) {
  var n = pts.length - 1, upto = e * n, full = Math.floor(upto);
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (var i = 1; i <= full; i++) c.lineTo(pts[i][0], pts[i][1]);
  if (full < n) { var f = upto - full, a = pts[full], b = pts[full + 1]; c.lineTo(lerp(a[0], b[0], f), lerp(a[1], b[1], f)); return [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]; }
  return pts[n];
};
var grid = function (c, b, col) { c.fillStyle = col; for (var i = 0; i <= 3; i++) c.fillRect(b.x, b.y + b.h * i / 3, b.w, 1); };
var PIE = [.42, .27, .18, .13];
var pieCols = function (k) { return [k.acc, lerpC(k.acc, k.paper, .45), k.deep, '#8FA3B8']; };
/*@end*/

var DM = {};

// ── NUMBER · 숫자가 주인공 ───────────────────────────────────
DM['odometer-roll'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var target = '48,210', n = target.length, cw = h * .3, x0 = w / 2 - cw * n / 2, y = h / 2;
  c.save(); c.beginPath(); c.rect(0, h * .26, w, h * .48); c.clip();
  for (var i = 0; i < n; i++) {
    var ch = target[i], x = x0 + cw * i + cw / 2;
    if (ch === ',') { num(c, ',', x, y + h * .06, h * .4, k.paper, 'center'); continue; }
    var d = +ch, spins = 2 + (n - i) % 3, e = eo(seg(t, .4 + i * .12, 2.2)), pos = e * (spins * 10 + d);
    for (var j = -1; j <= 1; j++) {
      var v = Math.floor(pos) + j, off = (v - pos) * h * .56;
      num(c, String(((v % 10) + 10) % 10), x, y + off, h * .42, j === 0 ? k.paper : k.paper, 'center');
    }
  }
  c.restore();
  c.fillStyle = k.acc; c.fillRect(x0, h * .79, cw * n * eo(seg(t, 2.8, .8)), h * .03);
  c.globalAlpha = 1;
};
DM['digit-slot'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var digits = '7319', n = 4, cw = h * .34, gap = h * .05, x0 = w / 2 - (cw * n + gap * (n - 1)) / 2, y0 = h * .18, ch = h * .64;
  for (var i = 0; i < n; i++) {
    var x = x0 + i * (cw + gap), stop = 1.2 + i * .55, s = seg(t, .4, stop), spin = P8(t) < .4 + stop;
    rrect(c, x, y0, cw, ch, h * .06); c.fillStyle = k.ink; c.fill();
    c.save(); rrect(c, x, y0, cw, ch, h * .06); c.clip();
    var pos = spin ? (P8(t) * 18) % 10 : +digits[i], fr = pos - Math.floor(pos);
    for (var j = -1; j <= 1; j++) {
      var v = (Math.floor(pos) + j + 10) % 10, yy = y0 + ch / 2 + (j - fr) * ch;
      if (!spin) { var land = back(seg(t, .4 + stop, .35)); yy = y0 + ch / 2 + (j + (1 - land) * -.4) * ch; }
      num(c, String(spin ? v : (+digits[i] + j + 10) % 10), x + cw / 2, yy, h * .38, j === 0 && !spin ? k.acc : k.paper, 'center');
    }
    c.restore();
  }
  c.globalAlpha = 1;
};
DM['number-punch'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.acc); c.globalAlpha = outA(t);
  var s = back(seg(t, .4, .5)), u = eo(seg(t, .85, .4)), cy = h * .5;
  c.save(); c.translate(w / 2 - h * .18, cy); c.scale(s, s);
  num(c, '3.2', 0, 0, h * .56, k.paper, 'center', 900); c.restore();
  label(c, '배', w / 2 + h * .52, cy + h * .08 + (1 - u) * h * .2, h * .2, k.ink, 'left', 800);
  c.globalAlpha *= u; c.fillStyle = k.ink; c.fillRect(w / 2 - h * .7, cy + h * .33, h * 1.4 * u, h * .025);
  c.globalAlpha = 1;
};
DM['delta-badge'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var e = eo(seg(t, .4, 1.6)), v = lerp(1.2, 1.38, e), txt = v.toFixed(2) + 'M', px = h * .3;
  c.font = '800 ' + px + 'px ' + SANS; var tw = c.measureText('1.38M').width, bw = h * .7, gap = h * .08, x0 = (w - tw - gap - bw) / 2;
  num(c, txt, x0, h * .5, px, k.ink, 'left');
  var b = back(seg(t, 1.9, .5));
  c.save(); c.translate(x0 + tw + gap + bw / 2, h * .5); c.scale(b, b);
  rrect(c, -bw / 2, -h * .14, bw, h * .28, h * .14); c.fillStyle = k.acc; c.fill();
  c.fillStyle = k.paper; c.beginPath(); c.moveTo(-bw / 2 + h * .1, h * .05); c.lineTo(-bw / 2 + h * .17, -h * .06); c.lineTo(-bw / 2 + h * .24, h * .05); c.closePath(); c.fill();
  num(c, '+15%', h * .1, 0, h * .15, k.paper, 'center', 800); c.restore();
  c.globalAlpha = 1;
};
DM['percent-ring'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var r = h * .32, cx = w / 2, cy = h / 2, e = io(seg(t, .4, 2.4)), pct = 72 * e;
  c.lineWidth = h * .07; c.lineCap = 'round';
  c.strokeStyle = k.deep; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
  if (pct > .3) { c.strokeStyle = k.acc; c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * pct / 100); c.stroke(); }
  num(c, Math.round(pct) + '%', cx, cy, h * .2, k.paper, 'center');
  c.globalAlpha = 1;
};
DM['ticker-tape'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t) * clamp(P8(t) / .4);
  var items = [['KOSPI', '+1.2%', 1], ['USD', '-0.4%', 0], ['GOLD', '+0.8%', 1], ['BTC', '+3.1%', 1], ['OIL', '-1.6%', 0]];
  var unit = h * 1.5, total = unit * items.length, off = (P8(t) / 8) * total;
  c.fillStyle = k.deep; c.fillRect(0, h * .3, w, h * .4);
  for (var rep = -1; rep < Math.ceil(w / total) + 1; rep++) items.forEach(function (it, i) {
    var x = rep * total + i * unit - off;
    if (x < -unit || x > w) return;
    label(c, it[0], x + h * .1, h * .5, h * .14, k.paper, 'left', 700);
    label(c, (it[2] ? '▲ ' : '▼ ') + it[1], x + h * .62, h * .5, h * .14, it[2] ? k.acc : '#8FA3B8', 'left', 800);
  });
  c.globalAlpha = 1;
};

// ── BAR · 막대 ────────────────────────────────────────────
DM['bar-grow'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var b = box(w, h), n = BARS.length, bw = b.w / n * .6;
  c.fillStyle = k.ink; c.fillRect(b.x, b.y + b.h, b.w, h * .012);
  BARS.forEach(function (v, i) {
    var e = back(seg(t, .4 + i * .18, .7)), bh = b.h * v / 100 * e, x = b.x + b.w / n * (i + .2);
    c.fillStyle = i === 3 ? k.acc : k.ink; rrect(c, x, b.y + b.h - bh, bw, bh, h * .02); c.fill();
    c.globalAlpha = outA(t) * clamp(seg(t, 1.2 + i * .18, .3));
    num(c, String(v), x + bw / 2, b.y + b.h - bh - h * .06, h * .09, i === 3 ? k.acc : k.ink, 'center', 700);
    c.globalAlpha = outA(t);
  });
  c.globalAlpha = 1;
};
DM['bar-race'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t) * clamp(P8(t) / .4);
  var names = ['A', 'B', 'C', 'D'], start = [40, 70, 55, 30], end = [92, 60, 75, 85], p = io(seg(t, .6, 5));
  var vals = start.map(function (s, i) { return lerp(s, end[i], p) + 6 * Math.sin(p * 9 + i); });
  var order = vals.map(function (v, i) { return i; }).sort(function (a, b) { return vals[b] - vals[a]; });
  var b = box(w, h), rh = b.h / 4;
  names.forEach(function (nm, i) {
    var rank = order.indexOf(i), y = b.y + rank * rh;
    var bw = (b.w - h * .3) * vals[i] / 100;
    c.fillStyle = i === 0 ? k.acc : k.deep; rrect(c, b.x + h * .25, y + rh * .15, bw, rh * .7, h * .02); c.fill();
    label(c, nm, b.x, y + rh / 2, h * .1, k.paper, 'left', 800);
    num(c, String(Math.round(vals[i])), b.x + h * .25 + bw + h * .04, y + rh / 2, h * .09, k.paper, 'left', 700);
  });
  c.globalAlpha = 1;
};
DM['bar-swap'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t) * clamp(P8(t) / .4);
  var b = box(w, h), vals = [48, 82, 64], n = 3, bw = b.w / n * .5, s = io(seg(t, 2, 1.4));
  c.fillStyle = k.ink; c.fillRect(b.x, b.y + b.h, b.w, h * .012);
  vals.forEach(function (v, i) {
    var slot = i === 0 ? lerp(0, 1, s) : i === 1 ? lerp(1, 0, s) : 2;
    var x = b.x + b.w / n * (slot + .25), bh = b.h * v / 100, lift = i === 1 ? Math.sin(s * Math.PI) * h * .1 : 0;
    c.fillStyle = i === 1 ? k.acc : k.ink; rrect(c, x, b.y + b.h - bh - lift, bw, bh, h * .02); c.fill();
    num(c, String(v), x + bw / 2, b.y + b.h - bh - lift - h * .06, h * .09, i === 1 ? k.acc : k.ink, 'center', 700);
  });
  c.globalAlpha = 1;
};
DM['stacked-build'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var b = box(w, h), cols = [[30, 25, 20], [22, 30, 28], [35, 20, 30], [28, 34, 26]], n = cols.length, bw = b.w / n * .55;
  var shades = [k.acc, lerpC(k.acc, k.paper, .45), k.deep];
  cols.forEach(function (st, i) {
    var x = b.x + b.w / n * (i + .22), y = b.y + b.h;
    st.forEach(function (v, j) {
      var e = back(seg(t, .4 + j * .7 + i * .1, .5)), hh = b.h * v / 100;
      c.fillStyle = shades[j]; rrect(c, x, y - hh * e, bw, hh * e - h * .008, h * .015); c.fill();
      y -= hh * e;
    });
  });
  c.globalAlpha = 1;
};
DM['waterfall-steps'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var b = box(w, h), steps = [60, 25, -18, 30, -12], n = steps.length + 1, bw = b.w / n * .6, run = 0, max = 100;
  var sy = function (v) { return b.y + b.h - b.h * v / max; };
  steps.forEach(function (d, i) {
    var e = eo(seg(t, .4 + i * .45, .45)), x = b.x + b.w / n * (i + .2), from = run, to = run + d * e;
    if (e > 0) { c.fillStyle = d >= 0 ? k.ink : k.acc; rrect(c, x, Math.min(sy(from), sy(to)), bw, Math.abs(sy(to) - sy(from)), h * .01); c.fill(); }
    if (i && e > 0) { c.fillStyle = '#9A9AA0'; c.fillRect(x - b.w / n * .4, sy(from) - .5, b.w / n * .4, 1); }
    run += d;
  });
  var tot = eo(seg(t, .4 + steps.length * .45, .5)), x = b.x + b.w / n * (steps.length + .2);
  c.fillStyle = k.acc; rrect(c, x, sy(85 * tot), bw, b.h * .85 * tot, h * .01); c.fill();
  c.globalAlpha = outA(t) * clamp(tot); num(c, '85', x + bw / 2, sy(85) - h * .07, h * .1, k.acc, 'center', 800);
  c.globalAlpha = 1;
};
DM['goal-fill'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var x = w * .12, y = h * .45, bw = w * .76, bh = h * .14, e = io(seg(t, .4, 2.6)), v = 87 * e;
  rrect(c, x, y, bw, bh, bh / 2); c.fillStyle = k.deep; c.fill();
  rrect(c, x, y, bw * v / 100, bh, bh / 2); c.fillStyle = k.acc; c.fill();
  c.fillStyle = k.paper; c.fillRect(x + bw * .8, y - h * .08, h * .012, bh + h * .16);
  label(c, '목표 80', x + bw * .8, y - h * .15, h * .09, k.paper, 'center', 700);
  num(c, Math.round(v) + '%', x, y + bh + h * .17, h * .14, v >= 80 ? k.acc : k.paper, 'left');
  c.globalAlpha = 1;
};

// ── LINE · 선 ──────────────────────────────────────────────
DM['line-chart-draw'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var b = box(w, h), pts = linePts(b, SERIES, 100), e = io(seg(t, .4, 3));
  grid(c, b, k.deep);
  c.strokeStyle = k.acc; c.lineWidth = h * .025; c.lineJoin = 'round'; c.lineCap = 'round';
  var tip = pathTo(c, pts, e); c.stroke();
  if (e > 0) { c.fillStyle = k.paper; c.beginPath(); c.arc(tip[0], tip[1], h * .035, 0, TAU); c.fill(); }
  c.globalAlpha = 1;
};
DM['area-fill'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var b = box(w, h), pts = linePts(b, SERIES, 100), e = io(seg(t, .4, 1.8)), f = eo(seg(t, 2.2, 1.2));
  c.strokeStyle = k.ink; c.lineWidth = h * .02; c.lineJoin = 'round';
  var tip = pathTo(c, pts, e); c.stroke();
  if (f > 0) {
    c.save(); c.beginPath(); c.rect(b.x, b.y + b.h - (b.h + h * .1) * f, b.w, b.h + h * .1); c.clip();
    c.beginPath(); c.moveTo(pts[0][0], b.y + b.h); pts.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineTo(pts[pts.length - 1][0], b.y + b.h); c.closePath();
    c.fillStyle = lerpC(k.acc, k.paper, .35); c.fill(); c.restore();
    c.strokeStyle = k.ink; c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke();
  }
  c.globalAlpha = 1;
};
DM['point-pop'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var b = box(w, h), pts = linePts(b, SERIES, 100);
  grid(c, b, k.deep);
  c.strokeStyle = k.deep; c.lineWidth = h * .015; c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke();
  pts.forEach(function (p, i) {
    var s = back(seg(t, .5 + i * .22, .4)), r = h * .045 * s;
    if (r > .3) { c.fillStyle = i === pts.length - 1 ? k.acc : k.paper; c.beginPath(); c.arc(p[0], p[1], r, 0, TAU); c.fill(); }
  });
  c.globalAlpha = 1;
};
DM['sparkline-scroll'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t) * clamp(P8(t) / .4);
  var b = box(w, h), N = 64, off = P8(t) / 8 * N;
  var val = function (i) { return 50 + 22 * Math.sin(i * TAU / 16) + 12 * Math.sin(i * TAU / 6.4 + 1); };
  c.strokeStyle = k.acc; c.lineWidth = h * .022; c.lineJoin = 'round'; c.beginPath();
  for (var s = 0; s <= 24; s++) { var i = s + off, x = b.x + b.w * s / 24, y = b.y + b.h - b.h * val(i) / 100; if (s) c.lineTo(x, y); else c.moveTo(x, y); }
  c.stroke();
  var last = val(24 + off); c.fillStyle = k.paper; c.beginPath(); c.arc(b.x + b.w, b.y + b.h - b.h * last / 100, h * .035, 0, TAU); c.fill();
  num(c, last.toFixed(1), b.x + b.w - h * .08, b.y + h * .02, h * .12, k.paper, 'right', 800);
  c.globalAlpha = 1;
};
DM['peak-callout'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var b = box(w, h), arr = [30, 44, 38, 92, 50, 46, 58], pts = linePts(b, arr, 110), e = io(seg(t, .4, 1.8));
  c.strokeStyle = k.ink; c.lineWidth = h * .02; c.lineJoin = 'round'; pathTo(c, pts, e); c.stroke();
  var pk = pts[3], s = back(seg(t, 2.4, .5)), r = h * .08 * s;
  if (r > .5) { c.strokeStyle = k.acc; c.lineWidth = h * .018; c.beginPath(); c.arc(pk[0], pk[1], r, 0, TAU); c.stroke(); }
  var u = eo(seg(t, 2.8, .5));
  c.globalAlpha = outA(t) * u;
  rrect(c, pk[0] + h * .12, pk[1] - h * .02, h * .62, h * .2, h * .05); c.fillStyle = k.acc; c.fill();
  label(c, '최고 92', pk[0] + h * .43, pk[1] + h * .08, h * .1, k.paper, 'center', 800);
  c.globalAlpha = 1;
};
DM['line-cross'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var b = box(w, h), A = [70, 64, 58, 52, 47, 41, 36], B = [20, 28, 37, 49, 58, 66, 74], e = io(seg(t, .4, 2.6));
  var pa = linePts(b, A, 100), pb = linePts(b, B, 100);
  grid(c, b, k.deep);
  c.lineWidth = h * .022; c.lineJoin = 'round';
  c.strokeStyle = '#8FA3B8'; pathTo(c, pa, e); c.stroke();
  c.strokeStyle = k.acc; pathTo(c, pb, e); c.stroke();
  var cx = b.x + b.w * (3.4 / 6), cy = b.y + b.h - b.h * 50 / 100, s = back(seg(t, 3.2, .4));
  if (s > 0) { c.fillStyle = k.paper; c.beginPath(); c.arc(cx, cy, h * .04 * s, 0, TAU); c.fill();
    c.globalAlpha = outA(t) * clamp(seg(t, 3.4, .4)); label(c, '역전', cx, cy - h * .13, h * .11, k.paper, 'center', 800); }
  c.globalAlpha = 1;
};

// ── SHARE · 비율과 구성 ──────────────────────────────────────
DM['pie-sweep'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var cx = w / 2, cy = h / 2, r = h * .36, e = io(seg(t, .4, 2.2)), a0 = -Math.PI / 2, acc = 0, cols = pieCols(k);
  PIE.forEach(function (v, i) {
    var from = a0 + TAU * acc, to = a0 + TAU * Math.min(acc + v, e);
    if (to > from) { c.fillStyle = cols[i]; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, r, from, to); c.closePath(); c.fill(); }
    acc += v;
  });
  var u = clamp(seg(t, 2.8, .4)); c.globalAlpha = outA(t) * u;
  num(c, '42%', cx + r + h * .12, cy, h * .16, k.acc, 'left');
  c.globalAlpha = 1;
};
DM['donut-split'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var cx = w / 2, cy = h / 2, r = h * .33, e = io(seg(t, .4, 1.6)), sp = eo(seg(t, 2.3, .6)), a0 = -Math.PI / 2, acc = 0, cols = pieCols(k);
  c.lineWidth = h * .12;
  PIE.forEach(function (v, i) {
    var from = a0 + TAU * acc, to = a0 + TAU * Math.min(acc + v, e), mid = (from + a0 + TAU * (acc + v)) / 2;
    if (to > from) {
      var dx = Math.cos(mid) * h * .05 * sp, dy = Math.sin(mid) * h * .05 * sp;
      c.strokeStyle = cols[i]; c.beginPath(); c.arc(cx + dx, cy + dy, r, from + .03 * sp, to - .03 * sp); c.stroke();
    }
    acc += v;
  });
  c.globalAlpha = outA(t) * sp; num(c, '4', cx, cy - h * .02, h * .2, k.ink, 'center'); label(c, '항목', cx, cy + h * .13, h * .07, k.ink, 'center', 600);
  c.globalAlpha = 1;
};
DM['treemap-split'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var x = w * .08, y = h * .12, W = w * .84, H = h * .76, g = h * .02, cols = pieCols(k);
  var e1 = io(seg(t, .4, .8)), e2 = io(seg(t, 1.3, .8)), e3 = io(seg(t, 2.2, .8));
  var a = W * lerp(1, .42, e1);
  c.fillStyle = cols[0]; rrect(c, x, y, a - g, H, h * .03); c.fill();
  if (e1 > 0) {
    var rest = W - a, b = H * lerp(1, .6, e2);
    c.fillStyle = cols[1]; rrect(c, x + a, y, rest, b - g, h * .03); c.fill();
    if (e2 > 0) {
      var cw = rest * lerp(1, .58, e3);
      c.fillStyle = cols[2]; rrect(c, x + a, y + b, cw - g, H - b, h * .03); c.fill();
      if (e3 > 0) { c.fillStyle = cols[3]; rrect(c, x + a + cw, y + b, rest - cw, H - b, h * .03); c.fill(); }
    }
  }
  c.globalAlpha = outA(t) * e1; num(c, '42%', x + h * .1, y + h * .15, h * .14, k.ink, 'left');
  c.globalAlpha = 1;
};
DM['waffle-fill'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var n = 10, s = h * .07, g = h * .012, gw = n * s + (n - 1) * g, x0 = w / 2 - gw / 2 - h * .3, y0 = h / 2 - gw / 2, on = 37;
  for (var i = 0; i < 100; i++) {
    var col = i % 10, row = 9 - Math.floor(i / 10), x = x0 + col * (s + g), y = y0 + row * (s + g);
    var lit = i < on && P8(t) > .4 + i * .055;
    rrect(c, x, y, s, s, s * .25); c.fillStyle = lit ? k.acc : lerpC(k.ink, k.paper, .88); c.fill();
  }
  var cnt = Math.min(on, Math.max(0, Math.floor((P8(t) - .4) / .055) + 1));
  num(c, cnt + '%', x0 + gw + h * .15, h / 2, h * .2, k.acc, 'left');
  c.globalAlpha = 1;
};
DM['isotype-row'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); c.globalAlpha = outA(t);
  var rows = [[7, k.acc], [4, '#8FA3B8']], s = Math.min(h * .2, w * .062);
  rows.forEach(function (r, ri) {
    var y = h * (.33 + ri * .36);
    for (var i = 0; i < 10; i++) {
      var x = w * .06 + i * s * 1.12, pop = back(seg(t, .4 + ri * .2 + i * .14, .35)), on = i < r[0];
      if (!on) { c.globalAlpha = outA(t) * .25; }
      c.save(); c.translate(x + s / 2, y); c.scale(on ? pop : 1, on ? pop : 1);
      c.fillStyle = on ? r[1] : k.deep; c.beginPath(); c.arc(0, -s * .22, s * .16, 0, TAU); c.fill();
      rrect(c, -s * .24, -s * .02, s * .48, s * .36, s * .14); c.fill(); c.restore();
      c.globalAlpha = outA(t);
    }
    num(c, r[0] + '/10', w * .06 + 10 * s * 1.12 + h * .06, y, h * .14, r[1], 'left');
  });
  c.globalAlpha = 1;
};
DM['scale-compare'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); c.globalAlpha = outA(t);
  var rB = h * .36, rA = rB / 3, cy = h * .5, a = back(seg(t, .4, .5)), b = eo(seg(t, 1.2, 1.4));
  var xA = w / 2 - rB * 1.2, xB = w / 2 + rB * .55, yA = cy + rB - rA;
  c.fillStyle = k.ink; c.beginPath(); c.arc(xA, yA, Math.max(0, rA * a), 0, TAU); c.fill();
  c.fillStyle = k.acc; c.beginPath(); c.arc(xB, cy, Math.max(0, (rA + (rB - rA) * b) * a), 0, TAU); c.fill();
  c.globalAlpha = outA(t) * clamp(seg(t, 2.6, .4));
  num(c, '×9', xB, cy, h * .2, k.paper, 'center');
  label(c, '2020', xA, yA - rA - h * .09, h * .09, k.ink, 'center', 700);
  label(c, '2026', xB + rB + h * .06, cy, h * .09, k.ink, 'left', 700);
  c.globalAlpha = 1;
};

if (typeof module !== 'undefined') module.exports = { DM: DM };
