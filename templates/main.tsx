import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/marketing.css'
import App from './App.tsx'

if (import.meta.env.DEV) {
  void import('cssstudio').then(({ startStudio }) => startStudio())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
