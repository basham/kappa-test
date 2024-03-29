import kappa from 'kappa-core'
import list from 'kappa-view-list'
import level from 'level'
import { html } from 'lighterhtml'
import RAW from 'random-access-web'
import { from } from 'rxjs'
import sub from 'subleveldown'
import { whenAdded } from 'when-elements'
import { processEvent } from './events.js'
import { append, get, isRef, put, readListView } from './util.js'
import { combineLatestProps, renderComponent } from './util.js'
import eventLog from '../tmp/event-log.json'

const storage = RAW('events')
const core = kappa(storage, { valueEncoding: 'json' })

core.writer('local', async (err, feed) => {
  for (const event of eventLog) {
    await append(feed, event)
  }
})

const idx = level('db')

core.use('events', 1, list(idx, (msg, next) => {
  const { value } = msg
  const { eventId } = value
  if (!eventId) return next()
  next(null, [ eventId ])
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

  const eventLog = await readListView(core.api.events)
  console.log('MSG', eventLog)
  for (const msg of eventLog) {
    await processEvent(graphDB, msg.value)
  }

  await put(metaDB, 'loaded', true)
})

whenAdded('#app', (el) => {
  const params = new URLSearchParams(window.location.search)
  const rootRef = 'root'
  const refKey = params.get('ref') ? params.get('ref') : rootRef
  const getRefValue = async () => (await get(graphDB, refKey))
  // Wait for the database to finish loading to prevent the initial error.
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
      <p>
        ${key === rootRef ? null : html`<a href="?">${rootRef}</a> / `}
        ${key}
      </p>
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
    if (!props) {
      return null
    }
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
