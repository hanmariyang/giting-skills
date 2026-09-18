/*!
 * canvas-motion-plus — 고급 서브시스템. 코어(canvas-motion.js) 위에 얹는다.
 * 창발 모션의 재료: 벡터·노이즈·플로우필드·보이드(스티어링)·공간해시·카메라·A*·파티클·글로우·팔레트.
 * 전역 CMX 로 노출. 코어 CM 이 먼저 로드돼 있어야 한다.
 */
(function (root) {
  'use strict';
  var CM = root.CM || {};
  var lerp = CM.lerp || function (a, b, t) { return a + (b - a) * t; };
  var clamp = CM.clamp || function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
  var TAU = Math.PI * 2;

  // ── vec2 (가벼운 불변식 아닌 헬퍼) ─────────────────────
  var V = {
    add: function (a, b) { return [a[0] + b[0], a[1] + b[1]]; },
    sub: function (a, b) { return [a[0] - b[0], a[1] - b[1]]; },
    mul: function (a, s) { return [a[0] * s, a[1] * s]; },
    len: function (a) { return Math.hypot(a[0], a[1]); },
    norm: function (a) { var l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; },
    limit: function (a, m) { var l = Math.hypot(a[0], a[1]); return l > m ? [a[0] / l * m, a[1] / l * m] : a; },
    dist: function (a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); },
    fromAngle: function (r, m) { return [Math.cos(r) * (m || 1), Math.sin(r) * (m || 1)]; }
  };

  // ── 재현 가능한 value noise (2D) + flow field ─────────
  // 시드 고정 격자 난수 + 바이리니어 보간. 흐르는 유기적 움직임의 원천.
  function makeNoise(seed) {
    var rnd = (CM.rng ? CM.rng(seed) : Math.random), G = 512, grid = new Float32Array(G * G);
    for (var i = 0; i < grid.length; i++) grid[i] = rnd();
    function n(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      var a = grid[((yi & 511) * G + (xi & 511))], b = grid[((yi & 511) * G + ((xi + 1) & 511))];
      var c = grid[(((yi + 1) & 511) * G + (xi & 511))], d = grid[(((yi + 1) & 511) * G + ((xi + 1) & 511))];
      var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      return lerp(lerp(a, b, u), lerp(c, d, u), v);
    }
    // fbm: 여러 옥타브를 겹쳐 자연스럽게
    return function (x, y, oct) {
      oct = oct || 4; var f = 1, amp = 1, sum = 0, norm = 0;
      for (var o = 0; o < oct; o++) { sum += n(x * f, y * f) * amp; norm += amp; amp *= 0.5; f *= 2; }
      return sum / norm;
    };
  }
  // flow field: 노이즈 → 각도. 위치를 주면 그 지점의 흐름 방향 벡터.
  function flowField(noise, scale, strength) {
    scale = scale || 0.004; strength = strength || TAU * 1.5;
    return function (x, y, t) { var a = noise(x * scale, y * scale + (t || 0) * 0.05) * strength; return [Math.cos(a), Math.sin(a)]; };
  }

  // ── 공간 해시 (이웃 질의 O(1)~) — 보이드·충돌에 필수 ───
  function spatialHash(cell) {
    cell = cell || 40; var map = new Map();
    function key(x, y) { return ((x / cell) | 0) + ',' + ((y / cell) | 0); }
    return {
      clear: function () { map.clear(); },
      insert: function (o) { var k = key(o.p[0], o.p[1]); var b = map.get(k); if (!b) map.set(k, [o]); else b.push(o); },
      near: function (p, r) {
        var out = [], cx = (p[0] / cell) | 0, cy = (p[1] / cell) | 0, span = Math.ceil(r / cell);
        for (var gx = cx - span; gx <= cx + span; gx++) for (var gy = cy - span; gy <= cy + span; gy++) { var b = map.get(gx + ',' + gy); if (b) for (var i = 0; i < b.length; i++) out.push(b[i]); }
        return out;
      }
    };
  }

  // ── 스티어링 / 보이드 (Reynolds) ──────────────────────
  // 에이전트: {p:[x,y], v:[x,y], maxS, maxF}. 힘을 더해 v 갱신 → 창발적 무리 행동.
  var steer = {
    seek: function (a, target) { var d = V.norm(V.sub(target, a.p)); return V.limit(V.sub(V.mul(d, a.maxS), a.v), a.maxF); },
    arrive: function (a, target, slow) { slow = slow || 60; var to = V.sub(target, a.p), dist = V.len(to); var sp = dist < slow ? a.maxS * (dist / slow) : a.maxS; return V.limit(V.sub(V.mul(V.norm(to), sp), a.v), a.maxF); },
    separate: function (a, neighbors, sep) { sep = sep || 24; var sum = [0, 0], n = 0; for (var i = 0; i < neighbors.length; i++) { var o = neighbors[i]; if (o === a) continue; var d = V.dist(a.p, o.p); if (d > 0 && d < sep) { sum = V.add(sum, V.mul(V.norm(V.sub(a.p, o.p)), 1 / d)); n++; } } if (!n) return [0, 0]; return V.limit(V.sub(V.mul(V.norm(sum), a.maxS), a.v), a.maxF); },
    align: function (a, neighbors, rad) { rad = rad || 50; var sum = [0, 0], n = 0; for (var i = 0; i < neighbors.length; i++) { var o = neighbors[i]; if (o === a) continue; if (V.dist(a.p, o.p) < rad) { sum = V.add(sum, o.v); n++; } } if (!n) return [0, 0]; return V.limit(V.sub(V.mul(V.norm(V.mul(sum, 1 / n)), a.maxS), a.v), a.maxF); },
    cohesion: function (a, neighbors, rad) { rad = rad || 60; var sum = [0, 0], n = 0; for (var i = 0; i < neighbors.length; i++) { var o = neighbors[i]; if (o === a) continue; if (V.dist(a.p, o.p) < rad) { sum = V.add(sum, o.p); n++; } } if (!n) return [0, 0]; return steer.seek(a, V.mul(sum, 1 / n)); },
    follow: function (a, field, t) { var f = field(a.p[0], a.p[1], t); return V.limit(V.sub(V.mul(f, a.maxS), a.v), a.maxF); },
    integrate: function (a, dt, force) { a.v = V.limit(V.add(a.v, V.mul(force || [0, 0], dt)), a.maxS); a.p = V.add(a.p, V.mul(a.v, dt)); }
  };

  // ── 파티클 이미터 ─────────────────────────────────────
  function particles(max) {
    max = max || 800; var pool = [], live = [];
    for (var i = 0; i < max; i++) pool.push({ p: [0, 0], v: [0, 0], life: 0, max: 1, size: 2, col: '#fff' });
    return {
      live: live,
      emit: function (cfg) { var pt = pool.pop(); if (!pt) return; pt.p = cfg.p.slice(); pt.v = cfg.v ? cfg.v.slice() : [0, 0]; pt.life = pt.max = cfg.life || 1; pt.size = cfg.size || 2; pt.col = cfg.col || '#fff'; pt.g = cfg.g || 0; live.push(pt); },
      update: function (dt) { for (var i = live.length - 1; i >= 0; i--) { var pt = live[i]; pt.life -= dt; if (pt.life <= 0) { live.splice(i, 1); pool.push(pt); continue; } pt.v[1] += (pt.g || 0) * dt; pt.p[0] += pt.v[0] * dt; pt.p[1] += pt.v[1] * dt; } },
      draw: function (ctx) { for (var i = 0; i < live.length; i++) { var pt = live[i], a = pt.life / pt.max; ctx.globalAlpha = a; ctx.fillStyle = pt.col; ctx.beginPath(); ctx.arc(pt.p[0], pt.p[1], pt.size, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    };
  }

  // ── 카메라 (pan/zoom, 월드↔화면) ──────────────────────
  function camera(w, h) {
    var cam = { x: 0, y: 0, z: 1, w: w, h: h };
    cam.apply = function (ctx) { ctx.setTransform(cam.z, 0, 0, cam.z, w / 2 - cam.x * cam.z, h / 2 - cam.y * cam.z); };
    cam.reset = function (ctx, dpr) { ctx.setTransform(dpr || 1, 0, 0, dpr || 1, 0, 0); };
    cam.toWorld = function (sx, sy) { return [(sx - w / 2) / cam.z + cam.x, (sy - h / 2) / cam.z + cam.y]; };
    return cam;
  }

  // ── 격자 A* (창발 이동의 결정적 경로) ──────────────────
  function astar(walkable, cols, rows) {
    function key(x, y) { return x + ',' + y; }
    return function (sx, sy, tx, ty) {
      if (sx === tx && sy === ty) return [];
      var open = [{ x: sx, y: sy, g: 0, f: 0 }], came = new Map(), gs = new Map([[key(sx, sy), 0]]), seen = new Set();
      var H = function (x, y) { return Math.abs(x - tx) + Math.abs(y - ty); };
      while (open.length) {
        open.sort(function (a, b) { return a.f - b.f; }); var c = open.shift(); var ck = key(c.x, c.y);
        if (c.x === tx && c.y === ty) { var path = [], cur = ck; while (came.has(cur)) { var pp = cur.split(',').map(Number); path.unshift({ x: pp[0], y: pp[1] }); cur = came.get(cur); } return path; }
        if (seen.has(ck)) continue; seen.add(ck);
        var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (var i = 0; i < 4; i++) { var nx = c.x + dirs[i][0], ny = c.y + dirs[i][1]; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || !walkable(nx, ny)) continue; var nk = key(nx, ny), ng = c.g + 1; if (!gs.has(nk) || ng < gs.get(nk)) { gs.set(nk, ng); came.set(nk, ck); open.push({ x: nx, y: ny, g: ng, f: ng + H(nx, ny) }); } }
      }
      return null;
    };
  }

  // ── 글로우 (shadowBlur 로 빛번짐) ─────────────────────
  function glow(ctx, color, blur, drawFn) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; drawFn(); ctx.restore(); }

  // ── 팔레트 (시드 → 조화로운 HSL 세트) ──────────────────
  function palette(seed, n) {
    n = n || 5; var rnd = CM.rng ? CM.rng(seed) : Math.random, base = rnd() * 360, out = [];
    for (var i = 0; i < n; i++) { var h = (base + i * (360 / n) + rnd() * 12) % 360, s = 55 + rnd() * 25, l = 45 + rnd() * 20; out.push('hsl(' + h.toFixed(0) + ',' + s.toFixed(0) + '%,' + l.toFixed(0) + '%)'); }
    return out;
  }

  // ── 큐레이션 스킴 (design-brief 안티-슬롭: 무지개 금지, 절제 + 단일 액센트) ──
  // 각 스킴 = { bg:[상,하], cols:[주 색 3~4, analogous/듀오톤], accent:단일 강조 }
  var SCHEMES = {
    aurora: { bg: ['#0a0f1e', '#111a30'], cols: ['#34e0c4', '#4f7cf6', '#7c6cf0', '#3fb6e8'], accent: '#ffd166' },
    cyber:  { bg: ['#070a12', '#0d1424'], cols: ['#22d3ee', '#3b82f6', '#60a5fa', '#818cf8'], accent: '#f472b6' },
    ember:  { bg: ['#160c0b', '#241410'], cols: ['#f59e0b', '#fb7185', '#f9a8d4', '#fbbf24'], accent: '#fde68a' },
    mono:   { bg: ['#0b0e14', '#141b28'], cols: ['#8493ad', '#9fb0cc', '#657188', '#b6c6e4'], accent: '#22d3ee' }
  };
  function scheme(name) { return SCHEMES[name] || SCHEMES.aurora; }

  // ── 색 → rgba (hex/hsl 공통) ──────────────────────────
  function rgba(c, a) {
    if (!c) return 'rgba(0,0,0,' + a + ')';
    if (c[0] === '#') { var h = c.length === 4 ? c.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : c, n = parseInt(h.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
    if (c.indexOf('hsl') === 0) return c.replace('hsl(', 'hsla(').replace(')', ',' + a + ')');
    return c;
  }

  // ── 값싼 스프라이트 글로우 (shadowBlur 대체 — 10~100x 빠름) ──
  // makeGlow(color,r) → 오프스크린 캔버스(방사형 그라디언트) 1회 생성.
  // blit(ctx,x,y,scale?) 로 매 프레임 그린다(globalCompositeOperation='lighter' 권장).
  function makeGlow(color, r, inner) {
    var cv = document.createElement('canvas'); cv.width = cv.height = r * 2;
    var g = cv.getContext('2d'), grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, rgba(color, inner != null ? inner : 0.9));
    grad.addColorStop(0.35, rgba(color, (inner != null ? inner : 0.9) * 0.5));
    grad.addColorStop(1, rgba(color, 0));
    g.fillStyle = grad; g.fillRect(0, 0, r * 2, r * 2);
    var sprite = { canvas: cv, r: r, blit: function (ctx, x, y, s) { s = s || 1; var rr = r * s; ctx.drawImage(cv, x - rr, y - rr, rr * 2, rr * 2); } };
    return sprite;
  }

  // ── 아이소 3면 박스 (코어 iso 투영과 함께) ─────────────
  function isoBox(ctx, P, x, y, z, w, d, h, c) {
    function face(pts, fill) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
    face([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], c.l);
    face([P(x + w, y + d, z), P(x + w, y, z), P(x + w, y, z + h), P(x + w, y + d, z + h)], c.r);
    face([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], c.t);
  }

  root.CMX = {
    V: V, TAU: TAU,
    makeNoise: makeNoise, flowField: flowField,
    spatialHash: spatialHash, steer: steer, particles: particles,
    camera: camera, astar: astar, glow: glow, palette: palette, isoBox: isoBox,
    scheme: scheme, rgba: rgba, makeGlow: makeGlow,
    version: '0.2.0'
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.CMX;
})(typeof window !== 'undefined' ? window : this);
