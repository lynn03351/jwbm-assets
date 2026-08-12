// 주문서 파일 파싱 워커 — 파일당 1건 처리 후 결과 반환
import { parseOrderBuffer } from './orderParse'

self.onmessage = (e) => {
  const { seq, buf, name } = e.data
  try {
    const parsed = parseOrderBuffer(buf)
    self.postMessage({ seq, ok: true, name, parsed })
  } catch (err) {
    self.postMessage({ seq, ok: false, name, error: err?.message || String(err) })
  }
}
