import cuid from 'cuid'
import kappa from 'kappa-core'
import list from 'kappa-view-list'
import level from 'level'
import sub from 'subleveldown'
import { moduleTest } from './util.js'

console.log('####', moduleTest)

const core = kappa('./log', { valueEncoding: 'json' })
const idx = level('db')

const eventsView = {
  ...list(idx, (msg, next) => {
    const { createdTime } = msg.value
    if (!createdTime) return next()
    next(null, [ createdTime ])
  }),
  /*
  fetchState: function (cb) {
    idx.get('state', function (err, state) {
      console.log('&& fetch', deserializeState(Buffer.from(state)).version)
      if (err && err.notFound) cb()
      else if (err) cb(err)
      else cb(null, Buffer.from(state))
    })
  },
  storeState: (state, cb) => {
    console.log('STORE', deserializeState(state).version)
    idx.put('state', Buffer.from(state), cb)
  },
  clearIndex: (cb) => {
    console.log('**** clear')
    //idx.del('state', cb)
  }
  */
}
core.use('events', 4, eventsView)

const graphDB = sub(idx, 'graph', { valueEncoding: 'json' })

const eventProcessors = {
  orgCreated: orgCreatedEvent
}

core.api.events.onInsert((value) => {
  //console.log('PUT', value)
})

core.ready('events', async () => {

  // Store reference to all events that have been processed.
  // Read from events view API.
  // Skip all events that have been processed until reaching one
  // that hasn't been processed.
  // Process all future events and store event reference.
  // Clear processed events when view clears (clearIndex).

  const eventLog = await readEvents()
  console.log('%%', eventLog)

  //idx.get('state', (e, v) => {
    //console.log('Version', deserializeState(Buffer.from(v)).version)
  //})
  /*
  core.api.events.read(async (err, msgs) => {
    await graphDB.put('orgs', {})
    for (const msg of msgs) {
      //console.log('%%', msg.value)
      await processEvent(graphDB, msg.value)
    }
    //console.log('>>', await refDB.get('orgs'))
    //console.log('all events', msgs.length)
  })

  core.api.events.tail(1, (msgs) => {
    console.log('tail', msgs)
  })
  */
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

async function processEvent (db, event) {
  const { type } = event
  const processor = eventProcessors[type]
  if (processor) {
    await processor(db, event)
  }
}

async function putNode (db, value) {
  return await db.put()
}

function createRef (_ref = cuid()) {
  return { _ref }
}

async function orgCreatedEvent (db, event) {
  const { value } = event
  const { id } = value
  await db.put(id, value)
  //const v = await db.get(id)
  const orgs = await getValue(refDB, 'orgs', {})
  await refDB.put('orgs', { ...orgs, [id]: { '_ref': id } })
  //db.get(id, (err, v) => console.log('**', v[4]))
}

async function getValue (db, key, defaultValue = undefined) {
  try {
    return await db.get(key)
  } catch (err) {
    if (err.notFound) {
      return defaultValue
    }
    return err
  }
}
