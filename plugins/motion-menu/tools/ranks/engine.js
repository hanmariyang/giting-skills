// ⑳ 순위·비교·요점 — 보고서·발표 화면에서 숫자로 줄 세우고, 맞대고, 요약하는 장면. 전부 손잡이가 붙는다 (의존성 0)
// 손잡이 이름·범위·처음 값·문장 틀의 정본은 menu.json 의 knobs · askT. 여기는 그리기만 한다.
// tools/knobs/gen.mjs 가 이 파일도 읽어 demos/m24-rank-compare.html 을 만든다.
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
var MFONT = function (px, wt) { return (wt || 700) + ' ' + Math.round(px) + 'px "SF Mono",Menlo,monospace'; };
var say = function (c, s, x, y, font, col, al) { c.font = font; c.fillStyle = col; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
var sw = function (c, s, font) { c.font = font; return c.measureText(s).width; };
var rbox = function (c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); };
var comma = function (v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
var PANEL = '#1F2431', DIM = '#3A4152';
var chip = function (c, s, x, y, font, bg, fg, sc) { var tw = sw(c, s, font), hh = parseInt(font.split(' ')[1]) * 1.55, ww = tw + hh * .8; c.save(); c.translate(x, y); c.scale(sc, sc); c.fillStyle = bg; rbox(c, -ww / 2, -hh / 2, ww, hh, hh / 2); c.fill(); say(c, s, 0, 1, font, fg); c.restore(); return ww; };
/*@end*/

var KN = {};

// ── RANK ───────────────────────────────────────────

// 시상대 올리기 · 3위 → 2위 → 1위 순서로 기둥이 솟고, 다 서면 점수가 세어 올라간다
KN['podium-rise'] = {
  still: 2.6,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 4.4, p = t % L; c.globalAlpha = 1 - seg(p, 4, .35);
    var s = [V.first, V.second, V.third].sort(function (a, b) { return b - a; }), top = Math.max(1, s[0]);
    var base = h * .86, cw = Math.min(w * .25, h * .66), bw = cw * .84, maxH = h * .5;
    var slot = [{ r: 2, dx: -1, at: .55 }, { r: 1, dx: 0, at: .9 }, { r: 3, dx: 1, at: .2 }];
    slot.forEach(function (o) {
      var v = s[o.r - 1], full = maxH * (.32 + .68 * v / top), g = back(seg(p, o.at, .5)), bh = full * g, x = w / 2 + o.dx * cw - bw / 2;
      if (bh <= 0) return;
      c.fillStyle = o.r === 1 ? k.acc : DIM; rbox(c, x, base - bh, bw, bh, 6); c.fill();
      if (bh > h * .2) say(c, String(o.r), x + bw / 2, base - bh + h * .1, NFONT(h * .15, 900), o.r === 1 ? k.ink : k.paper);
      var n = eo(seg(p, 1.5, .7));
      if (n > 0) say(c, comma(v * n), x + bw / 2, base - full - h * .07, NFONT(h * .085, 800), o.r === 1 ? k.paper : k.sub);
    });
    c.fillStyle = k.sub; c.fillRect(w / 2 - cw * 1.55, base, cw * 3.1, 2);
    c.globalAlpha = 1;
  }
};

// 메달 순위 · 3위 줄부터 아래에서 올라오고, 1위 줄에 금색 테가 둘린다
KN['medal-rows'] = {
  still: 2.4,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 4.2, p = t % L; c.globalAlpha = 1 - seg(p, 3.8, .35);
    var s = [V.gold, V.silver, V.bronze].sort(function (a, b) { return b - a; });
    var MED = ['#E8B64A', '#B9C0CC', '#C9814F'], NAME = ['민지', '서준', '하린'];
    var rh = h * .24, gap = h * .05, y0 = (h - rh * 3 - gap * 2) / 2, x0 = w * .08, rw = w * .84;
    for (var i = 0; i < 3; i++) {
      var at = .2 + (2 - i) * .25, u = eo(seg(p, at, .45)); if (u <= 0) continue;
      var y = y0 + i * (rh + gap) + (1 - u) * h * .2;
      c.save(); c.globalAlpha *= u;
      c.fillStyle = PANEL; rbox(c, x0, y, rw, rh, rh * .3); c.fill();
      if (i === 0) { var o = seg(p, 1.3, .3); if (o > 0) { c.strokeStyle = 'rgba(232,182,74,' + o + ')'; c.lineWidth = 2; rbox(c, x0 + 1, y + 1, rw - 2, rh - 2, rh * .3); c.stroke(); } }
      var mr = rh * .32, mx = x0 + rh * .6, my = y + rh / 2;
      c.fillStyle = MED[i]; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill();
      say(c, String(i + 1), mx, my + 1, NFONT(rh * .38, 900), k.ink);
      say(c, NAME[i], mx + mr + rh * .35, my + 1, NFONT(rh * .34, 700), k.paper, 'left');
      say(c, comma(s[i] * eo(seg(p, at + .2, .6))), x0 + rw - rh * .4, my + 1, NFONT(rh * .4, 800), i === 0 ? '#E8B64A' : k.paper, 'right');
      c.restore();
    }
    c.globalAlpha = 1;
  }
};

// 스코어보드 · 고정폭 숫자로 줄이 하나씩 찍히고, 맨 윗줄에 띠가 쓸고 지나가 선다
KN['scoreboard'] = {
  still: 2.6,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 4.4, p = t % L; c.globalAlpha = 1 - seg(p, 4, .35);
    var n = Math.round(V.rows), R = [1, .88, .64, .5, .4, .33], NM = ['HANA', 'JUNO', 'MINA', 'DAON', 'SORA', 'YUNA'];
    var px = w * .07, pw = w * .86, py = h * .07, ph = h * .86;
    c.fillStyle = PANEL; rbox(c, px, py, pw, ph, 10); c.fill();
    var rh = ph / (n + 1.2), fs = Math.min(rh * .5, h * .1);
    var cx1 = px + pw * .1, cx2 = px + pw * .28, cx3 = px + pw * .92, hy = py + rh * .6;
    say(c, 'RANK', cx1, hy, MFONT(fs * .62), k.sub, 'center'); say(c, 'PLAYER', cx2, hy, MFONT(fs * .62), k.sub, 'left'); say(c, 'PTS', cx3, hy, MFONT(fs * .62), k.sub, 'right');
    for (var i = 0; i < n; i++) {
      var at = .2 + i * .14, u = seg(p, at, .2); if (u <= 0) continue;
      var y = py + rh * (1.2 + i) + rh / 2;
      if (i === 0) { var sweep = io(seg(p, 1.4, .5)); if (sweep > 0) { c.fillStyle = 'rgba(122,90,240,.38)'; rbox(c, px + pw * .03, y - rh * .42, pw * .94 * sweep, rh * .84, 6); c.fill(); } }
      c.globalAlpha = (1 - seg(p, 4, .35)) * u;
      var col = i === 0 && p > 1.4 ? k.paper : i < 3 ? k.paper : k.sub;
      say(c, (i < 9 ? '0' : '') + (i + 1), cx1, y, MFONT(fs), col, 'center');
      say(c, NM[i], cx2, y, MFONT(fs), col, 'left');
      say(c, comma(V.top * R[i] * eo(seg(p, at, .8))), cx3, y, MFONT(fs, 800), i === 0 ? '#B7A6FF' : col, 'right');
      c.globalAlpha = 1 - seg(p, 4, .35);
    }
    c.globalAlpha = 1;
  }
};

// 1위 도장 · 큰 「N위」가 커졌다 줄어들며 찍히고, 닿는 순간 둘레로 빛줄기가 터진다
KN['rank-stamp'] = {
  still: 1.6,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 3.4, p = t % L; c.globalAlpha = 1 - seg(p, 3, .35);
    var u = seg(p, .2, .35), cx = w / 2, cy = h * .56, n = Math.round(V.rank), rays = Math.round(V.rays);
    if (u > 0) {
      var sc = 1 + 1.3 * (1 - eo(u)), nf = NFONT(h * .5, 900), ns = String(n), nw = sw(c, ns, nf), uf = NFONT(h * .16, 800), uw = sw(c, '위', uf);
      var hit = seg(p, .55, .55);
      if (hit > 0 && hit < 1) {
        c.strokeStyle = k.acc; c.lineWidth = 3; c.lineCap = 'round';
        for (var i = 0; i < rays; i++) {
          var a = i * TAU / rays - Math.PI / 2, r1 = h * (.3 + .12 * eo(hit)), r2 = r1 + h * .1 * (1 - hit);
          c.globalAlpha = (1 - hit) * (1 - seg(p, 3, .35));
          c.beginPath(); c.moveTo(cx + Math.cos(a) * r1 * 1.25, cy + Math.sin(a) * r1); c.lineTo(cx + Math.cos(a) * r2 * 1.25, cy + Math.sin(a) * r2); c.stroke();
        }
        c.globalAlpha = 1 - seg(p, 3, .35);
      }
      c.save(); c.globalAlpha *= cl(u * 3); c.translate(cx, cy); c.scale(sc, sc);
      var tw = nw + uw + 4;
      say(c, ns, -tw / 2 + nw / 2, 0, nf, k.acc); say(c, '위', tw / 2 - uw / 2, h * .1, uf, k.paper);
      c.restore();
      var cp = back(seg(p, .75, .35));
      if (cp > 0) chip(c, 'No.' + n, cx, h * .17, NFONT(h * .075, 800), k.acc, k.ink, cp);
    }
    c.globalAlpha = 1;
  }
};

// ── VS ─────────────────────────────────────────────

// A 대 B · 두 숫자를 같이 세어 올리고, 다 서면 큰 쪽에 막대가 차고 작은 쪽은 흐려진다
KN['versus-split'] = {
  still: 2.4,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 4, p = t % L; c.globalAlpha = 1 - seg(p, 3.6, .35);
    var a = V.a, b = V.b, n = eo(seg(p, .3, .9)), won = seg(p, 1.3, .35), top = Math.max(a, b, 1);
    var lx = w * .27, rx = w * .73, ny = h * .5, nf = NFONT(Math.min(h * .24, w * .1), 900);
    [[lx, a, 'A안', a >= b], [rx, b, 'B안', b >= a]].forEach(function (o) {
      var win = o[3] && a !== b;
      say(c, o[2], o[0], h * .2, NFONT(h * .085, 700), win && won > 0 ? '#B7A6FF' : k.sub);
      var col = won > 0 && !win && a !== b ? 'rgba(244,241,234,' + (1 - .55 * won) + ')' : k.paper;
      say(c, comma(o[1] * n), o[0], ny, nf, col);
      var bw = w * .3, by = h * .74;
      c.fillStyle = DIM; rbox(c, o[0] - bw / 2, by, bw, 5, 3); c.fill();
      var f = eo(seg(p, 1.3, .6)) * o[1] / top;
      if (f > 0) { c.fillStyle = win ? k.purple : k.sub; rbox(c, o[0] - bw / 2, by, bw * f, 5, 3); c.fill(); }
    });
    c.strokeStyle = DIM; c.lineWidth = 1; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(w / 2, h * .12); c.lineTo(w / 2, h * .88); c.stroke(); c.setLineDash([]);
    var vs = back(seg(p, .1, .35));
    if (vs > 0) { c.save(); c.translate(w / 2, ny); c.scale(vs, vs); c.fillStyle = k.acc; c.beginPath(); c.arc(0, 0, h * .1, 0, TAU); c.fill(); say(c, 'VS', 0, 1, NFONT(h * .08, 900), k.ink); c.restore(); }
    c.globalAlpha = 1;
  }
};

// 작업 시간 줄이기 · 위 막대는 원래 시간으로 깔리고, 아래 막대가 같은 길이에서 줄어든 시간까지 쪼그라든다
KN['time-shrink'] = {
  still: 2.6,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 4.2, p = t % L; c.globalAlpha = 1 - seg(p, 3.8, .35);
    var fmt = function (m) { m = Math.round(m); var hh = Math.floor(m / 60), mm = m % 60; return hh ? hh + '시간' + (mm ? ' ' + mm + '분' : '') : mm + '분'; };
    var before = Math.max(1, V.before), after = Math.min(V.after, before), x0 = w * .08, full = w * .84, bh = h * .14, lf = NFONT(h * .08, 700), tf = NFONT(h * .085, 800);
    var y1 = h * .3, y2 = h * .7;
    say(c, '손으로', x0, y1 - bh * .95, lf, k.sub, 'left'); say(c, '자동으로', x0, y2 - bh * .95, lf, k.sub, 'left');
    var g1 = eo(seg(p, .2, .5));
    c.fillStyle = DIM; rbox(c, x0, y1 - bh / 2, full * g1, bh, bh / 2); c.fill();
    if (g1 > .9) say(c, fmt(before), x0 + full - bh * .5, y1 + 1, tf, k.paper, 'right');
    var g2 = eo(seg(p, .5, .4)), sh = io(seg(p, 1, .8)), len = full * g2 * (1 - sh * (1 - after / before));
    if (len > 0) {
      c.fillStyle = k.green; rbox(c, x0, y2 - bh / 2, Math.max(bh, len), bh, bh / 2); c.fill();
      var cur = before - (before - after) * sh, ts = fmt(cur), tw = sw(c, ts, tf);
      if (len > tw + bh) say(c, ts, x0 + len - bh * .5, y2 + 1, tf, k.ink, 'right');
      else say(c, ts, x0 + Math.max(bh, len) + 8, y2 + 1, tf, k.paper, 'left');
    }
    var cp = back(seg(p, 1.9, .35));
    if (cp > 0) { var pct = Math.round((1 - after / before) * 100), cs = '-' + pct + '%', cf = NFONT(h * .08, 900), cw = sw(c, cs, cf) + h * .1; chip(c, cs, x0 + full - cw / 2, y2 - bh * .95, cf, k.green, k.ink, cp); }
    c.globalAlpha = 1;
  }
};

// 전후 밀어 보기 · 전 값 위로 세로 선이 왼쪽에서 오른쪽으로 쓸고 지나가며 후 값을 드러낸다
KN['before-after-wipe'] = {
  still: 2.6,
  F: function (c, w, h, t, V, k) {
    var L = 4.4, p = t % L, fade = 1 - seg(p, 4, .35);
    var x = w * io(seg(p, .8, 1.1)), better = V.after < V.before;
    var draw = function (tag, v, bg, tagc, numc) {
      bgc(c, w, h, bg);
      say(c, '이탈률', w / 2, h * .17, NFONT(h * .08, 700), k.sub);
      say(c, tag, w / 2, h * .32, MFONT(h * .075, 800), tagc);
      var nf = NFONT(h * .34, 900), ns = String(Math.round(v)), nw = sw(c, ns, nf), pf = NFONT(h * .15, 800), pw = sw(c, '%', pf), tw = nw + pw + 4;
      say(c, ns, w / 2 - tw / 2 + nw / 2, h * .62, nf, numc); say(c, '%', w / 2 + tw / 2 - pw / 2, h * .67, pf, numc);
    };
    c.globalAlpha = fade;
    draw('BEFORE', V.before, k.ink, k.sub, '#8b93a1');
    if (x > 0) { c.save(); c.beginPath(); c.rect(0, 0, x, h); c.clip(); draw('AFTER', V.after, '#18202B', better ? k.green : k.pink, k.paper); c.restore(); }
    if (x > 0 && x < w) { c.fillStyle = k.paper; c.fillRect(x - 1, 0, 2, h); c.beginPath(); c.arc(x, h * .5, h * .06, 0, TAU); c.fill(); say(c, '‹›', x, h * .5, NFONT(h * .07, 800), k.ink); }
    var cp = back(seg(p, 2.1, .35));
    if (cp > 0) { var d = Math.round(V.after - V.before), cs = (d > 0 ? '+' : d < 0 ? '−' : '±') + Math.abs(d) + '%p'; chip(c, cs, w * .82, h * .32, NFONT(h * .075, 900), better ? k.green : k.pink, k.ink, cp); }
    c.globalAlpha = 1;
  }
};

// 차이만 짚기 · 두 막대가 자란 뒤 겹치는 몫은 흐려지고, 튀어나온 만큼에만 괄호와 「+차이」가 붙는다
KN['gap-callout'] = {
  still: 2.6,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 4.2, p = t % L; c.globalAlpha = 1 - seg(p, 3.8, .35);
    var a = V.a, b = V.b, top = Math.max(a, b, 1), x0 = w * .17, full = w * .62, bh = h * .15, lf = NFONT(h * .08, 700), nf = NFONT(h * .085, 800);
    var rows = [[h * .4, a, 'A안'], [h * .68, b, 'B안']], dim = seg(p, 1.3, .4), lo = Math.min(a, b), hiRow = b >= a ? 1 : 0;
    rows.forEach(function (o, i) {
      var g = eo(seg(p, .2 + i * .2, .6)), len = full * o[1] / top * g;
      say(c, o[2], w * .07, o[0], lf, k.sub, 'left');
      c.fillStyle = DIM; rbox(c, x0, o[0] - bh / 2, full, bh, 5); c.fill();
      if (len <= 0) return;
      var shared = full * lo / top * g;
      c.fillStyle = 'rgba(183,166,255,' + (1 - .6 * dim) + ')'; rbox(c, x0, o[0] - bh / 2, Math.min(len, shared), bh, 5); c.fill();
      if (i === hiRow && len > shared) { c.fillStyle = dim > 0 ? k.acc : 'rgba(183,166,255,1)'; rbox(c, x0 + shared - 4, o[0] - bh / 2, len - shared + 4, bh, 5); c.fill(); }
      say(c, comma(o[1] * g), x0 + 8, o[0] + 1, nf, k.ink, 'left');
    });
    var br = eo(seg(p, 1.6, .4));
    if (br > 0 && a !== b) {
      var xa = x0 + full * lo / top, xb = x0 + full * Math.max(a, b) / top, by = rows[hiRow][0] - bh / 2 - h * .045;
      c.strokeStyle = k.acc; c.lineWidth = 2; c.globalAlpha *= br;
      c.beginPath(); c.moveTo(xa, by + h * .025); c.lineTo(xa, by); c.lineTo(xb, by); c.lineTo(xb, by + h * .025); c.stroke();
      c.globalAlpha = 1 - seg(p, 3.8, .35);
      var d = Math.round(b - a), cs = (d > 0 ? '+' : '−') + comma(Math.abs(d));
      chip(c, cs, (x0 + full + w) / 2, rows[hiRow][0], NFONT(h * .08, 900), k.acc, k.ink, back(seg(p, 1.8, .35)));
    }
    c.globalAlpha = 1;
  }
};

// ── STEP ───────────────────────────────────────────

// 단계 점 잇기 · 점을 가로로 놓고, 선이 1번부터 지금 단계까지 차례로 이어지며 점을 채운다
KN['step-dots'] = {
  still: 2.6,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var n = Math.round(V.steps), now = Math.min(Math.round(V.now), n), L = 1 + now * .5 + 1.8, p = t % L; c.globalAlpha = 1 - seg(p, L - .4, .35);
    var NM = ['듣기', '제안', '만들기', '검수', '공개', '정리'], x0 = w * .13, x1 = w * .87, gap = (x1 - x0) / (n - 1), y = h * .42, r = Math.min(h * .12, gap * .26);
    c.strokeStyle = DIM; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
    for (var i = 0; i < now - 1; i++) { var g = io(seg(p, .5 + i * .5, .45)); if (g > 0) { c.strokeStyle = k.purple; c.beginPath(); c.moveTo(x0 + gap * i, y); c.lineTo(x0 + gap * (i + g), y); c.stroke(); } }
    var lf = Math.min(h * .08, gap * .24);
    for (var j = 0; j < n; j++) {
      var x = x0 + gap * j, on = j < now && p > .3 + j * .5, s = on ? back(seg(p, .3 + j * .5, .3)) : 1;
      c.save(); c.translate(x, y); c.scale(s, s);
      c.fillStyle = on ? k.purple : k.ink; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
      if (!on) { c.strokeStyle = DIM; c.lineWidth = 2; c.stroke(); }
      say(c, String(j + 1), 0, 1, NFONT(r * .9, 900), on ? k.paper : k.sub);
      c.restore();
      if (j === now - 1 && on) { var pu = (p % 1.2) / 1.2; c.strokeStyle = 'rgba(122,90,240,' + (1 - pu) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r + 4 + pu * r * .8, 0, TAU); c.stroke(); }
      say(c, 'STEP ' + (j + 1), x, y + r + h * .1, MFONT(lf * .75), on ? '#B7A6FF' : k.sub);
      say(c, NM[j], x, y + r + h * .22, NFONT(lf, 700), on ? k.paper : k.sub);
    }
    c.globalAlpha = 1;
  }
};

// 체크리스트 세기 · 줄마다 체크가 그어질 때 머리의 「n / 전체」가 하나씩 오른다
KN['check-count'] = {
  still: 2.8,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var n = Math.round(V.total), d = Math.min(Math.round(V.done), n), L = .5 + d * .38 + 1.8, p = t % L; c.globalAlpha = 1 - seg(p, L - .4, .35);
    var IT = ['목표 정하기', '자료 모으기', '결과 비교', '보고서 공유', '회고 남기기', '다음 할 일'];
    var px = w * .08, pw = w * .84, rh = h * .84 / (n + 1), fs = Math.min(rh * .42, h * .085), y0 = h * .08;
    var cnt = 0; for (var q = 0; q < d; q++) if (p > .5 + q * .38 + .2) cnt++;
    say(c, 'CHECK', px, y0 + rh / 2, MFONT(fs * .8, 800), k.sub, 'left');
    var bump = 1 + .15 * Math.sin(Math.PI * cl(((p - .5) % .38) / .2)) * (cnt > 0 && cnt < d + 1 && p < .5 + d * .38 + .2 ? 1 : 0);
    c.save(); c.translate(px + pw, y0 + rh / 2); c.scale(bump, bump); say(c, cnt + ' / ' + n, 0, 0, MFONT(fs, 800), cnt === n ? k.green : '#B7A6FF', 'right'); c.restore();
    for (var i = 0; i < n; i++) {
      var y = y0 + rh * (i + 1), u = eo(seg(p, .1 + i * .06, .3)); if (u <= 0) continue;
      c.fillStyle = PANEL; rbox(c, px, y + rh * .1, pw, rh * .8, 6); c.fill();
      var ck = i < d ? seg(p, .5 + i * .38, .3) : 0, done = ck > 0;
      say(c, String(i + 1).padStart(2, '0'), px + rh * .45, y + rh / 2, MFONT(fs * .8), k.sub);
      say(c, IT[i], px + rh * 1.05, y + rh / 2, NFONT(fs, 700), done ? k.paper : k.sub, 'left');
      var bs = rh * .46, bx = px + pw - rh * .35 - bs, by = y + rh / 2 - bs / 2;
      c.fillStyle = done ? k.green : k.ink; rbox(c, bx, by, bs, bs, 4); c.fill();
      if (!done) { c.strokeStyle = DIM; c.lineWidth = 1.5; c.stroke(); }
      if (done) {
        c.strokeStyle = k.ink; c.lineWidth = 2.5; c.lineCap = 'round'; c.lineJoin = 'round';
        var P = [[.22, .52], [.42, .72], [.78, .3]], e = eo(ck) * 2;
        c.beginPath(); c.moveTo(bx + bs * P[0][0], by + bs * P[0][1]);
        var m1 = Math.min(1, e); c.lineTo(bx + bs * (P[0][0] + (P[1][0] - P[0][0]) * m1), by + bs * (P[0][1] + (P[1][1] - P[0][1]) * m1));
        if (e > 1) { var m2 = e - 1; c.lineTo(bx + bs * (P[1][0] + (P[2][0] - P[1][0]) * m2), by + bs * (P[1][1] + (P[2][1] - P[1][1]) * m2)); }
        c.stroke();
      }
    }
    c.globalAlpha = 1;
  }
};

// 공정 흐름 · 이름 붙은 상자가 화살표로 이어지고, 불이 1번 상자부터 지금 공정까지 옮겨 간다
KN['flow-boxes'] = {
  still: 2.8,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var n = Math.round(V.boxes), now = Math.min(Math.round(V.now), n), L = 1 + now * .4 + 1.8, p = t % L; c.globalAlpha = 1 - seg(p, L - .4, .35);
    var NM = ['기획', '제작', '확인', '공개', '회고'], span = w * .86, bw = span / (n + .42 * (n - 1)), gap = bw * .42, bh = Math.min(bw, h * .4), y = h * .42, x0 = (w - span) / 2;
    for (var i = 0; i < n; i++) {
      var x = x0 + i * (bw + gap), u = back(seg(p, .1 + i * .12, .35)); if (u <= 0) continue;
      var lit = i < now && p > .9 + i * .4, cur = lit && i === now - 1;
      c.save(); c.translate(x + bw / 2, y); c.scale(u, u);
      c.fillStyle = lit ? (cur ? k.purple : '#4B3F87') : PANEL; rbox(c, -bw / 2, -bh / 2, bw, bh, bw * .16); c.fill();
      say(c, String(i + 1), 0, 2, NFONT(bh * .46, 900), lit ? k.paper : k.sub);
      c.restore();
      say(c, NM[i], x + bw / 2, y + bh / 2 + h * .12, NFONT(Math.min(h * .085, bw * .3), 700), lit ? k.paper : k.sub);
      if (cur) { var bl = .5 + .5 * Math.sin(p * 6); c.fillStyle = 'rgba(224,122,63,' + (.4 + .6 * bl) + ')'; c.beginPath(); c.arc(x + bw / 2, y - bh / 2 - h * .08, h * .035, 0, TAU); c.fill(); }
      if (i < n - 1) {
        var ax = x + bw + gap * .32, aw = gap * .36, alit = i < now - 1 && p > .9 + (i + 1) * .4;
        c.strokeStyle = alit ? k.paper : DIM; c.lineWidth = 2.5; c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(ax, y); c.lineTo(ax + aw, y); c.moveTo(ax + aw * .55, y - aw * .45); c.lineTo(ax + aw, y); c.lineTo(ax + aw * .55, y + aw * .45); c.stroke();
      }
    }
    c.globalAlpha = 1;
  }
};

// 대표 지표 카드 · 왼쪽 큰 카드에 대표 숫자가 세어 오르고, 오른쪽 보조 지표 셋이 차례로 밀려 들어온다
KN['hero-metric'] = {
  still: 2.8,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 4.6, p = t % L; c.globalAlpha = 1 - seg(p, 4.2, .35);
    var cx = w * .05, cy = h * .1, cw = w * .42, ch = h * .8, u = eo(seg(p, .1, .5));
    c.save(); c.globalAlpha *= u; c.translate(0, (1 - u) * h * .1);
    c.fillStyle = k.purple; rbox(c, cx, cy, cw, ch, 12); c.fill();
    say(c, '매출', cx + cw * .12, cy + ch * .18, NFONT(h * .075, 700), 'rgba(244,241,234,.75)', 'left');
    var v = V.main * eo(seg(p, .4, 1)), vs = v.toFixed(1), nf = NFONT(Math.min(h * .26, cw * .3), 900), uf = NFONT(h * .1, 800), nw = sw(c, vs, nf);
    say(c, vs, cx + cw * .12, cy + ch * .5, nf, k.paper, 'left'); say(c, '억', cx + cw * .12 + nw + 4, cy + ch * .55, uf, k.paper, 'left');
    var up = V.up, cp = back(seg(p, 1.4, .35));
    if (cp > 0) { var cs = (up >= 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(up)) + '%', cf = NFONT(h * .07, 800), cwid = sw(c, cs, cf) + h * .11; chip(c, cs, cx + cw * .12 + cwid / 2, cy + ch * .8, cf, 'rgba(20,24,33,.35)', up >= 0 ? '#7CF0BC' : '#FF9AAE', cp); }
    c.restore();
    var SIDE = [['영업이익', '6.2억', '+8%', 1], ['신규 고객', '1,280명', '+22%', 1], ['해지율', '1.8%', '−0.4%p', 1]];
    var rx = w * .53, rw = w * .42, rh = ch / 3;
    SIDE.forEach(function (o, i) {
      var s = eo(seg(p, .7 + i * .2, .45)); if (s <= 0) return;
      var y = cy + rh * i;
      c.save(); c.globalAlpha *= s; c.translate((1 - s) * w * .08, 0);
      say(c, o[0], rx, y + rh * .3, NFONT(h * .065, 700), k.sub, 'left');
      say(c, o[1], rx, y + rh * .66, NFONT(Math.min(h * .11, rw * .17), 800), k.paper, 'left');
      say(c, o[2], rx + rw, y + rh * .66, NFONT(h * .065, 800), k.green, 'right');
      if (i < 2) { c.fillStyle = DIM; c.fillRect(rx, y + rh - 1, rw, 1); }
      c.restore();
    });
    c.globalAlpha = 1;
  }
};

// ── SHOW ───────────────────────────────────────────

// 스톱워치 · 바늘이 돌며 분:초.백분의 일초가 달리다가 목표 시간에서 딱 멈추고 한 번 깜빡인다
KN['stopwatch'] = {
  still: 3,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var run = 2.2, L = .3 + run + 1.6, p = t % L; c.globalAlpha = 1 - seg(p, L - .4, .35);
    var tg = Math.max(.01, V.sec), r = seg(p, .3, run), cur = tg * r, dx = w * .24, dy = h * .52, R = Math.min(h * .3, w * .16);
    c.strokeStyle = DIM; c.lineWidth = 4; c.beginPath(); c.arc(dx, dy, R, 0, TAU); c.stroke();
    var frac = (cur % 60) / 60, ang = -Math.PI / 2 + frac * TAU;
    if (cur > 0) { c.strokeStyle = k.acc2; c.beginPath(); c.arc(dx, dy, R, -Math.PI / 2, -Math.PI / 2 + (cur >= 60 && frac === 0 ? TAU : frac * TAU)); c.stroke(); }
    c.strokeStyle = k.paper; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx + Math.cos(ang) * R * .72, dy + Math.sin(ang) * R * .72); c.stroke();
    c.fillStyle = k.paper; c.beginPath(); c.arc(dx, dy, 3.5, 0, TAU); c.fill();
    c.fillStyle = k.sub; c.fillRect(dx - 5, dy - R - 12, 10, 5);
    var mm = Math.floor(cur / 60), ss = Math.floor(cur % 60), cs = Math.floor((cur * 100) % 100);
    var str = String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0') + '.' + String(cs).padStart(2, '0');
    var stop = seg(p, .3 + run, .5), flash = stop > 0 && stop < 1 ? Math.sin(stop * Math.PI) : 0;
    var tx = w * .47;
    say(c, '경과 시간', tx, h * .32, NFONT(h * .075, 700), k.sub, 'left');
    say(c, str, tx, h * .55, MFONT(Math.min(h * .2, w * .085), 800), flash > .3 ? k.acc : k.paper, 'left');
    c.globalAlpha = 1;
  }
};

// 연속 일수 · 달력 날짜가 넘어가는 동안 연속 기록이 세어 오르고, 이번 주 일곱 칸이 차례로 찬다
KN['streak-days'] = {
  still: 2.8,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 4.4, p = t % L; c.globalAlpha = 1 - seg(p, 4, .35);
    var days = Math.round(V.days), n = eo(seg(p, .3, 1.4)), cur = Math.max(1, Math.round(days * n));
    var cs = Math.min(h * .66, w * .3), cx = w * .07, cy = (h - cs) / 2, hb = cs * .24;
    c.fillStyle = PANEL; rbox(c, cx, cy, cs, cs, 10); c.fill();
    c.fillStyle = k.purple; rbox(c, cx, cy, cs, hb, 10); c.fill(); c.fillRect(cx, cy + hb * .5, cs, hb * .5);
    say(c, Math.round(V.month) + '월', cx + cs / 2, cy + hb / 2 + 1, NFONT(hb * .5, 800), k.paper);
    var date = ((cur - 1) % 30) + 1;
    say(c, String(date), cx + cs / 2, cy + hb + (cs - hb) / 2 + 2, NFONT((cs - hb) * .5, 900), k.paper);
    var tx = cx + cs + w * .07;
    say(c, '연속 기록', tx, h * .25, NFONT(h * .075, 700), k.sub, 'left');
    var nf = NFONT(Math.min(h * .3, w * .14), 900), ns = String(cur), nw = sw(c, ns, nf);
    say(c, ns, tx, h * .52, nf, k.paper, 'left'); say(c, '일', tx + nw + 4, h * .57, NFONT(h * .1, 800), k.paper, 'left');
    var bs = Math.min(h * .07, (w - tx - w * .06) / 7 * .7), bg = bs * .4;
    for (var i = 0; i < 7; i++) { var on = seg(p, 1.7 + i * .1, .15); c.fillStyle = on > 0 ? 'rgba(56,190,134,' + (.3 + .7 * on) + ')' : DIM; rbox(c, tx + i * (bs + bg), h * .76, bs, bs, 3); c.fill(); }
    c.globalAlpha = 1;
  }
};

// 팔로워 카드 · 프로필 옆 숫자가 시작 값에서 세어 오르는 동안 아래 선이 그려지고, 끝에 늘어난 수가 붙는다
KN['follower-card'] = {
  still: 2.6,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 4.2, p = t % L; c.globalAlpha = 1 - seg(p, 3.8, .35);
    var px = w * .07, py = h * .1, pw = w * .86, ph = h * .8;
    c.fillStyle = PANEL; rbox(c, px, py, pw, ph, 12); c.fill();
    var ar = Math.min(h * .13, w * .07), ax = px + pw * .12, ay = py + ph * .34;
    var gr = c.createLinearGradient(ax - ar, ay - ar, ax + ar, ay + ar); gr.addColorStop(0, k.purple); gr.addColorStop(1, k.acc);
    c.fillStyle = gr; c.beginPath(); c.arc(ax, ay, ar, 0, TAU); c.fill();
    c.fillStyle = k.paper; c.beginPath(); c.arc(ax, ay - ar * .2, ar * .28, 0, TAU); c.fill(); c.beginPath(); c.arc(ax, ay + ar * .62, ar * .5, Math.PI, TAU); c.fill();
    var tx = ax + ar + w * .05, n = eo(seg(p, .3, 1.3)), v = V.from + (V.to - V.from) * n;
    say(c, '팔로워', tx, ay - h * .1, NFONT(h * .065, 700), k.sub, 'left');
    var nf = NFONT(Math.min(h * .17, w * .08), 900);
    say(c, comma(v), tx, ay + h * .04, nf, k.paper, 'left');
    var d = Math.round(V.to - V.from), cp = back(seg(p, 1.7, .35));
    if (cp > 0) { var cs = (d >= 0 ? '+' : '−') + comma(Math.abs(d)), cf = NFONT(h * .07, 900), cwid = sw(c, cs, cf) + h * .11; chip(c, cs, px + pw - pw * .06 - cwid / 2, ay - h * .02, cf, d >= 0 ? k.green : k.pink, k.ink, cp); }
    var gx = px + pw * .06, gw = pw * .88, gy = py + ph * .82, gh = ph * .28, PTS = [.1, .18, .12, .3, .26, .42, .5, .46, .7, .9];
    if (d < 0) PTS = PTS.map(function (q) { return 1 - q; });
    c.strokeStyle = DIM; c.lineWidth = 1; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + gw, gy); c.stroke();
    var dr = n * (PTS.length - 1); c.strokeStyle = k.acc2; c.lineWidth = 2.5; c.lineJoin = 'round'; c.beginPath();
    for (var i = 0; i <= Math.floor(dr) && i < PTS.length; i++) { var X = gx + gw * i / (PTS.length - 1), Y = gy - gh * PTS[i]; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }
    var f = dr - Math.floor(dr), j = Math.floor(dr); if (j < PTS.length - 1 && dr > 0) c.lineTo(gx + gw * (j + f) / (PTS.length - 1), gy - gh * (PTS[j] + (PTS[j + 1] - PTS[j]) * f));
    c.stroke();
    c.globalAlpha = 1;
  }
};

// 표 안 값 짚기 · 표가 줄마다 깔린 뒤 둥근 틀이 미끄러져 한 칸에 서고, 나머지는 흐려진다
KN['cell-spot'] = {
  still: 2.8,
  F: function (c, w, h, t, V, k) {
    bgc(c, w, h, k.ink);
    var L = 4.4, p = t % L; c.globalAlpha = 1 - seg(p, 4, .35);
    var M = [[128, 142, 160, 151], [98, 104, 99, 121], [76, 82, 91, 88]], ROW = ['서울', '부산', '대구'], COL = ['1월', '2월', '3월', '4월'];
    var r = Math.min(Math.max(Math.round(V.row), 1), 3) - 1, q = Math.min(Math.max(Math.round(V.col), 1), 4) - 1;
    var x0 = w * .22, cw = w * .72 / 4, y0 = h * .26, rh = h * .22, fs = Math.min(rh * .5, cw * .32), dim = seg(p, 1.9, .4);
    COL.forEach(function (s, j) { say(c, s, x0 + cw * (j + .5), h * .14, NFONT(fs * .62, 700), k.sub); });
    for (var i = 0; i < 3; i++) {
      var u = eo(seg(p, .1 + i * .15, .35)); if (u <= 0) continue;
      var y = y0 + rh * (i + .5);
      c.save(); c.globalAlpha *= u;
      say(c, ROW[i], w * .06, y, NFONT(fs * .7, 700), k.sub, 'left');
      for (var j = 0; j < 4; j++) {
        var hit = i === r && j === q, a = hit ? 1 : 1 - .65 * dim, s = hit ? 1 + .14 * back(seg(p, 1.9, .35)) - .14 * (p > 1.9 ? 0 : 0) : 1;
        c.save(); c.globalAlpha *= a; c.translate(x0 + cw * (j + .5), y); c.scale(s, s); say(c, String(M[i][j]), 0, 1, NFONT(fs, 800), hit && dim > 0 ? k.paper : k.paper); c.restore();
      }
      c.restore();
    }
    var mv = io(seg(p, 1, .8)), fx = x0 + cw * (q * mv), fy = y0 + rh * (r * mv), fv = seg(p, .8, .2);
    if (fv > 0) { c.save(); c.globalAlpha *= fv; c.fillStyle = 'rgba(122,90,240,.22)'; c.strokeStyle = '#B7A6FF'; c.lineWidth = 2.5; rbox(c, fx + cw * .08, fy + rh * .1, cw * .84, rh * .8, 10); c.fill(); c.stroke(); c.restore(); }
    c.globalAlpha = 1;
  }
};

if (typeof module !== 'undefined') module.exports = { KN: KN };
