// ⑱ 숫자 연출 — 쇼핑·게임·계기에서 숫자가 움직이는 장면. 전부 손잡이가 붙는다 (의존성 0)
// 손잡이 이름·범위·처음 값·문장 틀의 정본은 menu.json 의 knobs · askT. 여기는 그리기만 한다.
// tools/knobs/gen.mjs 가 이 파일도 읽어 demos/m22-number-motion.html 을 만든다.
//
// KN[id] = { still: 멈춤 화면에서 보여 줄 초, F(c, w, h, t, V, k) }
//   t: 마지막으로 값을 바꾼 뒤 흐른 초   V: 손잡이 값   k: 색
// 숫자는 전부 예시 값이다. 손잡이 값이 그대로 그림에 나온다.

/*@helpers*/
var TAU = Math.PI * 2;
var cl = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
var io = function (t) { t = cl(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
var eo = function (t) { t = cl(t); return 1 - Math.pow(1 - t, 3); };
var back = function (t) { t = cl(t); var s = 1.7; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
var seg = function (t, a, d) { return cl((t - a) / d); };
var bgc = function (c, w, h, col) { c.fillStyle = col; c.fillRect(0, 0, w, h); };
var NFONT = function (px, wt) { return (wt || 800) + ' ' + Math.round(px) + 'px -apple-system,"Apple SD Gothic Neo",system-ui,sans-serif'; };
var say = function (c, s, x, y, font, col, al) { c.font = font; c.fillStyle = col; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
var sw = function (c, s, font) { c.font = font; return c.measureText(s).width; };
var rbox = function (c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); };
var comma = function (v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
var SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
/*@end*/

var KN = {};

// 할인가 · 원가에 줄을 긋고, 내린 값이 아래에서 튀어 오른다
KN['sale-price'] = {
  still: 2.2,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 3.6, p = t % L, out = 1 - seg(p, 3.1, .35), now = Math.round(V.orig * (1 - V.pct / 100) / 100) * 100;
    c.globalAlpha = out;
    var oy = h * .34, ny = h * .66, ofont = NFONT(h * .15, 700), os = '₩' + comma(V.orig), ow = sw(c, os, ofont);
    var dim = seg(p, .75, .35);
    say(c, os, w / 2, oy - dim * 4, ofont, dim > 0 ? 'rgba(244,241,234,' + (1 - .55 * dim) + ')' : k.paper);
    var ln = eo(seg(p, .3, .4));
    if (ln > 0) { c.strokeStyle = k.pink; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2 - ow / 2 - 4, oy); c.lineTo(w / 2 - ow / 2 - 4 + (ow + 8) * ln, oy); c.stroke(); }
    var up = seg(p, 1.05, .45);
    if (up > 0) {
      var nfont = NFONT(h * .27, 900), ns = '₩' + comma(now), nw = sw(c, ns, nfont), s = back(up);
      c.save(); c.translate(w / 2 - 22, ny + (1 - eo(up)) * 30); c.scale(s, s); say(c, ns, 0, 0, nfont, k.paper); c.restore();
      var cp = back(seg(p, 1.35, .35));
      if (cp > 0) { var cs = '-' + Math.round(V.pct) + '%', cf = NFONT(h * .1, 800), cwid = sw(c, cs, cf) + 14, cx = w / 2 - 22 + nw / 2 + 10; c.save(); c.translate(cx + cwid / 2, ny - h * .1); c.scale(cp, cp); c.fillStyle = k.pink; rbox(c, -cwid / 2, -h * .07, cwid, h * .14, 6); c.fill(); say(c, cs, 0, 1, cf, k.paper); c.restore(); }
    }
    c.globalAlpha = 1;
  }
};

// 포인트 적립 · +N P 가 떠올라 합계로 날아가고, 닿으면 합계가 올라간다
KN['point-earn'] = {
  still: 2.6,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 3.8, p = t % L, base = 1200, fly = seg(p, .9, .55), land = 1.45, cnt = eo(seg(p, land, .6));
    var tx = w * .72, ty = h * .5, bx = w * .24, by = h * .62;
    // 버튼
    c.fillStyle = k.acc2; rbox(c, bx - 54, by - 16, 108, 32, 16); c.fill(); say(c, '구매 확정', bx, by + 1, NFONT(13, 800), k.paper);
    // 합계
    say(c, 'POINTS', tx, ty - h * .2, NFONT(10, 800), k.sub);
    var tot = base + V.add * (p < land ? 0 : cnt), bump = p > land && p < land + .25 ? 1 + .08 * Math.sin(seg(p, land, .25) * Math.PI) : 1;
    c.save(); c.translate(tx, ty + 4); c.scale(bump, bump); say(c, comma(tot) + 'P', 0, 0, NFONT(h * .2, 900), k.paper); c.restore();
    // 떠오르는 +N
    var rise = eo(seg(p, .35, .5));
    if (p > .35 && p < land) {
      var x = bx + (tx - bx) * io(fly), y = by - 34 * rise - (fly > 0 ? Math.sin(fly * Math.PI) * h * .22 - 34 * fly : 0), s = 1 - .35 * fly;
      c.save(); c.globalAlpha = cl(rise * 2); c.translate(x, y); c.scale(s, s); say(c, '+' + comma(V.add) + 'P', 0, 0, NFONT(h * .13, 900), k.green); c.restore();
    }
    if (p > land && p < land + .4) { var r = seg(p, land, .4); c.strokeStyle = 'rgba(56,190,134,' + (1 - r) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(tx, ty + 4, 30 + 40 * r, 0, TAU); c.stroke(); }
  }
};

// 재고 남음 · 하나씩 줄다가 warn 개 이하면 빨갛게, 맥박처럼 뛴다
KN['stock-left'] = {
  still: 3,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var from = Math.round(V.from), warn = Math.round(V.warn), step = .22, run = (from - 1) * step, L = .5 + run + 1.6, p = t % L;
    var n = Math.max(1, from - Math.floor(Math.max(0, p - .5) / step)), low = n <= warn;
    var pulse = low ? 1 + .09 * Math.max(0, Math.sin((p % .6) / .6 * Math.PI)) : 1;
    var col = low ? k.pink : k.paper;
    say(c, '남은', w / 2 - h * .34, h * .46, NFONT(h * .1, 700), k.sub, 'right');
    c.save(); c.translate(w / 2, h * .44); c.scale(pulse, pulse); say(c, String(n), 0, 0, NFONT(h * .36, 900), col); c.restore();
    say(c, '개', w / 2 + h * .3, h * .5, NFONT(h * .1, 700), k.sub, 'left');
    var bw = w * .6, bx = (w - bw) / 2, by = h * .78;
    c.fillStyle = 'rgba(244,241,234,.12)'; rbox(c, bx, by, bw, 6, 3); c.fill();
    c.fillStyle = col; rbox(c, bx, by, bw * n / from, 6, 3); c.fill();
    c.fillStyle = 'rgba(232,80,110,.55)'; c.fillRect(bx + bw * warn / from, by - 4, 2, 14);
    say(c, warn + '개부터 빨강', bx + bw * warn / from, by + 18, NFONT(10, 700), 'rgba(232,80,110,.8)');
  }
};

// 무료배송 막대 · 장바구니 금액만큼 차고 남은 금액을 적는다. 넘으면 초록
KN['free-ship'] = {
  still: 1.6,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 4.2, p = t % L, goal = V.goal, cart = V.cart, add = Math.max(goal - cart, 0) + 6000;
    var f1 = eo(seg(p, .2, .8)), f2 = eo(seg(p, 2.1, .6)), cur = cart * f1 + add * f2, done = cur >= goal;
    var bw = w * .74, bx = (w - bw) / 2, by = h * .56, bh = 12;
    var left = Math.max(goal - cur, 0);
    say(c, done ? '무료배송이에요' : '무료배송까지 ₩' + comma(Math.ceil(left / 100) * 100), w / 2, h * .24, NFONT(h * .12, 800), done ? k.green : k.paper);
    c.fillStyle = 'rgba(244,241,234,.12)'; rbox(c, bx, by, bw, bh, 6); c.fill();
    c.fillStyle = done ? k.green : k.acc; rbox(c, bx, by, bw * Math.min(cur / goal, 1), bh, 6); c.fill();
    say(c, '₩0', bx, by + 26, NFONT(10, 700), k.sub, 'left'); say(c, '₩' + comma(goal), bx + bw, by + 26, NFONT(10, 700), k.sub, 'right');
    if (p > 1.6 && p < 2.6) { var q = seg(p, 1.6, .5), cs = '+₩' + comma(add); c.globalAlpha = 1 - seg(p, 2.3, .3); say(c, cs, bx + bw * Math.min(cart / goal, 1), by - 12 - 12 * (1 - eo(q)), NFONT(12, 800), k.acc); c.globalAlpha = 1; }
    say(c, '장바구니 ₩' + comma(cur), w / 2, h * .86, NFONT(11, 700), k.sub);
  }
};

// ── GAME
// 콤보 점수 · 맞힐 때마다 점수가 hit × 배율만큼 오르고 배율 칩이 커지며 튄다
KN['combo-score'] = {
  still: 2.4,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var mx = Math.round(V.max), step = .55, L = .4 + mx * step + 1.4, p = t % L, n = Math.min(mx, Math.max(0, Math.floor((p - .4) / step) + 1)), score = 0;
    for (var i = 1; i <= n; i++) score += V.hit * i;
    var since = p - .4 - (n - 1) * step, pop = n ? back(seg(since, 0, .25)) : 0;
    say(c, 'SCORE', w * .36, h * .26, NFONT(10, 800), k.sub);
    c.save(); c.translate(w * .36, h * .52); var b = n ? 1 + .08 * (1 - seg(since, 0, .2)) : 1; c.scale(b, b); say(c, comma(score), 0, 0, NFONT(h * .26, 900), k.paper); c.restore();
    if (n) { c.save(); c.translate(w * .78, h * .48); c.scale(pop * (1 + n * .06), pop * (1 + n * .06)); say(c, '×' + n, 0, 0, NFONT(h * .2, 900), '#F5C542'); say(c, 'COMBO', 0, h * .14, NFONT(9, 800), '#F5C542'); c.restore(); }
    if (n && since < .35) say(c, '+' + comma(V.hit * n), w * .36 + 70, h * .3 - 16 * seg(since, 0, .35), NFONT(12, 800), k.green);
  }
};

// 레벨업 · 경험치 막대가 gain 씩 차다 need 를 채우면 LEVEL UP, 넘친 만큼은 다음 막대로
KN['level-up'] = {
  still: 2.2,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var hits = Math.ceil(V.need / V.gain) + 1, step = .5, L = .3 + hits * step + 1.2, p = t % L, got = 0;
    for (var i = 0; i < hits; i++) got += V.gain * eo(seg(p, .3 + i * step, .35));
    var lv = 7 + (got >= V.need ? 1 : 0), xp = got >= V.need ? got - V.need : got, upT = .3 + (Math.ceil(V.need / V.gain) - 1) * step + .35;
    var cx = w * .18, cy = h * .5;
    c.fillStyle = '#1F2533'; c.beginPath(); c.arc(cx, cy, h * .2, 0, TAU); c.fill();
    var lp = lv > 7 ? back(seg(p, upT, .3)) : 1;
    c.save(); c.translate(cx, cy + 4); c.scale(lp, lp); say(c, String(lv), 0, 0, NFONT(h * .2, 900), k.paper); c.restore(); say(c, 'LV', cx, cy - h * .12, NFONT(9, 800), k.sub);
    var bx = w * .34, bw = w * .56, by = h * .55;
    say(c, comma(xp) + ' / ' + comma(V.need) + ' XP', bx + bw / 2, by - 16, NFONT(11, 700), k.sub);
    c.fillStyle = 'rgba(244,241,234,.12)'; rbox(c, bx, by, bw, 10, 5); c.fill();
    c.fillStyle = k.pink; rbox(c, bx, by, bw * Math.min(xp / V.need, 1), 10, 5); c.fill();
    if (lv > 7 && p - upT < 1) { var f = seg(p, upT, 1); c.globalAlpha = 1 - f; say(c, 'LEVEL UP', w / 2, h * .2 - 8 * f, NFONT(h * .13, 900), '#F5C542'); c.globalAlpha = 1; }
  }
};

// 데미지 숫자 · 맞은 자리에서 숫자가 튀어 오르고, 치명타는 crit 배를 노랗게 크게
KN['damage-pop'] = {
  still: 1.8,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 3, p = t % L, tx = w * .3, ty = h * .62;
    c.fillStyle = '#2A3142'; c.beginPath(); c.arc(tx, ty, h * .17, 0, TAU); c.fill(); c.strokeStyle = k.acc2; c.lineWidth = 3; c.beginPath(); c.arc(tx, ty, h * .1, 0, TAU); c.stroke();
    var a = seg(p, .2, .8);
    if (a > 0 && a < 1) { c.globalAlpha = 1 - seg(a, .6, .4); say(c, comma(V.dmg), tx + 20, ty - h * .2 - 30 * eo(a), NFONT(h * .13, 900), k.paper); c.globalAlpha = 1; }
    var b = seg(p, 1.2, 1.3);
    if (b > 0 && b < 1) { var s = back(seg(b, 0, .25)) * 1.0, sh = b < .3 ? Math.sin(b * 80) * 3 : 0; c.globalAlpha = 1 - seg(b, .7, .3); c.save(); c.translate(tx + 70 + sh, ty - h * .26 - 20 * eo(b)); c.scale(s, s); say(c, comma(V.dmg * V.crit), 0, 0, NFONT(h * .22, 900), '#F5C542'); say(c, 'CRITICAL', 0, h * .13, NFONT(9, 800), '#F5C542'); c.restore(); c.globalAlpha = 1; }
  }
};

// 하이스코어 · 점수가 세어 오르다 기록을 넘는 순간 NEW RECORD 도장, 기록 자리가 바뀐다
KN['high-score'] = {
  still: 2.6,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 4, p = t % L, cur = V.now * eo(seg(p, .2, 1.8)), broke = cur >= V.best && V.now > V.best;
    var bt = broke ? Math.max(.2, .2 + 1.8 * 0) : 0;
    say(c, 'HIGH SCORE', w / 2, h * .16, NFONT(10, 800), k.sub);
    say(c, comma(broke ? cur : V.best), w / 2, h * .3, NFONT(h * .11, 800), broke ? '#F5C542' : k.sub);
    say(c, comma(cur), w / 2, h * .62, NFONT(h * .3, 900), k.paper);
    if (broke) {
      var first = 0; for (var q = .2; q < 2.1; q += .01) { if (V.now * eo(seg(q, .2, 1.8)) >= V.best) { first = q; break; } }
      var st = back(seg(p, first, .3)); c.save(); c.translate(w * .8, h * .22); c.rotate(-.12); c.scale(st * (1.6 - .6 * Math.min(1, st)), st * (1.6 - .6 * Math.min(1, st))); c.strokeStyle = k.pink; c.lineWidth = 3; rbox(c, -46, -16, 92, 32, 6); c.stroke(); say(c, 'NEW RECORD', 0, 1, NFONT(11, 900), k.pink); c.restore();
    }
  }
};

// 룰렛 · n 칸 판이 spin 초 돌다 천천히 멈추고, 멈춘 칸 숫자가 결과 자리에 튄다
KN['roulette'] = {
  still: 4,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var n = Math.round(V.n), sp = V.spin, L = .3 + sp + 1.6, p = t % L, win = 3 % n, turns = 4;
    var u = eo(seg(p, .3, sp)), target = turns * TAU + (win + .5) / n * TAU, ang = -target * u;
    var cx = w * .32, cy = h * .53, R = h * .38;
    for (var i = 0; i < n; i++) {
      var a0 = ang + i / n * TAU - Math.PI / 2, a1 = a0 + TAU / n;
      c.fillStyle = i === win && u >= 1 ? k.pink : (i % 2 ? '#232A3A' : '#2C3446'); c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, a0, a1); c.closePath(); c.fill();
      var am = (a0 + a1) / 2; say(c, String(i + 1), cx + Math.cos(am) * R * .72, cy + Math.sin(am) * R * .72, NFONT(11, 800), k.paper);
    }
    c.fillStyle = k.green; c.beginPath(); c.moveTo(cx - 7, cy - R - 8); c.lineTo(cx + 7, cy - R - 8); c.lineTo(cx, cy - R + 4); c.closePath(); c.fill();
    c.fillStyle = k.ink; c.beginPath(); c.arc(cx, cy, 6, 0, TAU); c.fill();
    say(c, 'RESULT', w * .74, h * .3, NFONT(10, 800), k.sub);
    if (u >= 1) { var b = back(seg(p, .3 + sp, .35)); c.save(); c.translate(w * .74, h * .58); c.scale(b, b); say(c, String(win + 1), 0, 0, NFONT(h * .32, 900), k.paper); c.restore(); }
    else say(c, '?', w * .74, h * .58, NFONT(h * .32, 900), 'rgba(244,241,234,.3)');
  }
};

// 주사위 · dur 초 동안 구르다 roll 이 나오면 멈추고 결과 숫자가 크게
KN['dice-roll'] = {
  still: 2.4,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var d = V.dur, L = .2 + d + 1.6, p = t % L, u = seg(p, .2, d), done = u >= 1;
    var face = done ? Math.round(V.roll) : 1 + Math.floor((u * 23 + 7) * 3.7) % 6;
    var x = w * .12 + w * .26 * eo(u), y = h * .55 - Math.abs(Math.sin(u * Math.PI * 3)) * h * .22 * (1 - u), rot = (1 - eo(u)) * 7, S = h * .38;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x, h * .82, S * .45, 6, 0, 0, TAU); c.fill();
    c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = '#F4F1EA'; rbox(c, -S / 2, -S / 2, S, S, S * .2); c.fill();
    var P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[face];
    c.fillStyle = face === 1 ? k.pink : '#17171B'; P.forEach(function (q) { c.beginPath(); c.arc(q[0] * S * .25, q[1] * S * .25, S * .08, 0, TAU); c.fill(); }); c.restore();
    say(c, 'ROLL', w * .74, h * .3, NFONT(10, 800), k.sub);
    if (done) { var b = back(seg(p, .2 + d, .3)); c.save(); c.translate(w * .74, h * .58); c.scale(b, b); say(c, String(face), 0, 0, NFONT(h * .34, 900), k.paper); c.restore(); }
  }
};

// ── METER
// 7세그먼트 · 꺼진 획은 흐리게 남기고 켜질 때 0.1초 깜빡
KN['seven-seg'] = {
  still: 1.5,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 3.4, p = t % L, s = String(Math.round(V.val)).padStart(4, '0'), dw = h * .3, dh = h * .52, th = 6, gap = 14, x0 = (w - (4 * dw + 3 * gap)) / 2, y0 = (h - dh) / 2;
    for (var i = 0; i < 4; i++) {
      var on = SEG[s[i]], lit = seg(p, .3 + i * .15, .1), flick = p > .3 + i * .15 && p < .5 + i * .15 && Math.floor(p * 40) % 2 === 0;
      var x = x0 + i * (dw + gap), r = { a: [x + th, y0, dw - 2 * th, th], b: [x + dw - th, y0 + th, th, dh / 2 - th * 1.5], c: [x + dw - th, y0 + dh / 2 + th / 2, th, dh / 2 - th * 1.5], d: [x + th, y0 + dh - th, dw - 2 * th, th], e: [x, y0 + dh / 2 + th / 2, th, dh / 2 - th * 1.5], f: [x, y0 + th, th, dh / 2 - th * 1.5], g: [x + th, y0 + dh / 2 - th / 2, dw - 2 * th, th] };
      for (var sg in r) { var isOn = on.indexOf(sg) >= 0 && lit > 0 && !flick; c.fillStyle = isOn ? k.pink : 'rgba(232,80,110,.1)'; if (isOn) { c.shadowColor = k.pink; c.shadowBlur = 10; } rbox(c, r[sg][0], r[sg][1], r[sg][2], r[sg][3], 3); c.fill(); c.shadowBlur = 0; }
    }
  }
};

// 바늘 게이지 · 0에서 val 까지 1초, 끝에서 살짝 지나쳤다 돌아온다
KN['needle-gauge'] = {
  still: 1.8,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 3.2, p = t % L, mx = V.max, frac = Math.min(V.val / mx, 1), u = seg(p, .3, 1), back2 = function (x) { var s2 = 2.2; return 1 + (s2 + 1) * Math.pow(x - 1, 3) + s2 * Math.pow(x - 1, 2); };
    var cur = frac * (p < .3 ? 0 : back2(u)), back3 = p > L - .5 ? 1 - io(seg(p, L - .5, .4)) : 1; cur *= back3;
    var cx = w * .4, cy = h * .76, R = h * .5, a0 = Math.PI, a1 = TAU;
    c.lineWidth = 8; c.lineCap = 'round'; c.strokeStyle = 'rgba(244,241,234,.12)'; c.beginPath(); c.arc(cx, cy, R, a0, a1); c.stroke();
    c.strokeStyle = k.green; c.beginPath(); c.arc(cx, cy, R, a0, a0 + Math.PI * Math.max(0, Math.min(cur, 1.05))); c.stroke(); c.lineCap = 'butt';
    for (var i = 0; i <= 10; i++) { var a = a0 + Math.PI * i / 10; c.strokeStyle = 'rgba(244,241,234,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + Math.cos(a) * (R - 14), cy + Math.sin(a) * (R - 14)); c.lineTo(cx + Math.cos(a) * (R - 20), cy + Math.sin(a) * (R - 20)); c.stroke(); }
    var an = a0 + Math.PI * cur; c.strokeStyle = k.paper; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(an) * (R - 18), cy + Math.sin(an) * (R - 18)); c.stroke(); c.fillStyle = k.paper; c.beginPath(); c.arc(cx, cy, 6, 0, TAU); c.fill();
    say(c, String(Math.round(cur * mx)), w * .82, h * .5, NFONT(h * .24, 900), k.paper);
    say(c, '0', cx - R, cy + 14, NFONT(10, 700), k.sub); say(c, String(Math.round(mx)), cx + R, cy + 14, NFONT(10, 700), k.sub);
  }
};

// KPI 비교 · 두 값을 나란히 세어 올리고 차이를 ▲▼ % 칩으로
KN['kpi-compare'] = {
  still: 2.2,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 3.6, p = t % L, u = eo(seg(p, .2, 1.1)), cw = w * .4, ch = h * .56, y = h * .14;
    [['지난달', V.last, w * .06], ['이번 달', V.this, w * .54]].forEach(function (q, i) {
      c.fillStyle = '#1F2533'; rbox(c, q[2], y, cw, ch, 10); c.fill();
      say(c, q[0], q[2] + cw / 2, y + 18, NFONT(10, 800), k.sub);
      say(c, comma(q[1] * u) + '만', q[2] + cw / 2, y + ch * .58, NFONT(h * .15, 900), i ? k.paper : 'rgba(244,241,234,.7)');
    });
    var d = (V.this - V.last) / V.last * 100, b = back(seg(p, 1.4, .35));
    if (b > 0) { var up = d >= 0, s = (up ? '▲ ' : '▼ ') + Math.abs(Math.round(d)) + '%', f = NFONT(12, 900), tw = c.measureText ? (c.font = f, c.measureText(s).width) : 60; c.save(); c.translate(w * .54 + cw / 2, y + ch + 18); c.scale(b, b); c.fillStyle = up ? k.green : k.pink; rbox(c, -tw / 2 - 10, -12, tw + 20, 24, 12); c.fill(); say(c, s, 0, 1, f, k.ink); c.restore(); }
  }
};

// 3·2·1 카운트다운 · 1초마다 큰 숫자가 튀어나오며 바뀌고 둘레 원이 1초에 걸쳐 준다
KN['countdown'] = {
  still: .6,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var n = Math.round(V.from), L = n + 1.4, p = t % L, cx = w / 2, cy = h / 2, R = h * .34;
    if (p < n) {
      var cur = n - Math.floor(p), f = p % 1, b = back(seg(f, 0, .25));
      c.strokeStyle = 'rgba(244,241,234,.12)'; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
      c.strokeStyle = k.pink; c.lineCap = 'round'; c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - f)); c.stroke(); c.lineCap = 'butt';
      c.save(); c.translate(cx, cy + 3); c.scale(b, b); say(c, String(cur), 0, 0, NFONT(h * .4, 900), k.paper); c.restore();
    } else { var g = back(seg(p, n, .3)); c.save(); c.translate(cx, cy); c.scale(g, g); say(c, '시작!', 0, 0, NFONT(h * .24, 900), k.green); c.restore(); }
  }
};

// 떨어지는 자리 · 자리마다 gap 초 간격으로 떨어져 바닥에서 납작해졌다 튄다
KN['digit-drop'] = {
  still: 2,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var s = String(Math.round(V.val)), n = s.length, L = .3 + n * V.gap + 1 + 1.4, p = t % L, font = NFONT(h * .36, 900), dw = h * .24, x0 = w / 2 - (n - 1) * dw / 2, gy = h * .68;
    c.fillStyle = 'rgba(244,241,234,.12)'; c.fillRect(w * .15, gy + 4, w * .7, 2);
    var out = p > L - .5 ? 1 - seg(p, L - .5, .4) : 1;
    for (var i = 0; i < n; i++) {
      var q = p - .3 - i * V.gap; if (q < 0) continue;
      var fall = Math.min(q / .35, 1), y = -h * .2 + (gy - h * .18 + h * .2) * fall * fall, sx = 1, sy = 1;
      if (q > .35) { var r = seg(q, .35, .45); var sq = Math.sin(r * Math.PI) * (1 - r); sx = 1 + .25 * Math.max(0, Math.cos(r * 6)) * (1 - r); sy = 2 - sx; y = gy - h * .18 - Math.abs(Math.sin(r * Math.PI * 2)) * 18 * (1 - r) + sq * 0; }
      c.save(); c.globalAlpha = out; c.translate(x0 + i * dw, y + h * .18); c.scale(sx, sy); say(c, s[i], 0, -h * .18, font, i % 2 ? k.pink : k.paper); c.restore();
    }
  }
};

// 합계 쌓기 · +step 블록이 하나씩 쌓일 때마다 합계가 step 씩 오른다
KN['total-stack'] = {
  still: 3,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var n = Math.round(V.count), stp = .45, L = .3 + n * stp + 1.4, p = t % L, bw = 54, bh = Math.min(22, (h * .72) / n - 4), bx = w * .3, base = h * .86, got = 0;
    for (var i = 0; i < n; i++) {
      var q = seg(p, .3 + i * stp, .3); if (q <= 0) continue;
      var y = base - (i + 1) * (bh + 4) - (1 - eo(q)) * 40; c.globalAlpha = cl(q * 2);
      c.fillStyle = i % 2 ? k.pink : '#F08AA3'; rbox(c, bx - bw / 2, y, bw, bh, 5); c.fill(); say(c, '+' + comma(V.step), bx, y + bh / 2, NFONT(Math.min(12, bh * .6), 900), k.ink); c.globalAlpha = 1;
      if (q >= 1) got += V.step;
    }
    say(c, 'TOTAL', w * .7, h * .3, NFONT(10, 800), k.sub);
    var land = got > 0 ? seg(p - .3 - (got / V.step - 1) * stp, .3, .2) : 1, bump = 1 + .08 * Math.sin(land * Math.PI);
    c.save(); c.translate(w * .7, h * .56); c.scale(bump, bump); say(c, comma(got), 0, 0, NFONT(h * .3, 900), k.paper); c.restore();
  }
};

if (typeof module !== 'undefined') module.exports = { KN };
