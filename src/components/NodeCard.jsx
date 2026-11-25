// One state drawn as a card: type, id, "Input data" button and transition count.
import { memo } from 'react'
import { useStore } from '../store'
import { colorForType } from '../core/colors'
import { isEndType } from '../core/graph'

// memo: a card only re-renders when its own props change (important with many states).
export const NodeCard = memo(function NodeCard({ st, x, y, flags, issues }) {
  const ring = isEndType(st.type) // end states are drawn as a hollow ring
  const worst = issues.some((i) => i.sev === 'error') ? 'error' : issues.length ? 'warn' : null

  const classes = [
    'node',
    ring && 'ring',
    flags.dim && 'dim',
    flags.sel && 'sel',
    flags.hl && 'hl',
    flags.tr && 'tr',
    flags.match && 'match',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      style={{ left: x, top: y, '--c': ring ? '#E6E8F0' : colorForType(st.type) }}
      onClick={(e) => {
        e.stopPropagation()
        useStore.getState().select(st.id)
      }}
    >
      <div className="ntop">
        <span className="dot" />
        <span>{st.type}</span>
        <span className="nbadges">
          {flags.steps && (
            <span className="nb step" title="Position(s) in this call">
              {flags.steps.join(',')}
            </span>
          )}
          {worst && (
            <span
              className={'nb ' + (worst === 'error' ? 'err' : 'warn')}
              title={issues.map((i) => i.msg).join('\n')}
            >
              {worst === 'error' ? '✖ ' : '⚠ '}
              {issues.length}
            </span>
          )}
        </span>
      </div>

      <div className="nid" title={st.id}>
        {st.id}
      </div>

      <div className="nrow">
        <button
          className="nbtn"
          disabled={!st.data.length}
          onClick={(e) => {
            e.stopPropagation()
            useStore.getState().openData(st.id)
          }}
        >
          {st.data.length ? 'Input data · ' + st.data.length : 'No input data'}
        </button>
        <span className="ntr" title="Outgoing transitions">
          → {st.transitions.length}
        </span>
      </div>
    </div>
  )
})
