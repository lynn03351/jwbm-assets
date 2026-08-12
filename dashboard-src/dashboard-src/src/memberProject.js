// 회원 행에서 필요한 필드만 추출 — 의존성 없는 순수 함수 (메인/워커 공용)
export function projectMembers(headers, data) {
  const norm = (s) => String(s).replace(/\s+/g, '')
  const H = headers.map(norm)
  const col = (name) => H.indexOf(norm(name))
  const c = {
    uid: col('회원 고유번호'), id: col('회원 아이디'), status: col('상태'),
    grade: col('회원 등급'), name: col('이름'), phone: col('전화번호'),
    joined: col('가입일'), lastLogin: col('최근 로그인 일자'), birth: col('생년월일'),
    firstBuy: col('최초 구매일'), lastBuy: col('최종 구매일'),
    qty: col('총 구매수량'), amt: col('총 구매금액'), sms: col('SMS 수신 동의'), app: col('APP 설치 여부'),
  }
  if (c.uid < 0 || c.grade < 0 || c.joined < 0) {
    throw new Error('회원 데이터 형식이 아니에요. (회원 고유번호/회원 등급/가입일 컬럼 필요)')
  }
  const d10 = (v) => { const s = String(v || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '' }
  const birthIdx = c.birth >= 0 ? c.birth : 19
  const todayInt = (() => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() })()
  const minYear = new Date().getFullYear() - 100
  // 유효 → yyyymmdd 정수 / 값은 있는데 무효 → -1 / 공란 → 0
  const parseBirth = (v) => {
    const s = String(v ?? '').replace(/[^0-9]/g, '')
    if (!s) return 0
    if (s.length !== 8) return -1
    const y = +s.slice(0, 4), m = +s.slice(4, 6), d = +s.slice(6, 8)
    if (y <= 1900) return -1
    if (y < minYear) return -1
    const dt = new Date(y, m - 1, d)
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return -1
    const n = y * 10000 + m * 100 + d
    if (n > todayInt) return -1
    return n
  }
  const num = (v) => Number(String(v ?? '').replace(/[^0-9.-]/g, '')) || 0
  const out = { uid: [], id: [], name: [], phone: [], grade: [], status: [],
                joined: [], lastLogin: [], firstBuy: [], lastBuy: [],
                qty: [], amt: [], sms: [], app: [], birth: [] }
  for (const r of data) {
    out.uid.push(String(r[c.uid] || ''))
    out.status.push(c.status >= 0 ? String(r[c.status] || '') : '사용중')
    out.id.push(String(r[c.id] || ''))
    out.name.push(String(r[c.name] || ''))
    out.phone.push(String(r[c.phone] || ''))
    out.grade.push(String(r[c.grade] || '기타'))
    out.joined.push(d10(r[c.joined]))
    out.lastLogin.push(d10(r[c.lastLogin]))
    out.firstBuy.push(d10(r[c.firstBuy]))
    out.lastBuy.push(d10(r[c.lastBuy]))
    out.qty.push(c.qty >= 0 ? num(r[c.qty]) : 0)
    out.amt.push(c.amt >= 0 ? num(r[c.amt]) : 0)
    out.sms.push(c.sms >= 0 && String(r[c.sms] || '') === '동의' ? 1 : 0)
    out.app.push(c.app >= 0 && String(r[c.app] || '') === 'Y' ? 1 : 0)
    out.birth.push(parseBirth(r[birthIdx]))
  }
  return out
}

