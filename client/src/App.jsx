import { useEffect } from 'react'
import { themeParams } from '@telegram-apps/sdk'
import Game from './components/Game.jsx'
import './App.css'

/**
 * Root component. Maps Telegram theme params to CSS variables on mount.
 * @returns {JSX.Element}
 */
function App() {
  useEffect(() => {
    let tp
    try { tp = themeParams.state() } catch {}
    if (!tp) return

    const root = document.documentElement
    const map = {
      '--tg-bg-color': tp.backgroundColor,
      '--tg-text-color': tp.textColor,
      '--tg-hint-color': tp.hintColor,
      '--tg-button-color': tp.buttonColor,
      '--tg-button-text-color': tp.buttonTextColor,
      '--tg-secondary-bg-color': tp.secondaryBackgroundColor,
      '--tg-link-color': tp.linkColor,
      '--tg-destructive-color': tp.destructiveTextColor,
      '--tg-section-bg-color': tp.sectionBackgroundColor,
      '--tg-section-header-color': tp.sectionHeaderTextColor,
      '--tg-subtitle-color': tp.subtitleTextColor,
      '--tg-accent-color': tp.accentTextColor,
    }

    for (const [key, val] of Object.entries(map)) {
      if (val) root.style.setProperty(key, val)
    }
  }, [])

  return <Game />
}

export default App
