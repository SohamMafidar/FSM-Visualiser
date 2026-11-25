// Condition language: tokenizer, parser, formatter. No eval, ever.
export var WORD_OPERATORS = {
  and: '&&',
  or: '||',
  not: '!',
  in: 'in',
  None: 'null',
  null: 'null',
  True: 'true',
  true: 'true',
  False: 'false',
  false: 'false',
}
export var DATA_ROOTS = { platform: 1, configuration: 1, bots: 1 }
export function tokenize(src) {
  var toks = [],
    n = src.length,
    i = 0
  while (i < n) {
    var c = src[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    var st = i
    if (c === '"' || c === "'") {
      var out = ''
      i++
      while (i < n && src[i] !== c) {
        if (src[i] === '\\' && i + 1 < n) {
          out += src[i + 1]
          i += 2
        } else out += src[i++]
      }
      if (i >= n) throw new Error('Unterminated string')
      i++
      toks.push({ t: 'str', v: out, s: st, e: i })
      continue
    }
    if (/[0-9]/.test(c)) {
      var m = /^\d+(?:\.\d+)?/.exec(src.slice(i))
      i += m[0].length
      toks.push({ t: 'num', v: parseFloat(m[0]), s: st, e: i })
      continue
    }
    if (/[A-Za-z_$]/.test(c)) {
      var m2 = /^[A-Za-z_$][\w$]*/.exec(src.slice(i))
      i += m2[0].length
      var w = m2[0]
      if (Object.prototype.hasOwnProperty.call(WORD_OPERATORS, w)) {
        var k = WORD_OPERATORS[w]
        if (k === 'null' || k === 'true' || k === 'false')
          toks.push({ t: 'lit', v: k, s: st, e: i })
        else toks.push({ t: 'op', v: k, s: st, e: i, word: true })
      } else toks.push({ t: 'id', v: w, s: st, e: i })
      continue
    }
    var three = src.substr(i, 3),
      two = src.substr(i, 2)
    if (three === '===' || three === '!==') {
      i += 3
      toks.push({ t: 'op', v: three.slice(0, 2), s: st, e: i })
      continue
    }
    if (two === '?.' && !/[0-9]/.test(src[i + 2] || '')) {
      i += 2
      toks.push({ t: 'op', v: '?.', s: st, e: i })
      continue
    }
    if (['==', '!=', '<=', '>=', '&&', '||', '??'].indexOf(two) >= 0) {
      i += 2
      toks.push({ t: 'op', v: two, s: st, e: i })
      continue
    }
    if ('<>!?:.,()[]'.indexOf(c) >= 0) {
      i += 1
      toks.push({ t: 'op', v: c, s: st, e: i })
      continue
    }
    throw new Error('Unexpected character "' + c + '" at position ' + (i + 1))
  }
  return toks
}
export function parseExpression(toks) {
  var p = 0
  function isOp(v) {
    return toks[p] && toks[p].t === 'op' && toks[p].v === v
  }
  function eat(v) {
    if (isOp(v)) {
      p++
      return true
    }
    return false
  }
  function need(v) {
    if (!eat(v))
      throw new Error(
        'Expected "' +
          v +
          '"' +
          (toks[p] ? ' but found "' + toks[p].v + '"' : ' but the expression ended'),
      )
  }
  function ternary() {
    var c = nullish()
    if (eat('?')) {
      var a = ternary()
      need(':')
      var b = ternary()
      return { t: 'cond', c: c, a: a, b: b }
    }
    return c
  }
  function nullish() {
    var l = or()
    while (isOp('??')) {
      p++
      l = { t: 'bin', op: '??', l: l, r: or() }
    }
    return l
  }
  function or() {
    var l = and()
    while (isOp('||')) {
      p++
      l = { t: 'bin', op: '||', l: l, r: and() }
    }
    return l
  }
  function and() {
    var l = eq()
    while (isOp('&&')) {
      p++
      l = { t: 'bin', op: '&&', l: l, r: eq() }
    }
    return l
  }
  function eq() {
    var l = rel()
    while (isOp('==') || isOp('!=')) {
      var op = toks[p++].v
      l = { t: 'bin', op: op, l: l, r: rel() }
    }
    return l
  }
  function rel() {
    var l = unary()
    while (isOp('<') || isOp('>') || isOp('<=') || isOp('>=') || isOp('in')) {
      var op = toks[p++].v
      l = { t: 'bin', op: op, l: l, r: unary() }
    }
    return l
  }
  function unary() {
    if (isOp('!')) {
      p++
      return { t: 'un', op: '!', a: unary() }
    }
    return postfix()
  }
  function postfix() {
    var n = primary()
    for (;;) {
      if (isOp('.') || isOp('?.')) {
        var opt = toks[p++].v === '?.'
        var t = toks[p++]
        if (!t || t.t !== 'id') throw new Error('Expected a name after "."')
        n = { t: 'mem', o: n, p: t.v, opt: opt }
      } else if (isOp('[')) {
        p++
        var ix = ternary()
        need(']')
        n = { t: 'idx', o: n, i: ix }
      } else if (isOp('(')) {
        p++
        var args = []
        if (!isOp(')')) {
          do {
            args.push(ternary())
          } while (eat(','))
        }
        need(')')
        n = { t: 'call', f: n, args: args }
      } else break
    }
    return n
  }
  function primary() {
    var t = toks[p]
    if (!t) throw new Error('The expression ended unexpectedly')
    if (t.t === 'num') {
      p++
      return { t: 'num', v: t.v }
    }
    if (t.t === 'str') {
      p++
      return { t: 'str', v: t.v }
    }
    if (t.t === 'lit') {
      p++
      return { t: 'lit', v: t.v }
    }
    if (t.t === 'id') {
      p++
      return { t: 'id', v: t.v }
    }
    if (isOp('(')) {
      p++
      var e = ternary()
      need(')')
      return { t: 'paren', e: e }
    }
    throw new Error('Unexpected "' + t.v + '"')
  }
  var ast = ternary()
  if (p < toks.length) throw new Error('Unexpected "' + toks[p].v + '"')
  return ast
}
export function pathOfNode(n) {
  if (!n) return null
  if (n.t === 'id') return [n.v]
  if (n.t === 'paren') return pathOfNode(n.e)
  if (n.t === 'mem') {
    var b = pathOfNode(n.o)
    return b && b.concat(n.p)
  }
  if (n.t === 'idx') {
    var b2 = pathOfNode(n.o)
    if (!b2) return null
    return b2.concat(n.i.t === 'str' || n.i.t === 'num' ? String(n.i.v) : '*')
  }
  if (n.t === 'call' && n.f.t === 'id' && n.f.v === 'get' && n.args.length) {
    var b3 = pathOfNode(n.args[0]) || ['?']
    return b3.concat(
      n.args.slice(1).map(function (a) {
        return a.t === 'str' || a.t === 'num' ? String(a.v) : a.t === 'id' ? a.v : '*'
      }),
    )
  }
  return null
}
export function collect(n, reads) {
  if (!n) return
  var p = pathOfNode(n)
  if (p) {
    if (p.length > 1 || DATA_ROOTS[p[0]]) reads[p.join('.')] = 1
    return
  }
  switch (n.t) {
    case 'mem':
      collect(n.o, reads)
      break
    case 'idx':
      collect(n.o, reads)
      collect(n.i, reads)
      break
    case 'call':
      n.args.forEach(function (a) {
        collect(a, reads)
      })
      if (n.f.t !== 'id') collect(n.f, reads)
      break
    case 'un':
      collect(n.a, reads)
      break
    case 'bin':
      collect(n.l, reads)
      collect(n.r, reads)
      break
    case 'cond':
      collect(n.c, reads)
      collect(n.a, reads)
      collect(n.b, reads)
      break
    case 'paren':
      collect(n.e, reads)
      break
  }
}
export var compiledCache = {}
export function compileExpression(raw) {
  var key = '$' + raw
  if (compiledCache[key]) return compiledCache[key]
  var r
  try {
    var toks = tokenize(raw)
    if (!toks.length) throw new Error('Empty expression')
    var ast = parseExpression(toks)
    var reads = {}
    collect(ast, reads)
    r = { raw: raw, ast: ast, err: null, reads: Object.keys(reads) }
  } catch (e) {
    r = { raw: raw, ast: null, err: e.message, reads: [] }
  }
  compiledCache[key] = r
  return r
}
export function formatPath(p, full) {
  return (full || p.length <= 2 ? p : p.slice(-2)).join('.')
}
export function formatExpr(n, full) {
  switch (n.t) {
    case 'num':
      return String(n.v)
    case 'str':
      return '"' + (full || n.v.length <= 12 ? n.v : n.v.slice(0, 11) + '…') + '"'
    case 'lit':
      return n.v
    case 'paren':
      return '(' + formatExpr(n.e, full) + ')'
    case 'un':
      return 'NOT ' + formatExpr(n.a, full)
    case 'bin':
      return (
        formatExpr(n.l, full) +
        (n.op === '||' ? ' OR ' : n.op === '&&' ? ' AND ' : ' ' + n.op + ' ') +
        formatExpr(n.r, full)
      )
    case 'cond':
      return formatExpr(n.c, full) + ' ? ' + formatExpr(n.a, full) + ' : ' + formatExpr(n.b, full)
    default: {
      var p = pathOfNode(n)
      if (p) return formatPath(p, full)
      if (n.t === 'call')
        return (
          formatExpr(n.f, full) +
          '(' +
          n.args
            .map(function (a) {
              return formatExpr(a, full)
            })
            .join(', ') +
          ')'
        )
      if (n.t === 'mem') return formatExpr(n.o, full) + '.' + n.p
      if (n.t === 'idx') return formatExpr(n.o, full) + '[' + formatExpr(n.i, full) + ']'
      return '?'
    }
  }
}
export function isFallback(raw, ex) {
  if (raw == null) return true
  var t = raw.trim().toLowerCase()
  if (['true', '1', 'else', 'default', 'otherwise', 'always', '*'].indexOf(t) >= 0) return true
  return !!(ex && ex.ast && ex.ast.t === 'lit' && ex.ast.v === 'true')
}
export function conditionLabel(t) {
  if (isFallback(t.raw, t.ex)) return 'else'
  var s = t.ex && t.ex.ast ? formatExpr(t.ex.ast, false) : t.raw.replace(/\s+/g, ' ')
  return s.length > 40 ? s.slice(0, 39) + '…' : s
}
export var ROOT_CLASS = { platform: 'x-platform', configuration: 'x-configuration', bots: 'x-bots' }
/** Split an expression into coloured segments for display (no HTML strings). */
export function highlight(raw) {
  var toks
  try {
    toks = tokenize(raw)
  } catch (e) {
    return [{ text: raw, cls: '' }]
  }
  var out = [],
    pos = 0,
    chain = null,
    prev = null
  toks.forEach(function (t) {
    if (t.s > pos) out.push({ text: raw.slice(pos, t.s), cls: '' })
    var cls = ''
    if (t.t === 'str') cls = 'x-s'
    else if (t.t === 'num') cls = 'x-n'
    else if (t.t === 'lit') cls = 'x-k'
    else if (t.t === 'id') {
      if (prev && prev.t === 'op' && (prev.v === '.' || prev.v === '?.')) cls = chain || 'x-id'
      else {
        cls = ROOT_CLASS[t.v] || 'x-id'
        chain = cls
        if (t.v === 'get') cls = 'x-fn'
      }
    } else if (t.t === 'op') {
      if (t.v === '.' || t.v === '?.') cls = chain || 'x-p'
      else {
        chain = null
        cls = t.word || /^(&&|\|\||\?\?|\?|:|==|!=|!)$/.test(t.v) ? 'x-o' : 'x-p'
      }
    }
    out.push({ text: raw.slice(t.s, t.e), cls: cls })
    pos = t.e
    prev = t
  })
  if (pos < raw.length) out.push({ text: raw.slice(pos), cls: '' })
  return out
}
