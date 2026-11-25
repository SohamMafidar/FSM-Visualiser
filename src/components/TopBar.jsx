import { useStore } from '../store'
import { useHighlight } from '../hooks'
export function TopBar() {
  const { G, start, dir, labels, lite, q, issues } = useStore()
  const set = useStore.getState
  const hi = useHighlight()
  const errs = issues.filter((i) => i.sev === 'error').length
  const warns = issues.length - errs
  return (
    <header id="top">
      <div className="brand">
        <span className="logo" />
        FSM Visualizer
      </div>
      <button className="btn primary" onClick={() => set().openLoad()}>
        Load FSM
      </button>
      <input
        id="search"
        type="search"
        placeholder="Search state, type, variable or value   ( / )"
        autoComplete="off"
        value={q}
        onChange={(e) => set().setQ(e.target.value)}
      />
      <span className="mu">
        {hi.hasQuery ? hi.matchCount + (hi.matchCount === 1 ? ' match' : ' matches') : ''}
      </span>
      <span className="sp" />
      {G && (
        <span id="issueChip">
          {issues.length ? (
            <>
              <span style={{ color: 'var(--err)' }}>✖ {errs}</span>{' '}
              <span style={{ color: 'var(--warn)' }}>⚠ {warns}</span>
            </>
          ) : (
            <span style={{ color: '#7be3a4' }}>✓ no issues</span>
          )}
        </span>
      )}
      <label className="sel">
        Start
        <select value={start || ''} onChange={(e) => set().setStart(e.target.value)} disabled={!G}>
          {G?.states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id}
            </option>
          ))}
        </select>
      </label>
      <label className="sel">
        Flow
        <select value={dir} onChange={(e) => set().setDir(e.target.value)}>
          <option value="TB">Top ↓ Down</option>
          <option value="LR">Left → Right</option>
        </select>
      </label>
      <label className="chk">
        <input
          type="checkbox"
          checked={labels}
          onChange={(e) => set().setLabels(e.target.checked)}
        />
        Labels
      </label>
      <label
        className="chk"
        title="Turns off glows, animations and the star background. Use on slow VDI."
      >
        <input type="checkbox" checked={lite} onChange={(e) => set().setLite(e.target.checked)} />
        Reduced effects
      </label>
      <button className="btn" onClick={() => set().fit()}>
        Fit
      </button>
    </header>
  )
}
