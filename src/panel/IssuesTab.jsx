// Everything the linter found. Click an item to jump to that state.
import { useStore } from '../store'

export function IssuesTab() {
  const issues = useStore((s) => s.issues)
  const G = useStore((s) => s.G)
  const select = useStore((s) => s.select)

  if (!issues.length) {
    return (
      <div className="okbox">
        ✓ No issues found. Every transition target exists, every state is reachable, and every
        non-end state has a fallback.
      </div>
    )
  }
  const errorsFirst = issues
    .slice()
    .sort((a, b) => (a.sev === 'error' ? 0 : 1) - (b.sev === 'error' ? 0 : 1))

  return (
    <>
      <div className="note">Click an item to jump to the state.</div>
      {errorsFirst.map((i, n) => (
        <div
          className="issue"
          key={n}
          onClick={() => i.state && G.byId.has(i.state) && select(i.state)}
        >
          <span className={'ic ' + i.sev}>{i.sev === 'error' ? '✖' : '⚠'}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{i.state || ''}</div>
            <div className="note" style={{ color: '#c4c9da' }}>
              {i.msg}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
