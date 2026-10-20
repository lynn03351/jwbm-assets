// 추적코드 레지스트리 — v51.1
// 하드코딩 CODES/WEEKLY_GROUPS 대체. 부팅 시 FLEXG /Good/channel_regist 에서 코드 목록을,
// Supabase rpc_channel_rules 에서 그룹 규칙을 읽어 채움. 둘 다 24시간 localStorage 캐시.
// 의존성 없음 (node 테스트 가능).

export const BASE = 'https://airgram123.flexgate.co.kr'
export const SB_URL = 'https://sukgkojfvyijpewxpcoa.supabase.co'
// publishable 키: 빌드 시 아래 상수에 넣거나, 런타임에 window.__JWBM_SB_KEY__ 로 덮어쓰기
export const SB_KEY_DEFAULT = '__SB_PUBLISHABLE_KEY__'

const CACHE_KEY = 'jwbm_channels_v1'
const CACHE_TTL = 24 * 3600 * 1000
export const DIRECT = { i: '0', n: '채널 외 직접', parent: '', child: '채널 외 직접', group: false }

// 그룹 프리셋에서 쓰는 그룹명 (설정_채널그룹 시트의 grp 값과 일치해야 함)
export const G = {
  DIRECT: '직접유입', APP_MENU: 'APP_배너·메뉴', APP_CRM: 'APP_CRM메시지', APP_PUSH: 'APP_앱푸시',
}
const isAppGroup = (g) => g === G.APP_MENU || g === G.APP_CRM || g === G.APP_PUSH

/* ── 파서 ── */
const unesc = (s) => String(s).replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
const strip = (s) => unesc(String(s).replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()

// /Good/channel_regist HTML → [{i, n, parent, child, group}]
export function parseChannelRegist(html) {
  const out = []
  const trRe = /<tr class="td_border2">([\s\S]*?)<\/tr>/g
  let t
  while ((t = trRe.exec(html))) {
    const r = t[1]
    const nameBlk = r.match(/channel_list">([\s\S]*?)<\/div>/)
    if (!nameBlk) continue
    const names = [...nameBlk[1].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => strip(m[1]))
    const codes = [...r.matchAll(/<span class="mr-8">(\d+)<\/span>/g)].map((m) => m[1])
    const grp = /onDelete\('\d+',\s*'Y'\)/.test(r)
    const n = Math.min(names.length, codes.length)
    for (let k = 0; k < n; k++) {
      const full = names[k]
      const gt = full.indexOf('>')
      const parent = gt >= 0 ? full.slice(0, gt).trim() : ''
      const child = gt >= 0 ? full.slice(gt + 1).trim() : full
      out.push({ i: codes[k], n: full, parent, child, group: grp })
    }
  }
  if (!out.length) throw new Error('추적코드 목록을 찾지 못했어요 — FLEXG 로그인 상태이거나 화면 구조가 바뀌었는지 확인해주세요.')
  return out
}

// 규칙 판정: seq 순 첫 매칭. 빈 채널명 → 직접유입. 미매칭 APP) → APP_배너·메뉴, 그 외 → 기타
// (Supabase channel_group_of 와 동일 규칙)
export function makeGroupOf(rules) {
  const rs = [...rules].sort((a, b) => (a.seq || 0) - (b.seq || 0))
  return (name) => {
    const s = String(name || '').trim()
    if (!s || s === '(채널명 없음)') return G.DIRECT
    for (const r of rs) {
      const v = String(r.rule_val || ''), ty = String(r.rule_type || '')
      if (!v) continue
      if (ty === '정확히' ? s === v : ty === '접두어' ? s.startsWith(v) : s.indexOf(v) >= 0) return r.grp
    }
    return s.startsWith('APP)') ? G.APP_MENU : '기타'
  }
}

/* ── 레지스트리 ── */
export const CH = {
  ready: false, source: '', loadedAt: null, errors: [],
  rules: [], codes: [DIRECT], groups: [], cats: ['전체'],
  groupOf: makeGroupOf([]),
  codeName(i) { return this.codes.find((c) => c.i === String(i))?.n || `코드 ${i}` },
  byName(name) { return this.codes.find((c) => c.n === name || c.child === name) || null },
  idxsOf(groupNames) {
    const set = new Set(groupNames)
    return this.codes.filter((c) => set.has(c.c)).map((c) => c.i).join(',')
  },
  get ALL() { return this.codes.map((c) => c.i).join(',') },
  // 앱 전체(직접유입 포함) = 직접유입 + APP_배너·메뉴 + APP_CRM메시지 + APP_앱푸시
  get GROUP_A() { return this.idxsOf([G.DIRECT, G.APP_MENU, G.APP_CRM, G.APP_PUSH]) },
  // 앱 배너·메뉴(직접유입 포함) = 직접유입 + APP_배너·메뉴  (푸시·CRM 제외)
  get GROUP_B() { return this.idxsOf([G.DIRECT, G.APP_MENU]) },
  // 기획전: 채널외 + APP 계열 전체
  get PROMO() { return this.GROUP_A },
  isApp(name) { return isAppGroup(this.groupOf(name)) },
  snapshot() { return { codes: this.codes, rules: this.rules, loadedAt: this.loadedAt } },
}

export function applyChannels(codes, rules, source) {
  const groupOf = makeGroupOf(rules)
  // 자식 코드는 부모 이름으로 그룹 판정 (APP)앱푸시-시간대별>APP)앱푸시 2 → 'APP)앱푸시 2' 도 매칭되지만 안전하게 둘 다)
  const list = [DIRECT, ...codes.filter((c) => c.i !== '0')]
    .map((c) => ({ ...c, c: groupOf(c.parent ? (c.n.startsWith('APP)') ? c.child : c.n) : c.n) }))
  // 그룹 순서 = 규칙 seq 첫 등장 순, 그 뒤 기타
  const order = []
  for (const r of [...rules].sort((a, b) => (a.seq || 0) - (b.seq || 0))) if (r.grp && !order.includes(r.grp)) order.push(r.grp)
  for (const c of list) if (!order.includes(c.c)) order.push(c.c)
  const groups = order.map((name) => ({ name, idxs: list.filter((c) => c.c === name).map((c) => c.i).join(',') })).filter((g) => g.idxs)
  Object.assign(CH, { ready: true, source, loadedAt: new Date().toISOString(), rules, codes: list, groups, groupOf,
                      cats: ['전체', ...groups.map((g) => g.name)] })
  return CH
}

/* ── 로딩 ── */
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw)
    return c && c.codes && c.rules ? c : null
  } catch { return null }
}
function writeCache(codes, rules) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), codes, rules })) } catch { /* 무시 */ }
}

export async function fetchChannelRegist(fetchImpl = fetch) {
  const r = await fetchImpl(BASE + '/Good/channel_regist', { credentials: 'include' })
  if (!r.ok) throw new Error(`추적코드 조회 실패 (${r.status})`)
  return parseChannelRegist(await r.text())
}

export async function fetchChannelRules(fetchImpl = fetch, key) {
  const k = key || (typeof window !== 'undefined' && window.__JWBM_SB_KEY__) || SB_KEY_DEFAULT
  const r = await fetchImpl(SB_URL + '/rest/v1/rpc/rpc_channel_rules', {
    method: 'POST', headers: { apikey: k, Authorization: 'Bearer ' + k, 'Content-Type': 'application/json' }, body: '{}',
  })
  if (!r.ok) throw new Error(`채널 규칙 조회 실패 (${r.status})`)
  const j = await r.json()
  if (!j || !j.ok || !Array.isArray(j.rules)) throw new Error('채널 규칙 응답 형식이 달라요.')
  return j.rules
}

// 부팅: 뷰어 스냅샷 > 신선한 캐시 > 라이브 조회(둘 다 실패분만 캐시로 보충) > 오래된 캐시
export async function initChannels({ fetchImpl = fetch, key, viewerSnap = null, force = false } = {}) {
  CH.errors = []
  if (viewerSnap && viewerSnap.codes) {
    applyChannels(viewerSnap.codes, viewerSnap.rules || [], '저장본')
    return CH
  }
  const cache = readCache()
  if (!force && cache && Date.now() - cache.at < CACHE_TTL) {
    applyChannels(cache.codes, cache.rules, '캐시')
    return CH
  }
  let codes = null, rules = null
  try { codes = await fetchChannelRegist(fetchImpl) } catch (e) { CH.errors.push('추적코드: ' + (e.message || e)) }
  try { rules = await fetchChannelRules(fetchImpl, key) } catch (e) { CH.errors.push('채널 규칙: ' + (e.message || e)) }
  if (!codes && cache) codes = cache.codes
  if (!rules && cache) rules = cache.rules
  if (!codes) { applyChannels([], rules || [], '없음'); CH.ready = false; return CH }
  if (codes && rules && !CH.errors.length) writeCache(codes, rules)
  applyChannels(codes, rules || [], CH.errors.length ? '일부 캐시' : '라이브')
  return CH
}

/* ── sales_channel 응답의 summaryList JSON 파서 (정규식 표 파싱 대체) ── */
// 반환: { amt, cnt, profit, rows: [{idx, name, amt, cnt, profit, parent}] }
//  - amt = 정상금액(totalCalcedAmt) · cnt = 정상건수(totalCalcedCnt, 취소 제외) · profit = 판매이익(totalProfit)
//  - 합계는 최상위 노드 합(= 화면 소계), rows 는 말단(자식 있는 부모는 자식으로 대체)
export function parseSummaryList(html) {
  const st = html.indexOf('var summaryList')
  if (st < 0) return null
  const j = html.indexOf('[', st)
  let depth = 0, k = j, inStr = false, esc = false
  for (; k < html.length; k++) {
    const ch = html[k]
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue }
    if (ch === '"') inStr = true
    else if (ch === '[') depth++
    else if (ch === ']') { depth--; if (depth === 0) break }
  }
  let arr
  try { arr = JSON.parse(html.slice(j, k + 1)) } catch { return null }
  const num = (v) => Number(v) || 0
  const sum = { amt: 0, cnt: 0, profit: 0 }
  const rows = []
  const leaf = (n, parent) => {
    const d = n.data || {}
    const amt = num(d.totalCalcedAmt), cnt = num(d.totalCalcedCnt), profit = num(d.totalProfit)
    if (amt === 0 && cnt === 0) return
    rows.push({ idx: String(d.ch_idx ?? ''), name: n.name || d.ch_name || '', amt, cnt, profit, parent })
  }
  for (const n of arr) {
    const d = n.data || {}
    sum.amt += num(d.totalCalcedAmt); sum.cnt += num(d.totalCalcedCnt); sum.profit += num(d.totalProfit)
    if (Array.isArray(n.children) && n.children.length) for (const c of n.children) leaf(c, n.name)
    else leaf(n, '')
  }
  rows.sort((a, b) => b.amt - a.amt)
  return { ...sum, rows }
}
