/* 제철밥상 카테고리 옵션 추출기 v1.1 (북마클릿)
 * FLEXG 관리자(airgram123.flexgate.co.kr)에서 실행.
 * 카테고리 선택 -> 상품별 수정페이지를 순회하며 옵션명/공급가/판매가 + 배송비 추출 -> 표 + CSV 다운로드
 * v1.1: 배송비 추출 추가 (개별/공통, 유형, 금액, 조건, 결제방식, 제주 추가배송비)
 */
(function () {
    'use strict';

    if (location.hostname.indexOf('flexgate.co.kr') === -1) {
        alert('FLEXG 관리자 페이지에서 실행해주세요.');
        return;
    }

    var OLD = document.getElementById('jbOptExtract');
    if (OLD) { OLD.parentNode.removeChild(OLD); }

    var FETCH_DELAY = 200; // ms, 상품당 요청 간격 (서버 부담 방지)
    var state = { running: false, abort: false, rows: [], catName: '', commonDvr: null };

    var DFEE_TYPE = { '1': '무료배송', '2': '고정 배송비', '3': '조건부 무료', '4': '수량별 배송비', '5': '금액별 배송비', '6': '반복 수량 배송비' };
    var DFEE_PAY = { '1': '구매자 선택', '2': '선결제', '3': '착불' };

    /* ---------- UI ---------- */
    var css = ''
        + '#jbOptExtract{position:fixed;top:40px;right:40px;width:760px;max-height:85vh;z-index:999999;'
        + 'background:#fff;border:1px solid #d0d0d0;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.25);'
        + 'font-family:Pretendard,Malgun Gothic,sans-serif;font-size:13px;color:#222;display:flex;flex-direction:column;overflow:hidden}'
        + '#jbOptExtract .jbx-head{display:flex;align-items:center;gap:10px;padding:12px 16px;background:#1c1c1e;color:#fff;cursor:move}'
        + '#jbOptExtract .jbx-head b{font-size:14px}'
        + '#jbOptExtract .jbx-head .jbx-close{margin-left:auto;cursor:pointer;font-size:18px;line-height:1;padding:2px 6px}'
        + '#jbOptExtract .jbx-body{padding:14px 16px;overflow:auto}'
        + '#jbOptExtract select,#jbOptExtract button{font-family:inherit;font-size:13px}'
        + '#jbOptExtract .jbx-row{display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap}'
        + '#jbOptExtract select{padding:6px 8px;border:1px solid #ccc;border-radius:6px;max-width:420px}'
        + '#jbOptExtract .jbx-btn{padding:7px 14px;border:0;border-radius:6px;cursor:pointer;background:#2f7d32;color:#fff;font-weight:600}'
        + '#jbOptExtract .jbx-btn:disabled{background:#aaa;cursor:default}'
        + '#jbOptExtract .jbx-btn.jbx-gray{background:#666}'
        + '#jbOptExtract .jbx-btn.jbx-red{background:#c0392b}'
        + '#jbOptExtract .jbx-status{margin:4px 0 10px;color:#555;min-height:18px}'
        + '#jbOptExtract table{border-collapse:collapse;width:100%;font-size:12px}'
        + '#jbOptExtract th,#jbOptExtract td{border:1px solid #e2e2e2;padding:5px 8px;text-align:left;vertical-align:top}'
        + '#jbOptExtract th{background:#f5f5f5;position:sticky;top:0}'
        + '#jbOptExtract td.jbx-num{text-align:right;white-space:nowrap}'
        + '#jbOptExtract tr.jbx-off td{color:#b0b0b0}'
        + '#jbOptExtract .jbx-tablewrap{max-height:45vh;overflow:auto;border:1px solid #e2e2e2;border-radius:8px}';

    var styleEl = document.createElement('style');
    styleEl.textContent = css;

    var panel = document.createElement('div');
    panel.id = 'jbOptExtract';
    panel.innerHTML = ''
        + '<div class="jbx-head"><b>카테고리 옵션 추출기 v1.1</b><span class="jbx-close" title="닫기">&#10005;</span></div>'
        + '<div class="jbx-body">'
        + '  <div class="jbx-row">'
        + '    <label>카테고리</label>'
        + '    <select class="jbx-cate"><option value="">불러오는 중...</option></select>'
        + '    <button class="jbx-btn jbx-start" disabled>추출 시작</button>'
        + '    <button class="jbx-btn jbx-red jbx-stop" style="display:none">중단</button>'
        + '    <button class="jbx-btn jbx-gray jbx-csv" disabled>CSV 다운로드</button>'
        + '  </div>'
        + '  <div class="jbx-status">카테고리 목록을 불러오는 중...</div>'
        + '  <div class="jbx-tablewrap"><table>'
        + '    <thead><tr><th>#</th><th>상품코드</th><th>상품명</th><th>옵션명</th><th>공급가</th><th>판매가</th><th>재고</th><th>사용</th><th>배송비</th></tr></thead>'
        + '    <tbody class="jbx-tbody"><tr><td colspan="9" style="color:#999">아직 데이터가 없습니다.</td></tr></tbody>'
        + '  </table></div>'
        + '</div>';

    document.head.appendChild(styleEl);
    document.body.appendChild(panel);

    var $ = function (sel) { return panel.querySelector(sel); };
    var elCate = $('.jbx-cate');
    var elStart = $('.jbx-start');
    var elStop = $('.jbx-stop');
    var elCsv = $('.jbx-csv');
    var elStatus = $('.jbx-status');
    var elTbody = $('.jbx-tbody');

    $('.jbx-close').onclick = function () {
        panel.parentNode.removeChild(panel);
        styleEl.parentNode.removeChild(styleEl);
    };

    /* 드래그 이동 */
    (function () {
        var head = $('.jbx-head'), sx, sy, px, py, drag = false;
        head.addEventListener('mousedown', function (e) {
            if (e.target.className === 'jbx-close') return;
            drag = true; sx = e.clientX; sy = e.clientY;
            var r = panel.getBoundingClientRect(); px = r.left; py = r.top;
            e.preventDefault();
        });
        document.addEventListener('mousemove', function (e) {
            if (!drag) return;
            panel.style.left = (px + e.clientX - sx) + 'px';
            panel.style.top = (py + e.clientY - sy) + 'px';
            panel.style.right = 'auto';
        });
        document.addEventListener('mouseup', function () { drag = false; });
    })();

    function setStatus(msg) { elStatus.textContent = msg; }

    function sleep(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

    function fetchText(url) {
        return fetch(url, { credentials: 'same-origin' }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.text();
        });
    }

    /* ---------- 카테고리 목록 ---------- */
    function loadCategories() {
        return fetch('/Good/GoodCategoryTreeList', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
            body: '{}'
        }).then(function (r) { return r.json(); }).then(function (j) {
            var items = (j && j.data) || [];
            var byParent = {};
            items.forEach(function (it) {
                if (it.type !== 'cate') return;
                var p = it.parent === 'top' ? 'top' : it.parent;
                (byParent[p] = byParent[p] || []).push(it);
            });
            var opts = [];
            function walk(pid, depth, path) {
                (byParent[pid] || []).forEach(function (it) {
                    var full = path ? path + ' > ' + it.text : it.text;
                    opts.push({ id: it.id, label: full, depth: depth });
                    walk(it.id, depth + 1, full);
                });
            }
            walk('top', 0, '');
            elCate.innerHTML = '<option value="">-- 카테고리 선택 --</option>';
            opts.forEach(function (o) {
                var op = document.createElement('option');
                var indent = '';
                for (var i = 0; i < o.depth; i++) indent += '  ';
                op.value = o.id;
                op.textContent = indent + o.label.split(' > ').pop();
                op.setAttribute('data-full', o.label);
                elCate.appendChild(op);
            });
            elStart.disabled = false;
            setStatus('카테고리 ' + opts.length + '개 로드 완료. 카테고리를 선택하고 [추출 시작]을 눌러주세요.');
        });
    }

    /* ---------- 상품 코드 수집 (페이지 순회) ---------- */
    function collectCodes(cateIdx) {
        var codes = [], seen = {};
        function onePage(page) {
            var url = '/Good/goods_list?pagesize=100&page=' + page
                + '&keyword=&search=mg_name&sort=2&topYN=N&cateidxs=' + encodeURIComponent(cateIdx);
            return fetchText(url).then(function (h) {
                var before = codes.length;
                var re = /goRegistration\('(SAI\d+)'\)/g, m;
                while ((m = re.exec(h))) {
                    if (!seen[m[1]]) { seen[m[1]] = 1; codes.push(m[1]); }
                }
                var added = codes.length - before;
                setStatus('상품 목록 수집 중... ' + codes.length + '개 (페이지 ' + page + ')');
                if (added >= 100) { return sleep(FETCH_DELAY).then(function () { return onePage(page + 1); }); }
                return codes;
            });
        }
        return onePage(1);
    }

    /* ---------- 배송비 파싱 ---------- */
    function num0(s) { s = String(s || '').replace(/[^0-9]/g, ''); return s ? parseInt(s, 10) : 0; }

    function parseDvrFields(doc, prefix) {
        /* prefix: 'mg' (상품 개별) 또는 'mi' (공통 설정 페이지) */
        function checkedVal(n) { var e = doc.querySelector('input[name="' + n + '"]:checked'); return e ? e.value : ''; }
        function idVal(i) { var e = doc.getElementById(i) || doc.querySelector('input[name="' + i + '"]'); return e ? num0(e.value) : 0; }
        var type = checkedVal(prefix + '_dfee');
        var pay = checkedVal(prefix + '_dfee_pay');
        var info = {
            type: type,
            typeName: DFEE_TYPE[type] || type,
            pay: DFEE_PAY[pay] || pay,
            fee: '', detail: ''
        };
        if (type === '1') { info.fee = 0; info.detail = '무료'; }
        else if (type === '2') { info.fee = idVal(prefix + '_dfee_price2'); info.detail = '고정 ' + info.fee + '원'; }
        else if (type === '3') {
            info.fee = idVal(prefix + '_dfee_base');
            info.detail = info.fee + '원 (' + idVal(prefix + '_dfee_price3') + '원 이상 무료)';
        }
        else if (type === '6') {
            info.fee = idVal(prefix + '_dfee_price6');
            info.detail = info.fee + '원 / ' + idVal(prefix + '_dfee_base6') + '개마다 반복';
        }
        else if (type === '4') { info.fee = ''; info.detail = '수량별 조건 (관리자 확인 필요)'; }
        else if (type === '5') { info.fee = ''; info.detail = '금액별 조건 (관리자 확인 필요)'; }
        return info;
    }

    function loadCommonDvr() {
        /* 공통 설정 상품용 - 쇼핑몰 기본 배송정책 1회 조회 */
        return fetchText('/Setting/delivery').then(function (h) {
            var doc = new DOMParser().parseFromString(h, 'text/html');
            state.commonDvr = parseDvrFields(doc, 'mi');
        }).catch(function () { state.commonDvr = null; });
    }

    /* ---------- 상품별 옵션 파싱 ---------- */
    function parseProduct(code, html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var nameEl = doc.querySelector('input[name="mg_name"]');
        var pname = nameEl ? nameEl.value : '(상품명 확인 불가)';

        /* 배송비 */
        var useEl = doc.querySelector('input[name="mg_dfee_use"]:checked');
        var dvrUse = useEl ? useEl.value : '';
        var dvr;
        if (dvrUse === 'N') {
            dvr = state.commonDvr
                ? { set: '공통', typeName: state.commonDvr.typeName, fee: state.commonDvr.fee, detail: state.commonDvr.detail, pay: state.commonDvr.pay }
                : { set: '공통', typeName: '공통설정', fee: '', detail: '기본 배송정책 적용', pay: '' };
        } else {
            var d = parseDvrFields(doc, 'mg');
            d.set = '개별';
            dvr = d;
        }
        var jejuEl = doc.querySelector('input[name="mg_adddfee_jeju"]');
        dvr.jeju = jejuEl ? num0(jejuEl.value) : 0;
        var rows = [];
        var inputs = doc.querySelectorAll('input[name="msov_name1"]');
        Array.prototype.forEach.call(inputs, function (inp) {
            var tr = inp.closest ? inp.closest('tr') : null;
            if (!tr) return;
            function v(n) { var e = tr.querySelector('input[name="' + n + '"]'); return e ? e.value : ''; }
            var parts = [v('msov_name1'), v('msov_name2'), v('msov_name3'), v('msov_name4')];
            var optName = [];
            parts.forEach(function (s) { if (s && s.replace(/\s+/g, '')) optName.push(s.trim()); });
            optName = optName.join(' / ');
            var price = v('msov_price');
            if (!optName && !price) return; /* 빈 템플릿 행 제외 */
            rows.push({
                code: code, name: pname, opt: optName || '(옵션명 없음)',
                supply: v('msov_supply'), price: price,
                stock: v('msov_stock'), use: v('msov_useYN'), dvr: dvr
            });
        });
        if (!rows.length) {
            /* 옵션 행이 없는 상품 - 상품 기본 공급가/판매가로 폴백 */
            function pv(n) { var e = doc.querySelector('input[name="' + n + '"]'); return e ? e.value : ''; }
            rows.push({
                code: code, name: pname, opt: '(단일)',
                supply: pv('mg_supply'), price: pv('mg_price'), stock: '', use: '', dvr: dvr
            });
        }
        return rows;
    }

    /* ---------- 렌더 ---------- */
    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function dvrShort(dvr) {
        if (!dvr) return '';
        var s = (dvr.set === '공통' ? '[공통] ' : '') + (dvr.detail || dvr.typeName || '');
        if (dvr.pay === '착불') s += ' (착불)';
        return s;
    }

    function render() {
        if (!state.rows.length) {
            elTbody.innerHTML = '<tr><td colspan="9" style="color:#999">데이터 없음</td></tr>';
            return;
        }
        var html = '', prev = '';
        state.rows.forEach(function (r, i) {
            var cls = (r.use === 'N') ? ' class="jbx-off"' : '';
            html += '<tr' + cls + '><td>' + (i + 1) + '</td>'
                + '<td>' + esc(r.code === prev ? '' : r.code) + '</td>'
                + '<td>' + esc(r.code === prev ? '' : r.name) + '</td>'
                + '<td>' + esc(r.opt) + '</td>'
                + '<td class="jbx-num">' + esc(r.supply) + '</td>'
                + '<td class="jbx-num">' + esc(r.price) + '</td>'
                + '<td class="jbx-num">' + esc(r.stock) + '</td>'
                + '<td>' + esc(r.use) + '</td>'
                + '<td>' + esc(r.code === prev ? '' : dvrShort(r.dvr)) + '</td></tr>';
            prev = r.code;
        });
        elTbody.innerHTML = html;
    }

    /* ---------- CSV ---------- */
    function downloadCsv() {
        var head = ['상품코드', '상품명', '옵션명', '공급가', '판매가', '재고', '사용여부', '배송비설정', '배송비유형', '배송비', '배송비상세', '배송비결제', '제주추가배송비'];
        function cell(s) {
            s = String(s == null ? '' : s).replace(/"/g, '""');
            return '"' + s + '"';
        }
        function num(s) { return String(s || '').replace(/,/g, ''); }
        var lines = [head.map(cell).join(',')];
        state.rows.forEach(function (r) {
            var d = r.dvr || {};
            lines.push([cell(r.code), cell(r.name), cell(r.opt), num(r.supply), num(r.price), num(r.stock), cell(r.use),
                cell(d.set || ''), cell(d.typeName || ''), num(d.fee), cell(d.detail || ''), cell(d.pay || ''), num(d.jeju)].join(','));
        });
        var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
        var a = document.createElement('a');
        var d = new Date();
        function p2(n) { return (n < 10 ? '0' : '') + n; }
        var stamp = d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '_' + p2(d.getHours()) + p2(d.getMinutes());
        a.href = URL.createObjectURL(blob);
        a.download = '옵션추출_' + (state.catName || 'category').replace(/[\\\/:*?"<>|]/g, '_') + '_' + stamp + '.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.parentNode.removeChild(a); }, 500);
    }

    /* ---------- 실행 ---------- */
    function run() {
        var cateIdx = elCate.value;
        if (!cateIdx) { alert('카테고리를 선택해주세요.'); return; }
        var selOpt = elCate.options[elCate.selectedIndex];
        state.catName = (selOpt.getAttribute('data-full') || selOpt.textContent || '').replace(/ /g, '').trim();
        state.running = true; state.abort = false; state.rows = [];
        elStart.disabled = true; elCsv.disabled = true; elCate.disabled = true;
        elStop.style.display = '';
        render();

        loadCommonDvr().then(function () {
            return collectCodes(cateIdx);
        }).then(function (codes) {
            if (!codes.length) {
                setStatus('이 카테고리에 상품이 없습니다.');
                finish();
                return;
            }
            var i = 0, fail = [];
            function next() {
                if (state.abort) { setStatus('중단됨. ' + i + '/' + codes.length + '개 처리, 행 ' + state.rows.length + '개.'); finish(); return; }
                if (i >= codes.length) {
                    var msg = '완료: 상품 ' + codes.length + '개 / 옵션 행 ' + state.rows.length + '개.';
                    if (fail.length) msg += ' 실패 ' + fail.length + '건: ' + fail.join(', ');
                    setStatus(msg);
                    finish();
                    return;
                }
                var code = codes[i];
                setStatus('옵션 추출 중... ' + (i + 1) + '/' + codes.length + ' (' + code + ')');
                fetchText('/Good/registration/' + code + '/?modal=Y').then(function (h) {
                    var rows = parseProduct(code, h);
                    state.rows = state.rows.concat(rows);
                    render();
                }).catch(function () {
                    fail.push(code);
                }).then(function () {
                    i++;
                    return sleep(FETCH_DELAY);
                }).then(next);
            }
            next();
        }).catch(function (e) {
            setStatus('오류: ' + (e && e.message ? e.message : e));
            finish();
        });

        function finish() {
            state.running = false;
            elStart.disabled = false; elCate.disabled = false;
            elStop.style.display = 'none';
            elCsv.disabled = !state.rows.length;
        }
    }

    elStart.onclick = run;
    elStop.onclick = function () { state.abort = true; };
    elCsv.onclick = downloadCsv;

    loadCategories().catch(function (e) {
        setStatus('카테고리 로드 실패: ' + (e && e.message ? e.message : e) + ' - 관리자 로그인 상태를 확인해주세요.');
    });
})();