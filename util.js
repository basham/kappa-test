import cuid from 'cuid'

export function createRef (_ref = cuid()) {
  return { _ref }
}

export function isRef (value) {
  return value !== null && typeof value === 'object' && typeof value._ref === 'string'
}

export async function get (db, keyOrRef, defaultValue = undefined) {
  const key = isRef(keyOrRef) ? keyOrRef._ref : keyOrRef
  try {
    return await db.get(key)
  } catch (err) {
    if (err.notFound) {
      const value = typeof defaultValue === 'function'
        ? defaultValue()
        : defaultValue
      if (value !== undefined) {
        await db.put(key, value)
      }
      return value
    }
    return err
  }
}

export async function put (db, keyOrRef, value) {
  const key = isRef(keyOrRef) ? keyOrRef._ref : keyOrRef
  await db.put(key, value)
}

export async function set (db, keyOrRef, ref) {
  const key = isRef(keyOrRef) ? keyOrRef._ref : keyOrRef
  const obj = await get(db, keyOrRef, {})
  await put(db, key, { ...obj, [ref._ref]: ref })
}

export function pipe (source, ...fns) {
  return fns.reduce(async (prev, fn) => await fn(prev), source)
}

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
