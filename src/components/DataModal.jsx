import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { DATA_ROOTS } from '../core/expressions'
import { Modal } from './Modal'
import { ExprView } from './ExprView'
/** The "Input data" popup: every key a state needs, with where each value comes from. */
export function DataModal({ id }) {
  const st = useStore((s) => s.G?.byId.get(id))
  const [active, setActive] = useState(null)
  const [filter, setFilter] = useState('')
  const { rows, counts, order } = useMemo(() => {
    const counts = {},
      order = []
    const rows = (st ? st.data : []).map((d) => {
      const tags = []
      d.ex.reads.forEach((r) => {
        const x = r.split('.')[0]
        const t = DATA_ROOTS[x] ? x : 'other'
        if (tags.indexOf(t) < 0) tags.push(t)
      })
      if (!tags.length) tags.push('constant')
      tags.forEach((t) => {
        if (!counts[t]) {
          counts[t] = 0
          order.push(t)
        }
        counts[t]++
      })
      return { d, tags }
    })
    return { rows, counts, order }
  }, [st])
  if (!st) return null
  const f = filter.toLowerCase()
  const shown = rows.filter(
    (r) =>
      (!active || r.tags.includes(active)) &&
      (!f || (r.d.key + ' ' + r.d.raw).toLowerCase().includes(f)),
  )
  return (
    <Modal title={`${st.id}  ·  input data (${st.data.length})`}>
      <div
        className="row"
        style={{ marginTop: 0, alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div className="chips">
          {order.map((t) => (
            <button
              key={t}
              className={`chip t-${t}` + (active === t ? ' on' : '')}
              onClick={() => setActive(active === t ? null : t)}
            >
              {t} · {counts[t]}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="dfilter"
          placeholder="Filter inputs…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="note">
        Where each value comes from: platform (call info), configuration (client settings), bots
        (set by earlier bots), constant (typed in the FSM).
      </div>
      <div>
        {shown.map(({ d, tags }) => {
          const plain = d.ex.reads.length === 1 && d.raw.trim() === d.ex.reads[0]
          return (
            <div className="drow" key={d.key}>
              <div className="dkey">{d.key}</div>
              <div>
                <div className="dexpr">
                  {d.raw ? <ExprView raw={d.raw} /> : <span className="mu">(no expression)</span>}
                </div>
                {d.ex.err && (
                  <div className="derr">⚠ Could not read this expression: {d.ex.err}</div>
                )}
                {d.ex.reads.length > 0 && !plain && (
                  <div className="dreads">reads: {d.ex.reads.join('  ·  ')}</div>
                )}
              </div>
              <div>
                {tags.map((t) => (
                  <span key={t} className={`tag t-${t}`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
        {!shown.length && <div className="mu pad">Nothing matches.</div>}
      </div>
    </Modal>
  )
}
