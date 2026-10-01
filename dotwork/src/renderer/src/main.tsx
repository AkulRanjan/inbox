import '@vscode/codicons/dist/codicon.css'
import './assets/main.css'
import './monacoEnvironment'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
