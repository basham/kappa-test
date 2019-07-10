const cuid = require('cuid')
const kappa = require('kappa-core')
const view = require('kappa-view')
const list = require('kappa-view-list')
var ram = require('random-access-memory')
const memdb = require('memdb')

// Store logs in a directory called "log". Store views in memory.
const core = kappa('./log', { valueEncoding: 'json' })
const store = memdb()

core.use('events', list(store, (msg, next) => {
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
    type: 'orgCreated1',
    value: {
      id: cuid(),
      name: 'BloomingFools Hash House Harriers',
      nickname: 'BFH3'
    }
  }
  feed.append(nextEvent)

  setTimeout(() => {
    feed.append(nextEvent)
  }, 2000)
})

core.api.events.onInsert((msg) => {
  console.log('early insert')
})

core.ready('events', () => {
  core.api.events.read((err, msgs) => {
    console.log('all events', msgs.length)
  })

  core.api.events.onInsert((msg) => {
    console.log('insert', msg)
  })

  core.api.events.tail(2, (msgs) => {
    console.log('tail', msgs)
  })
})
