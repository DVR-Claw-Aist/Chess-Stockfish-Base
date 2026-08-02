import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { init } from '@telegram-apps/sdk'
import './index.css'
import App from './App.jsx'

/**
 * Entrypoint. Initializes the Telegram Mini App (optional) and mounts the app.
 * @returns {void}
 */
try { init() } catch {
  // вне Telegram — CSS fallback работают
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
