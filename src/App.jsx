import { useEffect } from 'react'
import { useStore } from './store'
import { TopBar } from './components/TopBar'
import { Canvas } from './components/Canvas'
import { Panel } from './panel/Panel'
import { Tooltip } from './components/Tooltip'
import { Toast } from './components/Toast'
import { LoadModal } from './components/LoadModal'
import { DataModal } from './components/DataModal'
export function App() {
  const modal = useStore((s) => s.modal)
  const lite = useStore((s) => s.lite)
  useEffect(() => {
    document.body.classList.toggle('lite', lite)
  }, [lite])
  // Global keys: Esc clears, "/" focuses search.
  useEffect(() => {
    const onKey = (ev) => {
      const tag = (ev.target.tagName || '').toLowerCase()
      if (ev.key === 'Escape') {
        useStore.getState().escape()
        document.activeElement?.blur?.()
      } else if (ev.key === '/' && tag !== 'input' && tag !== 'textarea') {
        ev.preventDefault()
        document.getElementById('search')?.focus()
      }
    }
    // Drop a file anywhere: FSM normally, call log when the Trace tab is open.
    const onOver = (ev) => ev.preventDefault()
    const onDrop = (ev) => {
      ev.preventDefault()
      const f = ev.dataTransfer?.files?.[0]
      if (!f) return
      f.text().then((t) => {
        const s = useStore.getState()
        if (s.G && s.tab === 'trace' && !s.modal) s.loadTrace(t)
        else {
          const r = s.load(t)
          if (!r.ok) {
            s.openLoad()
            s.showToast('That file could not be read.')
          }
        }
      })
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('dragover', onOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('dragover', onOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [])
  return (
    <>
      <div id="app">
        <TopBar />
        <div id="main">
          <Canvas />
          <Panel />
        </div>
      </div>
      <Tooltip />
      <Toast />
      {modal && modal.kind === 'load' && <LoadModal />}
      {modal && modal.kind === 'data' && <DataModal id={modal.id} />}
    </>
  )
}
