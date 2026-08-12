import { JSDOM } from 'jsdom'
import fs from 'fs'
const target = process.argv[2] || '/mnt/user-data/uploads/제철밥상_매출_대시보드_2026-08-12_0735.html'
const html = fs.readFileSync(target, 'utf-8')
const dom = new JSDOM(html, {
  url: 'https://viewer.local/', pretendToBeVisual: true, runScripts: 'dangerously',
  beforeParse(w) {
    w.matchMedia = (q) => ({ matches: false, media: q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent: () => false })
    w.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} }
    w.requestAnimationFrame = (cb) => setTimeout(cb, 0)
    w.HTMLDialogElement && (w.HTMLDialogElement.prototype.showModal = function(){ this.open = true })
    w.fetch = () => Promise.resolve({ ok: true, text: () => Promise.resolve('') })
    w.__errs = []
    const oe = w.console.error.bind(w.console)
    w.console.error = (...a) => { w.__errs.push(a.map((x) => x instanceof Error ? x.message : String(x)).join(' ').slice(0, 180)) }
  },
})
await new Promise((r) => setTimeout(r, 2500))
const doc = dom.window.document
const cleanText = () => {
  const b = doc.body.cloneNode(true)
  b.querySelectorAll('script').forEach((s) => s.remove())
  return b.textContent
}
const sp = [...doc.querySelectorAll('button span')].find((el) => el.textContent === '🧾 주문서')
if (sp) { sp.closest('button').click(); await new Promise((r) => setTimeout(r, 1200)) }
const t = cleanText()
console.log('파일:', target.split('/').pop())
for (const [n, kw] of [['KPI라벨 유효주문','유효 주문'],['배너 저장된','저장된 분석 결과'],['KPI 건수 21,889','21,889'],['KPI 매출','558,424,026'],['경로상세 표','주문 경로 상세'],['경로 카드','주문 경로 비중'],['회원비중 카드','회원 / 비회원'],['등급매출 카드','등급별 매출'],['TOP30','등급별 수요 상품'],['매트릭스','채널 그룹 × 카테고리'],['시간대','시간대별 주문 분석']])
  console.log(' ', n, '→', t.includes(kw) ? '✓' : '✗ 공란')
const errs = dom.window.__errs.filter((e) => !/act\(|Warning|key/.test(e))
if (errs.length) console.log('콘솔 오류:', errs.slice(0, 3))
const i = t.indexOf('주문 경로 비중')
console.log('렌더 텍스트(경로 부근):', JSON.stringify(t.slice(Math.max(0, i - 260), i + 60)))
process.exit(0)
