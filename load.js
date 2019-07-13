import cuid from 'cuid'
import fs from 'fs-extra'
import kappa from 'kappa-core'

let d = new Date()

const ids = [ ...Array(2) ]
  .map(() => cuid())
const dates = [ ...Array(2) ]
  .map(() => dateTick().toISOString())

const events = [
  {
    id: cuid(),
    createdTime: dates[0],
    updatedTime: dates[0],
    type: 'GroupCreated',
    value: {
      id: ids[0],
      name: 'BloomingFools Hash House Harriers',
      nickname: 'BFH3',
      location: 'Bloomington, IN',
      url: 'http://www.bfh3.com/'
    }
  },
  {
    id: cuid(),
    createdTime: dates[1],
    updatedTime: dates[1],
    type: 'MemberCreated',
    value: {
      id: cuid(),
      firstName: 'Chris',
      lastName: 'Basham',
      preferredName: 'Untouched Private Panther',
      group: ids[0]
    }
  }
]

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

function dateTick (ms = 1000) {
  d = new Date(d.getTime() + ms)
  return d
}
