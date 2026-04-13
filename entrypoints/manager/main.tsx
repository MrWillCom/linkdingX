import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from 'next-themes'
import { Toasty } from '@cloudflare/kumo'
import { Agentation } from 'agentation'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider attribute="data-mode">
      <Toasty>
        <App />
        {import.meta.env.DEV && <Agentation />}
      </Toasty>
    </ThemeProvider>
  </React.StrictMode>,
)
