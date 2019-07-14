const cuid = require('cuid')
const level = require('level')
const subleveldown = require('subleveldown')
const util = require('./util.js')

window.DEPS = { cuid, level, subleveldown, util }
