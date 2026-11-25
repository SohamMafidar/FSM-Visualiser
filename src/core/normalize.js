import { compileExpression } from './expressions'
export function pick(o, keys) {
  if (!o || typeof o !== 'object') return undefined
  for (var i = 0; i < keys.length; i++)
    if (Object.prototype.hasOwnProperty.call(o, keys[i])) return o[keys[i]]
  return undefined
}
export function isExprObj(v) {
  return (
    v &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    Object.prototype.hasOwnProperty.call(v, '__expr')
  )
}
export function toText(v) {
  if (v == null) return null
  if (isExprObj(v)) return v.__expr
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return '[' + v.map(toText).join(', ') + ']'
  return (
    '{' +
    Object.keys(v)
      .map(function (k) {
        return k + ': ' + toText(v[k])
      })
      .join(', ') +
    '}'
  )
}
export function flattenData(d, prefix, out) {
  out = out || []
  if (d == null) return out
  if (Array.isArray(d)) {
    d.forEach(function (x, i) {
      if (typeof x === 'string') out.push({ key: x, raw: '' })
      else if (x && typeof x === 'object' && !isExprObj(x)) {
        var k = pick(x, ['key', 'name', 'id']),
          v = pick(x, ['value', 'expr', 'expression', 'val'])
        if (k !== undefined) out.push({ key: (prefix || '') + toText(k), raw: toText(v) || '' })
        else flattenData(x, prefix, out)
      }
    })
    return out
  }
  if (typeof d === 'object' && !isExprObj(d)) {
    Object.keys(d).forEach(function (k) {
      var v = d[k]
      if (v && typeof v === 'object' && !Array.isArray(v) && !isExprObj(v))
        flattenData(v, (prefix || '') + k + '.', out)
      else out.push({ key: (prefix || '') + k, raw: toText(v) == null ? 'null' : toText(v) })
    })
    return out
  }
  out.push({ key: prefix ? prefix.replace(/\.$/, '') : 'value', raw: toText(d) })
  return out
}
export var TK = ['target', 'to', 'next', 'goto', 'nextState', 'id', 'state', 'name']
export var CK = ['condition', 'when', 'if', 'cond', 'expr', 'expression', 'rule', 'guard']
export function normTransitions(t) {
  var out = []
  function push(target, cond) {
    out.push({
      target: String(toText(target) == null ? '' : toText(target)).trim(),
      raw: cond == null ? null : toText(cond),
    })
  }
  function obj(o) {
    var tk = null,
      ck = null,
      i
    for (i = 0; i < TK.length; i++)
      if (Object.prototype.hasOwnProperty.call(o, TK[i])) {
        tk = TK[i]
        break
      }
    for (i = 0; i < CK.length; i++)
      if (Object.prototype.hasOwnProperty.call(o, CK[i])) {
        ck = CK[i]
        break
      }
    var keys = Object.keys(o)
    if (
      tk &&
      (ck ||
        keys.length === 1 ||
        keys.every(function (k) {
          return k === tk || CK.indexOf(k) >= 0 || k === 'label' || k === 'description'
        }))
    )
      push(o[tk], ck ? o[ck] : null)
    else
      keys.forEach(function (k) {
        push(k, o[k])
      })
  }
  if (t == null) return out
  if (Array.isArray(t))
    t.forEach(function (x) {
      if (typeof x === 'string') push(x, null)
      else if (isExprObj(x)) push(x.__expr, null)
      else if (x && typeof x === 'object') obj(x)
    })
  else if (isExprObj(t)) push(t.__expr, null)
  else if (typeof t === 'object') obj(t)
  else if (typeof t === 'string') push(t, null)
  return out
}
export function statesFromMap(m) {
  return Object.keys(m).map(function (k) {
    var v = m[k]
    return Object.assign({ id: k }, v && typeof v === 'object' ? v : {})
  })
}
export function normalizeDocument(root) {
  var hint = null,
    list = null
  if (Array.isArray(root)) list = root
  else if (root && typeof root === 'object' && !isExprObj(root)) {
    if (root.fsm && typeof root.fsm === 'object' && !Array.isArray(root.fsm) && !('states' in root))
      return normalizeDocument(root.fsm)
    hint = toText(pick(root, ['start', 'initial', 'initialState', 'startState', 'entry']))
    var s = pick(root, ['states', 'nodes'])
    if (Array.isArray(s)) list = s
    else if (s && typeof s === 'object' && !isExprObj(s)) list = statesFromMap(s)
    else {
      var vals = Object.keys(root).map(function (k) {
        return root[k]
      })
      if (
        vals.length &&
        vals.every(function (v) {
          return v && typeof v === 'object' && !Array.isArray(v) && !isExprObj(v)
        })
      )
        list = statesFromMap(root)
    }
  }
  if (!list)
    throw new Error(
      'I could not find a list of states in this file. Expected an array of states, or an object with a "states" key, or an object keyed by state id.',
    )
  var states = list.map(function (r, idx) {
    r = r && typeof r === 'object' ? r : {}
    var id = toText(pick(r, ['id', 'name', 'stateId']))
    var type = toText(pick(r, ['type', 'kind'])) || 'unknown'
    var data = flattenData(pick(r, ['data', 'input', 'inputs', 'inputData', 'params'])).map(
      function (d) {
        return { key: d.key, raw: d.raw, ex: compileExpression(d.raw) }
      },
    )
    var trans = normTransitions(pick(r, ['transitions', 'next', 'edges'])).map(function (t, k) {
      t.order = k + 1
      t.ex = t.raw == null ? null : compileExpression(t.raw)
      return t
    })
    return {
      id: id == null || id === '' ? '(state ' + (idx + 1) + ' has no id)' : id,
      missingId: id == null || id === '',
      type: String(type).trim(),
      data: data,
      transitions: trans,
      issues: [],
    }
  })
  return { states: states, startHint: hint }
}
