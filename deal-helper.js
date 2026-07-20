/* ============================================================
   한정특가 세팅 도우미 (플렉스지 어드민 오버레이)
   - jwbm-assets 저장소에 deal-helper.js 로 업로드
   - 북마클릿 로더로 실행, Shadow DOM으로 어드민 CSS와 격리
   ============================================================ */
(function () {
  // 이미 열려있으면 다시 보여주기만
  if (window.__JBK_DEAL_HELPER__) { window.__JBK_DEAL_HELPER__.show(); return; }

  const host = document.createElement('div');
  host.id = 'jbk-deal-helper-host';
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483000;';
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });

  /* ---------------- UI ---------------- */
  root.innerHTML = `
<style>
  :host{all:initial}
  *{box-sizing:border-box;margin:0;padding:0;font-family:'Pretendard Variable',Pretendard,-apple-system,'Malgun Gothic',sans-serif}
  .backdrop{position:fixed;inset:0;background:rgba(20,30,25,.55)}
  .ovl{
    position:fixed;top:2.5vh;left:50%;transform:translateX(-50%);
    width:min(1300px,96vw);height:95vh;background:#f6f5f1;border-radius:12px;
    display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35);
    color:#22302a;font-size:14px;line-height:1.5;
  }
  header{background:#1f4a30;color:#fff;padding:12px 20px;display:flex;align-items:center;gap:12px;flex-shrink:0}
  header h1{font-size:16px;font-weight:700}
  header .sub{font-size:12px;opacity:.7;flex:1}
  .x-btn{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:2px 8px;opacity:.8}
  .x-btn:hover{opacity:1}

  /* 불러오기 바 */
  .loadbar{display:flex;gap:8px;align-items:center;padding:10px 20px;background:#eef4ef;border-bottom:1px solid #e3e1d9;flex-shrink:0}
  .loadbar input{
    width:200px;padding:8px 12px;border:1px solid #cfd8d1;border-radius:7px;
    font-family:Consolas,monospace;font-size:14px;letter-spacing:.03em;
  }
  .loadbar input:focus{outline:2px solid #2f6b45;outline-offset:-1px}
  .load-btn{
    padding:8px 20px;border:none;border-radius:7px;background:#2f6b45;color:#fff;
    font-size:13px;font-weight:700;cursor:pointer;
  }
  .load-btn:hover{background:#1f4a30}
  .load-btn:disabled{opacity:.5;cursor:wait}
  #loadMsg{font-size:12.5px;color:#6b7a72}
  #loadMsg.ok{color:#1f4a30;font-weight:700}
  #loadMsg.err{color:#c0392b;font-weight:700}

  .wrap{display:grid;grid-template-columns:390px 1fr;gap:14px;padding:14px 20px;overflow-y:auto;flex:1}
  @media(max-width:980px){.wrap{grid-template-columns:1fr}}
  .panel{background:#fff;border:1px solid #e3e1d9;border-radius:10px;overflow:hidden;align-self:start}
  .panel-head{padding:9px 14px;border-bottom:1px solid #e3e1d9;font-size:13px;font-weight:700;color:#1f4a30;
    display:flex;justify-content:space-between;align-items:center;background:#fbfaf7;gap:8px}
  .panel-body{padding:14px}

  .field{margin-bottom:11px}
  .field label{display:block;font-size:12px;font-weight:600;color:#6b7a72;margin-bottom:4px}
  .field input[type=text],.field input[type=number],.field input[type=date]{
    width:100%;padding:7px 10px;border:1px solid #e3e1d9;border-radius:6px;font-size:14px;background:#fff;font-family:inherit;
  }
  .field input:focus{outline:2px solid #2f6b45;outline-offset:-1px}
  input.code{font-family:Consolas,monospace;font-size:13px}
  .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .row-arrow{display:grid;grid-template-columns:1fr 20px 1fr;gap:6px;align-items:center}
  .row-arrow .arrow{text-align:center;color:#6b7a72;font-weight:700}
  .row-unit{display:grid;grid-template-columns:1fr 90px;gap:10px}
  .seg{display:flex;border:1px solid #e3e1d9;border-radius:6px;overflow:hidden}
  .seg button{flex:1;padding:8px 0;border:none;background:#fff;font-size:13px;font-weight:600;color:#6b7a72;cursor:pointer;font-family:inherit}
  .seg button.on{background:#2f6b45;color:#fff}
  .divider{border:none;border-top:1px dashed #e3e1d9;margin:14px 0}
  .hint{font-size:11px;color:#6b7a72;margin-top:3px}
  .calc-hint{font-size:11px;color:#1f4a30;margin-top:3px;font-weight:600;min-height:14px}
  .setting-inline{display:flex;align-items:center;gap:8px;font-size:12px;color:#6b7a72}
  .setting-inline input{width:52px;padding:4px 6px;border:1px solid #e3e1d9;border-radius:5px;text-align:center}
  .opt-stock-row{display:grid;grid-template-columns:1fr 86px;gap:8px;align-items:center;margin-bottom:6px}
  .opt-stock-row .oname{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .opt-stock-row input{padding:6px 8px;border:1px solid #e3e1d9;border-radius:6px;font-size:13px;width:100%;font-family:inherit}
  .opt-stock-row input:focus{outline:2px solid #2f6b45;outline-offset:-1px}
  .create-btn{width:100%;padding:11px;border:none;border-radius:8px;background:#b8860b;color:#fff;font-size:14px;font-weight:700;cursor:pointer;margin-top:2px;font-family:inherit}
  .create-btn:hover{filter:brightness(.93)}
  .create-btn:disabled{opacity:.5;cursor:wait}
  #createMsg.ok{color:#1f4a30;font-weight:700}
  #createMsg.err{color:#c0392b;font-weight:700}
  .field input[type=file]{width:100%;font-size:12px;padding:6px;border:1px dashed #cfd8d1;border-radius:6px;background:#fbfaf7}

  /* 본링크 현황 */
  .src-card{border:1px solid #e3e1d9;border-radius:8px;background:#fbfaf7;padding:10px 12px;margin-bottom:12px;font-size:12.5px;display:none}
  .src-card.show{display:block}
  .src-card h4{font-size:12px;color:#1f4a30;margin-bottom:6px}
  .src-card .kv{display:flex;flex-wrap:wrap;gap:4px 14px;margin-bottom:6px}
  .src-card .kv span b{color:#1f4a30}
  .src-card table{border-collapse:collapse;width:100%;font-size:11.5px;margin-top:4px}
  .src-card th,.src-card td{border:1px solid #e3e1d9;padding:3px 7px;text-align:right;white-space:nowrap}
  .src-card th{background:#f1efe8;font-weight:600}
  .src-card td:first-child,.src-card th:first-child{text-align:left;white-space:normal}
  .src-card .memo-line{margin-top:6px;color:#6b7a72;font-size:11.5px;white-space:pre-line}
  .open-link{font-size:11px;color:#2f6b45;text-decoration:underline;cursor:pointer;margin-left:6px}

  .out-col{display:flex;flex-direction:column;gap:14px;min-width:0}
  .copy-btn{padding:6px 14px;border:none;border-radius:6px;background:#2f6b45;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}
  .copy-btn:hover{background:#1f4a30}
  .copy-btn.done{background:#b8860b}
  .head-note{font-weight:400;color:#6b7a72;font-size:11.5px}

  .sheet-scroll{overflow-x:auto}
  table.sheet{border-collapse:collapse;width:100%;font-size:12px;white-space:nowrap}
  table.sheet th{background:#fdf3d7;border:1px solid #e3e1d9;padding:5px 9px;font-weight:700}
  table.sheet td{border:1px solid #e3e1d9;padding:5px 9px;text-align:center}
  table.sheet td.code-cell{font-family:Consolas,monospace;color:#7b2fbe;font-weight:600}
  table.sheet td.memo{text-align:left;white-space:pre-line;line-height:1.45}

  textarea.notice{width:100%;min-height:300px;padding:13px;border:1px solid #e3e1d9;border-radius:8px;
    font-size:14px;line-height:1.7;font-family:inherit;resize:vertical;background:#fffdf8}
  textarea.notice:focus{outline:2px solid #2f6b45;outline-offset:-1px}

  ul.check{list-style:none}
  ul.check li{display:flex;gap:10px;align-items:flex-start;padding:7px 6px;border-bottom:1px solid #f0efe9;cursor:pointer}
  ul.check li:last-child{border-bottom:none}
  ul.check input[type=checkbox]{margin-top:3px;width:15px;height:15px;accent-color:#2f6b45;cursor:pointer}
  ul.check li.done .txt{color:#b6b3a8;text-decoration:line-through}
  ul.check .txt b{color:#1f4a30}
  ul.check .txt .val{font-family:Consolas,monospace;font-size:12.5px;background:#eef4ef;padding:1px 6px;border-radius:4px;color:#1f4a30}
  ul.check .txt .dim{color:#6b7a72}
  .check-progress{font-size:12px;color:#6b7a72;font-weight:400}
  .reset-btn{background:none;border:1px solid #e3e1d9;border-radius:6px;color:#6b7a72;font-size:11px;padding:4px 10px;cursor:pointer;font-family:inherit}
  .warn{background:#fdf3f1;border:1px solid #f0d6d1;color:#c0392b;border-radius:6px;padding:8px 12px;font-size:12px;margin-bottom:10px}
</style>

<div class="backdrop" id="backdrop"></div>
<div class="ovl">
  <header>
    <h1>한정특가 세팅 도우미</h1>
    <div class="sub">코드 입력 → 불러오기 → 시트 행 · 고지문 · 체크리스트</div>
    <button class="x-btn" id="closeBtn" title="닫기 (ESC)">✕</button>
  </header>

  <div class="loadbar">
    <input type="text" id="loadCode" placeholder="본링크 코드 (SAI...)">
    <button class="load-btn" id="loadBtn">불러오기</button>
    <span id="loadMsg">숨김 상품도 조회 가능 · Enter로도 실행</span>
  </div>

  <div class="wrap">
    <!-- 입력 -->
    <div class="panel">
      <div class="panel-head">상품 정보</div>
      <div class="panel-body">

        <div class="src-card" id="srcCard">
          <h4>📦 본링크 현황 <span id="srcCode" style="font-family:Consolas,monospace;color:#7b2fbe"></span>
            <span class="open-link" id="openMain">수정페이지 열기</span></h4>
          <div class="kv" id="srcKv"></div>
          <table id="srcOptTable"></table>
          <div class="memo-line" id="srcMemo"></div>
        </div>

        <div class="field">
          <label>한정특가 태그 <span style="font-weight:400">(숨김상품 카테고리는 별개)</span></label>
          <div class="seg" id="catSeg">
            <button type="button" data-cat="농수산물" class="on">한정특가 - 농수산물</button>
            <button type="button" data-cat="가공식품">한정특가 - 가공식품</button>
          </div>
        </div>

        <div class="row2">
          <div class="field"><label>셀러명</label><input type="text" id="seller"></div>
          <div class="field"><label>상품명</label><input type="text" id="pname"></div>
        </div>

        <div class="field">
          <label>상품명 변경 (고지문·복사본용)</label>
          <input type="text" id="nameNew" placeholder="불러오면 자동 입력">
          <div class="hint">수정하면 고지문의 "상품명 변경" 내용만 바뀜 · [N개 한정] 접두어는 자동 부착</div>
        </div>

        <div class="row2">
          <div class="field"><label>본링크 상품코드</label><input type="text" id="codeMain" class="code"></div>
          <div class="field"><label>복사본 상품코드</label><input type="text" id="codeCopy" class="code" placeholder="복사 후 입력">
            <span class="open-link" id="openCopy" style="display:none">복사본 수정페이지 열기</span></div>
        </div>

        <div class="row2">
          <div class="field"><label>시작일</label><input type="date" id="dStart"></div>
          <div class="field"><label>종료일</label><input type="date" id="dEnd"></div>
        </div>

        <hr class="divider">

        <div class="field">
          <label>할인율 변경 (%)</label>
          <div class="row-arrow">
            <input type="number" id="rateBefore"><div class="arrow">›</div><input type="number" id="rateAfter">
          </div>
        </div>

        <div class="field">
          <label>이전판매가 변경 (원) — 표시가/취소선 가격</label>
          <div class="row-arrow">
            <input type="number" id="priceBefore"><div class="arrow">›</div><input type="number" id="priceAfter">
          </div>
          <div class="calc-hint" id="rateCalcHint"></div>
        </div>

        <div class="row-unit">
          <div class="field"><label>한정수량</label><input type="number" id="limitNum"></div>
          <div class="field"><label>단위</label>
            <input type="text" id="limitUnit" list="unitList" placeholder="팩">
            <datalist id="unitList">
              <option value="kg"><option value="개"><option value="팩"><option value="포">
              <option value="봉"><option value="세트"><option value="박스"><option value="미"><option value="구">
            </datalist>
          </div>
        </div>

        <div class="field" id="optStockField" style="display:none">
          <label>옵션별 재고 세팅 (복사본에 넣을 수량)</label>
          <div id="optStockWrap"></div>
        </div>

        <div class="row2">
          <div class="field"><label>재고 세팅 표기 (비고란)</label>
            <input type="text" id="stockSetting" placeholder="10개씩 세팅 / 5,5,10개 세팅">
            <div class="hint">옵션별 입력 시 자동 생성 · 직접 수정 가능</div>
          </div>
          <div class="field"><label>등록 재고 수량 (합계)</label>
            <input type="number" id="stockQty">
            <div class="hint">옵션별 재고 합이 자동 입력 · 고지문 "재고 변경"</div>
          </div>
        </div>

        <hr class="divider">

        <div class="field">
          <label>복사본 썸네일 (선택 시 자동 첨부)</label>
          <input type="file" id="thumbFile" accept="image/*">
          <div class="hint" id="thumbInfo">복사본 수정 페이지의 대표이미지에 자동으로 들어감</div>
        </div>

        <button class="create-btn" id="createCopyBtn">⚙️ 복사본 생성 + 자동 입력</button>
        <div class="hint" id="createMsg" style="min-height:16px;margin-top:5px"></div>

        <hr class="divider">
        <div class="setting-inline">
          매출액(H)과 비고(K) 사이 숨김 열 수
          <input type="number" id="hiddenCols" value="2" min="0" max="6">
        </div>
      </div>
    </div>

    <!-- 출력 -->
    <div class="out-col">
      <div class="panel">
        <div class="panel-head">① 구글 시트 행 <span class="head-note">B열에 커서 두고 붙여넣기</span>
          <button class="copy-btn" id="copySheet">시트용 복사</button></div>
        <div class="panel-body sheet-scroll">
          <table class="sheet">
            <thead><tr><th>시작</th><th>종료</th><th>본링크</th><th>복사본</th><th>상품명</th><th>판매량</th><th>매출액</th><th>비고</th></tr></thead>
            <tbody><tr id="sheetRow"><td>-</td><td>-</td><td class="code-cell">-</td><td class="code-cell">-</td><td>-</td><td></td><td></td><td class="memo">-</td></tr></tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">② 단톡방 고지문 <span class="head-note">복사 전 자유 수정 가능</span>
          <button class="copy-btn" id="copyNotice">고지문 복사</button></div>
        <div class="panel-body">
          <textarea class="notice" id="noticeText" spellcheck="false"></textarea>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">③ 작업 체크리스트 <span class="check-progress" id="checkProgress">0 / 13</span>
          <button class="reset-btn" id="resetCheck">초기화</button></div>
        <div class="panel-body">
          <div class="warn">⚠️ 컨셉 = N개 한정일 시: 본링크 숨김 → 상품 복사 → 재고 설정 / 카테고리 - 숨김상품 적용</div>
          <ul class="check" id="checkList"></ul>
        </div>
      </div>
    </div>
  </div>
</div>`;

  /* ---------------- 상태/헬퍼 ---------------- */
  const $ = id => root.getElementById(id);
  let category = '농수산물';
  let noticeEdited = false;
  let srcData = null;
  const checkState = new Array(13).fill(false);

  const num = v => v === '' || v == null ? null : Number(v);
  const P = s => { const n = String(s == null ? '' : s).replace(/[^0-9.\-]/g, ''); return n ? Number(n) : null; };
  const fmt = n => n == null || isNaN(n) ? '' : Number(n).toLocaleString('ko-KR');
  const shortDate = iso => { if (!iso) return ''; const a = iso.split('-'); return a[0].slice(2) + '.' + a[1] + '.' + a[2]; };

  const formIds = ['seller','pname','nameNew','codeMain','codeCopy','dStart','dEnd',
    'rateBefore','rateAfter','priceBefore','priceAfter','limitNum','limitUnit',
    'stockSetting','stockQty','hiddenCols'];

  function getData() {
    return {
      seller: $('seller').value.trim(), pname: $('pname').value.trim(), nameNew: $('nameNew').value.trim(),
      codeMain: $('codeMain').value.trim(), codeCopy: $('codeCopy').value.trim(),
      dStart: $('dStart').value, dEnd: $('dEnd').value,
      rateB: num($('rateBefore').value), rateA: num($('rateAfter').value),
      priceB: num($('priceBefore').value), priceA: num($('priceAfter').value),
      limitNum: num($('limitNum').value), limitUnit: $('limitUnit').value.trim(),
      stockSetting: $('stockSetting').value.trim(), stockQty: num($('stockQty').value),
      hiddenCols: Math.max(0, num($('hiddenCols').value) == null ? 2 : num($('hiddenCols').value))
    };
  }

  /* ---------------- 플렉스지에서 불러오기 ---------------- */
  async function loadGoods(code) {
    const btn = $('loadBtn'), msg = $('loadMsg');
    btn.disabled = true; msg.className = ''; msg.textContent = '불러오는 중...';
    try {
      const res = await fetch('/Good/registration/' + code + '/?modal=Y', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('응답 ' + res.status + ' — 코드 확인 또는 어드민 로그인 상태 확인');
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');

      const Q = n => doc.querySelector('[name="' + n + '"]') || doc.getElementById(n);
      const V = n => { const e = Q(n); return e ? String(e.value == null ? '' : e.value).trim() : ''; };
      if (!Q('mg_name')) throw new Error('상품 수정 화면을 읽지 못함 — 코드가 맞는지 확인');

      let seller = '';
      const sel = Q('mg_supply_idx');
      if (sel) {
        const o = (sel.selectedOptions && sel.selectedOptions[0]) || sel.querySelector('option[selected]');
        if (o) seller = o.textContent.trim();
      }
      const opts = [];
      doc.querySelectorAll('input[name="msov_name1"]').forEach(inp => {
        const nm = String(inp.value || '').trim(); if (!nm) return;
        const row = inp.closest('tr') || inp.parentElement;
        const g = n => { const e = row.querySelector('[name="' + n + '"]'); return e ? e.value : ''; };
        opts.push({ name: nm, stock: P(g('msov_stock')), supply: P(g('msov_supply')), price: P(g('msov_price')) });
      });
      const price = P(V('mg_price')), disp = P(V('mg_display_price'));
      srcData = {
        code, name: V('mg_name'), seller, price, displayPrice: disp,
        rate: (price && disp) ? Math.round((1 - price / disp) * 100) : null,
        stock: P(V('mg_stock_num')), options: opts, memo: V('mg_memo'),
        categories: V('selected_categories')
      };
      applySrc(srcData);
      msg.className = 'ok';
      msg.textContent = '✓ ' + (srcData.name || code) + ' — 옵션 ' + opts.length + '개';
    } catch (e) {
      msg.className = 'err'; msg.textContent = '✗ ' + e.message;
    } finally { btn.disabled = false; }
  }

  function applySrc(d) {
    const m = (d.seller || '').match(/^[^(]+/);
    if (m) $('seller').value = m[0].trim();
    const stripped = d.name ? d.name.replace(/^(\s*\[[^\]]*\]\s*)+/, '').trim() : '';
    if (stripped) { $('pname').value = stripped; $('nameNew').value = stripped; }
    $('codeMain').value = d.code || '';
    if (d.displayPrice != null) $('priceBefore').value = d.displayPrice;
    if (d.rate != null) $('rateBefore').value = d.rate;
    renderSrcCard(d);
    renderOptStocks(d);
    setHint('');
    noticeEdited = false;
    renderAll();
  }

  function renderSrcCard(d) {
    $('srcCode').textContent = d.code || '';
    $('srcKv').innerHTML =
      '<span>공급사 <b>' + (d.seller || '-') + '</b></span>' +
      '<span>판매가 <b>' + fmt(d.price) + '원</b></span>' +
      '<span>이전판매가 <b>' + fmt(d.displayPrice) + '원</b></span>' +
      '<span>할인율 <b>' + (d.rate == null ? '-' : d.rate) + '%</b></span>' +
      '<span>총재고 <b>' + fmt(d.stock) + '</b></span>' +
      '<span>카테고리 idx <b>' + (d.categories || '-') + '</b></span>';
    const opts = d.options || [];
    $('srcOptTable').innerHTML = opts.length
      ? '<tr><th>옵션</th><th>옵션가</th><th>재고</th><th>공급가</th></tr>' +
        opts.map(o => '<tr><td>' + o.name + '</td><td>' + fmt(o.price) + '</td><td>' + fmt(o.stock) + '</td><td>' + fmt(o.supply) + '</td></tr>').join('')
      : '';
    $('srcMemo').textContent = d.memo ? '메모: ' + d.memo : '';
    $('srcCard').classList.add('show');
  }

  const round100 = v => Math.round(v / 100) * 100;
  function setHint(t) { $('rateCalcHint').textContent = t; }

  // 가격 후 입력 → 할인율 후 자동 계산
  function priceToRate() {
    const pA = num($('priceAfter').value);
    if (!srcData || srcData.price == null || pA == null || pA <= 0) { setHint(''); renderAll(); return; }
    const r = Math.round((1 - srcData.price / pA) * 100);
    $('rateAfter').value = r;
    setHint('판매가 ' + fmt(srcData.price) + '원 유지 기준 → 할인율 ' + r + '%');
    renderAll();
  }
  // 할인율 후 입력 → 이전판매가 후 자동 계산 (100원 단위 반올림)
  function rateToPrice() {
    const r = num($('rateAfter').value);
    if (!srcData || srcData.price == null || r == null || r <= 0 || r >= 100) { setHint(''); renderAll(); return; }
    const p = round100(srcData.price / (1 - r / 100));
    $('priceAfter').value = p;
    setHint('할인율 ' + r + '% → 이전판매가 ' + fmt(p) + '원 (판매가 ' + fmt(srcData.price) + '원 유지)');
    renderAll();
  }

  /* ---------------- 옵션별 재고 세팅 ---------------- */
  let optStocks = [];
  function renderOptStocks(d) {
    const wrap = $('optStockWrap'), field = $('optStockField');
    const opts = (d && d.options) || [];
    optStocks = new Array(opts.length).fill(null);
    if (!opts.length) { field.style.display = 'none'; wrap.innerHTML = ''; return; }
    field.style.display = '';
    wrap.innerHTML = '';
    opts.forEach((o, i) => {
      const row = document.createElement('div');
      row.className = 'opt-stock-row';
      row.innerHTML = '<div class="oname" title="' + o.name.replace(/"/g, '&quot;') + '">' + o.name + '</div>' +
        '<input type="number" placeholder="0">';
      row.querySelector('input').addEventListener('input', e => {
        optStocks[i] = num(e.target.value);
        syncOptStocks();
      });
      wrap.appendChild(row);
    });
  }
  function syncOptStocks() {
    const vals = optStocks.filter(v => v != null);
    if (vals.length) {
      $('stockQty').value = vals.reduce((a, b) => a + b, 0);
      const allSame = vals.length > 1 && vals.every(v => v === vals[0]);
      $('stockSetting').value = allSame ? vals[0] + '개씩 세팅' : vals.join(',') + '개 세팅';
    }
    noticeEdited = false;
    renderAll();
  }

  /* ---------------- 생성 로직 ---------------- */
  function buildMemo(d) {
    const l1 = [], l2 = [];
    if (d.rateB != null || d.rateA != null) l1.push((d.rateB == null ? '?' : d.rateB) + '% > ' + (d.rateA == null ? '?' : d.rateA) + '%');
    if (d.priceB != null || d.priceA != null) l1.push(fmt(d.priceB) + ' > ' + fmt(d.priceA));
    if (d.limitNum != null) l2.push(fmt(d.limitNum) + d.limitUnit + ' 한정');
    if (d.stockSetting) l2.push(d.stockSetting);
    const lines = [];
    if (l1.length) lines.push(l1.join(' / '));
    if (l2.length) lines.push(l2.join(' / '));
    return lines.join('\n');
  }
  const limitTag = d => d.limitNum != null ? '[' + fmt(d.limitNum) + d.limitUnit + ' 한정]' : '';
  const sheetName = d => [d.pname, d.seller].filter(Boolean).join(' - ');

  function buildNotice(d) {
    return (d.seller || '셀러명') + ' - ' + (d.pname || '상품명') + '\n\n' +
      '앱 한정특가 진행으로 상품 복사 후 본링크 숨김처리했습니다.\n' +
      '상품명, 이전판매가, 썸네일, 재고 변경 했습니다.\n\n' +
      '▶ 상품명 변경\n> ' + limitTag(d) + (d.nameNew || '?') + '\n\n' +
      '▶ 이전판매가 변경\n' + (fmt(d.priceB) || '?') + ' > ' + (fmt(d.priceA) || '?') + '\n\n' +
      '▶ 썸네일 변경\n' + (d.rateA == null ? '?' : d.rateA) + '% 할인율 기입\n\n' +
      '▶ 재고 변경\n' + (d.stockQty == null ? '?' : fmt(d.stockQty)) + '개';
  }

  function checkItems(d) {
    const c = v => '<span class="val">' + (v || '?') + '</span>';
    return [
      '본링크 ' + c(d.codeMain) + ' <b>숨김</b> 처리',
      '본링크 상품 <b>복사</b>',
      '복사본에 <b>숨김상품 카테고리</b> 추가 <span class="dim">(자생형 CRM 선별 제외)</span>',
      '태그 추가: ' + c('한정특가 - ' + category),
      '복사본 상품코드를 시트 <b>E열</b> + 위 <b>복사본 코드 칸</b>에 입력',
      '상품명 변경 → ' + c(limitTag(d) + (d.nameNew || '')),
      '이전판매가 변경 ' + c((fmt(d.priceB) || '?') + ' > ' + (fmt(d.priceA) || '?')),
      '재고 변경 ' + c(d.stockQty == null ? '?' : fmt(d.stockQty) + '개') + ' <span class="dim">/ ' + (d.stockSetting || '세팅 방식 미입력') + '</span>',
      '게시기간 설정 ' + c((shortDate(d.dStart) || '?') + ' ~ ' + (shortDate(d.dEnd) || '?')),
      '썸네일 교체 — 할인율 ' + c((d.rateA == null ? '?' : d.rateA) + '%') + ' 기입본',
      '상품재고 <b>보임</b> 처리',
      '시트에 행 붙여넣기 <span class="dim">(① 복사 버튼)</span>',
      '단톡방 고지 <span class="dim">(② 복사 버튼)</span>'
    ];
  }

  function renderChecklist(d) {
    const ul = $('checkList'); ul.innerHTML = '';
    checkItems(d).forEach((html, i) => {
      const li = document.createElement('li');
      if (checkState[i]) li.classList.add('done');
      li.innerHTML = '<input type="checkbox"' + (checkState[i] ? ' checked' : '') + '><div class="txt">' + html + '</div>';
      li.addEventListener('click', e => {
        const cb = li.querySelector('input');
        if (e.target !== cb) cb.checked = !cb.checked;
        checkState[i] = cb.checked;
        li.classList.toggle('done', cb.checked);
        updateProgress();
      });
      ul.appendChild(li);
    });
    updateProgress();
  }
  function updateProgress() {
    $('checkProgress').textContent = checkState.filter(Boolean).length + ' / ' + checkState.length;
  }

  function renderSheet(d) {
    $('sheetRow').innerHTML =
      '<td>' + (shortDate(d.dStart) || '-') + '</td><td>' + (shortDate(d.dEnd) || '-') + '</td>' +
      '<td class="code-cell">' + (d.codeMain || '-') + '</td><td class="code-cell">' + (d.codeCopy || '-') + '</td>' +
      '<td>' + (sheetName(d) || '-') + '</td><td></td><td></td>' +
      '<td class="memo">' + (buildMemo(d) || '-') + '</td>';
  }

  function buildTSV(d) {
    const memo = buildMemo(d);
    const memoCell = memo.indexOf('\n') >= 0 ? '"' + memo.replace(/"/g, '""') + '"' : memo;
    const cells = [shortDate(d.dStart), shortDate(d.dEnd), d.codeMain, d.codeCopy, sheetName(d), '', '']
      .concat(new Array(d.hiddenCols).fill('')).concat([memoCell]);
    return cells.join('\t');
  }

  function renderAll() {
    const d = getData();
    renderSheet(d);
    if (!noticeEdited) $('noticeText').value = buildNotice(d);
    renderChecklist(d);
    $('openCopy').style.display = d.codeCopy ? 'inline' : 'none';
  }

  /* ---------------- 복사본 생성 + 자동 입력 ---------------- */
  let thumbFile = null;

  function setCreateMsg(t, cls) { const m = $('createMsg'); m.textContent = t; m.className = 'hint' + (cls ? ' ' + cls : ''); m.id = 'createMsg'; }

  async function createCopy() {
    const d = getData();
    if (!srcData || !d.codeMain) { setCreateMsg('✗ 먼저 본링크를 불러와줘', 'err'); return; }
    const missing = [];
    if (!d.nameNew) missing.push('상품명 변경');
    if (d.priceA == null) missing.push('이전판매가 후');
    if (!d.dStart || !d.dEnd) missing.push('게시기간');
    if (d.stockQty == null) missing.push('재고 수량');
    if (missing.length) { setCreateMsg('✗ 입력 필요: ' + missing.join(', '), 'err'); return; }

    const summary = '복사본을 생성하고 자동 입력합니다.\n\n' +
      '원본: ' + d.codeMain + '\n' +
      '상품명: ' + limitTag(d) + d.nameNew + '\n' +
      '이전판매가: ' + fmt(d.priceA) + '원\n' +
      '게시기간: ' + shortDate(d.dStart) + ' ~ ' + shortDate(d.dEnd) + '\n' +
      '재고: ' + fmt(d.stockQty) + '개 (보임)\n' +
      (thumbFile ? '썸네일: ' + thumbFile.name + '\n' : '') +
      '\n새 탭에서 확인 후 직접 [저장]을 눌러야 반영됩니다.';
    if (!confirm(summary)) return;

    const btn = $('createCopyBtn');
    btn.disabled = true; setCreateMsg('복사본 생성 중...');
    try {
      const res = await fetch('/Good/CopyGood', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ ori_mg_code: d.codeMain })
      });
      if (!res.ok) throw new Error('CopyGood 응답 ' + res.status);
      const raw = await res.text();
      const m = raw.match(/SAI\d{6,}/);
      if (!m) {
        setCreateMsg('✗ 복사는 됐을 수 있으나 새 코드를 못 찾음 — 목록에서 확인 필요', 'err');
        alert('CopyGood 응답에서 새 상품코드를 찾지 못했어.\n응답 내용을 그대로 전달해줘:\n\n' + raw.slice(0, 400));
        return;
      }
      const newCode = m[0];
      $('codeCopy').value = newCode;
      noticeEdited = false;
      renderAll();
      setCreateMsg('✓ 복사본 ' + newCode + ' 생성 — 새 탭에서 자동 입력 중...', 'ok');
      openAndFill(newCode, d);
    } catch (e) {
      setCreateMsg('✗ ' + e.message, 'err');
    } finally { btn.disabled = false; }
  }

  function openAndFill(code, d) {
    const w = window.open('/Good/registration/' + code + '/?modal=Y', '_blank');
    if (!w) { setCreateMsg('✗ 팝업이 차단됨 — 주소창 오른쪽에서 팝업 허용 후 다시', 'err'); return; }
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (tries > 50) { clearInterval(timer); setCreateMsg('✗ 새 탭 로딩 대기 초과 — 수동 입력 필요', 'err'); return; }
      let ready = false;
      try {
        ready = w.document && w.document.readyState === 'complete' && w.document.querySelector('[name="mg_name"]');
      } catch (e) { return; }
      if (!ready) return;
      clearInterval(timer);
      try {
        fillCopyForm(w, d);
        setCreateMsg('✓ 복사본 ' + code + ' 자동 입력 완료 — 새 탭에서 카테고리·태그 확인 후 저장', 'ok');
      } catch (e) {
        setCreateMsg('✗ 자동 입력 중 오류: ' + e.message, 'err');
      }
    }, 400);
  }

  function fillCopyForm(w, d) {
    const doc = w.document;
    const mark = e => { if (e) e.style.outline = '3px solid #2f6b45'; };
    const set = (name, val) => {
      const e = doc.querySelector('[name="' + name + '"]');
      if (!e) return null;
      e.value = val;
      e.dispatchEvent(new Event('input', { bubbles: true }));
      e.dispatchEvent(new Event('change', { bubbles: true }));
      mark(e); return e;
    };

    set('mg_name', limitTag(d) + d.nameNew);
    set('mg_display_price', d.priceA);
    set('view_start_date', d.dStart);
    set('view_end_date', d.dEnd);
    set('mg_stock_num', d.stockQty == null ? '' : d.stockQty);

    // 재고 보임 처리
    const sv = doc.querySelector('[name="mg_stock_view"]');
    if (sv && !sv.checked) { sv.click(); mark(sv.closest('label') || sv); }

    // 옵션별 재고
    if (srcData && srcData.options) {
      srcData.options.forEach((o, i) => {
        const v = optStocks[i];
        if (v == null) return;
        doc.querySelectorAll('input[name="msov_name1"]').forEach(inp => {
          if (String(inp.value || '').trim() !== o.name) return;
          const row = inp.closest('tr') || inp.parentElement;
          const st = row.querySelector('[name="msov_stock"]');
          if (st) {
            st.value = v;
            st.dispatchEvent(new Event('input', { bubbles: true }));
            st.dispatchEvent(new Event('change', { bubbles: true }));
            mark(st);
          }
        });
      });
    }

    // 메모에 표시 추가
    const memo = doc.querySelector('[name="mg_memo"]');
    if (memo && memo.value.indexOf('앱 한정특가') < 0) {
      memo.value = '* 앱 한정특가 전용\n' + memo.value;
      memo.dispatchEvent(new Event('change', { bubbles: true }));
      mark(memo);
    }

    // 썸네일 첨부
    if (thumbFile) {
      try {
        const fi = doc.querySelector('input[name="mg_img_s"]');
        if (fi) {
          const dt = new w.DataTransfer();
          dt.items.add(thumbFile);
          fi.files = dt.files;
          fi.dispatchEvent(new Event('change', { bubbles: true }));
          mark(fi.closest('div') || fi);
        }
      } catch (e) {
        w.alert('썸네일 자동 첨부 실패 — 수동으로 첨부해줘 (' + e.message + ')');
      }
    }

    // 상단 안내 배너
    const banner = doc.createElement('div');
    banner.style.cssText = 'position:sticky;top:0;z-index:99999;background:#1f4a30;color:#fff;padding:10px 16px;font-size:14px;font-weight:700;';
    banner.textContent = '⚡ 도우미 자동 입력 완료 (초록 테두리 항목) — 카테고리(숨김상품)·태그(한정특가 - ' + category + ')는 직접 설정하고 저장하세요';
    doc.body.prepend(banner);
    w.focus();
  }

  /* ---------------- 이벤트 ---------------- */
  formIds.forEach(id => $(id).addEventListener('input', () => {
    if (id !== 'hiddenCols') noticeEdited = false;
    renderAll();
  }));
  $('noticeText').addEventListener('input', () => { noticeEdited = true; });
  $('priceAfter').addEventListener('input', priceToRate);
  $('rateAfter').addEventListener('input', rateToPrice);
  $('createCopyBtn').addEventListener('click', createCopy);
  $('thumbFile').addEventListener('change', e => {
    thumbFile = e.target.files[0] || null;
    $('thumbInfo').textContent = thumbFile
      ? '✓ ' + thumbFile.name + ' (' + Math.round(thumbFile.size / 1024) + 'KB) — 복사본 생성 시 자동 첨부'
      : '복사본 수정 페이지의 대표이미지에 자동으로 들어감';
  });

  root.querySelectorAll('#catSeg button').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('#catSeg button').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      category = btn.dataset.cat;
      renderAll();
    });
  });

  function flashCopied(btn) {
    const orig = btn.textContent;
    btn.textContent = '✓ 복사됨'; btn.classList.add('done');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('done'); }, 1500);
  }
  $('copySheet').addEventListener('click', e => {
    navigator.clipboard.writeText(buildTSV(getData())).then(() => flashCopied(e.target));
  });
  $('copyNotice').addEventListener('click', e => {
    navigator.clipboard.writeText($('noticeText').value).then(() => flashCopied(e.target));
  });
  $('resetCheck').addEventListener('click', () => { checkState.fill(false); renderChecklist(getData()); });

  $('loadBtn').addEventListener('click', () => {
    const code = $('loadCode').value.trim();
    if (code) loadGoods(code);
  });
  $('loadCode').addEventListener('keydown', e => {
    if (e.key === 'Enter') { const code = $('loadCode').value.trim(); if (code) loadGoods(code); }
  });
  $('openMain').addEventListener('click', () => {
    if (srcData && srcData.code) window.open('/Good/registration/' + srcData.code + '/?modal=Y', '_blank');
  });
  $('openCopy').addEventListener('click', () => {
    const c = $('codeCopy').value.trim();
    if (c) window.open('/Good/registration/' + c + '/?modal=Y', '_blank');
  });

  /* 닫기/보이기 */
  const api = {
    show() { host.style.display = ''; },
    hide() { host.style.display = 'none'; }
  };
  $('closeBtn').addEventListener('click', api.hide);
  $('backdrop').addEventListener('click', api.hide);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') api.hide(); });
  window.__JBK_DEAL_HELPER__ = api;

  renderAll();
})();
