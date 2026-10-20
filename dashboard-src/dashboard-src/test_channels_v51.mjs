import { readFileSync } from 'node:fs'
import { parseChannelRegist, parseSummaryList, applyChannels, CH, makeGroupOf } from './src/channels.js'
const U = process.argv[2] || './test-fixtures/'
const L = readFileSync(U + 'cac8bb4e-__________HTML.html', 'utf8')
const S = readFileSync(U + 'e1d09918-sales_channel_html.html', 'utf8')
const rules = [{"grp":"직접유입","seq":1,"rule_val":"채널 외 직접","rule_type":"정확히"},{"grp":"APP_CRM메시지","seq":2,"rule_val":"데이터라이즈","rule_type":"포함"},{"grp":"APP_CRM메시지","seq":3,"rule_val":"와이즈트래커","rule_type":"포함"},{"grp":"APP_앱푸시","seq":4,"rule_val":"APP)앱푸시","rule_type":"접두어"},{"grp":"APP_배너·메뉴","seq":5,"rule_val":"APP)","rule_type":"접두어"},{"grp":"밴드AD","seq":6,"rule_val":"밴드AD_","rule_type":"접두어"},{"grp":"카카오톡","seq":7,"rule_val":"카카오톡_","rule_type":"접두어"},{"grp":"카카오스토리","seq":8,"rule_val":"카카오스토리","rule_type":"접두어"},{"grp":"인플루언서(인포크)","seq":9,"rule_val":"인포크","rule_type":"포함"},{"grp":"메타(인스타·페북)","seq":10,"rule_val":"인스타","rule_type":"포함"},{"grp":"메타(인스타·페북)","seq":11,"rule_val":"메타","rule_type":"포함"},{"grp":"메타(인스타·페북)","seq":12,"rule_val":"페이스북","rule_type":"포함"},{"grp":"네이버","seq":13,"rule_val":"네이버","rule_type":"포함"},{"grp":"구글","seq":14,"rule_val":"구글","rule_type":"포함"},{"grp":"기타광고(토스·틱톡·당근)","seq":15,"rule_val":"토스","rule_type":"포함"},{"grp":"기타광고(토스·틱톡·당근)","seq":16,"rule_val":"틱톡","rule_type":"포함"},{"grp":"기타광고(토스·틱톡·당근)","seq":17,"rule_val":"당근","rule_type":"포함"}]
const codes = parseChannelRegist(L)
console.log('codes', codes.length, 'group rows', codes.filter(c=>c.group).length, 'parents', [...new Set(codes.filter(c=>c.parent).map(c=>c.parent))])
applyChannels(codes, rules, 'test')
console.log('총 코드(0 포함)', CH.codes.length)
console.log('그룹별 수', Object.fromEntries(CH.groups.map(g=>[g.name, g.idxs.split(',').length])))
console.log('기타 그룹 내용', CH.codes.filter(c=>c.c==='기타').map(c=>c.i+' '+c.n))
console.log('앱푸시 자식', CH.codes.filter(c=>c.parent.startsWith('APP)앱푸시')).map(c=>c.i+':'+c.c))
console.log('와이즈트래커 자식 예', CH.codes.filter(c=>c.i==='250')[0])
console.log('GROUP_A n', CH.GROUP_A.split(',').length, 'GROUP_B n', CH.GROUP_B.split(',').length, 'ALL n', CH.ALL.split(',').length)
const sm = parseSummaryList(S)
console.log('summary', sm.amt, sm.cnt, sm.profit, 'rows', sm.rows.length, 'children rows', sm.rows.filter(r=>r.parent))
// 부모 = 자식 합 검증
const st=S.indexOf('var summaryList'); const j=S.indexOf('[',st); let d=0,k=j; for(;k<S.length;k++){ if(S[k]==='[')d++; else if(S[k]===']'){d--; if(!d)break} }
const arr=JSON.parse(S.slice(j,k+1)); const p=arr.find(n=>n.children&&n.children.length)
console.log('부모 amt', p.data.totalCalcedAmt, '자식합', p.children.reduce((s,c)=>s+c.data.totalCalcedAmt,0))
