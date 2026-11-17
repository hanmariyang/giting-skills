// 3D 공간 48: 캔버스 그리기 함수 묶음 (의존성 0 · WebGL 없이 2D 캔버스 위에 작은 원근 투영기)
// 갤러리 데모(demos/m23-space-3d.html)와 홍보 영상(render.mjs)이 같은 함수를 쓴다.
// 정본은 이 파일 하나. 데모를 고치려면 여기를 고치고 `node tools/space/gen.mjs` → `node build.mjs`.
//
// SP[id](c, w, h, t, k)
//   c: 2D 컨텍스트 (0,0 ~ w,h 가 칸)   t: 초. 8초에 한 바퀴(P8). 돌아가는 장면은 8초가 한 주기, 한 번 하는 장면은 7.2~8초에 사라졌다 다시 한다.
//   k: { acc, deep, paper, ink }
// 좌표계: x 오른쪽 · y 아래 · z 앞(화면 안쪽). 카메라는 +z 를 본다. 글자·낱말은 전부 이 파일에서 만든다.

/*@helpers*/
var TAU = Math.PI * 2;
var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
var io = function (t) { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
var eo = function (t) { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
var ei = function (t) { t = clamp(t); return t * t * t; };
var back = function (t) { t = clamp(t); var s = 1.7; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
var frac = function (v) { return v - Math.floor(v); };
var hash = function (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
var P8 = function (t) { var p = t % 8; return p < 0 ? p + 8 : p; };
var seg = function (t, a, d) { return clamp((P8(t) - a) / d); };
var outA = function (t) { return 1 - clamp((P8(t) - 7.2) / .8); };
var bgc = function (c, w, h, col) { c.fillStyle = col; c.fillRect(0, 0, w, h); };
var FONT = function (px, wt) { return (wt || 900) + ' ' + Math.round(px) + 'px -apple-system,"Apple SD Gothic Neo",system-ui,sans-serif'; };
var say = function (c, s, x, y, px, col, al, wt) { c.font = FONT(px, wt); c.fillStyle = col; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
var tw = function (c, s, px, wt) { c.font = FONT(px, wt); return c.measureText(s).width; };
var rgba = function (hex, a) { return 'rgba(' + parseInt(hex.slice(1, 3), 16) + ',' + parseInt(hex.slice(3, 5), 16) + ',' + parseInt(hex.slice(5, 7), 16) + ',' + a + ')'; };
// ── 벡터 ──
var add3 = function (a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; };
var mul3 = function (a, s) { return [a[0] * s, a[1] * s, a[2] * s]; };
var rotY = function (p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };
var rotX = function (p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; };
var rotZ = function (p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; };
// ── 카메라 · 투영 ──  cam(w,h,{pos,yaw,pitch,roll,f})  proj → [sx, sy, 배율, 깊이] 또는 null(뒤)
var cam = function (w, h, o) { o = o || {}; return { w: w, h: h, pos: o.pos || [0, 0, 0], yaw: o.yaw || 0, pitch: o.pitch || 0, roll: o.roll || 0, f: o.f || h * 1.1, near: 6 }; };
var proj = function (C, p) {
  var q = [p[0] - C.pos[0], p[1] - C.pos[1], p[2] - C.pos[2]];
  if (C.yaw) q = rotY(q, -C.yaw); if (C.pitch) q = rotX(q, C.pitch); if (C.roll) q = rotZ(q, -C.roll);
  if (q[2] < C.near) return null; var s = C.f / q[2];
  return [C.w / 2 + q[0] * s, C.h / 2 + q[1] * s, s, q[2]];
};
var depth = function (C, p) { var q = [p[0] - C.pos[0], p[1] - C.pos[1], p[2] - C.pos[2]]; if (C.yaw) q = rotY(q, -C.yaw); if (C.pitch) q = rotX(q, C.pitch); return q[2]; };
// 그릴 것을 모았다가 먼 것부터 그린다(화가 알고리즘)
var Q = [];
var put = function (d, fn) { Q.push([d, fn]); };
var flush = function () { Q.sort(function (a, b) { return b[0] - a[0]; }); for (var i = 0; i < Q.length; i++) Q[i][1](); Q.length = 0; };
// 네모(세계 좌표 네 점) 채우기 · 선
var quad = function (c, C, P, col, stroke, lw) {
  var s = [], i; for (i = 0; i < P.length; i++) { var p = proj(C, P[i]); if (!p) return false; s.push(p); }
  c.beginPath(); c.moveTo(s[0][0], s[0][1]); for (i = 1; i < s.length; i++) c.lineTo(s[i][0], s[i][1]); c.closePath();
  if (col) { c.fillStyle = col; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); } return true;
};
var line3 = function (c, C, a, b, col, lw, n) {
  n = n || 1; c.strokeStyle = col; c.lineWidth = lw || 1; c.beginPath(); var on = false;
  for (var i = 0; i <= n; i++) { var p = proj(C, add3(a, mul3(add3(b, mul3(a, -1)), i / n))); if (!p) { on = false; continue; } if (on) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); on = true; }
  c.stroke();
};
// 바닥 격자: y 높이, 간격 st, 범위 rg(카메라 z 기준 앞으로), 선 색
var floorGrid = function (c, C, y, st, rg, col, lw) {
  var z0 = Math.floor((C.pos[2]) / st) * st, i;
  c.strokeStyle = col; c.lineWidth = lw || 1;
  for (i = -rg; i <= rg; i += st) line3(c, C, [i, y, z0 - st], [i, y, z0 + rg * 2], col, lw, 24);
  for (i = 0; i <= rg * 2; i += st) line3(c, C, [-rg, y, z0 + i], [rg, y, z0 + i], col, lw, 1);
};
// 글자를 면 위에 붙여 그린다. o 글자 가운데(세계) · r 오른쪽 단위벡터 · u 아래 단위벡터 (1 = 1px)
// 글자마다 세 꼭짓점을 투영해 아핀 변환으로 그리므로 작은 글자는 원근이 거의 맞는다
var txt3 = function (c, C, s, o, r, u, px, col, wt, al, both) {
  c.font = FONT(px, wt); var ws = [], L = 0, i; for (i = 0; i < s.length; i++) { ws.push(c.measureText(s[i]).width); L += ws[i]; }
  var x = al === 'left' ? 0 : al === 'right' ? -L : -L / 2, h2 = px * .55;
  c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (i = 0; i < s.length; i++) {
    var cw = ws[i], cx = x + cw / 2;
    var p0 = proj(C, add3(add3(o, mul3(r, cx - cw / 2)), mul3(u, -h2))), p1 = proj(C, add3(add3(o, mul3(r, cx + cw / 2)), mul3(u, -h2))), p2 = proj(C, add3(add3(o, mul3(r, cx - cw / 2)), mul3(u, h2)));
    x += cw; if (!p0 || !p1 || !p2) continue;
    var ax = (p1[0] - p0[0]) / cw, ay = (p1[1] - p0[1]) / cw, bx = (p2[0] - p0[0]) / (h2 * 2), by = (p2[1] - p0[1]) / (h2 * 2);
    if (ax * by - ay * bx <= 0) { // 뒷면: both 면 거울상으로 흐리게 그린다(고리 안쪽에서 비치는 글자)
      if (!both) continue; c.save(); c.globalAlpha *= .35; c.transform(-ax, -ay, bx, by, p1[0], p1[1]); c.font = FONT(px, wt); c.fillText(s[i], cw / 2, h2); c.restore(); continue; }
    c.save(); c.transform(ax, ay, bx, by, p0[0], p0[1]); c.font = FONT(px, wt); c.fillText(s[i], cw / 2, h2); c.restore();
  }
};
// 글자 판: 바탕 네모 + 글자 (세계 좌표 가운데 o, 오른쪽 r, 아래 u, 판 여백 pad)
var plate = function (c, C, s, o, r, u, px, bg, fg, wt) {
  var L = tw(c, s, px, wt) + px * .5, H = px * 1.3, P = [
    add3(add3(o, mul3(r, -L / 2)), mul3(u, -H / 2)), add3(add3(o, mul3(r, L / 2)), mul3(u, -H / 2)),
    add3(add3(o, mul3(r, L / 2)), mul3(u, H / 2)), add3(add3(o, mul3(r, -L / 2)), mul3(u, H / 2))];
  if (quad(c, C, P, bg)) txt3(c, C, s, o, r, u, px, fg, wt);
};
var WORDS = ['깊이', '공간', '3D', '속도', '카메라', '문자', '회전', '궤도', 'DEPTH', 'SPACE', 'MOTION', 'TYPE', '빛', '층', '거리', 'FLY'];
var X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1], NZ = [0, 0, -1];
var disc = function (c, x, y, r) { if (r > .2) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } };
// 기둥 숲 + 바닥 격자 + 낱말 상자 하나를 피사체로 두고 카메라만 바꾼다
var pillars = function (c, C, h, k, n) {
  var i; for (i = 0; i < (n || 14); i++) { var x = (hash(i) - .5) * h * 3.2, z = hash(i + 20) * h * 3 - h * .4, ph = h * .5 + hash(i + 40) * h * .6, hw = h * .05;
    if (Math.abs(x) < h * .25 && z < h * .3) continue;
    (function (x, z, ph) { put(depth(C, [x, 0, z]), function () {
      quad(c, C, [[x - hw, h * .3, z - hw], [x + hw, h * .3, z - hw], [x + hw, h * .3 - ph, z - hw], [x - hw, h * .3 - ph, z - hw]], rgba(k.paper, .08), rgba(k.acc, .5), 1);
      quad(c, C, [[x + hw, h * .3, z - hw], [x + hw, h * .3, z + hw], [x + hw, h * .3 - ph, z + hw], [x + hw, h * .3 - ph, z - hw]], rgba(k.paper, .04), rgba(k.acc, .3), 1); }); })(x, z, ph); }
};
var wordBox = function (c, C, h, k, s, o, sz, rot) {
  var r = rotY(X, rot || 0), d = rotY(Z, rot || 0), hw = sz, hd = sz * .55;
  var fr = add3(o, mul3(d, -hd)), bk = add3(o, mul3(d, hd));
  put(depth(C, bk), function () { plate(c, C, s, bk, mul3(r, -1), Y, sz * .5, k.deep, k.paper); });
  put(depth(C, add3(o, mul3(r, hw))), function () { quad(c, C, [add3(add3(fr, mul3(r, hw)), mul3(Y, -hw * .5)), add3(add3(bk, mul3(r, hw)), mul3(Y, -hw * .5)), add3(add3(bk, mul3(r, hw)), mul3(Y, hw * .5)), add3(add3(fr, mul3(r, hw)), mul3(Y, hw * .5))], k.acc); });
  put(depth(C, add3(o, mul3(r, -hw))), function () { quad(c, C, [add3(add3(fr, mul3(r, -hw)), mul3(Y, -hw * .5)), add3(add3(bk, mul3(r, -hw)), mul3(Y, -hw * .5)), add3(add3(bk, mul3(r, -hw)), mul3(Y, hw * .5)), add3(add3(fr, mul3(r, -hw)), mul3(Y, hw * .5))], k.acc); });
  put(depth(C, add3(o, mul3(Y, -hw * .5))), function () { quad(c, C, [add3(add3(fr, mul3(r, -hw)), mul3(Y, -hw * .5)), add3(add3(fr, mul3(r, hw)), mul3(Y, -hw * .5)), add3(add3(bk, mul3(r, hw)), mul3(Y, -hw * .5)), add3(add3(bk, mul3(r, -hw)), mul3(Y, -hw * .5))], rgba(k.paper, .9)); });
  put(depth(C, fr), function () { plate(c, C, s, fr, r, Y, sz * .5, k.paper, k.ink); });
};
var sceneFloor = function (c, C, w, h, k) { bgc(c, w, h, k.ink); floorGrid(c, C, h * .3, h * .3, h * 4, rgba(k.paper, .1)); };
// 점 하나(깊이에 따라 크기)
var dot3 = function (c, C, p, r, col) { var q = proj(C, p); if (!q) return; c.fillStyle = col; var rr = r * q[2]; if (rr > .3) { c.beginPath(); c.arc(q[0], q[1], rr, 0, TAU); c.fill(); } };
// 글자 모양을 점 집합으로(가루·블록용). 한 번 재고 기억한다. 결과는 [x,y] (가운데 0)
var GD = {};
var glyphDots = function (s, px, step, wt) {
  var key = s + '|' + Math.round(px) + '|' + step; if (GD[key]) return GD[key];
  var o = document.createElement('canvas'), x = o.getContext('2d'); x.font = FONT(px, wt);
  var W = Math.ceil(x.measureText(s).width + px * .4), H = Math.ceil(px * 1.4); o.width = W; o.height = H;
  x.font = FONT(px, wt); x.fillStyle = '#000'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, W / 2, H / 2);
  var d = x.getImageData(0, 0, W, H).data, out = [];
  for (var y = 0; y < H; y += step) for (var X0 = 0; X0 < W; X0 += step) if (d[(y * W + X0) * 4 + 3] > 120) out.push([X0 - W / 2, y - H / 2]);
  return (GD[key] = out);
};
// 정육면체: 가운데 o, 반변 a, 회전(yaw, pitch), 면 색 배열 6(앞 뒤 오른 왼 위 아래) · 면마다 글자(선택)
var cube = function (c, C, o, a, yaw, pit, cols, labels, px) {
  var R = function (p) { return add3(o, rotY(rotX(p, pit), yaw)); }, faces = [
    [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [0, 0, -1]], [[1, -1, 1], [-1, -1, 1], [-1, 1, 1], [1, 1, 1], [0, 0, 1]],
    [[1, -1, -1], [1, -1, 1], [1, 1, 1], [1, 1, -1], [1, 0, 0]], [[-1, -1, 1], [-1, -1, -1], [-1, 1, -1], [-1, 1, 1], [-1, 0, 0]],
    [[-1, -1, 1], [1, -1, 1], [1, -1, -1], [-1, -1, -1], [0, -1, 0]], [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1], [0, 1, 0]]], i;
  for (i = 0; i < 6; i++) (function (f, i) {
    var P = [R(mul3(f[0], a)), R(mul3(f[1], a)), R(mul3(f[2], a)), R(mul3(f[3], a))], ctr = R(mul3(f[4], a));
    put(depth(C, ctr), function () {
      var s0 = proj(C, P[0]), s1 = proj(C, P[1]), s3 = proj(C, P[3]); if (!s0 || !s1 || !s3) return;
      if ((s1[0] - s0[0]) * (s3[1] - s0[1]) - (s1[1] - s0[1]) * (s3[0] - s0[0]) <= 0) return; // 뒷면
      quad(c, C, P, cols[i % cols.length]);
      if (labels && labels[i]) { var r = mul3(add3(P[1], mul3(P[0], -1)), 1 / (2 * a)), u = mul3(add3(P[3], mul3(P[0], -1)), 1 / (2 * a)); txt3(c, C, labels[i], ctr, r, u, px || a * .9, i % 2 ? '#F4F1EA' : '#14161B'); }
    });
  })(faces[i], i);
};
/*@end*/

var SP = {};

// ═══ TYPE · 3D 공간 타이포 ═══

// 문자 터널: 낱말 판이 앞뒤로 흩어져 있고 카메라가 그 사이를 뚫고 나간다
SP['sp-type-tunnel'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, 0, frac(t / 8) * 1600] }), L = 1600, i;
  for (i = 0; i < 26; i++) {
    var z = ((hash(i) * L - C.pos[2]) % L + L) % L + C.pos[2], a = hash(i + 50) * TAU, rr = h * .35 + hash(i + 90) * h * .5;
    var o = [Math.cos(a) * rr, Math.sin(a) * rr * .7, z], ang = (hash(i + 7) - .5) * .9, r = [Math.cos(ang), Math.sin(ang), 0], u = [-Math.sin(ang), Math.cos(ang), 0];
    (function (o, r, u, i) { put(depth(C, o), function () { var acc = i % 3 === 0; plate(c, C, WORDS[i % WORDS.length], o, r, u, h * .16, acc ? k.acc : k.paper, k.ink); }); })(o, r, u, i);
  }
  flush();
};

// 일어서는 제목: 바닥에 누워 있던 글자가 뒤꿈치를 축으로 일어선다
SP['sp-type-rise'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * .32, -h * .9], pitch: .28 });
  floorGrid(c, C, h * .3, h * .3, h * 3, rgba(k.paper, .12));
  var a = back(seg(t, .5, 1.6)) * Math.PI / 2, u = [0, -Math.sin(a), -Math.cos(a)], o = [0, h * .3 - Math.sin(a) * h * .14, -Math.cos(a) * h * .14];
  c.globalAlpha = outA(t);
  c.fillStyle = rgba(k.acc, .35); var sh = proj(C, [0, h * .3, 0]); if (sh) { c.beginPath(); c.ellipse(sh[0], sh[1], Math.max(0, h * .3 * sh[2] * (1 - a / 1.7)), h * .03 * sh[2], 0, 0, TAU); c.fill(); }
  txt3(c, C, '일어선다', o, X, mul3(u, -1), h * .26, k.paper);
  var tag = proj(C, [h * .55, h * .3, -h * .1]); if (tag && a > 1.4) { say(c, 'RISE', tag[0], tag[1], h * .07, k.acc, 'left', 700); }
  c.globalAlpha = 1;
};

// 바닥 글자 저공비행: 바닥에 깔린 큰 낱말 위를 낮게 스친다
SP['sp-type-floor'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * .22, frac(t / 8) * 2400], pitch: .18 }), i;
  floorGrid(c, C, h * .3, h * .5, h * 4, rgba(k.paper, .08));
  var ws = ['깊이', '저공', '비행', '바닥', 'LOW', 'FLY', '속도', '문자'];
  for (i = 0; i < 16; i++) { var z = ((i * 300 - C.pos[2]) % 2400 + 2400) % 2400 + C.pos[2] - 200, x = (i % 2 ? 1 : -1) * h * .35 * (1 + hash(i) * .4);
    if (z - C.pos[2] < h * .7) continue; txt3(c, C, ws[i % ws.length], [x, h * .3, z], X, NZ, h * .5, i % 4 === 1 ? k.acc : k.paper); }
  for (i = 0; i < 4; i++) { var zz = ((i * 600 + 150 - C.pos[2]) % 2400 + 2400) % 2400 + C.pos[2]; plate(c, C, i % 2 ? '飛' : 'LOW', [0, -h * .05, zz], X, Y, h * .12, k.acc, k.ink); }
};

// 문자 회랑: 양쪽 벽에 낱말이 흐르는 복도를 지나간다
SP['sp-type-corridor'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, 0, frac(t / 8) * 2000], f: h * .9 }), i, side;
  for (side = -1; side <= 1; side += 2) {
    var wx = side * h * .6;
    for (i = 0; i < 14; i++) { var z = ((i * 160 - C.pos[2]) % 2000 + 2000) % 2000 + C.pos[2] - 100, row = (i * 7) % 3 - 1;
      var o = [wx, row * h * .28, z], r = [0, 0, -side], u = Y;
      txt3(c, C, WORDS[(i * 5 + side + 1) % WORDS.length], o, r, u, h * .27, (i + side) % 4 === 0 ? k.acc : rgba(k.paper, .85)); }
    line3(c, C, [wx, -h * .45, C.pos[2]], [wx, -h * .45, C.pos[2] + 2200], rgba(k.acc, .5), 2, 20);
    line3(c, C, [wx, h * .45, C.pos[2]], [wx, h * .45, C.pos[2] + 2200], rgba(k.acc, .5), 2, 20);
  }
  for (i = 0; i < 10; i++) { var zl = ((i * 200 - C.pos[2]) % 2000 + 2000) % 2000 + C.pos[2]; line3(c, C, [-h * .6, h * .45, zl], [h * .6, h * .45, zl], rgba(k.paper, .15), 1, 1); }
};

// 링 문자: 글자 띠가 고리가 되어 여러 겹 돈다
SP['sp-type-ring'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * .95, -h * 1.35], pitch: .64 }), rings = [[h * .55, .25, 1, '공간 · 깊이 · 회전 · '], [h * .4, -.2, -1.4, 'RING · TYPE · MOTION · '], [h * .27, .45, 2, '빛 · 층 · 거리 · ']], ri;
  for (ri = 0; ri < rings.length; ri++) (function (R) {
    var rad = R[0], tilt = R[1], spd = R[2], s = R[3], n = Math.ceil(TAU * rad / (h * .11)), i;
    for (i = 0; i < n; i++) {
      var a = i / n * TAU + t * spd * .4, ch = s[i % s.length];
      var p = rotX([Math.cos(a) * rad, 0, Math.sin(a) * rad], tilt), rr = rotX([-Math.sin(a), 0, Math.cos(a)], tilt), uu = rotX([0, 1, 0], tilt);
      (function (p, rr, uu, ch, ri) { put(depth(C, p), function () { txt3(c, C, ch, p, rr, uu, h * .13, ri === 1 ? k.acc : k.paper, 900, 'center', true); }); })(p, rr, uu, ch, ri);
    }
  })(rings[ri]);
  flush();
};

// 깊이 레이어: 같은 낱말이 뒤로 몇 겹 겹치고 카메라가 숨 쉬듯 다가갔다 물러난다
SP['sp-type-layers'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, 0, -h * .9 - Math.sin(t / 8 * TAU) * h * .35] }), n = 9, i;
  for (i = n - 1; i >= 0; i--) { var z = i * h * .32, a = 1 - i / n;
    c.globalAlpha = .18 + a * .82; txt3(c, C, 'DEPTH', [i * h * .02, i * h * .015, z], X, Y, h * .34, i === 0 ? k.acc : k.paper); }
  c.globalAlpha = 1; var p = proj(C, [0, h * .26, 0]); if (p) say(c, '같은 글자 아홉 겹', p[0], p[1], h * .06, rgba(k.paper, .6), 'center', 600);
};

// 떠다니는 낱말 구름: 공처럼 흩어진 낱말들 둘레를 카메라가 한 바퀴 돈다
SP['sp-type-cloud'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var a = t / 8 * TAU, R = h * 1.3, C = cam(w, h, { pos: [Math.sin(a) * R, 0, -Math.cos(a) * R], yaw: -a }), i;
  for (i = 0; i < 18; i++) {
    var th = hash(i) * TAU, ph = Math.acos(2 * hash(i + 31) - 1), rr = h * .3 + hash(i + 61) * h * .6;
    var o = [Math.sin(ph) * Math.cos(th) * rr, Math.cos(ph) * rr * .8, Math.sin(ph) * Math.sin(th) * rr];
    var r = rotY(X, -a), u = Y; // 카메라를 바라보는 빌보드
    (function (o, i) { put(depth(C, o), function () { var d = depth(C, o) / R; c.globalAlpha = clamp(1.8 - d); plate(c, C, WORDS[i % WORDS.length], o, r, u, h * (.08 + hash(i + 3) * .06), i % 4 === 0 ? k.acc : i % 4 === 1 ? k.paper : 'transparent', i % 4 >= 2 ? k.paper : k.ink); c.globalAlpha = 1; }); })(o, i);
  }
  flush();
};

// 문자 나선: 낱말이 나선 계단처럼 감겨 올라가고 카메라가 따라 돈다
SP['sp-type-spiral'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var a = t / 8 * TAU, C = cam(w, h, { pos: [Math.sin(a) * h * 1.2, -h * .1 - t * h * .06 % (h * .5), -Math.cos(a) * h * 1.2], yaw: -a, pitch: -.15 }), i;
  var ws = ['위로', 'RISE', '한 칸', '돌아', 'UP', '나선', 'TURN', '올라'];
  for (i = 0; i < 32; i++) {
    var th = i * .62, y = h * .85 - i * h * .08, rr = h * .5, o = [Math.cos(th) * rr, y, Math.sin(th) * rr], r = [-Math.sin(th), 0, Math.cos(th)];
    (function (o, r, i) { put(depth(C, o), function () { var d = depth(C, o); c.globalAlpha = clamp((d + h) / (h * 2)); plate(c, C, ws[i % ws.length], o, r, Y, h * .11, i % 5 === 0 ? k.acc : k.paper, k.ink); c.globalAlpha = 1; }); })(o, r, i);
  }
  flush();
};

// ═══ CAMERA · 카메라워크 ═══
// 오빗: 피사체 둘레를 카메라가 한 바퀴 돈다
SP['sp-cam-orbit'] = function (c, w, h, t, k) {
  var a = t / 8 * TAU, R = h * 1.1, C = cam(w, h, { pos: [Math.sin(a) * R, -h * .12, -Math.cos(a) * R], yaw: -a, pitch: .1 });
  sceneFloor(c, C, w, h, k); pillars(c, C, h, k); wordBox(c, C, h, k, 'ORBIT', [0, h * .05, 0], h * .28); flush();
};

// 달리 인: 멀리 있는 글자로 카메라가 단숨에 들어간다
SP['sp-cam-dolly'] = function (c, w, h, t, k) {
  var p = eo(seg(t, .6, 1.8)), C = cam(w, h, { pos: [0, -h * .05, -h * 3 + p * h * 2.1] });
  sceneFloor(c, C, w, h, k); pillars(c, C, h, k, 18); c.globalAlpha = outA(t);
  put(0, function () { txt3(c, C, '寄', [0, h * .02, 0], X, Y, h * .5, k.acc); txt3(c, C, '들어간다 · DOLLY IN', [0, h * .25, 0], X, Y, h * .07, k.paper, 600); });
  flush(); c.globalAlpha = 1;
};

// 크레인 업: 발밑에서 떠올라 바로 위에서 내려다본다
SP['sp-cam-crane'] = function (c, w, h, t, k) {
  var p = io(seg(t, .4, 3)), C = cam(w, h, { pos: [0, -h * .05 - p * h * 1.6, -h * .8 + p * h * .8], pitch: p * 1.5 });
  sceneFloor(c, C, w, h, k); pillars(c, C, h, k); c.globalAlpha = outA(t);
  put(0, function () { txt3(c, C, '真上', [0, h * .29, 0], X, NZ, h * .4, k.acc); });
  wordBox(c, C, h, k, 'CRANE', [h * .55, h * .1, h * .2], h * .16, .4); flush(); c.globalAlpha = 1;
};

// 달리 줌: 피사체 크기는 그대로, 뒤 배경만 다가왔다 멀어진다
SP['sp-cam-dollyzoom'] = function (c, w, h, t, k) {
  var p = io(seg(t, .5, 3)) * (1 - io(seg(t, 4.5, 2.5))), z0 = h * 1.2, zc = -z0 - p * h * 2.2, f = h * 1.1 * (z0 - zc) / (z0 + z0);
  var C = cam(w, h, { pos: [0, -h * .05, zc], f: f });
  sceneFloor(c, C, w, h, k); pillars(c, C, h, k, 20);
  put(depth(C, [0, 0, z0]), function () { plate(c, C, 'VERTIGO', [0, 0, z0], X, Y, h * .3, k.paper, k.ink); });
  flush(); var q = proj(C, [0, h * .34, z0]); if (q) say(c, '배경만 움직인다', q[0], q[1], h * .055, rgba(k.paper, .6), 'center', 600);
};

// 플라이스루: 문을 잇달아 통과한다
SP['sp-cam-flythrough'] = function (c, w, h, t, k) {
  var zc = frac(t / 8) * 2400, C = cam(w, h, { pos: [Math.sin(t * .9) * h * .08, Math.cos(t * .7) * h * .06, zc], roll: Math.sin(t / 8 * TAU) * .12 }); bgc(c, w, h, k.ink); var i;
  for (i = 0; i < 10; i++) { var z = ((i * 240 - zc) % 2400 + 2400) % 2400 + zc, s = h * (.5 + (i % 3) * .12), tth = h * .035;
    (function (z, s, i) { put(depth(C, [0, 0, z]), function () {
      var col = i % 3 === 0 ? k.acc : k.paper, P = [[-s, -s, z], [s, -s, z], [s, s, z], [-s, s, z]], I = [[-s + tth, -s + tth, z], [s - tth, -s + tth, z], [s - tth, s - tth, z], [-s + tth, s - tth, z]];
      quad(c, C, P, null, col, 2); quad(c, C, I, null, col, 2);
      txt3(c, C, i % 2 ? 'くぐる' : 'GATE', [0, -s + tth / 2, z], X, Y, tth * .7, k.ink === col ? k.paper : k.ink); }); })(z, s, i); }
  flush();
};

// 휩 팬: 한순간에 홱 돌아 다음 글자를 본다
SP['sp-cam-whip'] = function (c, w, h, t, k) {
  var ws = ['振る', 'WHIP', '다음', 'PAN'], n = 4, cyc = P8(t) / 2, idx = Math.floor(cyc), f = frac(cyc), mv = clamp((f - .7) / .25), a0 = idx * TAU / n, a = a0 + ei(mv) * TAU / n;
  bgc(c, w, h, k.ink); var i, j, sm = mv > 0 && mv < 1 ? 6 : 1;
  for (j = 0; j < sm; j++) {
    var aj = a - (j / sm) * .18 * (mv > 0 && mv < 1 ? 1 : 0), C = cam(w, h, { yaw: aj, pos: [0, -h * .05, 0] }); c.globalAlpha = 1 / sm;
    floorGrid(c, C, h * .3, h * .3, h * 3, rgba(k.paper, .1)); pillars(c, C, h, k, 16);
    for (i = 0; i < n; i++) { var an = i * TAU / n, o = [Math.sin(an) * h * 1.1, 0, Math.cos(an) * h * 1.1], r = [Math.cos(an), 0, -Math.sin(an)];
      (function (o, r, i) { put(depth(C, o), function () { txt3(c, C, ws[i], o, r, Y, h * .34, i % 2 ? k.paper : k.acc); }); })(o, r, i); }
    flush();
  }
  c.globalAlpha = 1;
};

// 롤 전진: 겹겹의 네모를 뚫고 가며 카메라가 빙글 돈다
SP['sp-cam-roll'] = function (c, w, h, t, k) {
  var zc = frac(t / 8) * 2000, C = cam(w, h, { pos: [0, 0, zc], roll: t / 8 * TAU * 2 }); bgc(c, w, h, k.ink); var i;
  for (i = 0; i < 16; i++) { var z = ((i * 125 - zc) % 2000 + 2000) % 2000 + zc, s = h * .55, col = i % 4 === 0 ? k.acc : rgba(k.paper, .55);
    (function (z, s, col, i) { put(depth(C, [0, 0, z]), function () { quad(c, C, [[-s, -s, z], [s, -s, z], [s, s, z], [-s, s, z]], null, col, i % 4 === 0 ? 3 : 1.5);
      txt3(c, C, 'ROLL', [0, -s + h * .07, z], X, Y, h * .09, col, 800); }); })(z, s, col, i); }
  flush();
};

// 부감에서 지상으로: 바로 위에서 보던 눈이 사람 눈높이로 내려온다
SP['sp-cam-topdown'] = function (c, w, h, t, k) {
  var p = io(seg(t, .5, 3.2)), C = cam(w, h, { pos: [0, -h * 1.8 + p * h * 1.75, -h * .2 - p * h * .7], pitch: Math.PI / 2 * (1 - p) });
  sceneFloor(c, C, w, h, k); pillars(c, C, h, k, 18); c.globalAlpha = outA(t);
  put(0, function () { txt3(c, C, '俯瞰', [0, h * .29, h * .2], X, NZ, h * .36, rgba(k.paper, .5)); });
  wordBox(c, C, h, k, 'GROUND', [0, h * .1, h * .2], h * .2); flush(); c.globalAlpha = 1;
};

// ═══ SOLID · 입체 변형 ═══

// 글자에서 구로: 글자를 이루던 점들이 공으로 모였다가 다시 글자로 돌아온다
SP['sp-solid-sphere'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, 0, -h * 1.5] }), pts = glyphDots('구', h * .7, 3), n = pts.length, m = io(seg(t, 1.5, 1.6)) * (1 - io(seg(t, 5.5, 1.6))), rot = t * .5, R = h * .36, i;
  for (i = 0; i < n; i++) {
    var th = hash(i) * TAU, ph = Math.acos(2 * hash(i + 9) - 1), sp = [Math.sin(ph) * Math.cos(th + rot) * R, Math.cos(ph) * R, Math.sin(ph) * Math.sin(th + rot) * R];
    var gp = [pts[i][0], pts[i][1], 0], p = add3(mul3(gp, 1 - m), mul3(sp, m));
    dot3(c, C, p, 1.4, m > .5 ? k.acc : k.paper);
  }
  var q = proj(C, [0, h * .36, 0]); if (q) say(c, m < .5 ? '글자' : '구', q[0], q[1], h * .06, rgba(k.paper, .5), 'center', 600);
};

// 조립되는 정육면체: 여섯 면이 사방에서 날아와 상자가 되고 돈다
SP['sp-solid-cube'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * .15, -h * 1.5], pitch: .1 }), a = h * .22, p = back(seg(t, .4, 1.6)), yaw = .6 + Math.max(0, P8(t) - 2) * .45, pit = .35, i;
  var o = [0, 0, 0], R = function (q) { return add3(o, rotY(rotX(q, pit), yaw)); }, faces = [[0, 0, -1], [0, 0, 1], [1, 0, 0], [-1, 0, 0], [0, -1, 0], [0, 1, 0]], lab = ['A', 'B', 'C', 'D', 'E', 'F'];
  c.globalAlpha = outA(t);
  for (i = 0; i < 6; i++) (function (nrm, i) {
    var dist = a + (1 - p) * h * .9 * (1 + hash(i) * .5), ctr = R(mul3(nrm, dist)), ax = nrm[0] ? [0, 0, 1] : [1, 0, 0], ay = nrm[1] ? [0, 0, 1] : [0, 1, 0];
    if (nrm[0]) { ax = [0, 0, -nrm[0]]; ay = [0, 1, 0]; } else if (nrm[2]) { ax = [nrm[2], 0, 0]; ay = [0, 1, 0]; } else { ax = [1, 0, 0]; ay = [0, 0, -nrm[1]]; }
    var P = [R(add3(mul3(nrm, dist), add3(mul3(ax, -a), mul3(ay, -a)))), R(add3(mul3(nrm, dist), add3(mul3(ax, a), mul3(ay, -a)))), R(add3(mul3(nrm, dist), add3(mul3(ax, a), mul3(ay, a)))), R(add3(mul3(nrm, dist), add3(mul3(ax, -a), mul3(ay, a))))];
    put(depth(C, ctr), function () { var s0 = proj(C, P[0]), s1 = proj(C, P[1]), s3 = proj(C, P[3]); if (!s0 || !s1 || !s3) return;
      var front = (s1[0] - s0[0]) * (s3[1] - s0[1]) - (s1[1] - s0[1]) * (s3[0] - s0[0]) > 0; if (!front && p > .97) return;
      quad(c, C, P, i % 2 ? k.acc : k.paper, rgba(k.ink, .4), 1);
      if (front) txt3(c, C, lab[i], ctr, mul3(add3(P[1], mul3(P[0], -1)), 1 / (2 * a)), mul3(add3(P[3], mul3(P[0], -1)), 1 / (2 * a)), a * .9, i % 2 ? k.paper : k.ink); });
  })(faces[i], i);
  flush(); c.globalAlpha = 1;
};

// 흩어져 다른 말로: 점으로 된 글자가 흩어졌다가 다른 글자로 모인다
SP['sp-solid-scatter'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, 0, -h * 1.5] }), A = glyphDots('만든다', h * .4, 3), B = glyphDots('MAKE', h * .5, 3), n = Math.max(A.length, B.length), i;
  var m = io(seg(t, 2, 1.4)) * (1 - io(seg(t, 5.6, 1.4))), sc = Math.sin(m * Math.PI); // 중간에 흩어짐
  for (i = 0; i < n; i++) {
    var pa = A[i % A.length], pb = B[i % B.length], g = [pa[0] * (1 - m) + pb[0] * m, pa[1] * (1 - m) + pb[1] * m, 0];
    var rnd = [(hash(i) - .5) * h * 1.6, (hash(i + 3) - .5) * h * 1.2, (hash(i + 7) - .5) * h * 1.6];
    var p = add3(g, mul3(rnd, sc)); dot3(c, C, p, 1.3, sc > .5 ? k.acc : k.paper);
  }
};

// 판에서 탑으로: 바닥 판이 한 장씩 쌓이며 비틀린 탑이 된다
SP['sp-solid-tower'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [h * .9, -h * .45, -h * 1.5], yaw: -.5, pitch: .2 }), n = 22, a = h * .17, th = h * .03, i;
  floorGrid(c, C, h * .35, h * .3, h * 3, rgba(k.paper, .08)); c.globalAlpha = outA(t);
  for (i = 0; i < n; i++) (function (i) {
    var p = eo(seg(t, .3 + i * .15, .6)), y = h * .35 - th / 2 - i * th * 1.1, rot = i * .12 * p + (1 - p) * 1.5, lift = (1 - p) * h * .8, o = [0, y - lift, 0], r = rotY(X, rot), d = rotY(Z, rot);
    var P = [add3(add3(o, mul3(r, -a)), mul3(d, -a)), add3(add3(o, mul3(r, a)), mul3(d, -a)), add3(add3(o, mul3(r, a)), mul3(d, a)), add3(add3(o, mul3(r, -a)), mul3(d, a))];
    put(depth(C, o) - i * .01, function () { c.globalAlpha = outA(t) * p; quad(c, C, P, i % 4 === 0 ? k.acc : rgba(k.paper, .9), rgba(k.ink, .5), 1);
      quad(c, C, [P[0], P[1], add3(P[1], [0, th, 0]), add3(P[0], [0, th, 0])], k.deep); quad(c, C, [P[1], P[2], add3(P[2], [0, th, 0]), add3(P[1], [0, th, 0])], k.deep); c.globalAlpha = 1; });
  })(i);
  flush(); c.globalAlpha = 1;
};

// 블록 글자: 작은 상자들이 모여 큰 글자가 된다
SP['sp-solid-blocks'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [h * .35, -h * .3, -h * 1.05], yaw: -.3, pitch: .2 }), pts = glyphDots('3D', h * .78, 12), a = h * .028, p = eo(seg(t, .4, 2.2)), i;
  c.globalAlpha = outA(t);
  for (i = 0; i < pts.length; i++) (function (i) {
    var dl = clamp((p * 1.3 - hash(i) * .3) / 1), o = [pts[i][0] * 1.0, pts[i][1] * 1.0 - (1 - dl) * h * .9, 0]; if (dl <= 0) return;
    cube(c, C, o, a, 0, 0, [k.acc, k.acc, k.deep, k.deep, rgba(k.paper, .95), k.deep]);
  })(i);
  flush(); c.globalAlpha = 1;
};

// 비틀린 띠: 글자 띠가 고리가 되어 한 바퀴 돌며 비틀린다
SP['sp-solid-twist'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * .85, -h * 1.35], pitch: .58 }), R = h * .48, n = 64, s = '비틀린다 · TWIST · 돌아간다 · LOOP · ', i, spin = t / 8 * TAU;
  for (i = 0; i < n; i++) (function (i) {
    var a = i / n * TAU + spin, tw0 = a * .5 + spin * .5, pos = [Math.cos(a) * R, Math.sin(a * .5 + spin) * h * .08, Math.sin(a) * R], rad = [Math.cos(a), 0, Math.sin(a)];
    var up = add3(mul3(Y, Math.cos(tw0)), mul3(rad, Math.sin(tw0))), tan = [-Math.sin(a), 0, Math.cos(a)], ch = s[i % s.length];
    put(depth(C, pos), function () { var P = [add3(add3(pos, mul3(tan, -h * .025)), mul3(up, -h * .07)), add3(add3(pos, mul3(tan, h * .025)), mul3(up, -h * .07)), add3(add3(pos, mul3(tan, h * .025)), mul3(up, h * .07)), add3(add3(pos, mul3(tan, -h * .025)), mul3(up, h * .07))];
      var q0 = proj(C, P[0]), q1 = proj(C, P[1]), q3 = proj(C, P[3]); if (!q0 || !q1 || !q3) return; var front = (q1[0] - q0[0]) * (q3[1] - q0[1]) - (q1[1] - q0[1]) * (q3[0] - q0[0]) > 0;
      quad(c, C, P, front ? k.acc : k.deep); if (front) txt3(c, C, ch, pos, tan, up, h * .1, k.ink); });
  })(i);
  flush();
};

// 입자 입체 변화: 점 구름이 공에서 도넛으로, 상자로 바뀐다
SP['sp-solid-morph'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * .25, -h * 1.5], pitch: .15 }), n = 520, R = h * .3, rot = t * .4, ph8 = P8(t), i;
  var m1 = io(clamp((ph8 - 2) / 1)), m2 = io(clamp((ph8 - 4.8) / 1)), m3 = io(clamp((ph8 - 7.3) / .7));
  for (i = 0; i < n; i++) {
    var u = hash(i) * TAU, v = hash(i + 5) * TAU, r0 = hash(i + 11);
    var sph = [Math.sin(v / 2) * Math.cos(u) * R, Math.cos(v / 2) * R, Math.sin(v / 2) * Math.sin(u) * R];
    var tor = [(R * .75 + R * .3 * Math.cos(v)) * Math.cos(u), R * .3 * Math.sin(v), (R * .75 + R * .3 * Math.cos(v)) * Math.sin(u)];
    var f = i % 6, cu = [(hash(i + 1) - .5) * 2 * R, (hash(i + 2) - .5) * 2 * R, (hash(i + 3) - .5) * 2 * R]; cu[f % 3] = (f < 3 ? 1 : -1) * R;
    var p = add3(mul3(sph, 1 - m1), mul3(tor, m1)); p = add3(mul3(p, 1 - m2), mul3(cu, m2)); p = add3(mul3(p, 1 - m3), mul3(sph, m3)); p = rotY(p, rot);
    dot3(c, C, p, 1.3, i % 4 === 0 ? k.acc : k.paper);
  }
  var q = proj(C, [0, h * .42, 0]); if (q) say(c, ['공', '도넛', '상자'][m2 > .5 ? 2 : m1 > .5 ? 1 : 0], q[0], q[1], h * .06, rgba(k.paper, .5), 'center', 600);
};

// 전개도 상자: 펼쳐진 전개도가 접혀 상자가 되고, 다시 펼쳐진다
SP['sp-solid-unfold'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [h * .25, -h * .75, -h * .95], yaw: -.2, pitch: .6 }), a = h * .16, f = io(seg(t, 1, 1.8)) * (1 - io(seg(t, 5, 1.8))), ang = f * Math.PI / 2, i;
  floorGrid(c, C, h * .35 + a, h * .3, h * 3, rgba(k.paper, .08));
  var base = [0, h * .35, 0], lab = ['앞', '뒤', '좌', '우', '위', '바닥'];
  // 바닥면 + 네 옆면(접힘) + 뚜껑(옆면 하나에 붙어 두 번 접힘)
  var F = function (dir, i) { // dir: 접히는 방향 단위벡터(x 또는 z)
    var hinge = add3(base, mul3(dir, a)), out = dir, upv = [0, -1, 0], e = add3(mul3(out, Math.cos(ang)), mul3(upv, Math.sin(ang)));
    var P = [add3(hinge, mul3(dir[0] ? Z : X, -a)), add3(hinge, mul3(dir[0] ? Z : X, a)), add3(add3(hinge, mul3(dir[0] ? Z : X, a)), mul3(e, 2 * a)), add3(add3(hinge, mul3(dir[0] ? Z : X, -a)), mul3(e, 2 * a))];
    var ctr = add3(hinge, mul3(e, a)); put(depth(C, ctr) - .5, function () { quad(c, C, P, i % 2 ? k.acc : rgba(k.paper, .92), rgba(k.ink, .5), 1); });
    return { hinge: add3(hinge, mul3(e, 2 * a)), e: e, dir: dir };
  };
  put(depth(C, base), function () { quad(c, C, [add3(base, [-a, 0, -a]), add3(base, [a, 0, -a]), add3(base, [a, 0, a]), add3(base, [-a, 0, a])], k.deep, rgba(k.ink, .5), 1); });
  F([1, 0, 0], 0); F([-1, 0, 0], 1); F([0, 0, -1], 2); var top = F([0, 0, 1], 3);
  // 뚜껑: 뒤 옆면 끝에서 한 번 더 접힌다
  var e2 = add3(mul3(top.e, Math.cos(ang)), mul3(rotX(top.e, -Math.PI / 2 * 0), 0)); var lidDir = add3(mul3(top.dir, Math.cos(2 * ang)), mul3([0, -1, 0], Math.sin(2 * ang) * 0));
  var lidE = ang < .01 ? [0, 0, 1] : add3(mul3([0, 0, 1], Math.cos(2 * ang)), mul3([0, -1, 0], Math.sin(2 * ang)));
  var hinge = top.hinge, P2 = [add3(hinge, [-a, 0, 0]), add3(hinge, [a, 0, 0]), add3(add3(hinge, [a, 0, 0]), mul3(lidE, 2 * a)), add3(add3(hinge, [-a, 0, 0]), mul3(lidE, 2 * a))];
  put(depth(C, add3(hinge, mul3(lidE, a))) - 1, function () { quad(c, C, P2, k.acc, rgba(k.ink, .5), 1); });
  flush();
};

// ═══ PHYSICS · 물리 동작 ═══

// 도미노: 글자 판이 한 장씩 차례로 넘어진다
SP['sp-phys-domino'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [-h * .9, -h * .5, -h * 1.1], yaw: .55, pitch: .3 }), n = 12, gap = h * .14, s = '차례로넘어진다DOMINO', i;
  floorGrid(c, C, h * .35, h * .3, h * 3, rgba(k.paper, .08)); c.globalAlpha = outA(t);
  for (i = 0; i < n; i++) (function (i) {
    var ang = eo(seg(t, .6 + i * .32, .7)) * 1.2, base = [i * gap - n * gap / 2, h * .35, 0], up = [0, -Math.cos(ang), Math.sin(ang)], hh = h * .2, hw = h * .055;
    var P = [add3(base, [-hw, 0, 0]), add3(base, [hw, 0, 0]), add3(add3(base, [hw, 0, 0]), mul3(up, hh)), add3(add3(base, [-hw, 0, 0]), mul3(up, hh))];
    put(depth(C, base), function () { quad(c, C, P, i % 3 === 0 ? k.acc : rgba(k.paper, .92), rgba(k.ink, .4), 1); txt3(c, C, s[i % s.length], add3(base, mul3(up, hh / 2)), X, mul3(up, -1), hw * 1.3, i % 3 === 0 ? k.ink : k.ink); });
  })(i);
  flush(); c.globalAlpha = 1;
};

// 튀는 글자 블록: 글자 상자가 떨어져 통통 튀고 선다
SP['sp-phys-bounce'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * .3, -h * 1.6], pitch: .15 }), s = 'BOUNCE', a = h * .07, i;
  floorGrid(c, C, h * .35, h * .3, h * 3, rgba(k.paper, .08)); c.globalAlpha = outA(t);
  var bounce = function (u) { u = clamp(u); var b = 7.5625, d = 2.75; if (u < 1 / d) return b * u * u; if (u < 2 / d) return b * (u -= 1.5 / d) * u + .75; if (u < 2.5 / d) return b * (u -= 2.25 / d) * u + .9375; return b * (u -= 2.625 / d) * u + .984375; };
  for (i = 0; i < s.length; i++) { var p = bounce(seg(t, .3 + i * .18, 1.5)), y = h * .35 - a - (1 - p) * h * .9, x = (i - (s.length - 1) / 2) * a * 2.4;
    cube(c, C, [x, y, 0], a, 0, 0, [i % 2 ? k.acc : k.paper, k.deep, k.deep, k.deep, rgba(k.paper, .85), k.deep], [s[i]], a * 1.2); }
  flush(); c.globalAlpha = 1;
};

// 공 사태: 많은 공이 비탈을 굴러 내려와 쌓인다
SP['sp-phys-balls'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * .35, -h * 1.5], pitch: .22 }), n = 70, i;
  var fl = h * .35; floorGrid(c, C, fl, h * .3, h * 3, rgba(k.paper, .08));
  line3(c, C, [-h * 1.1, fl - h * .7, h * .3], [-h * .2, fl, h * .3], rgba(k.acc, .6), 2, 2); line3(c, C, [-h * 1.1, fl - h * .7, -h * .3], [-h * .2, fl, -h * .3], rgba(k.acc, .6), 2, 2);
  c.globalAlpha = outA(t);
  for (i = 0; i < n; i++) (function (i) {
    var st = hash(i) * 2.2, u = clamp((P8(t) - .3 - st) / 2.6), r = h * .028 + hash(i + 2) * h * .02, z = (hash(i + 4) - .5) * h * .55;
    var sx = -h * 1.1 + ei(u) * h * .9, sy = fl - h * .7 + ei(u) * h * .7 - r, px = sx, py = sy;
    if (u >= 1) { var v = clamp((P8(t) - 2.9 - st) / 1.2); var row = Math.floor(i / 10), col = i % 10; px = -h * .2 + eo(v) * (h * .05 + col * r * 1.9 + (hash(i + 8) - .5) * r); py = fl - r - row * r * 1.7 * eo(v) - (1 - eo(v)) * 0; }
    var p = [px, py, z]; put(depth(C, p), function () { dot3(c, C, p, r, i % 3 === 0 ? k.acc : i % 3 === 1 ? k.paper : k.deep); });
  })(i);
  flush(); c.globalAlpha = 1;
};

// 날아다니는 띠: 글자 띠가 활처럼 휘어 공간을 가로지른다
SP['sp-phys-tape'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * .1, -h * 1.5] }), tapes = 4, segs = 28, s = 'FLY · 날아간다 · TAPE · 가로지른다 · ', ti, j;
  for (ti = 0; ti < tapes; ti++) (function (ti) {
    var ph = t * .9 + ti * 1.7, cx = (hash(ti) - .5) * h * .6, cy = (hash(ti + 3) - .5) * h * .5, hw = h * .045;
    for (j = 0; j < segs; j++) (function (j) {
      var u = j / segs, a = u * TAU * .9 + ph, p0 = [cx + Math.cos(a) * h * .6, cy + Math.sin(a * 1.3) * h * .25, Math.sin(a) * h * .5], a1 = (u + 1 / segs) * TAU * .9 + ph, p1 = [cx + Math.cos(a1) * h * .6, cy + Math.sin(a1 * 1.3) * h * .25, Math.sin(a1) * h * .5];
      var tan = add3(p1, mul3(p0, -1)), up = [0, 1, 0], ch = s[(j + ti * 7) % s.length], ctr = mul3(add3(p0, p1), .5);
      put(depth(C, ctr), function () { var P = [add3(p0, mul3(up, -hw)), add3(p1, mul3(up, -hw)), add3(p1, mul3(up, hw)), add3(p0, mul3(up, hw))];
        var q0 = proj(C, P[0]), q1 = proj(C, P[1]), q3 = proj(C, P[3]); if (!q0 || !q1 || !q3) return; var front = (q1[0] - q0[0]) * (q3[1] - q0[1]) - (q1[1] - q0[1]) * (q3[0] - q0[0]) > 0;
        quad(c, C, P, ti % 2 ? (front ? k.acc : k.deep) : (front ? k.paper : rgba(k.paper, .5))); var L = Math.sqrt(tan[0] * tan[0] + tan[1] * tan[1] + tan[2] * tan[2]);
        if (front && L > 0) txt3(c, C, ch, ctr, mul3(tan, 1 / L), up, hw * 1.4, k.ink); });
    })(j);
  })(ti);
  flush();
};

// 충돌로 부서짐: 날아온 글자 판이 벽에 부딪혀 조각으로 흩어진다
SP['sp-phys-shatter'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * .2, -h * 1.5], pitch: .1 }), hit = 2.2, p8 = P8(t), i, fl = h * .35;
  floorGrid(c, C, fl, h * .3, h * 3, rgba(k.paper, .08)); c.globalAlpha = outA(t);
  var o = [-h * 1.1 + ei(clamp(p8 / hit)) * h * 1.1, -h * .05, 0], W = h * .28, H = h * .18;
  if (p8 < hit) { put(0, function () { plate(c, C, '부딪친다', o, X, Y, h * .11, k.acc, k.ink); }); }
  else { var u = p8 - hit, n = 6, m = 4, gx = W * 2 / n, gy = H * 2 / m;
    for (i = 0; i < n * m; i++) (function (i) {
      var cx = -W + (i % n + .5) * gx, cy = -H + (Math.floor(i / n) + .5) * gy, vx = (hash(i) - .2) * h * .5, vy = -(hash(i + 3)) * h * .7, vz = (hash(i + 6) - .5) * h * .6;
      var px = o[0] + cx + vx * u, py = Math.min(fl - gy / 2, o[1] + cy + vy * u + h * .45 * u * u), pz = vz * u, rot = u * (hash(i + 9) - .5) * 6, ctr = [px, py, pz], r = rotZ(X, rot), up = rotZ(Y, rot);
      put(depth(C, ctr), function () { quad(c, C, [add3(add3(ctr, mul3(r, -gx / 2)), mul3(up, -gy / 2)), add3(add3(ctr, mul3(r, gx / 2)), mul3(up, -gy / 2)), add3(add3(ctr, mul3(r, gx / 2)), mul3(up, gy / 2)), add3(add3(ctr, mul3(r, -gx / 2)), mul3(up, gy / 2))], i % 3 ? k.acc : k.paper); });
    })(i);
  }
  line3(c, C, [h * .2, -h * .6, -h * .4], [h * .2, fl, -h * .4], rgba(k.paper, .5), 2, 1); line3(c, C, [h * .2, -h * .6, h * .4], [h * .2, fl, h * .4], rgba(k.paper, .5), 2, 1);
  flush(); c.globalAlpha = 1;
};

// 진자 파동: 길이가 다른 진자들이 어긋나며 물결을 만든다
SP['sp-phys-pendulum'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * .2, -h * 1.5], pitch: .05 }), n = 15, top = -h * .45, i;
  line3(c, C, [-h * .8, top, 0], [h * .8, top, 0], rgba(k.paper, .5), 2, 1);
  for (i = 0; i < n; i++) (function (i) {
    var L = h * .35 + i * h * .028, f = 1 + i * .05, a = Math.sin(t * TAU / 8 * 4 * f / (1 + i * .05 / 4) * (1 / 4) * 4 * .5) * .55; a = Math.sin((t / 8) * TAU * (3 + i * .25)) * .5;
    var x = -h * .8 + i * h * 1.6 / (n - 1), bob = [x, top + Math.cos(a) * L, Math.sin(a) * L];
    line3(c, C, [x, top, 0], bob, rgba(k.paper, .35), 1, 1);
    put(depth(C, bob), function () { dot3(c, C, bob, h * .03, i % 2 ? k.acc : k.paper); });
  })(i);
  flush();
};

// 색종이: 종잇조각이 팔랑이며 내려온다
SP['sp-phys-confetti'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, 0, -h * 1.4] }), n = 90, i;
  var q = proj(C, [0, 0, h * .2]); if (q) say(c, '祝', q[0], q[1], h * .55, k.acc);
  for (i = 0; i < n; i++) (function (i) {
    var sp = .5 + hash(i) * .6, y = ((t * h * .18 * sp + hash(i + 1) * h * 1.6) % (h * 1.6)) - h * .8, x = (hash(i + 2) - .5) * h * 2 + Math.sin(t * 2 + i) * h * .06, z = (hash(i + 3) - .5) * h * 1.2;
    var ctr = [x, y, z], rot = t * (1 + hash(i + 4) * 2) + i, r = rotY(rotX(X, rot), rot * .7), up = rotY(rotX(Y, rot), rot * .7), s = h * .022;
    put(depth(C, ctr), function () { quad(c, C, [add3(add3(ctr, mul3(r, -s)), mul3(up, -s * .6)), add3(add3(ctr, mul3(r, s)), mul3(up, -s * .6)), add3(add3(ctr, mul3(r, s)), mul3(up, s * .6)), add3(add3(ctr, mul3(r, -s)), mul3(up, s * .6))], i % 3 === 0 ? k.acc : i % 3 === 1 ? k.paper : k.deep); });
  })(i);
  flush();
};

// 중력 소용돌이: 흩어진 점이 가운데로 소용돌이치며 빨려 든다
SP['sp-phys-vortex'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * .5, -h * 1.5], pitch: .3 }), n = 420, i;
  for (i = 0; i < n; i++) {
    var life = frac(t / 8 * (1 + hash(i) * .5) + hash(i + 1)), r = (1 - life) * h * .8 + h * .02, a = hash(i + 2) * TAU + life * 7, y = (1 - life) * (hash(i + 3) - .5) * h * .3 + life * life * h * .25;
    var p = [Math.cos(a) * r, y, Math.sin(a) * r]; dot3(c, C, p, .8 + life * 1.6, life > .75 ? k.acc : rgba(k.paper, .4 + life * .6));
  }
  var q = proj(C, [0, h * .3, 0]); if (q) { c.fillStyle = k.ink; disc(c, q[0], q[1], h * .05 * q[2]); c.strokeStyle = k.acc; c.lineWidth = 2; c.beginPath(); c.arc(q[0], q[1], h * .06 * q[2], 0, TAU); c.stroke(); }
};

// ═══ LIGHT · 빛과 깊이 ═══

// 전구 줄: 네모 전구 줄이 겹겹이 멀어지고 차례로 켜지며 흐른다
SP['sp-light-bulbs'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, 0, -h * .2] }), n = 9, i, j;
  for (i = 0; i < n; i++) { var z = i * h * .45 + h * .1, W = h * .85, H = h * .5, per = 14, on = Math.floor(t * 6) % 3;
    for (j = 0; j < per * 2 + (per - 2) * 2; j++) { var x, y, m = j;
      if (m < per) { x = -W + m * 2 * W / (per - 1); y = -H; } else if (m < per * 2) { x = -W + (m - per) * 2 * W / (per - 1); y = H; } else if (m < per * 2 + per - 2) { x = -W; y = -H + (m - per * 2 + 1) * 2 * H / (per - 1); } else { x = W; y = -H + (m - per * 3 + 3) * 2 * H / (per - 1); }
      var lit = (j + i) % 3 === on; dot3(c, C, [x, y, z], lit ? 3.2 : 1.6, lit ? k.acc : rgba(k.paper, .35)); if (lit) { c.globalAlpha = .25; dot3(c, C, [x, y, z], 8, k.acc); c.globalAlpha = 1; } } }
  var q = proj(C, [0, 0, h * 1.2]); if (q) say(c, '빛', q[0], q[1], h * .12, k.paper, 'center', 800);
};

// 스포트라이트: 빛기둥이 글자 하나씩을 비춘다
SP['sp-light-spot'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * .25, -h * 1.5], pitch: .12 }), s = 'SPOT', n = s.length, fl = h * .35, i;
  floorGrid(c, C, fl, h * .3, h * 3, rgba(k.paper, .07));
  for (i = 0; i < n; i++) (function (i) {
    var x = (i - (n - 1) / 2) * h * .3, on = Math.floor(P8(t) / 1.2) % n === i || P8(t) > 6 && P8(t) < 7.2, top = [x + Math.sin(t + i) * h * .05, -h * .7, h * .1];
    var P = [top, add3([x, fl, 0], [-h * .14, 0, -h * .1]), add3([x, fl, 0], [h * .14, 0, -h * .1])], P2 = [top, add3([x, fl, 0], [-h * .14, 0, h * .1]), add3([x, fl, 0], [h * .14, 0, h * .1])];
    put(depth(C, [x, 0, h * .1]) + 1, function () { c.globalAlpha = on ? .28 : .07; quad(c, C, P, k.acc); quad(c, C, P2, k.acc); c.globalAlpha = 1;
      var q = proj(C, [x, fl, 0]); if (q) { c.fillStyle = rgba(k.acc, on ? .35 : .08); c.beginPath(); c.ellipse(q[0], q[1], h * .16 * q[2], h * .05 * q[2], 0, 0, TAU); c.fill(); } });
    put(depth(C, [x, 0, 0]), function () { txt3(c, C, s[i], [x, fl - h * .17, 0], X, Y, h * .3, on ? k.paper : rgba(k.paper, .22)); });
  })(i);
  flush();
};

// 초점 이동: 앞 글자와 뒤 글자 사이에서 초점이 오간다
SP['sp-light-focus'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, 0, -h * 1.2] }), f = .5 + .5 * Math.sin(t / 8 * TAU * 2 - Math.PI / 2), ws = [['앞', -h * .45, 0, h * .34], ['초점', 0, h * .5, h * .3], ['뒤', h * .5, h * 1.2, h * .34]], i;
  var blurTxt = function (s, o, px, col, b) { var q = proj(C, o); if (!q) return; var n = b < 1 ? 1 : 7, j; for (j = 0; j < n; j++) { c.globalAlpha = 1 / n; var a = j / n * TAU; say(c, s, q[0] + Math.cos(a) * b, q[1] + Math.sin(a) * b, px * q[2], col); } c.globalAlpha = 1; };
  for (i = 0; i < ws.length; i++) { var o = [ws[i][1], 0, ws[i][2]], d = ws[i][2] / (h * 1.2), blur = Math.abs(d - f) * h * .06; blurTxt(ws[i][0], o, ws[i][3], blur < h * .01 ? k.acc : k.paper, blur); }
  var q = proj(C, [0, h * .3, h * .5]); if (q) say(c, f < .5 ? '앞에 초점' : '뒤에 초점', q[0], q[1], h * .05, rgba(k.paper, .5), 'center', 600);
};

// 안개 속 글자: 안개 저편에서 낱말이 떠오른다
SP['sp-light-fog'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, 0, frac(t / 8) * 1400], f: h * .9 }), L = 1400, i, g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, rgba(k.acc, .06)); g.addColorStop(1, rgba(k.paper, .1)); c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (i = 0; i < 18; i++) { var z = ((hash(i) * L - C.pos[2]) % L + L) % L + C.pos[2] + 60, d = (z - C.pos[2]) / L, o = [(hash(i + 4) - .5) * h * 1.3, (hash(i + 8) - .5) * h * .8, z];
    (function (o, d, i) { put(-d, function () { c.globalAlpha = clamp(1.2 - d * 1.5); plate(c, C, WORDS[i % WORDS.length], o, X, Y, h * .14, i % 3 === 0 ? k.acc : i % 3 === 1 ? k.paper : 'transparent', i % 3 === 2 ? k.paper : k.ink); c.globalAlpha = 1; }); })(o, d, i); }
  flush(); var fog = c.createRadialGradient(w / 2, h / 2, h * .1, w / 2, h / 2, h * .8); fog.addColorStop(0, rgba(k.paper, .14)); fog.addColorStop(1, rgba(k.ink, 0)); c.fillStyle = fog; c.fillRect(0, 0, w, h);
};

// 네온 점등: 네온 글자가 깜박이다 켜진다
SP['sp-light-neon'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, 0, -h * 1.3], yaw: .25 }), p8 = P8(t), fl = [0, .3, 0, 1, 0, 0, 1, .4, 1, 0, 1, 1, 1], on = p8 < 2 ? fl[Math.floor(p8 / 2 * fl.length)] : 1, i;
  for (i = 0; i < 12; i++) { var zz = h * .6 + i * h * .35; txt3(c, C, i % 2 ? 'NEON' : '네온', [(i % 3 - 1) * h * .6, (i % 2 ? -1 : 1) * h * .3, zz], X, Y, h * .12, rgba(k.paper, .1)); }
  var o = [0, -h * .05, 0], q = proj(C, o); if (!q) return;
  c.save(); c.shadowColor = k.acc; c.shadowBlur = on ? h * .12 : 0; txt3(c, C, 'OPEN', o, X, Y, h * .36, on ? k.acc : rgba(k.acc, .25)); c.restore();
  c.save(); c.shadowColor = k.acc; c.shadowBlur = on ? h * .06 : 0; txt3(c, C, '영업중', [0, h * .25, 0], X, Y, h * .12, on ? k.paper : rgba(k.paper, .25)); c.restore();
  c.strokeStyle = rgba(k.acc, on ? .8 : .3); c.lineWidth = 2; line3(c, C, [-h * .55, h * .38, 0], [h * .55, h * .38, 0], rgba(k.acc, on ? .8 : .3), 2, 1);
};

// 빛 알갱이: 흐릿한 빛 방울이 깊이 사이를 떠다닌다
SP['sp-light-bokeh'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, 0, -h * 1.2] }), n = 60, i;
  for (i = 0; i < n; i++) { var z = hash(i) * h * 2.4 - h * .6, o = [(hash(i + 1) - .5) * h * 2.2 + Math.sin(t * .5 + i) * h * .08, (hash(i + 2) - .5) * h * 1.4 + Math.cos(t * .4 + i * 2) * h * .08, z], q = proj(C, o); if (!q) continue;
    var r = h * (.02 + hash(i + 3) * .05) * q[2], dz = Math.abs(z - h * .4) / h, a = .12 + .5 * clamp(1 - dz), g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); g.addColorStop(0, rgba(i % 4 === 0 ? k.acc : k.paper, a)); g.addColorStop(1, rgba(i % 4 === 0 ? k.acc : k.paper, 0)); c.fillStyle = g; disc(c, q[0], q[1], r); }
  txt3(c, C, '光', [0, 0, h * .4], X, Y, h * .4, k.paper);
};

// 역광 실루엣: 뒤에서 센 빛이 비쳐 글자가 그림자가 된다
SP['sp-light-backlight'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, 0, -h * 1.2] }), src = proj(C, [0, 0, h * .9]), i; if (!src) return;
  var g = c.createRadialGradient(src[0], src[1], 0, src[0], src[1], h * .9); g.addColorStop(0, rgba(k.paper, .95)); g.addColorStop(.25, rgba(k.acc, .5)); g.addColorStop(1, rgba(k.ink, 0)); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.save(); c.translate(src[0], src[1]); c.rotate(t * .15); for (i = 0; i < 18; i++) { c.rotate(TAU / 18); c.globalAlpha = .12 + .1 * Math.sin(t * 3 + i); c.fillStyle = k.paper; c.beginPath(); c.moveTo(0, 0); c.lineTo(h * 1.6, -h * .03); c.lineTo(h * 1.6, h * .03); c.closePath(); c.fill(); } c.restore(); c.globalAlpha = 1;
  var sc = 1 + Math.sin(t / 8 * TAU) * .04; txt3(c, C, '逆光', [0, 0, 0], X, Y, h * .42 * sc, k.ink);
  c.strokeStyle = rgba(k.paper, .35); c.lineWidth = 1; var ws = ['빛', '그림자', 'LIGHT']; for (i = 0; i < 3; i++) txt3(c, C, ws[i], [(i - 1) * h * .55, h * .35, h * .2], X, Y, h * .07, rgba(k.ink, .8), 600);
};

// 레이저 격자: 빛줄기가 공간을 훑는다
SP['sp-light-laser'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * .3, 0], pitch: .25 }), src = [0, -h * .9, h * 1.2], i, n = 12;
  floorGrid(c, C, h * .35, h * .3, h * 3, rgba(k.acc, .12));
  for (i = 0; i < n; i++) { var a = (i / n - .5) * 1.6 + Math.sin(t / 8 * TAU * 2 + i * .4) * .35, end = [Math.sin(a) * h * 3, h * .35, Math.cos(a) * h * 3 + h * .2]; c.globalAlpha = .9; line3(c, C, src, end, i % 3 === 0 ? k.paper : k.acc, i % 3 === 0 ? 2 : 1.2, 1); }
  c.globalAlpha = 1; var q = proj(C, src); if (q) { c.fillStyle = k.paper; disc(c, q[0], q[1], 4); }
  txt3(c, C, 'LASER', [0, h * .05, h * 1.2], X, Y, h * .07, rgba(k.paper, .8), 700);
};

// ═══ CITY · 글자로 지은 거리 ═══

// 글자 빌딩 거리: 글자로만 된 건물들 사이 길을 날아간다
SP['sp-city-towers'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var zc = frac(t / 8) * 2400, C = cam(w, h, { pos: [0, -h * .1, zc], f: h }), L = 2400, i, side, rows;
  for (side = -1; side <= 1; side += 2) for (i = 0; i < 10; i++) (function (i, side) {
    var z = ((i * 240 - zc) % L + L) % L + zc - 120, x = side * (h * .55 + hash(i + side) * h * .25), top = -h * .6 - hash(i + 20) * h * .7, w0 = h * .35, zf = z - w0 / 2;
    put(depth(C, [x, 0, z]), function () { var r;
      quad(c, C, [[x, top, zf], [x, top, zf + w0], [x, h * .5, zf + w0], [x, h * .5, zf]], k.deep, rgba(k.acc, .35), 1);
      for (r = 0; r < 5; r++) { var y = top + r * h * .22 + h * .1; if (y > h * .4) break; txt3(c, C, WORDS[(i * 3 + r + side + 16) % WORDS.length], [x, y, z], [0, 0, -side], Y, h * .11, (i + r) % 5 === 0 ? k.acc : rgba(k.paper, .85)); } });
  })(i, side);
  for (i = 0; i < 10; i++) { var zl = ((i * 240 - zc) % L + L) % L + zc; line3(c, C, [-h * .08, h * .5, zl], [-h * .08, h * .5, zl + 90], rgba(k.paper, .4), 2, 1); line3(c, C, [h * .08, h * .5, zl], [h * .08, h * .5, zl + 90], rgba(k.paper, .4), 2, 1); }
  flush();
};

// 간판 골목: 세로 간판이 늘어선 골목을 걸어 들어간다
SP['sp-city-signs'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var zc = frac(t / 8) * 2000, C = cam(w, h, { pos: [0, 0, zc], f: h }), L = 2000, i, side, ws = ['OPEN', 'BAR', '골목', '3D', '간판', '공간', '문자', 'SIGN'];
  for (side = -1; side <= 1; side += 2) { var wx = side * h * .62; line3(c, C, [wx, -h * .5, zc], [wx, -h * .5, zc + 2200], rgba(k.paper, .2), 1, 20); line3(c, C, [wx, h * .5, zc], [wx, h * .5, zc + 2200], rgba(k.paper, .2), 1, 20);
    for (i = 0; i < 11; i++) (function (i, side) { var z = ((i * 180 - zc) % L + L) % L + zc, x = wx - side * h * .06, y = -h * .4 + (i % 3) * h * .22, o = [x, y, z], r = [0, 0, -side], acc = (i + side) % 3 === 0;
      put(depth(C, o), function () { var sw = h * .085, sh = h * .36, P = [[x, y - sh, z - sw], [x, y - sh, z + sw], [x, y + sh, z + sw], [x, y + sh, z - sw]]; quad(c, C, P, acc ? k.acc : k.paper, rgba(k.ink, .4), 1);
        var s = ws[i % ws.length], j; for (j = 0; j < s.length && j < 4; j++) txt3(c, C, s[j], [x, y - sh + sh * .3 + j * sh * .48, z], r, Y, sw * 1.3, k.ink); }); })(i, side); }
  flush();
};

// 글자 방: 벽도 바닥도 천장도 글자인 방 안에서 둘러본다
SP['sp-city-room'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, 0, 0], yaw: t / 8 * TAU, f: h * .8 }), R = h * .9, ws = ['ROOM', '부엌', '문자', '방', '벽', 'WALL', '천장', '바닥'], i, j, f;
  var faces = [[[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 1, 0], [1, 0, 0], [0, 0, -1]]];
  for (f = 0; f < 6; f++) (function (f) { var nrm = faces[f][0], r = faces[f][1], u = faces[f][2], ctr = mul3(nrm, R);
    put(depth(C, ctr), function () { quad(c, C, [add3(ctr, add3(mul3(r, -R), mul3(u, -R))), add3(ctr, add3(mul3(r, R), mul3(u, -R))), add3(ctr, add3(mul3(r, R), mul3(u, R))), add3(ctr, add3(mul3(r, -R), mul3(u, R)))], f % 2 ? k.deep : rgba(k.acc, .85), rgba(k.ink, .4), 1);
      for (i = -1; i <= 1; i++) for (j = -1; j <= 1; j++) txt3(c, C, ws[(f * 3 + i + j + 4) % ws.length], add3(ctr, add3(mul3(r, i * R * .6), mul3(u, j * R * .6))), r, u, R * .22, f % 2 ? k.paper : k.ink); }); })(f);
  flush();
};

// 무한 기둥 회랑: 글자가 새겨진 기둥이 끝없이 이어진다
SP['sp-city-colonnade'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var zc = frac(t / 8) * 1600, C = cam(w, h, { pos: [0, -h * .1, zc], f: h }), L = 1600, i, side;
  floorGrid(c, C, h * .45, h * .4, h * 3, rgba(k.paper, .08));
  for (side = -1; side <= 1; side += 2) for (i = 0; i < 9; i++) (function (i, side) { var z = ((i * 200 - zc) % L + L) % L + zc, x = side * h * .5, hw = h * .07;
    put(depth(C, [x, 0, z]), function () { var r; cube(c, C, [x, -h * .15, z], hw, 0, 0, [k.deep, k.deep, rgba(k.paper, .9), rgba(k.paper, .9), k.deep, k.deep]); });
    put(depth(C, [x, 0, z]) - 1, function () { var r; for (r = 0; r < 4; r++) txt3(c, C, WORDS[(i + r * 2 + side + 16) % WORDS.length][0], [x - side * hw * 1.01, -h * .55 + r * h * .2, z], [0, 0, -side], Y, hw * 1.2, (i + r) % 4 === 0 ? k.acc : k.ink); });
    // 기둥 몸통을 위로 길게
    put(depth(C, [x, 0, z]) + .5, function () { quad(c, C, [[x - side * hw, -h * .7, z - hw], [x - side * hw, -h * .7, z + hw], [x - side * hw, h * .45, z + hw], [x - side * hw, h * .45, z - hw]], rgba(k.paper, .9)); quad(c, C, [[x - hw, -h * .7, z - hw], [x + hw, -h * .7, z - hw], [x + hw, h * .45, z - hw], [x - hw, h * .45, z - hw]], k.deep); });
  })(i, side);
  flush();
};

// 말의 계단: 한 칸마다 말이 적힌 계단을 올라간다
SP['sp-city-stairs'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var st = h * .12, dp = h * .3, n = 14, prog = frac(t / 8) * 4, C = cam(w, h, { pos: [0, h * .3 - prog * st - h * .45, prog * dp - h * .8], pitch: .15 }), i, ws = ['한 걸음', 'STEP', '위로', 'UP', '한 칸', 'CLIMB', '더', 'GO'];
  for (i = 0; i < n + 4; i++) (function (i) { var j = i + Math.floor(prog) - 2, y = h * .3 - j * st, z = j * dp, P = [[-h * .5, y, z], [h * .5, y, z], [h * .5, y, z + dp], [-h * .5, y, z + dp]], acc = j % 4 === 0;
    put(depth(C, [0, y, z + dp / 2]), function () { quad(c, C, P, acc ? k.acc : rgba(k.paper, .9), rgba(k.ink, .5), 1); quad(c, C, [[-h * .5, y, z], [h * .5, y, z], [h * .5, y + st, z], [-h * .5, y + st, z]], k.deep);
      txt3(c, C, ws[((j % ws.length) + ws.length) % ws.length], [0, y, z + dp * .5], X, NZ, st * .7, k.ink); }); })(i);
  flush();
};

// 머리 위 표지판: 고속도로 표지판이 머리 위로 지나간다
SP['sp-city-signage'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var zc = frac(t / 8) * 2000, C = cam(w, h, { pos: [0, -h * .05, zc], f: h }), L = 2000, i;
  floorGrid(c, C, h * .35, h * .5, h * 3, rgba(k.paper, .06));
  for (i = 0; i < 12; i++) { var zl = ((i * 170 - zc) % L + L) % L + zc; line3(c, C, [0, h * .35, zl], [0, h * .35, zl + 70], rgba(k.paper, .5), 2, 1); }
  line3(c, C, [-h * .55, h * .35, zc], [-h * .55, h * .35, zc + 2200], rgba(k.paper, .25), 1, 20); line3(c, C, [h * .55, h * .35, zc], [h * .55, h * .35, zc + 2200], rgba(k.paper, .25), 1, 20);
  var ws = ['문자의 거리 →', '← 3D 공간', '출구 EXIT', '↑ 깊이 100m'];
  for (i = 0; i < 4; i++) (function (i) { var z = ((i * 500 + 250 - zc) % L + L) % L + zc, o = [0, -h * .55, z], W = h * .5, H = h * .13;
    put(depth(C, o), function () { quad(c, C, [[-W, -h * .55 - H, z], [W, -h * .55 - H, z], [W, -h * .55 + H, z], [-W, -h * .55 + H, z]], i % 2 ? k.acc : k.deep, rgba(k.paper, .6), 1);
      line3(c, C, [-W, -h * .55 + H, z], [-W, h * .35, z], rgba(k.paper, .5), 2, 1); line3(c, C, [W, -h * .55 + H, z], [W, h * .35, z], rgba(k.paper, .5), 2, 1);
      txt3(c, C, ws[i], o, X, Y, H * .9, i % 2 ? k.ink : k.paper); }); })(i);
  flush();
};

// 글자 교차로: 사방으로 뻗은 글자 길을 위에서 돌며 본다
SP['sp-city-crossing'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [0, -h * 1.6, 0], pitch: Math.PI / 2 - .35, yaw: t / 8 * TAU, f: h }), i, d, dirs = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]], ws = ['동', 'EAST', '서', 'WEST', '남', 'SOUTH', '북', 'NORTH'];
  for (d = 0; d < 4; d++) { var dir = dirs[d], side = dir[0] ? [0, 0, 1] : [1, 0, 0];
    quad(c, C, [add3(mul3(dir, h * .15), mul3(side, -h * .15)), add3(mul3(dir, h * 2), mul3(side, -h * .15)), add3(mul3(dir, h * 2), mul3(side, h * .15)), add3(mul3(dir, h * .15), mul3(side, h * .15))], k.deep);
    for (i = 1; i <= 6; i++) txt3(c, C, ws[(d * 2 + i) % ws.length], mul3(dir, h * .15 + i * h * .3), dir[0] ? [0, 0, -dir[0]] : [dir[2], 0, 0], mul3(dir, -1), h * .1, i % 3 === 0 ? k.acc : k.paper); }
  quad(c, C, [[-h * .15, 0, -h * .15], [h * .15, 0, -h * .15], [h * .15, 0, h * .15], [-h * .15, 0, h * .15]], k.acc); txt3(c, C, '文', [0, -1, 0], X, NZ, h * .18, k.ink);
};

// 부감 블록: 글자 블록이 물결치듯 올라왔다 내려간다
SP['sp-city-blocks'] = function (c, w, h, t, k) {
  bgc(c, w, h, k.ink); var C = cam(w, h, { pos: [h * .9, -h * 1.3, -h * .9], yaw: -.75, pitch: .85, f: h }), n = 7, a = h * .085, i, j, s = '공간문자깊이층거리빛속도회전';
  for (i = 0; i < n; i++) for (j = 0; j < n; j++) (function (i, j) { var x = (i - (n - 1) / 2) * a * 2.2, z = (j - (n - 1) / 2) * a * 2.2, hh = a * (1.2 + Math.sin(t / 8 * TAU * 2 + i * .7 + j * .5) * .9), o = [x, h * .3 - hh, z];
    put(depth(C, o), function () { var top = h * .3 - hh * 2;
      quad(c, C, [[x - a, top, z - a], [x + a, top, z - a], [x + a, h * .3, z - a], [x - a, h * .3, z - a]], k.deep);
      quad(c, C, [[x + a, top, z - a], [x + a, top, z + a], [x + a, h * .3, z + a], [x + a, h * .3, z - a]], rgba(k.acc, .6));
      quad(c, C, [[x - a, top, z - a], [x + a, top, z - a], [x + a, top, z + a], [x - a, top, z + a]], (i + j) % 3 === 0 ? k.acc : rgba(k.paper, .92));
      txt3(c, C, s[(i * n + j) % s.length], [x, top - .5, z], X, NZ, a * 1.1, k.ink); }); })(i, j);
  flush();
};

if (typeof module !== 'undefined') module.exports = { SP: SP };
