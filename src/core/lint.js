// The linter: finds mistakes in the FSM without running it.
// runLint() returns a list of { sev: 'error' | 'warn', state, msg, code } and also
// attaches each state's own problems to `state.issues` (the node cards show those badges).
import { isFallback } from './expressions'
import { isTermType } from './graph'

// findLoops = "strongly connected components": groups of states that can all reach each other.
// A group like that with no way out is a loop a call can never leave.
export function findLoops(G) {
  var idx = new Map(),
    low = new Map(),
    on = new Set(),
    stack = [],
    res = [],
    i = 0
  function sc(v) {
    idx.set(v, i)
    low.set(v, i)
    i++
    stack.push(v)
    on.add(v)
    G.out.get(v).forEach(function (e) {
      if (e.dangling) return
      var w = e.to
      if (!idx.has(w)) {
        sc(w)
        low.set(v, Math.min(low.get(v), low.get(w)))
      } else if (on.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)))
    })
    if (low.get(v) === idx.get(v)) {
      var comp = [],
        w2
      do {
        w2 = stack.pop()
        on.delete(w2)
        comp.push(w2)
      } while (w2 !== v)
      res.push(comp)
    }
  }
  G.states.forEach(function (s) {
    if (!idx.has(s.id)) sc(s.id)
  })
  return res
}
export function runLint(G, startId) {
  var issues = []
  G.states.forEach(function (s) {
    s.issues = []
  })
  function add(sev, state, msg, code) {
    var it = { sev: sev, state: state, msg: msg, code: code }
    issues.push(it)
    var st = state && G.byId.get(state)
    if (st) st.issues.push(it)
  }
  G.dups.forEach(function (id) {
    add('error', id, 'Duplicate state id "' + id + '". Only the first one is drawn.', 'dup')
  })
  G.states.forEach(function (s) {
    if (s.missingId) add('error', s.id, 'A state has no id.', 'noid')
  })
  G.edges.forEach(function (e) {
    if (e.dangling)
      add(
        'error',
        e.from,
        e.to
          ? 'Transition #' +
              e.order +
              ' points to "' +
              e.to +
              '", which is not defined anywhere in the file.'
          : 'Transition #' + e.order + ' has no target.',
        'dangling',
      )
    if (e.ex && e.ex.err)
      add(
        'warn',
        e.from,
        'Could not read the condition on transition #' +
          e.order +
          ' (' +
          e.ex.err +
          '). It is shown as plain text.',
        'cond',
      )
  })
  G.states.forEach(function (s) {
    s.data.forEach(function (d) {
      if (d.ex && d.ex.err)
        add(
          'warn',
          s.id,
          'Could not read the expression for input "' + d.key + '" (' + d.ex.err + ').',
          'expr',
        )
    })
  })
  // reachability
  if (startId && G.byId.has(startId)) {
    var seen = new Set([startId]),
      q = [startId]
    while (q.length) {
      var u = q.shift()
      G.out.get(u).forEach(function (e) {
        if (!e.dangling && !seen.has(e.to)) {
          seen.add(e.to)
          q.push(e.to)
        }
      })
    }
    G.states.forEach(function (s) {
      if (!seen.has(s.id))
        add(
          'warn',
          s.id,
          'Unreachable. No path from the start state "' + startId + '" gets here.',
          'unreach',
        )
    })
  }
  G.states.forEach(function (s) {
    var term = isTermType(s.type)
    if (!s.transitions.length && !term)
      add(
        'warn',
        s.id,
        'Dead end. No transitions, and type "' + s.type + '" is not an end or transfer type.',
        'deadend',
      )
    if (s.transitions.length && !term) {
      var last = s.transitions[s.transitions.length - 1]
      if (!isFallback(last.raw, last.ex))
        add(
          'warn',
          s.id,
          'No fallback. If none of the conditions match, the call has nowhere to go. Add a last transition with no condition.',
          'nofallback',
        )
    }
  })
  findLoops(G).forEach(function (comp) {
    var set = new Set(comp)
    var selfLoop =
      comp.length === 1 &&
      G.out.get(comp[0]).some(function (e) {
        return e.to === comp[0]
      })
    if (comp.length < 2 && !selfLoop) return
    var hasExit = comp.some(function (id) {
      var st = G.byId.get(id)
      return (
        isTermType(st.type) ||
        G.out.get(id).some(function (e) {
          return !e.dangling && !set.has(e.to)
        })
      )
    })
    if (!hasExit)
      add(
        'error',
        comp[0],
        'Loop with no way out: ' + comp.join(' ↔ ') + '. A call that enters it can never leave.',
        'loop',
      )
  })
  return issues
}
