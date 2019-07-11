const cuid = require('cuid')
const kappa = require('kappa-core')
const view = require('kappa-view')
const list = require('kappa-view-list')
const ram = require('random-access-memory')
//const level = require('level-mem')
const level = require('level')
const sub = require('subleveldown')

// Store logs in a directory called "log". Store views in memory.
const core = kappa('./log', { valueEncoding: 'json' })
//const store = level()
const idx = level('db')

core.use('events', list(idx, (msg, next) => {
  const { createdAt } = msg.value
  if (!createdAt) return next()
  next(null, [ createdAt ])
}))

/*
// View definition
const sumview = view(store, (db) => {
  //let sum
  return {
    // Called with a batch of log entries to be processed by the view.
    // No further entries are processed by this view until 'next()' is called.
    map: async (entries, next) => {
      let sum
      try {
        sum = parseInt(await db.get('sum'))
      } catch (err) {
        if (err.notFound)
          sum = 0
        else
          next(err)
      }
      entries
        .filter(({ value }) => typeof value === 'number')
        .forEach(({ value }) => {
          sum += value
        })
      db.put('sum', sum, next)
    },
    // Whatever is defined in the "api" object is publicly accessible
    api: {
      get: (core, cb) => {
        core.ready(() => { // wait for all views to catch up
          db.get('sum', cb)
        })
      }
    }
  }
})

// the api will be mounted at core.api.sum
core.use('sum', 1, sumview) // name the view 'sum' and consider the 'sumview' logic as version 1
*/

core.writer('local', (err, feed) => {
  const nextEvent = {
    id: cuid(),
    createdAt: (new Date()).toISOString(),
    type: 'orgCreated',
    value: {
      id: cuid(),
      name: 'BloomingFools Hash House Harriers',
      nickname: 'BFH3'
    }
  }
  feed.append(nextEvent)

  //setTimeout(() => {
  //  feed.append(nextEvent)
  //}, 0)
})

//core.api.events.onInsert((msg) => {
  //console.log('early insert')
//})

const nodeDB = sub(idx, 'node', { valueEncoding: 'json' })
const refDB = sub(idx, 'ref', { valueEncoding: 'json' })

const eventProcessors = {
  orgCreated: orgCreatedEvent
}

core.ready('events', () => {
  core.api.events.read(async (err, msgs) => {
    await nodeDB.put('orgs', {})
    for (const msg of msgs) {
      //console.log('%%', msg.value)
      await processEvent(nodeDB, msg.value)
    }
    console.log('>>', await refDB.get('orgs'))
    //console.log('all events', msgs.length)
  })

  core.api.events.onInsert((msg) => {
    //console.log('insert', msg)
  })

  core.api.events.tail(2, (msgs) => {
    console.log('tail', msgs)
  })
})

async function processEvent (db, event) {
  const { type } = event
  const processor = eventProcessors[type]
  if (processor) {
    await processor(db, event)
  }
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
