var kappa = require('kappa-core')
var view = require('kappa-view')
var memdb = require('memdb')

// Store logs in a directory called "log". Store views in memory.
var core = kappa('./log', { valueEncoding: 'json' })
var store = memdb()

// View definition
var sumview = view(store, (db) => {
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

core.writer('default', (err, writer) => {
  writer.append(1, (err) => {
    core.api.sum.get((err, value) => {
      console.log(value) // 1
    })
  })
})
