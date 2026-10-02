/**********************************************************************
 * 제철밥상 채널별 일별 매출 대시보드 (북마클릿)  v1.0
 * - 데이터: 구글시트 「추적코드 일별 매출 기록」 웹앱(doGet) JSON
 * - 지표: 매출(정상금액) / 주문건수(정상건수) / 판매이익 / 객단가 / 이익률
 * - 실행: 북마클릿이 이 파일을 불러옴. 다시 누르면 닫힘
 * - 웹앱 URL·연결 키는 첫 실행 때 입력 → 이 브라우저(localStorage)에만 저장
 **********************************************************************/
(function () {
  'use strict';
  var ID = 'jbCd26';
  var VER = '1.0';
  var LS_KEY = 'jbCd26_cfg';

  var prev = document.getElementById(ID);
  if (prev) { if (window.__jbCd26Close) window.__jbCd26Close(); else prev.parentNode.removeChild(prev); return; }

  /* ---------------- 상수 ---------------- */
  var GROUPS = [
    { label: '카카오톡', c: '#2a78d6' },
    { label: '밴드AD', c: '#eb6834' },
    { label: '채널 외 직접', c: '#1baf7a' },
    { label: 'APP CRM메시지', c: '#eda100' },
    { label: 'APP 배너·메뉴', c: '#e87ba4' },
    { label: '카카오스토리', c: '#008300' },
    { label: 'APP 앱푸시', c: '#4a3aa7' },
    { label: '외부광고·기타', c: '#e34948' }
  ];
  var GROUP_OF = { '카카오톡': 0, '밴드AD': 1, '직접유입': 2, 'APP_CRM메시지': 3, 'APP_배너·메뉴': 4, '카카오스토리': 5, 'APP_앱푸시': 6 };
  var CMP_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];
  var METRICS = [
    { k: 'sales', label: '매출', type: 'sum', num: 'v', fmt: 'money' },
    { k: 'cnt', label: '주문건수', type: 'sum', num: 'c', fmt: 'cnt' },
    { k: 'profit', label: '판매이익', type: 'sum', num: 'p', fmt: 'money' },
    { k: 'aov', label: '객단가', type: 'ratio', num: 'v', den: 'c', fmt: 'won' },
    { k: 'margin', label: '이익률', type: 'ratio', num: 'p', den: 'v', fmt: 'pct' }
  ];
  var MIN_CNT = 10; // 객단가·이익률 순위에 넣을 최소 건수
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  var UP = '#1b6e3d', DOWN = '#b8442d', MUTED = '#6b6a65';

  /* ---------------- 유틸 ---------------- */
  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function money(v) {
    if (Math.abs(v) >= 1e8) return (v / 1e8).toFixed(2) + '억';
    if (Math.abs(v) >= 1e4) return comma(v / 1e4) + '만';
    return comma(v) + '원';
  }
  function fmt(m, v) {
    if (v === null || v === undefined || isNaN(v)) return '-';
    if (m.fmt === 'money') return money(v);
    if (m.fmt === 'cnt') return comma(v) + '건';
    if (m.fmt === 'won') return comma(v) + '원';
    return (v * 100).toFixed(1) + '%';
  }
  function tick(m, v) {
    if (v === 0) return '0';
    if (m.fmt === 'money') {
      if (Math.abs(v) >= 1e8) return (Math.round(v / 1e6) / 100) + '억';
      return comma(v / 1e4) + '만';
    }
    if (m.fmt === 'pct') return (Math.round(v * 1000) / 10) + '%';
    return comma(v);
  }
  function md(s) { return Number(s.slice(5, 7)) + '.' + Number(s.slice(8, 10)); }
  function dow(s) { return WD[new Date(s + 'T00:00:00').getDay()]; }
  function niceStep(raw) {
    if (!(raw > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function zero() { return { v: 0, c: 0, p: 0 }; }
  function addInto(a, src, i) { a.v += src.v[i] || 0; a.c += src.c[i] || 0; a.p += src.p[i] || 0; }
  function aggRange(src, s, e) { var a = zero(); for (var i = s; i <= e; i++) addInto(a, src, i); return a; }
  function aggIdx(src, idx) { var a = zero(); for (var i = 0; i < idx.length; i++) addInto(a, src, idx[i]); return a; }
  function val(m, a) {
    if (m.type === 'sum') return a[m.num];
    return a[m.den] ? a[m.num] / a[m.den] : null;
  }
  // 증감: 합계형은 일평균 기준 %, 객단가는 %, 이익률은 %p
  function delta(m, cur, curDays, prv, prvDays) {
    if (!prv || !prvDays) return null;
    if (m.type === 'sum') {
      var a = cur[m.num] / curDays, b = prv[m.num] / prvDays;
      if (!b) return null;
      return { v: (a - b) / Math.abs(b) * 100, unit: '%' };
    }
    var x = val(m, cur), y = val(m, prv);
    if (x === null || y === null || !y) return null;
    if (m.fmt === 'pct') return { v: (x - y) * 100, unit: '%p' };
    return { v: (x - y) / Math.abs(y) * 100, unit: '%' };
  }
  function deltaTxt(d) {
    if (!d) return { t: '-', c: MUTED };
    var a = Math.abs(d.v), txt = a >= 1000 ? '999+' : a.toFixed(1);
    if (d.v >= 0) return { t: '▲ ' + txt + d.unit, c: UP };
    return { t: '▼ ' + txt + d.unit, c: DOWN };
  }
  function loadCfg() { try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) { return null; } }
  function saveCfg(c) { try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch (e) {} }

  /* ---------------- 상태 ---------------- */
  var S = {
    view: 'loading', err: '', data: null,
    period: '30d', gran: 'day', metric: 'sales', hidden: {}, sel: null, picks: null, showAll: false
  };
  var M = {}; // 계산된 데이터
  var charts = {}; // 호버용 모델

  /* ---------------- 스타일·뼈대 ---------------- */
  if (!document.getElementById(ID + '-font')) {
    var lk = document.createElement('link');
    lk.id = ID + '-font'; lk.rel = 'stylesheet';
    lk.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css';
    document.head.appendChild(lk);
  }
  var P = '#' + ID;
  var css = [
    P + '{position:fixed;inset:0;z-index:2147483000;background:#f4f4f0;overflow:auto;color:#141413;font-family:Pretendard,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;font-size:14px;line-height:1.45;text-align:left;font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased;letter-spacing:normal}',
    P + ' *{box-sizing:border-box;font-family:inherit}',
    P + ' button{font:inherit;margin:0;line-height:1.2;cursor:pointer;text-transform:none}',
    P + ' button:focus-visible,' + P + ' input:focus-visible{outline:2px solid #2e6b45;outline-offset:2px}',
    P + ' .w{max-width:1320px;margin:0 auto;padding:0 20px 64px;display:flex;flex-direction:column;gap:18px}',
    P + ' .bar{position:sticky;top:0;z-index:5;background:#f4f4f0;padding:18px 0 12px;display:flex;flex-direction:column;gap:12px;border-bottom:1px solid #e4e3de}',
    P + ' .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}',
    P + ' .ttl{font-size:26px;font-weight:700;letter-spacing:-0.01em}',
    P + ' .sub{font-size:13px;color:#52514e}',
    P + ' .chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
    P + ' .chip{min-height:40px;padding:0 15px;border-radius:999px;border:1px solid #d6d5cf;background:#fff;color:#141413;font-size:14px;font-weight:600}',
    P + ' .chip.on{background:#2e6b45;border-color:#2e6b45;color:#fff}',
    P + ' .seg{display:flex;padding:3px;border-radius:12px;background:#e8e7e1;gap:2px}',
    P + ' .seg button{min-height:36px;padding:0 14px;border-radius:9px;border:0;background:transparent;color:#52514e;font-size:14px;font-weight:600}',
    P + ' .seg button.on{background:#fff;color:#141413;box-shadow:0 1px 2px rgba(0,0,0,.08)}',
    P + ' .mt{display:flex;gap:6px;flex-wrap:wrap}',
    P + ' .mt button{min-height:40px;padding:0 16px;border-radius:10px;border:1px solid #d6d5cf;background:#fff;color:#141413;font-size:15px;font-weight:700}',
    P + ' .mt button.on{background:#141413;border-color:#141413;color:#fff}',
    P + ' .tbtn{min-height:38px;padding:0 14px;border-radius:9px;border:1px solid #d6d5cf;background:#fff;color:#141413;font-size:13px;font-weight:600}',
    P + ' .lbl{font-size:12px;font-weight:700;color:#6b6a65;margin-right:2px}',
    P + ' .card{background:#fff;border:1px solid #e4e3de;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:14px;min-width:0}',
    P + ' .ch{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px}',
    P + ' .h2{font-size:19px;font-weight:700}',
    P + ' .note{font-size:13px;color:#6b6a65}',
    P + ' .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}',
    P + ' .kpi{background:#fff;border:1px solid #e4e3de;border-radius:14px;padding:18px 20px;display:flex;flex-direction:column;gap:6px;min-width:0}',
    P + ' .kl{font-size:14px;font-weight:600;color:#52514e}',
    P + ' .kv{font-size:30px;font-weight:800;line-height:1.2;letter-spacing:-0.01em;overflow-wrap:anywhere}',
    P + ' .kv.sm{font-size:20px}',
    P + ' .ks{font-size:14px;font-weight:600}',
    P + ' .leg{display:flex;flex-wrap:wrap;gap:6px}',
    P + ' .leg button{min-height:36px;display:flex;align-items:center;gap:8px;padding:0 12px;border-radius:8px;border:1px solid #d6d5cf;background:#fff;color:#141413;font-size:13px;font-weight:600}',
    P + ' .leg button.off{background:#f4f4f0;border-color:#e4e3de;color:#8d8c86}',
    P + ' .sw{width:16px;height:4px;border-radius:2px;flex-shrink:0;display:inline-block}',
    P + ' .sq{width:10px;height:10px;border-radius:3px;flex-shrink:0;display:inline-block}',
    P + ' .cw{display:flex;gap:8px}',
    P + ' .ya{position:relative;width:56px;flex-shrink:0}',
    P + ' .ya div{position:absolute;right:0;transform:translateY(-50%);font-size:12px;color:#6b6a65;white-space:nowrap}',
    P + ' .pa{flex-grow:1;min-width:0;display:flex;flex-direction:column;gap:6px}',
    P + ' .plot{position:relative;cursor:crosshair}',
    P + ' .gl{position:absolute;left:0;right:0;border-top:1px solid #efeee9}',
    P + ' .gl.z{border-top-color:#8d8c86}',
    P + ' .plot svg{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible}',
    P + ' .plot path{fill:none;stroke-width:3px;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}',
    P + ' .xa{position:relative;height:18px}',
    P + ' .xa div{position:absolute;transform:translateX(-50%);font-size:12px;color:#6b6a65;white-space:nowrap}',
    P + ' .hv{position:absolute;inset:0;pointer-events:none}',
    P + ' .cross{position:absolute;top:0;bottom:0;border-left:1px dashed #8d8c86}',
    P + ' .dot{position:absolute;width:10px;height:10px;border-radius:50%;border:2px solid #fff;transform:translate(-50%,-50%)}',
    P + ' .tip{position:absolute;top:8px;min-width:230px;background:#fff;border:1px solid #dddcd6;border-radius:10px;box-shadow:0 6px 20px rgba(20,20,19,.12);padding:12px 14px;display:flex;flex-direction:column;gap:6px;z-index:2}',
    P + ' .tip .th{display:flex;justify-content:space-between;gap:12px;font-size:14px;font-weight:700}',
    P + ' .tip .tr{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px}',
    P + ' .tip .tn{display:flex;align-items:center;gap:6px;color:#52514e}',
    P + ' .two{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start}',
    P + ' .two > .card:first-child{flex:0 1 330px}',
    P + ' .two > .card:last-child{flex:1 1 560px}',
    P + ' .gs{display:flex;flex-direction:column;gap:6px;width:100%;text-align:left;padding:10px 12px;border-radius:10px;border:1px solid #e4e3de;background:#fff;color:#141413;min-height:44px}',
    P + ' .gs.on{border-color:#2e6b45;background:#eef4ef}',
    P + ' .gs .a{display:flex;justify-content:space-between;align-items:baseline;gap:8px;width:100%}',
    P + ' .gs .n{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600}',
    P + ' .gs .v{font-size:15px;font-weight:700}',
    P + ' .gs .bt{display:block;height:8px;border-radius:4px;background:#efeee9;width:100%}',
    P + ' .gs .bf{display:block;height:8px;border-radius:4px}',
    P + ' .gs .b{display:flex;justify-content:space-between;width:100%;font-size:13px;color:#52514e}',
    P + ' .tw{overflow-x:auto}',
    P + ' .tb{min-width:820px;display:flex;flex-direction:column}',
    P + ' .tbr{display:grid;grid-template-columns:28px minmax(170px,1fr) 96px 72px 84px 84px 96px 68px;gap:10px;align-items:center;padding:8px 4px;border-bottom:1px solid #efeee9;font-size:14px}',
    P + ' .tbr.hd{font-size:12px;font-weight:700;color:#6b6a65;border-bottom:2px solid #141413}',
    P + ' .r{text-align:right}',
    P + ' .tbr .nm{display:flex;flex-direction:column;gap:2px;min-width:0}',
    P + ' .tbr .nm b{font-weight:600;overflow-wrap:anywhere}',
    P + ' .tbr .nm span{font-size:12px;color:#6b6a65}',
    P + ' .tbr svg{width:96px;height:28px;display:block}',
    P + ' .tbr svg path{fill:none;stroke:#52514e;stroke-width:1.5px;stroke-linejoin:round;vector-effect:non-scaling-stroke}',
    P + ' .pk{min-height:34px;width:100%;border-radius:8px;border:1px solid #d6d5cf;background:#fff;color:#141413;font-size:13px;font-weight:600}',
    P + ' .pk.on{background:#141413;border-color:#141413;color:#fff}',
    P + ' .cl{display:flex;flex-wrap:wrap;gap:8px}',
    P + ' .cl > div{display:flex;align-items:center;gap:10px;padding:6px 6px 6px 12px;border:1px solid #e4e3de;border-radius:10px}',
    P + ' .cl b{font-size:14px;font-weight:600;display:block}',
    P + ' .cl span.s{font-size:12px;color:#6b6a65;display:block}',
    P + ' .empty{padding:40px 0;text-align:center;font-size:15px;color:#6b6a65}',
    P + ' .form{max-width:560px;margin:48px auto;display:flex;flex-direction:column;gap:14px}',
    P + ' .form label{display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:600}',
    P + ' .form input{min-height:44px;padding:0 12px;border:1px solid #c9c8c2;border-radius:10px;font-size:14px;background:#fff;color:#141413;width:100%}',
    P + ' .pri{min-height:46px;border-radius:10px;border:0;background:#2e6b45;color:#fff;font-size:15px;font-weight:700}',
    P + ' .errb{padding:12px 14px;border-radius:10px;background:#fbecea;color:#8a2d1f;font-size:14px;font-weight:600}',
    P + ' .foot{font-size:12px;color:#6b6a65;display:flex;flex-direction:column;gap:2px}',
    '@media (max-width:760px){' + P + ' .bar{position:static}' + P + ' .ttl{font-size:22px}' + P + ' .kv{font-size:26px}}'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.id = ID + '-css';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var root = document.createElement('div');
  root.id = ID;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', '채널별 일별 매출 대시보드');
  document.body.appendChild(root);
  var prevOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';

  function close() {
    document.removeEventListener('keydown', onKey, true);
    if (root.parentNode) root.parentNode.removeChild(root);
    if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    document.documentElement.style.overflow = prevOverflow;
    window.__jbCd26Close = null;
  }
  window.__jbCd26Close = close;
  function onKey(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onKey, true);

  /* ---------------- 데이터 준비 ---------------- */
  function prep(d) {
    var n = d.dates.length;
    var mk = function () { var a = []; for (var i = 0; i < n; i++) a.push(0); return a; };
    var G = GROUPS.map(function () { return { v: mk(), c: mk(), p: mk() }; });
    var T = { v: mk(), c: mk(), p: mk() };
    var CH = d.ch.map(function (c) {
      var gi = GROUP_OF.hasOwnProperty(c.g) ? GROUP_OF[c.g] : 7;
      for (var i = 0; i < n; i++) {
        G[gi].v[i] += c.v[i] || 0; G[gi].c[i] += c.c[i] || 0; G[gi].p[i] += c.p[i] || 0;
        T.v[i] += c.v[i] || 0; T.c[i] += c.c[i] || 0; T.p[i] += c.p[i] || 0;
      }
      return { n: c.n, g: c.g, gi: gi, v: c.v, c: c.c, p: c.p };
    });
    var byName = {};
    CH.forEach(function (c) { byName[c.n] = c; });
    var months = [];
    d.dates.forEach(function (x) { var k = x.slice(0, 7); if (months.indexOf(k) < 0) months.push(k); });
    M = { D: d.dates, n: n, G: G, T: T, CH: CH, byName: byName, months: months, updated: d.updated || '' };
    if (!S.picks) {
      S.picks = CH.slice().sort(function (a, b) { return sumArr(b.v) - sumArr(a.v); }).slice(0, 3).map(function (c) { return c.n; });
    }
  }
  function sumArr(a) { var t = 0; for (var i = 0; i < a.length; i++) t += a[i] || 0; return t; }

  function periods() {
    var out = [{ k: '7d', label: '최근 7일' }, { k: '30d', label: '최근 30일' }];
    M.months.slice(-6).forEach(function (m) { out.push({ k: 'm' + m, label: Number(m.slice(5)) + '월' }); });
    out.push({ k: 'all', label: '전체' });
    return out;
  }

  function range(pk) {
    var D = M.D, L = M.n - 1, r;
    if (pk === '7d') r = { s: L - 6, e: L };
    else if (pk === '30d') r = { s: L - 29, e: L };
    else if (pk === 'all') r = { s: 0, e: L };
    else {
      var mm = pk.slice(1), a = -1, b = -1;
      D.forEach(function (x, i) { if (x.slice(0, 7) === mm) { if (a < 0) a = i; b = i; } });
      if (a < 0) return range('30d');
      r = { s: a, e: b };
    }
    r.s = Math.max(0, r.s);
    var len = r.e - r.s + 1;
    r.ps = null; r.cmp = '';
    if (pk === '7d' || pk === '30d') {
      if (r.s - len >= 0) { r.ps = r.s - len; r.pe = r.s - 1; r.cmp = '직전 ' + len + '일 대비'; }
    } else if (pk.charAt(0) === 'm') {
      var mi = M.months.indexOf(pk.slice(1));
      if (mi > 0) {
        var pm = M.months[mi - 1], x = -1, y = -1;
        D.forEach(function (d, i) { if (d.slice(0, 7) === pm) { if (x < 0) x = i; y = i; } });
        r.ps = x; r.pe = y; r.cmp = Number(pm.slice(5)) + '월 대비';
      }
    }
    return r;
  }

  function buckets(s, e, gran) {
    var D = M.D, out = [], i, cur = null, key;
    if (gran === 'day') {
      for (i = s; i <= e; i++) out.push({ idx: [i], label: md(D[i]), title: md(D[i]) + ' (' + dow(D[i]) + ')' });
      return out;
    }
    for (i = s; i <= e; i++) {
      if (gran === 'week') { var off = (new Date(D[i] + 'T00:00:00').getDay() + 6) % 7; key = 'w' + (i - off); }
      else key = D[i].slice(0, 7);
      if (!cur || cur.key !== key) { cur = { key: key, idx: [] }; out.push(cur); }
      cur.idx.push(i);
    }
    return out.map(function (b) {
      var a = D[b.idx[0]], z = D[b.idx[b.idx.length - 1]];
      if (gran === 'month') return { idx: b.idx, label: Number(a.slice(5, 7)) + '월', title: a.slice(0, 4) + '년 ' + Number(a.slice(5, 7)) + '월 (' + b.idx.length + '일)' };
      return { idx: b.idx, label: md(a) + '~', title: md(a) + ' ~ ' + md(z) + (b.idx.length < 7 ? ' (' + b.idx.length + '일)' : '') };
    });
  }

  /* ---------------- 차트 ---------------- */
  function axis(m, lo, hi) {
    if (m.type === 'ratio' && lo > 0) {          // 비율 지표(선 그래프)는 0부터 시작하지 않고 값 범위에 맞춤
      var pad = (hi - lo) * 0.15 || hi * 0.1 || 1;
      lo = Math.max(0, lo - pad); hi = hi + pad;
    } else { lo = Math.min(0, lo); hi = Math.max(0, hi); }
    if (hi === lo) hi = lo + (m.fmt === 'pct' ? 0.1 : 1);
    var step = niceStep((hi - lo) / 4);
    var yMin = Math.floor(lo / step) * step, yMax = Math.ceil(hi / step) * step;
    if (yMax === yMin) yMax = yMin + step;
    var ticks = [];
    for (var v = yMin; v <= yMax + step / 1000; v += step) ticks.push(Math.round(v / step) * step);
    return { yMin: yMin, yMax: yMax, ticks: ticks };
  }
  function yPct(ax, v) { return 100 - (v - ax.yMin) / (ax.yMax - ax.yMin) * 100; }
  function linePath(vals, ax) {
    var m = vals.length, out = '', pen = false;
    for (var j = 0; j < m; j++) {
      var v = vals[j];
      if (v === null || v === undefined || isNaN(v)) { pen = false; continue; }
      var x = m > 1 ? (j / (m - 1)) * 1000 : 500;
      var y = yPct(ax, v) * 3;
      out += (pen ? ' L' : ' M') + x.toFixed(1) + ',' + y.toFixed(1);
      pen = true;
    }
    if (m === 1 && out) out += ' L500.5,' + (yPct(ax, vals[0]) * 3).toFixed(1);
    return out.trim();
  }
  function sparkPath(vals) {
    var pts = vals.filter(function (v) { return v !== null && !isNaN(v); });
    if (vals.length < 2 || !pts.length) return '';
    var mx = Math.max.apply(null, pts), mn = Math.min.apply(null, pts), span = mx - mn || 1;
    var out = '', pen = false;
    for (var j = 0; j < vals.length; j++) {
      var v = vals[j];
      if (v === null || isNaN(v)) { pen = false; continue; }
      out += (pen ? ' L' : ' M') + ((j / (vals.length - 1)) * 100).toFixed(1) + ',' + (26 - (v - mn) / span * 24).toFixed(1);
      pen = true;
    }
    return out.trim();
  }

  // series: [{name, c, vals}], extra: {totals: [..] | null}
  function chartHTML(key, m, bk, series, height, totals) {
    var lo = Infinity, hi = -Infinity;
    series.forEach(function (s) { s.vals.forEach(function (v) { if (v !== null && !isNaN(v)) { if (v > hi) hi = v; if (v < lo) lo = v; } }); });
    if (lo === Infinity) { lo = 0; hi = 0; }
    var ax = axis(m, lo, hi);
    charts[key] = { m: m, bk: bk, series: series, ax: ax, totals: totals };
    var h = '<div class="cw"><div class="ya" style="height:' + height + 'px">';
    ax.ticks.forEach(function (t) { h += '<div style="top:' + yPct(ax, t).toFixed(2) + '%">' + esc(tick(m, t)) + '</div>'; });
    h += '</div><div class="pa"><div class="plot" data-plot="' + key + '" style="height:' + height + 'px">';
    ax.ticks.forEach(function (t) { h += '<div class="gl' + (t === 0 ? ' z' : '') + '" style="top:' + yPct(ax, t).toFixed(2) + '%"></div>'; });
    h += '<svg viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">';
    series.slice().reverse().forEach(function (s) { h += '<path d="' + linePath(s.vals, ax) + '" style="stroke:' + s.c + '"></path>'; });
    h += '</svg><div class="hv" data-hv="' + key + '"></div></div><div class="xa">';
    var nb = bk.length, step = Math.max(1, Math.ceil(nb / 8));
    for (var j = 0; j < nb; j += step) h += '<div style="left:' + (nb > 1 ? j / (nb - 1) * 100 : 50).toFixed(2) + '%">' + esc(bk[j].label) + '</div>';
    h += '</div></div></div>';
    return h;
  }

  function hoverHTML(key, j) {
    var ch = charts[key];
    if (!ch || j === null) return '';
    var nb = ch.bk.length;
    if (j >= nb) return '';
    var hx = nb > 1 ? j / (nb - 1) * 100 : 50;
    var h = '<div class="cross" style="left:' + hx.toFixed(2) + '%"></div>';
    var rows = [];
    ch.series.forEach(function (s) {
      var v = s.vals[j];
      if (v !== null && !isNaN(v)) h += '<div class="dot" style="left:' + hx.toFixed(2) + '%;top:' + yPct(ch.ax, v).toFixed(2) + '%;background:' + s.c + '"></div>';
      rows.push({ name: s.name, c: s.c, v: v });
    });
    rows.sort(function (a, b) { return (b.v === null ? -1e18 : b.v) - (a.v === null ? -1e18 : a.v); });
    var tf = hx > 60 ? 'translateX(calc(-100% - 14px))' : 'translateX(14px)';
    h += '<div class="tip" style="left:' + hx.toFixed(2) + '%;transform:' + tf + '"><div class="th"><span>' + esc(ch.bk[j].title) + '</span><span>' +
      (ch.totals ? '전체 ' + esc(fmt(ch.m, ch.totals[j])) : '') + '</span></div>';
    rows.forEach(function (r) {
      h += '<div class="tr"><span class="tn"><span class="sq" style="background:' + r.c + '"></span>' + esc(r.name) + '</span><b>' + esc(fmt(ch.m, r.v)) + '</b></div>';
    });
    return h + '</div>';
  }

  /* ---------------- 화면 ---------------- */
  function metricObj() { for (var i = 0; i < METRICS.length; i++) if (METRICS[i].k === S.metric) return METRICS[i]; return METRICS[0]; }

  function render() {
    charts = {};
    if (S.view === 'setup') { root.innerHTML = setupHTML(); return; }
    if (S.view === 'loading') {
      root.innerHTML = '<div class="w"><div class="bar"><div class="row"><div class="ttl">채널별 일별 매출</div>' + topBtns() + '</div></div>' +
        '<div class="card"><div class="note" style="font-size:15px">데이터 불러오는 중…</div></div></div>';
      return;
    }
    root.innerHTML = dashHTML();
  }

  function topBtns() {
    return '<div class="chips"><button type="button" class="tbtn" data-act="reload">새로고침</button>' +
      '<button type="button" class="tbtn" data-act="setup">연결 설정</button>' +
      '<button type="button" class="tbtn" data-act="close" aria-label="대시보드 닫기">닫기 (Esc)</button></div>';
  }

  function setupHTML() {
    var c = loadCfg() || {};
    return '<div class="w"><div class="bar"><div class="row"><div class="ttl">채널별 일별 매출 · 연결 설정</div>' +
      '<div class="chips"><button type="button" class="tbtn" data-act="close">닫기 (Esc)</button></div></div></div>' +
      '<form class="form card" data-form="cfg">' +
      (S.err ? '<div class="errb">' + esc(S.err) + '</div>' : '') +
      '<div class="note" style="font-size:14px;color:#52514e">구글시트 메뉴 <b>[FLEXG 일별매출] &gt; 대시보드 연결 키 보기</b>에서 키를 확인하고, 웹앱으로 배포한 URL을 넣어줘. 이 브라우저에만 저장돼.</div>' +
      '<label>웹앱 URL<input name="url" type="url" required placeholder="https://script.google.com/macros/s/.../exec" value="' + esc(c.url || '') + '"></label>' +
      '<label>연결 키<input name="key" type="password" required autocomplete="off" value="' + esc(c.key || '') + '"></label>' +
      '<button type="submit" class="pri">저장하고 불러오기</button></form></div>';
  }

  function dashHTML() {
    var m = metricObj(), D = M.D;
    var R = range(S.period);
    var days = R.e - R.s + 1, pdays = R.ps === null ? 0 : R.pe - R.ps + 1;
    var bk = buckets(R.s, R.e, S.gran);
    var h = '<div class="w">';

    /* 상단 바 */
    h += '<div class="bar"><div class="row"><div style="display:flex;flex-direction:column;gap:2px">' +
      '<div class="ttl">채널별 일별 매출</div><div class="sub">추적코드 기준 · 데이터 ' + esc(D[0]) + ' ~ ' + esc(D[M.n - 1]) +
      (M.updated ? ' · 시트 기록 ' + esc(M.updated) : '') + '</div></div>' + topBtns() + '</div>';
    h += '<div class="row"><div class="mt" role="group" aria-label="지표">';
    METRICS.forEach(function (x) { h += '<button type="button" data-act="metric" data-v="' + x.k + '" class="' + (x.k === S.metric ? 'on' : '') + '" aria-pressed="' + (x.k === S.metric) + '">' + x.label + '</button>'; });
    h += '</div><div class="seg" role="group" aria-label="집계 단위">';
    [['day', '일별'], ['week', '주별'], ['month', '월별']].forEach(function (g) {
      h += '<button type="button" data-act="gran" data-v="' + g[0] + '" class="' + (S.gran === g[0] ? 'on' : '') + '" aria-pressed="' + (S.gran === g[0]) + '">' + g[1] + '</button>';
    });
    h += '</div></div><div class="row"><div class="chips" role="group" aria-label="기간">';
    periods().forEach(function (p) { h += '<button type="button" class="chip' + (p.k === S.period ? ' on' : '') + '" data-act="period" data-v="' + p.k + '" aria-pressed="' + (p.k === S.period) + '">' + p.label + '</button>'; });
    h += '</div><div class="sub" style="font-size:14px">' + esc(md(D[R.s]) + ' (' + dow(D[R.s]) + ') ~ ' + md(D[R.e]) + ' (' + dow(D[R.e]) + ') · ' + days + '일') + '</div></div></div>';

    /* 집계 */
    var gAgg = M.G.map(function (g) { return aggRange(g, R.s, R.e); });
    var gPrev = M.G.map(function (g) { return R.ps === null ? null : aggRange(g, R.ps, R.pe); });
    var tAgg = aggRange(M.T, R.s, R.e), tPrev = R.ps === null ? null : aggRange(M.T, R.ps, R.pe);

    /* KPI */
    var dayVals = [];
    for (var i = R.s; i <= R.e; i++) { var dv = val(m, aggIdx(M.T, [i])); if (dv !== null) dayVals.push({ i: i, v: dv }); }
    var best = dayVals.reduce(function (a, b) { return !a || b.v > a.v ? b : a; }, null);
    var worst = dayVals.reduce(function (a, b) { return !a || b.v < a.v ? b : a; }, null);
    var chRows = M.CH.map(function (c) {
      var a = aggRange(c, R.s, R.e);
      return { c: c, a: a, v: val(m, a), pa: R.ps === null ? null : aggRange(c, R.ps, R.pe) };
    });
    var rankable = chRows.filter(function (r) { return m.type === 'sum' ? r.v !== 0 : (r.a.c >= MIN_CNT && r.v !== null); });
    rankable.sort(function (a, b) { return b.v - a.v; });
    var top = rankable[0];
    var tD = deltaTxt(delta(m, tAgg, days, tPrev, pdays));
    var dayLbl = function (x) { return x ? md(D[x.i]) + ' (' + dow(D[x.i]) + ')' : '-'; };
    var kp = [];
    if (m.type === 'sum') {
      kp.push({ l: '기간 ' + m.label, v: fmt(m, tAgg[m.num]), s: R.ps === null ? '비교 기간 없음' : tD.t + ' · ' + R.cmp + ' (일평균)', c: R.ps === null ? MUTED : tD.c });
      kp.push({ l: '일평균 ' + m.label, v: fmt(m, tAgg[m.num] / days), s: days + '일 평균', c: MUTED });
      kp.push({ l: '최고일', v: dayLbl(best), s: best ? fmt(m, best.v) : '', c: MUTED });
      kp.push({ l: m.label + ' 1위 채널', v: top ? top.c.n : '-', s: top ? '비중 ' + (tAgg[m.num] ? top.v / tAgg[m.num] * 100 : 0).toFixed(1) + '% · ' + fmt(m, top.v) : '', c: MUTED, sm: true });
    } else {
      kp.push({ l: '기간 ' + m.label, v: fmt(m, val(m, tAgg)), s: R.ps === null ? '비교 기간 없음' : tD.t + ' · ' + R.cmp, c: R.ps === null ? MUTED : tD.c });
      kp.push({ l: '최고일', v: dayLbl(best), s: best ? fmt(m, best.v) : '', c: MUTED });
      kp.push({ l: '최저일', v: dayLbl(worst), s: worst ? fmt(m, worst.v) : '', c: MUTED });
      kp.push({ l: m.label + ' 1위 채널 (' + MIN_CNT + '건 이상)', v: top ? top.c.n : '-', s: top ? fmt(m, top.v) + ' · ' + comma(top.a.c) + '건' : '', c: MUTED, sm: true });
    }
    h += '<div class="kpis">';
    kp.forEach(function (k) {
      h += '<div class="kpi"><div class="kl">' + esc(k.l) + '</div><div class="kv' + (k.sm ? ' sm' : '') + '">' + esc(k.v) + '</div><div class="ks" style="color:' + k.c + '">' + esc(k.s) + '</div></div>';
    });
    h += '</div>';

    /* 그룹 흐름 차트 */
    var series = [];
    GROUPS.forEach(function (g, gi) {
      if (S.hidden[gi]) return;
      series.push({ name: g.label, c: g.c, vals: bk.map(function (b) { return val(m, aggIdx(M.G[gi], b.idx)); }) });
    });
    var totals = bk.map(function (b) { return val(m, aggIdx(M.T, b.idx)); });
    var granTxt = S.gran === 'day' ? '일별' : S.gran === 'week' ? '주별(월~일)' : '월별';
    h += '<div class="card"><div class="ch"><div class="h2">그룹별 ' + m.label + ' 흐름</div><div class="note">' + granTxt + ' · 범례를 눌러 선 켜고 끄기 · 마우스를 올리면 값 표시</div></div><div class="leg" role="group" aria-label="표시할 그룹">';
    GROUPS.forEach(function (g, gi) {
      var off = !!S.hidden[gi];
      h += '<button type="button" data-act="toggle" data-v="' + gi + '" class="' + (off ? 'off' : '') + '" aria-pressed="' + (!off) + '"><span class="sw" style="background:' + (off ? '#c9c8c2' : g.c) + '"></span>' + esc(g.label) + '</button>';
    });
    h += '</div>' + (series.length ? chartHTML('main', m, bk, series, 320, totals) : '<div class="empty">표시할 그룹을 하나 이상 켜줘</div>') + '</div>';

    /* 그룹 비중 + 채널 표 */
    h += '<div class="two"><div class="card"><div style="display:flex;flex-direction:column;gap:4px"><div class="h2">그룹별 ' + (m.type === 'sum' ? '비중' : m.label) + '</div>' +
      '<div class="note">누르면 오른쪽 표가 그 그룹 채널로 바뀜 · 증감은 ' + (m.type === 'sum' ? '일평균 기준' : R.cmp ? R.cmp : '비교 기간 대비') + '</div></div>';
    var gList = GROUPS.map(function (g, gi) { return { gi: gi, g: g, a: gAgg[gi], v: val(m, gAgg[gi]), d: deltaTxt(delta(m, gAgg[gi], days, gPrev[gi], pdays)) }; });
    gList.sort(function (a, b) { return (b.v === null ? -1e18 : b.v) - (a.v === null ? -1e18 : a.v); });
    var maxG = 0;
    gList.forEach(function (x) { if (x.v !== null && x.v > maxG) maxG = x.v; });
    var totV = val(m, tAgg);
    gList.forEach(function (x) {
      var on = S.sel === x.gi;
      var w = maxG > 0 && x.v > 0 ? x.v / maxG * 100 : 0;
      var left = m.type === 'sum' ? '비중 ' + (totV ? (x.v / totV * 100).toFixed(1) : '0.0') + '%' : '매출 ' + money(x.a.v) + ' · ' + comma(x.a.c) + '건';
      h += '<button type="button" class="gs' + (on ? ' on' : '') + '" data-act="sel" data-v="' + x.gi + '" aria-pressed="' + on + '">' +
        '<span class="a"><span class="n"><span class="sq" style="background:' + x.g.c + '"></span>' + esc(x.g.label) + '</span><span class="v">' + esc(fmt(m, x.v)) + '</span></span>' +
        '<span class="bt"><span class="bf" style="width:' + w.toFixed(1) + '%;background:' + x.g.c + '"></span></span>' +
        '<span class="b"><span>' + esc(left) + '</span><span style="color:' + x.d.c + ';font-weight:600">' + esc(x.d.t) + '</span></span></button>';
    });
    if (S.sel !== null) h += '<button type="button" class="tbtn" data-act="sel" data-v="">전체 채널 보기</button>';
    h += '</div>';

    var list = rankable.filter(function (r) { return S.sel === null || r.c.gi === S.sel; });
    var shown = S.showAll ? list : list.slice(0, 20);
    var listTot = list.reduce(function (a, r) { return a + (m.type === 'sum' ? r.v : 0); }, 0);
    var title = (S.sel === null ? '전체 채널' : GROUPS[S.sel].label + ' 채널') + ' · ' + m.label + ' 순';
    h += '<div class="card"><div class="ch"><div class="h2">' + esc(title) + '</div><div class="note">' +
      (m.type === 'ratio' ? '건수 ' + MIN_CNT + '건 이상 채널만 · ' : '') + '[비교]를 누르면 아래 차트에 추가 (최대 4개)</div></div><div class="tw"><div class="tb">';
    h += '<div class="tbr hd"><span>#</span><span>채널</span><span class="r">' + m.label + '</span><span class="r">' + (m.type === 'sum' ? '비중' : '건수') +
      '</span><span class="r">' + (m.type === 'sum' ? '일평균' : '매출') + '</span><span class="r">증감</span><span>흐름</span><span></span></div>';
    if (!shown.length) h += '<div class="empty">해당 기간에 표시할 채널이 없어</div>';
    shown.forEach(function (r, k) {
      var on = S.picks.indexOf(r.c.n) >= 0;
      var dd = deltaTxt(delta(m, r.a, days, r.pa, pdays));
      var c3 = m.type === 'sum' ? (listTot ? (r.v / listTot * 100).toFixed(1) : '0.0') + '%' : comma(r.a.c) + '건';
      var c4 = m.type === 'sum' ? fmt(m, r.v / days) : money(r.a.v);
      var sp = sparkPath(bk.map(function (b) { return val(m, aggIdx(r.c, b.idx)); }));
      h += '<div class="tbr"><span style="color:#6b6a65;font-weight:600">' + (k + 1) + '</span>' +
        '<span class="nm"><b>' + esc(r.c.n) + '</b><span>' + esc(GROUPS[r.c.gi].label) + '</span></span>' +
        '<span class="r" style="font-weight:700">' + esc(fmt(m, r.v)) + '</span><span class="r" style="color:#52514e">' + esc(c3) + '</span>' +
        '<span class="r" style="color:#52514e">' + esc(c4) + '</span><span class="r" style="font-weight:600;color:' + dd.c + '">' + esc(dd.t) + '</span>' +
        '<svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><path d="' + sp + '"></path></svg>' +
        '<button type="button" class="pk' + (on ? ' on' : '') + '" data-act="pick" data-v="' + esc(r.c.n) + '" aria-pressed="' + on + '">' + (on ? '비교 중' : '비교') + '</button></div>';
    });
    h += '</div></div>';
    if (list.length > 20) h += '<button type="button" class="tbtn" data-act="more">' + (S.showAll ? '상위 20개만 보기' : '전체 ' + list.length + '개 보기') + '</button>';
    h += '</div></div>';

    /* 채널 비교 */
    var cs = S.picks.map(function (name, k) {
      var c = M.byName[name];
      return { name: name, c: CMP_COLORS[k], ch: c, vals: bk.map(function (b) { return c ? val(m, aggIdx(c, b.idx)) : null; }), tot: c ? val(m, aggRange(c, R.s, R.e)) : null };
    });
    h += '<div class="card"><div class="ch"><div class="h2">채널 비교 · ' + m.label + '</div><div class="note">' + granTxt + ' · 표에서 고른 채널끼리 비교</div></div><div class="cl">';
    cs.forEach(function (s) {
      h += '<div><span class="sw" style="background:' + s.c + '"></span><span><b>' + esc(s.name) + '</b><span class="s">기간 ' + esc(fmt(m, s.tot)) + '</span></span>' +
        '<button type="button" class="tbtn" style="min-height:34px" data-act="unpick" data-v="' + esc(s.name) + '" aria-label="' + esc(s.name) + ' 비교에서 빼기">빼기</button></div>';
    });
    h += '</div>' + (cs.length ? chartHTML('cmp', m, bk, cs, 280, null) : '<div class="empty">위 표에서 [비교]를 눌러 채널을 골라줘</div>') + '</div>';

    /* 각주 */
    h += '<div class="foot"><span>매출 = 정상금액(결제 − 취소) · 주문건수 = 정상건수(부분취소 제외) · 객단가 = 매출 ÷ 건수 · 이익률 = 판매이익 ÷ 매출</span>' +
      '<span>판매이익 = 정상금액 − 배송비 − 공급가액 − PG수수료 (FLEXG 계산, 광고비 미차감)</span>' +
      '<span>그래프의 "외부광고·기타" = 메타·구글·네이버·토스·틱톡·당근·인포크 등 · 대시보드 v' + VER + '</span></div>';
    return h + '</div>';
  }

  /* ---------------- 이벤트 ---------------- */
  root.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t || !root.contains(t)) return;
    var act = t.getAttribute('data-act'), v = t.getAttribute('data-v');
    if (act === 'close') { close(); return; }
    if (act === 'reload') { load(); return; }
    if (act === 'setup') { S.err = ''; S.view = 'setup'; render(); return; }
    if (act === 'metric') S.metric = v;
    else if (act === 'gran') S.gran = v;
    else if (act === 'period') S.period = v;
    else if (act === 'toggle') { S.hidden[v] = !S.hidden[v]; }
    else if (act === 'sel') { S.sel = v === '' || S.sel === Number(v) ? null : Number(v); S.showAll = false; }
    else if (act === 'more') S.showAll = !S.showAll;
    else if (act === 'pick') {
      var at = S.picks.indexOf(v);
      if (at >= 0) S.picks.splice(at, 1); else { S.picks.push(v); if (S.picks.length > 4) S.picks.shift(); }
    } else if (act === 'unpick') { S.picks = S.picks.filter(function (x) { return x !== v; }); }
    else return;
    var y = root.scrollTop;
    render();
    root.scrollTop = y;
  });

  root.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.getAttribute('data-form') !== 'cfg') return;
    e.preventDefault();
    var url = String(f.elements.url.value || '').trim(), key = String(f.elements.key.value || '').trim();
    if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) { S.err = '웹앱 URL은 https://script.google.com/... 형태여야 해'; render(); return; }
    saveCfg({ url: url, key: key });
    load();
  });

  function plotMove(e) {
    var p = e.target.closest ? e.target.closest('[data-plot]') : null;
    if (!p || !root.contains(p)) return;
    var key = p.getAttribute('data-plot'), ch = charts[key];
    if (!ch) return;
    var r = p.getBoundingClientRect();
    var x = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
    var nb = ch.bk.length;
    var j = Math.round((x - r.left) / (r.width || 1) * (nb - 1));
    if (j < 0) j = 0;
    if (j > nb - 1) j = nb - 1;
    if (ch.j === j) return;
    ch.j = j;
    var hv = p.querySelector('[data-hv]');
    if (hv) hv.innerHTML = hoverHTML(key, j);
  }
  root.addEventListener('mousemove', plotMove);
  root.addEventListener('click', plotMove);
  root.addEventListener('mouseout', function (e) {
    var p = e.target.closest ? e.target.closest('[data-plot]') : null;
    if (!p) return;
    if (e.relatedTarget && p.contains(e.relatedTarget)) return;
    var ch = charts[p.getAttribute('data-plot')];
    if (ch) ch.j = null;
    var hv = p.querySelector('[data-hv]');
    if (hv) hv.innerHTML = '';
  });

  /* ---------------- 불러오기 ---------------- */
  function load() {
    var cfg = loadCfg();
    if (window.__jbCd26Data) { S.data = window.__jbCd26Data; prep(S.data); S.view = 'dash'; render(); return; } // 테스트용
    if (!cfg || !cfg.url || !cfg.key) { S.view = 'setup'; render(); return; }
    S.view = 'loading'; render();
    var u = cfg.url + (cfg.url.indexOf('?') >= 0 ? '&' : '?') + 'key=' + encodeURIComponent(cfg.key) + '&t=' + Date.now();
    fetch(u, { method: 'GET', credentials: 'omit', redirect: 'follow' })
      .then(function (r) { return r.text(); })
      .then(function (txt) {
        var d;
        try { d = JSON.parse(txt); } catch (e) { throw new Error('응답이 JSON이 아니야. 웹앱 액세스 권한이 "모든 사용자"인지 확인해줘'); }
        if (!d.ok) throw new Error(d.error === 'KEY' ? '연결 키가 맞지 않아. 시트 메뉴에서 키를 다시 확인해줘' : '시트 오류: ' + d.error);
        if (!d.dates || !d.dates.length) throw new Error('시트에 아직 기록된 데이터가 없어');
        S.data = d; prep(d); S.view = 'dash'; render();
      })
      .catch(function (err) {
        var msg = err && err.message ? err.message : String(err);
        if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) msg = '웹앱에 연결하지 못했어. URL과 배포 액세스 권한("모든 사용자")을 확인해줘';
        S.err = '불러오기 실패 - ' + msg;
        S.view = 'setup'; render();
      });
  }

  load();
})();
