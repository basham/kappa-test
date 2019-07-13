// https://github.com/kappa-db/multifeed-index/blob/master/lib/state.js
export function deserializeState (buf) {
  var state = { keys: {} }
  var len = buf.readUInt32LE(0)
  for (var i = 0; i < len; i++) {
    var pos = 4 + i * 40
    var key = buf.slice(pos, pos + 32)
    var min = buf.readUInt32LE(pos + 32)
    var max = buf.readUInt32LE(pos + 36)
    state.keys[key.toString('hex')] = {
      key: key,
      min: min,
      max: max
    }
  }

  // Read 'version', if there are any unread bytes left.
  if (4 + len * 40 + 4 <= buf.length) {
    var version = buf.readUInt32LE(4 + len * 40)
    state.version = version
  } else {
    state.version = 1
  }

  return state
}

export const moduleTest = 'woot'
