import { JSDOM } from 'jsdom'
import fs from 'fs'
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://viewer.local/', pretendToBeVisual: true })
global.window = dom.window; global.document = dom.window.document
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true })
Object.defineProperty(global, 'localStorage', { value: { getItem: () => null, setItem: () => {}, removeItem: () => {} }, configurable: true })
global.HTMLElement = dom.window.HTMLElement
dom.window.HTMLDialogElement.prototype.showModal = function(){ this.open = true }
dom.window.HTMLDialogElement.prototype.close = function(){ this.open = false }
global.requestAnimationFrame = (cb) => setTimeout(cb, 0)
Object.defineProperty(dom.window, 'matchMedia', { value: (q) => ({ matches: false, media: q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent: () => false }), configurable: true })
global.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} }
Object.defineProperty(dom.window, 'ResizeObserver', { value: global.ResizeObserver, configurable: true })
global.fetch = () => Promise.resolve({ ok: true, text: () => Promise.resolve('') })
Object.defineProperty(dom.window, 'fetch', { value: global.fetch, configurable: true })

// 뷰어 상태 주입 (실제 7/28 내보내기 상태)
dom.window.__JWBM_VIEWER__ = JSON.parse(fs.readFileSync('/tmp/orders_state.json', 'utf-8'))
global.__JWBM_VIEWER__ = dom.window.__JWBM_VIEWER__

const React = (await import('react')).default
const { createRoot } = await import('react-dom/client')
const FlexgDash = (await import('./src/FlexgDash.jsx')).default
const root = document.createElement('div'); document.body.appendChild(root)
createRoot(root).render(React.createElement(FlexgDash))
await new Promise((r) => setTimeout(r, 900))

const clickTab = async (label) => {
  const sp = [...document.querySelectorAll('button span')].find((el) => el.textContent === label)
  if (sp) { sp.closest('button').click(); await new Promise((r) => setTimeout(r, 400)) }
}
const has = (s) => document.body.innerHTML.includes(s)
await clickTab('🧾 주문서')
for (const [n, kw] of [['KPI 유효주문','유효 주문'],['주문경로','주문 경로 비중'],['회원/비회원','회원 / 비회원'],['등급별 매출','등급별 매출'],['등급수요TOP30','등급별 수요 상품'],['매트릭스','채널 그룹 × 카테고리'],['시간대','시간대별 주문 분석'],['상품랭킹','상품별 매출 TOP']])
  console.log('[주문서]', n, '→', has(kw) ? '✓' : '✗ 공란')
process.exit(0)
