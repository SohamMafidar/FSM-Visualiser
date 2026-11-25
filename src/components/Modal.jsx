import { useStore } from '../store'
export function Modal({ title, children }) {
  const close = useStore((s) => s.closeModal)
  return (
    <div
      className="ov"
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div className="dlg">
        <div className="dhead">
          <div className="dtitle">{title}</div>
          <button className="btn" onClick={close}>
            Close ✕
          </button>
        </div>
        <div className="dbody">{children}</div>
      </div>
    </div>
  )
}
