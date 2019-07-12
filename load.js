const cuid = require('cuid')
const fs = require('fs-extra')
const kappa = require('kappa-core')

const ids = [ ...Array(2) ].map(() => cuid())

const events = [
  {
    id: cuid(),
    createdTime: (new Date()).toISOString(),
    updatedTime: (new Date()).toISOString(),
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
    createdTime: (new Date()).toISOString(),
    updatedTime: (new Date()).toISOString(),
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

//fs.removeSync(logPath)

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
