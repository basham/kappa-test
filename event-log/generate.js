import fs from 'fs'
import { createLog } from './log.js'

const dir = './tmp'
const file = 'event-log.json'

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir)
}

const log = createLog()
const data = JSON.stringify(log, null, 2)
fs.writeFileSync(`${dir}/${file}`, data)
