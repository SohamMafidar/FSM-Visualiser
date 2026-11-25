export function findPaths(G, a, b, cap) {
  var adj = new Map()
  G.states.forEach(function (s) {
    adj.set(s.id, new Map())
  })
  G.edges.forEach(function (e) {
    if (e.dangling) return
    var m = adj.get(e.from)
    if (!m.has(e.to)) m.set(e.to, [])
    m.get(e.to).push(e)
  })
  var res = [],
    onp = new Set([a]),
    stack = [a],
    steps = 0,
    capped = false
  ;(function go(u) {
    if (res.length >= cap || steps > 300000) {
      capped = true
      return
    }
    steps++
    if (u === b) {
      res.push(stack.slice())
      return
    }
    adj.get(u).forEach(function (es, v) {
      if (onp.has(v)) return
      onp.add(v)
      stack.push(v)
      go(v)
      stack.pop()
      onp.delete(v)
    })
  })(a)
  res.sort(function (x, y) {
    return x.length - y.length
  })
  return { paths: res, adj: adj, capped: capped }
}
/** Which nodes/edges to light up for all routes (or just route `which`). */
export function pathHighlight(paths, adj, which) {
  var nodes = new Set(),
    edges = new Set()
  paths.forEach(function (p, i) {
    if (which != null && which !== i) return
    p.forEach(function (id, k) {
      nodes.add(id)
      if (k > 0)
        adj
          .get(p[k - 1])
          .get(id)
          .forEach(function (e) {
            edges.add(e.id)
          })
    })
  })
  return paths.length ? { nodes: nodes, edges: edges } : null
}
