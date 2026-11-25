import { useStore } from '../store'
export function Toast() {
  const t = useStore((s) => s.toast)
  return (
    <div id="toast" style={{ display: t ? 'block' : 'none' }}>
      {t}
    </div>
  )
}
