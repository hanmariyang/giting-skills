// 소셜 오버레이 24 — 캔버스 그리기 함수 묶음 (의존성 0)
// 갤러리 데모(demos/m17-social-overlay.html)와 홍보 영상(render.mjs)이 같은 함수를 쓴다.
// 정본은 이 파일 하나. 데모를 고치려면 여기를 고치고 `node tools/social/gen.mjs` → `node build.mjs`.
//
// SO[id](c, w, h, t, k)
//   c: 2D 컨텍스트 (0,0 ~ w,h 가 칸)   t: 초. 8초에 한 바퀴: 0.4초 비고 → 들어와 머물고 → 7.2~8초 사라짐
//   (LIVE 깜빡임처럼 계속 도는 것은 8초 안에서 나눠떨어지는 주기만 쓴다)
//   k: { acc, deep, paper, ink }
// 영상 위에 얹는 요소라 바탕은 흐린 「영상 자리」(scene)로 칠하고 그 위에 그린다. 버튼 이름·숫자는 지어낸 예시다.

/*@helpers*/
var TAU = Math.PI * 2;
var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
var eo = function (t) { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
var io = function (t) { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
var back = function (t) { t = clamp(t); var s = 1.7; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
var lerp = function (a, b, t) { return a + (b - a) * t; };
var lerpC = function (a, b, t) { return '#' + [1, 3, 5].map(function (i) { return Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0'); }).join(''); };
var hash = function (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
var P8 = function (t) { var p = t % 8; return p < 0 ? p + 8 : p; };
var seg = function (t, a, d) { return clamp((P8(t) - a) / d); };
var outA = function (t) { return 1 - clamp((P8(t) - 7.2) / .8); };
var SANS = '-apple-system,"Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif';
var rrect = function (c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, Math.max(0, w), Math.max(0, h), Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))); };
var disc = function (c, x, y, r) { if (r > .2) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } };
var say = function (c, s, x, y, px, col, al, wt) { c.font = (wt || 700) + ' ' + px + 'px ' + SANS; c.fillStyle = col; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
var sayW = function (c, s, px, wt) { c.font = (wt || 700) + ' ' + px + 'px ' + SANS; return c.measureText(s).width; };
// 영상 자리: 흐린 그라디언트와 둥근 빛 두 개(사진 대신)
var scene = function (c, w, h, k) {
  var g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, lerpC(k.deep, '#2A2F3A', .5)); g.addColorStop(1, '#1B1E25'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,.05)'; disc(c, w * .22, h * .3, h * .5); disc(c, w * .8, h * .85, h * .45);
};
var heartPath = function (c, x, y, s) { c.beginPath(); c.moveTo(x, y + s * .35); c.bezierCurveTo(x - s * 1.1, y - s * .35, x - s * .45, y - s * 1.05, x, y - s * .45); c.bezierCurveTo(x + s * .45, y - s * 1.05, x + s * 1.1, y - s * .35, x, y + s * .35); c.closePath(); };
var chip = function (c, s, cx, cy, px, bg, fg, padX) { var w = sayW(c, s, px) + padX * 2, hh = px * 2.1; rrect(c, cx - w / 2, cy - hh / 2, w, hh, hh / 2); c.fillStyle = bg; c.fill(); say(c, s, cx, cy + px * .04, px, fg); return w; };
var avatar = function (c, x, y, r, col) { c.fillStyle = col; disc(c, x, y, r); c.fillStyle = 'rgba(255,255,255,.85)'; disc(c, x, y - r * .2, r * .35); c.beginPath(); c.ellipse(x, y + r * .55, r * .55, r * .35, 0, Math.PI, TAU); c.fill(); };
var bgc0 = function (c, w, h) { c.fillStyle = '#1B1E25'; c.fillRect(0, 0, w, h); };
var bubble = function (c, x, y, bw, bh, col, tail) { rrect(c, x, y, bw, bh, bh * .45); c.fillStyle = col; c.fill(); c.beginPath(); if (tail === 'l') { c.moveTo(x + bh * .3, y + bh * .7); c.lineTo(x - bh * .05, y + bh * 1.02); c.lineTo(x + bh * .7, y + bh * .9); } else { c.moveTo(x + bw - bh * .3, y + bh * .7); c.lineTo(x + bw + bh * .05, y + bh * 1.02); c.lineTo(x + bw - bh * .7, y + bh * .9); } c.closePath(); c.fill(); };
/*@end*/

var SO = {};

// ── FOLLOW · 구독과 팔로우 ─────────────────────────────────────
SO['subscribe-button'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var b = back(seg(t, .4, .45)), press = seg(t, 1.4, .25), on = P8(t) > 1.55, cx = w / 2, cy = h / 2, px = h * .11;
  var sq = press > 0 && press < 1 ? 1 - .08 * Math.sin(press * Math.PI) : 1;
  c.save(); c.translate(cx, cy); c.scale(b * sq, b * sq);
  chip(c, on ? '구독 중' : '구독', 0, 0, px, on ? '#3A3F4B' : k.acc, '#FFFFFF', h * .16);
  c.restore();
  var bl = back(seg(t, 1.7, .4));
  if (bl > 0) { c.save(); c.translate(cx + h * .55, cy); c.scale(bl, bl); c.rotate(Math.sin(seg(t, 2.1, .9) * Math.PI * 6) * .35 * (1 - seg(t, 2.1, .9))); c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(-px * .7, px * .45); c.quadraticCurveTo(-px * .6, -px * .9, 0, -px * .9); c.quadraticCurveTo(px * .6, -px * .9, px * .7, px * .45); c.closePath(); c.fill(); disc(c, 0, px * .65, px * .2); c.restore(); }
  if (press > 0 && press < 1) { c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = h * .01; c.beginPath(); c.arc(cx, cy, h * (.2 + press * .3), 0, TAU); c.stroke(); }
  c.globalAlpha = 1;
};
SO['follow-pill'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var e = eo(seg(t, .4, .5)), x = lerp(-w * .5, w * .1, e), cy = h / 2, r = h * .17, on = P8(t) > 1.9, sw = io(seg(t, 1.9, .35));
  avatar(c, x + r, cy, r, k.acc);
  say(c, 'mapo.daily', x + r * 2.4, cy - h * .06, h * .09, '#FFFFFF', 'left', 700);
  say(c, '팔로워 1.2만', x + r * 2.4, cy + h * .08, h * .07, 'rgba(255,255,255,.7)', 'left', 500);
  var bx = x + r * 2.4 + sayW(c, 'mapo.daily', h * .09) + h * .2, label = on ? '✓ 팔로잉' : '팔로우', bw = sayW(c, label, h * .08) + h * .2;
  rrect(c, bx, cy - h * .09, bw, h * .18, h * .09); c.fillStyle = lerpC(k.acc, '#3A3F4B', sw); c.fill();
  say(c, label, bx + bw / 2, cy, h * .08, '#FFFFFF');
  c.globalAlpha = 1;
};
SO['like-counter'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var cx = w / 2 - h * .25, cy = h / 2, b = back(seg(t, .4, .4)), tap = seg(t, 1.3, .4), on = P8(t) > 1.3;
  var sc = on ? (tap < 1 ? 1 + .3 * Math.sin(tap * Math.PI) : 1) : 1;
  c.save(); c.translate(cx, cy); c.scale(b * sc, b * sc); heartPath(c, 0, 0, h * .2); c.fillStyle = on ? '#FF4D6D' : 'rgba(255,255,255,.9)'; c.fill(); c.restore();
  var n = on ? Math.round(lerp(1203, 1248, eo(seg(t, 1.4, 1.6)))) : 1203;
  say(c, n.toLocaleString('en-US'), cx + h * .35, cy, h * .15, '#FFFFFF', 'left', 800);
  for (var i = 0; i < 5; i++) { var q = seg(t, 1.4 + i * .18, 1.2); if (q > 0 && q < 1) { c.save(); c.globalAlpha = outA(t) * (1 - q); heartPath(c, cx + Math.sin(q * 6 + i) * h * .08, cy - q * h * .45, h * .05); c.fillStyle = '#FF4D6D'; c.fill(); c.restore(); } }
  c.globalAlpha = 1;
};
SO['save-bookmark'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var cx = w / 2, top = lerp(-h * .5, h * .18, back(seg(t, .4, .6))), bw = h * .26, bh = h * .38, f = io(seg(t, 1.2, .5));
  c.beginPath(); c.moveTo(cx - bw / 2, top); c.lineTo(cx + bw / 2, top); c.lineTo(cx + bw / 2, top + bh); c.lineTo(cx, top + bh * .76); c.lineTo(cx - bw / 2, top + bh); c.closePath();
  c.lineWidth = h * .025; c.strokeStyle = '#FFFFFF'; c.stroke();
  c.save(); c.clip(); c.fillStyle = k.acc; c.fillRect(cx - bw / 2, top, bw, bh * f); c.restore();
  var m = seg(t, 1.8, 1.4); if (m > 0) { c.globalAlpha = outA(t) * clamp(m * 4) * (1 - clamp((m - .8) * 5)); chip(c, '저장했어요', cx, h * .82, h * .065, 'rgba(0,0,0,.6)', '#FFFFFF', h * .1); }
  c.globalAlpha = 1;
};
SO['share-fling'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var cx = w / 2 - h * .2, cy = h * .55, b = back(seg(t, .4, .4)), q = seg(t, 1.3, .8);
  c.save(); c.translate(cx + eo(q) * w * .45, cy - eo(q) * h * .45); c.rotate(-.5 * eo(q)); c.scale(b * (1 - .5 * q), b * (1 - .5 * q)); c.globalAlpha = outA(t) * (1 - clamp((q - .7) / .3));
  c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(-h * .16, h * .02); c.lineTo(h * .2, -h * .14); c.lineTo(h * .04, h * .18); c.lineTo(h * .0, h * .05); c.closePath(); c.fill(); c.restore();
  var d = seg(t, 2.2, .4); if (d > 0) { c.globalAlpha = outA(t) * d; chip(c, '링크를 보냈어요', w / 2, h * .8, h * .065, 'rgba(0,0,0,.6)', '#FFFFFF', h * .1); }
  c.globalAlpha = 1;
};
SO['swipe-up-hint'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t) * clamp((P8(t) - .4) / .4);
  var cx = w / 2, p = (P8(t) % 1.6) / 1.6;
  for (var i = 0; i < 2; i++) { var y = h * (.6 - i * .14) - eo(p) * h * .12; c.strokeStyle = 'rgba(255,255,255,' + (.9 - i * .4) * (1 - p * .7) + ')'; c.lineWidth = h * .025; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(cx - h * .1, y); c.lineTo(cx, y - h * .08); c.lineTo(cx + h * .1, y); c.stroke(); }
  say(c, '위로 밀어서 더 보기', cx, h * .82, h * .075, '#FFFFFF', 'center', 600);
  c.globalAlpha = 1;
};

// ── CHAT · 말풍선과 댓글 ────────────────────────────────────────
SO['chat-bubble-pop'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var rows = [['오늘 뭐 먹지?', 'l', .4], ['떡볶이 어때', 'r', 1.3], ['좋아 바로 가자', 'l', 2.2]], px = h * .075;
  rows.forEach(function (r, i) {
    var b = back(seg(t, r[2], .4)); if (b <= 0) return;
    var bw = sayW(c, r[0], px, 600) + h * .14, bh = h * .17, x = r[1] === 'l' ? w * .08 : w * .92 - bw, y = h * (.12 + i * .26);
    c.save(); c.translate(r[1] === 'l' ? x : x + bw, y + bh); c.scale(b, b); c.translate(-(r[1] === 'l' ? x : x + bw), -(y + bh));
    bubble(c, x, y, bw, bh, r[1] === 'l' ? '#FFFFFF' : k.acc, r[1]); say(c, r[0], x + bw / 2, y + bh / 2, px, r[1] === 'l' ? '#16181D' : '#FFFFFF', 'center', 600); c.restore();
  });
  c.globalAlpha = 1;
};
SO['typing-bubble'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var px = h * .08, msg = '방금 도착했어 ㅎㅎ', x = w * .1, y = h * .38, bh = h * .2, typing = P8(t) < 2.4;
  var b = back(seg(t, .4, .35)); if (b <= 0) { c.globalAlpha = 1; return; }
  var full = sayW(c, msg, px, 600) + h * .16, bw = typing ? h * .42 : lerp(h * .42, full, eo(seg(t, 2.4, .35)));
  c.save(); c.translate(x, y + bh); c.scale(b, b); c.translate(-x, -(y + bh)); bubble(c, x, y, bw, bh, '#FFFFFF', 'l');
  if (typing) for (var i = 0; i < 3; i++) { var q = .5 + .5 * Math.sin(TAU * P8(t) * 1.25 - i * .9); c.fillStyle = lerpC('#C9CCD3', '#5A5F6B', q); disc(c, x + h * .1 + i * h * .11, y + bh / 2 - q * h * .025, h * .032); }
  else { c.save(); c.globalAlpha *= seg(t, 2.5, .3); say(c, msg, x + h * .08, y + bh / 2, px, '#16181D', 'left', 600); c.restore(); }
  c.restore(); c.globalAlpha = 1;
};
SO['comment-rise'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var list = [['jy', '와 색감 미쳤다'], ['ok', '저장각'], ['min', '여기 어디예요?'], ['su', '다음 편 언제요'], ['ha', '첫 댓글 ㅋㅋ']], rh = h * .2, px = h * .068;
  var n = Math.min(list.length, Math.floor(clamp((P8(t) - .4) / 4) * list.length + (P8(t) > .4 ? 1 : 0)));
  for (var i = 0; i < n; i++) {
    var age = P8(t) - (.4 + i * .8), slot = (n - 1 - i), y = h * .82 - slot * rh - rh * (1 - eo(clamp(age / .35))) * -0;
    var a = clamp(age / .35) * (slot > 3 ? 0 : 1 - slot * .18);
    c.save(); c.globalAlpha = outA(t) * a; avatar(c, w * .1, y, h * .06, ['#F05032', '#2B7FE0', '#17A88A', '#6B5AE0', '#E8930C'][i]);
    say(c, list[i][0], w * .1 + h * .1, y, px, 'rgba(255,255,255,.65)', 'left', 700); say(c, list[i][1], w * .1 + h * .1 + sayW(c, list[i][0], px) + h * .05, y, px, '#FFFFFF', 'left', 500); c.restore();
  }
  c.globalAlpha = 1;
};
SO['reply-thread'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var rows = [[0, '이거 어디서 샀어요?'], [1, '망원 시장 2층이요'], [1, '감사해요 바로 가요']], px = h * .068, x0 = w * .1;
  rows.forEach(function (r, i) {
    var e = eo(seg(t, .4 + i * .8, .4)); if (e <= 0) return;
    var x = x0 + r[0] * h * .22, y = h * (.22 + i * .27);
    if (r[0] && i) { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = h * .012; c.beginPath(); c.moveTo(x0 + h * .05, h * (.22 + (i - 1) * .27) + h * .07); c.lineTo(x0 + h * .05, y); c.lineTo(x - h * .02, y); c.globalAlpha = outA(t) * e; c.stroke(); }
    c.globalAlpha = outA(t) * e; avatar(c, x + h * .05, y, h * .05, i ? k.acc : '#2B7FE0'); say(c, r[1], x + h * .14 - (1 - e) * h * .1, y, px, '#FFFFFF', 'left', 600);
  });
  c.globalAlpha = 1;
};
SO['reaction-float'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var cols = ['#FF4D6D', '#FFB020', k.acc, '#FFFFFF'];
  for (var i = 0; i < 14; i++) {
    var st = .4 + hash(i) * 4.6, q = seg(t, st, 2.2); if (q <= 0 || q >= 1) continue;
    var x = w * (.72 + .12 * Math.sin(q * 5 + i)) , y = h * (.95 - q * .9), s = h * .055 * (.8 + hash(i + 5) * .6) * (q < .15 ? back(q / .15) : 1);
    c.save(); c.globalAlpha = outA(t) * (1 - clamp((q - .7) / .3));
    if (i % 3 === 0) { heartPath(c, x, y, s); c.fillStyle = cols[0]; c.fill(); } else { c.fillStyle = cols[i % 4]; disc(c, x, y, s * .7); c.fillStyle = '#16181D'; disc(c, x - s * .25, y - s * .1, s * .1); disc(c, x + s * .25, y - s * .1, s * .1); c.strokeStyle = '#16181D'; c.lineWidth = s * .1; c.beginPath(); c.arc(x, y + s * .05, s * .3, .2, Math.PI - .2); c.stroke(); }
    c.restore();
  }
  c.globalAlpha = 1;
};
SO['poll-bars'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var opts = [['떡볶이', 64], ['라면', 36]], x = w * .12, bw = w * .76, bh = h * .2, px = h * .075;
  var vote = P8(t) > 1.2;
  opts.forEach(function (o, i) {
    var y = h * (.22 + i * .32), e = io(seg(t, 1.2, 1.2)), win = i === 0;
    rrect(c, x, y, bw, bh, bh / 2); c.fillStyle = 'rgba(255,255,255,.16)'; c.fill();
    if (vote) { rrect(c, x, y, bw * o[1] / 100 * e, bh, bh / 2); c.fillStyle = win ? k.acc : 'rgba(255,255,255,.35)'; c.fill(); }
    say(c, o[0], x + h * .08, y + bh / 2, px, '#FFFFFF', 'left', 700);
    if (vote) { c.save(); c.globalAlpha *= e; say(c, Math.round(o[1] * e) + '%', x + bw - h * .08, y + bh / 2, px, '#FFFFFF', 'right', 800); c.restore(); }
  });
  c.globalAlpha = 1;
};

// ── ALERT · 알림과 표시 ───────────────────────────────────────
SO['toast-slide'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var e = back(seg(t, .4, .5)), up = io(seg(t, 3.2, .4)), y = lerp(-h * .3, h * .14, e) - up * h * .5, bw = w * .78, bh = h * .3, x = w / 2 - bw / 2;
  rrect(c, x, y, bw, bh, h * .07); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill();
  c.fillStyle = k.acc; rrect(c, x + h * .06, y + bh / 2 - h * .07, h * .14, h * .14, h * .035); c.fill();
  say(c, '주문이 접수됐어요', x + h * .26, y + bh * .36, h * .075, '#16181D', 'left', 800);
  say(c, '15분 뒤 도착 예정', x + h * .26, y + bh * .68, h * .062, '#6B6F7A', 'left', 500);
  c.globalAlpha = 1;
};
SO['notification-stack'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var msgs = ['새 팔로워 3명', '댓글 2개', '좋아요 120개'], bw = w * .74, bh = h * .2, x = w / 2 - bw / 2;
  var n = 0; msgs.forEach(function (m, i) { if (P8(t) > .4 + i * .9) n = i + 1; });
  for (var i = 0; i < n; i++) {
    var slot = n - 1 - i, e = back(seg(t, .4 + i * .9, .45)), y = h * .14 + slot * h * .055, sc = 1 - slot * .06;
    c.save(); c.globalAlpha = outA(t) * (1 - slot * .25); c.translate(w / 2, y + bh / 2 - (1 - e) * h * .2); c.scale(sc, sc); c.translate(-w / 2, -(y + bh / 2));
    rrect(c, x, y, bw, bh, h * .06); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill(); c.fillStyle = k.acc; disc(c, x + h * .1, y + bh / 2, h * .045);
    say(c, msgs[i], x + h * .2, y + bh / 2, h * .068, '#16181D', 'left', 700); c.restore();
  }
  c.globalAlpha = 1;
};
SO['live-badge'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t) * clamp((P8(t) - .4) / .3);
  var x = w * .1, y = h * .14, b = back(seg(t, .4, .4)), blink = .5 + .5 * Math.cos(TAU * P8(t));
  c.save(); c.translate(x, y); c.scale(b, b);
  rrect(c, 0, 0, h * .38, h * .16, h * .04); c.fillStyle = '#E5372B'; c.fill();
  c.fillStyle = 'rgba(255,255,255,' + (.35 + .65 * blink) + ')'; disc(c, h * .07, h * .08, h * .028);
  say(c, 'LIVE', h * .23, h * .085, h * .085, '#FFFFFF', 'center', 800);
  rrect(c, h * .42, 0, h * .44, h * .16, h * .04); c.fillStyle = 'rgba(0,0,0,.55)'; c.fill();
  var v = Math.round(lerp(1832, 1904, P8(t) / 8)); say(c, v.toLocaleString('en-US') + '명', h * .64, h * .085, h * .07, '#FFFFFF', 'center', 600);
  c.restore(); c.globalAlpha = 1;
};
SO['new-tag-flash'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var cw = w * .5, ch = h * .6, x = w / 2 - cw / 2, y = h * .2;
  rrect(c, x, y, cw, ch, h * .05); c.fillStyle = 'rgba(255,255,255,.14)'; c.fill();
  say(c, '가을 신메뉴', x + h * .08, y + ch - h * .1, h * .075, '#FFFFFF', 'left', 700);
  var b = back(seg(t, .8, .4)), sh = seg(t, 1.3, .6);
  c.save(); c.translate(x + cw - h * .05, y + h * .05); c.rotate(.18); c.scale(b, b);
  rrect(c, -h * .2, -h * .07, h * .4, h * .14, h * .035); c.fillStyle = k.acc; c.fill(); say(c, 'NEW', 0, h * .005, h * .08, '#FFFFFF', 'center', 900);
  if (sh > 0 && sh < 1) { c.save(); rrect(c, -h * .2, -h * .07, h * .4, h * .14, h * .035); c.clip(); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(lerp(-h * .4, h * .3, sh), -h * .1, h * .06, h * .2); c.restore(); }
  c.restore(); c.globalAlpha = 1;
};
SO['countdown-chip'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var p = P8(t) - .4; if (p < 0) { c.globalAlpha = 1; return; }
  var n = 3 - Math.floor(p / 1.2), f = (p % 1.2) / 1.2, cx = w / 2, cy = h / 2;
  if (n >= 1) {
    c.lineWidth = h * .03; c.strokeStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(cx, cy, h * .26, 0, TAU); c.stroke();
    c.strokeStyle = k.acc; c.beginPath(); c.arc(cx, cy, h * .26, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - f)); c.stroke();
    var s = f < .15 ? back(f / .15) : 1; c.save(); c.translate(cx, cy); c.scale(s, s); say(c, String(n), 0, h * .01, h * .26, '#FFFFFF', 'center', 900); c.restore();
  } else { var s2 = back(clamp((p - 3.6) / .4)); c.save(); c.translate(cx, cy); c.scale(s2, s2); chip(c, '시작!', 0, 0, h * .1, k.acc, '#FFFFFF', h * .14); c.restore(); }
  c.globalAlpha = 1;
};
SO['story-progress'] = function (c, w, h, t, k) {
  scene(c, w, h, k);
  var n = 4, gap = h * .025, x0 = w * .05, tot = w * .9, sw = (tot - gap * (n - 1)) / n, y = h * .1, p = P8(t) / 2;
  for (var i = 0; i < n; i++) {
    var x = x0 + i * (sw + gap), f = clamp(p - i);
    rrect(c, x, y, sw, h * .025, h * .0125); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill();
    if (f > 0) { rrect(c, x, y, sw * f, h * .025, h * .0125); c.fillStyle = '#FFFFFF'; c.fill(); }
  }
  avatar(c, x0 + h * .07, y + h * .14, h * .055, k.acc); say(c, 'mapo.daily', x0 + h * .16, y + h * .14, h * .065, '#FFFFFF', 'left', 700);
  say(c, String(Math.floor(p) + 1) + ' / 4', w / 2, h * .62, h * .16, 'rgba(255,255,255,.85)', 'center', 800);
};

// ── FRAME · 화면 위 표시 ──────────────────────────────────────
SO['location-pin'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var cx = w * .3, cy = h * .55, d = seg(t, .4, .5), y = lerp(-h * .3, cy, d < 1 ? d * d : 1), b = d >= 1 ? 1 - .15 * Math.sin(seg(t, .9, .3) * Math.PI) : 1;
  c.save(); c.translate(cx, y); c.scale(1, b); c.fillStyle = k.acc; c.beginPath(); c.arc(0, -h * .2, h * .11, Math.PI * .85, Math.PI * .15); c.lineTo(0, 0); c.closePath(); c.fill(); c.fillStyle = '#FFFFFF'; disc(c, 0, -h * .2, h * .045); c.restore();
  var e = eo(seg(t, 1.1, .5)); if (e > 0) { c.save(); c.beginPath(); c.rect(cx + h * .12, 0, w, h); c.clip(); var px = h * .075, lw = sayW(c, '마포구 연남동', px) + h * .14; rrect(c, cx + h * .14 - (1 - e) * lw, cy - h * .3, lw, h * .16, h * .08); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill(); say(c, '마포구 연남동', cx + h * .14 - (1 - e) * lw + lw / 2, cy - h * .22, px, '#16181D', 'center', 700); c.restore(); }
  c.globalAlpha = 1;
};
SO['caption-pop'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var words = ['이거', '진짜', '하나만', '기억하세요'], hot = 2, px = h * .1, gap = h * .1, tot = 0;
  words.forEach(function (s) { tot += sayW(c, s, px, 800) + gap; }); var x = w / 2 - tot / 2 + gap / 2, y = h * .7;
  words.forEach(function (s, i) {
    var st = .4 + i * .35, b = back(seg(t, st, .3)); if (b <= 0) { x += sayW(c, s, px, 800) + gap; return; }
    var ww = sayW(c, s, px, 800), isHot = i === hot, sc = isHot ? lerp(1, 1.15, back(seg(t, st, .3))) : 1;
    c.save(); c.translate(x + ww / 2, y); c.scale(b * sc, b * sc);
    if (isHot) { rrect(c, -ww / 2 - h * .03, -px * .7, ww + h * .06, px * 1.4, h * .025); c.fillStyle = '#FFD43B'; c.fill(); }
    c.lineWidth = h * .022; c.strokeStyle = isHot ? 'rgba(0,0,0,0)' : '#16181D'; c.font = '800 ' + px + 'px ' + SANS; c.textAlign = 'center'; c.textBaseline = 'middle'; if (!isHot) c.strokeText(s, 0, 0);
    say(c, s, 0, 0, px, isHot ? '#16181D' : '#FFFFFF', 'center', 800); c.restore();
    x += ww + gap;
  });
  c.globalAlpha = 1;
};
SO['sticker-slap'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var p = seg(t, .4, .3), sc = lerp(1.8, 1, io(p)), rot = lerp(-.6, -.12, io(p)), hit = seg(t, .7, .25);
  if (P8(t) < .4) { c.globalAlpha = 1; return; }
  var wob = hit > 0 && hit < 1 ? Math.sin(hit * Math.PI * 3) * .06 * (1 - hit) : 0;
  c.save(); c.translate(w / 2, h / 2); c.rotate(rot + wob); c.scale(sc, sc); c.globalAlpha = outA(t) * clamp(p * 3);
  var r = h * .3; c.fillStyle = '#FFFFFF'; disc(c, 0, 0, r * 1.08); c.fillStyle = k.acc; disc(c, 0, 0, r);
  say(c, '오늘만', 0, -r * .2, r * .32, '#FFFFFF', 'center', 900); say(c, '50%', 0, r * .25, r * .42, '#FFFFFF', 'center', 900);
  c.restore(); c.globalAlpha = 1;
};
SO['arrow-point'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var tx = w * .72, ty = h * .55, e = io(seg(t, .4, .8));
  c.fillStyle = 'rgba(255,255,255,.18)'; rrect(c, tx - h * .18, ty - h * .12, h * .36, h * .24, h * .05); c.fill();
  var pts = []; for (var i = 0; i <= 30; i++) { var u = i / 30; pts.push([lerp(w * .18, tx - h * .24, u), lerp(h * .25, ty, u) - Math.sin(u * Math.PI) * h * .25]); }
  c.strokeStyle = '#FFD43B'; c.lineWidth = h * .028; c.lineCap = 'round'; c.lineJoin = 'round';
  var L = 0; for (var j = 1; j < pts.length; j++) L += Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]);
  c.setLineDash([L * e, L + 1]); c.beginPath(); pts.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.stroke(); c.setLineDash([]);
  var hd = back(seg(t, 1.15, .3)); if (hd > 0) { var a = Math.atan2(pts[30][1] - pts[27][1], pts[30][0] - pts[27][0]), ex = pts[30][0], ey = pts[30][1], s = h * .08 * hd; c.beginPath(); c.moveTo(ex - Math.cos(a - .5) * s, ey - Math.sin(a - .5) * s); c.lineTo(ex, ey); c.lineTo(ex - Math.cos(a + .5) * s, ey - Math.sin(a + .5) * s); c.stroke(); }
  var l = seg(t, 1.4, .4); if (l > 0) { c.globalAlpha = outA(t) * l; say(c, '여기 누르세요', w * .18, h * .15, h * .08, '#FFD43B', 'left', 800); }
  c.globalAlpha = 1;
};
SO['highlight-box'] = function (c, w, h, t, k) {
  scene(c, w, h, k); c.globalAlpha = outA(t);
  var lines = ['가격  12,000원', '배송  내일 도착', '할인  20% 쿠폰'], px = h * .075;
  lines.forEach(function (s, i) { say(c, s, w * .2, h * (.25 + i * .25), px, 'rgba(255,255,255,.85)', 'left', 600); });
  var e = io(seg(t, .8, .9)), x = w * .16, y = h * .75, bw = sayW(c, lines[2], px, 600) + h * .14, bh = h * .2;
  var per = 2 * (bw + bh), L = per * e;
  c.strokeStyle = '#FFD43B'; c.lineWidth = h * .022; c.lineJoin = 'round';
  c.setLineDash([L, per + 1]); rrect(c, x, y - bh / 2, bw, bh, h * .03); c.stroke(); c.setLineDash([]);
  var b = back(seg(t, 1.8, .35)); if (b > 0) { c.save(); c.translate(x + bw + h * .12, y); c.scale(b, b); say(c, '이것만 기억', 0, 0, h * .065, '#FFD43B', 'left', 800); c.restore(); }
  c.globalAlpha = 1;
};
SO['before-after-label'] = function (c, w, h, t, k) {
  bgc0(c, w, h); c.globalAlpha = outA(t);
  var split = lerp(w * .5, w * .5 + Math.sin(TAU * P8(t) / 4) * w * .12, clamp((P8(t) - 1.2) / .6));
  c.fillStyle = '#5A5F6B'; c.fillRect(0, 0, split, h); var g = c.createLinearGradient(split, 0, w, h); g.addColorStop(0, k.acc); g.addColorStop(1, lerpC(k.acc, '#FFD43B', .5)); c.fillStyle = g; c.fillRect(split, 0, w - split, h);
  c.fillStyle = '#FFFFFF'; c.fillRect(split - h * .008, 0, h * .016, h); disc(c, split, h / 2, h * .06);
  var a = back(seg(t, .4, .4)), b = back(seg(t, .7, .4));
  c.save(); c.translate(w * .05 + h * .2, h * .15); c.scale(a, a); chip(c, '전', 0, 0, h * .07, 'rgba(0,0,0,.55)', '#FFFFFF', h * .08); c.restore();
  c.save(); c.translate(w * .95 - h * .2, h * .15); c.scale(b, b); chip(c, '후', 0, 0, h * .07, 'rgba(0,0,0,.55)', '#FFFFFF', h * .08); c.restore();
  c.globalAlpha = 1;
};

if (typeof module !== 'undefined') module.exports = { SO: SO };
