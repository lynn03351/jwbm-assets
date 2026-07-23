/*!
 * 제철밥상 리뷰 선별 툴 (review-picker) v1.0
 * 실행 위치: https://www.jecheolbabsang.com 내 아무 페이지
 * 데이터 출처: POST /Goods/GetReviewList (인증 불필요)
 */
(function () {
  'use strict';

  if (window.__JRP__) { window.__JRP__.open(); return; }

  /* ── 설정 ─────────────────────────────────────────────── */
  var CFG = {
    shop: 'airgram123',
    pageSize: 500,
    maxPerProduct: 2000,
    renderCap: 400
  };

  // 샵 식별자 자동 감지 (og:image 경로에서 추출, 실패 시 기본값)
  try {
    var ogi = document.querySelector('meta[property="og:image"]');
    var m = ogi && ogi.content.match(/\/data\/goods\/([^/]+)\//);
    if (m) CFG.shop = m[1];
  } catch (e) {}

  var IMG_BASE = '/data/reviewimg/' + CFG.shop + '/thum3/';

  /* ── 상태 ─────────────────────────────────────────────── */
  var S = {
    products: {},   // mg -> {mg, name, thumb, total, avg, loaded}
    reviews: [],    // 전체 로드된 리뷰
    selected: [],   // 선택 순서 유지 (c_idx 배열)
    byId: {},       // c_idx -> review
    busy: false
  };

  /* ── 유틸 ─────────────────────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function decodeEnt(s) {
    var t = document.createElement('textarea');
    t.innerHTML = String(s == null ? '' : s);
    return t.value;
  }
  function photosOf(photoList) {
    if (!photoList) return [];
    return String(photoList).split('~|~').filter(Boolean).map(function (f) {
      return IMG_BASE + f;
    });
  }
  function cleanOption(o) {
    return decodeEnt(o).replace(/\s*:\s*/, ' · ').replace(/^선택하세요\.?\s*·?\s*/, '').trim();
  }
  function toRel(url) {
    return String(url || '').replace(/^https?:\/\/[^/]*flexgate\.co\.kr/i, '');
  }

  /* ── API ──────────────────────────────────────────────── */
  function apiReviews(mg, page, pagesize, orderBy) {
    return fetch('/Goods/GetReviewList', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ param: { page: page, pagesize: pagesize, mg_code: mg, orderBy: orderBy || 'new' } })
    }).then(function (r) { return r.json(); }).then(function (j) {
      return { rows: (j.data && j.data.data) || [], total: j.dataTotalCount || 0 };
    });
  }

  function apiProduct(mg) {
    return fetch('/Goods/Detail/' + encodeURIComponent(mg))
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var t = doc.querySelector('meta[property="og:title"]');
        var i = doc.querySelector('meta[property="og:image"]');
        return {
          name: ((t && t.content) || (doc.title || '')).trim(),
          thumb: toRel(i && i.content)
        };
      }).catch(function () { return { name: '', thumb: '' }; });
  }

  /* ── UI 뼈대 ──────────────────────────────────────────── */
  var host = document.createElement('div');
  host.id = 'jrp-host';
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;';
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: 'open' });

  root.innerHTML = [
    '<style>',
    ':host,*{box-sizing:border-box}',
    '.wrap{position:fixed;inset:0;display:flex;flex-direction:column;',
    'font-family:"Pretendard","Noto Sans KR",-apple-system,BlinkMacSystemFont,"Malgun Gothic",sans-serif;',
    'background:#f5f6f7;color:#14161a;font-size:13px;line-height:1.5;}',
    '.wrap *{font-variant-numeric:tabular-nums}',

    /* 헤더 */
    '.hd{flex:none;height:52px;background:#14161a;color:#fff;display:flex;align-items:center;gap:14px;padding:0 16px;}',
    '.hd .ttl{font-size:14px;font-weight:800;letter-spacing:-.3px}',
    '.hd .ttl span{color:#8b9099;font-weight:500;margin-left:7px;font-size:11px;letter-spacing:0}',
    '.hd .sp{flex:1}',
    '.hd .cnt{font-size:12px;color:#c9ced6}',
    '.hd .cnt b{color:#fff;font-size:15px;font-weight:800}',
    '.btn{border:0;border-radius:6px;padding:8px 14px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}',
    '.btn.pri{background:#e8322d;color:#fff}',
    '.btn.pri:disabled{background:#4a4d52;color:#8b9099;cursor:default}',
    '.btn.gho{background:#2a2d33;color:#e3e5e8}',
    '.btn.sm{padding:5px 10px;font-size:11.5px}',
    '.btn.lite{background:#fff;border:1px solid #d5d8dd;color:#14161a}',
    '.btn:hover:not(:disabled){filter:brightness(1.12)}',
    '.x{background:none;border:0;color:#8b9099;font-size:22px;cursor:pointer;line-height:1;padding:0 4px}',
    '.x:hover{color:#fff}',

    /* 본문 */
    '.bd{flex:1;display:flex;min-height:0}',
    '.rail{flex:none;width:268px;background:#fff;border-right:1px solid #e3e5e8;overflow-y:auto;padding:16px}',
    '.main{flex:1;display:flex;flex-direction:column;min-width:0}',

    /* 필터 */
    '.grp{margin-bottom:18px}',
    '.grp>label{display:block;font-size:11px;font-weight:800;color:#767b84;letter-spacing:.4px;margin-bottom:7px;text-transform:uppercase}',
    'textarea,input[type=text],input[type=date],input[type=number],select{width:100%;border:1px solid #d5d8dd;border-radius:6px;',
    'padding:7px 9px;font-size:12.5px;font-family:inherit;color:#14161a;background:#fff}',
    'textarea{resize:vertical;min-height:66px;line-height:1.45}',
    'input:focus,textarea:focus,select:focus{outline:2px solid #e8322d33;border-color:#e8322d}',
    '.row2{display:flex;gap:6px}.row2>*{flex:1;min-width:0}',
    '.stars-f{display:flex;gap:4px}',
    '.sbx{flex:1;text-align:center;border:1px solid #d5d8dd;border-radius:6px;padding:6px 0;cursor:pointer;font-size:12px;font-weight:700;color:#767b84;background:#fff;user-select:none}',
    '.sbx.on{background:#14161a;border-color:#14161a;color:#fff}',
    '.chk{display:flex;align-items:center;gap:7px;cursor:pointer;font-size:12.5px;padding:3px 0}',
    '.chk input{width:15px;height:15px;accent-color:#e8322d;cursor:pointer;flex:none}',
    '.hint{font-size:11px;color:#9aa0a8;margin-top:5px;line-height:1.45}',
    '.plist{margin-top:8px;display:flex;flex-direction:column;gap:5px}',
    '.pitem{display:flex;align-items:center;gap:7px;font-size:11.5px;background:#f5f6f7;border-radius:5px;padding:5px 7px}',
    '.pitem img{width:24px;height:24px;border-radius:4px;object-fit:cover;flex:none;background:#e3e5e8}',
    '.pitem .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.pitem .c{color:#767b84;flex:none}',

    /* 툴바 */
    '.tb{flex:none;display:flex;align-items:center;gap:10px;padding:10px 16px;background:#fff;border-bottom:1px solid #e3e5e8}',
    '.tb .info{font-size:12px;color:#767b84}',
    '.tb .info b{color:#14161a;font-weight:800}',
    '.tb select{width:auto;padding:5px 8px;font-size:12px}',

    /* 리스트 */
    '.list{flex:1;overflow-y:auto;padding:12px 16px 16px}',
    '.card{display:flex;gap:11px;background:#fff;border:1px solid #e3e5e8;border-radius:8px;padding:11px 13px;margin-bottom:7px;cursor:pointer}',
    '.card:hover{border-color:#b9bec6}',
    '.card.on{border-color:#e8322d;background:#fff6f5;box-shadow:inset 0 0 0 1px #e8322d}',
    '.card input{width:16px;height:16px;accent-color:#e8322d;cursor:pointer;flex:none;margin-top:2px}',
    '.card .co{flex:1;min-width:0}',
    '.meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px}',
    '.st{color:#ff3b30;font-size:12px;letter-spacing:1px}',
    '.dt{font-size:11.5px;color:#9aa0a8}',
    '.tag{font-size:10.5px;font-weight:700;padding:1px 6px;border-radius:99px;background:#eef0f2;color:#5c6169}',
    '.tag.ph{background:#e6f4ec;color:#1f8a5f}',
    '.tag.rp{background:#eaf0fb;color:#3a63b8}',
    '.txt{font-size:13px;line-height:1.6;color:#22262b;white-space:pre-wrap;word-break:break-word}',
    '.sub{margin-top:6px;font-size:11.5px;color:#767b84;display:flex;gap:6px;align-items:center}',
    '.sub .pn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:46%}',
    '.thumbs{display:flex;gap:5px;flex:none}',
    '.thumbs img{width:58px;height:58px;object-fit:cover;border-radius:5px;background:#eef0f2}',
    '.empty{text-align:center;padding:56px 20px;color:#9aa0a8;font-size:13px;line-height:1.7}',

    /* 트레이 */
    '.tray{flex:none;background:#fff;border-top:1px solid #e3e5e8;display:flex;flex-direction:column;max-height:250px}',
    '.tray .th{display:flex;align-items:center;gap:10px;padding:8px 16px;border-bottom:1px solid #eef0f2}',
    '.tray .th .t{font-size:11px;font-weight:800;color:#767b84;letter-spacing:.4px;text-transform:uppercase}',
    '.tray .th .sp{flex:1}',
    '.trow{display:flex;gap:9px;overflow-x:auto;padding:11px 16px;align-items:stretch}',
    '.tc{flex:0 0 132px;border:1px solid #e3e5e8;border-radius:9px;overflow:hidden;background:#fff;display:flex;flex-direction:column;position:relative}',
    '.tc .ph{width:100%;height:88px;object-fit:cover;background:#eef0f2;display:block}',
    '.tc .nb{height:88px;background:#f5f6f7;display:flex;align-items:center;justify-content:center;color:#c3c8cf;font-size:11px}',
    '.tc .cb{padding:7px 8px 8px;display:flex;flex-direction:column;flex:1}',
    '.tc .cs{color:#ff3b30;font-size:10px;letter-spacing:.5px}',
    '.tc .ct{font-size:10.5px;line-height:1.45;color:#3a3f46;margin-top:3px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}',
    '.tc .cp{margin-top:auto;padding-top:6px;font-size:9.5px;color:#9aa0a8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.tc .del{position:absolute;top:4px;right:4px;width:19px;height:19px;border-radius:50%;background:rgba(20,22,26,.72);color:#fff;border:0;font-size:12px;line-height:19px;cursor:pointer;padding:0}',
    '.tc .ord{position:absolute;top:4px;left:4px;background:#e8322d;color:#fff;font-size:9.5px;font-weight:800;border-radius:4px;padding:1px 5px}',
    '.tempty{padding:26px 16px;color:#b9bec6;font-size:12px;text-align:center;width:100%}',

    /* 오버레이 */
    '.ov{position:fixed;inset:0;background:rgba(20,22,26,.55);display:flex;align-items:center;justify-content:center;padding:24px}',
    '.dlg{background:#fff;border-radius:10px;width:min(760px,100%);max-height:84vh;display:flex;flex-direction:column;overflow:hidden}',
    '.dlg .dh{display:flex;align-items:center;padding:14px 18px;border-bottom:1px solid #e3e5e8}',
    '.dlg .dh b{flex:1;font-size:14px}',
    '.dlg pre{margin:0;flex:1;overflow:auto;padding:14px 18px;font-size:11.5px;line-height:1.55;background:#fafbfc;',
    'font-family:ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-all}',
    '.dlg .df{display:flex;gap:8px;padding:12px 18px;border-top:1px solid #e3e5e8;justify-content:flex-end}',

    /* 로딩 */
    '.bar{position:absolute;left:0;right:0;top:52px;height:2px;background:#e3e5e8;overflow:hidden}',
    '.bar i{display:block;height:100%;background:#e8322d;transition:width .2s}',
    '@media(max-width:820px){.rail{width:214px;padding:12px}.thumbs img{width:44px;height:44px}}',
    '</style>',

    '<div class="wrap">',
    '  <div class="hd">',
    '    <div class="ttl">리뷰 선별 <span>제철밥상 · FLEXG</span></div>',
    '    <div class="sp"></div>',
    '    <div class="cnt">선택 <b id="selN">0</b>건</div>',
    '    <button class="btn pri" id="expBtn" disabled>JSON 내보내기</button>',
    '    <button class="x" id="closeBtn">&times;</button>',
    '  </div>',
    '  <div class="bar" id="bar" style="display:none"><i style="width:0"></i></div>',
    '  <div class="bd">',
    '    <div class="rail">',
    '      <div class="grp">',
    '        <label>상품코드</label>',
    '        <textarea id="codes" placeholder="SAI42598491&#10;SAI54637159&#10;쉼표·줄바꿈으로 여러 개"></textarea>',
    '        <div class="row2" style="margin-top:6px">',
    '          <button class="btn pri sm" id="loadBtn">리뷰 불러오기</button>',
    '          <button class="btn lite sm" id="hereBtn">현재 상품</button>',
    '        </div>',
    '        <div class="hint" id="loadHint">상품 상세페이지 URL 뒤쪽 코드예요.</div>',
    '        <div class="plist" id="plist"></div>',
    '      </div>',
    '      <div class="grp">',
    '        <label>별점</label>',
    '        <div class="stars-f" id="starF">',
    '          <div class="sbx" data-v="1">1</div><div class="sbx" data-v="2">2</div>',
    '          <div class="sbx" data-v="3">3</div><div class="sbx on" data-v="4">4</div>',
    '          <div class="sbx on" data-v="5">5</div>',
    '        </div>',
    '      </div>',
    '      <div class="grp">',
    '        <label>작성일</label>',
    '        <div class="row2"><input type="date" id="dFrom"><input type="date" id="dTo"></div>',
    '      </div>',
    '      <div class="grp">',
    '        <label>글자 수</label>',
    '        <div class="row2">',
    '          <input type="number" id="lMin" placeholder="최소" min="0">',
    '          <input type="number" id="lMax" placeholder="최대" min="0">',
    '        </div>',
    '      </div>',
    '      <div class="grp">',
    '        <label>키워드</label>',
    '        <input type="text" id="kwIn" placeholder="포함할 단어">',
    '        <input type="text" id="kwEx" placeholder="제외할 단어" style="margin-top:6px">',
    '      </div>',
    '      <div class="grp">',
    '        <label>조건</label>',
    '        <label class="chk"><input type="checkbox" id="onlyPhoto">사진 있는 리뷰만</label>',
    '        <label class="chk"><input type="checkbox" id="onlyReply">운영자 답글 있는 것만</label>',
    '        <label class="chk"><input type="checkbox" id="hideSel">선택한 리뷰 숨기기</label>',
    '      </div>',
    '    </div>',
    '    <div class="main">',
    '      <div class="tb">',
    '        <div class="info" id="info">상품코드를 넣고 불러오기를 눌러줘.</div>',
    '        <div style="flex:1"></div>',
    '        <select id="sortSel">',
    '          <option value="new">최신순</option>',
    '          <option value="old">오래된순</option>',
    '          <option value="long">글자수 많은순</option>',
    '          <option value="grade">별점 높은순</option>',
    '          <option value="like">도움돼요 많은순</option>',
    '        </select>',
    '        <button class="btn lite sm" id="selPage">보이는 것 전체선택</button>',
    '        <button class="btn lite sm" id="clrSel">선택 해제</button>',
    '      </div>',
    '      <div class="list" id="list"><div class="empty">왼쪽에 상품코드를 넣고 <b>리뷰 불러오기</b>를 눌러줘.<br>현재 상세페이지에 있으면 <b>현재 상품</b> 버튼이 코드를 자동으로 채워줘.</div></div>',
    '    </div>',
    '  </div>',
    '  <div class="tray">',
    '    <div class="th">',
    '      <div class="t">출력 미리보기</div>',
    '      <div class="sp"></div>',
    '      <div class="info" style="font-size:11.5px;color:#9aa0a8">카드를 끌어서 순서를 바꿀 수 있어</div>',
    '    </div>',
    '    <div class="trow" id="trow"><div class="tempty">선택한 리뷰가 여기 순서대로 쌓여</div></div>',
    '  </div>',
    '</div>'
  ].join('\n');

  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };

  /* ── 로딩 ─────────────────────────────────────────────── */
  function prog(p) {
    var b = $('#bar');
    if (p == null) { b.style.display = 'none'; return; }
    b.style.display = 'block';
    b.firstElementChild.style.width = Math.round(p * 100) + '%';
  }

  function loadProducts(codes) {
    if (S.busy) return;
    S.busy = true;
    $('#loadBtn').disabled = true;
    var done = 0;

    var tasks = codes.map(function (mg) {
      return function () {
        return apiProduct(mg).then(function (p) {
          return apiReviews(mg, 1, CFG.pageSize, 'new').then(function (first) {
            var rows = first.rows.slice();
            var total = first.total;
            var cap = Math.min(total, CFG.maxPerProduct);
            var pages = [];
            for (var pg = 2; rows.length + (pg - 2) * CFG.pageSize < cap; pg++) pages.push(pg);

            return pages.reduce(function (chain, pg) {
              return chain.then(function () {
                if (rows.length >= cap) return;
                return apiReviews(mg, pg, CFG.pageSize, 'new').then(function (r) {
                  rows = rows.concat(r.rows);
                });
              });
            }, Promise.resolve()).then(function () {
              rows = rows.slice(0, cap);
              var vis = rows.filter(function (r) { return r.c_isview !== false && r.c_isview !== 'False'; });
              var sum = vis.reduce(function (a, r) { return a + (Number(r.c_grade) || 0); }, 0);
              var avg = vis.length ? Math.round(sum / vis.length * 10) / 10 : 0;

              S.products[mg] = {
                mg: mg, name: p.name || mg, thumb: p.thumb,
                total: total, avg: avg, loaded: vis.length,
                exact: vis.length >= total
              };
              vis.forEach(function (r) {
                if (S.byId[r.c_idx]) return;
                var o = {
                  id: r.c_idx, mg: mg,
                  rating: Number(r.c_grade) || 0,
                  text: decodeEnt(r.c_content || '').trim(),
                  date: (r.c_regdate || '').slice(0, 10),
                  name: r.c_name || '',
                  option: cleanOption(r.mog_option),
                  photos: photosOf(r.photoList),
                  like: Number(r.mrl_like) || 0,
                  reply: !!(r.replyList && String(r.replyList).trim())
                };
                S.byId[o.id] = o;
                S.reviews.push(o);
              });
              done++;
              prog(done / codes.length);
            });
          });
        }).catch(function (e) {
          console.warn('[JRP]', mg, e);
          done++; prog(done / codes.length);
        });
      };
    });

    tasks.reduce(function (c, t) { return c.then(t); }, Promise.resolve()).then(function () {
      S.busy = false;
      $('#loadBtn').disabled = false;
      prog(null);
      renderProducts();
      render();
    });
  }

  function renderProducts() {
    var keys = Object.keys(S.products);
    $('#plist').innerHTML = keys.map(function (k) {
      var p = S.products[k];
      return '<div class="pitem">' +
        (p.thumb ? '<img src="' + esc(p.thumb) + '" alt="">' : '<img alt="">') +
        '<span class="n" title="' + esc(p.name) + '">' + esc(p.name) + '</span>' +
        '<span class="c">' + p.loaded + '/' + p.total + '</span></div>';
    }).join('');
  }

  /* ── 필터 ─────────────────────────────────────────────── */
  function filtered() {
    var stars = $$('.sbx.on').map(function (e) { return Number(e.dataset.v); });
    var f = $('#dFrom').value, t = $('#dTo').value;
    var lMin = Number($('#lMin').value) || 0;
    var lMax = Number($('#lMax').value) || 0;
    var kwIn = $('#kwIn').value.trim();
    var kwEx = $('#kwEx').value.trim();
    var oPh = $('#onlyPhoto').checked, oRp = $('#onlyReply').checked, hSel = $('#hideSel').checked;

    var out = S.reviews.filter(function (r) {
      if (stars.length && stars.indexOf(r.rating) < 0) return false;
      if (f && r.date < f) return false;
      if (t && r.date > t) return false;
      var L = r.text.replace(/\s/g, '').length;
      if (lMin && L < lMin) return false;
      if (lMax && L > lMax) return false;
      if (kwIn && r.text.indexOf(kwIn) < 0) return false;
      if (kwEx && r.text.indexOf(kwEx) >= 0) return false;
      if (oPh && !r.photos.length) return false;
      if (oRp && !r.reply) return false;
      if (hSel && S.selected.indexOf(r.id) >= 0) return false;
      return true;
    });

    var s = $('#sortSel').value;
    out.sort(function (a, b) {
      if (s === 'new') return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
      if (s === 'old') return a.date > b.date ? 1 : a.date < b.date ? -1 : 0;
      if (s === 'long') return b.text.length - a.text.length;
      if (s === 'grade') return b.rating - a.rating || (a.date < b.date ? 1 : -1);
      if (s === 'like') return b.like - a.like;
      return 0;
    });
    return out;
  }

  function starStr(n) {
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  }

  var _view = [];
  function render() {
    var rows = filtered();
    _view = rows;
    var shown = rows.slice(0, CFG.renderCap);

    $('#info').innerHTML = S.reviews.length
      ? '전체 <b>' + S.reviews.length + '</b>건 중 조건 일치 <b>' + rows.length + '</b>건' +
        (rows.length > CFG.renderCap ? ' <span style="color:#9aa0a8">(상위 ' + CFG.renderCap + '건 표시)</span>' : '')
      : '상품코드를 넣고 불러오기를 눌러줘.';

    if (!shown.length) {
      $('#list').innerHTML = '<div class="empty">' +
        (S.reviews.length ? '조건에 맞는 리뷰가 없어. 필터를 완화해봐.' : '아직 불러온 리뷰가 없어.') + '</div>';
      return;
    }

    $('#list').innerHTML = shown.map(function (r) {
      var p = S.products[r.mg] || {};
      var on = S.selected.indexOf(r.id) >= 0;
      return '<div class="card' + (on ? ' on' : '') + '" data-id="' + r.id + '">' +
        '<input type="checkbox"' + (on ? ' checked' : '') + '>' +
        '<div class="co">' +
          '<div class="meta">' +
            '<span class="st">' + starStr(r.rating) + '</span>' +
            '<span class="dt">' + esc(r.date) + '</span>' +
            '<span class="dt">' + esc(r.name) + '</span>' +
            '<span class="tag">' + r.text.replace(/\s/g, '').length + '자</span>' +
            (r.photos.length ? '<span class="tag ph">사진 ' + r.photos.length + '</span>' : '') +
            (r.reply ? '<span class="tag rp">답글</span>' : '') +
            (r.like ? '<span class="tag">도움 ' + r.like + '</span>' : '') +
          '</div>' +
          '<div class="txt">' + esc(r.text) + '</div>' +
          '<div class="sub"><span class="pn">' + esc(p.name || r.mg) + '</span>' +
            (r.option ? '<span>· ' + esc(r.option) + '</span>' : '') + '</div>' +
        '</div>' +
        (r.photos.length ? '<div class="thumbs">' + r.photos.slice(0, 2).map(function (u) {
          return '<img src="' + esc(u) + '" loading="lazy" alt="">';
        }).join('') + '</div>' : '') +
      '</div>';
    }).join('');
  }

  function renderTray() {
    $('#selN').textContent = S.selected.length;
    $('#expBtn').disabled = !S.selected.length;

    if (!S.selected.length) {
      $('#trow').innerHTML = '<div class="tempty">선택한 리뷰가 여기 순서대로 쌓여</div>';
      return;
    }
    $('#trow').innerHTML = S.selected.map(function (id, i) {
      var r = S.byId[id]; if (!r) return '';
      var p = S.products[r.mg] || {};
      return '<div class="tc" draggable="true" data-id="' + id + '">' +
        '<span class="ord">' + (i + 1) + '</span>' +
        '<button class="del" data-del="' + id + '">&times;</button>' +
        (r.photos.length
          ? '<img class="ph" src="' + esc(r.photos[0]) + '" alt="">'
          : '<div class="nb">사진 없음</div>') +
        '<div class="cb">' +
          '<div class="cs">' + starStr(r.rating) + '</div>' +
          '<div class="ct">' + esc(r.text) + '</div>' +
          '<div class="cp">' + esc(p.name || r.mg) + '</div>' +
        '</div></div>';
    }).join('');
  }

  /* ── 선택 ─────────────────────────────────────────────── */
  function toggle(id) {
    var i = S.selected.indexOf(id);
    if (i >= 0) S.selected.splice(i, 1); else S.selected.push(id);
    renderTray();
    if ($('#hideSel').checked) render();
    else {
      var c = root.querySelector('.card[data-id="' + id + '"]');
      if (c) {
        c.classList.toggle('on', S.selected.indexOf(id) >= 0);
        c.querySelector('input').checked = S.selected.indexOf(id) >= 0;
      }
    }
  }

  /* ── 내보내기 ─────────────────────────────────────────── */
  function buildJSON() {
    return {
      v: 1,
      generated: new Date().toISOString(),
      shop: CFG.shop,
      reviews: S.selected.map(function (id) {
        var r = S.byId[id]; var p = S.products[r.mg] || {};
        return {
          id: r.id,
          rating: r.rating,
          text: r.text,
          date: r.date,
          name: r.name,
          option: r.option,
          photos: r.photos,
          product: {
            mg: r.mg,
            name: p.name || '',
            thumb: p.thumb || '',
            avg: p.avg || 0,
            cnt: p.total || 0
          }
        };
      })
    };
  }

  function showExport() {
    var json = JSON.stringify(buildJSON(), null, 2);
    var ov = document.createElement('div');
    ov.className = 'ov';
    ov.innerHTML = '<div class="dlg">' +
      '<div class="dh"><b>reviews.json &middot; ' + S.selected.length + '건</b>' +
      '<button class="x" style="color:#767b84" data-close>&times;</button></div>' +
      '<pre></pre>' +
      '<div class="df">' +
      '<button class="btn lite" data-close>닫기</button>' +
      '<button class="btn lite" data-copy>복사</button>' +
      '<button class="btn pri" data-dl>파일 저장</button>' +
      '</div></div>';
    ov.querySelector('pre').textContent = json;
    root.querySelector('.wrap').appendChild(ov);

    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-close]')) ov.remove();
      else if (e.target.closest('[data-copy]')) {
        navigator.clipboard.writeText(json).then(function () {
          e.target.textContent = '복사됨';
          setTimeout(function () { e.target.textContent = '복사'; }, 1400);
        });
      } else if (e.target.closest('[data-dl]')) {
        var b = new Blob([json], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'reviews.json';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      }
    });
  }

  /* ── 이벤트 ───────────────────────────────────────────── */
  $('#closeBtn').onclick = function () { host.style.display = 'none'; };

  $('#starF').onclick = function (e) {
    var b = e.target.closest('.sbx'); if (!b) return;
    b.classList.toggle('on'); render();
  };

  ['dFrom', 'dTo', 'lMin', 'lMax', 'kwIn', 'kwEx'].forEach(function (id) {
    $('#' + id).oninput = render;
  });
  ['onlyPhoto', 'onlyReply', 'hideSel'].forEach(function (id) {
    $('#' + id).onchange = render;
  });
  $('#sortSel').onchange = render;

  $('#hereBtn').onclick = function () {
    var m = location.pathname.match(/\/Goods\/Detail\/([^/?#]+)/i);
    if (m) {
      var cur = $('#codes').value.trim();
      if (cur.indexOf(m[1]) < 0) $('#codes').value = (cur ? cur + '\n' : '') + m[1];
      $('#loadHint').textContent = '현재 상품 코드를 넣었어: ' + m[1];
    } else {
      $('#loadHint').textContent = '지금은 상품 상세페이지가 아니야. 코드를 직접 입력해줘.';
    }
  };

  $('#loadBtn').onclick = function () {
    var codes = $('#codes').value.split(/[\s,;]+/).map(function (s) { return s.trim(); })
      .filter(Boolean).filter(function (c, i, a) { return a.indexOf(c) === i; })
      .filter(function (c) { return !S.products[c]; });
    if (!codes.length) { $('#loadHint').textContent = '새로 불러올 코드가 없어.'; return; }
    $('#loadHint').textContent = codes.length + '개 상품 불러오는 중…';
    loadProducts(codes);
  };

  $('#list').onclick = function (e) {
    var c = e.target.closest('.card'); if (!c) return;
    toggle(Number(c.dataset.id));
  };

  $('#selPage').onclick = function () {
    _view.slice(0, CFG.renderCap).forEach(function (r) {
      if (S.selected.indexOf(r.id) < 0) S.selected.push(r.id);
    });
    renderTray(); render();
  };
  $('#clrSel').onclick = function () { S.selected = []; renderTray(); render(); };
  $('#expBtn').onclick = showExport;

  // 트레이: 삭제 + 드래그 정렬
  var dragId = null;
  $('#trow').addEventListener('click', function (e) {
    var d = e.target.closest('[data-del]'); if (!d) return;
    toggle(Number(d.dataset.del));
  });
  $('#trow').addEventListener('dragstart', function (e) {
    var c = e.target.closest('.tc'); if (!c) return;
    dragId = Number(c.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
  });
  $('#trow').addEventListener('dragover', function (e) {
    e.preventDefault();
    var c = e.target.closest('.tc'); if (!c || dragId == null) return;
    var over = Number(c.dataset.id);
    if (over === dragId) return;
    var from = S.selected.indexOf(dragId), to = S.selected.indexOf(over);
    if (from < 0 || to < 0) return;
    S.selected.splice(from, 1);
    S.selected.splice(to, 0, dragId);
    renderTray();
  });
  $('#trow').addEventListener('drop', function (e) { e.preventDefault(); dragId = null; });

  window.__JRP__ = { open: function () { host.style.display = ''; }, state: S };

  // 상세페이지면 자동으로 코드 채워두기
  (function () {
    var m = location.pathname.match(/\/Goods\/Detail\/([^/?#]+)/i);
    if (m) { $('#codes').value = m[1]; $('#loadHint').textContent = '현재 상품 코드를 자동으로 넣었어.'; }
  })();

  renderTray();
})();
