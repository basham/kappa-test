import kappa from 'kappa-core'
import list from 'kappa-view-list'
import level from 'level'
import sub from 'subleveldown'
import { processEvent } from './events.js'

const core = kappa('./log', { valueEncoding: 'json' })
const idx = level('db')

core.use('events', 1, list(idx, (msg, next) => {
  const { value } = msg 
  const { createdTime } = value
  if (!createdTime) return next()
  next(null, [ createdTime ])
}))

const graphDB = sub(idx, 'graph', { valueEncoding: 'json' })

core.ready('events', async () => {

  // Store reference to all events that have been processed.
  // Read from events view API.
  // Skip all events that have been processed until reaching one
  // that hasn't been processed.
  // Process all future events and store event reference.
  // Clear processed events when view clears (clearIndex).

  const eventLog = await readEvents()
  console.log('MSG', eventLog)
  for (const msg of eventLog) {
    await processEvent(graphDB, msg.value)
  }
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
