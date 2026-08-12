// v50 파서·지표 실파일 검증
global.window = undefined
import fs from 'fs'
const S = await import('./src/salesClick.js')
const text = fs.readFileSync('/mnt/user-data/uploads/SalesClick_2026-08-06.xls', 'utf-8')
const ok = (n, c) => console.log(n, c ? '✓' : '✗!!')

ok('연도 추출', S.yearFromFilename('SalesClick_2026-08-06.xls') === 2026)
const parsed = S.parseSalesClick(text, 2026, 8)
ok('상품 100개', parsed.products.length === 100)
const merged = S.mergeSalesClick([parsed])
ok('날짜 5일', merged.dates.join() === '2026-08-01,2026-08-02,2026-08-03,2026-08-04,2026-08-05')
const M = S.computeClickMetrics(merged)
const find = (kw) => M.rows.find((r) => r.name.includes(kw))
const dj = find('된장볼')
ok('된장볼 합계 24332/22', dj.clicks === 24332 && dj.orders === 22)
const gal = find('등갈비')
ok('등갈비 꾸준 77점', gal.steady === 77)
const omj = find('오미자원액')
ok('오미자 꾸준 7점 · ⚡', omj.steady === 7 && omj.badges.includes('⚡'))
console.log('오미자: 전체 전환', omj.cvr.toFixed(1) + '%', '/ 평상시', omj.normalCvr.toFixed(1) + '%', '/ 스파이크', omj.spikeDate)
// 평상시 전환율 = 스파이크일 제외 수기 계산과 일치해야 함
const spikeD = omj.daily.find((d) => d.date === omj.spikeDate)
const handCvr = (omj.orders - spikeD.orders) / (omj.clicks - spikeD.clicks) * 100
ok('평상시 전환율 수기계산 일치', Math.abs(omj.normalCvr - handCvr) < 0.001)
const cand = S.limitedDealCandidates(M.rows)
console.log('한정특가 후보:', cand.rows.length, '개 · 클릭 임계 ≤', cand.threshold)

// 병합: 이어붙임 + 중복날짜 나중 우선
const fakeNext = { products: [{ code: 'SAI80429105', name: '된장볼', daily: [
  { date: '2026-08-05', clicks: 999, orders: 9 },   // 중복 → 덮어씀
  { date: '2026-08-06', clicks: 100, orders: 3 },   // 신규
] }] }
const m2 = S.mergeSalesClick([parsed, fakeNext])
const dj2 = m2.products.find((p) => p.code === 'SAI80429105')
ok('병합 6일', m2.dates.length === 6)
ok('중복날짜 나중 우선', dj2.daily.find((d) => d.date === '2026-08-05').clicks === 999)
// 연말 걸침: 1월 파일에 12월 컬럼
const roll = S.parseSalesClick('<table><tr><td>상품명</td><td>합계</td><td>12-30</td><td>01-02</td></tr><tr><td>테스트 SAI1</td><td>10 1 (10%)</td><td>5 1 (20%)</td><td>5 0 (0%)</td></tr></table>', 2027, 1)
ok('연도 걸침 보정', roll.products[0].daily[0].date === '2026-12-30' && roll.products[0].daily[1].date === '2027-01-02')
process.exit(0)
