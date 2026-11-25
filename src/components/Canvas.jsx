// The big dark area: lines (SVG) underneath, state cards (HTML) on top, both inside one
// "world" element that is moved/scaled for pan and zoom.
import { useStore } from '../store'
import { useHighlight, useLayout } from '../hooks'
import { usePanZoom } from './usePanZoom'
import { NodeCard } from './NodeCard'
import { EdgeView } from './EdgeView'
import { SAMPLE } from '../core/sample'

// Arrow heads, one colour per kind of line.
const ARROWS = [
  ['def', '#4a516b'],
  ['back', '#FF6FB5'],
  ['hl', '#F2F7FF'],
  ['tr', '#D4FF3F'],
  ['err', '#FF5D6C'],
  ['inc', '#9aa3c7'],
]

export function Canvas() {
  const G = useStore((s) => s.G)
  const labels = useStore((s) => s.labels)
  const layout = useLayout()
  const highlight = useHighlight()
  const { ref, view, handlers, zoomFromCentre } = usePanZoom(layout)

  // Zoomed far out, cards switch to big ids only (see ".far" in styles.css).
  const zoomedOut = view.k < 0.62

  return (
    <div id="vp" ref={ref} {...handlers}>
      <div
        id="world"
        className={zoomedOut ? 'far' : ''}
        style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.k})` }}
      >
        {G && layout && (
          <>
            <svg id="edges" className={labels ? '' : 'nolbl'}>
              <defs>
                {ARROWS.map(([id, color]) => (
                  <marker
                    key={id}
                    id={'m-' + id}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 z" fill={color} />
                  </marker>
                ))}
              </defs>
              {G.edges.map((e) => {
                const r = layout.routes.get(e.id)
                return (
                  <EdgeView
                    key={e.id}
                    e={e}
                    d={r.d}
                    lx={r.lx}
                    ly={r.ly}
                    flags={highlight.edges.get(e.id) || ''}
                    multi={G.out.get(e.from).length > 1}
                  />
                )
              })}
            </svg>

            <div id="nodes">
              {G.states.map((st) => {
                const pos = layout.L.p.get(st.id)
                return (
                  <NodeCard
                    key={st.id}
                    st={st}
                    x={pos.x}
                    y={pos.y}
                    flags={highlight.nodes.get(st.id)}
                    issues={st.issues}
                  />
                )
              })}
            </div>
          </>
        )}
      </div>

      <div id="zoomCtl">
        <button title="Zoom in" onClick={() => zoomFromCentre(1.25)}>
          +
        </button>
        <button title="Zoom out" onClick={() => zoomFromCentre(0.8)}>
          −
        </button>
      </div>

      {!G && (
        <div id="empty">
          <h2>No FSM loaded</h2>
          <div>Load your FSM file, paste it, or try the built-in sample.</div>
          <div className="row">
            <button className="btn primary" onClick={() => useStore.getState().openLoad()}>
              Load FSM
            </button>
            <button className="btn" onClick={() => useStore.getState().load(SAMPLE)}>
              Try the sample
            </button>
          </div>
          <div className="note">Everything runs in this page. Nothing is uploaded anywhere.</div>
        </div>
      )}
    </div>
  )
}
