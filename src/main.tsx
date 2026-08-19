import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { enableNetworkLockdown } from './lib/networkLockdown'
import { requestPersistentStorage } from './lib/storage'
import './styles.css'
import './enhancements.css'

enableNetworkLockdown()
void requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
