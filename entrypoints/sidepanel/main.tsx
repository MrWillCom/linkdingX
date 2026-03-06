import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from 'next-themes'
import { Toast } from '@heroui/react'
import { Agentation } from 'agentation'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <Toast.Provider placement="bottom end" />
      <App />
      {import.meta.env.DEV && <Agentation />}
    </ThemeProvider>
  </React.StrictMode>,
)
