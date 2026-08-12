// 주문서/회원 엑셀 공용 파서 — 메인 스레드와 워커 양쪽에서 사용
import * as XLSX from 'xlsx'

// ArrayBuffer → { sheet, headers, data }
// dense 모드: 대용량(10만행+)에서 메모리·속도 유리
export function parseOrderBuffer(buf) {
  let wb
  try {
    wb = XLSX.read(buf, { type: 'array', dense: true, cellStyles: false, cellHTML: false, cellFormula: false })
  } catch {
    for (const enc of ['utf-8', 'euc-kr']) {
      try {
        wb = XLSX.read(new TextDecoder(enc).decode(buf), { type: 'string', dense: true })
        break
      } catch { /* next */ }
    }
  }
  if (!wb) throw new Error('파일을 읽지 못했어요. FLEXG에서 받은 원본 그대로 올려주세요.')
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' })
  const hIdx = rows.findIndex((r) => r && r.filter((c) => String(c).trim()).length >= 3)
  if (hIdx < 0) throw new Error('헤더 행을 찾지 못했어요.')
  const headers = rows[hIdx].map((h) => String(h).trim())
  const data = rows.slice(hIdx + 1).filter((r) => r && r.some((c) => String(c).trim()))
  return { sheet: wb.SheetNames[0], headers, data }
}
