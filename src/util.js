import cuid from 'cuid'
import { render } from 'lighterhtml'
import { combineLatest, isObservable } from 'rxjs'
import { map, tap } from 'rxjs/operators'

//
// Hypercore
//

export function append (feed, data) {
  return new Promise((resolve, reject) => {
    feed.append(data, (err, seq) => {
      if (err) {
        reject(err)
      } else {
        resolve(seq)
      }
    })
  })
}

//
// Kappa
//

export function readListView (view, options = {}) {
  return new Promise((resolve, reject) => {
    view.read(options, (err, msgs) => {
      if (err) {
        reject(err)
      } else {
        resolve(msgs)
      }
    })
  })
}

//
// Database
//

/*
Gun.chain.$ = function rxjs () {
  const stream = new ReplaySubject(1)
  this.on((value) => stream.next(value))
  return stream
}
*/

export function createRef (_ref = cuid()) {
  return { _ref }
}

export function isRef (value) {
  return value !== null && typeof value === 'object' && typeof value._ref === 'string'
}

export function getRefId (keyOrRef) {
  return isRef(keyOrRef) ? keyOrRef._ref : keyOrRef
}

export async function get (db, keyOrRef, defaultValue = undefined) {
  const key = getRefId(keyOrRef)
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
  const key = getRefId(keyOrRef)
  await db.put(key, value)
}

export async function set (db, keyOrRef, ref) {
  const key = getRefId(keyOrRef)
  const id = getRefId(ref)
  const obj = await get(db, keyOrRef, {})
  await put(db, key, { ...obj, [id]: ref })
}

//
// UI
//

export const combineLatestProps = (source) => {
  const streams = Object.keys(source)
    .filter((key) => isObservable(source[key]))
    .map((key) =>
      source[key].pipe(
        map((value) => ({ [key]: value }))
      )
    )
  const data = Object.keys(source)
    .filter((key) => !isObservable(source[key]))
    .map((key) => ({ [key]: source[key] }))
    .reduce((prev, curr) => ({ ...prev, ...curr }), {})
  return combineLatest(streams).pipe(
    map((props) =>
      props
        .reduce((prev, curr) => ({ ...prev, ...curr }), data)
    )
  )
}

export function pluralize (value, str) {
  return `${str}${value === 1 ? '' : 's'}`
}

export const renderComponent = (element, renderer) => (source$) => source$.pipe(
  tap((props) => render(element, () => renderer(props)))
)

//
// Other
//

export function pipe (source, ...fns) {
  return fns.reduce(async (prev, fn) => await fn(prev), source)
}
