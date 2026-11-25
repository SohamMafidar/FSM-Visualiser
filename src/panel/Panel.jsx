// The right-hand side panel. Each tab lives in its own file in this folder.
import { useStore } from '../store'
import { DetailsTab } from './DetailsTab'
import { PathsTab } from './PathsTab'
import { IssuesTab } from './IssuesTab'
import { TraceTab } from './TraceTab'

const TABS = [
  ['details', 'Details'],
  ['paths', 'Paths'],
  ['issues', 'Issues'],
  ['trace', 'Trace'],
]

export function Panel() {
  const tab = useStore((s) => s.tab)
  const G = useStore((s) => s.G)
  const setTab = useStore((s) => s.setTab)

  return (
    <aside id="panel">
      <nav id="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>
      <div id="panelBody">
        {!G ? (
          <div className="note">Load an FSM to begin.</div>
        ) : tab === 'details' ? (
          <DetailsTab />
        ) : tab === 'paths' ? (
          <PathsTab />
        ) : tab === 'issues' ? (
          <IssuesTab />
        ) : (
          <TraceTab />
        )}
      </div>
    </aside>
  )
}
