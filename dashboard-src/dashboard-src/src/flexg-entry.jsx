import React from 'react'
import ReactDOM from 'react-dom/client'
import '@astryxdesign/core/reset.css'
import '@astryxdesign/core/astryx.css'
import '@astryxdesign/theme-neutral/theme.css'
import './brand.css'
import { Theme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'
import FlexgDash from './FlexgDash.jsx'

document.documentElement.setAttribute('data-astryx-theme', 'neutral')
let root = document.getElementById('root')
if (!root) {
  root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
}
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Theme theme={neutralTheme}>
      <FlexgDash />
    </Theme>
  </React.StrictMode>,
)
