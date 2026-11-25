// Node colour by state `type`. Types we have not seen get a stable colour from the fallback list,
// so a new type added to the FSM never breaks anything.
export var TYPE_COLORS = {
  bot: '#8B7CFF',
  generic: '#F5B94A',
  message: '#7C93C8',
  transfer: '#4ADE80',
  end: '#E6E8F0',
  start: '#3DDBD9',
}
export var FALLBACK_COLORS = ['#3DDBD9', '#FF9F5A', '#C792EA', '#5AB0FF', '#E5C07B', '#7EE0A8']
export function colorForType(t) {
  var k = (t || '').toLowerCase()
  if (TYPE_COLORS[k]) return TYPE_COLORS[k]
  var x = 0
  for (var i = 0; i < k.length; i++) x = (x * 31 + k.charCodeAt(i)) >>> 0
  return FALLBACK_COLORS[x % FALLBACK_COLORS.length]
}
