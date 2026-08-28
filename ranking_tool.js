/* =========================================================
 * 제철밥상 인기상품 랭킹 툴 (북마클릿 버전) v2.0
 * - jecheolbabsang.com 위에서 실행 (같은 오리진 fetch 활용)
 * - 상품코드 → 상품명/썸네일 자동 로드
 * - 썸네일 저장: 600x600 JPEG 리사이즈 → GitHub jwbm-assets/ranking/<코드>.jpg 커밋
 *   → jsDelivr 캐시 퍼지 → 썸네일 경로 자동 세팅
 * v2.1: 위젯 제목(헤더 문구) 입력 필드 추가
 * v2.2: GIF 지원 - GIF는 리사이즈 없이 원본 그대로 <코드>.gif로 저장 (움직임 유지)
 * ========================================================= */
(function () {
    'use strict';

    // 이미 열려 있으면 다시 표시만
    var existing = document.getElementById('jbRankTool');
    if (existing) { existing.style.display = 'block'; return; }

    var RANKS = 5;
    var LINK_PREFIX = '/Goods/Detail/';
    var IMG_PREFIX = 'https://cdn.jsdelivr.net/gh/lynn03351/jwbm-assets@main/';
    var GH_OWNER = 'lynn03351';
    var GH_REPO = 'jwbm-assets';
    var GH_BRANCH = 'main';
    var GH_DIR = 'ranking';
    var TOKEN_KEY = 'jbRankGhToken';
    var MAX_SIZE = 600;
    var JPEG_QUALITY = 0.85;
    var PREVIEW_WIDTH = 160;
    var DEFAULT_WIDGET_TITLE = '오늘의 인기상품 TOP 5';

    /* ---------------- 텍스트 측정 (자동 줄바꿈) ---------------- */
    var measureCanvas = document.createElement('canvas');
    var measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = '700 17.6px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    function measureTextWidth(text) { return measureCtx.measureText(text).width; }

    function autoLineBreak(text) {
        var lines = text.split('\n');
        var result = [];
        for (var li = 0; li < lines.length; li++) {
            var line = lines[li];
            var current = '';
            for (var ci = 0; ci < line.length; ci++) {
                var ch = line[ci];
                var test = current + ch;
                if (measureTextWidth(test) > PREVIEW_WIDTH && current.length > 0) {
                    result.push(current);
                    current = ch;
                } else {
                    current = test;
                }
            }
            if (current) result.push(current);
        }
        return result;
    }

    /* ---------------- 패널 UI ---------------- */
    var css = ''
        + '#jbRankTool{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,0.45);overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}'
        + '#jbRankTool *{margin:0;padding:0;box-sizing:border-box;font-family:inherit;line-height:1.4;}'
        + '#jbRankTool .jbrt-wrap{max-width:680px;margin:24px auto;background:#f0f2f5;border-radius:16px;padding:24px 16px;position:relative;}'
        + '#jbRankTool .jbrt-close{position:absolute;top:14px;right:14px;width:32px;height:32px;border:none;border-radius:50%;background:#ddd;color:#555;font-size:16px;font-weight:800;cursor:pointer;}'
        + '#jbRankTool .jbrt-close:hover{background:#ccc;}'
        + '#jbRankTool h1{font-size:20px;font-weight:800;color:#222;margin-bottom:16px;}'
        + '#jbRankTool h1 span{color:#ff6b6b;}'
        /* 토큰 설정 */
        + '#jbRankTool .jbrt-token-card{background:#e6f4ff;border:1.5px solid #91caff;border-radius:12px;padding:12px 16px;margin-bottom:14px;}'
        + '#jbRankTool .jbrt-token-head{display:flex;justify-content:space-between;align-items:center;cursor:pointer;user-select:none;}'
        + '#jbRankTool .jbrt-token-title{font-size:13px;font-weight:700;color:#0958d9;}'
        + '#jbRankTool .jbrt-token-state{font-size:12px;font-weight:700;}'
        + '#jbRankTool .jbrt-token-state.ok{color:#389e0d;}'
        + '#jbRankTool .jbrt-token-state.no{color:#cf1322;}'
        + '#jbRankTool .jbrt-token-body{display:none;margin-top:10px;}'
        + '#jbRankTool .jbrt-token-body.open{display:block;}'
        + '#jbRankTool .jbrt-token-row{display:flex;gap:8px;}'
        + '#jbRankTool .jbrt-token-row input{flex:1;border:1px solid #91caff;border-radius:8px;padding:8px 10px;font-size:13px;outline:none;background:#fff;}'
        + '#jbRankTool .jbrt-btn-blue{padding:8px 14px;background:#1677ff;border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;}'
        + '#jbRankTool .jbrt-btn-gray{padding:8px 14px;background:#999;border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;}'
        + '#jbRankTool .jbrt-token-hint{font-size:11px;color:#0958d9;margin-top:6px;}'
        /* 위젯 제목 */
        + '#jbRankTool .jbrt-wtitle-card{background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,0.08);}'
        /* 불러오기 */
        + '#jbRankTool .jbrt-import-card{background:#fffbe6;border:1.5px solid #ffe58f;border-radius:12px;padding:16px;margin-bottom:16px;}'
        + '#jbRankTool .jbrt-import-title{font-size:13px;font-weight:700;color:#ad6800;margin-bottom:8px;}'
        + '#jbRankTool .jbrt-import-area{width:100%;height:70px;border:1px solid #ffd666;border-radius:8px;padding:8px 10px;font-size:12px;resize:vertical;background:#fff;font-family:monospace;}'
        + '#jbRankTool .jbrt-import-btn{margin-top:8px;padding:6px 16px;background:#faad14;border:none;border-radius:6px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;}'
        + '#jbRankTool .jbrt-import-hint{font-size:11px;color:#ad6800;margin-top:6px;}'
        /* 상품 카드 */
        + '#jbRankTool .jbrt-card{background:#fff;border-radius:12px;padding:18px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.08);}'
        + '#jbRankTool .jbrt-card.dragging{opacity:0.5;}'
        + '#jbRankTool .jbrt-card.drag-over{border:2px dashed #ff6b6b;}'
        + '#jbRankTool .jbrt-card-header{display:flex;align-items:center;gap:10px;margin-bottom:14px;cursor:grab;user-select:none;}'
        + '#jbRankTool .jbrt-drag-handle{color:#ccc;font-size:20px;}'
        + '#jbRankTool .jbrt-badge{font-size:15px;font-weight:500;color:#111;}'
        + '#jbRankTool .jbrt-badge .jbrt-top{font-weight:500;opacity:0.7;margin-right:1px;}'
        + '#jbRankTool .jbrt-card-title{font-size:15px;font-weight:700;color:#333;}'
        + '#jbRankTool .jbrt-fields{display:flex;flex-direction:column;gap:12px;}'
        + '#jbRankTool .jbrt-field label{display:block;font-size:12px;font-weight:600;color:#888;margin-bottom:4px;}'
        + '#jbRankTool .jbrt-field input{width:100%;border:1px solid #e0e0e0;border-radius:8px;padding:8px 10px;font-size:14px;outline:none;}'
        + '#jbRankTool .jbrt-field input:focus{border-color:#ff6b6b;}'
        + '#jbRankTool .jbrt-hint{font-size:11px;color:#bbb;margin-top:3px;}'
        + '#jbRankTool .jbrt-code-row{display:flex;gap:8px;align-items:stretch;}'
        + '#jbRankTool .jbrt-code-box{flex:1;display:flex;align-items:center;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;}'
        + '#jbRankTool .jbrt-code-box:focus-within{border-color:#ff6b6b;}'
        + '#jbRankTool .jbrt-code-prefix{padding:8px 10px;background:#f5f5f5;font-size:12px;color:#999;white-space:nowrap;border-right:1px solid #e0e0e0;}'
        + '#jbRankTool .jbrt-code-box input{border:none;border-radius:0;flex:1;padding:8px 10px;font-size:14px;outline:none;}'
        + '#jbRankTool .jbrt-load-btn{padding:0 14px;background:#ff6b6b;border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;}'
        + '#jbRankTool .jbrt-load-btn:hover{background:#ee5a24;}'
        + '#jbRankTool .jbrt-load-btn:disabled{background:#ccc;cursor:default;}'
        + '#jbRankTool .jbrt-thumb-block{display:flex;gap:12px;align-items:flex-start;}'
        + '#jbRankTool .jbrt-thumb-preview{width:96px;height:96px;border-radius:8px;background:#f5f5f5;overflow:hidden;flex-shrink:0;border:1px solid #eee;display:flex;align-items:center;justify-content:center;}'
        + '#jbRankTool .jbrt-thumb-preview img{width:100%;height:100%;object-fit:cover;display:none;}'
        + '#jbRankTool .jbrt-thumb-side{flex:1;display:flex;flex-direction:column;gap:8px;}'
        + '#jbRankTool .jbrt-save-btn{padding:9px 14px;background:#52c41a;border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;align-self:flex-start;}'
        + '#jbRankTool .jbrt-save-btn:hover{background:#389e0d;}'
        + '#jbRankTool .jbrt-save-btn:disabled{background:#ccc;cursor:default;}'
        + '#jbRankTool .jbrt-status{font-size:12px;font-weight:600;min-height:16px;}'
        + '#jbRankTool .jbrt-status.ok{color:#389e0d;}'
        + '#jbRankTool .jbrt-status.err{color:#cf1322;}'
        + '#jbRankTool .jbrt-status.busy{color:#d48806;}'
        + '#jbRankTool .jbrt-title-editor{width:100%;min-height:60px;border:1px solid #e0e0e0;border-radius:8px;padding:8px 10px;font-size:14px;line-height:1.5;outline:none;word-break:keep-all;white-space:pre-wrap;cursor:text;background:#fff;}'
        + '#jbRankTool .jbrt-title-editor:focus{border-color:#ff6b6b;}'
        + '#jbRankTool .jbrt-title-editor:empty::before{content:attr(data-placeholder);color:#bbb;}'
        + '#jbRankTool .jbrt-preview-wrap{background:#f8f8f8;border-radius:8px;padding:10px 12px;margin-top:10px;}'
        + '#jbRankTool .jbrt-preview-label{font-size:11px;color:#aaa;font-weight:600;margin-bottom:6px;}'
        + '#jbRankTool .jbrt-preview-name{font-size:14px;font-weight:700;color:#111;word-break:keep-all;line-height:1.45;}'
        + '#jbRankTool .jbrt-generate-btn{width:100%;padding:14px;background:linear-gradient(135deg,#ff6b6b,#ee5a24);border:none;border-radius:12px;color:#fff;font-size:16px;font-weight:800;cursor:pointer;margin-top:8px;}'
        + '#jbRankTool .jbrt-result-wrap{display:none;margin-top:20px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);}'
        + '#jbRankTool .jbrt-result-header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid #f0f0f0;}'
        + '#jbRankTool .jbrt-result-title{font-size:14px;font-weight:700;color:#333;}'
        + '#jbRankTool .jbrt-copy-btn{padding:6px 14px;background:#ff6b6b;border:none;border-radius:6px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;}'
        + '#jbRankTool .jbrt-copy-btn.copied{background:#52c41a;}'
        + '#jbRankTool .jbrt-result-box{background:#1e1e1e;padding:16px;overflow-x:auto;max-height:300px;overflow-y:auto;}'
        + '#jbRankTool .jbrt-result-box pre{color:#d4d4d4;font-size:11px;line-height:1.6;white-space:pre;font-family:Courier New,monospace;}';

    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    var root = document.createElement('div');
    root.id = 'jbRankTool';
    root.innerHTML = ''
        + '<div class="jbrt-wrap">'
        + '  <button class="jbrt-close" id="jbrtClose" title="닫기">X</button>'
        + '  <h1>제철밥상 인기상품 <span>코드 생성기</span> <small style="font-size:12px;color:#999;">v2.2</small></h1>'
        + '  <div class="jbrt-token-card">'
        + '    <div class="jbrt-token-head" id="jbrtTokenHead">'
        + '      <div class="jbrt-token-title">GitHub 토큰 설정 (썸네일 저장용)</div>'
        + '      <div class="jbrt-token-state" id="jbrtTokenState"></div>'
        + '    </div>'
        + '    <div class="jbrt-token-body" id="jbrtTokenBody">'
        + '      <div class="jbrt-token-row">'
        + '        <input type="password" id="jbrtTokenInput" placeholder="github_pat_... (fine-grained, jwbm-assets 전용)">'
        + '        <button class="jbrt-btn-blue" id="jbrtTokenSave">저장</button>'
        + '        <button class="jbrt-btn-gray" id="jbrtTokenClear">삭제</button>'
        + '      </div>'
        + '      <div class="jbrt-token-hint">이 브라우저에만 저장돼요(localStorage). 공용 PC에서는 사용 후 삭제 권장.</div>'
        + '    </div>'
        + '  </div>'
        + '  <div class="jbrt-wtitle-card">'
        + '    <div class="jbrt-field">'
        + '      <label>위젯 제목 (헤더에 표시되는 문구)</label>'
        + '      <input type="text" id="jbrtWidgetTitle" placeholder="예: 가공식품 인기상품">'
        + '      <div class="jbrt-hint">예: 오늘의 인기상품 TOP 5, 가공식품 인기상품, 수산물 인기상품 ...</div>'
        + '    </div>'
        + '  </div>'
        + '  <div class="jbrt-import-card">'
        + '    <div class="jbrt-import-title">기존 코드 불러오기 (일부만 수정할 때)</div>'
        + '    <textarea class="jbrt-import-area" id="jbrtImportArea" placeholder="기존 코드를 여기에 붙여넣으면 현재 세팅값으로 자동 입력됩니다..."></textarea>'
        + '    <button class="jbrt-import-btn" id="jbrtImportBtn">불러오기</button>'
        + '    <div class="jbrt-import-hint">기존 코드를 붙여넣고 불러오기를 누르면 1~5위 값이 자동으로 채워집니다.</div>'
        + '  </div>'
        + '  <div id="jbrtForms"></div>'
        + '  <button class="jbrt-generate-btn" id="jbrtGenerate">코드 생성하기</button>'
        + '  <div class="jbrt-result-wrap" id="jbrtResultWrap">'
        + '    <div class="jbrt-result-header">'
        + '      <div class="jbrt-result-title">완성된 전체 코드 (그대로 붙여넣기)</div>'
        + '      <button class="jbrt-copy-btn" id="jbrtCopyBtn">복사하기</button>'
        + '    </div>'
        + '    <div class="jbrt-result-box"><pre id="jbrtResultCode"></pre></div>'
        + '  </div>'
        + '</div>';
    document.body.appendChild(root);

    function $(id) { return document.getElementById(id); }

    /* ---------------- 토큰 관리 ---------------- */
    function getToken() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
    function refreshTokenState() {
        var el = $('jbrtTokenState');
        if (getToken()) { el.textContent = '설정됨'; el.className = 'jbrt-token-state ok'; }
        else { el.textContent = '미설정 - 클릭해서 입력'; el.className = 'jbrt-token-state no'; }
    }
    $('jbrtTokenHead').addEventListener('click', function () {
        $('jbrtTokenBody').classList.toggle('open');
    });
    $('jbrtTokenSave').addEventListener('click', function () {
        var v = $('jbrtTokenInput').value.trim();
        if (!v) { alert('토큰을 입력해주세요.'); return; }
        try { localStorage.setItem(TOKEN_KEY, v); } catch (e) { alert('저장 실패: ' + e.message); return; }
        $('jbrtTokenInput').value = '';
        refreshTokenState();
        $('jbrtTokenBody').classList.remove('open');
    });
    $('jbrtTokenClear').addEventListener('click', function () {
        try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
        refreshTokenState();
    });
    refreshTokenState();

    /* ---------------- 위젯 제목 ---------------- */
    $('jbrtWidgetTitle').value = DEFAULT_WIDGET_TITLE;
    function escapeHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function getWidgetTitle() {
        var v = $('jbrtWidgetTitle').value.trim();
        return escapeHtml(v || DEFAULT_WIDGET_TITLE);
    }

    /* ---------------- 상품 카드 폼 ---------------- */
    var productMeta = {}; // idx -> { imgUrl: 원본 이미지 URL }

    function buildForms() {
        var wrap = $('jbrtForms');
        var html = '';
        for (var i = 0; i < RANKS; i++) {
            html += ''
                + '<div class="jbrt-card" draggable="true" data-index="' + i + '">'
                + '  <div class="jbrt-card-header">'
                + '    <div class="jbrt-drag-handle">&#10495;</div>'
                + '    <div class="jbrt-badge"><span class="jbrt-top">TOP</span>' + (i + 1) + '</div>'
                + '    <div class="jbrt-card-title">' + (i + 1) + '위 상품</div>'
                + '  </div>'
                + '  <div class="jbrt-fields">'
                + '    <div class="jbrt-field">'
                + '      <label>상품 코드</label>'
                + '      <div class="jbrt-code-row">'
                + '        <div class="jbrt-code-box">'
                + '          <span class="jbrt-code-prefix">/Goods/Detail/</span>'
                + '          <input type="text" id="jbrtLink' + i + '" placeholder="SAI12345678">'
                + '        </div>'
                + '        <button class="jbrt-load-btn" id="jbrtLoadBtn' + i + '">상품정보 불러오기</button>'
                + '      </div>'
                + '      <div class="jbrt-hint">코드 입력 후 불러오기 - 상품명과 썸네일이 자동으로 채워집니다. 상품페이지 URL을 통째로 붙여넣어도 돼요.</div>'
                + '    </div>'
                + '    <div class="jbrt-field">'
                + '      <label>썸네일</label>'
                + '      <div class="jbrt-thumb-block">'
                + '        <div class="jbrt-thumb-preview"><img id="jbrtPrevImg' + i + '" alt=""></div>'
                + '        <div class="jbrt-thumb-side">'
                + '          <input type="text" id="jbrtThumb' + i + '" placeholder="ranking/SAI12345678.jpg">'
                + '          <button class="jbrt-save-btn" id="jbrtSaveBtn' + i + '" disabled>썸네일 저장 (GitHub)</button>'
                + '          <div class="jbrt-status" id="jbrtStatus' + i + '"></div>'
                + '        </div>'
                + '      </div>'
                + '      <div class="jbrt-hint">저장하면 jwbm-assets/ranking/&lt;상품코드&gt;.jpg 로 올라가고 경로가 자동 입력됩니다.</div>'
                + '    </div>'
                + '    <div class="jbrt-field">'
                + '      <label>상품 타이틀</label>'
                + '      <div class="jbrt-title-editor" id="jbrtTitle' + i + '" contenteditable="true" data-placeholder="상품명을 입력하세요"></div>'
                + '      <div class="jbrt-hint">줄바꿈될 것 같으면 자동으로 반영됩니다. Enter로 직접 추가도 가능.</div>'
                + '      <div class="jbrt-preview-wrap">'
                + '        <div class="jbrt-preview-label">미리보기</div>'
                + '        <div class="jbrt-preview-name" id="jbrtPreview' + i + '"></div>'
                + '      </div>'
                + '    </div>'
                + '  </div>'
                + '</div>';
        }
        wrap.innerHTML = html;

        var idx;
        for (idx = 0; idx < RANKS; idx++) {
            (function (i) {
                $('jbrtLoadBtn' + i).addEventListener('click', function () { loadProduct(i); });
                $('jbrtSaveBtn' + i).addEventListener('click', function () { saveThumbnail(i); });
                $('jbrtThumb' + i).addEventListener('input', function () { previewThumbFromPath(i); });
                $('jbrtTitle' + i).addEventListener('input', function () { onTitleInput(i); });
                $('jbrtTitle' + i).addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') { e.preventDefault(); document.execCommand('insertLineBreak'); onTitleInput(i); }
                });
                $('jbrtLink' + i).addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') { e.preventDefault(); loadProduct(i); }
                });
                $('jbrtLink' + i).addEventListener('input', function () { normalizeCodeInput(i); });
            })(idx);
        }
        initDragAndDrop();
    }

    function normalizeCodeInput(i) {
        var input = $('jbrtLink' + i);
        var v = input.value.trim();
        var m = v.match(/SAI\w+/i);
        if (m && m[0] !== v) { input.value = m[0].toUpperCase(); }
    }

    function getCode(i) {
        var v = $('jbrtLink' + i).value.trim();
        var m = v.match(/SAI\w+/i);
        return m ? m[0].toUpperCase() : v;
    }

    function setStatus(i, msg, cls) {
        var el = $('jbrtStatus' + i);
        el.textContent = msg;
        el.className = 'jbrt-status' + (cls ? ' ' + cls : '');
    }

    /* ---------------- 타이틀 에디터 ---------------- */
    function getRawText(i) {
        var editor = $('jbrtTitle' + i);
        var html = editor.innerHTML;
        html = html.replace(/<br\s*\/?>/gi, '\n').replace(/<div>/gi, '\n').replace(/<\/div>/gi, '');
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    function onTitleInput(i) {
        $('jbrtPreview' + i).innerHTML = autoLineBreak(getRawText(i)).join('<br>');
    }

    function getTitleForCode(i) {
        return autoLineBreak(getRawText(i)).join('<br>');
    }

    /* ---------------- 상품정보 로드 ---------------- */
    function decodeResponse(buf, contentType) {
        var charset = 'utf-8';
        var m = (contentType || '').match(/charset=([\w-]+)/i);
        if (m) charset = m[1].toLowerCase();
        var text = '';
        try { text = new TextDecoder(charset).decode(buf); }
        catch (e) { text = new TextDecoder('utf-8').decode(buf); }
        // UTF-8로 읽었는데 깨졌으면 EUC-KR 재시도
        if (charset === 'utf-8' && text.indexOf('�') !== -1) {
            try {
                var retry = new TextDecoder('euc-kr').decode(buf);
                if (retry.indexOf('�') === -1) text = retry;
            } catch (e2) {}
        }
        return text;
    }

    function toSameOrigin(url) {
        try {
            var u = new URL(url, location.origin);
            return location.origin + u.pathname + u.search;
        } catch (e) { return url; }
    }

    function loadProduct(i) {
        var code = getCode(i);
        if (!code || code.indexOf('SAI') !== 0) { setStatus(i, '상품코드를 먼저 입력해주세요 (SAI...)', 'err'); return; }
        $('jbrtLink' + i).value = code;
        var btn = $('jbrtLoadBtn' + i);
        btn.disabled = true;
        setStatus(i, '상품정보 불러오는 중...', 'busy');

        fetch(LINK_PREFIX + code, { credentials: 'same-origin' })
            .then(function (res) {
                if (!res.ok) throw new Error('상품페이지 응답 오류 (' + res.status + ')');
                var ct = res.headers.get('content-type');
                return res.arrayBuffer().then(function (buf) { return decodeResponse(buf, ct); });
            })
            .then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var titleMeta = doc.querySelector('meta[property="og:title"]');
                var imgMeta = doc.querySelector('meta[property="og:image"]');
                var name = titleMeta ? titleMeta.getAttribute('content') : '';
                var imgUrl = imgMeta ? imgMeta.getAttribute('content') : '';
                if (!name && !imgUrl) throw new Error('상품정보를 찾지 못했어요. 코드를 확인해주세요.');

                if (name) {
                    $('jbrtTitle' + i).innerText = name.trim();
                    onTitleInput(i);
                }
                if (imgUrl) {
                    var localUrl = toSameOrigin(imgUrl);
                    productMeta[i] = { imgUrl: localUrl, origUrl: imgUrl };
                    var img = $('jbrtPrevImg' + i);
                    img.src = localUrl;
                    img.style.display = 'block';
                    img.onerror = function () { img.src = imgUrl; img.onerror = null; };
                    $('jbrtSaveBtn' + i).disabled = false;
                    setStatus(i, '불러오기 완료. 썸네일 저장을 누르면 GitHub에 올라갑니다.', 'ok');
                } else {
                    setStatus(i, '상품명은 불러왔는데 대표이미지를 찾지 못했어요.', 'err');
                }
            })
            .catch(function (err) {
                setStatus(i, '실패: ' + err.message, 'err');
            })
            .then(function () { btn.disabled = false; });
    }

    /* ---------------- 썸네일 경로 직접 입력 미리보기 ---------------- */
    function previewThumbFromPath(i) {
        var val = $('jbrtThumb' + i).value.trim();
        var img = $('jbrtPrevImg' + i);
        if (!productMeta[i] && val) {
            img.src = IMG_PREFIX + val;
            img.style.display = 'block';
        } else if (!productMeta[i] && !val) {
            img.style.display = 'none';
        }
    }

    /* ---------------- 이미지 리사이즈 ---------------- */
    function blobToDataUrl(blob) {
        return new Promise(function (resolve, reject) {
            var fr = new FileReader();
            fr.onload = function () { resolve(fr.result); };
            fr.onerror = function () { reject(new Error('파일 읽기 실패')); };
            fr.readAsDataURL(blob);
        });
    }

    function loadImageFromBlob(blob) {
        return new Promise(function (resolve, reject) {
            var url = URL.createObjectURL(blob);
            var img = new Image();
            img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
            img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('이미지 디코딩 실패')); };
            img.src = url;
        });
    }

    function squareResize(img) {
        var side = Math.min(img.naturalWidth, img.naturalHeight);
        var out = Math.min(MAX_SIZE, side); // 원본보다 크게 늘리지 않음
        var sx = Math.floor((img.naturalWidth - side) / 2);
        var sy = Math.floor((img.naturalHeight - side) / 2);
        var canvas = document.createElement('canvas');
        canvas.width = out;
        canvas.height = out;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, out, out);
        ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);
        return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    }

    /* ---------------- GitHub API ---------------- */
    function ghApiUrl(path) {
        return 'https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + path;
    }
    function ghHeaders() {
        return {
            'Authorization': 'Bearer ' + getToken(),
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
    }
    function ghGetSha(path) {
        return fetch(ghApiUrl(path) + '?ref=' + GH_BRANCH, { headers: ghHeaders() })
            .then(function (res) {
                if (res.status === 404) return null;
                if (res.status === 401 || res.status === 403) throw new Error('토큰 인증 실패 - 토큰 설정을 확인해주세요.');
                if (!res.ok) throw new Error('GitHub 조회 오류 (' + res.status + ')');
                return res.json().then(function (j) { return j.sha || null; });
            });
    }
    function ghPutFile(path, base64Content, sha, message) {
        var body = { message: message, content: base64Content, branch: GH_BRANCH };
        if (sha) body.sha = sha;
        return fetch(ghApiUrl(path), {
            method: 'PUT',
            headers: ghHeaders(),
            body: JSON.stringify(body)
        }).then(function (res) {
            if (res.status === 401 || res.status === 403) throw new Error('토큰 인증 실패 - 토큰 설정을 확인해주세요.');
            if (res.status === 409) throw new Error('커밋 충돌(409) - 다시 한 번 저장을 눌러주세요.');
            if (!res.ok) throw new Error('GitHub 업로드 오류 (' + res.status + ')');
            return res.json();
        });
    }
    function purgeJsdelivr(path) {
        var url = 'https://purge.jsdelivr.net/gh/' + GH_OWNER + '/' + GH_REPO + '@' + GH_BRANCH + '/' + path;
        return fetch(url).catch(function () {
            // CORS로 응답을 못 읽어도 요청 자체는 서버에 도달함
            return fetch(url, { mode: 'no-cors' }).catch(function () {});
        });
    }

    /* ---------------- 썸네일 저장 플로우 ---------------- */
    function saveThumbnail(i) {
        var code = getCode(i);
        var meta = productMeta[i];
        if (!code || code.indexOf('SAI') !== 0) { setStatus(i, '상품코드를 먼저 입력해주세요.', 'err'); return; }
        if (!meta || !meta.imgUrl) { setStatus(i, '먼저 상품정보 불러오기를 해주세요.', 'err'); return; }
        if (!getToken()) {
            setStatus(i, 'GitHub 토큰이 없어요. 상단에서 토큰을 먼저 설정해주세요.', 'err');
            $('jbrtTokenBody').classList.add('open');
            return;
        }

        var btn = $('jbrtSaveBtn' + i);
        btn.disabled = true;
        var ghPath = null;
        var dataUrl = null;
        var gifNote = '';

        setStatus(i, '이미지 가져오는 중...', 'busy');
        fetch(meta.imgUrl, { credentials: 'same-origin' })
            .then(function (res) {
                if (!res.ok) {
                    // 같은 오리진 실패 시 원본 CDN URL로 재시도
                    if (meta.origUrl && meta.origUrl !== meta.imgUrl) return fetch(meta.origUrl);
                    throw new Error('이미지 다운로드 실패 (' + res.status + ')');
                }
                return res;
            })
            .then(function (res) {
                if (!res.ok) throw new Error('이미지 다운로드 실패 (' + res.status + ')');
                return res.blob();
            })
            .then(function (blob) {
                var isGif = blob.type === 'image/gif' || /\.gif(\?|$)/i.test(meta.imgUrl);
                if (isGif) {
                    // GIF는 리사이즈하면 움직임이 사라지므로 원본 그대로 업로드
                    if (blob.size > 20 * 1024 * 1024) throw new Error('GIF가 20MB를 넘어요. 용량을 줄인 파일을 직접 올려주세요.');
                    if (blob.size > 3 * 1024 * 1024) gifNote = ' / 주의: GIF ' + (blob.size / 1024 / 1024).toFixed(1) + 'MB - 위젯 로딩이 느릴 수 있어요';
                    ghPath = GH_DIR + '/' + code + '.gif';
                    setStatus(i, 'GIF 원본 그대로 업로드 준비 중 (움직임 유지)...', 'busy');
                    return blobToDataUrl(blob);
                }
                ghPath = GH_DIR + '/' + code + '.jpg';
                return loadImageFromBlob(blob).then(function (img) {
                    setStatus(i, '리사이즈 중...', 'busy');
                    return squareResize(img);
                });
            })
            .then(function (du) {
                dataUrl = du;
                var base64 = dataUrl.split(',')[1];
                setStatus(i, 'GitHub 업로드 중...', 'busy');
                return ghGetSha(ghPath).then(function (sha) {
                    var msg = (sha ? 'update' : 'add') + ' ranking thumbnail ' + code;
                    return ghPutFile(ghPath, base64, sha, msg);
                });
            })
            .then(function () {
                setStatus(i, 'CDN 캐시 갱신 중...', 'busy');
                return purgeJsdelivr(ghPath);
            })
            .then(function () {
                $('jbrtThumb' + i).value = ghPath;
                var img = $('jbrtPrevImg' + i);
                img.src = dataUrl; // 캐시와 무관하게 방금 만든 이미지로 미리보기
                img.style.display = 'block';
                setStatus(i, '저장 완료: ' + ghPath + ' (경로 자동 입력됨)' + gifNote, 'ok');
            })
            .catch(function (err) {
                setStatus(i, '저장 실패: ' + err.message, 'err');
            })
            .then(function () { btn.disabled = false; });
    }

    /* ---------------- 드래그 정렬 ---------------- */
    var dragSrc = null;
    function initDragAndDrop() {
        var wrap = $('jbrtForms');
        wrap.querySelectorAll('.jbrt-card').forEach(function (card) {
            card.addEventListener('dragstart', function (e) { dragSrc = card; card.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
            card.addEventListener('dragend', function () {
                card.classList.remove('dragging');
                wrap.querySelectorAll('.jbrt-card').forEach(function (c) { c.classList.remove('drag-over'); });
                updateRankBadges();
            });
            card.addEventListener('dragover', function (e) {
                e.preventDefault();
                if (card !== dragSrc) {
                    wrap.querySelectorAll('.jbrt-card').forEach(function (c) { c.classList.remove('drag-over'); });
                    card.classList.add('drag-over');
                }
            });
            card.addEventListener('drop', function (e) {
                e.preventDefault();
                if (dragSrc && dragSrc !== card) {
                    var all = Array.prototype.slice.call(wrap.querySelectorAll('.jbrt-card'));
                    wrap.insertBefore(dragSrc, all.indexOf(dragSrc) < all.indexOf(card) ? card.nextSibling : card);
                }
                card.classList.remove('drag-over');
            });
        });
    }

    function updateRankBadges() {
        var cards = document.querySelectorAll('#jbrtForms .jbrt-card');
        for (var i = 0; i < cards.length; i++) {
            var badge = cards[i].querySelector('.jbrt-badge');
            var title = cards[i].querySelector('.jbrt-card-title');
            if (badge) badge.innerHTML = '<span class="jbrt-top">TOP</span>' + (i + 1);
            if (title) title.textContent = (i + 1) + '위 상품';
        }
    }

    function getOrderedValues() {
        var cards = document.querySelectorAll('#jbrtForms .jbrt-card');
        var list = [];
        for (var c = 0; c < cards.length; c++) {
            var idx = cards[c].getAttribute('data-index');
            list.push({
                thumb: IMG_PREFIX + $('jbrtThumb' + idx).value.trim(),
                link: getCode(parseInt(idx, 10)),
                title: getTitleForCode(parseInt(idx, 10))
            });
        }
        return list;
    }

    /* ---------------- 기존 코드 불러오기 ---------------- */
    function importCode() {
        var code = $('jbrtImportArea').value.trim();
        if (!code) { alert('코드를 먼저 붙여넣어주세요.'); return; }
        var doc = new DOMParser().parseFromString(code, 'text/html');
        var items = doc.querySelectorAll('.ranking-item');
        if (items.length === 0) { alert('올바른 코드가 아닌 것 같아요.'); return; }
        var titleEl = doc.querySelector('.ranking-title');
        if (titleEl && titleEl.textContent.trim()) {
            $('jbrtWidgetTitle').value = titleEl.textContent.trim();
        }
        items.forEach(function (item, i) {
            if (i >= RANKS) return;
            var img = item.querySelector('.product-thumbnail img');
            if (img) {
                var path = (img.getAttribute('src') || '').replace(IMG_PREFIX, '');
                $('jbrtThumb' + i).value = path;
                delete productMeta[i];
                previewThumbFromPath(i);
            }
            var href = item.getAttribute('href') || '';
            var m = href.match(/SAI\w+/);
            if (m) $('jbrtLink' + i).value = m[0];
            var nameEl = item.querySelector('.product-name');
            if (nameEl) {
                var text = nameEl.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/&amp;/g, '&');
                $('jbrtTitle' + i).innerText = text;
                onTitleInput(i);
            }
        });
        alert('불러오기 완료!');
        $('jbrtImportArea').value = '';
    }

    /* ---------------- 코드 생성 (기존 위젯 코드 그대로) ---------------- */
    function generateCode() {
        var widgetTitle = getWidgetTitle();
        var ordered = getOrderedValues();
        var badgeClasses = ['gold', 'silver', 'bronze', '', ''];
        var itemsHtml = '';
        ordered.forEach(function (p, i) {
            var link = LINK_PREFIX + p.link + '?&ch_idx=196';
            var badgeCls = badgeClasses[i] ? ' ' + badgeClasses[i] : '';
            itemsHtml += ''
                + '                <a class="ranking-item apphref" href="' + link + '" data-index="' + i + '">\n'
                + '                    <div class="ranking-item-inner">\n'
                + '                        <div class="thumbnail-wrap">\n'
                + '                            <div class="product-thumbnail">\n'
                + '                                <img src="' + p.thumb + '" alt="">\n'
                + '                            </div>\n'
                + '                        </div>\n'
                + '                        <div class="product-info">\n'
                + '                            <div class="rank-badge' + badgeCls + '"><span class="top-label">TOP</span>' + (i + 1) + '</div>\n'
                + '                            <div class="product-name">' + p.title + '</div>\n'
                + '                        </div>\n'
                + '                    </div>\n'
                + '                </a>\n';
        });

        var fullCode = '<!DOCTYPE html>\n'
            + '<html lang="ko">\n'
            + '<head>\n'
            + '    <meta charset="UTF-8">\n'
            + '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
            + '    <title>' + widgetTitle + '</title>\n'
            + '    <style>\n'
            + '        * { margin: 0; padding: 0; box-sizing: border-box; }\n'
            + '        body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; padding: 20px; background-color: #f5f5f5; }\n'
            + '        .ranking-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.25); }\n'
            + '        .ranking-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: white; border-bottom: 1px solid #e0e0e0; cursor: pointer; user-select: none; gap: 12px; }\n'
            + '        .ranking-title { font-size: 16px; font-weight: 800; color: #333; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n'
            + '        .toggle-area { display: flex; align-items: center; gap: 0px; flex-shrink: 0; }\n'
            + '        .toggle-label { font-size: 13px; color: #111; font-weight: 800; }\n'
            + '        .toggle-button { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 1s ease; flex-shrink: 0; pointer-events: auto; }\n'
            + '        .toggle-button.animating { pointer-events: none; }\n'
            + '        .toggle-button svg { width: 21px; height: 21px; fill: #666; }\n'
            + '        .toggle-button.expanded { transform: rotate(180deg); }\n'
            + '        .ranking-content { position: relative; height: 176px; overflow: hidden; transition: height 1s ease; }\n'
            + '        .ranking-slider { width: 100%; position: relative; }\n'
            + '        .ranking-item { display: none; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; text-decoration: none; color: inherit; transition: background-color 0.2s ease; }\n'
            + '        .ranking-item:hover { background-color: #f8f8f8; }\n'
            + '        .ranking-item:last-child { border-bottom: none; }\n'
            + '        .ranking-item-inner { display: flex; align-items: center; gap: 40px; }\n'
            + '        .thumbnail-wrap { position: relative; flex-shrink: 0; }\n'
            + '        .product-thumbnail { width: 144px; height: 144px; border-radius: 10px; background-color: #f0f0f0; overflow: hidden; }\n'
            + '        .product-thumbnail img { width: 100%; height: 100%; object-fit: cover; }\n'
            + '        .rank-badge { font-size: 21px; font-weight: 500; color: #111; line-height: 1; }\n'
            + '        .rank-badge .top-label { font-size: 21px; font-weight: 500; opacity: 0.7; margin-right: 2px; vertical-align: baseline; }\n'
            + '        .product-info { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 6px; min-width: 0; }\n'
            + '        .product-name { font-weight: 700; color: #111; font-size: 15.6px; white-space: normal; word-break: keep-all; line-height: 1.45; }\n'
            + '        .product-description { display: none; }\n'
            + '        .ranking-item.slide-animate { display: block; animation: slideUpFade 2.25s ease-in-out; }\n'
            + '        .ranking-content.expanded .ranking-item { display: block; animation: none; }\n'
            + '        .ranking-content.expanded { height: auto; }\n'
            + '        .ranking-content.expanded .ranking-item:last-child { padding-bottom: 16px; }\n'
            + '        @keyframes slideUpFade {\n'
            + '            0%   { transform: translateY(176px); opacity: 0; }\n'
            + '            10%  { transform: translateY(0); opacity: 1; }\n'
            + '            90%  { transform: translateY(0); opacity: 1; }\n'
            + '            100% { transform: translateY(-176px); opacity: 0; }\n'
            + '        }\n'
            + '        @media (min-width: 768px) {\n'
            + '            .ranking-title { font-size: 26px; font-weight: 800; }\n'
            + '            .toggle-label { font-size: 23.4px; }\n'
            + '            .toggle-button { width: 72px; height: 72px; }\n'
            + '            .toggle-button svg { width: 48px; height: 48px; }\n'
            + '            .product-name { font-size: 30px; font-weight: 600; }\n'
            + '            .rank-badge { font-size: 36px; font-weight: 500; }\n'
            + '            .rank-badge .top-label { font-size: 36px; font-weight: 500; opacity: 0.7; }\n'
            + '        }\n'
            + '        @media (max-width: 767px) {\n'
            + '            .ranking-container { margin: 0 20px; }\n'
            + '            .toggle-button { width: 58px; height: 58px; }\n'
            + '            .toggle-button svg { width: 50px; height: 50px; }\n'
            + '            .toggle-label { font-size: 16px; }\n'
            + '            .product-name { font-size: 17.6px; }\n'
            + '            .product-thumbnail { width: 38vw; height: 38vw; max-width: 144px; max-height: 144px; }\n'
            + '            .ranking-content { height: min(38vw + 32px, 176px); }\n'
            + '            .ranking-item-inner { gap: 4vw; }\n'
            + '            .ranking-item.slide-animate { animation: slideUpFadeMobile 2.25s ease-in-out; }\n'
            + '            @keyframes slideUpFadeMobile {\n'
            + '                0%   { transform: translateY(min(calc(38vw + 32px), 176px)); opacity: 0; }\n'
            + '                10%  { transform: translateY(0); opacity: 1; }\n'
            + '                90%  { transform: translateY(0); opacity: 1; }\n'
            + '                100% { transform: translateY(min(calc(-38vw - 32px), -176px)); opacity: 0; }\n'
            + '            }\n'
            + '        }\n'
            + '    </style>\n'
            + '</head>\n'
            + '<body>\n'
            + '    <div class="ranking-container">\n'
            + '        <div class="ranking-header" id="header">\n'
            + '            <div class="ranking-title">' + widgetTitle + '</div>\n'
            + '            <div class="toggle-area">\n'
            + '                <span class="toggle-label" id="toggleLabel">펼쳐보기</span>\n'
            + '                <div class="toggle-button" id="toggleBtn">\n'
            + '                    <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>\n'
            + '                </div>\n'
            + '            </div>\n'
            + '        </div>\n'
            + '        <div class="ranking-content" id="rankingContent">\n'
            + '            <div class="ranking-slider" id="slider">\n'
            + itemsHtml
            + '            </div>\n'
            + '        </div>\n'
            + '    </div>\n'
            + '    <scr' + 'ipt>\n'
            + '        const toggleBtn = document.getElementById(\'toggleBtn\');\n'
            + '        const toggleLabel = document.getElementById(\'toggleLabel\');\n'
            + '        const header = document.getElementById(\'header\');\n'
            + '        const rankingContent = document.getElementById(\'rankingContent\');\n'
            + '        const slider = document.getElementById(\'slider\');\n'
            + '        const items = Array.from(slider.querySelectorAll(\'.ranking-item\'));\n'
            + '        let isExpanded = false, currentIndex = 0, intervalId = null, isAnimating = false;\n'
            + '        function showSlide(index) { items.forEach((item, i) => { item.style.display = i === index ? \'block\' : \'none\'; }); }\n'
            + '        function animateSlide(index) { const item = items[index]; item.classList.remove(\'slide-animate\'); void item.offsetWidth; item.classList.add(\'slide-animate\'); }\n'
            + '        function startSlider() {\n'
            + '            if (intervalId) clearInterval(intervalId);\n'
            + '            currentIndex = 0; showSlide(currentIndex); animateSlide(currentIndex);\n'
            + '            intervalId = setInterval(() => { currentIndex = (currentIndex + 1) % items.length; showSlide(currentIndex); animateSlide(currentIndex); }, 2250);\n'
            + '        }\n'
            + '        function stopSlider() { if (intervalId) { clearInterval(intervalId); intervalId = null; } }\n'
            + '        function showAllItems() { stopSlider(); items.forEach(item => { item.style.display = \'block\'; item.classList.remove(\'slide-animate\'); }); setTimeout(updateHeight, 10); }\n'
            + '        function updateHeight() {\n'
            + '            if (isExpanded) { rankingContent.style.height = slider.scrollHeight + \'px\'; }\n'
            + '            else {\n'
            + '                const h = window.innerWidth < 768 ? Math.min(window.innerWidth * 0.38 + 32, 176) : 176;\n'
            + '                rankingContent.style.height = h + \'px\';\n'
            + '            }\n'
            + '        }\n'
            + '        function toggleRanking() {\n'
            + '            if (isAnimating) return;\n'
            + '            isAnimating = true; toggleBtn.classList.add(\'animating\'); isExpanded = !isExpanded;\n'
            + '            toggleLabel.textContent = isExpanded ? \'접기\' : \'펼쳐보기\';\n'
            + '            if (isExpanded) {\n'
            + '                const h = window.innerWidth < 768 ? Math.min(window.innerWidth * 0.38 + 32, 176) : 176;\n'
            + '                rankingContent.style.height = (items.length * h + 16) + \'px\';\n'
            + '                rankingContent.classList.add(\'expanded\'); toggleBtn.classList.add(\'expanded\'); showAllItems();\n'
            + '            } else {\n'
            + '                rankingContent.classList.remove(\'expanded\'); toggleBtn.classList.remove(\'expanded\'); stopSlider(); updateHeight();\n'
            + '            }\n'
            + '            setTimeout(() => { isAnimating = false; toggleBtn.classList.remove(\'animating\'); if (!isExpanded) startSlider(); }, 1000);\n'
            + '        }\n'
            + '        header.addEventListener(\'click\', toggleRanking);\n'
            + '        window.addEventListener(\'resize\', () => { if (!isExpanded) updateHeight(); });\n'
            + '        startSlider();\n'
            + '    </scr' + 'ipt>\n'
            + '</body>\n'
            + '</html>';

        $('jbrtResultCode').textContent = fullCode;
        var rw = $('jbrtResultWrap');
        rw.style.display = 'block';
        rw.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function copyCode() {
        var text = $('jbrtResultCode').textContent;
        var done = function () {
            var btn = $('jbrtCopyBtn');
            btn.textContent = '복사완료';
            btn.classList.add('copied');
            setTimeout(function () { btn.textContent = '복사하기'; btn.classList.remove('copied'); }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done(); });
        } else {
            fallbackCopy(text);
            done();
        }
    }
    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
    }

    /* ---------------- 이벤트 바인딩 & 초기화 ---------------- */
    $('jbrtClose').addEventListener('click', function () { root.style.display = 'none'; });
    $('jbrtImportBtn').addEventListener('click', importCode);
    $('jbrtGenerate').addEventListener('click', generateCode);
    $('jbrtCopyBtn').addEventListener('click', copyCode);

    buildForms();
})();
