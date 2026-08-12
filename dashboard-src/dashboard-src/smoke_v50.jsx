import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://airgram123.flexgate.co.kr/', pretendToBeVisual: true,
})
global.window = dom.window
global.document = dom.window.document
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true })
Object.defineProperty(global, 'localStorage', { value: { getItem: () => null, setItem: () => {}, removeItem: () => {} }, configurable: true })
global.HTMLElement = dom.window.HTMLElement
dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true }
dom.window.HTMLDialogElement.prototype.close = function () { this.open = false }
global.requestAnimationFrame = (cb) => setTimeout(cb, 0)
Object.defineProperty(dom.window, 'matchMedia', { value: (q) => ({ matches: false, media: q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent: () => false }), configurable: true })
global.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} }
Object.defineProperty(dom.window, 'ResizeObserver', { value: global.ResizeObserver, configurable: true })
global.fetch = () => Promise.resolve({ ok: true, text: () => Promise.resolve('') })
Object.defineProperty(dom.window, 'fetch', { value: global.fetch, configurable: true })

const React = (await import('react')).default
const { createRoot } = await import('react-dom/client')
const FlexgDash = (await import('./src/FlexgDash.jsx')).default
const root = createRoot(document.getElementById('root'))
root.render(React.createElement(FlexgDash))
await new Promise((r) => setTimeout(r, 800))
const html = document.body.innerHTML
console.log('body 길이:', html.length)
console.log(html.slice(0, 400))
console.log('오류배너:', html.includes('화면 렌더링 중 오류') ? '있음!! ✗' : '없음 ✓')
for (const s of ['v50', '🖱️ 상품추천', '📡 채널별', '📦 상품별', '주문서 파일 업로드', 'HTML 내보내기', '결과 저장', '상품 데이터 (선택)'])
  console.log(s, '→', html.includes(s) ? '✓' : '✗')
// 상품추천 탭 클릭 → 섹션 렌더 확인
const spans = [...document.querySelectorAll('button span')].filter((el) => el.textContent === '🖱️ 상품추천')
if (spans.length) { spans[0].closest('button').click() }
await new Promise((r) => setTimeout(r, 500))
const h2 = document.body.innerHTML
for (const s of ['기간별 클릭/구매전환 파일 업로드', '파일을 올려주세요'])
  console.log('탭내부:', s, '→', h2.includes(s) ? '✓' : '✗')
process.exit(0)
