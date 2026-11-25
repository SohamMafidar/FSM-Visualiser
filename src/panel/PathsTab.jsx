// Path finder: pick From and To, see every route between them, click a route to see
// which conditions must be true for a call to take it.
import { useStore } from '../store'
import { usePathResult } from '../hooks'
import { isFallback } from '../core/expressions'
import { ExprView } from '../components/ExprView'

function StatePicker({ value, onChange }) {
  const G = useStore((s) => s.G)
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
      {G.states.map((s) => (
        <option key={s.id} value={s.id}>
          {s.id}
        </option>
      ))}
    </select>
  )
}

/** "For the call to take this route:" step list for one chosen route. */
function RouteConditions({ G, route, adj }) {
  return (
    <div className="steps">
      <div className="note">For the call to take this route:</div>
      {route.slice(1).map((id, k) => {
        const from = route[k]
        const edges = adj.get(from).get(id) // usually one; more if two rules lead to the same state
        const hasSiblings = G.out.get(from).length > 1
        return (
          <div className="st" key={k}>
            <div style={{ fontWeight: 600 }}>
              {from} → {id}
            </div>
            {edges.map((e, j) => (
              <div key={e.id}>
                {(edges.length > 1 || hasSiblings) && (
                  <span className="mu">
                    {j ? 'or ' : ''}rule {e.order}:{' '}
                  </span>
                )}
                {isFallback(e.raw, e.ex) ? (
                  <div className="note">
                    {hasSiblings
                      ? 'otherwise (no condition), after the earlier rules fail'
                      : 'always'}
                  </div>
                ) : (
                  <div className="cond">
                    <ExprView raw={e.raw} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      })}
      <div className="note" style={{ marginTop: 6 }}>
        Rules above a matching one in the same state must be false (first match wins).
      </div>
    </div>
  )
}

export function PathsTab() {
  const G = useStore((s) => s.G)
  const pf = useStore((s) => s.pf)
  const setPf = useStore((s) => s.setPf)
  const result = usePathResult()
  if (!result) return null
  const { from, to, paths, adj, capped } = result

  return (
    <>
      <div className="pf-sel">
        <span className="mu">From</span>
        <StatePicker value={from} onChange={(v) => setPf({ from: v, pick: null })} />
        <span className="mu">To</span>
        <StatePicker value={to} onChange={(v) => setPf({ to: v, pick: null })} />
      </div>

      {from === to && <div className="note">Pick two different states.</div>}
      {from !== to && !paths.length && (
        <div className="note">
          No route from {from} to {to}. Following transitions only, you can never get there.
        </div>
      )}
      {paths.length > 0 && (
        <div className="note">
          {paths.length}
          {capped ? '+' : ''} route{paths.length === 1 ? '' : 's'} found
          {capped ? ' (stopped early, there are more)' : ''}. All are highlighted. Click one to
          isolate it and see the conditions it needs.
        </div>
      )}

      {paths.map((route, i) => {
        const open = pf.pick === i
        return (
          <div
            key={i}
            className={'path' + (open ? ' on' : '')}
            onClick={() => setPf({ pick: open ? null : i })}
          >
            <div className="mu" style={{ fontSize: 11 }}>
              Route {i + 1} · {route.length - 1} step{route.length === 2 ? '' : 's'}
            </div>
            <div className="chain">
              {route.map((id, k) => (
                <span key={k}>
                  {k > 0 && <span className="arrow"> → </span>}
                  <span style={{ fontWeight: 600 }}>{id}</span>
                </span>
              ))}
            </div>
            {open && <RouteConditions G={G} route={route} adj={adj} />}
          </div>
        )
      })}
    </>
  )
}
