// One transition drawn as a line with a small condition label.
// The wide invisible "hit" path makes thin lines easy to hover.
import { memo } from 'react'
import { useStore } from '../store'
import { conditionLabel } from '../core/expressions'

export const EdgeView = memo(function EdgeView({ e, d, lx, ly, flags, multi }) {
  // "2 · headIntent == claims": rule number (only if the state has several rules) + short condition
  const text = e.dangling
    ? `✖ "${e.to}" not defined`
    : (multi ? e.order + ' · ' : '') + conditionLabel(e)
  const labelWidth = Math.min(330, text.length * 6.1 + 12)
  const classes = 'edge' + (e.back ? ' back' : '') + (e.dangling ? ' dang' : '') + flags
  const showTip = (ev) => useStore.getState().setTip({ id: e.id, x: ev.clientX, y: ev.clientY })

  return (
    <g className={classes}>
      <path d={d} className="line" />
      <path
        d={d}
        className="hit"
        onMouseEnter={showTip}
        onMouseMove={showTip}
        onMouseLeave={() => useStore.getState().setTip(null)}
      />
      <g className="lbl">
        <rect x={lx - labelWidth / 2} y={ly - 9} width={labelWidth} height={18} rx={5} />
        <text x={lx} y={ly + 3.5} textAnchor="middle">
          {text}
        </text>
      </g>
    </g>
  )
})
