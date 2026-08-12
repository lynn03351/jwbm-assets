// FLEXG 기간별 클릭/구매전환 (SalesClick) 파서 + 추천 지표 — v50
// 파일: HTML 테이블형 .xls, 행0 = [상품명, 합계, MM-DD…], 상품셀 끝에 SAI코드

const TAG_RE = /<[^>]+>/g

// 파일명에서 기준 연도 추출 (SalesClick_2026-08-06.xls → 2026)
export function yearFromFilename(name) {
  const m = String(name || '').match(/(\d{4})-\d{2}-\d{2}/)
  return m ? +m[1] : new Date().getFullYear()
}

// HTML 텍스트 → { products: [{code, name, daily: [{date, clicks, orders}]}] }
export function parseSalesClick(text, fileYear, fileMonth = null) {
  const rows = [...text.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1])
  if (rows.length < 2) throw new Error('SalesClick 표를 찾지 못했어요 — FLEXG 기간별 클릭/구매전환 내보내기 원본인지 확인해주세요.')
  const cellsOf = (r) => [...r.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => m[1])

  // 헤더: 날짜 컬럼 (MM-DD) — 연도는 파일명 기준, 12월→1월 걸침 보정
  const head = cellsOf(rows[0]).map((c) => c.replace(TAG_RE, ' '))
  const dates = []
  for (let i = 2; i < head.length; i++) {
    const dm = head[i].match(/(\d{2})-(\d{2})/)
    if (!dm) { dates.push(null); continue }
    const mo = +dm[1]
    let y = fileYear
    if (fileMonth != null && mo > fileMonth) y = fileYear - 1  // 파일월보다 큰 월 = 전년도
    dates.push(`${y}-${dm[1]}-${dm[2]}`)
  }

  const products = []
  for (let ri = 1; ri < rows.length; ri++) {
    const cells = cellsOf(rows[ri])
    if (cells.length < 3) continue
    const nameRaw = cells[0].replace(TAG_RE, '\n')
    const codeM = nameRaw.match(/(SAI\d+)/)
    const code = codeM ? codeM[1] : null
    const name = nameRaw.replace(/SAI\d+/, '').replace(/\s+/g, ' ').trim()
    if (!code && !name) continue
    const daily = []
    for (let ci = 2; ci < cells.length; ci++) {
      const date = dates[ci - 2]
      if (!date) continue
      const nums = [...cells[ci].replace(TAG_RE, '\n').matchAll(/([\d,]+)/g)].map((m) => +m[1].replace(/,/g, ''))
      // 셀 형식: 클릭 \n 주문 \n (전환율) — 앞 2개만 사용
      daily.push({ date, clicks: nums[0] || 0, orders: nums[1] || 0 })
    }
    products.push({ code: code || name, name: name || code, daily })
  }
  if (!products.length) throw new Error('상품 행을 읽지 못했어요.')
  return { products }
}

// 여러 파일 병합 — 코드 기준, 같은 날짜는 나중 파일 우선
export function mergeSalesClick(fileResults) {
  const byCode = new Map()
  for (const fr of fileResults) {
    for (const p of fr.products) {
      let e = byCode.get(p.code)
      if (!e) { e = { code: p.code, name: p.name, byDate: new Map() }; byCode.set(p.code, e) }
      e.name = p.name || e.name
      for (const d of p.daily) e.byDate.set(d.date, { clicks: d.clicks, orders: d.orders })  // 나중 파일이 덮어씀
    }
  }
  const allDates = [...new Set([...byCode.values()].flatMap((e) => [...e.byDate.keys()]))].sort()
  const products = [...byCode.values()].map((e) => ({
    code: e.code, name: e.name,
    daily: allDates.map((dt) => ({ date: dt, ...(e.byDate.get(dt) || { clicks: 0, orders: 0 }) })),
  }))
  return { products, dates: allDates }
}

// 지표: 전환율 · 평상시 전환율(스파이크일 제외) · 지속률 · 집중도 · 꾸준지수 · 배지
export function computeClickMetrics(merged) {
  const days = merged.dates.length
  const rows = merged.products.map((p) => {
    const clicks = p.daily.reduce((s, d) => s + d.clicks, 0)
    const orders = p.daily.reduce((s, d) => s + d.orders, 0)
    const cvr = clicks ? orders / clicks * 100 : 0
    const orderDays = p.daily.filter((d) => d.orders > 0).length
    const persist = days ? orderDays / days : 0
    let spike = null
    for (const d of p.daily) if (!spike || d.orders > spike.orders) spike = d
    const conc = orders ? (spike?.orders || 0) / orders : 0
    const steady = Math.round(persist * (1 - conc) * 100)
    // 평상시 전환율: 최대 주문일(스파이크일) 제외 재계산 — 밴드/카톡 몰림 착시 제거
    const nClicks = clicks - (spike?.clicks || 0)
    const nOrders = orders - (spike?.orders || 0)
    const normalCvr = nClicks > 0 ? nOrders / nClicks * 100 : null
    return { code: p.code, name: p.name, clicks, orders, cvr, persist: persist * 100, conc: conc * 100,
             steady, normalCvr, spikeDate: spike?.date || null, daily: p.daily }
  })
  // 배지 기준: 고전환 = 전환율 상위 25% (주문 5+), 꾸준 = 60점+, 스파이크 = 집중도 50%+
  const cvrs = rows.filter((r) => r.orders >= 5).map((r) => r.cvr).sort((a, b) => a - b)
  const cvrTop = cvrs.length ? cvrs[Math.floor(cvrs.length * 0.75)] : Infinity
  for (const r of rows) {
    r.badges = []
    if (r.orders >= 5 && r.cvr >= cvrTop) r.badges.push('🔥')
    if (r.steady >= 60 && r.orders >= 5) r.badges.push('📈')
    if (r.conc >= 50 && r.orders >= 5) r.badges.push('⚡')
  }
  return { rows, days }
}

// 한정특가 후보: 클릭 50+ 상품 중 클릭 하위 40% & 주문 5+ → 전환율 상위
// (백분위를 전체가 아닌 '표본 충분(50클릭+)' 상품 안에서 계산 — 저클릭 꼬리가 임계를 무너뜨리는 것 방지)
export function limitedDealCandidates(rows, topN = 10, minClicks = 50) {
  const eligible = rows.filter((r) => r.clicks >= minClicks)
  if (!eligible.length) return { rows: [], threshold: 0, eligible: 0 }
  const clicksSorted = eligible.map((r) => r.clicks).sort((a, b) => a - b)
  const threshold = clicksSorted[Math.min(clicksSorted.length - 1, Math.floor(clicksSorted.length * 0.4))]
  const cand = eligible.filter((r) => r.clicks <= threshold && r.orders >= 5)
  cand.sort((a, b) => b.cvr - a.cvr || b.orders - a.orders)
  return { rows: cand.slice(0, topN), threshold, eligible: eligible.length }
}

// ── 라이브 페이지 파서 (Statistics/salesclick GET 응답) ──
// 구조: 상품당 2행 — [상품명+SAI(rowspan), '클릭수', 합계, 일별…] / ['주문수 (전환율)', 합계, 일별…]
export function parseSalesClickLive(html, fromDate, toDate) {
  const ti = html.indexOf('id="listtable"')
  if (ti < 0) throw new Error('클릭/구매전환 표를 찾지 못했어요 — 세션이 만료됐거나 페이지 구조가 바뀌었을 수 있어요.')
  const tbl = html.slice(ti, html.indexOf('</table>', ti))
  const rows = [...tbl.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1])
  if (rows.length < 3) return { products: [] }
  const cellsOf = (r) => [...r.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => m[1])
  const txt = (c) => c.replace(TAG_RE, ' ')

  // 헤더 날짜: 'MM-DD 요일' → 연도는 from/to에서 (걸침: 컬럼월 >= from월 → from연도, 아니면 to연도)
  const fy = +String(fromDate).slice(0, 4), fm = +String(fromDate).slice(5, 7)
  const ty = +String(toDate).slice(0, 4)
  const head = cellsOf(rows[0]).map(txt)
  const dates = []
  for (let i = 3; i < head.length; i++) {
    const dm = head[i].match(/(\d{2})-(\d{2})/)
    if (!dm) { dates.push(null); continue }
    const y = +dm[1] >= fm ? fy : ty
    dates.push(`${y}-${dm[1]}-${dm[2]}`)
  }

  const products = []
  for (let ri = 1; ri + 1 < rows.length; ri += 2) {
    const ca = cellsOf(rows[ri])       // 클릭수 행 (상품명 포함)
    const cb = cellsOf(rows[ri + 1])   // 주문수 행
    if (ca.length < 3 || cb.length < 2) continue
    const nameRaw = txt(ca[0])
    const codeM = nameRaw.match(/(SAI\d+)/)
    const code = codeM ? codeM[1] : null
    const name = nameRaw.replace(/SAI\d+/, '').replace(/\s+/g, ' ').trim()
    if (!code && !name) continue
    const num = (c) => { const m = txt(c).match(/([\d,]+)/); return m ? +m[1].replace(/,/g, '') : 0 }
    const daily = []
    for (let k = 0; k < dates.length; k++) {
      const date = dates[k]
      if (!date) continue
      daily.push({ date, clicks: num(ca[3 + k] || ''), orders: num(cb[2 + k] || '') })
    }
    products.push({ code: code || name, name: name || code, daily })
  }
  return { products }
}
