// 차트 메뉴판 48: 캔버스 그리기 함수 묶음 (의존성 0 · 정지 그림)
// 갤러리 데모(demos/charts.html)와 홍보 카드(render.mjs)가 같은 함수를 쓴다.
// 정본은 이 파일 하나. 데모를 고치려면 여기를 고치고 `node tools/gen.mjs` → 루트 `node build.mjs`.
//
// CH[id](c, w, h, k)
//   c: 2D 컨텍스트 (0,0 ~ w,h 가 칸)   k: 색 역할 { surface, ink, ink2, muted, grid, base, s1, s2, s3, gray, ramp[], neg, pos, mid, good, warn }
// 규칙(dataviz): 막대 24px 이하 · 끝 4px 둥글게(바닥은 직각) · 선 2px · 점 r4 + 흰 테 2px · 격자 실선 1px · 글자는 잉크색 · 모든 점에 숫자 금지
// 예시 값은 전부 지어낸 것. 낱말 · 숫자 · 장면은 이 파일에서 만든다.

/*@helpers*/
var TAU = Math.PI * 2;
var SANS = '-apple-system,"Apple SD Gothic Neo",system-ui,sans-serif';
var F = function (px, wt) { return (wt || 500) + ' ' + Math.round(px) + 'px ' + SANS; };
var txt = function (c, s, x, y, px, col, al, wt, bl) { c.font = F(px, wt); c.fillStyle = col; c.textAlign = al || 'left'; c.textBaseline = bl || 'middle'; c.fillText(s, x, y); };
var tw = function (c, s, px, wt) { c.font = F(px, wt); return c.measureText(s).width; };
var fmt = function (v) { return v >= 10000 ? (v / 10000).toFixed(v % 10000 ? 1 : 0) + '만' : String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
var rr = function (c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); };
// 칸: 제목 줄 + 그림 영역. 돌려주는 것은 그림 영역 { x, y, w, h }
var frame = function (c, w, h, k, title, sub) {
  c.fillStyle = k.surface; c.fillRect(0, 0, w, h);
  var pad = h * .07, top = pad;
  if (title) { txt(c, title, pad, pad + h * .04, h * .075, k.ink, 'left', 700); top = pad + h * .11; }
  if (sub) { txt(c, sub, w - pad, pad + h * .04, h * .055, k.muted, 'right', 500); }
  return { x: h * .17, y: top, w: w - h * .17 - pad, h: h - top - pad * 1.3 };
};
// 세로 막대: 바닥 직각 · 위 4px 둥글게. 두께는 24px 이하
var vbar = function (c, x, yTop, w, yBase, col) { var bw = Math.min(w, 24), x0 = x + (w - bw) / 2, hh = yBase - yTop; if (hh <= 0) return; c.fillStyle = col; rr(c, x0, yTop, bw, hh, [4, 4, 0, 0]); c.fill(); };
var hbar = function (c, xBase, y, h, xEnd, col) { var bh = Math.min(h, 24), y0 = y + (h - bh) / 2, ww = xEnd - xBase; if (ww <= 0) return; c.fillStyle = col; rr(c, xBase, y0, ww, bh, [0, 4, 4, 0]); c.fill(); };
var dot = function (c, x, y, col, k, r) { r = r || 4; c.fillStyle = k.surface; c.beginPath(); c.arc(x, y, r + 2, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
var pline = function (c, pts, col, lw) { c.strokeStyle = col; c.lineWidth = lw || 2; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); for (var i = 0; i < pts.length; i++) { if (i) c.lineTo(pts[i][0], pts[i][1]); else c.moveTo(pts[i][0], pts[i][1]); } c.stroke(); };
var hline = function (c, x0, x1, y, col) { c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y + .5); c.lineTo(x1, y + .5); c.stroke(); };
var vline = function (c, x, y0, y1, col) { c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.moveTo(x + .5, y0); c.lineTo(x + .5, y1); c.stroke(); };
// 가로 격자 + 왼쪽 눈금 (ticks 는 값 배열). 돌려주는 것: 값→y 함수
var gridY = function (c, R, k, max, ticks, fs) {
  var y = function (v) { return R.y + R.h - v / max * R.h; };
  for (var i = 0; i < ticks.length; i++) { hline(c, R.x, R.x + R.w, y(ticks[i]), i === 0 ? k.base : k.grid); txt(c, fmt(ticks[i]), R.x - 4, y(ticks[i]), fs, k.muted, 'right'); }
  return y;
};
var legend = function (c, x, y, items, k, fs) { var cx = x; for (var i = 0; i < items.length; i++) { c.fillStyle = items[i][1]; rr(c, cx, y - fs * .35, fs * .7, fs * .7, 2); c.fill(); txt(c, items[i][0], cx + fs, y, fs, k.ink2); cx += fs + tw(c, items[i][0], fs) + fs * .9; } };
var alpha = function (hex, a) { return 'rgba(' + parseInt(hex.slice(1, 3), 16) + ',' + parseInt(hex.slice(3, 5), 16) + ',' + parseInt(hex.slice(5, 7), 16) + ',' + a + ')'; };
var hash = function (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
var ramp = function (k, t) { var r = k.ramp; return r[Math.max(0, Math.min(r.length - 1, Math.round(t * (r.length - 1))))]; };
var chip = function (c, s, x, y, fs, k) { var w = tw(c, s, fs, 600) + fs; c.fillStyle = k.grid; rr(c, x, y - fs * .7, w, fs * 1.4, fs * .7); c.fill(); txt(c, s, x + fs / 2, y, fs, k.ink2, 'left', 600); return w; };
/*@end*/

var CH = {};

// ═══ ① 어느 게 많나 ═══

// 막대: 범주별 값, 큰 순서. 끝 값만 표시
CH['bar'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '이번 달 많이 빌린 책', '권'), fs = h * .055, d = [['소설', 142], ['에세이', 96], ['과학', 71], ['역사', 58], ['만화', 44], ['요리', 23]];
  var y = gridY(c, R, k, 160, [0, 50, 100, 150], fs), bw = R.w / d.length;
  for (var i = 0; i < d.length; i++) { var x = R.x + i * bw; vbar(c, x + bw * .2, y(d[i][1]), bw * .6, y(0), i === 0 ? k.s1 : k.s1); txt(c, d[i][0], x + bw / 2, R.y + R.h + fs * .9, fs, k.ink2, 'center'); if (i === 0) txt(c, fmt(d[i][1]), x + bw / 2, y(d[i][1]) - fs * .7, fs, k.ink, 'center', 700); }
};

// 가로 막대: 이름이 길거나 항목이 많을 때. 큰 순서
CH['hbar'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '러닝 클럽 코스별 완주', '명'), fs = h * .055, d = [['한강 야간 10km', 184], ['남산 둘레길', 151], ['올림픽공원 5km', 120], ['탄천 하프', 64], ['북악 업힐', 38]];
  var lw = h * .5, x0 = R.x + lw, bh = R.h / d.length, max = 200;
  vline(c, x0, R.y, R.y + R.h, k.base);
  for (var i = 0; i < d.length; i++) { var y = R.y + i * bh; txt(c, d[i][0], x0 - 6, y + bh / 2, fs, k.ink2, 'right'); hbar(c, x0, y + bh * .2, bh * .6, x0 + d[i][1] / max * (R.w - lw), k.s1); if (i < 2) txt(c, fmt(d[i][1]), x0 + d[i][1] / max * (R.w - lw) + 5, y + bh / 2, fs, k.ink, 'left', 700); }
};

// 묶음 막대: 범주마다 계열 둘셋을 나란히. 범례 필수
CH['grouped-bar'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '지점별 아침 · 점심 손님'), fs = h * .055, cats = ['역삼', '성수', '망원', '판교'], a = [120, 88, 64, 140], b = [210, 160, 130, 95];
  legend(c, R.x, R.y - fs * .2, [['아침', k.s1], ['점심', k.s2]], k, fs); R.y += fs * 1.2; R.h -= fs * 1.2;
  var y = gridY(c, R, k, 240, [0, 80, 160, 240], fs), gw = R.w / cats.length;
  for (var i = 0; i < cats.length; i++) { var x = R.x + i * gw; vbar(c, x + gw * .14, y(a[i]), gw * .34, y(0), k.s1); vbar(c, x + gw * .52, y(b[i]), gw * .34, y(0), k.s2); txt(c, cats[i], x + gw / 2, R.y + R.h + fs * .9, fs, k.ink2, 'center'); }
};

// 롤리팝: 막대 대신 선 + 점. 항목이 많고 값이 비슷할 때
CH['lollipop'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '메뉴별 하루 판매', '잔'), fs = h * .055, d = [['아메리카노', 212], ['라떼', 168], ['콜드브루', 131], ['말차', 97], ['유자차', 72], ['코코아', 51], ['밀크티', 44]];
  var lw = h * .42, x0 = R.x + lw, bh = R.h / d.length, max = 240; vline(c, x0, R.y, R.y + R.h, k.base);
  for (var i = 0; i < d.length; i++) { var y = R.y + i * bh + bh / 2, xe = x0 + d[i][1] / max * (R.w - lw); txt(c, d[i][0], x0 - 6, y, fs, k.ink2, 'right'); pline(c, [[x0, y], [xe, y]], k.gray, 2); dot(c, xe, y, k.s1, k, 4); if (i === 0) txt(c, fmt(d[i][1]), xe + 9, y, fs, k.ink, 'left', 700); }
};

// 점 비교: 같은 줄에 두 시점 점. 간격이 곧 차이
CH['dotplot'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '동네 서점 평점', '5점 만점'), fs = h * .055, d = [['책방 모퉁이', 4.6], ['라이트북스', 4.3], ['종이달', 4.1], ['마이너', 3.9], ['골목책', 3.7], ['소소서점', 3.4]];
  var lw = h * .42, x0 = R.x + lw, bh = R.h / d.length, min = 3, max = 5, X = function (v) { return x0 + (v - min) / (max - min) * (R.w - lw); };
  for (var t = 3; t <= 5; t += .5) { vline(c, X(t), R.y, R.y + R.h, t === 3 ? k.base : k.grid); txt(c, String(t), X(t), R.y + R.h + fs * .9, fs, k.muted, 'center'); }
  for (var i = 0; i < d.length; i++) { var y = R.y + i * bh + bh / 2; txt(c, d[i][0], x0 - 6, y, fs, k.ink2, 'right'); dot(c, X(d[i][1]), y, k.s1, k, 4); }
  txt(c, '4.6', X(4.6) + 9, R.y + bh / 2, fs, k.ink, 'left', 700);
};

// 덤벨: 항목마다 전 · 후 두 점을 선으로 잇는다
CH['dumbbell'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '5km 기록, 봄과 가을', '분'), fs = h * .055, d = [['민수', 31, 27], ['지아', 28, 26], ['현우', 35, 29], ['서연', 30, 30], ['도윤', 26, 24]];
  legend(c, R.x, R.y - fs * .2, [['봄', k.gray], ['가을', k.s1]], k, fs); R.y += fs * 1.2; R.h -= fs * 1.2;
  var lw = h * .25, x0 = R.x + lw, bh = R.h / d.length, min = 22, max = 36, X = function (v) { return x0 + (v - min) / (max - min) * (R.w - lw); };
  for (var t = 24; t <= 36; t += 4) { vline(c, X(t), R.y, R.y + R.h, k.grid); txt(c, String(t), X(t), R.y + R.h + fs * .9, fs, k.muted, 'center'); }
  for (var i = 0; i < d.length; i++) { var y = R.y + i * bh + bh / 2; txt(c, d[i][0], x0 - 6, y, fs, k.ink2, 'right'); pline(c, [[X(d[i][1]), y], [X(d[i][2]), y]], k.grid, 3); dot(c, X(d[i][1]), y, k.gray, k, 4); dot(c, X(d[i][2]), y, k.s1, k, 4); }
};

// 불릿: 목표 대비 실적. 바탕 띠(범위) + 가는 막대(실적) + 선(목표)
CH['bullet'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '분기 목표 대비', '%'), fs = h * .055, d = [['신규 회원', 82, 100], ['재방문', 117, 100], ['후기', 64, 100], ['추천 가입', 96, 100]];
  var lw = h * .3, x0 = R.x + lw, bh = R.h / d.length, max = 130, X = function (v) { return x0 + v / max * (R.w - lw - h * .2); };
  for (var i = 0; i < d.length; i++) { var y = R.y + i * bh + bh / 2; txt(c, d[i][0], x0 - 6, y, fs, k.ink2, 'right');
    c.fillStyle = k.grid; rr(c, x0, y - bh * .28, X(max) - x0, bh * .56, 3); c.fill(); c.fillStyle = k.ramp[1]; rr(c, x0, y - bh * .28, X(100) - x0, bh * .56, 3); c.fill();
    hbar(c, x0, y - bh * .14, bh * .28, X(d[i][1]), k.s1); c.strokeStyle = k.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(X(d[i][2]), y - bh * .32); c.lineTo(X(d[i][2]), y + bh * .32); c.stroke();
    txt(c, d[i][1] + '%', X(max) + 5, y, fs, k.ink, 'left', d[i][1] >= 100 ? 700 : 500); }
};

// 순위 변화: 시점마다 순위를 선으로 잇는다. 한 항목만 강조
CH['bump'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '인기 메뉴 순위', '월'), fs = h * .055, names = ['라떼', '아메리카노', '말차', '콜드브루', '유자차'], ranks = [[2, 1, 1, 1], [1, 2, 3, 3], [4, 4, 2, 2], [3, 3, 4, 5], [5, 5, 5, 4]], months = ['3월', '4월', '5월', '6월'];
  var lw = h * .3, x0 = R.x + lw, cw = (R.w - lw - h * .2) / (months.length - 1), rh = R.h / 5, Y = function (r) { return R.y + (r - .5) * rh; };
  for (var m = 0; m < months.length; m++) txt(c, months[m], x0 + m * cw, R.y + R.h + fs * .9, fs, k.muted, 'center');
  for (var i = 0; i < names.length; i++) { var pts = [], hot = i === 2, col = hot ? k.s1 : k.gray; for (var m = 0; m < months.length; m++) pts.push([x0 + m * cw, Y(ranks[i][m])]);
    pline(c, pts, col, 2); for (m = 0; m < pts.length; m++) dot(c, pts[m][0], pts[m][1], col, k, 3.5); txt(c, names[i], x0 - 8, Y(ranks[i][0]), fs, hot ? k.ink : k.ink2, 'right', hot ? 700 : 500); txt(c, names[i], x0 + (months.length - 1) * cw + 8, Y(ranks[i][months.length - 1]), fs, hot ? k.ink : k.muted, 'left', hot ? 700 : 500); }
};

// ═══ ② 어떻게 변했나 ═══

// 선: 시간에 따른 값. 끝 값만 표시
CH['line'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '주간 방문자', '명'), fs = h * .055, d = [820, 910, 880, 1020, 1140, 1090, 1260, 1310, 1280, 1420, 1510, 1480];
  var y = gridY(c, R, k, 1600, [0, 400, 800, 1200, 1600], fs), pts = [], i; R.w -= h * .18;
  for (i = 0; i < d.length; i++) pts.push([R.x + i / (d.length - 1) * R.w, y(d[i])]);
  pline(c, pts, k.s1, 2); dot(c, pts[11][0], pts[11][1], k.s1, k, 4); txt(c, fmt(d[11]), pts[11][0] + 9, pts[11][1], fs, k.ink, 'left', 700);
  txt(c, '1주', R.x, R.y + R.h + fs * .9, fs, k.muted, 'left'); txt(c, '12주', R.x + R.w, R.y + R.h + fs * .9, fs, k.muted, 'center');
};

// 영역: 선 아래를 옅게 채운다. 계열 하나일 때
CH['area'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '하루 자전거 대여', '대'), fs = h * .055, d = [20, 35, 120, 240, 180, 150, 170, 210, 310, 280, 140, 60];
  var y = gridY(c, R, k, 320, [0, 100, 200, 300], fs), pts = [], i; for (i = 0; i < d.length; i++) pts.push([R.x + i / (d.length - 1) * R.w, y(d[i])]);
  c.fillStyle = alpha(k.s1, .12); c.beginPath(); c.moveTo(pts[0][0], y(0)); for (i = 0; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.lineTo(pts[pts.length - 1][0], y(0)); c.closePath(); c.fill();
  pline(c, pts, k.s1, 2); dot(c, pts[8][0], pts[8][1], k.s1, k, 4); txt(c, '18시 310', pts[8][0], pts[8][1] - fs * 1.1, fs, k.ink, 'center', 700);
  for (i = 0; i < 12; i += 4) txt(c, (6 + i * 1.5) + '시', pts[i][0], R.y + R.h + fs * .9, fs, k.muted, 'center');
};

// 작은 다중: 같은 축의 작은 선 차트를 여러 개. 계열이 넷을 넘을 때
CH['small-multiples'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '지점별 주간 매출', '만 원'), fs = h * .05, names = ['역삼', '성수', '망원', '판교', '해운대', '전주'], cols = 3, rows = 2, cw = R.w / cols, ch = R.h / rows, i, j;
  for (i = 0; i < names.length; i++) { var x = R.x + (i % cols) * cw, y0 = R.y + Math.floor(i / cols) * ch, pts = [], hot = i === 3; txt(c, names[i], x + 4, y0 + fs * .7, fs, hot ? k.ink : k.ink2, 'left', hot ? 700 : 500);
    hline(c, x + 4, x + cw - 8, y0 + ch - fs, k.grid); for (j = 0; j < 8; j++) pts.push([x + 4 + j / 7 * (cw - 12), y0 + ch - fs - (.3 + .5 * hash(i * 9 + j) + (hot ? j * .05 : 0)) * (ch - fs * 2.2)]); pline(c, pts, hot ? k.s1 : k.gray, 2); }
};

// 기울기: 두 시점을 선 하나로. 오른 것과 내린 것이 한눈에
CH['slope'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '전공별 지원자, 작년과 올해', '명'), fs = h * .055, d = [['디자인', 120, 165], ['개발', 210, 198], ['기획', 90, 140], ['영업', 150, 110]];
  var x0 = R.x + h * .35, x1 = R.x + R.w - h * .35, min = 80, max = 220, Y = function (v) { return R.y + R.h - (v - min) / (max - min) * R.h; };
  txt(c, '작년', x0, R.y - fs * .2, fs, k.muted, 'center'); txt(c, '올해', x1, R.y - fs * .2, fs, k.muted, 'center'); vline(c, x0, R.y, R.y + R.h, k.grid); vline(c, x1, R.y, R.y + R.h, k.grid);
  for (var i = 0; i < d.length; i++) { var up = d[i][2] >= d[i][1], col = up ? k.s1 : k.gray; pline(c, [[x0, Y(d[i][1])], [x1, Y(d[i][2])]], col, 2); dot(c, x0, Y(d[i][1]), col, k, 3.5); dot(c, x1, Y(d[i][2]), col, k, 3.5); txt(c, d[i][0] + ' ' + d[i][1], x0 - 8, Y(d[i][1]), fs, k.ink2, 'right'); txt(c, String(d[i][2]), x1 + 8, Y(d[i][2]), fs, up ? k.ink : k.ink2, 'left', up ? 700 : 500); }
};

// 스파크라인 표: 지표마다 작은 선 + 현재 값. 표 안에 흐름을 넣는다
CH['sparkline-table'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '지표 한눈에', '최근 8주'), fs = h * .055, rows = [['방문', '12.4만', 1], ['가입', '3,120', 1], ['이탈률', '2.1%', -1], ['후기', '845', 1]], rh = R.h / rows.length, i, j;
  for (i = 0; i < rows.length; i++) { var y = R.y + i * rh + rh / 2, pts = []; hline(c, R.x, R.x + R.w, R.y + (i + 1) * rh, k.grid); txt(c, rows[i][0], R.x, y, fs, k.ink2, 'left');
    for (j = 0; j < 8; j++) pts.push([R.x + R.w * .32 + j / 7 * R.w * .34, y + (hash(i * 7 + j) - .5) * rh * .5 - rows[i][2] * j * rh * .03]); pline(c, pts, k.gray, 2); dot(c, pts[7][0], pts[7][1], k.s1, k, 3);
    txt(c, rows[i][1], R.x + R.w, y, fs, k.ink, 'right', 700); }
};

// 호라이즌: 띠 하나에 값을 층으로 접어 넣는다. 줄이 많을 때
CH['horizon'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '서버별 요청 변화', '전주 대비 %'), fs = h * .05, names = ['API', '웹', '검색', '결제', '알림'], rh = R.h / names.length, i, j, n = 40;
  for (i = 0; i < names.length; i++) { var y0 = R.y + i * rh, y1 = y0 + rh - 2; txt(c, names[i], R.x, y0 + (rh - 2) / 2, fs, k.ink2, 'left'); var x0 = R.x + h * .22, W = R.w - h * .22;
    c.fillStyle = k.grid; c.fillRect(x0, y0, W, rh - 2);
    for (var band = 0; band < 3; band++) { c.fillStyle = band === 0 ? k.ramp[1] : band === 1 ? k.ramp[3] : k.ramp[5]; c.beginPath(); c.moveTo(x0, y1); for (j = 0; j <= n; j++) { var v = Math.max(0, Math.sin(j / 6 + i * 2) * .9 + hash(i * 50 + j) * .6 - band * .5); c.lineTo(x0 + j / n * W, y1 - Math.min(1, v) * (rh - 2)); } c.lineTo(x0 + W, y1); c.closePath(); c.fill(); } }
};

// 캘린더 격자: 날짜마다 칸, 값은 짙기로
CH['calendar'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '달리기 기록, 올해', '일 · km'), fs = h * .05, weeks = Math.floor((R.w - h * .14) / (h * .062)), cell = h * .058, gap = 2, x0 = R.x + h * .14, i, j;
  var days = ['월', '', '수', '', '금', '', '일']; for (i = 0; i < 7; i++) if (days[i]) txt(c, days[i], x0 - 6, R.y + i * (cell + gap) + cell / 2, fs, k.muted, 'right');
  for (i = 0; i < weeks; i++) for (j = 0; j < 7; j++) { var v = hash(i * 7 + j); var col = v < .35 ? k.grid : ramp(k, (v - .35) / .65 * .8 + .2); c.fillStyle = col; rr(c, x0 + i * (cell + gap), R.y + j * (cell + gap), cell, cell, 2); c.fill(); }
  legend(c, x0, R.y + 7 * (cell + gap) + fs * .9, [['안 뜀', k.grid], ['짧게', k.ramp[2]], ['길게', k.ramp[6]]], k, fs);
};

// 막대 레이스: 해마다 순위가 바뀌는 가로 막대. 한 장면(해 하나)을 보여 준다
CH['bar-race'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '동네 서점 연간 판매, 2022', '천 권'), fs = h * .055, d = [['종이달', 91], ['책방 모퉁이', 84], ['라이트북스', 77], ['골목책', 52], ['소소서점', 40]];
  var lw = h * .4, x0 = R.x + lw, bh = R.h / d.length, max = 100; for (var i = 0; i < d.length; i++) { var y = R.y + i * bh; txt(c, d[i][0], x0 - 6, y + bh / 2, fs, k.ink2, 'right'); hbar(c, x0, y + bh * .2, bh * .6, x0 + d[i][1] / max * (R.w - lw), i === 0 ? k.s1 : k.gray); txt(c, fmt(d[i][1]), x0 + d[i][1] / max * (R.w - lw) + 5, y + bh / 2, fs, k.ink, 'left', i === 0 ? 700 : 500); }
  txt(c, '2022', R.x + R.w, R.y + R.h - fs * .2, h * .16, k.grid, 'right', 800); c.fillStyle = k.grid; rr(c, R.x, R.y + R.h + fs * .5, R.w, 3, 2); c.fill(); c.fillStyle = k.s1; rr(c, R.x, R.y + R.h + fs * .5, R.w * .45, 3, 2); c.fill();
};

// ═══ ③ 무엇으로 이뤄졌나 ═══

// 분할 막대: 전체 하나를 여섯 조각까지. 조각 안에 비율
CH['segmented-bar'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '하루 시간 쓰임'), fs = h * .055, d = [['잠', 33, k.s1], ['일', 29, k.s2], ['이동', 8, k.s3], ['식사', 9, k.ramp[2]], ['여가', 15, k.gray], ['기타', 6, k.grid]], x = R.x, bh = 28, y0 = R.y + R.h * .3, i;
  for (i = 0; i < d.length; i++) { var ww = d[i][1] / 100 * R.w - 2; c.fillStyle = d[i][2]; rr(c, x, y0, ww, bh, 4); c.fill(); if (ww > fs * 2.6) txt(c, d[i][1] + '%', x + 6, y0 + bh / 2, fs, i >= 3 ? k.ink : '#ffffff', 'left', 700); x += ww + 2; }
  var lx = R.x, ly = y0 + bh + fs * 1.6; for (i = 0; i < d.length; i++) { c.fillStyle = d[i][2]; rr(c, lx, ly - fs * .35, fs * .7, fs * .7, 2); c.fill(); txt(c, d[i][0], lx + fs, ly, fs, k.ink2); lx += fs + tw(c, d[i][0], fs) + fs; }
};

// 누적 막대: 시점마다 전체와 조각을 같이. 조각 사이 2px 틈
CH['stacked-bar'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '분기별 매출 구성', '만 원'), fs = h * .055, q = ['1분기', '2분기', '3분기', '4분기'], a = [320, 360, 410, 480], b = [180, 210, 190, 260], cc = [90, 120, 150, 170];
  legend(c, R.x, R.y - fs * .2, [['매장', k.s1], ['온라인', k.s2], ['도매', k.s3]], k, fs); R.y += fs * 1.2; R.h -= fs * 1.2;
  var y = gridY(c, R, k, 1000, [0, 250, 500, 750, 1000], fs), gw = R.w / q.length, i;
  for (i = 0; i < q.length; i++) { var x = R.x + i * gw + gw * .3, bw = Math.min(gw * .4, 24), base = y(0), segs = [[a[i], k.s1], [b[i], k.s2], [cc[i], k.s3]], top = base;
    for (var s = 0; s < segs.length; s++) { var hh = base - y(segs[s][0]); c.fillStyle = segs[s][1]; var isTop = s === segs.length - 1; rr(c, x + (gw * .4 - bw) / 2, top - hh, bw, hh - (isTop ? 0 : 2), isTop ? [4, 4, 0, 0] : 0); c.fill(); top -= hh; }
    txt(c, q[i], R.x + i * gw + gw / 2, R.y + R.h + fs * .9, fs, k.ink2, 'center'); }
};

// 누적 영역: 시간에 따라 조각이 쌓인 전체
CH['stacked-area'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '유입 채널, 주간', '천 명'), fs = h * .055, n = 12, names = ['검색', 'SNS', '직접'], cols = [k.s1, k.s2, k.s3], i, j, series = [], acc = [];
  for (j = 0; j < 3; j++) { series.push([]); for (i = 0; i < n; i++) series[j].push(30 + 20 * hash(j * 31 + i) + (j === 1 ? i * 3 : 0)); }
  legend(c, R.x, R.y - fs * .2, [['검색', k.s1], ['SNS', k.s2], ['직접', k.s3]], k, fs); R.y += fs * 1.2; R.h -= fs * 1.2;
  var y = gridY(c, R, k, 240, [0, 80, 160, 240], fs); for (i = 0; i < n; i++) acc.push(0);
  for (j = 0; j < 3; j++) { c.fillStyle = cols[j]; c.beginPath(); for (i = 0; i < n; i++) c.lineTo(R.x + i / (n - 1) * R.w, y(acc[i] + series[j][i]) + 1); for (i = n - 1; i >= 0; i--) c.lineTo(R.x + i / (n - 1) * R.w, y(acc[i]) - (j ? 1 : 0)); c.closePath(); c.fill(); for (i = 0; i < n; i++) acc[i] += series[j][i]; }
};

// 와플: 100칸 격자. 몇 칸이 칠해졌나로 비율
CH['waffle'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '설문 응답, 다시 올 것 같다', '100명 중'), fs = h * .055, n = 10, cell = Math.min(R.h / n, R.w * .5 / n), gap = 2, x0 = R.x + (R.w * .5 - cell * n) / 2, i, parts = [[68, k.s1], [21, k.gray], [11, k.grid]], idx = 0;
  for (i = 0; i < 100; i++) { var col = i < 68 ? k.s1 : i < 89 ? k.gray : k.grid, cx = i % n, cy = n - 1 - Math.floor(i / n); c.fillStyle = col; rr(c, x0 + cx * cell, R.y + cy * cell, cell - gap, cell - gap, 2); c.fill(); }
  var lx = R.x + R.w * .58, ly = R.y + fs; var names = ['그렇다 68', '보통 21', '아니다 11']; for (i = 0; i < 3; i++) { c.fillStyle = parts[i][1]; rr(c, lx, ly - fs * .35, fs * .7, fs * .7, 2); c.fill(); txt(c, names[i], lx + fs, ly, fs, i === 0 ? k.ink : k.ink2, 'left', i === 0 ? 700 : 500); ly += fs * 1.8; }
};

// 트리맵: 면적이 곧 값. 큰 것부터 네모로 채운다
CH['treemap'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '창고 재고 구성', '%'), fs = h * .055, items = [['의류', 34], ['신발', 22], ['가방', 16], ['모자', 11], ['양말', 9], ['기타', 8]], i;
  var rects = [[0, 0, .5, .68], [0, .68, .5, .32], [.5, 0, .5, .52], [.5, .52, .25, .48], [.75, .52, .25, .3], [.75, .82, .25, .18]];
  for (i = 0; i < items.length; i++) { var r = rects[i], x = R.x + r[0] * R.w, y = R.y + r[1] * R.h, ww = r[2] * R.w - 2, hh = r[3] * R.h - 2; c.fillStyle = ramp(k, 1 - i / items.length * .8); rr(c, x, y, ww, hh, 3); c.fill(); if (ww > fs * 3 && hh > fs * 2.4) { txt(c, items[i][0], x + 6, y + fs * .9, fs, i < 3 ? '#ffffff' : k.ink, 'left', 700); txt(c, items[i][1] + '%', x + 6, y + fs * 2.1, fs, i < 3 ? '#ffffff' : k.ink, 'left'); } }
};

// 도넛: 비추. 비율은 막대가 더 정확하다. 쓴다면 조각 넷 이하, 가운데에 전체
CH['donut'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '결제 수단 (비추 · 막대가 낫다)'), fs = h * .055, parts = [['카드', 58, k.s1], ['간편결제', 27, k.s2], ['계좌', 10, k.s3], ['기타', 5, k.gray]], cx = R.x + R.h * .5, cy = R.y + R.h / 2, r = R.h * .42, a = -Math.PI / 2, i;
  for (i = 0; i < parts.length; i++) { var da = parts[i][1] / 100 * TAU; c.strokeStyle = parts[i][2]; c.lineWidth = r * .42; c.beginPath(); c.arc(cx, cy, r * .78, a + .03, a + da - .03); c.stroke(); a += da; }
  txt(c, '1,240건', cx, cy, fs * 1.1, k.ink, 'center', 700);
  var lx = R.x + R.h * 1.1, ly = R.y + fs; for (i = 0; i < parts.length; i++) { c.fillStyle = parts[i][2]; rr(c, lx, ly - fs * .35, fs * .7, fs * .7, 2); c.fill(); txt(c, parts[i][0] + ' ' + parts[i][1] + '%', lx + fs, ly, fs, k.ink2); ly += fs * 1.7; }
};

// 퍼널: 단계마다 줄어드는 수. 막대 폭이 곧 남은 수
CH['funnel'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '가입까지 단계', '명'), fs = h * .055, steps = [['방문', 10000], ['회원가입 화면', 4200], ['가입 완료', 1900], ['첫 글', 760]], n = steps.length, bh = R.h / n, i;
  for (i = 0; i < n; i++) { var y = R.y + i * bh, ww = steps[i][1] / 10000 * R.w * .6, x = R.x + R.w * .3 + (R.w * .6 - ww) / 2; c.fillStyle = ramp(k, .35 + i / n * .6); rr(c, x, y + 2, ww, bh - 4, 3); c.fill(); txt(c, steps[i][0], R.x + R.w * .28, y + bh / 2, fs, k.ink2, 'right'); txt(c, fmt(steps[i][1]) + (i ? ' · ' + Math.round(steps[i][1] / steps[i - 1][1] * 100) + '%' : ''), R.x + R.w * .92, y + bh / 2, fs, k.ink, 'left', i === n - 1 ? 700 : 500); }
};

// 폭포: 시작 값에서 더하고 빼서 끝 값까지. 올림은 한 색, 내림은 회색
CH['waterfall'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '월 예산에서 남은 돈', '만 원'), fs = h * .055, d = [['시작', 300, 's'], ['월세', -90, 'd'], ['식비', -65, 'd'], ['보너스', 40, 'u'], ['교통', -25, 'd'], ['남음', 160, 'e']], n = d.length;
  var y = gridY(c, R, k, 320, [0, 100, 200, 300], fs), gw = R.w / n, run = 0, i;
  for (i = 0; i < n; i++) { var x = R.x + i * gw, t = d[i][2], y0, y1, col; if (t === 's' || t === 'e') { y0 = y(d[i][1]); y1 = y(0); run = d[i][1]; col = k.ink2; } else { var a = run, b = run + d[i][1]; y0 = y(Math.max(a, b)); y1 = y(Math.min(a, b)); run = b; col = t === 'u' ? k.s1 : k.gray; }
    c.fillStyle = col; rr(c, x + gw * .22, y0, Math.min(gw * .56, 24), y1 - y0, [4, 4, 0, 0]); c.fill(); if (i < n - 1 && t !== 'e') hline(c, x + gw * .22, x + gw * 1.22, y(run), k.base); txt(c, d[i][0], x + gw / 2, R.y + R.h + fs * .9, fs, k.ink2, 'center'); }
  txt(c, '160', R.x + (n - .5) * gw, y(160) - fs * .7, fs, k.ink, 'center', 700);
};

// ═══ ④ 어떻게 퍼져 있나 ═══

// 히스토그램: 값을 구간으로 묶어 개수. 막대가 붙어 있다(2px 틈)
CH['histogram'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '주문 처리 시간', '건 · 분'), fs = h * .055, d = [4, 11, 26, 42, 38, 27, 15, 9, 5, 3, 2, 1], n = d.length;
  var y = gridY(c, R, k, 50, [0, 25, 50], fs), bw = R.w / n, i; for (i = 0; i < n; i++) { c.fillStyle = i === 3 ? k.s1 : k.ramp[2]; rr(c, R.x + i * bw + 1, y(d[i]), bw - 2, y(0) - y(d[i]), [3, 3, 0, 0]); c.fill(); }
  for (i = 0; i <= n; i += 3) txt(c, String(i * 5), R.x + i * bw, R.y + R.h + fs * .9, fs, k.muted, 'center'); txt(c, '15~20분이 가장 많음', R.x + 3.5 * bw, y(42) - fs * .8, fs, k.ink, 'center', 700);
};

// 박스: 가운데 50% 상자 + 중앙값 선 + 수염. 그룹 비교
CH['boxplot'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '팀별 응답 시간', '초'), fs = h * .055, g = [['고객센터', 5, 9, 14, 20, 28], ['채팅', 2, 4, 6, 9, 14], ['이메일', 20, 32, 41, 55, 70], ['전화', 8, 12, 15, 19, 26]], n = g.length;
  var y = gridY(c, R, k, 80, [0, 20, 40, 60, 80], fs), gw = R.w / n, i; for (i = 0; i < n; i++) { var x = R.x + i * gw + gw / 2, bw = Math.min(gw * .5, 24), d = g[i];
    pline(c, [[x, y(d[1])], [x, y(d[2])]], k.ink2, 1.5); pline(c, [[x, y(d[4])], [x, y(d[5])]], k.ink2, 1.5); c.fillStyle = i === 2 ? k.s1 : k.ramp[2]; rr(c, x - bw / 2, y(d[4]), bw, y(d[2]) - y(d[4]), 3); c.fill(); pline(c, [[x - bw / 2, y(d[3])], [x + bw / 2, y(d[3])]], k.surface, 2); txt(c, g[i][0], x, R.y + R.h + fs * .9, fs, k.ink2, 'center'); }
};

// 바이올린: 분포 모양을 양쪽으로 펼친다. 박스보다 봉우리가 보인다
CH['violin'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '수업별 점수 분포', '점'), fs = h * .055, names = ['월반', '정규', '보충'], peaks = [[82, 6], [70, 12], [58, 9]], n = 3, gw = R.w / n, i, j;
  var y = gridY(c, R, k, 100, [0, 50, 100], fs); for (i = 0; i < n; i++) { var x = R.x + i * gw + gw / 2, mw = gw * .32; c.fillStyle = i === 0 ? alpha(k.s1, .85) : k.ramp[2]; c.beginPath(); for (j = 30; j <= 100; j += 2) { var d = Math.exp(-Math.pow((j - peaks[i][0]) / peaks[i][1], 2) / 2) + (i === 1 ? .35 * Math.exp(-Math.pow((j - 48) / 6, 2) / 2) : 0); c.lineTo(x + d * mw, y(j)); } for (j = 100; j >= 30; j -= 2) { d = Math.exp(-Math.pow((j - peaks[i][0]) / peaks[i][1], 2) / 2) + (i === 1 ? .35 * Math.exp(-Math.pow((j - 48) / 6, 2) / 2) : 0); c.lineTo(x - d * mw, y(j)); } c.closePath(); c.fill(); pline(c, [[x - 4, y(peaks[i][0])], [x + 4, y(peaks[i][0])]], k.surface, 2); txt(c, names[i], x, R.y + R.h + fs * .9, fs, k.ink2, 'center'); }
};

// 벌떼: 점 하나가 값 하나. 겹치지 않게 옆으로 밀어 쌓는다
CH['beeswarm'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '배달 소요 시간, 건마다', '분'), fs = h * .055, min = 10, max = 60, X = function (v) { return R.x + (v - min) / (max - min) * R.w; }, bins = {}, i, r = h * .02;
  for (var t = 10; t <= 60; t += 10) { vline(c, X(t), R.y, R.y + R.h, t === 10 ? k.base : k.grid); txt(c, String(t), X(t), R.y + R.h + fs * .9, fs, k.muted, 'center'); }
  var mid = R.y + R.h * .5; for (i = 0; i < 90; i++) { var v = 22 + (hash(i) + hash(i + 7) + hash(i + 13)) * 11 + (hash(i + 3) > .9 ? 14 : 0), b = Math.round(v / 1.6), n = bins[b] || 0; bins[b] = n + 1; var yy = mid + (n % 2 ? 1 : -1) * Math.ceil(n / 2) * r * 2.1; dot(c, X(v), yy, v > 45 ? k.s2 : k.s1, k, r); }
  txt(c, '45분 넘긴 건', X(52), R.y + fs * .5, fs, k.ink, 'center', 700);
};

// 릿지라인: 그룹마다 분포 곡선을 줄줄이 겹쳐 놓는다
CH['ridgeline'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '요일별 주문 시각', '시'), fs = h * .05, days = ['월', '화', '수', '목', '금', '토', '일'], n = days.length, rh = R.h / (n + 1), i, j, lw = h * .12;
  for (var t = 6; t <= 24; t += 6) txt(c, t + '시', R.x + lw + (t - 6) / 18 * (R.w - lw), R.y + R.h + fs * .9, fs, k.muted, 'center');
  for (i = 0; i < n; i++) { var base = R.y + (i + 1.3) * rh, wk = i >= 5; txt(c, days[i], R.x, base - rh * .3, fs, k.ink2, 'left'); c.fillStyle = wk ? alpha(k.s2, .8) : alpha(k.s1, .75); c.strokeStyle = k.surface; c.lineWidth = 1.5; c.beginPath(); c.moveTo(R.x + lw, base);
    for (j = 0; j <= 36; j++) { var hr = 6 + j / 2, d = Math.exp(-Math.pow((hr - (wk ? 13 : 12)) / 1.4, 2) / 2) * .6 + Math.exp(-Math.pow((hr - (wk ? 19.5 : 18.5)) / 1.6, 2) / 2) * (wk ? 1 : .8); c.lineTo(R.x + lw + j / 36 * (R.w - lw), base - d * rh * 1.9); } c.lineTo(R.x + R.w, base); c.closePath(); c.fill(); c.stroke(); }
};

// 밀도: 매끈한 분포 곡선 둘을 겹쳐 비교
CH['density'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '신규와 단골의 장바구니 금액', '만 원'), fs = h * .055, i, j, X = function (v) { return R.x + v / 10 * R.w; };
  legend(c, R.x, R.y - fs * .2, [['신규', k.s1], ['단골', k.s2]], k, fs); R.y += fs * 1.2; R.h -= fs * 1.2; hline(c, R.x, R.x + R.w, R.y + R.h, k.base);
  for (var t = 0; t <= 10; t += 2) txt(c, String(t), X(t), R.y + R.h + fs * .9, fs, k.muted, 'center');
  var curves = [[2.6, 1.1, k.s1], [5.4, 1.8, k.s2]]; for (i = 0; i < 2; i++) { var pts = []; for (j = 0; j <= 60; j++) { var v = j / 6, d = Math.exp(-Math.pow((v - curves[i][0]) / curves[i][1], 2) / 2); pts.push([X(v), R.y + R.h - d * R.h * .9]); } c.fillStyle = alpha(curves[i][2], .12); c.beginPath(); c.moveTo(pts[0][0], R.y + R.h); for (j = 0; j < pts.length; j++) c.lineTo(pts[j][0], pts[j][1]); c.lineTo(pts[pts.length - 1][0], R.y + R.h); c.closePath(); c.fill(); pline(c, pts, curves[i][2], 2); }
};

// 누적 분포: 값 이하가 몇 %인지. 0 에서 100% 로 오르는 한 선
CH['cdf'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '응답 시간 누적 비율', '%'), fs = h * .055, y = gridY(c, R, k, 100, [0, 50, 100], fs), pts = [], i, X = function (v) { return R.x + v / 1200 * R.w; };
  for (i = 0; i <= 60; i++) { var v = i * 20, p = 100 / (1 + Math.exp(-(v - 320) / 110)); pts.push([X(v), y(p)]); } pline(c, pts, k.s1, 2);
  var p95 = 720; vline(c, X(p95), R.y, R.y + R.h, k.gray); dot(c, X(p95), y(95), k.s1, k, 4); txt(c, 'p95 · 720ms', X(p95) + 8, y(95) + fs * .2, fs, k.ink, 'left', 700);
  for (var t = 0; t <= 1200; t += 400) txt(c, t + 'ms', X(t), R.y + R.h + fs * .9, fs, k.muted, 'center');
};

// 히트맵: 행 × 열 격자, 값은 짙기. 두 축의 분포
CH['heatmap'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '요일 × 시간대 주문', '건'), fs = h * .05, days = ['월', '화', '수', '목', '금', '토', '일'], hrs = ['6', '9', '12', '15', '18', '21'], lw = h * .1, cw = (R.w - lw) / hrs.length, ch = (R.h - fs * 1.6) / days.length, i, j;
  for (j = 0; j < hrs.length; j++) txt(c, hrs[j] + '시', R.x + lw + j * cw + cw / 2, R.y + R.h - fs * .4, fs, k.muted, 'center');
  for (i = 0; i < days.length; i++) { txt(c, days[i], R.x + lw - 6, R.y + i * ch + ch / 2, fs, k.ink2, 'right'); for (j = 0; j < hrs.length; j++) { var v = (j === 2 || j === 4 ? .6 : .2) + hash(i * 9 + j) * .4 + (i >= 5 && j === 4 ? .3 : 0); c.fillStyle = ramp(k, Math.min(1, v)); rr(c, R.x + lw + j * cw + 1, R.y + i * ch + 1, cw - 2, ch - 2, 2); c.fill(); } }
  txt(c, '토 18시 최고', R.x + lw + 4.5 * cw, R.y + 5 * ch + ch / 2, fs, '#ffffff', 'center', 700);
};

// ═══ ⑤ 서로 어떤 관계인가 ═══

// 산점도: 두 값의 관계. 점 하나가 항목 하나, 셋까지 색
CH['scatter'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '가격과 평점', '점'), fs = h * .055, y = gridY(c, R, k, 5, [0, 2.5, 5], fs), i, X = function (v) { return R.x + v / 6 * R.w; };
  for (var t = 0; t <= 6; t += 2) txt(c, t + '만', X(t), R.y + R.h + fs * .9, fs, k.muted, 'center');
  for (i = 0; i < 40; i++) { var px = .5 + hash(i) * 5.3, py = Math.min(4.9, 2.2 + px * .35 + (hash(i + 5) - .5) * 1.4); dot(c, X(px), y(py), i % 9 === 0 ? k.s2 : k.s1, k, 4); }
  dot(c, X(1.2), y(4.7), k.s2, k, 4); txt(c, '싸고 높음', X(1.2) + 9, y(4.7), fs, k.ink, 'left', 700);
};

// 버블: 산점도에 셋째 값을 크기로
CH['bubble'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '동네별 가게 수 · 매출 · 인구', '크기 = 인구'), fs = h * .055, y = gridY(c, R, k, 100, [0, 50, 100], fs), d = [['성수', 30, 72, 26], ['망원', 18, 48, 14], ['연남', 42, 85, 20], ['문래', 12, 30, 9], ['해방촌', 22, 40, 12]], i, X = function (v) { return R.x + v / 50 * R.w; };
  for (var t = 0; t <= 50; t += 25) txt(c, String(t), X(t), R.y + R.h + fs * .9, fs, k.muted, 'center');
  for (i = 0; i < d.length; i++) { var r = d[i][3] * h * .0055; c.fillStyle = alpha(k.s1, .55); c.strokeStyle = k.surface; c.lineWidth = 2; c.beginPath(); c.arc(X(d[i][1]), y(d[i][2]), r, 0, TAU); c.fill(); c.stroke(); txt(c, d[i][0], X(d[i][1]), y(d[i][2]) - r - fs * .5, fs, k.ink2, 'center'); }
};

// 상관 행렬: 변수끼리 상관을 격자로. 발산 색(음수 빨강 · 양수 파랑 · 0 회색)
CH['correlation'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '지표끼리 얼마나 같이 움직이나', '-1 ~ 1'), fs = h * .05, v = ['방문', '체류', '가입', '이탈', '구매'], n = v.length, lw = h * .12, cw = (R.w - lw - h * .3) / n, ch = (R.h - fs * 1.4) / n, i, j;
  var M = [[1, .7, .5, -.3, .4], [.7, 1, .6, -.5, .5], [.5, .6, 1, -.6, .8], [-.3, -.5, -.6, 1, -.4], [.4, .5, .8, -.4, 1]];
  for (j = 0; j < n; j++) txt(c, v[j], R.x + lw + j * cw + cw / 2, R.y + R.h - fs * .3, fs, k.muted, 'center');
  for (i = 0; i < n; i++) { txt(c, v[i], R.x + lw - 6, R.y + i * ch + ch / 2, fs, k.ink2, 'right'); for (j = 0; j < n; j++) { var r = M[i][j], col = r > 0 ? alpha(k.pos, .15 + r * .85) : r < 0 ? alpha(k.neg, .15 - r * .85) : k.mid; c.fillStyle = col; rr(c, R.x + lw + j * cw + 1, R.y + i * ch + 1, cw - 2, ch - 2, 2); c.fill(); if (i !== j) txt(c, (r > 0 ? '+' : '') + r.toFixed(1), R.x + lw + j * cw + cw / 2, R.y + i * ch + ch / 2, fs * .9, Math.abs(r) > .55 ? '#ffffff' : k.ink, 'center'); } }
  var lx = R.x + R.w - h * .26; txt(c, '-1', lx, R.y + fs * .6, fs, k.muted, 'left'); for (i = 0; i < 7; i++) { var t = (i - 3) / 3; c.fillStyle = t > 0 ? alpha(k.pos, .15 + t * .85) : t < 0 ? alpha(k.neg, .15 - t * .85) : k.mid; c.fillRect(lx, R.y + fs * 1.4 + i * h * .045, h * .05, h * .043); } txt(c, '+1', lx, R.y + fs * 1.4 + 7 * h * .045 + fs * .5, fs, k.muted, 'left');
};

// 생키: 왼쪽에서 오른쪽으로 흐르는 양. 띠 두께가 곧 양
CH['sankey'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '전공에서 첫 직무로', '명'), fs = h * .055, L = [['디자인', 60], ['개발', 90], ['경영', 50]], Rr = [['프로덕트', 70], ['엔지니어', 80], ['마케팅', 50]], flows = [[0, 0, 40], [0, 2, 20], [1, 1, 80], [1, 0, 10], [2, 0, 20], [2, 2, 30]], tot = 200, bw = h * .05, i;
  var pos = function (arr, x) { var out = [], y = R.y; for (var i = 0; i < arr.length; i++) { out.push([x, y, arr[i][1] / tot * (R.h - 12)]); y += arr[i][1] / tot * (R.h - 12) + 6; } return out; };
  var Lp = pos(L, R.x + h * .3), Rp = pos(Rr, R.x + R.w - h * .3 - bw), lo = [0, 0, 0], ro = [0, 0, 0];
  for (i = 0; i < flows.length; i++) { var f = flows[i], a = Lp[f[0]], b = Rp[f[1]], hh = f[2] / tot * (R.h - 12), y0 = a[1] + lo[f[0]], y1 = b[1] + ro[f[1]], x0 = a[0] + bw, x1 = b[0], mx = (x0 + x1) / 2; lo[f[0]] += hh; ro[f[1]] += hh;
    c.fillStyle = f[0] === 1 ? alpha(k.s1, .35) : alpha(k.gray, .35); c.beginPath(); c.moveTo(x0, y0); c.bezierCurveTo(mx, y0, mx, y1, x1, y1); c.lineTo(x1, y1 + hh); c.bezierCurveTo(mx, y1 + hh, mx, y0 + hh, x0, y0 + hh); c.closePath(); c.fill(); }
  for (i = 0; i < 3; i++) { c.fillStyle = k.ink; c.fillRect(Lp[i][0], Lp[i][1], bw, Lp[i][2]); c.fillRect(Rp[i][0], Rp[i][1], bw, Rp[i][2]); txt(c, L[i][0] + ' ' + L[i][1], Lp[i][0] - 5, Lp[i][1] + Lp[i][2] / 2, fs, k.ink2, 'right'); txt(c, Rr[i][0] + ' ' + Rr[i][1], Rp[i][0] + bw + 5, Rp[i][1] + Rp[i][2] / 2, fs, k.ink2, 'left'); }
};

// 평행 좌표: 세로축 여럿을 선 하나가 지나간다. 항목 하나 = 선 하나
CH['parallel'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '노트북 다섯 대 비교'), fs = h * .05, axes = ['가격', '무게', '배터리', '화면', '성능'], n = axes.length, i, j, X = function (j) { return R.x + h * .1 + j / (n - 1) * (R.w - h * .2); };
  for (j = 0; j < n; j++) { vline(c, X(j), R.y + fs, R.y + R.h - fs * 1.4, k.grid); txt(c, axes[j], X(j), R.y + R.h - fs * .3, fs, k.muted, 'center'); }
  var items = [[.3, .8, .4, .5, .3], [.6, .5, .7, .6, .6], [.9, .2, .9, .9, .95], [.4, .6, .5, .4, .4], [.7, .4, .6, .8, .7]]; for (i = 0; i < items.length; i++) { var pts = []; for (j = 0; j < n; j++) pts.push([X(j), R.y + R.h - fs * 1.4 - items[i][j] * (R.h - fs * 2.4)]); pline(c, pts, i === 2 ? k.s1 : k.gray, 2); } txt(c, '비싼데 다 좋음', X(4) - 6, R.y + fs * 1.1, fs, k.ink, 'right', 700);
};

// 코드: 둥근 테두리에 항목을 두고 사이 흐름을 띠로
CH['chord'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '팀 사이 메시지 흐름'), fs = h * .05, names = ['기획', '디자인', '개발', '운영'], n = 4, cx = R.x + R.w / 2, cy = R.y + R.h / 2, r = R.h * .42, i, j;
  for (i = 0; i < n; i++) { var a0 = i / n * TAU - Math.PI / 2 + .08, a1 = (i + 1) / n * TAU - Math.PI / 2 - .08; c.strokeStyle = i === 2 ? k.s1 : k.gray; c.lineWidth = r * .16; c.beginPath(); c.arc(cx, cy, r, a0, a1); c.stroke(); var am = (a0 + a1) / 2; txt(c, names[i], cx + Math.cos(am) * r * 1.26, cy + Math.sin(am) * r * 1.26, fs, k.ink2, 'center'); }
  var pairs = [[0, 2, .5], [1, 2, .4], [2, 3, .3], [0, 1, .25]]; for (j = 0; j < pairs.length; j++) { var p = pairs[j], a = (p[0] + .5) / n * TAU - Math.PI / 2, b = (p[1] + .5) / n * TAU - Math.PI / 2, rr0 = r * .9; c.strokeStyle = alpha(p[0] === 2 || p[1] === 2 ? k.s1 : k.gray, .45); c.lineWidth = p[2] * r * .5; c.beginPath(); c.moveTo(cx + Math.cos(a) * rr0, cy + Math.sin(a) * rr0); c.quadraticCurveTo(cx, cy, cx + Math.cos(b) * rr0, cy + Math.sin(b) * rr0); c.stroke(); }
};

// 네트워크: 점과 선. 이어진 수가 많은 점이 크다
CH['network'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '같이 주문된 메뉴'), fs = h * .05, nodes = [['아메리카노', .5, .45, 12], ['크루아상', .22, .3, 8], ['라떼', .78, .3, 9], ['스콘', .3, .75, 6], ['케이크', .7, .72, 7], ['말차', .9, .55, 5], ['샌드위치', .12, .55, 5]], edges = [[0, 1], [0, 2], [0, 3], [0, 4], [2, 5], [1, 6], [3, 4], [2, 4]], i, P = function (n) { return [R.x + n[1] * R.w, R.y + n[2] * R.h]; };
  for (i = 0; i < edges.length; i++) { var a = P(nodes[edges[i][0]]), b = P(nodes[edges[i][1]]); pline(c, [a, b], edges[i][0] === 0 ? k.ramp[2] : k.grid, 2); }
  for (i = 0; i < nodes.length; i++) { var p = P(nodes[i]), r = nodes[i][3] * h * .004 + 3; dot(c, p[0], p[1], i === 0 ? k.s1 : k.gray, k, r); txt(c, nodes[i][0], p[0], p[1] - r - fs * .5, fs, i === 0 ? k.ink : k.ink2, 'center', i === 0 ? 700 : 500); }
};

// 트리: 뿌리에서 가지로. 위에서 아래로 갈라진다
CH['tree'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '메뉴 구성'), fs = h * .05, root = ['전체', .5, .1], mid = [['커피', .2, .45], ['차', .5, .45], ['디저트', .8, .45]], leaf = [[0, '라떼', .08], [0, '아메리카노', .22], [0, '콜드브루', .35], [1, '말차', .5], [2, '스콘', .66], [2, '케이크', .8], [2, '쿠키', .93]], i, P = function (x, y) { return [R.x + x * R.w, R.y + y * R.h]; };
  for (i = 0; i < mid.length; i++) { var a = P(root[1], root[2]), b = P(mid[i][1], mid[i][2]); c.strokeStyle = i === 2 ? k.s1 : k.grid; c.lineWidth = 2; c.beginPath(); c.moveTo(a[0], a[1]); c.bezierCurveTo(a[0], (a[1] + b[1]) / 2, b[0], (a[1] + b[1]) / 2, b[0], b[1]); c.stroke(); }
  for (i = 0; i < leaf.length; i++) { var m = mid[leaf[i][0]], a2 = P(m[1], m[2]), b2 = P(leaf[i][2], .85); c.strokeStyle = leaf[i][0] === 2 ? k.ramp[2] : k.grid; c.lineWidth = 2; c.beginPath(); c.moveTo(a2[0], a2[1]); c.bezierCurveTo(a2[0], (a2[1] + b2[1]) / 2, b2[0], (a2[1] + b2[1]) / 2, b2[0], b2[1]); c.stroke(); dot(c, b2[0], b2[1], leaf[i][0] === 2 ? k.s1 : k.gray, k, 3); txt(c, leaf[i][1], b2[0], b2[1] + fs * 1.1, fs * .9, k.ink2, 'center'); }
  var rp = P(root[1], root[2]); dot(c, rp[0], rp[1], k.ink, k, 4); txt(c, root[0], rp[0] + 9, rp[1], fs, k.ink, 'left', 700); for (i = 0; i < mid.length; i++) { var mp = P(mid[i][1], mid[i][2]); dot(c, mp[0], mp[1], i === 2 ? k.s1 : k.gray, k, 4); txt(c, mid[i][0], mp[0] + 9, mp[1], fs, k.ink2, 'left'); }
};

// ═══ ⑥ 어디서 · 얼마나 됐나 ═══
// 지도 셋은 실제 지형이 아니라 추상 구역(타일 · 다각형)으로 그린다

// 단계구분도: 구역을 값의 짙기로 칠한다
CH['choropleth'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '구역별 가입자 밀도', '명/천 가구'), fs = h * .05, cols = 4, rows = 3, cw = R.w * .62 / cols, ch = R.h / rows, i, vals = [.2, .55, .9, .4, .7, 1, .6, .3, .15, .45, .8, .25], names = ['북서', '북', '북동', '동북', '서', '중앙', '동', '동남', '남서', '남', '남동', '외곽'];
  for (i = 0; i < 12; i++) { var x = R.x + (i % cols) * cw, y = R.y + Math.floor(i / cols) * ch, dx = (hash(i) - .5) * cw * .25, dy = (hash(i + 4) - .5) * ch * .25; c.fillStyle = ramp(k, vals[i]); c.strokeStyle = k.surface; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 2 + dx * .3, y + 2); c.lineTo(x + cw - 2 + dx, y + 2 + dy * .5); c.lineTo(x + cw - 2 - dx * .5, y + ch - 2 + dy); c.lineTo(x + 2 + dx * .6, y + ch - 2 - dy * .4); c.closePath(); c.fill(); c.stroke(); if (vals[i] >= .9) txt(c, names[i], x + cw / 2, y + ch / 2, fs, '#ffffff', 'center', 700); }
  var lx = R.x + R.w * .7; txt(c, '적음', lx, R.y + fs * .6, fs, k.muted, 'left'); for (i = 0; i < 6; i++) { c.fillStyle = ramp(k, i / 5); c.fillRect(lx, R.y + fs * 1.4 + i * h * .06, h * .06, h * .058); } txt(c, '많음', lx, R.y + fs * 1.4 + 6 * h * .06 + fs * .6, fs, k.muted, 'left');
};

// 타일 지도: 구역을 같은 크기 네모로 대강의 자리에. 크기 왜곡 없이 비교
CH['tile-map'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '시도별 가입자', '천 명'), fs = h * .048, cell = Math.min(R.h / 5, R.w / 7) - 2, tiles = [['서울', 2, 0, .95], ['경기', 2, 1, 1], ['인천', 1, 1, .5], ['강원', 3, 0, .25], ['충북', 3, 1, .3], ['충남', 2, 2, .35], ['세종', 1, 2, .2], ['대전', 2, 3, .4], ['경북', 4, 2, .3], ['대구', 4, 3, .45], ['전북', 1, 3, .25], ['광주', 1, 4, .35], ['전남', 0, 4, .2], ['경남', 3, 4, .4], ['울산', 5, 3, .3], ['부산', 4, 4, .6], ['제주', 0, 5, .15]], i, x0 = R.x + (R.w - cell * 7) / 2;
  for (i = 0; i < tiles.length; i++) { var t = tiles[i], x = x0 + t[1] * (cell + 2), y = R.y + t[2] * (cell + 2) * .78; c.fillStyle = ramp(k, t[3]); rr(c, x, y, cell, cell * .78, 3); c.fill(); txt(c, t[0], x + cell / 2, y + cell * .39, fs, t[3] > .55 ? '#ffffff' : k.ink, 'center', t[3] > .9 ? 700 : 500); }
};

// 기호 지도: 자리에 원, 크기가 값. 구역 넓이에 안 끌려간다
CH['symbol-map'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '지점별 월 매출', '크기 = 매출'), fs = h * .05, i; c.fillStyle = k.grid; rr(c, R.x + R.w * .15, R.y, R.w * .55, R.h, 14); c.fill(); c.fillStyle = k.surface; rr(c, R.x + R.w * .3, R.y + R.h * .35, R.w * .12, R.h * .22, 8); c.fill();
  var pts = [['북촌', .3, .15, 14], ['성수', .55, .3, 20], ['망원', .22, .45, 11], ['강남', .5, .62, 26], ['판교', .6, .85, 16], ['송도', .18, .78, 9]]; for (i = 0; i < pts.length; i++) { var x = R.x + pts[i][1] * R.w, y = R.y + pts[i][2] * R.h, r = pts[i][3] * h * .006; c.fillStyle = alpha(k.s1, .55); c.strokeStyle = k.surface; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke(); txt(c, pts[i][0], x + r + 4, y, fs, k.ink2, 'left'); }
  txt(c, '강남이 가장 큼', R.x + R.w * .98, R.y + R.h * .62, fs, k.ink, 'right', 700);
};

// 흐름 지도: 한 점에서 여러 점으로 가는 화살표, 두께가 양
CH['flow-map'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '중앙 창고에서 나간 물량', '천 상자'), fs = h * .05, i; c.fillStyle = k.grid; rr(c, R.x + R.w * .1, R.y, R.w * .6, R.h, 14); c.fill();
  var src = [R.x + R.w * .32, R.y + R.h * .3], dst = [['북부', .3, .08, 2], ['동부', .62, .35, 5], ['남동', .58, .78, 8], ['남부', .3, .9, 4], ['서부', .14, .55, 3]]; for (i = 0; i < dst.length; i++) { var d = dst[i], x = R.x + d[1] * R.w, y = R.y + d[2] * R.h, mx = (src[0] + x) / 2 + (y - src[1]) * .25, my = (src[1] + y) / 2 - (x - src[0]) * .25; c.strokeStyle = alpha(d[3] >= 8 ? k.s1 : k.ink2, .5); c.lineWidth = d[3] * .8; c.lineCap = 'round'; c.beginPath(); c.moveTo(src[0], src[1]); c.quadraticCurveTo(mx, my, x, y); c.stroke(); dot(c, x, y, d[3] >= 8 ? k.s1 : k.gray, k, 3.5); txt(c, d[0] + ' ' + d[3] * 22, x + 8, y, fs, k.ink2, 'left'); }
  dot(c, src[0], src[1], k.ink, k, 5); txt(c, '중앙', src[0] - 9, src[1], fs, k.ink, 'right', 700);
};

// 미터: 한 비율을 한계에 대고. 채움은 같은 램프의 짙은 단, 빈 곳은 옅은 단
CH['meter'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '이번 달 목표 진행'), fs = h * .055, rows = [['매출', 72, 100], ['신규 회원', 118, 100], ['후기 수집', 46, 100]], rh = R.h / rows.length, i;
  for (i = 0; i < rows.length; i++) { var y = R.y + i * rh + rh * .2, bh = Math.min(rh * .32, 14), x0 = R.x + h * .36, W = R.w - h * .36 - h * .25, p = Math.min(1, rows[i][1] / rows[i][2]); txt(c, rows[i][0], x0 - 8, y + bh / 2, fs, k.ink2, 'right'); c.fillStyle = k.ramp[0]; rr(c, x0, y, W, bh, bh / 2); c.fill(); c.fillStyle = rows[i][1] >= 100 ? k.good : k.s1; rr(c, x0, y, W * p, bh, bh / 2); c.fill(); txt(c, rows[i][1] + '%', x0 + W + 8, y + bh / 2, fs, k.ink, 'left', 700); }
};

// 코호트 표: 가입 달마다 몇 달 뒤 몇 %가 남았는지. 짙기가 값
CH['cohort'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '가입 달별 남은 비율', '%'), fs = h * .048, months = ['3월', '4월', '5월', '6월', '7월'], n = 6, lw = h * .14, cw = (R.w - lw) / n, ch = (R.h - fs * 1.4) / months.length, i, j;
  for (j = 0; j < n; j++) txt(c, j + '개월', R.x + lw + j * cw + cw / 2, R.y + R.h - fs * .3, fs, k.muted, 'center');
  for (i = 0; i < months.length; i++) { txt(c, months[i], R.x + lw - 6, R.y + i * ch + ch / 2, fs, k.ink2, 'right'); for (j = 0; j < n - i; j++) { var v = j === 0 ? 1 : Math.max(.2, .62 - j * .07 + hash(i * 5 + j) * .06); c.fillStyle = ramp(k, v * .95); rr(c, R.x + lw + j * cw + 1, R.y + i * ch + 1, cw - 2, ch - 2, 2); c.fill(); txt(c, Math.round(v * 100) + '%', R.x + lw + j * cw + cw / 2, R.y + i * ch + ch / 2, fs, v > .5 ? '#ffffff' : k.ink, 'center'); } }
};

// 지표 표: 줄마다 이름 · 작은 선 · 현재 · 변화 · 목표. 대시보드 첫 화면
CH['metric-table'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '이번 주 지표', '최근 8주 · 목표'), fs = h * .05, rows = [['방문', '12.4만', '+6%', '13만', 1], ['가입', '3,120', '+12%', '3,000', 1], ['이탈률', '2.1%', '-0.3%p', '2%', 1], ['응답', '295ms', '+11%', '300ms', -1]], rh = R.h / rows.length, i, j;
  for (i = 0; i < rows.length; i++) { var y = R.y + i * rh + rh / 2, pts = []; hline(c, R.x, R.x + R.w, R.y + (i + 1) * rh, k.grid); txt(c, rows[i][0], R.x, y, fs, k.ink2, 'left');
    for (j = 0; j < 8; j++) pts.push([R.x + R.w * .22 + j / 7 * R.w * .22, y + (hash(i * 7 + j) - .5) * rh * .5]); pline(c, pts, k.gray, 2); dot(c, pts[7][0], pts[7][1], k.s1, k, 3);
    txt(c, rows[i][1], R.x + R.w * .62, y, fs, k.ink, 'right', 700); var good = rows[i][4] > 0; c.fillStyle = good ? alpha(k.good, .14) : alpha(k.neg, .14); var cwid = tw(c, rows[i][2], fs * .9, 600) + fs; rr(c, R.x + R.w * .66, y - fs * .65, cwid, fs * 1.3, fs * .65); c.fill(); txt(c, rows[i][2], R.x + R.w * .66 + fs / 2, y, fs * .9, good ? k.goodText : k.neg, 'left', 600); txt(c, rows[i][3], R.x + R.w, y, fs, k.muted, 'right'); }
};

// 간트: 할 일마다 시작 · 끝을 가로 막대로. 오늘 선
CH['gantt'] = function (c, w, h, k) {
  var R = frame(c, w, h, k, '출시 일정', '주'), fs = h * .05, tasks = [['기획', 0, 2], ['디자인', 1.5, 4], ['개발', 3, 8], ['검수', 7.5, 9], ['출시', 9, 10]], lw = h * .22, x0 = R.x + lw, W = R.w - lw, rh = R.h / tasks.length, i, X = function (v) { return x0 + v / 10 * W; }, today = 5.5;
  for (var t = 0; t <= 10; t += 2) { vline(c, X(t), R.y, R.y + R.h, k.grid); txt(c, t + '주', X(t), R.y + R.h + fs * .9, fs, k.muted, 'center'); }
  for (i = 0; i < tasks.length; i++) { var y = R.y + i * rh; txt(c, tasks[i][0], x0 - 6, y + rh / 2, fs, k.ink2, 'right'); var done = tasks[i][2] <= today, cur = tasks[i][1] <= today && tasks[i][2] > today; c.fillStyle = done ? k.gray : cur ? k.s1 : k.ramp[1]; rr(c, X(tasks[i][1]), y + rh * .25, X(tasks[i][2]) - X(tasks[i][1]), Math.min(rh * .5, 18), 4); c.fill(); }
  c.strokeStyle = k.ink; c.lineWidth = 1.5; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(X(today), R.y); c.lineTo(X(today), R.y + R.h); c.stroke(); c.setLineDash([]); txt(c, '오늘', X(today), R.y - fs * .3, fs, k.ink, 'center', 700);
};

if (typeof module !== 'undefined') module.exports = { CH: CH };
