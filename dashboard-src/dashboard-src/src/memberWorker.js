// 회원 파일 파싱+프로젝션 워커 — 파일당 1건, 파싱 후 즉시 열 단위 프로젝션(행 원본 폐기)
import { parseOrderBuffer } from './orderParse'
import { projectMembers } from './memberProject'

self.onmessage = (e) => {
  const { seq, buf, name } = e.data
  try {
    const { headers, data } = parseOrderBuffer(buf)
    const proj = projectMembers(headers, data)
    self.postMessage({ seq, ok: true, name, proj, rows: data.length })
  } catch (err) {
    self.postMessage({ seq, ok: false, name, error: err?.message || String(err) })
  }
}
