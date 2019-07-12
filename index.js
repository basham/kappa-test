const cuid = require('cuid')
const kappa = require('kappa-core')
const view = require('kappa-view')
const list = require('kappa-view-list')
const ram = require('random-access-memory')
const level = require('level')
const sub = require('subleveldown')

const core = kappa('./log', { valueEncoding: 'json' })
const idx = level('db')

const eventsView = {
  ...list(idx, (msg, next) => {
    const { createdTime } = msg.value
    if (!createdTime) return next()
    next(null, [ createdTime ])
  }),
  //storeState: (state, cb) => {
    //console.log('STORE', deserializeState(state))
    //idx.put('state', Buffer.from(state), cb)
  //},
  clearIndex: (cb) => {
    //console.log('**** clear')
    idx.del('state', cb)
  }
}
core.use('events', 5, eventsView)

const graphDB = sub(idx, 'graph', { valueEncoding: 'json' })

const eventProcessors = {
  orgCreated: orgCreatedEvent
}

core.api.events.onInsert((value) => {
  //console.log('PUT', value)
})

core.ready('events', () => {

  // Store reference to all events that have been processed.
  // Read from events view API.
  // Skip all events that have been processed until reaching one
  // that hasn't been processed.
  // Process all future events and store event reference.
  // Clear processed events when view clears (clearIndex).

  idx.get('state', (e, v) => {
    //console.log('Version', deserializeState(Buffer.from(v)).version)
  })
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

// https://github.com/kappa-db/multifeed-index/blob/master/lib/state.js
function deserializeState (buf) {
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
    console.log('#', version, len, buf.length)
  } else {
    state.version = 1
  }

  return state
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
