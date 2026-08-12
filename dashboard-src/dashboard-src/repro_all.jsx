global.window = undefined
const M = await import('./src/FlexgDash.jsx')
const P = await import('./src/memberProject.js')
const ok = (n, c) => console.log(n, c ? '✓' : '✗!!')

// ── 주문서/분류/등급 ──
const H1 = ['주문번호','주문 상태','잔여 결제 금액','주문 경로','회원 여부','회원 등급','상품명','상품코드','잔여수량','잔여 판매이익','채널명','주문일']
const mk = (no, st, amt, grade, prod, code, ch, day) => [no, st, String(amt), 'APP', grade ? '회원' : '비회원', grade, prod, code, '1', '1000', ch, `2026-07-${day} 10:15:00`]
const data = [
  mk('O1','배송완료',10000,'씨앗','된장볼','SAI001','카카오톡_여성톡채널','01'),
  mk('O1','배송완료',5000,'씨앗','된장볼','SAI001','카카오톡_여성톡채널','01'),
  mk('O2','배송완료',20000,'나무','한우세트','SAI002','APP)앱푸시','02'),
  mk('O3','취소',99999,'씨앗','된장볼','SAI001','카카오톡_여성톡채널','02'),
  mk('O4','배송중',7000,'','미역국','SAI003','','03'),
  mk('O5','배송완료',12000,'새싹','된장볼','SAI001','밴드AD_국가대표농수산','08'),
]
const a = M.analyzeOrders(H1, data)
ok('총매출 54000', a.totalAmt === 54000)
ok('유효주문 4', a.totalCnt === 4)
const rules = { '반찬': ['TOP > 반찬거리'] }
ok('확장분류', M.classifyWithRules(['TOP > 반찬거리'], rules) === '반찬')
ok('정규화 객체맵', JSON.stringify(M.normalizeClassRules({ '반찬': { 'a': true, 'b': false } })['반찬']) === '["a"]')
const cm = M.buildProductClassMap([], [['SAI001',...Array(21).fill(''),'TOP > 반찬거리','',''], ['SAI002',...Array(21).fill(''),'한우','','']], rules)
const mx = M.computeChannelCategoryMatrix(H1, data, cm)
ok('매트릭스 카카오 15000', mx.rows.find((r) => r.group === '카카오톡')?.amt === 15000)
const gp = M.computeGradeProducts(H1, data)
ok('씨앗 TOP1 15000', gp.find((g) => g.grade === '씨앗')?.products[0]?.amt === 15000)
ok('등급수요 code 필드', gp[0].products[0].code !== undefined)

// ── 시간대 (드릴2 포함) ──
const ti = M.computeHourlyTags(H1, data)
ok('태그 4건(dedupe+취소제외)', ti.tags.length === 4)
const cube = M.hourlyCubeFromTags(ti)
const b1 = M.hourlyBuckets({ tags: ti.tags }, 3, 'all', 'all')
const b1c = M.hourlyBuckets({ cube }, 3, 'all', 'all')
ok('버킷 라이브=큐브', b1.rows.map((r) => r.cnt).join() === b1c.rows.map((r) => r.cnt).join())
const d2 = M.hourlyDrill2({ tags: ti.tags }, 3, 9, '카카오톡', 'all', 'all')
const d2c = M.hourlyDrill2({ cube }, 3, 9, '카카오톡', 'all', 'all')
ok('드릴2 라이브=큐브', JSON.stringify(d2) === JSON.stringify(d2c) && d2.length === 1)

// ── 연령 (v48) ──
const H2 = Array.from({ length: 20 }, (_, i) => '컬럼' + i)
H2[0] = '회원 고유번호'; H2[2] = '상태'; H2[3] = '회원 등급'; H2[6] = '가입일'; H2[19] = '생년월일'
const row = (uid, joined, birth) => { const r = new Array(20).fill(''); r[0] = uid; r[2] = '사용중'; r[3] = '씨앗'; r[6] = joined; r[19] = birth; return r }
const proj = P.projectMembers(H2, [
  row('u1', '2026-07-01', 19900615), row('u2', '2015-03-10', 19900615),
  row('u3', '2026-07-01', 19000101), row('u4', '2026-07-01', ''),
])
console.log('proj.birth 실제:', JSON.stringify(proj.birth))
ok('parseBirth 규약', JSON.stringify(proj.birth) === JSON.stringify([19900615, 19900615, -1, 0]))
const store = M.mergeProjected(M.newMemberStore(), proj)
ok('birthHad/Bad', store.birthHad === 3 && store.birthBad === 1)
const age = M.computeAgeAnalysis(store, '2026-07-22', null)
ok('가입당시 20대 vs 현재 30대', age.dist[2] === 2 && age.trend.find((r) => r.ym === '2015-03')?.['20대'] === 1)
ok('assign', [...age.assign].join() === '2,2,255,255')
process.exit(0)
