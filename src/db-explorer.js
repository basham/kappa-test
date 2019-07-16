import 'cuid/dist/cuid.min.js?external'
import 'lighterhtml/min.js?external'
import 'rxjs/bundles/rxjs.umd.min.js?external'
import 'when-elements?external'

import kappa from 'kappa-core'
import list from 'kappa-view-list'
import level from 'level'
import { html } from 'lighterhtml'
import RAW from 'random-access-web'
import { of } from 'rxjs'
import { map } from 'rxjs/operators'
import sub from 'subleveldown'
import { whenAdded } from 'when-elements'
import { processEvent } from './events.js'
import { createRef, get, put } from './util.js'
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

whenAdded('#app', (el) => {
  const org$ = of({ name: 'Test', members: [1, 2] })
  const memberCount$ = org$.pipe(
    map(({ members }) => Object.keys(members).length)
  )
  const sub = combineLatestProps({
    org: org$,
    memberCount: memberCount$,
    foo: 'bar'
  }).pipe(
    renderComponent(el, render)
  ).subscribe()
  return () => sub.unsubscribe()
  function render (props) {
    const { memberCount, org } = props
    console.log('&&', props)
    const { name } = org
    return html`
      <h1>${name}</h1>
      <p>${memberCount} ${pluralize(memberCount, 'member')}</p>
    `
  }
})
