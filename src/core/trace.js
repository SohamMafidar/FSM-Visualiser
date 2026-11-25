export function extractNames(text) {
  var re = /\\*"(current|previous)\\*"\s*:\s*\\*"([^"\\]*)\\*"/g,
    m,
    seq = [],
    firstPrev = null,
    total = 0
  while ((m = re.exec(text))) {
    total++
    if (m[1] === 'previous') {
      if (firstPrev == null && !seq.length) firstPrev = m[2]
      continue
    }
    if (seq.length === 0 || seq[seq.length - 1] !== m[2]) seq.push(m[2])
  }
  if (firstPrev && firstPrev !== '' && (seq.length === 0 || seq[0] !== firstPrev))
    seq.unshift(firstPrev)
  return { names: seq, total: total }
}
export function buildTrace(G, names) {
  var seq = [],
    unknown = {},
    nUnknown = 0
  names.forEach(function (n) {
    if (G.byId.has(n)) {
      if (!seq.length || seq[seq.length - 1] !== n) seq.push(n)
    } else {
      unknown[n] = 1
      nUnknown++
    }
  })
  var badges = {},
    edges = new Set(),
    missing = []
  seq.forEach(function (id, i) {
    ;(badges[id] = badges[id] || []).push(i + 1)
    if (i > 0) {
      var a = seq[i - 1],
        found = G.out.get(a).filter(function (e) {
          return e.to === id
        })
      if (found.length)
        found.forEach(function (e) {
          edges.add(e.id)
        })
      else missing.push(i)
    }
  })
  return {
    seq: seq,
    badges: badges,
    edges: edges,
    missing: missing,
    unknown: Object.keys(unknown),
    nUnknown: nUnknown,
  }
}
