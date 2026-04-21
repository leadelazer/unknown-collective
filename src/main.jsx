import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'

const THEME_KEY = 'uc-theme'
const savedTheme = window.localStorage.getItem(THEME_KEY)
const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
const initialTheme = savedTheme === 'dark' || savedTheme === 'light'
  ? savedTheme
  : prefersLight ? 'light' : 'dark'

document.documentElement.dataset.theme = initialTheme

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
