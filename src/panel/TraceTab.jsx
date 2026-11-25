// Call trace: paste or upload the log lines for ONE call (one ucid). The route the call really
// took is drawn in lime on the diagram, and listed here step by step.
import { useRef, useState } from 'react'
import { useStore } from '../store'
import { useTrace } from '../hooks'

export function TraceTab() {
  const G = useStore((s) => s.G)
  const msg = useStore((s) => s.traceMsg)
  const reverse = useStore((s) => s.traceReverse)
  const { loadTrace, clearTrace, setTraceReverse, centerOn } = useStore.getState()
  const trace = useTrace()
  const [text, setText] = useState('')
  const fileInput = useRef(null)

  const repeats = trace ? trace.seq.length - Object.keys(trace.badges).length : 0

  return (
    <>
      <div className="note">
        Upload or paste the log lines for one call (one ucid). I read the "current" state field from
        each line and draw the route the call really took.
      </div>
      <div className="row">
        <button className="btn" onClick={() => fileInput.current.click()}>
          Choose log file
        </button>
        <input
          ref={fileInput}
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files[0]?.text().then(loadTrace)}
        />
        <button className="btn" onClick={() => text.trim() && loadTrace(text)}>
          Draw from pasted text
        </button>
        {trace && (
          <button className="btn" onClick={clearTrace}>
            Clear
          </button>
        )}
      </div>
      <textarea
        placeholder="Paste log lines here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <label
        className="chk"
        style={{ margin: '8px 0' }}
        title="Google Logging often exports newest first"
      >
        <input
          type="checkbox"
          checked={reverse}
          onChange={(e) => setTraceReverse(e.target.checked)}
        />
        Log is newest-first (reverse it)
      </label>

      {msg && <div className="err-box">{msg}</div>}

      {trace && (
        <>
          <h3>
            Call path · {trace.seq.length} steps
            {repeats ? ` · ${repeats} revisit${repeats > 1 ? 's' : ''}` : ''}
          </h3>
          {trace.seq.map((id, i) => (
            <div key={i}>
              <div className="tstep" style={{ cursor: 'pointer' }} onClick={() => centerOn(id)}>
                <span className="n">{i + 1}</span>
                <span style={{ fontWeight: 600 }}>{id}</span>
                <span className="mu" style={{ fontSize: 11 }}>
                  {G.byId.get(id).type}
                </span>
              </div>
              {trace.missing.includes(i + 1) && (
                <div className="tgap">
                  ⚠ The FSM has no transition {id} → {trace.seq[i + 1]}. A log line may be missing,
                  or the call moved in a way the FSM does not allow.
                </div>
              )}
            </div>
          ))}
          {trace.nUnknown > 0 && (
            <div className="note" style={{ marginTop: 8 }}>
              {trace.nUnknown} log value{trace.nUnknown > 1 ? 's' : ''} did not match any state id
              and {trace.nUnknown > 1 ? 'were' : 'was'} ignored:{' '}
              {trace.unknown.slice(0, 8).join(', ')}
              {trace.unknown.length > 8 ? '…' : ''}
            </div>
          )}
        </>
      )}
    </>
  )
}
