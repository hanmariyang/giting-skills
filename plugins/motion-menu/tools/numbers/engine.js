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

if (typeof module !== 'undefined') module.exports = { KN };
