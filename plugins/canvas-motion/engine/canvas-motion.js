/*!
 * canvas-motion — 창발/타임라인 캔버스 모션을 위한 의존성 0 마이크로 엔진.
 * 랜딩의 손코딩 배관(고정 timestep 루프·보간·아이소 투영·깊이 정렬·reduced-motion)을 재사용 부품으로.
 * 전역 CM 으로 노출(자가완결 <script> 용). ES 모듈이 필요하면 맨 아래 export 주석 참고.
 *
 * 핵심 아이디어 3가지:
 *  1) 시뮬레이션(update)은 "고정 간격(tick)"으로, 렌더(render)는 "매 프레임"으로 분리한다.
 *  2) 렌더에는 보간 alpha(0~1)를 넘겨, 두 시뮬 상태 사이를 부드럽게 그린다 → 끊김 없음.
 *  3) 창발은 규칙에서 나온다 — 키프레임을 그리지 말고, 상태+규칙을 매 tick 갱신하고 그 결과를 그린다.
 */
(function (root) {
  'use strict';

  // ── reduced-motion 게이트 ─────────────────────────────
  function prefersReducedMotion() {
    return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // ── DPR 대응 캔버스 셋업 (선명함 + 논리 좌표 유지) ──────
  // canvas.width/height 는 CSS 픽셀 * dpr 로 두고 ctx 를 dpr 배율로 스케일 → 코드는 CSS 픽셀로 그린다.
  function setupCanvas(canvas, opts) {
    opts = opts || {};
    var dpr = Math.min(opts.maxDpr || 2, root.devicePixelRatio || 1);
    var w = opts.width || canvas.clientWidth || canvas.width;
    var h = opts.height || canvas.clientHeight || canvas.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (opts.css !== false) { canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h, dpr: dpr };
  }

  // ── 고정 timestep 루프 (누산기) + 보간 alpha ───────────
  // update(dt) 는 tick 초마다 정확히, render(alpha, now) 는 매 프레임.
  // reduced=true 면 시뮬을 한 번만 밟고 정지 프레임을 그린다(모션 없음).
  // 탭이 숨으면 자동 일시정지(스파이럴 방지). 반환값 stop() 으로 종료.
  function loop(o) {
    var tick = o.tick || 1 / 30;           // 시뮬 간격(초). 260ms 쓰던 랜딩이면 0.26
    var update = o.update || function () {};
    var render = o.render || function () {};
    var maxFrame = o.maxFrame || 0.25;     // 프레임 사이 최대 dt(초) — 탭 복귀 시 폭주 방지
    var reduced = o.reduced != null ? o.reduced : prefersReducedMotion();
    var running = true, acc = 0, last = 0, raf = 0;

    if (reduced) {                          // 정지 프레임 1장(접근성)
      if (o.settle) for (var i = 0; i < o.settle; i++) update(tick);
      render(o.staticAt || 0, 1);           // (now, alpha)
      return { stop: function () {}, reduced: true };
    }
    function frame(now) {
      if (!running) return;
      if (!last) last = now;
      var dt = Math.min((now - last) / 1000, maxFrame);
      last = now; acc += dt;
      while (acc >= tick) { update(tick); acc -= tick; }
      render(now, acc / tick);              // ⚠️ (now[밀리초], alpha[다음 tick까지 0~1]). now 가 첫 인자다.
      raf = root.requestAnimationFrame(frame);
    }
    function onVis() { if (document.hidden) { running = false; } else if (!running) { running = true; last = 0; raf = root.requestAnimationFrame(frame); } }
    document.addEventListener('visibilitychange', onVis);
    raf = root.requestAnimationFrame(frame);
    return {
      reduced: false,
      stop: function () { running = false; root.cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVis); }
    };
  }

  // ── 이징 (표준 세트) ──────────────────────────────────
  var ease = {
    linear: function (t) { return t; },
    inOutSine: function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; },
    outCubic: function (t) { return 1 - Math.pow(1 - t, 3); },
    inOutCubic: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    outBack: function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    outElastic: function (t) { var c = (2 * Math.PI) / 3; return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * c) + 1; }
  };
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  // 타임라인용: 절대 시각 t 를 [a,b] 구간의 0~1 진행률로. (랜딩 flow2 의 seg())
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }

  // ── 아이소메트릭 투영 팩토리 ──────────────────────────
  // iso(tw, ox, oy) → P(x,y,h): 격자 좌표를 다이아몬드 화면 좌표로. th=tw/2.
  function iso(tw, ox, oy) {
    var th = tw / 2;
    return function P(x, y, h) { return [ox + (x - y) * tw / 2, oy + (x + y) * th / 2 - (h || 0)]; };
  }

  // ── 깊이 정렬 draw-list (painter's algorithm) ──────────
  // add(depth, drawFn) 로 담고 flush() 로 depth 오름차순(먼 것 먼저) 실행 → 아이소 가림 처리.
  function drawList() {
    var items = [];
    return {
      add: function (depth, fn) { items.push({ d: depth, f: fn }); },
      flush: function () { items.sort(function (a, b) { return a.d - b.d; }); for (var i = 0; i < items.length; i++) items[i].f(); items.length = 0; }
    };
  }

  // ── 재현 가능한 난수 (시드 고정 — 창발 시뮬을 결정적으로) ─
  // 같은 seed 면 같은 전개. 검증·비교·버그 재현에 필수.
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  // ── 점을 경로(폴리라인)를 따라 이동 (타임라인용) ────────
  function alongPath(pts, u) {
    if (pts.length < 2) return pts[0] || [0, 0];
    var total = 0, segs = [];
    for (var i = 1; i < pts.length; i++) { var dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1]; var l = Math.hypot(dx, dy); segs.push(l); total += l; }
    var target = clamp(u, 0, 1) * total, acc = 0;
    for (var j = 1; j < pts.length; j++) { if (acc + segs[j - 1] >= target) { var f = (target - acc) / (segs[j - 1] || 1); return [lerp(pts[j - 1][0], pts[j][0], f), lerp(pts[j - 1][1], pts[j][1], f)]; } acc += segs[j - 1]; }
    return pts[pts.length - 1];
  }

  var CM = {
    prefersReducedMotion: prefersReducedMotion,
    setupCanvas: setupCanvas,
    loop: loop,
    ease: ease, lerp: lerp, clamp: clamp, seg: seg,
    iso: iso, drawList: drawList, rng: rng, alongPath: alongPath,
    version: '0.1.0'
  };
  root.CM = CM;
  if (typeof module !== 'undefined' && module.exports) module.exports = CM; // ES/CJS 도 지원
})(typeof window !== 'undefined' ? window : this);
