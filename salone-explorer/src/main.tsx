// React entry point: mounts the app into #root. Phase 3 wraps this with
// BrowserRouter, HelmetProvider, and AuthProvider (SPEC §19).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
