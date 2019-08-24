import { appendFileSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import webpack from 'webpack'
import pkg from '../package.json'

const __dirname = dirname(fileURLToPath(import.meta.url))
const __root = resolve(__dirname, '../')
const __tmp = './tmp'
const __web_modules = './web_modules'

const entry = pkg.cjsDependencies
  .reduce((entries, entry) => ({ ...entries, [entry]: `./${entry}.js` }), {})

Object.entries(entry)
  .forEach(([ moduleName, fileName ]) => {
    const filePath = resolve(__root, __tmp, fileName)
    const fileContents = `window.${moduleName} = require('${moduleName}')`
    writeFileSync(filePath, fileContents)
  })

const compiler = webpack({
  mode: 'production',
  context: resolve(__root, __tmp),
  entry,
  output: {
    filename: '[name].js',
    path: resolve(__root, __web_modules)
  }
})

compiler.run((err, stats) => {
  if (err || stats.hasErrors()) {
    console.log('error', err, stats.toString())
    return
  }
  Object.entries(entry)
    .forEach(([ moduleName, fileName ]) => {
      unlinkSync(resolve(__root, __tmp, fileName))

      const filePath = resolve(__root, __web_modules, fileName)
      const contents = `export default window.${moduleName};`
      appendFileSync(filePath, contents)

      const mapPath = resolve(__root, __web_modules, 'import-map.json')
      const importMap = JSON.parse(readFileSync(mapPath))
      const mapContents = {
        ...importMap,
        imports: {
          ...importMap.imports,
          [moduleName]: fileName
        }
      }
      writeFileSync(mapPath, JSON.stringify(mapContents, null, 2))

      console.log('Installed:', moduleName)
    })
})
