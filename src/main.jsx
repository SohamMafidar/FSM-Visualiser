import { createRoot } from 'react-dom/client'
import './styles.css'
import { App } from './App'
import { useStore } from './store'
import { SAMPLE } from './core/sample'
createRoot(document.getElementById('root')).render(<App />)
window.__fsm = { store: useStore, SAMPLE }
