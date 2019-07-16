import cuid from 'cuid'
import fs from 'fs'

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

const dir = './tmp'
const file = 'event-log.json'

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir)
}

const data = JSON.stringify(events, null, 2)
fs.writeFileSync(`${dir}/${file}`, data)

function dateTick (ms = 1000) {
  d = new Date(d.getTime() + ms)
  return d
}
