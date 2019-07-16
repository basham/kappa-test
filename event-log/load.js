import fs from 'fs-extra'
import kappa from 'kappa-core'
import events from './tmp/event-log.json'

const logPath = './log'

fs.removeSync(logPath)

const core = kappa(logPath, { valueEncoding: 'json' })
core.writer('local', async (err, feed) => {
  for (const event of events) {
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
