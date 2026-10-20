import React from 'react'
import ReactDOM from 'react-dom/client'
import '@astryxdesign/core/reset.css'
import '@astryxdesign/core/astryx.css'
import '@astryxdesign/theme-neutral/theme.css'
import './brand.css'
import { Theme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'
import FlexgDash from './FlexgDash.jsx'
import { initChannels } from './channels.js'

document.documentElement.setAttribute('data-astryx-theme', 'neutral')
let root = document.getElementById('root')
if (!root) {
  root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
}
const ld = document.getElementById('ld')
if (ld) ld.textContent = '추적코드 목록 불러오는 중…'

// v51.1: 렌더 전에 추적코드 목록·그룹 규칙 로드 (뷰어 저장본 > 24h 캐시 > FLEXG+Supabase 라이브)
const viewerSnap = window.__JWBM_VIEWER__?.state?.channels || null
initChannels({ viewerSnap }).catch(() => null).then(() => {
  if (ld) ld.remove()
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Theme theme={neutralTheme}>
        <FlexgDash />
      </Theme>
    </React.StrictMode>,
  )
})
