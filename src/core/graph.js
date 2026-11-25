// Turns the normalised document into a graph: states, edges, and quick lookups.
//   G.byId   id -> state            G.out  id -> edges leaving it
//   G.inn    id -> edges entering   G.start  the state the journey begins at
// A transition may point to a state defined LATER in the file, so every state is read first
// and targets are resolved afterwards. A target that exists nowhere is marked `dangling`.
export var END_RE = /^(end|exit|hangup|hang_up|disconnect|terminate)$/i
export var TERM_RE =
  /^(end|exit|hangup|hang_up|disconnect|terminate|transfer|queue|agent|handoff)$/i
export function isEndType(t) {
  return END_RE.test(t)
}
export function isTermType(t) {
  return TERM_RE.test(t)
}
export function buildGraph(doc) {
  var states = [],
    byId = new Map(),
    dups = []
  doc.states.forEach(function (st) {
    if (byId.has(st.id)) {
      dups.push(st.id)
      return
    }
    byId.set(st.id, st)
    states.push(st)
  })
  var edges = [],
    out = new Map(),
    inn = new Map()
  states.forEach(function (st) {
    out.set(st.id, [])
    inn.set(st.id, [])
  })
  states.forEach(function (st) {
    st.transitions.forEach(function (t) {
      var e = {
        id: 'e' + edges.length,
        from: st.id,
        to: t.target,
        order: t.order,
        raw: t.raw,
        ex: t.ex,
        t: t,
        dangling: !byId.has(t.target),
      }
      edges.push(e)
      out.get(st.id).push(e)
      if (!e.dangling) inn.get(t.target).push(e)
    })
  })
  var start = null
  if (doc.startHint && byId.has(doc.startHint)) start = doc.startHint
  else {
    var cand = states.filter(function (s) {
      return (
        /^(start|begin|entry|initial)$/i.test(s.type) || /^(start|begin|entry|initial)$/i.test(s.id)
      )
    })[0]
    start = cand ? cand.id : states[0] ? states[0].id : null
  }
  return { states: states, byId: byId, edges: edges, out: out, inn: inn, dups: dups, start: start }
}
