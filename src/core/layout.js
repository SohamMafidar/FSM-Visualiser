export var W = 250,
  H = 100,
  GAP_LAYER_LR = 150,
  GAP_NODE = 36,
  GAP_LAYER_TB = 92
export function layout(G, startId, dir) {
  var ids = G.states.map(function (s) {
    return s.id
  })
  var out = new Map()
  ids.forEach(function (id) {
    out.set(id, [])
  })
  G.edges.forEach(function (e) {
    if (e.dangling || e.from === e.to) return
    var a = out.get(e.from)
    if (a.indexOf(e.to) < 0) a.push(e.to)
  })
  var color = new Map(),
    back = new Set(),
    order = [],
    post = []
  function dfs(u) {
    color.set(u, 1)
    order.push(u)
    out.get(u).forEach(function (v) {
      var c = color.get(v)
      if (c === 1) back.add(u + '>' + v)
      else if (!c) dfs(v)
    })
    color.set(u, 2)
    post.push(u)
  }
  ;[startId].concat(ids).forEach(function (r) {
    if (r && out.has(r) && !color.has(r)) dfs(r)
  })
  var layer = new Map()
  ids.forEach(function (id) {
    layer.set(id, 0)
  })
  post
    .slice()
    .reverse()
    .forEach(function (u) {
      out.get(u).forEach(function (v) {
        if (back.has(u + '>' + v)) return
        layer.set(v, Math.max(layer.get(v), layer.get(u) + 1))
      })
    })
  var layers = []
  ids.forEach(function (id) {
    var l = layer.get(id)
    ;(layers[l] = layers[l] || []).push(id)
  })
  var disc = new Map()
  order.forEach(function (id, i) {
    disc.set(id, i)
  })
  layers.forEach(function (l) {
    l.sort(function (a, b) {
      return disc.get(a) - disc.get(b)
    })
  })
  var preds = new Map(),
    succs = new Map()
  ids.forEach(function (id) {
    preds.set(id, [])
    succs.set(id, [])
  })
  out.forEach(function (vs, u) {
    vs.forEach(function (v) {
      if (back.has(u + '>' + v)) return
      preds.get(v).push(u)
      succs.get(u).push(v)
    })
  })
  var pos = new Map()
  function reindex() {
    layers.forEach(function (l) {
      l.forEach(function (id, i) {
        pos.set(id, i - (l.length - 1) / 2)
      })
    })
  }
  reindex()
  function sweep(l, nb) {
    var b = new Map()
    l.forEach(function (id) {
      var ns = nb.get(id)
      b.set(
        id,
        ns.length
          ? ns.reduce(function (s, x) {
              return s + pos.get(x)
            }, 0) / ns.length
          : pos.get(id),
      )
    })
    l.sort(function (a, c) {
      return b.get(a) - b.get(c) || disc.get(a) - disc.get(c)
    })
    l.forEach(function (id, i) {
      pos.set(id, i - (l.length - 1) / 2)
    })
  }
  for (var it = 0; it < 4; it++) {
    for (var L = 1; L < layers.length; L++) sweep(layers[L], preds)
    for (var L2 = layers.length - 2; L2 >= 0; L2--) sweep(layers[L2], succs)
  }
  var p = new Map(),
    minX = 1e9,
    minY = 1e9,
    maxX = -1e9,
    maxY = -1e9
  var maxCount = layers.reduce(function (m, l) {
    return Math.max(m, l.length)
  }, 1)
  layers.forEach(function (l, li) {
    l.forEach(function (id, i) {
      var x, y
      if (dir === 'LR') {
        var colH = l.length * H + (l.length - 1) * GAP_NODE,
          maxH = maxCount * H + (maxCount - 1) * GAP_NODE
        x = li * (W + GAP_LAYER_LR)
        y = (maxH - colH) / 2 + i * (H + GAP_NODE)
      } else {
        var rowW = l.length * W + (l.length - 1) * 40,
          maxW = maxCount * W + (maxCount - 1) * 40
        x = (maxW - rowW) / 2 + i * (W + 40)
        y = li * (H + GAP_LAYER_TB)
      }
      p.set(id, { x: x, y: y })
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + W)
      maxY = Math.max(maxY, y + H)
    })
  })
  if (!ids.length) {
    minX = minY = 0
    maxX = maxY = 100
  }
  return {
    p: p,
    back: back,
    layer: layer,
    bounds: { x0: minX - 90, y0: minY - 90, x1: maxX + 90, y1: maxY + 170 },
  }
}
export function pointOnCurve(p0, p1, p2, p3, t) {
  var u = 1 - t
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  }
}
export function assignPorts(G, L, dir) {
  var cross = function (id) {
    var q = L.p.get(id)
    return dir === 'LR' ? q.y : q.x
  }
  var bi = 0,
    pair = {}
  G.edges.forEach(function (e) {
    e.self = e.from === e.to
    e.back = !e.dangling && !e.self && L.back.has(e.from + '>' + e.to)
    var k = e.from + '>' + e.to
    var n = pair[k] || 0
    e.pidx = n
    pair[k] = n + 1
    e.bi = e.back ? bi++ : 0
    e.po = 0
    e.pi = 0
    e.lo = 0
  })
  G.states.forEach(function (st) {
    var outs = G.out.get(st.id).filter(function (e) {
      return !e.self && !e.back
    })
    outs.sort(function (a, b) {
      return (a.dangling ? 1e9 : cross(a.to)) - (b.dangling ? 1e9 : cross(b.to))
    })
    outs.forEach(function (e, i) {
      e.po = (i - (outs.length - 1) / 2) * 7
      if (dir === 'TB' && !e.dangling) e.lo = (i - (outs.length - 1) / 2) * 17
    })
    var ins = G.inn.get(st.id).filter(function (e) {
      return !e.self && !e.back
    })
    ins.sort(function (a, b) {
      return cross(a.from) - cross(b.from)
    })
    ins.forEach(function (e, i) {
      e.pi = (i - (ins.length - 1) / 2) * 7
    })
  })
}
export function route(L, e, dir) {
  var a = L.p.get(e.from),
    b = e.dangling ? null : L.p.get(e.to),
    LR = dir === 'LR'
  var d, mid
  if (e.dangling) {
    var s1 = LR ? { x: a.x + W, y: a.y + H / 2 + e.po } : { x: a.x + W / 2 + e.po, y: a.y + H }
    var s2 = LR ? { x: s1.x + 90, y: s1.y } : { x: s1.x, y: s1.y + 80 }
    return {
      d: 'M' + s1.x + ',' + s1.y + ' L' + s2.x + ',' + s2.y,
      lx: (s1.x + s2.x) / 2,
      ly: (s1.y + s2.y) / 2 + (LR ? -8 : 0),
    }
  }
  if (e.self) {
    var q1 = LR ? { x: a.x + W * 0.7, y: a.y } : { x: a.x + W, y: a.y + H * 0.3 }
    var q2 = LR ? { x: a.x + W * 0.3, y: a.y } : { x: a.x + W, y: a.y + H * 0.7 }
    var c1 = LR ? { x: q1.x, y: q1.y - 60 } : { x: q1.x + 70, y: q1.y }
    var c2 = LR ? { x: q2.x, y: q2.y - 60 } : { x: q2.x + 70, y: q2.y }
    mid = pointOnCurve(q1, c1, c2, q2, 0.5)
    return {
      d:
        'M' +
        q1.x +
        ',' +
        q1.y +
        ' C' +
        c1.x +
        ',' +
        c1.y +
        ' ' +
        c2.x +
        ',' +
        c2.y +
        ' ' +
        q2.x +
        ',' +
        q2.y,
      lx: mid.x,
      ly: mid.y - (LR ? 6 : 0),
    }
  }
  var p1, p2, c1b, c2b
  if (e.back) {
    var dist = LR ? Math.abs(a.x - b.x) : Math.abs(a.y - b.y)
    var dd = 55 + Math.min(150, dist * 0.1) + e.bi * 14
    if (LR) {
      p1 = { x: a.x + W / 2 + e.po * 0.6, y: a.y + H }
      p2 = { x: b.x + W / 2 + e.pi * 0.6, y: b.y + H }
      c1b = { x: p1.x, y: p1.y + dd }
      c2b = { x: p2.x, y: p2.y + dd }
    } else {
      p1 = { x: a.x + W, y: a.y + H / 2 + e.po * 0.6 }
      p2 = { x: b.x + W, y: b.y + H / 2 + e.pi * 0.6 }
      c1b = { x: p1.x + dd, y: p1.y }
      c2b = { x: p2.x + dd, y: p2.y }
    }
  } else if (LR) {
    p1 = { x: a.x + W, y: a.y + H / 2 + e.po }
    p2 = { x: b.x, y: b.y + H / 2 + e.pi }
    var dx = Math.max(50, (p2.x - p1.x) * 0.5)
    c1b = { x: p1.x + dx, y: p1.y }
    c2b = { x: p2.x - dx, y: p2.y }
  } else {
    p1 = { x: a.x + W / 2 + e.po, y: a.y + H }
    p2 = { x: b.x + W / 2 + e.pi, y: b.y }
    var dy = Math.max(40, (p2.y - p1.y) * 0.5)
    c1b = { x: p1.x, y: p1.y + dy }
    c2b = { x: p2.x, y: p2.y - dy }
  }
  d =
    'M' +
    p1.x +
    ',' +
    p1.y +
    ' C' +
    c1b.x +
    ',' +
    c1b.y +
    ' ' +
    c2b.x +
    ',' +
    c2b.y +
    ' ' +
    p2.x +
    ',' +
    p2.y
  mid = pointOnCurve(p1, c1b, c2b, p2, 0.5)
  return { d: d, lx: mid.x, ly: mid.y + e.pidx * 15 + (e.back ? 0 : e.lo) }
}
/** Layout + edge geometry. Pure function of the graph, start state and direction. */
export function computeLayout(G, start, dir) {
  var L = layout(G, start, dir)
  assignPorts(G, L, dir)
  var routes = new Map()
  G.edges.forEach(function (e) {
    routes.set(e.id, route(L, e, dir))
  })
  return { L: L, routes: routes }
}
