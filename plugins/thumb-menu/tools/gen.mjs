// menu.json + 아래 썸네일 그림 → demos/thumbs.html (항목마다 1280×720 썸네일을 줄여 그린 실물 HTML)
// 실행: node plugins/thumb-menu/tools/gen.mjs   그다음 루트에서 node build.mjs
// 그림은 assets/ 의 우리 이미지(기티 클레이 렌더, 사람 없는 장면·물건 사진)만 쓴다. {{a:이름}} 은 build.mjs 가 바꿔 넣는다.
// 오른쪽 아래 「12:34」 는 유튜브 길이 표시 자리를 보여 주려고 일부러 그린다. 글 속 가격·숫자는 지어낸 예시다.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TP = join(HERE, '..');
const menu = JSON.parse(readFileSync(join(TP, 'menu.json'), 'utf8'));

const BASE = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Nanum+Pen+Script&display=swap">
<style>
  .tmw{--s:.3;width:calc(1280px*var(--s));height:calc(720px*var(--s));overflow:hidden;margin:12px auto;border-radius:8px;box-shadow:0 1px 0 #e2e0da,0 12px 26px rgba(23,23,27,.14)}
  .tm{position:relative;width:1280px;height:720px;overflow:hidden;background:#1b1b1f;transform:scale(var(--s));transform-origin:0 0;font-family:'Black Han Sans','Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#fff;word-break:keep-all}
  .tm *{box-sizing:border-box;margin:0}
  .tm .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .tm .cut{position:absolute;object-fit:contain}
  .tm .st{position:absolute;line-height:1.02;letter-spacing:-2px;color:#fff;-webkit-text-stroke:16px #111;paint-order:stroke fill;text-shadow:0 10px 0 rgba(0,0,0,.35)}
  .tm .dur{position:absolute;right:14px;bottom:14px;background:rgba(0,0,0,.82);color:#fff;font:600 30px/1 -apple-system,'Helvetica Neue',sans-serif;padding:6px 10px;border-radius:8px;letter-spacing:0}
  .tm .chip{position:absolute;font:800 34px/1 -apple-system,'Apple SD Gothic Neo',sans-serif;padding:10px 18px;border-radius:10px;letter-spacing:0}
  .tm .sys{font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-weight:800;letter-spacing:-1px}
  .tcap{color:#9a9aa4;font:11px/1.5 -apple-system,sans-serif;text-align:center;margin:0 12px 12px}
</style>`;

const A = n => `{{a:${n}}}`;
const bg = (n, s = '') => `<img class="bg" src="${A(n)}" alt="" style="${s}">`;
const cut = (n, s) => `<img class="cut" src="${A(n)}" alt="" style="${s}">`;
const st = (t, s) => `<div class="st" style="${s}">${t}</div>`;
const chip = (t, s) => `<span class="chip" style="${s}">${t}</span>`;
const DUR = '<span class="dur">12:34</span>';
const scrim = s => `<div style="position:absolute;inset:0;${s}"></div>`;
const OUT1 = 'filter:drop-shadow(8px 0 0 #fff) drop-shadow(-8px 0 0 #fff) drop-shadow(0 8px 0 #fff) drop-shadow(0 -8px 0 #fff) drop-shadow(0 14px 18px rgba(0,0,0,.35))';

const T = {
  'thirds': `${bg('sc-camp')}${scrim('background:linear-gradient(90deg,rgba(0,0,0,.45),rgba(0,0,0,0) 60%)')}
    <div style="position:absolute;inset:0;background:linear-gradient(90deg,transparent 426px,rgba(255,255,255,.55) 426px 429px,transparent 429px 852px,rgba(255,255,255,.55) 852px 855px,transparent 855px),linear-gradient(transparent 239px,rgba(255,255,255,.55) 239px 242px,transparent 242px 479px,rgba(255,255,255,.55) 479px 482px,transparent 482px)"></div>
    ${cut('giti-point', 'right:40px;top:150px;width:470px;height:470px;' + OUT1)}${st('혼캠<br>첫날', 'left:64px;top:110px;font-size:190px')}`,
  'split': `<img class="bg" src="${A('sc-cafe')}" alt="" style="width:50%"><img class="bg" src="${A('sc-street')}" alt="" style="left:50%;width:50%">
    <div style="position:absolute;left:636px;top:0;width:8px;height:720px;background:#fff"></div>
    ${chip('낮 카페', 'left:40px;top:40px;background:#fff;color:#111')}${chip('밤 골목', 'left:684px;top:40px;background:#111;color:#fff')}
    ${st('같은 동네', 'left:0;right:0;bottom:70px;text-align:center;font-size:120px')}`,
  'versus': `<div style="position:absolute;inset:0;background:#E8412C"></div><div style="position:absolute;inset:0;background:#2563EB;clip-path:polygon(58% 0,100% 0,100% 100%,42% 100%)"></div>
    ${cut('ob-ramen-a', 'left:40px;top:120px;width:480px;height:480px')}${cut('ob-ramen-b', 'right:40px;top:120px;width:480px;height:480px')}
    <div style="position:absolute;left:520px;top:240px;width:240px;height:240px;border-radius:50%;background:#FFD400;border:10px solid #111;display:flex;align-items:center;justify-content:center;font-size:130px;color:#111">VS</div>
    ${st('빨간 국물', 'left:70px;top:40px;font-size:96px')}${st('하얀 국물', 'right:90px;bottom:60px;font-size:96px')}`,
  'before-after': `<img class="bg" src="${A('sc-room-messy')}" alt="" style="width:50%;filter:saturate(.3) brightness(.8)"><img class="bg" src="${A('sc-room-clean')}" alt="" style="left:50%;width:50%">
    ${chip('BEFORE', 'left:40px;top:40px;background:#111;color:#fff')}${chip('AFTER', 'left:684px;top:40px;background:#FFD400;color:#111')}
    <svg width="200" height="140" viewBox="0 0 200 140" style="position:absolute;left:540px;top:290px"><path d="M10 50h110V10l70 60-70 60V90H10z" fill="#fff" stroke="#111" stroke-width="8" stroke-linejoin="round"/></svg>
    ${st('3일 정리', 'left:0;right:0;bottom:60px;text-align:center;font-size:120px')}`,
  'collage': `<div style="position:absolute;inset:0;background:#fff"></div>
    <img class="bg" src="${A('sc-cafe')}" alt="" style="width:636px;height:356px"><img class="bg" src="${A('sc-street')}" alt="" style="left:644px;width:636px;height:356px">
    <img class="bg" src="${A('sc-camp')}" alt="" style="top:364px;width:636px;height:356px"><img class="bg" src="${A('sc-kitchen')}" alt="" style="left:644px;top:364px;width:636px;height:356px">
    <div style="position:absolute;left:440px;top:290px;width:400px;height:140px;border-radius:70px;background:#fff;border:8px solid #111;display:flex;align-items:center;justify-content:center;font-size:84px;color:#111">하루 4곳</div>`,
  'framed-insets': `${bg('sc-street', 'filter:blur(10px) brightness(.55);transform:scale(1.08)')}
    <img class="cut" src="${A('sc-cafe')}" alt="" style="left:70px;top:80px;width:420px;height:280px;object-fit:cover;border:12px solid #fff;transform:rotate(-6deg);box-shadow:0 18px 30px rgba(0,0,0,.45)">
    <img class="cut" src="${A('sc-kitchen')}" alt="" style="left:120px;top:380px;width:380px;height:250px;object-fit:cover;border:12px solid #fff;transform:rotate(4deg);box-shadow:0 18px 30px rgba(0,0,0,.45)">
    <img class="cut" src="${A('sc-camp')}" alt="" style="left:830px;top:60px;width:390px;height:260px;object-fit:cover;border:12px solid #fff;transform:rotate(-3deg);box-shadow:0 18px 30px rgba(0,0,0,.45)">
    ${cut('giti-found', 'left:470px;top:170px;width:520px;height:520px;' + OUT1)}${st('10월 모음', 'left:780px;top:420px;font-size:100px')}`,
  'zoom-inset': `${bg('sc-desk')}
    <div style="position:absolute;left:330px;top:250px;width:180px;height:150px;border:10px solid #E8412C;border-radius:50%"></div>
    <svg width="1280" height="720" style="position:absolute;inset:0"><line x1="510" y1="320" x2="840" y2="300" stroke="#fff" stroke-width="8"/></svg>
    <div style="position:absolute;left:830px;top:110px;width:400px;height:400px;border-radius:50%;border:12px solid #fff;overflow:hidden;box-shadow:0 18px 30px rgba(0,0,0,.4)"><img src="${A('sc-desk')}" alt="" style="position:absolute;width:3200px;height:1800px;left:-850px;top:-650px;max-width:none"></div>
    ${st('여기 눌러', 'left:60px;top:40px;font-size:110px')}`,
  'screen-face': `<div style="position:absolute;inset:0;background:#20242c"></div>
    <div style="position:absolute;left:40px;top:120px;width:780px;height:500px;border-radius:24px;border:14px solid #0d0f13;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,.5)"><img src="${A('sc-desk')}" alt="" style="width:100%;height:100%;object-fit:cover"></div>
    ${cut('giti-think', 'right:20px;top:130px;width:560px;height:560px;' + OUT1)}${st('이거 몰랐지', 'left:50px;top:20px;font-size:96px;color:#FFD400')}`,
  'product-hero': `<div style="position:absolute;inset:0;background:radial-gradient(circle at 60% 55%,#FF8A3D,#7A2E12 70%)"></div>
    <div style="position:absolute;left:470px;top:560px;width:620px;height:60px;border-radius:50%;background:rgba(0,0,0,.35);filter:blur(14px)"></div>
    ${cut('ob-sneaker', 'left:400px;top:80px;width:760px;height:560px;transform:rotate(-12deg)')}${st('3주<br>신어 봄', 'left:60px;top:70px;font-size:130px')}`,
  'lineup': `<div style="position:absolute;inset:0;background:linear-gradient(#2b2f3a,#111)"></div>
    <div style="position:absolute;left:470px;top:520px;width:340px;height:200px;background:#FFD400;color:#111;font-size:120px;text-align:center;line-height:200px">1</div>
    <div style="position:absolute;left:110px;top:580px;width:320px;height:140px;background:#d7d7dc;color:#111;font-size:100px;text-align:center;line-height:140px">2</div>
    <div style="position:absolute;left:850px;top:610px;width:320px;height:110px;background:#c98a5a;color:#111;font-size:90px;text-align:center;line-height:110px">3</div>
    ${cut('giti-found', 'left:480px;top:160px;width:320px;height:380px')}${cut('giti-point', 'left:120px;top:280px;width:300px;height:320px')}${cut('giti-think', 'left:860px;top:330px;width:300px;height:300px')}
    ${st('최애 순위', 'left:0;right:0;top:30px;text-align:center;font-size:110px')}`,
  'cutout': `<div style="position:absolute;inset:0;background:#FFD400"></div>
    ${cut('giti-point', 'left:40px;top:60px;width:640px;height:640px;filter:drop-shadow(0 18px 20px rgba(0,0,0,.25))')}${st('이건<br>꼭 사', 'left:700px;top:150px;font-size:180px')}`,
  'sticker-outline': `${bg('sc-street')}${cut('giti-found', 'left:90px;top:110px;width:600px;height:600px;' + OUT1)}${st('골목<br>탐방', 'left:720px;top:140px;font-size:170px')}`,
  'rim-glow': `${bg('sc-street', 'filter:brightness(.35)')}${cut('giti-found', 'left:380px;top:90px;width:560px;height:560px;filter:drop-shadow(0 0 16px #FFE36E) drop-shadow(0 0 40px #FF9F1C)')}${st('찾았다', 'left:60px;top:50px;font-size:140px;color:#FFE36E')}`,
  'reaction-closeup': `${bg('sc-kitchen', 'filter:blur(6px) brightness(.8);transform:scale(1.06)')}${cut('giti-shock', 'right:-80px;top:-40px;width:820px;height:820px;' + OUT1)}${st('이게<br>된다고?', 'left:60px;top:140px;font-size:170px')}`,
  'gaze-lead': `<div style="position:absolute;inset:0;background:#E9F1FF"></div>${cut('giti-point', 'left:20px;top:90px;width:580px;height:580px;filter:drop-shadow(0 14px 18px rgba(0,0,0,.2))')}
    ${st('여기<br>봐 봐', 'left:640px;top:150px;font-size:190px;color:#2D6BFF;-webkit-text-stroke:16px #fff')}`,
  'layered-cutouts': `<div style="position:absolute;inset:0;background:linear-gradient(135deg,#7C5CFF,#FF6FB1)"></div>
    ${cut('giti-think', 'left:100px;top:120px;width:380px;height:380px;' + OUT1)}${cut('giti-cry', 'left:800px;top:110px;width:400px;height:400px;' + OUT1)}${cut('giti-shock', 'left:390px;top:80px;width:520px;height:520px;' + OUT1)}
    ${st('셋 다 반응이 달라', 'left:0;right:0;bottom:40px;text-align:center;font-size:100px')}`,
  'big-title': `${bg('sc-street')}${scrim('background:linear-gradient(90deg,rgba(0,0,0,.4),transparent 70%)')}${st('골목<br>야경', 'left:60px;top:70px;font-size:230px')}`,
  'caption-box': `${bg('sc-camp')}
    <div class="sys" style="position:absolute;left:60px;top:70px;background:#fff;color:#111;border:4px solid #111;padding:14px 22px;font-size:54px;transform:rotate(-3deg)">장작 3시간</div>
    <div class="sys" style="position:absolute;left:760px;top:120px;background:#fff;color:#111;border:4px solid #111;padding:14px 22px;font-size:54px;transform:rotate(2deg)">모기 50방</div>
    <div class="sys" style="position:absolute;left:120px;top:520px;background:#fff;color:#111;border:4px solid #111;padding:14px 22px;font-size:54px;transform:rotate(1deg)">그래도 또 감</div>
    ${st('솔캠?', 'left:500px;top:260px;font-size:200px')}`,
  'variety-caption': `${bg('sc-kitchen')}
    <div style="position:absolute;left:80px;top:180px;transform:rotate(-4deg)"><div style="font-size:150px;line-height:1.05;color:#fff;-webkit-text-stroke:40px #fff;paint-order:stroke fill;letter-spacing:-2px">김치찌개<br>장인?!</div>
    <div style="position:absolute;inset:0;font-size:150px;line-height:1.05;color:#FFE14D;-webkit-text-stroke:16px #111;paint-order:stroke fill;letter-spacing:-2px">김치찌개<br>장인?!</div></div>
    ${chip('첫 도전', 'left:90px;top:80px;background:#FF4F8B;color:#fff')}`,
  'big-number': `<div style="position:absolute;inset:0;background:#111"></div><img class="bg" src="${A('sc-desk')}" alt="" style="left:520px;width:760px;opacity:.55">
    <div style="position:absolute;left:60px;top:-60px;font-size:760px;line-height:1;color:#FFD400">5</div>${st('가지만<br>바꿔도', 'left:540px;top:200px;font-size:150px')}`,
  'question-hook': `${bg('sc-room-messy', 'filter:brightness(.75)')}${cut('giti-think', 'right:30px;top:200px;width:460px;height:460px;' + OUT1)}
    ${st('왜 맨날<br>이렇게 될까<span style="color:#FF4F8B">?</span>', 'left:60px;top:120px;font-size:140px')}`,
  'highlight-word': `${bg('sc-cafe', 'filter:brightness(.6)')}
    <div style="position:absolute;left:70px;top:150px;font-size:150px;line-height:1.2;letter-spacing:-2px">동네 카페<br><span style="background:#FFD400;color:#111;padding:0 18px">숨은</span> 맛집</div>`,
  'handwriting': `${bg('sc-cafe')}<div style="position:absolute;left:70px;top:450px;font-family:'Nanum Pen Script',cursive;font-size:150px;line-height:1;color:#fff;text-shadow:0 4px 14px rgba(0,0,0,.45)">오늘의 기록 :)</div>
    <svg width="560" height="40" style="position:absolute;left:80px;top:610px"><path d="M5 25 C 150 5, 300 35, 550 15" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/></svg>`,
  'bottom-band': `${bg('sc-camp')}<div style="position:absolute;left:0;right:0;bottom:0;height:220px;background:linear-gradient(transparent,rgba(0,0,0,.88))"></div>
    ${chip('EP.1', 'left:50px;bottom:120px;background:#FF7A1A;color:#fff')}<div style="position:absolute;left:50px;bottom:36px;font-size:84px">첫 솔캠, 비 오는 밤</div>
    <div style="position:absolute;right:0;bottom:0;width:300px;height:110px;border:4px dashed rgba(255,255,255,.7)"></div>`,
  'speech-bubble': `${bg('sc-desk', 'filter:brightness(.85)')}${cut('giti-think', 'left:20px;top:300px;width:420px;height:420px;' + OUT1)}
    <svg width="560" height="300" style="position:absolute;left:300px;top:60px"><ellipse cx="290" cy="120" rx="260" ry="110" fill="#fff" stroke="#111" stroke-width="8"/><path d="M150 200 L90 290 L220 215 Z" fill="#fff" stroke="#111" stroke-width="8" stroke-linejoin="round"/><rect x="140" y="190" width="100" height="30" fill="#fff"/></svg>
    <div class="sys" style="position:absolute;left:360px;top:140px;width:470px;text-align:center;font-size:60px;color:#111">이거 왜 안 돼…</div>${st('엑셀<br>첫날', 'right:60px;top:300px;font-size:150px')}`,
  'red-arrow': `${bg('sc-kitchen')}
    <svg width="560" height="380" viewBox="0 0 560 380" style="position:absolute;left:330px;top:40px"><path d="M40 60 C 220 40, 360 120, 420 250" fill="none" stroke="#fff" stroke-width="60" stroke-linecap="round"/><path d="M40 60 C 220 40, 360 120, 420 250" fill="none" stroke="#E8412C" stroke-width="44" stroke-linecap="round"/><path d="M340 230 L470 340 L500 180 Z" fill="#E8412C" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>
    ${st('이거<br>먼저', 'left:60px;top:300px;font-size:150px')}`,
  'circle-callout': `${bg('sc-desk')}<div style="position:absolute;left:120px;top:140px;width:300px;height:260px;border:14px solid #E8412C;border-radius:52% 48% 50% 46%;transform:rotate(-8deg);box-shadow:0 0 0 4px rgba(255,255,255,.6)"></div>
    ${st('이게<br>핵심', 'left:760px;top:120px;font-size:170px')}`,
  'stickers': `${bg('sc-cafe')}${cut('giti-found', 'left:420px;top:150px;width:520px;height:520px;' + OUT1)}
    <svg width="120" height="120" viewBox="0 0 24 24" style="position:absolute;left:320px;top:150px"><path d="M12 2l3 7 7 .6-5.3 4.6 1.7 7.3L12 17.8 5.6 21.5l1.7-7.3L2 9.6 9 9z" fill="#FFD400" stroke="#fff" stroke-width="1.6"/></svg>
    <svg width="90" height="90" viewBox="0 0 24 24" style="position:absolute;left:940px;top:120px"><path d="M12 2l3 7 7 .6-5.3 4.6 1.7 7.3L12 17.8 5.6 21.5l1.7-7.3L2 9.6 9 9z" fill="#FFD400" stroke="#fff" stroke-width="1.6"/></svg>
    <svg width="120" height="110" viewBox="0 0 24 22" style="position:absolute;left:960px;top:420px"><path d="M12 21s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12z" fill="#FF4F8B" stroke="#fff" stroke-width="1.6"/></svg>
    <div class="sys" style="position:absolute;left:60px;top:50px;width:190px;height:190px;border-radius:50%;background:#FF4F8B;border:8px solid #fff;display:flex;align-items:center;justify-content:center;font-size:60px;transform:rotate(-12deg)">NEW</div>`,
  'blur-reveal': `${bg('sc-room-clean')}<div style="position:absolute;left:360px;top:140px;width:560px;height:420px;backdrop-filter:blur(26px);-webkit-backdrop-filter:blur(26px);background:rgba(255,255,255,.15);border-radius:20px"></div>
    <div style="position:absolute;left:560px;top:190px;font-size:300px;line-height:1;color:#fff;-webkit-text-stroke:14px #111;paint-order:stroke fill">?</div>${st('1년 뒤 내 방', 'left:40px;top:30px;font-size:110px')}`,
  'price-tag': `<div style="position:absolute;inset:0;background:#EAF4EF"></div>${cut('ob-sneaker', 'left:150px;top:90px;width:760px;height:560px;transform:rotate(-8deg)')}
    <div style="position:absolute;left:830px;top:90px;transform:rotate(10deg)"><div class="sys" style="background:#FFD400;color:#111;font-size:76px;padding:24px 40px 24px 70px;clip-path:polygon(40px 0,100% 0,100% 100%,40px 100%,0 50%)">89,000원</div><div style="position:absolute;left:28px;top:50%;width:22px;height:22px;margin-top:-11px;border-radius:50%;background:#EAF4EF"></div></div>
    <span class="chip" style="right:60px;top:250px;background:transparent;color:#5c6670;font-size:26px">가격은 예시</span>`,
  'burst-lines': `<div style="position:absolute;inset:-200px;background:repeating-conic-gradient(from 0deg at 50% 50%,#FFD400 0deg 7deg,#FFF6C2 7deg 14deg)"></div>${cut('giti-shock', 'left:360px;top:110px;width:560px;height:610px;' + OUT1)}${st('대박', 'left:0;right:0;top:20px;text-align:center;font-size:150px')}`,
  'solid-backdrop': `<div style="position:absolute;inset:0;background:#2D6BFF"></div>${cut('ob-sneaker', 'left:560px;top:120px;width:680px;height:500px;transform:rotate(-10deg)')}${st('운동화<br>하나로', 'left:60px;top:150px;font-size:150px')}`,
  'bg-blur': `${bg('sc-street', 'filter:blur(9px);transform:scale(1.06)')}${cut('giti-point', 'left:60px;top:120px;width:560px;height:560px;' + OUT1)}${st('야시장<br>투어', 'left:640px;top:170px;font-size:170px')}`,
  'color-pop': `${bg('sc-street', 'filter:grayscale(1) brightness(.85)')}${cut('giti-found', 'left:380px;top:110px;width:540px;height:540px;filter:drop-shadow(0 16px 20px rgba(0,0,0,.4))')}${st('나만 컬러', 'left:60px;top:40px;font-size:120px;color:#FF7A1A')}`,
  'complementary': `<div style="position:absolute;inset:0;background:#1E4FD8"></div>${cut('giti-found', 'left:690px;top:110px;width:560px;height:560px;filter:drop-shadow(0 16px 20px rgba(0,0,0,.35))')}${st('파랑 위<br>주황', 'left:70px;top:150px;font-size:170px;color:#FF7A1A;-webkit-text-stroke:16px #0B1F5C')}`,
  'spotlight': `${bg('sc-kitchen')}<div style="position:absolute;inset:0;background:radial-gradient(circle 300px at 1040px 470px,transparent 40%,rgba(0,0,0,.82) 100%)"></div>${st('5분<br>찌개', 'left:60px;top:80px;font-size:170px')}`,
  'episode-badge': `${bg('sc-camp')}${chip('EP.03', 'left:40px;top:40px;background:#FF7A1A;color:#fff;font-size:44px;border-radius:14px')}${st('비 오는<br>솔캠', 'left:50px;top:170px;font-size:170px')}`,
  'series-template': `<div style="position:absolute;inset:0;background:#E9E7E1"></div>
    ${[['sc-camp', 'EP.01', '첫 솔캠'], ['sc-kitchen', 'EP.02', '캠핑 요리'], ['sc-street', 'EP.03', '밤 골목']].map(([n, e, t], i) => `<div style="position:absolute;left:${48 + i * 404}px;top:210px;width:380px;height:214px;overflow:hidden;border-radius:10px;box-shadow:0 10px 20px rgba(0,0,0,.18)">
      <img src="${A(n)}" alt="" style="position:absolute;left:0;top:0;width:228px;height:214px;object-fit:cover"><div style="position:absolute;left:228px;top:0;right:0;bottom:0;background:#FFD400;color:#111;font-size:40px;line-height:1.1;padding:60px 14px 0">${t}</div>
      <span style="position:absolute;left:10px;top:10px;background:#FF7A1A;color:#fff;font:800 18px -apple-system,sans-serif;padding:4px 8px;border-radius:6px">${e}</span></div>`).join('')}
    <div class="sys" style="position:absolute;left:0;right:0;top:80px;text-align:center;font-size:56px;color:#111">사진과 글만 바꾸고 틀은 그대로</div>`,
  'corner-mark': `${bg('sc-cafe')}<div style="position:absolute;left:32px;top:32px;width:84px;height:84px;border-radius:50%;background:#fff;overflow:hidden;border:5px solid #F05032"><img src="${A('giti-found')}" alt="" style="width:120%;margin:-6px 0 0 -8px"></div>
    <span class="chip" style="left:130px;top:52px;background:rgba(0,0,0,.6);color:#fff;font-size:30px">기티로그</span>${st('카페<br>탐방', 'left:60px;top:250px;font-size:170px')}
    <div style="position:absolute;right:0;bottom:0;width:240px;height:90px;border:4px dashed #FFD400"></div><span class="chip" style="right:24px;bottom:110px;background:#111;color:#FFD400;font-size:24px">길이 표시 자리</span>`,
  'shorts-cover': `<div style="position:absolute;inset:0;background:#E9E7E1"></div>
    <div style="position:absolute;left:437px;top:0;width:405px;height:720px;overflow:hidden;background:#111"><img src="${A('sc-street')}" alt="" style="position:absolute;left:-330px;top:0;height:720px;width:auto;max-width:none">
      ${cut('giti-shock', 'left:20px;top:250px;width:370px;height:370px;' + OUT1)}${st('야시장<br>첫 입', 'left:0;right:0;top:50px;text-align:center;font-size:84px;-webkit-text-stroke:10px #111')}
      <div style="position:absolute;left:0;right:0;bottom:0;height:200px;border-top:4px dashed #FFD400;background:rgba(0,0,0,.35)"></div><span class="sys" style="position:absolute;left:0;right:0;bottom:80px;text-align:center;font-size:24px;color:#FFD400">제목과 버튼이 덮는 자리</span></div>
    <div class="sys" style="position:absolute;left:40px;top:300px;width:360px;font-size:44px;color:#111;line-height:1.2">9:16<br><span style="font-size:28px;color:#5c6670">1080×1920</span></div>`,
};

const NODUR = new Set(['shorts-cover', 'series-template', 'bottom-band', 'corner-mark']);
const miss = menu.items.filter(i => !T[i.id]).map(i => i.id), extra = Object.keys(T).filter(id => !menu.items.some(i => i.id === id));
if (miss.length || extra.length) { console.error('썸네일 그림과 menu.json 이 어긋남:', miss, extra); process.exit(1); }
const frag = it => `<!-- @${it.id} h=244 -->
${BASE}
<div class="tmw"><div class="tm" role="img" aria-label="${it.name.ko} 썸네일 견본">${T[it.id]}${NODUR.has(it.id) && it.id !== 'bottom-band' && it.id !== 'corner-mark' ? '' : DUR}</div></div>
<p class="tcap">${it.name.ko} · 1280×720 견본. 오른쪽 아래 12:34 는 유튜브 길이 표시 자리예요.</p>`;
const out = `<!-- 생성물: tools/gen.mjs 가 menu.json 과 썸네일 그림으로 만든다. 여기를 직접 고치지 않는다 -->
${menu.items.map(frag).join('\n\n')}
`;
mkdirSync(join(TP, 'demos'), { recursive: true });
writeFileSync(join(TP, 'demos', 'thumbs.html'), out);
console.log(`demos/thumbs.html: ${menu.items.length}장 · ${(out.length / 1024).toFixed(0)}KB`);
