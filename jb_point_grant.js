/* 제철밥상 포인트 일괄지급 툴 v1.0 (관리자 북마클릿)
   실행 위치: airgram123.flexgate.co.kr (관리자 세션 필요)
   엔드포인트: POST /User/pointAddOrMinus  {customerId, pointAmt, mode:'ADD'|'MINUS', memo}
   입력: 한 줄에 "회원번호,포인트,메모" (탭/쉼표 구분, 메모 생략 시 공통 메모 사용) */
(function(){
  'use strict';
  var VER='1.0', ID='jbPointGrant', DONE_KEY='jbPgDone', ENDPOINT='/User/pointAddOrMinus';
  if(document.getElementById(ID)){ document.getElementById(ID).style.display='block'; return; }
  if(!window.jbPgTest && location.hostname.indexOf('flexgate.co.kr')<0){ alert('FLEXG 관리자(airgram123.flexgate.co.kr)에서 실행하세요'); return; }

  /* ---------- 상태 ---------- */
  var S={rows:[], results:[], running:false, stop:false, done:loadDone()};
  function loadDone(){ try{ return JSON.parse(localStorage.getItem(DONE_KEY)||'{}'); }catch(e){ return {}; } }
  function saveDone(){ try{ localStorage.setItem(DONE_KEY, JSON.stringify(S.done)); }catch(e){} }
  function doneKey(r){ return r.no+'|'+r.amt+'|'+r.memo; }

  /* ---------- UI ---------- */
  var css=''+
  '#'+ID+'{position:fixed;top:60px;right:24px;width:560px;max-height:88vh;display:flex;flex-direction:column;background:#fff;border:1px solid #cfd6d0;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.18);z-index:2147483000;font:14px/1.5 Pretendard,-apple-system,"Malgun Gothic",sans-serif;color:#1e2621}'+
  '#'+ID+' *{box-sizing:border-box}'+
  '#'+ID+' .hd{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e3e8e3;cursor:move;user-select:none;background:#f3f6f2;border-radius:12px 12px 0 0}'+
  '#'+ID+' .hd b{font-size:15px}'+
  '#'+ID+' .hd small{color:#6b766d;margin-left:8px;font-weight:400}'+
  '#'+ID+' .x{border:0;background:none;font-size:20px;cursor:pointer;color:#6b766d;line-height:1}'+
  '#'+ID+' .bd{padding:14px 16px;overflow:auto}'+
  '#'+ID+' textarea{width:100%;height:150px;padding:10px;border:1px solid #cfd6d0;border-radius:8px;font:13px/1.5 Consolas,Menlo,monospace;resize:vertical}'+
  '#'+ID+' .opt{display:flex;gap:10px;align-items:center;margin:10px 0;flex-wrap:wrap}'+
  '#'+ID+' .opt label{display:flex;align-items:center;gap:6px;color:#3e4a41}'+
  '#'+ID+' input[type=text]{padding:6px 9px;border:1px solid #cfd6d0;border-radius:6px;font:inherit}'+
  '#'+ID+' input[type=number]{width:70px;padding:6px 8px;border:1px solid #cfd6d0;border-radius:6px;font:inherit}'+
  '#'+ID+' .btns{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}'+
  '#'+ID+' button.b{padding:8px 14px;border:1px solid #cfd6d0;border-radius:8px;background:#fff;cursor:pointer;font:inherit;font-weight:600}'+
  '#'+ID+' button.b:hover{background:#f3f6f2}'+
  '#'+ID+' button.b.go{background:#2e6b3e;color:#fff;border-color:#2e6b3e}'+
  '#'+ID+' button.b.go:hover{background:#1f4a2b}'+
  '#'+ID+' button.b.warn{color:#b4452f;border-color:#e3b3a8}'+
  '#'+ID+' button.b:disabled{opacity:.45;cursor:not-allowed}'+
  '#'+ID+' .pv{background:#f7f9f6;border:1px solid #e3e8e3;border-radius:8px;padding:10px 12px;font-size:13px;white-space:pre-line;min-height:44px}'+
  '#'+ID+' .pv .bad{color:#b4452f}'+
  '#'+ID+' .prog{margin:10px 0 4px;font-size:13px;color:#3e4a41}'+
  '#'+ID+' .bar{height:6px;background:#e3e8e3;border-radius:3px;overflow:hidden}'+
  '#'+ID+' .bar i{display:block;height:100%;width:0;background:#2e6b3e}'+
  '#'+ID+' table{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:10px}'+
  '#'+ID+' th,#'+ID+' td{padding:5px 8px;border-bottom:1px solid #eef1ec;text-align:left;white-space:nowrap}'+
  '#'+ID+' th{background:#f3f6f2;position:sticky;top:0}'+
  '#'+ID+' td.ok{color:#2e6b3e}'+
  '#'+ID+' td.ng{color:#b4452f}'+
  '#'+ID+' .twrap{max-height:220px;overflow:auto;border:1px solid #e3e8e3;border-radius:8px}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var box=document.createElement('div'); box.id=ID;
  box.innerHTML=''+
  '<div class="hd"><div><b>포인트 일괄지급</b><small>v'+VER+' · POST '+ENDPOINT+'</small></div><button class="x" title="닫기">&times;</button></div>'+
  '<div class="bd">'+
  '<textarea placeholder="회원번호,포인트,메모   (한 줄에 하나. 메모 생략 시 아래 공통 메모 사용)\n예)\n413432,10,9월 출석체크 포인트(9/1)\n1186621,10"></textarea>'+
  '<div class="opt"><label>공통 메모 <input type="text" id="jbPgMemo" value="출석체크 포인트" size="28"></label>'+
  '<label>간격 <input type="number" id="jbPgDelay" value="250" min="50" step="50">ms</label>'+
  '<label><input type="checkbox" id="jbPgForce"> 완료 기록 무시</label></div>'+
  '<div class="btns"><button class="b" id="jbPgPreview">미리보기</button><button class="b" id="jbPgOne">1건 테스트</button><button class="b go" id="jbPgRun" disabled>전체 실행</button><button class="b warn" id="jbPgStop" disabled>중지</button><button class="b" id="jbPgRetry" disabled>실패 재시도</button><button class="b" id="jbPgCsv" disabled>결과 CSV</button><button class="b" id="jbPgClear" title="이 브라우저에 저장된 지급 완료 기록 삭제">기록 초기화</button></div>'+
  '<div class="pv" id="jbPgPv">목록을 붙여넣고 [미리보기]를 누르세요.</div>'+
  '<div class="prog" id="jbPgProg"></div><div class="bar"><i id="jbPgBar"></i></div>'+
  '<div class="twrap" id="jbPgTable"></div>'+
  '</div>';
  document.body.appendChild(box);
  var $=function(id){ return document.getElementById(id); };
  var ta=box.querySelector('textarea');

  /* 드래그 */
  (function(){ var hd=box.querySelector('.hd'), sx,sy,ox,oy,drag=false;
    hd.addEventListener('mousedown',function(e){ if(e.target.className==='x') return; drag=true; sx=e.clientX; sy=e.clientY; var r=box.getBoundingClientRect(); ox=r.left; oy=r.top; box.style.right='auto'; e.preventDefault(); });
    document.addEventListener('mousemove',function(e){ if(!drag) return; box.style.left=(ox+e.clientX-sx)+'px'; box.style.top=(oy+e.clientY-sy)+'px'; });
    document.addEventListener('mouseup',function(){ drag=false; }); })();
  box.querySelector('.x').onclick=function(){ if(S.running&&!confirm('실행 중입니다. 창을 닫아도 진행은 멈추지 않습니다. 닫을까요?')) return; box.style.display='none'; };

  /* ---------- 파싱 ---------- */
  function parse(){
    var memoDefault=$('jbPgMemo').value.trim();
    var lines=ta.value.split(/\r?\n/), rows=[], bad=[];
    for(var i=0;i<lines.length;i++){
      var raw=lines[i].trim(); if(!raw) continue;
      var parts=raw.split(/\t|,/).map(function(s){ return s.trim().replace(/^"|"$/g,''); });
      var no=parts[0].replace(/\D/g,'');
      if(!no){ if(i===0) continue; bad.push((i+1)+'행: 회원번호 없음 - '+raw); continue; }  /* 첫 줄 헤더 허용 */
      var amtRaw=(parts[1]||'').replace(/[^\d\-]/g,''); var amt=parseInt(amtRaw,10);
      if(!amtRaw||isNaN(amt)||amt===0){ bad.push((i+1)+'행: 포인트 없음 - '+raw); continue; }
      var memo=(parts.slice(2).join(',')||memoDefault).trim();
      if(!memo){ bad.push((i+1)+'행: 메모 없음 - '+raw); continue; }
      rows.push({line:i+1,no:no,amt:Math.abs(amt),mode:amt>0?'ADD':'MINUS',memo:memo});
    }
    return {rows:rows,bad:bad};
  }
  function preview(){
    var p=parse(), force=$('jbPgForce').checked, seen={}, seenKey={}, dup=[], same=0, skip=0, total=0, todo=[];
    p.rows.forEach(function(r){
      var k=doneKey(r);
      if(seenKey[k]){ same++; return; }  /* 완전히 같은 줄은 한 번만 */
      seenKey[k]=1;
      if(seen[r.no]) dup.push(r.no); seen[r.no]=1;
      if(!force&&S.done[k]){ skip++; r.skip=true; return; }
      todo.push(r); total+=r.mode==='ADD'?r.amt:-r.amt;
    });
    S.rows=p.rows;
    var msg='총 '+p.rows.length+'건 · 지급 대상 '+todo.length+'건 · 합계 '+total.toLocaleString()+'P';
    if(same) msg+='\n똑같은 줄 '+same+'개는 한 번만 지급';
    if(skip) msg+='\n이미 완료된 '+skip+'건은 건너뜀 (다시 지급하려면 "완료 기록 무시" 체크)';
    if(dup.length) msg+='\n<span class="bad">같은 회원번호가 여러 줄: '+uniq(dup).slice(0,10).join(', ')+(dup.length>10?' 외':'')+' - 의도한 건지 확인</span>';
    if(p.bad.length) msg+='\n<span class="bad">무시된 줄 '+p.bad.length+'개:\n'+p.bad.slice(0,5).join('\n')+(p.bad.length>5?'\n…':'')+'</span>';
    $('jbPgPv').innerHTML=msg;
    $('jbPgRun').disabled=!todo.length; $('jbPgOne').disabled=!todo.length;
    return todo;
  }
  function uniq(a){ var o={},r=[]; a.forEach(function(x){ if(!o[x]){o[x]=1;r.push(x);} }); return r; }

  /* ---------- 호출 ---------- */
  function grant(r){
    var body={customerId:String(r.no),pointAmt:String(r.amt),mode:r.mode,memo:r.memo};
    return fetch(ENDPOINT,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json; charset=UTF-8','X-Requested-With':'XMLHttpRequest','Accept':'application/json, text/javascript, */*'},body:JSON.stringify(body)})
      .then(function(res){ return res.text().then(function(t){ return {status:res.status,text:t}; }); })
      .then(function(x){
        var j=null; try{ j=JSON.parse(x.text); }catch(e){}
        if(!j) return {ok:false,msg:'응답이 JSON이 아님 (HTTP '+x.status+', 관리자 세션 만료 가능성)'};
        var ok=j.result==='ok'&&j.data&&j.data.result===true&&j.data.pointProcResult===true;
        return {ok:ok,msg:ok?'':(j.errorMsg||(j.data&&j.data.message)||'지급 실패 (result='+j.result+')')};
      })
      .catch(function(e){ return {ok:false,msg:'네트워크 오류: '+e.message}; });
  }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }

  async function run(list){
    if(S.running) return;
    S.running=true; S.stop=false;
    ['jbPgPreview','jbPgOne','jbPgRun','jbPgRetry','jbPgClear'].forEach(function(id){ $(id).disabled=true; });
    $('jbPgStop').disabled=false;
    var delay=Math.max(50,parseInt($('jbPgDelay').value,10)||250), ok=0, ng=0;
    for(var i=0;i<list.length;i++){
      if(S.stop){ $('jbPgProg').textContent='중지됨 · 성공 '+ok+' / 실패 '+ng+' / 남은 '+(list.length-i); break; }
      var r=list[i];
      if(!$('jbPgForce').checked&&S.done[doneKey(r)]&&!r.retry){ r.ok=true; r.msg='이미 완료'; r.at=S.done[doneKey(r)]; S.results.push(r); ok++; renderTable(); continue; }
      $('jbPgProg').textContent=(i+1)+' / '+list.length+' · '+r.no+' '+(r.mode==='ADD'?'+':'-')+r.amt+'P … (성공 '+ok+' · 실패 '+ng+')';
      var res=await grant(r);
      r.ok=res.ok; r.msg=res.msg; r.at=new Date().toISOString().slice(0,19).replace('T',' ');
      if(res.ok){ ok++; S.done[doneKey(r)]=r.at; saveDone(); } else { ng++; }
      S.results.push(r); renderTable();
      $('jbPgBar').style.width=Math.round((i+1)/list.length*100)+'%';
      if(i<list.length-1) await sleep(delay);
    }
    if(!S.stop) $('jbPgProg').textContent='완료 · 성공 '+ok+' / 실패 '+ng+' (총 '+list.length+')';
    S.running=false;
    ['jbPgPreview','jbPgOne','jbPgClear'].forEach(function(id){ $(id).disabled=false; });
    $('jbPgStop').disabled=true; $('jbPgCsv').disabled=!S.results.length;
    $('jbPgRetry').disabled=!S.results.some(function(x){ return !x.ok; });
    $('jbPgRun').disabled=true;  /* 재실행은 미리보기부터 (이중 지급 방지) */
  }

  function renderTable(){
    var rs=S.results.slice(-300).reverse();
    var h='<table><tr><th>#</th><th>회원번호</th><th>포인트</th><th>메모</th><th>결과</th><th>시각</th></tr>';
    rs.forEach(function(r){ h+='<tr><td>'+r.line+'</td><td>'+r.no+'</td><td>'+(r.mode==='ADD'?'+':'-')+r.amt+'</td><td>'+esc(r.memo)+'</td><td class="'+(r.ok?'ok':'ng')+'">'+(r.ok?'성공':'실패: '+esc(r.msg))+'</td><td>'+r.at+'</td></tr>'; });
    $('jbPgTable').innerHTML=h+'</table>';
  }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  /* ---------- 버튼 ---------- */
  $('jbPgPreview').onclick=preview;
  $('jbPgOne').onclick=function(){ var todo=preview(); if(!todo.length) return; var r=todo[0]; if(!confirm('1건 테스트: 회원 '+r.no+'에게 '+(r.mode==='ADD'?'+':'-')+r.amt+'P\n메모: '+r.memo+'\n\n실행할까요?')) return; run([r]); };
  $('jbPgRun').onclick=function(){ var todo=preview(); if(!todo.length) return; var total=0; todo.forEach(function(r){ total+=r.mode==='ADD'?r.amt:-r.amt; }); if(!confirm(todo.length+'건, 합계 '+total.toLocaleString()+'P 지급을 시작합니다.\n관리자 회원 적립내역에 바로 반영되며 되돌리려면 MINUS로 다시 처리해야 합니다.\n\n진행할까요?')) return; run(todo); };
  $('jbPgStop').onclick=function(){ S.stop=true; };
  $('jbPgRetry').onclick=function(){ var f=S.results.filter(function(x){ return !x.ok; }); f.forEach(function(x){ x.retry=true; }); S.results=S.results.filter(function(x){ return x.ok; }); if(f.length&&confirm('실패 '+f.length+'건을 다시 시도할까요?')) run(f); };
  $('jbPgClear').onclick=function(){ if(confirm('이 브라우저에 저장된 지급 완료 기록('+Object.keys(S.done).length+'건)을 지웁니다. 같은 목록을 다시 실행하면 이중 지급될 수 있어요. 지울까요?')){ S.done={}; saveDone(); preview(); } };
  $('jbPgCsv').onclick=function(){
    var lines=['회원번호,포인트,모드,메모,결과,메시지,시각'];
    S.results.forEach(function(r){ lines.push([r.no,r.amt,r.mode,'"'+r.memo.replace(/"/g,'""')+'"',r.ok?'성공':'실패','"'+(r.msg||'').replace(/"/g,'""')+'"',r.at].join(',')); });
    var blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='포인트지급결과_'+new Date().toISOString().slice(0,16).replace(/[-:T]/g,'')+'.csv'; a.click();
  };
  window.jbPointGrant={version:VER,parse:parse,preview:preview,run:run,state:S};
})();
