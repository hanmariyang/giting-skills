#!/usr/bin/env node
/* build.mjs — assemble the self-contained HTML deliverables from the source assets.
 * SSOT = assets/*.js|*.css. Generated (committed): skeleton.html, examples/demo.html,
 * md-editor.html. Each output inlines the engine so it runs with zero dependencies.
 * Run: node build.mjs   (also `node build.mjs --check` to verify outputs are current)
 * Giting edit-doc. MIT. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const A = (f) => fs.readFileSync(path.join(DIR, 'assets', f), 'utf8');

const editorCss = A('doc-editor.css');
const saveEngine = A('save-engine.js');
const docEditor = A('doc-editor.js');
const mdRender = A('md-render.js');
const mdApp = A('md-editor-app.js');

// shared editor UI blocks for HTML documents
const EDITOR_UI = `
  <div id="ed-bar" class="ed-bar" hidden aria-label="서식 도구">
    <select id="ed-block" title="문단 형식"><option value="" selected>형식</option><option value="p">본문</option><option value="h1">제목 1</option><option value="h2">제목 2</option><option value="h3">제목 3</option><option value="blockquote">인용</option></select>
    <span class="sep"></span>
    <button type="button" data-cmd="bold" title="굵게 (Cmd/Ctrl+B)"><b>B</b></button>
    <button type="button" data-cmd="italic" title="기울임"><i>I</i></button>
    <button type="button" data-cmd="underline" title="밑줄"><u>U</u></button>
    <button type="button" data-cmd="strikeThrough" title="취소선"><s>S</s></button>
    <span class="sep"></span>
    <button type="button" data-cmd="insertUnorderedList" title="글머리 목록">• 목록</button>
    <button type="button" data-cmd="insertOrderedList" title="번호 목록">1. 목록</button>
    <span class="sep"></span>
    <button type="button" data-cmd="justifyLeft" title="왼쪽 정렬">⬅</button>
    <button type="button" data-cmd="justifyCenter" title="가운데 정렬">↔</button>
    <button type="button" data-cmd="justifyRight" title="오른쪽 정렬">➡</button>
    <span class="sep"></span>
    <select id="ed-fontsize" title="글자 크기"><option value="3" selected>크기</option><option value="1">아주 작게</option><option value="2">작게</option><option value="3">보통</option><option value="5">크게</option><option value="6">아주 크게</option><option value="7">최대</option></select>
    <span class="lab">색</span><input type="color" id="ed-forecolor" value="#1c1c22" title="글자색">
    <span class="lab">배경</span><input type="color" id="ed-backcolor" value="#ffff88" title="형광펜">
    <span class="sep"></span>
    <button type="button" id="ed-link" title="링크">🔗</button>
    <button type="button" id="ed-table" title="표 넣기">▦</button>
  </div>
  <div class="ed-controls">
    <button type="button" id="ed-toggle" title="편집/보기 (Cmd/Ctrl+E)">편집</button>
    <button type="button" id="ed-save" class="ed-primary" title="저장 (Cmd/Ctrl+S)">저장</button>
    <button type="button" id="ed-saveas" title="다른 이름으로 저장">다른 이름</button>
    <button type="button" id="ed-export" title="편집기 없는 배포용 사본">배포용</button>
  </div>
  <div id="ed-toast" class="ed-toast"></div>
  <div id="ed-restore" class="ed-restore" hidden>
    <b>저장하지 않은 자동저장 백업이 있습니다</b>
    <span class="ed-when" id="ed-restore-when"></span>
    <div class="ed-row"><button type="button" class="ed-primary" id="ed-restore-yes">백업 불러오기</button><button type="button" id="ed-restore-no">무시</button></div>
  </div>`;

const HTML_ENGINE = `<style id="ed-editor-style">\n${editorCss}\n</style>`;
const HTML_SCRIPT = `<script id="ed-editor-script">\n${saveEngine}\n${docEditor}\n</script>`;

function htmlDoc({ lang = 'ko', title, docStyle, body, metaId }) {
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style id="doc-style">
${docStyle}
</style>
${HTML_ENGINE}
</head>
<body>
<main id="doc-content" contenteditable="false">
${body}
</main>
${EDITOR_UI}
<script type="application/json" id="doc-meta">{"id":"${metaId}"}</script>
${HTML_SCRIPT}
</body>
</html>
`;
}

const DOC_STYLE = `:root{--fg:#1c1c22;--mut:#55555f;--bg:#fff;--rule:#e6e6ec;--accent:#5b5bd6}
@media(prefers-color-scheme:dark){:root{--fg:#e8e8ee;--mut:#a0a0aa;--bg:#16161a;--rule:#2a2a32;--accent:#9b9bf0}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg)}
#doc-content{max-width:48rem;margin:3.2rem auto 5rem;padding:0 1.4rem;font:17px/1.75 -apple-system,BlinkMacSystemFont,"Segoe UI","Pretendard",system-ui,sans-serif;word-break:keep-all}
#doc-content h1{font-size:2rem;line-height:1.25;margin:0 0 .3em;font-weight:800;letter-spacing:-.01em}
#doc-content h2{font-size:1.4rem;margin:2em 0 .4em;font-weight:700}
#doc-content h3{font-size:1.15rem;margin:1.6em 0 .3em;font-weight:700}
#doc-content p{margin:0 0 1em}
#doc-content a{color:var(--accent)}
#doc-content blockquote{border-left:3px solid var(--accent);margin:1.2em 0;padding:.3em 1.1em;color:var(--mut)}
#doc-content ul,#doc-content ol{margin:0 0 1em;padding-left:1.4em}
#doc-content li{margin:.2em 0}
#doc-content hr{border:0;border-top:1px solid var(--rule);margin:2em 0}
#doc-content table{border-collapse:collapse;width:100%;margin:1.2em 0}
#doc-content th,#doc-content td{border:1px solid var(--rule);padding:.5em .7em;text-align:left}
#doc-content .lead{font-size:1.15rem;color:var(--mut)}`;

// 1) skeleton — the golden template to copy for a NEW document
fs.writeFileSync(path.join(DIR, 'skeleton.html'), htmlDoc({
  title: '새 문서',
  docStyle: DOC_STYLE,
  metaId: 'REPLACE-WITH-UNIQUE-ID',
  body: `<h1>문서 제목</h1>
<p class="lead">여기에 소개 문장을 씁니다. 오른쪽 아래 <b>편집</b>을 누르면 브라우저에서 바로 고칠 수 있습니다.</p>
<h2>첫 번째 섹션</h2>
<p>본문을 씁니다. 굵게, 기울임, 목록, 표, 링크, 색을 위 도구 막대에서 적용합니다.</p>`
}));

// 2) demo — a filled example
fs.writeFileSync(path.join(DIR, 'examples', 'demo.html'), htmlDoc({
  title: 'edit-doc 예시 문서',
  docStyle: DOC_STYLE,
  metaId: 'demo-edit-doc',
  body: `<h1>브라우저에서 고치는 문서</h1>
<p class="lead">이 파일은 편집기를 품고 다닙니다. 서버도, 확장 프로그램도, 로그인도 필요 없습니다. 열어서 <b>편집 → 저장</b>이면 끝입니다.</p>
<h2>무엇이 되나요</h2>
<ul><li>글자 서식 (굵게·기울임·색·형광펜·크기)</li><li>제목·인용·목록·표·링크</li><li>파일로 저장 (지원 브라우저는 같은 파일로 다시 저장)</li><li>자동저장 백업과 복원</li><li>편집기 없는 배포용 사본 내보내기</li></ul>
<h2>저장은 세 가지</h2>
<p><b>저장</b>은 파일에 씁니다. <b>다른 이름</b>은 새 파일을 고릅니다. <b>배포용</b>은 편집기를 뺀 깨끗한 사본을 내려받습니다.</p>
<blockquote>보고서·안내문·레터처럼 "한 파일로 주고받되 받는 쪽이 살짝 고칠 수 있으면 좋겠는" 문서에 맞습니다.</blockquote>`
}));

// 3) md-editor — the standalone Markdown editor tool
const MD_CSS = `:root{--fg:#1c1c22;--mut:#6b6b76;--bg:#fff;--panel:#fafafb;--rule:#e6e6ec;--accent:#5b5bd6;--code:#f4f4f6}
@media(prefers-color-scheme:dark){:root{--fg:#e8e8ee;--mut:#a0a0aa;--bg:#16161a;--panel:#1c1c22;--rule:#2a2a32;--accent:#9b9bf0;--code:#26262c}}
*{box-sizing:border-box}html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Pretendard",system-ui,sans-serif;display:flex;flex-direction:column}
header{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 12px;border-bottom:1px solid var(--rule);background:var(--panel)}
header .ttl{font-weight:700;margin-right:auto;max-width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
header button{appearance:none;border:1px solid var(--rule);background:var(--bg);color:var(--fg);height:30px;padding:0 10px;border-radius:7px;cursor:pointer;font:inherit}
header button:hover{background:var(--rule)}
header button.on{background:var(--accent);color:#fff;border-color:transparent}
header .primary{background:var(--accent);color:#fff;border-color:transparent}
header .sep{width:1px;height:20px;background:var(--rule);margin:0 3px}
header .stats{color:var(--mut);font-size:12px;margin-left:4px}
main{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr}
#md-src{border:0;outline:0;resize:none;padding:20px;font:14px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--bg);color:var(--fg);width:100%;height:100%}
.pv{overflow:auto;padding:20px 24px;border-left:1px solid var(--rule);background:var(--panel)}
body[data-view="source"] main{grid-template-columns:1fr}body[data-view="source"] .pv{display:none}
body[data-view="preview"] main{grid-template-columns:1fr}body[data-view="preview"] #md-src{display:none}body[data-view="preview"] .pv{border-left:0}
#md-preview{max-width:44rem}
#md-preview h1{font-size:1.8rem;margin:.2em 0 .4em}#md-preview h2{font-size:1.35rem;margin:1.4em 0 .3em}#md-preview h3{font-size:1.12rem}
#md-preview p{margin:0 0 1em;line-height:1.7}#md-preview a{color:var(--accent)}
#md-preview pre{background:var(--code);padding:1em;border-radius:8px;overflow:auto}#md-preview code{font-family:ui-monospace,monospace}
#md-preview blockquote{border-left:3px solid var(--accent);margin:1em 0;padding:.2em 1em;color:var(--mut)}
#md-preview table{border-collapse:collapse}#md-preview th,#md-preview td{border:1px solid var(--rule);padding:.4em .7em}
#md-preview img{max-width:100%}#md-preview hr{border:0;border-top:1px solid var(--rule);margin:2em 0}
.md-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(12px);background:#1c1c22;color:#fff;padding:10px 16px;border-radius:10px;opacity:0;pointer-events:none;transition:.2s;z-index:50}
@media(prefers-color-scheme:dark){.md-toast{background:#f0f0f4;color:#1c1c22}}
.md-toast.show{opacity:1;transform:translateX(-50%)}
.md-restore{position:fixed;left:16px;bottom:16px;background:var(--panel);border:1px solid var(--rule);border-radius:12px;padding:14px 16px;box-shadow:0 6px 24px rgba(0,0,0,.16);z-index:40;max-width:min(92vw,360px)}
.md-restore[hidden]{display:none}.md-restore b{display:block;margin-bottom:4px}.md-restore .w{color:var(--mut);font-size:12px}
.md-restore .row{display:flex;gap:8px;margin-top:10px}.md-restore button{border:1px solid var(--rule);background:var(--bg);color:var(--fg);padding:7px 12px;border-radius:8px;cursor:pointer}
.md-restore .primary{background:var(--accent);color:#fff;border-color:transparent}
@media(max-width:720px){main{grid-template-columns:1fr}body:not([data-view="preview"]) .pv{display:none}header .ttl{max-width:100%;order:-1;width:100%}}`;

const SAMPLE_MD = `# 제목을 여기에

**edit-md** 는 마크다운을 왼쪽에서 쓰고 오른쪽에서 바로 봅니다. \`Cmd/Ctrl+S\` 로 \`.md\` 파일에 저장합니다.

## 되는 것

- 굵게, *기울임*, \`인라인 코드\`, ~~취소선~~
- 목록, 번호 목록, 인용, 구분선
- 링크와 이미지, 표

> 열기 → 고치기 → 저장. 지원 브라우저는 같은 파일로 다시 저장합니다.

| 기능 | 단축키 |
| --- | --- |
| 저장 | Cmd/Ctrl+S |
| 열기 | Cmd/Ctrl+O |
| 굵게 | Cmd/Ctrl+B |
`;

const mdHtml = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Markdown 편집기 · edit-md</title>
<style>
${MD_CSS}
</style>
</head>
<body data-view="split">
<header>
  <span class="ttl" id="md-title">document</span>
  <button type="button" id="md-bold" title="굵게"><b>B</b></button>
  <button type="button" id="md-italic" title="기울임"><i>I</i></button>
  <button type="button" id="md-h" title="제목">H</button>
  <button type="button" id="md-ul" title="목록">•</button>
  <button type="button" id="md-ol" title="번호 목록">1.</button>
  <button type="button" id="md-quote" title="인용">❝</button>
  <button type="button" id="md-code" title="코드">&lt;/&gt;</button>
  <button type="button" id="md-link" title="링크">🔗</button>
  <span class="sep"></span>
  <button type="button" id="md-view-split" title="분할">◫</button>
  <button type="button" id="md-view-source" title="소스만">☰</button>
  <button type="button" id="md-view-preview" title="미리보기만">👁</button>
  <span class="sep"></span>
  <button type="button" id="md-open" title="열기 (Cmd/Ctrl+O)">열기</button>
  <button type="button" id="md-save" class="primary" title="저장 (Cmd/Ctrl+S)">저장</button>
  <button type="button" id="md-saveas" title="다른 이름으로">다른 이름</button>
  <button type="button" id="md-exporthtml" title="HTML로 내보내기">HTML</button>
  <span class="stats" id="md-stats"></span>
</header>
<main>
  <textarea id="md-src" spellcheck="false">${SAMPLE_MD.replace(/</g, '&lt;')}</textarea>
  <div class="pv"><article id="md-preview"></article></div>
</main>
<div id="md-toast" class="md-toast"></div>
<div id="md-restore" class="md-restore" hidden>
  <b>저장하지 않은 자동저장 백업이 있습니다</b><span class="w" id="md-restore-when"></span>
  <div class="row"><button type="button" class="primary" id="md-restore-yes">불러오기</button><button type="button" id="md-restore-no">무시</button></div>
</div>
<script>
${saveEngine}
${mdRender}
${mdApp}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(DIR, 'md-editor.html'), mdHtml);

console.log('built: skeleton.html · examples/demo.html · md-editor.html');
