// Relaxed parser: strict JSON, or JS-like literal (unquoted keys, bare expressions, comments).
export function parseRelaxed(src) {
  var i = 0,
    n = src.length
  function fail(msg, pos) {
    if (pos == null) pos = i
    var line = 1,
      col = 1
    for (var k = 0; k < pos && k < n; k++) {
      if (src[k] === '\n') {
        line++
        col = 1
      } else col++
    }
    throw new Error(msg + ' (line ' + line + ', column ' + col + ')')
  }
  function ws() {
    for (;;) {
      while (i < n && /\s/.test(src[i])) i++
      if (src[i] === '/' && src[i + 1] === '/') {
        while (i < n && src[i] !== '\n') i++
        continue
      }
      if (src[i] === '/' && src[i + 1] === '*') {
        var e = src.indexOf('*/', i + 2)
        i = e < 0 ? n : e + 2
        continue
      }
      break
    }
  }
  function readString() {
    var q = src[i],
      j = i + 1,
      out = ''
    while (j < n && src[j] !== q) {
      if (src[j] === '\\' && j + 1 < n) {
        var c = src[j + 1]
        if (c === 'u' && /^[0-9a-fA-F]{4}$/.test(src.substr(j + 2, 4))) {
          out += String.fromCharCode(parseInt(src.substr(j + 2, 4), 16))
          j += 6
          continue
        }
        out += c === 'n' ? '\n' : c === 't' ? '\t' : c
        j += 2
      } else {
        out += src[j]
        j++
      }
    }
    if (j >= n) fail('Unterminated string', i)
    i = j + 1
    return out
  }
  function isDelim(c) {
    return c === undefined || c === ',' || c === '}' || c === ']'
  }
  function readBare() {
    var start = i,
      depth = 0
    while (i < n) {
      var c = src[i]
      if (c === '"' || c === "'" || c === '`') {
        var q = c
        i++
        while (i < n && src[i] !== q) {
          if (src[i] === '\\') i++
          i++
        }
        i++
        continue
      }
      if (c === '(' || c === '[' || c === '{') depth++
      else if (c === ')' || c === ']' || c === '}') {
        if (depth === 0) break
        depth--
      } else if (c === ',' && depth === 0) break
      i++
    }
    var t = src.slice(start, i).trim()
    if (!t) fail('Expected a value', start)
    return t
  }
  function value() {
    ws()
    var c = src[i]
    if (c === '{') return object()
    if (c === '[') return array()
    if (c === '"' || c === "'") {
      var s0 = i,
        str = readString()
      ws()
      if (isDelim(src[i])) return str
      i = s0
    }
    var t = readBare()
    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t)) return Number(t)
    if (t === 'true') return true
    if (t === 'false') return false
    if (t === 'null') return null
    return { __expr: t }
  }
  function key() {
    ws()
    var c = src[i]
    if (c === '"' || c === "'") return readString()
    var m = /^[A-Za-z0-9_$.\-]+/.exec(src.slice(i, i + 300))
    if (!m) fail('Expected a name')
    i += m[0].length
    return m[0]
  }
  function object() {
    i++
    var obj = {},
      items = []
    for (;;) {
      ws()
      if (i >= n) fail('The { opened here was never closed')
      if (src[i] === '}') {
        i++
        break
      }
      if (src[i] === ',') {
        i++
        continue
      }
      if (src[i] === '{' || src[i] === '[') {
        items.push(value())
        continue
      }
      var k = key()
      ws()
      if (src[i] !== ':') fail('Expected ":" after "' + k + '"')
      i++
      obj[k] = value()
    }
    return items.length ? items : obj
  }
  function array() {
    i++
    var arr = []
    for (;;) {
      ws()
      if (i >= n) fail('The [ opened here was never closed')
      if (src[i] === ']') {
        i++
        break
      }
      if (src[i] === ',') {
        i++
        continue
      }
      var s0 = i
      if (src[i] !== '{' && src[i] !== '[') {
        var k = null
        try {
          k = key()
          ws()
        } catch (e) {
          k = null
        }
        if (k !== null && src[i] === ':') {
          i++
          var o = {}
          o[k] = value()
          arr.push(o)
          continue
        }
        i = s0
      }
      arr.push(value())
    }
    return arr
  }
  ws()
  var v = value()
  ws()
  if (i < n) fail('Unexpected text after the end of the document')
  return v
}
