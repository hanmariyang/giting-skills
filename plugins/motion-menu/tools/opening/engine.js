// 오프닝 타이틀 24: 캔버스 그리기 함수 묶음 (의존성 0)
// 갤러리 데모(demos/m20-opening-title.html)와 홍보 영상(render.mjs)이 같은 함수를 쓴다.
// 정본은 이 파일 하나. 데모를 고치려면 여기를 고치고 `node tools/opening/gen.mjs` → `node build.mjs`.
//
// OP[id](c, w, h, t, k)
//   c: 2D 컨텍스트 (0,0 ~ w,h 가 칸)   t: 초. 8초에 한 바퀴. 0.4초 비고 → 제목이 들어와 서고 → 7.2~8초 사라짐.
//   k: { acc, deep, paper, ink }
// 제목 글자·장면·물건은 전부 이 파일에서 만든다. 남의 그림·문구를 쓰지 않는다.

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
// 글자를 한 자씩 놓을 자리(가운데 0 기준 x 들)
var slots = function (c, s, px, wt) {
  c.font = FONT(px, wt); var ws = [], L = 0, i;
  for (i = 0; i < s.length; i++) { ws.push(c.measureText(s[i]).width); L += ws[i]; }
  var x = -L / 2, out = []; for (i = 0; i < s.length; i++) { out.push(x + ws[i] / 2); x += ws[i]; } return out;
};
// 글자 모양을 점 집합으로(가루·모자이크용). 한 번 재고 기억한다
var DOTS = {};
var dots = function (s, px, step, wt) {
  var key = s + '|' + Math.round(px) + '|' + step; if (DOTS[key]) return DOTS[key];
  var o = document.createElement('canvas'), x = o.getContext('2d'); x.font = FONT(px, wt);
  var W = Math.ceil(x.measureText(s).width + px * .4), H = Math.ceil(px * 1.5); o.width = W; o.height = H;
  x.font = FONT(px, wt); x.fillStyle = '#000'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, W / 2, H / 2);
  var d = x.getImageData(0, 0, W, H).data, out = [];
  for (var y = 0; y < H; y += step) for (var X = 0; X < W; X += step) if (d[(y * W + X) * 4 + 3] > 120) out.push([X - W / 2, y - H / 2]);
  return (DOTS[key] = out);
};
var P8 = function (t) { var p = t % 8; return p < 0 ? p + 8 : p; };
var seg = function (t, a, d) { return clamp((P8(t) - a) / d); };
var outA = function (t) { return 1 - clamp((P8(t) - 7.2) / .8); };
var disc = function (c, x, y, r) { if (r > .2) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } };
var MFONT = function (px, wt) { return (wt || 600) + ' ' + Math.round(px) + 'px "SF Mono",Menlo,Consolas,monospace'; };
var mono = function (c, s, x, y, px, col, al) { c.font = MFONT(px); c.fillStyle = col; c.textAlign = al || 'left'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
// 제목 글자 크기: 칸 높이의 r 배, 폭 mw 를 넘지 않게
var TS = function (c, s, w, h, r, mw, wt) { return fit(c, s, h * (r || .34), w * (mw || .74), wt); };
// 한 장면 전체에 쓰는 투명도(끝에서 사라짐)
var fade = function (c, t) { c.globalAlpha = outA(t); };
// 따로 그린 판(오프닝은 판이 둘 필요한 것이 있어 이름을 나눈다)
var OFF2 = {}, PIX = {}, SIG = {};
var layer2 = function (c, w, h, draw) {
  var s = (c.getTransform ? c.getTransform().a : 1) || 1, W = Math.ceil(w * s), H = Math.ceil(h * s), key = W + 'x' + H;
  var o = OFF2[key] || (OFF2[key] = document.createElement('canvas')); o.width = W; o.height = H;
  var x = o.getContext('2d'); x.setTransform(s, 0, 0, s, 0, 0); draw(x); c.drawImage(o, 0, 0, w, h);
};
// 들쭉날쭉한 종이 가장자리 다각형 (가운데 cx,cy · 반폭 rw · 반높이 rh · 씨앗 sd)
var torn = function (c, cx, cy, rw, rh, sd) {
  var n = 22; c.beginPath();
  for (var i = 0; i < n; i++) { var u = i / n, x, y, j = (hash(sd * 31 + i) - .5) * rh * .28;
    if (u < .25) { x = cx - rw + u * 8 * rw; y = cy - rh + j; } else if (u < .5) { x = cx + rw + j; y = cy - rh + (u - .25) * 8 * rh; }
    else if (u < .75) { x = cx + rw - (u - .5) * 8 * rw; y = cy + rh + j; } else { x = cx - rw + j; y = cy + rh - (u - .75) * 8 * rh; }
    if (i) c.lineTo(x, y); else c.moveTo(x, y); }
  c.closePath();
};
/*@end*/

var OP = {};

// ── SCAN · 기계가 읽고 띄우기 ──────────────────────────────

OP['scan-reveal'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  c.fillStyle = 'rgba(244,241,234,.08)';
  for (var gx = h * .1; gx < w; gx += h * .1) for (var gy = h * .1; gy < h; gy += h * .1) c.fillRect(gx, gy, 1.2, 1.2);
  var s = '탐색', px = TS(c, s, w, h, .46), p = io(seg(t, .6, 2)), bx = w * .1 + p * w * .8;
  c.font = FONT(px); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.strokeStyle = 'rgba(244,241,234,.35)'; c.lineWidth = 1.2; c.strokeText(s, w / 2, h * .5);
  c.save(); c.beginPath(); c.rect(0, 0, bx, h); c.clip(); say(c, s, w / 2, h * .5, px, k.paper); c.restore();
  if (p > 0 && p < 1) { var g = c.createLinearGradient(bx - h * .3, 0, bx, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, k.acc);
    c.globalAlpha = outA(t) * .45; c.fillStyle = g; c.fillRect(bx - h * .3, h * .12, h * .3, h * .76); c.globalAlpha = outA(t);
    c.fillStyle = k.acc; c.fillRect(bx - 1.5, h * .1, 3, h * .8); }
  var m = h * .07, L = h * .1; c.strokeStyle = 'rgba(244,241,234,.6)'; c.lineWidth = 1.5; c.beginPath();
  [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(function (q) { c.moveTo(q[0] + q[2] * L, q[1]); c.lineTo(q[0], q[1]); c.lineTo(q[0], q[1] + q[3] * L); }); c.stroke();
  mono(c, (p < 1 ? 'SCANNING ' : 'MATCH ') + String(Math.round(p * 100)).padStart(3, '0') + '%', m + h * .03, m + h * .07, h * .055, p < 1 ? 'rgba(244,241,234,.6)' : k.acc);
  c.globalAlpha = 1;
};

OP['hud-assemble'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var cx = w / 2, cy = h / 2, R = h * .36, a1 = eo(seg(t, .4, 1)), a2 = eo(seg(t, .8, 1)), a3 = eo(seg(t, 1.2, .9)), rot = P8(t) * .35;
  c.strokeStyle = k.paper; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * a1); c.stroke();
  c.strokeStyle = 'rgba(244,241,234,.55)'; c.lineWidth = 1.2;
  for (var i = 0; i < 48; i++) { if (i / 48 > a2) break; var a = i / 48 * TAU + rot, r1 = R * 1.08, r2 = R * (i % 4 ? 1.13 : 1.2);
    c.beginPath(); c.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); c.stroke(); }
  c.strokeStyle = k.acc; c.lineWidth = 2.5; c.setLineDash([R * .25, R * .12]); c.beginPath(); c.arc(cx, cy, R * .82, -rot * 1.6, -rot * 1.6 + TAU * a2); c.stroke(); c.setLineDash([]);
  var bw = w * .18, x0 = w * .06;
  for (var b = 0; b < 4; b++) { var y = h * (.32 + b * .12), v = [.7, .45, .85, .3][b];
    c.fillStyle = 'rgba(244,241,234,.18)'; c.fillRect(x0, y, bw * a3, h * .03);
    c.fillStyle = b === 1 ? k.acc : k.paper; c.fillRect(x0, y, bw * v * eo(seg(t, 1.4 + b * .12, .6)), h * .03); }
  ['A0F2', '3B19', 'C07D', '88E1'].forEach(function (s, j) { var r = seg(t, 1.5 + j * .15, .3); if (r > 0) mono(c, '0x' + s.slice(0, Math.ceil(r * 4)), w * .94, h * (.34 + j * .12), h * .055, 'rgba(244,241,234,.7)', 'right'); });
  var tp = back(seg(t, 2.1, .5)); if (tp > 0) { c.save(); c.translate(cx, cy); c.scale(tp, tp); say(c, '가동', 0, 0, TS(c, '가동', R * 2, R * 2, .5, .8), k.paper); c.restore(); }
  c.globalAlpha = 1;
};

OP['hologram'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var cx = w / 2, by = h * .86, cone = eo(seg(t, .5, .9)), pulse = .5 + .5 * Math.sin(P8(t) * TAU / 2);
  for (var i = 0; i < 3; i++) { c.strokeStyle = k.acc; c.globalAlpha = outA(t) * (.8 - i * .22) * clamp(seg(t, .3, .4) * 3); c.lineWidth = 1.6;
    c.beginPath(); c.ellipse(cx, by, w * (.1 + i * .05) * (1 + pulse * .04), h * (.035 + i * .018), 0, 0, TAU); c.stroke(); }
  c.globalAlpha = outA(t) * .32 * cone; var g = c.createLinearGradient(0, by, 0, h * .12); g.addColorStop(0, k.acc); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.moveTo(cx - w * .1, by); c.lineTo(cx + w * .1, by); c.lineTo(cx + w * .3, h * .12); c.lineTo(cx - w * .3, h * .12); c.closePath(); c.fill();
  var tp = seg(t, 1.2, 1.4), fl = tp < 1 ? (hash(Math.floor(P8(t) * 20)) > .35 ? 1 : .25) : 1, bob = Math.sin(P8(t) * TAU / 4) * h * .015;
  if (tp > 0) { c.globalAlpha = outA(t) * fl * clamp(tp * 2);
    var s = '투영', px = TS(c, s, w, h, .36); c.save(); c.shadowColor = k.acc; c.shadowBlur = h * .04; say(c, s, cx, h * .45 + bob, px, k.acc); say(c, s, cx, h * .45 + bob, px, 'rgba(244,241,234,.35)'); c.restore();
    c.fillStyle = k.ink; c.globalAlpha = outA(t) * fl * .28; for (var y = h * .25; y < h * .65; y += 3) c.fillRect(cx - w * .35, y + (P8(t) * 12) % 3, w * .7, 1); }
  c.globalAlpha = 1;
};

OP['matrix-reveal'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var G = 'ㄱㄴㄷㄹㅁㅂㅅㅇ0123456789', fs = h * .075, cols = Math.ceil(w / fs), rows = Math.ceil(h / fs) + 1, p = P8(t), reveal = io(seg(t, 1.4, 1.8));
  var s = '접속', px = TS(c, s, w, h, .5, .8);
  layer2(c, w, h, function (x) {
    x.font = MFONT(fs * .9); x.textAlign = 'center'; x.textBaseline = 'middle';
    for (var i = 0; i < cols; i++) { var sp = 1.6 + hash(i) * 2.2, head = ((p * sp + hash(i + 9) * 9) % (rows + 6));
      for (var j = 0; j < rows; j++) { var d = head - j; if (d < 0 || d > 6) continue;
        x.fillStyle = d < 1 ? '#F4F1EA' : k.acc; x.globalAlpha = 1 - d / 6.5;
        x.fillText(G[Math.floor(hash(i * 41 + j + Math.floor(p * 6)) * G.length)], i * fs + fs / 2, j * fs); } }
    x.globalAlpha = 1;
  });
  if (reveal > 0) { c.save(); c.globalAlpha = outA(t) * reveal; c.shadowColor = k.acc; c.shadowBlur = h * .06; say(c, s, w / 2, h / 2, px, k.paper); c.restore(); }
  c.globalAlpha = 1;
};

OP['pixel-resolve'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var steps = [28, 16, 9, 5, 3, 1], st = Math.min(5, Math.floor(seg(t, .6, 2.4) * 6)), bs = Math.max(1, h * steps[st] / 170);
  var s = '선명', px = TS(c, s, w, h, .5, .8), sw = Math.max(1, Math.ceil(w / bs)), sh = Math.max(1, Math.ceil(h / bs));
  if (seg(t, .4, .2) > 0) {
    var o = PIX.o || (PIX.o = document.createElement('canvas')); o.width = sw; o.height = sh;
    var x = o.getContext('2d'); x.clearRect(0, 0, sw, sh); x.setTransform(sw / w, 0, 0, sh / h, 0, 0); say(x, s, w / 2, h / 2, px, k.paper);
    c.imageSmoothingEnabled = false; c.drawImage(o, 0, 0, sw * bs, sh * bs); c.imageSmoothingEnabled = true; }
  mono(c, 'RES ' + steps[st] + 'px', w - h * .07, h * .1, h * .055, st === 5 ? k.acc : 'rgba(244,241,234,.6)', 'right');
  c.globalAlpha = 1;
};

OP['boot-sequence'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var L = ['> 전원 확인 ........ OK', '> 메모리 점검 ...... OK', '> 화면 연결 ........ OK', '> 시작 준비'], fs = h * .068, x0 = w * .07, p = P8(t);
  L.forEach(function (s, i) { var r = seg(t, .4 + i * .45, .4); if (r <= 0) return; var n = Math.ceil(r * s.length), y = h * .14 + i * fs * 1.45;
    mono(c, s.slice(0, n), x0, y, fs, i < 3 && n === s.length ? 'rgba(244,241,234,.55)' : k.paper);
    if (i < 3 && n === s.length) mono(c, 'OK', x0 + c.measureText(s.slice(0, s.length - 2)).width, y, fs, k.acc); });
  var s2 = '준비 완료', r2 = seg(t, 2.6, .8), n2 = Math.round(r2 * s2.length), px = TS(c, s2, w, h, .26, .8, 800);
  if (r2 > 0) { say(c, s2.slice(0, n2), x0, h * .76, px, k.paper, 'left', 800);
    if (Math.floor(p * 2.5) % 2 === 0 || r2 < 1) { c.fillStyle = k.acc; c.fillRect(x0 + tw(c, s2.slice(0, n2), px, 800) + px * .08, h * .76 - px * .42, px * .45, px * .84); } }
  c.globalAlpha = 1;
};

// ── CINEMA · 영화처럼 열기 ──────────────────────────────

OP['letterbox-open'] = function (c, w, h, t, k) {
  var g = c.createRadialGradient(w * .5, h * .55, 0, w * .5, h * .55, w * .6); g.addColorStop(0, k.deep); g.addColorStop(1, k.ink);
  c.fillStyle = g; c.fillRect(0, 0, w, h); fade(c, t);
  var o = io(seg(t, .5, 1.6)), band = Math.min(h, w / 2.39) * o, bar = (h - band) / 2;
  var ta = io(seg(t, 1.6, 1.6)), sc = 1.06 - .06 * ta, s = '새벽', px = TS(c, s, w, h, .26, .6, 300);
  c.save(); c.globalAlpha = outA(t) * ta; c.translate(w / 2, h * .48); c.scale(sc, sc);
  c.font = FONT(px, 300); c.letterSpacing = px * .35 + 'px'; c.fillStyle = k.paper; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, px * .17, 0); c.letterSpacing = '0px';
  c.globalAlpha = outA(t) * ta * .7; c.font = MFONT(h * .045); c.letterSpacing = h * .03 + 'px'; c.fillStyle = k.acc; c.fillText('BEFORE  SUNRISE', h * .015, px * .75); c.letterSpacing = '0px'; c.restore();
  c.globalAlpha = 1; c.fillStyle = '#000'; c.fillRect(0, 0, w, bar + 1); c.fillRect(0, h - bar - 1, w, bar + 1);
};

OP['frame-draw'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var p = io(seg(t, .4, 1.4)), grow = io(seg(t, 1.8, .6)), fw = w * (.5 + grow * .12), fh = h * (.46 + grow * .1), x = (w - fw) / 2, y = (h - fh) / 2, per = 2 * (fw + fh), d = p * per;
  var P = [[x, y], [x + fw, y], [x + fw, y + fh], [x, y + fh], [x, y]], segs = [fw, fh, fw, fh];
  c.strokeStyle = k.paper; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y);
  for (var i = 0; i < 4 && d > 0; i++) { var u = Math.min(1, d / segs[i]); c.lineTo(P[i][0] + (P[i + 1][0] - P[i][0]) * u, P[i][1] + (P[i + 1][1] - P[i][1]) * u); d -= segs[i]; } c.stroke();
  c.fillStyle = k.acc; P.slice(0, 4).forEach(function (q, i) { if (p * 4 > i) c.fillRect(q[0] - 3.5, q[1] - 3.5, 7, 7); });
  var ta = io(seg(t, 2, 1)), s = '작업실', px = TS(c, s, fw, fh, .42, .78, 300);
  c.globalAlpha = outA(t) * ta; c.font = FONT(px, 300); c.letterSpacing = px * .28 + 'px'; c.fillStyle = k.paper; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, w / 2 + px * .14, h / 2); c.letterSpacing = '0px';
  c.globalAlpha = 1;
};

OP['tracking-expand'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var p = eo(seg(t, .5, 3)), s = '여백', base = TS(c, s, w, h, .3, .4, 700), sp = base * (-.12 + p * .9);
  c.globalAlpha = outA(t) * clamp(seg(t, .5, 1.2)); c.font = FONT(base, 700); c.letterSpacing = sp + 'px'; c.fillStyle = k.paper; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, w / 2 + sp / 2, h * .46); c.letterSpacing = '0px';
  var lw = w * .5 * io(seg(t, 1.6, 1.4)); c.fillStyle = k.acc; c.fillRect(w / 2 - lw / 2, h * .72, lw, 2);
  c.globalAlpha = outA(t) * clamp(seg(t, 2.4, .8)) * .6; mono(c, 'S P A C E', w / 2, h * .82, h * .045, k.paper, 'center');
  c.globalAlpha = 1;
};

OP['flash-reveal'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var f = seg(t, .7, .25), d = seg(t, .95, 1.2), white = f < 1 ? f : 1 - io(d), glow = 1 - io(seg(t, 1.1, 1.6));
  var s = '첫날', px = TS(c, s, w, h, .44, .7);
  if (f >= 1) { c.save(); c.shadowColor = '#FFFFFF'; c.shadowBlur = h * .25 * glow; say(c, s, w / 2, h / 2, px, glow > .02 ? '#FFFFFF' : k.paper); if (glow > .02) { c.globalAlpha = outA(t) * (1 - glow); say(c, s, w / 2, h / 2, px, k.acc); } c.restore(); }
  if (white > 0) { c.globalAlpha = outA(t) * white; c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, w, h); }
  c.globalAlpha = 1;
};

OP['spotlight-reveal'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var s = '주인공', px = TS(c, s, w, h, .4, .78), p = io(seg(t, .5, 2.4)), sx = w * (.12 + .76 * p), sy = h * (.5 + Math.sin(p * Math.PI) * .12), r = h * .42, full = io(seg(t, 3, .8));
  say(c, s, w / 2, h / 2, px, 'rgba(244,241,234,.07)');
  layer2(c, w, h, function (x) {
    say(x, s, w / 2, h / 2, px, k.paper); x.globalCompositeOperation = 'destination-in';
    var g = x.createRadialGradient(sx, sy, 0, sx, sy, r * (1 + full * 3)); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.7, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'source-over';
  });
  if (full < 1) { var g2 = c.createRadialGradient(sx, sy, 0, sx, sy, r); g2.addColorStop(0, 'rgba(255,240,200,.16)'); g2.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = g2; c.globalAlpha = outA(t) * (1 - full); c.fillRect(0, 0, w, h); }
  c.globalAlpha = outA(t) * full; c.fillStyle = k.acc; c.fillRect(w / 2 - px * .5, h / 2 + px * .62, px, 3);
  c.globalAlpha = 1;
};

OP['film-leader'] = function (c, w, h, t, k) {
  var p = P8(t), n = 3 - Math.floor(clamp((p - .4) / 3) * 3), u = ((p - .4) % 1 + 1) % 1, cnt = p >= .4 && p < 3.4, cx = w / 2, cy = h / 2, R = h * .4;
  if (cnt) {
    bgc(c, w, h, '#8C8A84'); fade(c, t);
    c.fillStyle = '#A9A69E'; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, w, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.closePath(); c.fill();
    c.strokeStyle = '#F4F1EA'; c.lineWidth = 2; [R, R * .82].forEach(function (r) { c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); });
    c.beginPath(); c.moveTo(0, cy); c.lineTo(w, cy); c.moveTo(cx, 0); c.lineTo(cx, h); c.stroke();
    say(c, String(n), cx, cy + h * .02, h * .5, k.ink, 'center', 800);
  } else {
    bgc(c, w, h, k.ink); fade(c, t);
    var a = io(seg(t, 3.5, .8)), s = '상영', px = TS(c, s, w, h, .36, .6);
    c.globalAlpha = outA(t) * a; say(c, s, cx, cy, px, k.paper);
    c.fillStyle = k.acc; for (var i = 0; i < 9; i++) { c.fillRect(w * .08 + i * w * .1, h * .08, w * .05, h * .06); c.fillRect(w * .08 + i * w * .1, h * .86, w * .05, h * .06); }
    if (p >= 3.4 && p < 3.55) { c.globalAlpha = 1 - (p - 3.4) / .15; c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, w, h); }
  }
  c.globalAlpha = 1;
};

// ── CRAFT · 손으로 붙이고 뿌리기 ──────────────────────────────

OP['particle-form'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var s = '모임', px = Math.round(TS(c, s, w, h, .5, .7)), step = Math.max(3, Math.round(px / 16)), D = dots(s, px, step), cx = w / 2, cy = h / 2, solid = io(seg(t, 3, .8));
  D.forEach(function (q, i) { var st = hash(i) * .9, e = io(seg(t, .4 + st, 1.8)), a0 = hash(i + 5) * TAU, r0 = h * (.5 + hash(i + 2) * .6), ang = a0 + (1 - e) * 3, rr = r0 * (1 - e);
    var x = cx + q[0] + Math.cos(ang) * rr * 1.4, y = cy + q[1] + Math.sin(ang) * rr * .8;
    c.fillStyle = i % 5 ? k.paper : k.acc; c.globalAlpha = outA(t) * (.4 + .6 * e) * (1 - solid * .9); disc(c, x, y, step * .38); });
  if (solid > 0) { c.globalAlpha = outA(t) * solid; say(c, s, cx, cy, px, k.paper); }
  c.globalAlpha = 1;
};

OP['ink-splash'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); fade(c, t);
  var p = back(seg(t, .5, .45)), cx = w / 2, cy = h / 2;
  if (p > 0) { c.fillStyle = k.acc;
    c.save(); c.translate(cx, cy); c.scale(p, p);
    c.beginPath(); for (var i = 0; i <= 40; i++) { var a = i / 40 * TAU, r = h * (.3 + hash(i * 3) * .07) * (i % 5 === 0 ? 1.2 : 1); var x = Math.cos(a) * r * 1.6, y = Math.sin(a) * r; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.closePath(); c.fill();
    for (var j = 0; j < 14; j++) { var a2 = hash(j + 50) * TAU, d = h * (.5 + hash(j + 60) * .25), rr = h * (.015 + hash(j + 70) * .04) * clamp(seg(t, .6, .4) * 2); disc(c, Math.cos(a2) * d * 1.5, Math.sin(a2) * d * .9, rr); }
    c.restore(); }
  var sp = back(seg(t, .95, .35)); if (sp > 0) { var s = '물감', px = TS(c, s, w, h, .3, .5); c.save(); c.translate(cx, cy); c.rotate(-.06); c.scale(1.6 - .6 * sp, 1.6 - .6 * sp); c.globalAlpha = outA(t) * clamp(sp * 2); say(c, s, 0, 0, px, k.paper); c.restore(); }
  c.globalAlpha = 1;
};

OP['paper-cut'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var cx = w / 2, cy = h / 2, L = [[k.deep, -1, .9, .07, .3], ['#F2C53D', 1, .75, -.05, .24], [k.paper, -1, .6, .02, .19]];
  L.forEach(function (l, i) { var e = back(seg(t, .4 + i * .35, .6)); if (e <= 0) return;
    c.save(); c.translate(cx + l[1] * (1 - e) * w * .8, cy); c.rotate(l[3] * e + l[1] * (1 - e) * .4);
    c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = h * .04; c.shadowOffsetY = h * .015; c.fillStyle = l[0]; torn(c, 0, 0, w * l[2] / 2 * .78, h * l[4], i + 1); c.fill(); c.restore(); });
  var tp = back(seg(t, 1.5, .5)); if (tp > 0) { var s = '종이', px = TS(c, s, w, h, .3, .4); c.save(); c.translate(cx, cy); c.rotate(.02); c.scale(tp, tp); say(c, s, 0, 0, px, k.ink); c.restore(); }
  c.globalAlpha = 1;
};

OP['ransom-collage'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); fade(c, t);
  c.fillStyle = 'rgba(20,22,27,.12)'; for (var x = 0; x < w * .3; x += h * .04) for (var y = 0; y < h * .45; y += h * .04) disc(c, x + h * .02, y + h * .02, h * .007);
  c.save(); c.beginPath(); c.rect(w * .55, h * .78, w * .45, h * .08); c.clip(); c.fillStyle = k.ink; for (var x2 = w * .5; x2 < w; x2 += h * .05) { c.beginPath(); c.moveTo(x2, h * .86); c.lineTo(x2 + h * .025, h * .78); c.lineTo(x2 + h * .05, h * .78); c.lineTo(x2 + h * .025, h * .86); c.fill(); } c.restore();
  var s = '스크랩', fill = [k.acc, k.ink, '#F2C53D'], txt = [k.paper, k.paper, k.ink], px = TS(c, s, w, h, .3, .5), sl = [-1, 0, 1].map(function (i) { return i * px * 1.32; });
  for (var i = 0; i < s.length; i++) { var e = back(seg(t, .5 + i * .22, .45)); if (e <= 0) continue; var r = (hash(i + 3) - .5) * .35, cw = px * 1.05, ch = px * 1.2;
    c.save(); c.translate(w / 2 + sl[i], h * .48 + (hash(i + 8) - .5) * h * .1); c.rotate(r + (1 - e) * .8); c.scale(e, e);
    c.fillStyle = fill[i % 3]; c.fillRect(-cw / 2, -ch / 2, cw, ch); say(c, s[i], 0, px * .03, px * (i === 1 ? .9 : 1), txt[i % 3], 'center', i === 2 ? 700 : 900); c.restore(); }
  c.globalAlpha = 1;
};

OP['tape-label'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.deep); fade(c, t);
  var e = back(seg(t, .4, .55)), cw = w * .48, ch = h * .5;
  if (e > 0) { c.save(); c.translate(w / 2, h / 2 - (1 - e) * h); c.rotate(-.04);
    c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = h * .05; c.shadowOffsetY = h * .02; c.fillStyle = '#FFFDF6'; c.fillRect(-cw / 2, -ch / 2, cw, ch); c.shadowColor = 'transparent';
    c.strokeStyle = 'rgba(20,22,27,.08)'; c.lineWidth = 1; for (var y = -ch / 2 + ch * .2; y < ch / 2; y += ch * .16) { c.beginPath(); c.moveTo(-cw / 2 + 6, y); c.lineTo(cw / 2 - 6, y); c.stroke(); }
    var tp = io(seg(t, 1.3, .6)), s = '메모', px = TS(c, s, cw, ch, .5, .7); c.globalAlpha = outA(t) * tp; say(c, s, 0, ch * .04, px, k.ink); c.globalAlpha = outA(t);
    [[-1, -.44], [1, .4]].forEach(function (q, i) { var tp2 = back(seg(t, .95 + i * .2, .3)); if (tp2 <= 0) return;
      c.save(); c.translate(q[0] * cw * .46, -ch / 2); c.rotate(q[1]); c.scale(tp2, tp2); c.fillStyle = 'rgba(242,197,61,.78)'; c.fillRect(-cw * .14, -ch * .07, cw * .28, ch * .14); c.restore(); });
    c.restore(); }
  c.globalAlpha = 1;
};

OP['brush-banner'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.paper); fade(c, t);
  var p = io(seg(t, .5, 1)), x0 = w * .08, x1 = x0 + (w * .84) * p, y = h / 2, bh = h * .3;
  if (p > 0) { c.save(); c.beginPath(); c.rect(0, 0, x1, h); c.clip(); c.fillStyle = k.acc;
    c.beginPath(); c.moveTo(x0, y - bh / 2);
    for (var i = 0; i <= 30; i++) { var u = i / 30; c.lineTo(x0 + u * w * .84, y - bh / 2 + (hash(i) - .5) * bh * .14 + Math.sin(u * 3) * bh * .06); }
    for (var j = 30; j >= 0; j--) { var v = j / 30; c.lineTo(x0 + v * w * .84, y + bh / 2 + (hash(j + 40) - .5) * bh * .18 + Math.sin(v * 3) * bh * .06); }
    c.closePath(); c.fill();
    c.strokeStyle = k.paper; c.globalAlpha = outA(t) * .35; c.lineWidth = 1; for (var b = 0; b < 6; b++) { var by = y - bh * .35 + b * bh * .14; c.beginPath(); c.moveTo(x0 + w * .55 + hash(b) * w * .1, by); c.lineTo(x0 + w * .84, by + (hash(b + 3) - .5) * 4); c.stroke(); }
    c.restore(); }
  var ta = io(seg(t, 1.2, .6)), s = '한 획', px = TS(c, s, w, h, .25, .5); c.globalAlpha = outA(t) * ta; say(c, s, w / 2, y + bh * .02, px, k.paper);
  c.globalAlpha = 1;
};

// ── MOVE · 부딪치고 맞추기 ──────────────────────────────

OP['shockwave'] = function (c, w, h, t, k) {
  var hit = P8(t) - .6, sh = hit > 0 && hit < .4 ? (1 - hit / .4) * h * .03 : 0;
  bgc(c, w, h, k.ink); fade(c, t); c.save(); c.translate(Math.sin(hit * 90) * sh, Math.cos(hit * 70) * sh);
  [0, .12, .24].forEach(function (d, i) { var r = eo(seg(t, .6 + d, .9)); if (r <= 0 || r >= 1) return; c.strokeStyle = i ? k.paper : k.acc; c.globalAlpha = outA(t) * (1 - r) * (i ? .5 : 1); c.lineWidth = h * .03 * (1 - r) + 1; c.beginPath(); c.ellipse(w / 2, h / 2, w * .7 * r, h * .5 * r, 0, 0, TAU); c.stroke(); });
  c.globalAlpha = outA(t); var e = seg(t, .45, .2), b = back(seg(t, .6, .35)), s = '출발', px = TS(c, s, w, h, .42, .62);
  if (e > 0) { var sc = P8(t) < .6 ? 2.4 - e * 1.2 : 1.2 - .2 * b; c.save(); c.translate(w / 2, h / 2); c.scale(sc, sc); say(c, s, 0, 0, px, k.paper); c.restore();
    c.fillStyle = k.acc; c.fillRect(w / 2 - px * .7 * b, h / 2 + px * .66, px * 1.4 * b, h * .025); }
  c.restore(); c.globalAlpha = 1;
};

OP['slash-cut'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var s = '단칼', px = TS(c, s, w, h, .46, .6), p = P8(t), blade = seg(t, .5, .25), j = io(seg(t, .85, .7)), ang = -.35, tn = Math.tan(ang), dx = Math.cos(ang), dy = Math.sin(ang);
  var Y = function (x) { return h / 2 + (x - w / 2) * tn; }, off = (1 - j) * h * .22;
  if (blade >= 1) [1, -1].forEach(function (sd) { c.save(); c.beginPath();
    c.moveTo(-w, Y(-w)); c.lineTo(w * 2, Y(w * 2)); c.lineTo(w * 2, sd > 0 ? -h * 3 : h * 4); c.lineTo(-w, sd > 0 ? -h * 3 : h * 4); c.closePath(); c.clip();
    c.translate(sd * dx * off, sd * dy * off); say(c, s, w / 2, h / 2, px, k.paper); c.restore(); });
  if (p > .5 && p < 1.1) { var bl = clamp((p - .5) / .25), a = 1 - clamp((p - .75) / .35), xa = -w * .05, xb = xa + w * 1.1 * bl;
    c.strokeStyle = '#FFFFFF'; c.globalAlpha = outA(t) * a; c.lineWidth = 2.5; c.beginPath(); c.moveTo(xa, Y(xa)); c.lineTo(xb, Y(xb)); c.stroke(); }
  c.globalAlpha = outA(t) * clamp(seg(t, 1.6, .5)); c.fillStyle = k.acc; c.fillRect(w / 2 - px * .3, h / 2 + px * .68, px * .6, h * .022);
  c.globalAlpha = 1;
};

OP['frame-dive'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var z = io(seg(t, .4, 2.2)) * 3, cx = w / 2, cy = h / 2;
  for (var i = 4; i >= 0; i--) { var d = i - z; if (d < -.15) continue; var s = Math.pow(2.2, -d), fw = w * .62 * s, fh = h * .64 * s;
    c.globalAlpha = outA(t) * clamp(1 - Math.max(0, -d) * 6) * clamp(1.6 - d * .35) * (i > 3 ? 1 - io(seg(t, 2.1, .5)) : 1); c.strokeStyle = i === 3 ? k.acc : k.paper; c.lineWidth = i === 3 ? 2.5 : 1.4; c.strokeRect(cx - fw / 2, cy - fh / 2, fw, fh);
    if (i < 3) mono(c, '0' + (i + 1), cx - fw / 2 + 6, cy - fh / 2 + h * .05, h * .045, 'rgba(244,241,234,.6)'); }
  var ta = io(seg(t, 2.3, .7)), sx = '안으로', px = TS(c, sx, w * .62, h * .64, .42, .7);
  c.globalAlpha = outA(t) * ta; say(c, sx, cx, cy, px, k.paper);
  c.globalAlpha = 1;
};

OP['spiral-lineup'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var s = '소용돌이', px = TS(c, s, w, h, .3, .8), sl = slots(c, s, px), cx = w / 2, cy = h / 2;
  c.strokeStyle = k.deep; c.lineWidth = 1.2; c.beginPath(); for (var a = 0; a < TAU * 3; a += .1) { var r = a / (TAU * 3) * h * .48; c.lineTo(cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r); }
  c.globalAlpha = outA(t) * (1 - io(seg(t, 2.4, .8))); c.stroke(); c.globalAlpha = outA(t);
  for (var i = 0; i < s.length; i++) { var e = io(seg(t, .4 + i * .18, 2)), an = (1 - e) * TAU * 1.5 + i * 1.3, rr = (1 - e) * h * .46;
    c.save(); c.translate(cx + sl[i] * e + Math.cos(an) * rr * 1.5, cy + Math.sin(an) * rr); c.rotate((1 - e) * TAU); say(c, s[i], 0, 0, px * (.6 + .4 * e), i === 1 ? k.acc : k.paper); c.restore(); }
  c.globalAlpha = 1;
};

OP['ribbon-reveal'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var p = io(seg(t, .5, 1.8)), head = -w * .2 + p * w * 2.3, s = '선물', px = TS(c, s, w, h, .42, .6), rw = h * .2, wav = function (x) { return h / 2 + Math.sin(x / w * TAU * 1.2 + P8(t) * 2) * h * .2; };
  c.save(); c.beginPath(); c.rect(0, 0, Math.max(0, head - w * .25), h); c.clip(); say(c, s, w / 2, h / 2, px, k.paper); c.restore();
  var tail = head - w * .6; c.lineCap = 'round'; c.lineJoin = 'round';
  [[rw, k.deep, 0], [rw * .8, k.acc, -rw * .08]].forEach(function (L) { c.strokeStyle = L[1]; c.lineWidth = L[0]; c.beginPath();
    for (var x = Math.max(-rw, tail); x <= Math.min(w + rw, head); x += 4) { var y = wav(x) + L[2]; if (x === Math.max(-rw, tail)) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke(); });
  c.globalAlpha = 1;
};

OP['signal-lock'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); fade(c, t);
  var p = P8(t), lock = io(seg(t, .6, 2)), s = '수신', px = TS(c, s, w, h, .46, .6), n = 18, fr = Math.floor(p * 24);
  var sc = (c.getTransform ? c.getTransform().a : 1) || 1, o = SIG.o || (SIG.o = document.createElement('canvas'));
  o.width = Math.ceil(w * sc); o.height = Math.ceil(h * sc); var x = o.getContext('2d'); x.setTransform(sc, 0, 0, sc, 0, 0); say(x, s, w / 2, h / 2, px, k.paper);
  for (var i = 0; i < n; i++) { var y0 = i * h / n, off = (hash(i * 13 + fr) - .5) * w * .5 * (1 - lock); c.save(); c.beginPath(); c.rect(0, y0, w, h / n + .5); c.clip();
    c.globalAlpha = outA(t) * (lock < .2 ? .5 : 1); c.drawImage(o, off, 0, w, h); c.restore(); }
  c.globalAlpha = outA(t) * (1 - lock) * .6; for (var j = 0; j < 30; j++) { c.fillStyle = hash(j + fr) > .5 ? k.paper : k.acc; c.fillRect(hash(j * 3 + fr) * w, hash(j * 7 + fr) * h, hash(j + fr * 2) * w * .3, 2); }
  c.globalAlpha = outA(t); var bars = Math.round(lock * 4); for (var b = 0; b < 4; b++) { c.fillStyle = b < bars ? k.acc : 'rgba(244,241,234,.2)'; var bh = h * .03 * (b + 1); c.fillRect(w - h * .2 + b * h * .035, h * .16 - bh, h * .022, bh); }
  c.globalAlpha = 1;
};

if (typeof module !== 'undefined') module.exports = { OP: OP };
