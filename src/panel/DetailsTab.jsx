// Nothing selected: overview + legend.  A state selected: its transitions and who leads to it.
import { useStore } from '../store'
import { colorForType } from '../core/colors'
import { isEndType, isTermType } from '../core/graph'
import { isFallback } from '../core/expressions'
import { ExprView } from '../components/ExprView'

const stateColor = (type) => (isEndType(type) ? '#E6E8F0' : colorForType(type))

function Legend({ G }) {
  const counts = {}
  G.states.forEach((s) => (counts[s.type] = (counts[s.type] || 0) + 1))
  return (
    <>
      <h3>State types</h3>
      <div className="legend">
        {Object.keys(counts).map((type) => (
          <div className="li" key={type} style={{ '--c': stateColor(type) }}>
            <span
              className="sw"
              style={
                isEndType(type) ? { background: 'transparent', border: '2px solid #E6E8F0' } : null
              }
            />
            <span>
              {type} · {counts[type]}
            </span>
          </div>
        ))}
      </div>
      <h3>Lines</h3>
      <div className="legend">
        <div className="li" style={{ '--c': '#4a516b' }}>
          <span className="ln" />
          transition (forward)
        </div>
        <div className="li" style={{ '--c': 'var(--back)' }}>
          <span className="ln dash" />
          loop: goes back to an earlier state
        </div>
        <div className="li" style={{ '--c': 'var(--err)' }}>
          <span className="ln dash" />
          target is not defined
        </div>
        <div className="li" style={{ '--c': 'var(--hl)' }}>
          <span className="ln" />
          path finder
        </div>
        <div className="li" style={{ '--c': 'var(--trace)' }}>
          <span className="ln" />
          call trace (what actually happened)
        </div>
      </div>
    </>
  )
}

function Overview({ G, start }) {
  const select = useStore((s) => s.select)
  return (
    <>
      <h3>Overview</h3>
      <div>
        {G.states.length} states · {G.edges.length} transitions · start:{' '}
        <a className="lnk" onClick={() => select(start)}>
          {start || '—'}
        </a>
      </div>
      <Legend G={G} />
      <h3>Tips</h3>
      <div className="note">
        Click a state to focus on it and its neighbours. Hover a line to read its full condition.
        Drag to pan, scroll to zoom. Use Paths to see every route between two states, and Trace to
        overlay a real call.
      </div>
    </>
  )
}

function StateDetails({ G, st }) {
  const { select, openData, setPf, setTab } = useStore.getState()
  const goPaths = (changes) => {
    setPf(changes)
    useStore.setState({ tab: 'paths', sel: null })
  }
  // Unique states that point here (a state may have several transitions to the same target).
  const parents = [...new Map(G.inn.get(st.id).map((e) => [e.from, e])).values()]

  return (
    <>
      <div className="row" style={{ marginTop: 0 }}>
        <span className="pill" style={{ '--c': stateColor(st.type) }}>
          {st.type}
        </span>
      </div>
      <div className="big">{st.id}</div>
      <div className="row">
        <button className="btn" disabled={!st.data.length} onClick={() => openData(st.id)}>
          Input data ({st.data.length})
        </button>
        <button className="btn" onClick={() => goPaths({ from: st.id, pick: null })}>
          Paths from here
        </button>
        <button className="btn" onClick={() => goPaths({ to: st.id, pick: null })}>
          Paths to here
        </button>
      </div>

      {st.issues.length > 0 && (
        <>
          <h3>Issues</h3>
          {st.issues.map((i, n) => (
            <div className="issue" key={n} style={{ cursor: 'default' }}>
              <span className={'ic ' + i.sev}>{i.sev === 'error' ? '✖' : '⚠'}</span>
              <div>{i.msg}</div>
            </div>
          ))}
        </>
      )}

      <h3>Transitions ({st.transitions.length})</h3>
      {!st.transitions.length && (
        <div className="note">{isTermType(st.type) ? 'None. This is an end state.' : 'None.'}</div>
      )}
      {st.transitions.length > 1 && (
        <div className="note">Checked top to bottom. The first condition that is true wins.</div>
      )}
      {st.transitions.map((t, i) => (
        <div className="tr-item" key={i}>
          <span className="ord">{i + 1}</span>
          <div style={{ minWidth: 0 }}>
            {G.byId.has(t.target) ? (
              <a className="lnk" onClick={() => select(t.target)}>
                → {t.target}
              </a>
            ) : (
              <span style={{ color: 'var(--err)', fontWeight: 600 }}>
                ✖ {t.target} (not defined)
              </span>
            )}
            {isFallback(t.raw, t.ex) ? (
              <div className="note">otherwise (no condition)</div>
            ) : (
              <div className="cond">
                <ExprView raw={t.raw} />
              </div>
            )}
            {t.ex && t.ex.err && <div className="derr">⚠ {t.ex.err}</div>}
          </div>
        </div>
      ))}

      <h3>Reached from ({G.inn.get(st.id).length})</h3>
      {!parents.length && <div className="note">Nothing points here.</div>}
      {parents.map((e) => (
        <div key={e.from} style={{ padding: '2px 0' }}>
          <a className="lnk" onClick={() => select(e.from)}>
            ← {e.from}
          </a>
          {e.back && <span style={{ color: 'var(--back)' }}> loop</span>}
        </div>
      ))}
    </>
  )
}

export function DetailsTab() {
  const G = useStore((s) => s.G)
  const start = useStore((s) => s.start)
  const sel = useStore((s) => s.sel)
  const st = sel && G.byId.get(sel)
  return st ? <StateDetails G={G} st={st} /> : <Overview G={G} start={start} />
}
