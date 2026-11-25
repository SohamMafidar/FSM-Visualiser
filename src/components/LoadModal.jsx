import { useRef, useState } from 'react'
import { useStore } from '../store'
import { SAMPLE } from '../core/sample'
import { Modal } from './Modal'
export function LoadModal() {
  const load = useStore((s) => s.load)
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [over, setOver] = useState(false)
  const file = useRef(null)
  const go = (t) => {
    const r = load(t)
    setErr(r.ok ? '' : r.msg || '')
  }
  return (
    <Modal title="Load FSM">
      <div
        className={'drop' + (over ? ' over' : '')}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOver(false)
          e.dataTransfer.files[0]?.text().then(go)
        }}
      >
        Drop your FSM file here, or{' '}
        <a className="lnk" onClick={() => file.current?.click()}>
          choose a file
        </a>
        <input
          ref={file}
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0]?.text().then(go)}
        />
      </div>
      <textarea
        style={{ minHeight: 140, marginTop: 12 }}
        placeholder="…or paste the FSM text here"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="row">
        <button className="btn primary" onClick={() => text.trim() && go(text)}>
          Visualize pasted text
        </button>
        <button className="btn" onClick={() => go(SAMPLE)}>
          Try the sample
        </button>
      </div>
      <div className="note">
        Accepts strict JSON, or relaxed syntax: unquoted keys, expressions without quotes, comments,
        trailing commas. Nothing leaves your browser.
      </div>
      {err && <div className="err-box">{err}</div>}
    </Modal>
  )
}
