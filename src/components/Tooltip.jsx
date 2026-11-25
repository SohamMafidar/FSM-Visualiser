import { useStore } from '../store'
import { isFallback } from '../core/expressions'
import { ExprView } from './ExprView'
/** Hover card for an edge: full, untruncated condition. */
export function Tooltip() {
  const tip = useStore((s) => s.tip),
    G = useStore((s) => s.G)
  if (!tip || !G) return null
  const e = G.edges.find((x) => x.id === tip.id)
  if (!e) return null
  const W = 520
  const x = tip.x + 14 + W > window.innerWidth - 8 ? Math.max(4, tip.x - W - 14) : tip.x + 14
  const y = tip.y + 14 + 90 > window.innerHeight - 8 ? Math.max(4, tip.y - 104) : tip.y + 14
  return (
    <div id="tip" style={{ display: 'block', left: x, top: y }}>
      <div className="tt">
        {e.from} → {e.to}
        {G.out.get(e.from).length > 1 && <span className="mu"> · rule {e.order}</span>}
      </div>
      <div className="cond">
        {isFallback(e.raw, e.ex) ? (
          <span className="note">no condition (always true, or "else")</span>
        ) : (
          <ExprView raw={e.raw} />
        )}
      </div>
      {e.ex && e.ex.err && <div className="derr">⚠ {e.ex.err}</div>}
    </div>
  )
}
