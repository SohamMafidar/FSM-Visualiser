// Values worked out from the store (layout, paths, trace, what to highlight).
// Each hook only recomputes when its inputs change, so e.g. selecting a state
// never triggers a re-layout.
import { useMemo } from 'react'
import { useStore } from './store'
import { isEndType } from './core/graph'
import { computeLayout } from './core/layout'
import { findPaths, pathHighlight } from './core/paths'
import { extractNames, buildTrace } from './core/trace'

/** Positions of every state and the curve of every line. */
export function useLayout() {
  const G = useStore((s) => s.G)
  const start = useStore((s) => s.start)
  const dir = useStore((s) => s.dir)
  return useMemo(() => (G ? computeLayout(G, start, dir) : null), [G, start, dir])
}

/** The call path drawn from the pasted log (or null). */
export function useTrace() {
  const G = useStore((s) => s.G)
  const raw = useStore((s) => s.traceRaw)
  const reverse = useStore((s) => s.traceReverse)
  return useMemo(() => {
    if (!G || !raw) return null
    const names = extractNames(raw).names
    if (!names.length) return null
    return buildTrace(G, reverse ? names.slice().reverse() : names)
  }, [G, raw, reverse])
}

/** Sensible From / To for the path finder when the user has not picked yet. */
export function resolvePathEnds(G, start, pf) {
  const from = pf.from && G.byId.has(pf.from) ? pf.from : start
  let to = pf.to && G.byId.has(pf.to) ? pf.to : null
  if (!to) {
    const last = G.states.filter((s) => isEndType(s.type))[0] || G.states[G.states.length - 1]
    to = last && last.id
  }
  return { from, to }
}

/** All routes From -> To. Only computed while the Paths tab is open. */
export function usePathResult() {
  const G = useStore((s) => s.G)
  const start = useStore((s) => s.start)
  const tab = useStore((s) => s.tab)
  const pf = useStore((s) => s.pf)
  return useMemo(() => {
    if (!G || tab !== 'paths') return null
    const { from, to } = resolvePathEnds(G, start, pf)
    if (!from || !to || from === to)
      return { from, to, paths: [], adj: null, capped: false, hl: null }
    const r = findPaths(G, from, to, 200)
    return {
      from,
      to,
      paths: r.paths,
      adj: r.adj,
      capped: r.capped,
      hl: pathHighlight(r.paths, r.adj, pf.pick),
    }
  }, [G, start, tab, pf])
}

function stateMatchesSearch(st, q) {
  if (st.id.toLowerCase().includes(q) || st.type.toLowerCase().includes(q)) return true
  if (st.data.some((d) => (d.key + ' ' + d.raw).toLowerCase().includes(q))) return true
  return st.transitions.some((t) => (t.target + ' ' + (t.raw || '')).toLowerCase().includes(q))
}

/**
 * Decides what is bright and what is dimmed. Priority:
 *   path finder  >  selected state  >  search  >  call trace
 * Returns per-state flags and per-line CSS classes.
 */
export function useHighlight() {
  const G = useStore((s) => s.G)
  const sel = useStore((s) => s.sel)
  const q = useStore((s) => s.q)
  const pathResult = usePathResult()
  const trace = useTrace()

  return useMemo(() => {
    const nodes = new Map()
    const edges = new Map()
    if (!G) return { nodes, edges, matchCount: 0, hasQuery: false }

    const query = q.trim().toLowerCase()
    const matches = query
      ? new Set(G.states.filter((s) => stateMatchesSearch(s, query)).map((s) => s.id))
      : null
    const pathHL = pathResult && pathResult.hl

    // Which states stay bright ("focus"), and why.
    let focus = null
    let mode = 'none'
    if (pathHL) {
      mode = 'path'
      focus = pathHL.nodes
    } else if (sel && G.byId.has(sel)) {
      mode = 'sel'
      focus = new Set([sel])
      G.out.get(sel).forEach((e) => !e.dangling && focus.add(e.to))
      G.inn.get(sel).forEach((e) => focus.add(e.from))
    } else if (matches) {
      mode = 'search'
      focus = matches
    } else if (trace) {
      mode = 'trace'
      focus = new Set(trace.seq)
    }

    G.states.forEach((st) =>
      nodes.set(st.id, {
        dim: !!focus && !focus.has(st.id),
        sel: sel === st.id,
        hl: !!pathHL && pathHL.nodes.has(st.id),
        tr: !!(trace && trace.badges[st.id]),
        match: !!(matches && matches.has(st.id)),
        steps: trace ? trace.badges[st.id] : undefined,
      }),
    )

    G.edges.forEach((e) => {
      let related = true
      if (mode === 'path') related = pathHL.edges.has(e.id)
      else if (mode === 'sel') related = e.from === sel || e.to === sel
      else if (mode === 'search') related = matches.has(e.from) && (e.dangling || matches.has(e.to))
      else if (mode === 'trace') related = trace.edges.has(e.id)

      let classes = ''
      if (focus && !related) classes += ' dim'
      if (mode === 'sel' && related) classes += ' inc'
      if (pathHL && pathHL.edges.has(e.id)) classes += ' hl'
      if (trace && trace.edges.has(e.id)) classes += ' tr'
      edges.set(e.id, classes)
    })

    return { nodes, edges, matchCount: matches ? matches.size : 0, hasQuery: !!query }
  }, [G, sel, q, pathResult, trace])
}
