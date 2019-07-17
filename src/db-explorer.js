import 'cuid/dist/cuid.min.js?external'
import 'lighterhtml/min.js?external'
import 'rxjs/bundles/rxjs.umd.min.js?external'
import 'when-elements?external'

import kappa from 'kappa-core'
import list from 'kappa-view-list'
import level from 'level'
import { html } from 'lighterhtml'
import RAW from 'random-access-web'
import { from } from 'rxjs'
import { map } from 'rxjs/operators'
import sub from 'subleveldown'
import { whenAdded } from 'when-elements'
import { processEvent } from './events.js'
import { createRef, get, isRef, put } from './util.js'
import { combineLatestProps, pluralize, renderComponent } from './util.js'
import eventLog from '../tmp/event-log.json'

const storage = RAW('events')
const core = kappa(storage, { valueEncoding: 'json' })

core.writer('local', async (err, feed) => {
  for (const event of eventLog) {
    await append(feed, event)
  }
})

function append (feed, data) {
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

const idx = level('db')

core.use('events', 1, list(idx, (msg, next) => {
  const { value } = msg 
  const { createdTime } = value
  if (!createdTime) return next()
  next(null, [ createdTime ])
}))

const metaDB = sub(idx, 'meta', { valueEncoding: 'json' })
const graphDB = sub(idx, 'graph', { valueEncoding: 'json' })

core.ready('events', async () => {

  // Store reference to all events that have been processed.
  // Read from events view API.
  // Skip all events that have been processed until reaching one
  // that hasn't been processed.
  // Process all future events and store event reference.
  // Clear processed events when view clears (clearIndex).

  const loaded = await get(metaDB, 'loaded', false)

  if (loaded) {
    return
  }

  const eventLog = await readEvents()
  console.log('MSG', eventLog)
  for (const msg of eventLog) {
    await processEvent(graphDB, msg.value)
  }

  await put(metaDB, 'loaded', true)
})

function readEvents (options = {}) {
  return new Promise((resolve, reject) => {
    core.api.events.read(options, (err, msgs) => {
      if (err) {
        reject(err)
      } else {
        resolve(msgs)
      }
    })
  })
}

/*
graphDB.on('ready', async () => {
  const db = graphDB
  try {
    const rootRef = await get(db, 'root', () => createRef())
    const root = await get(db, rootRef, {})
    console.log('ROOT', root)
  } catch (err) {
    console.error(err)
  }
})
*/

whenAdded('#app', (el) => {
  const params = new URLSearchParams(window.location.search)
  const refKey = params.get('ref') ? params.get('ref') : 'root'
  const getRefValue = async () => {
    return await get(graphDB, refKey)
  }
  const refValue$ = from(getRefValue())

  const sub = combineLatestProps({
    key: refKey,
    value: refValue$,
  }).pipe(
    renderComponent(el, render)
  ).subscribe()
  return () => sub.unsubscribe()
  function render (props) {
    const { key, value } = props
    return html`
      <h1>Database</h1>
      <p><a href="?">Root</a></p>
      <table>
        <thead>
          <th>Key</th>
          <th>Value</th>
        </thead>
        <tbody>
          ${renderRef(value)}
        </tbody>
      </table>
    `
  }

  function renderRef (props) {
    if (isRef(props)) {
      const { _ref } = props
      return html`
        <tr>
          ${renderValue(_ref, props)}
        </tr>
      `
    }
    return Object.keys(props).map((k) => {
      const v = props[k]
      return html`
        <tr>
          ${renderValue(k, v)}
        </tr>
      `
    })
  }

  function renderValue (key, value) {
    if (isRef(value)) {
      return html`
        <td>
          <a href=${`?ref=${value._ref}`}>
            ${key}
          </a>
        </td>
        <td><em>(ref)</em></td>
      `
    }
    return html`
      <td>${key}</td>
      <td>${value}</td>
    `
  }
})
