import browserify from 'browserify'
import { appendFileSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import pkg from '../package.json'

const __dirname = dirname(fileURLToPath(import.meta.url))
const __root = resolve(__dirname, '../')
const __tmp = './tmp'
const __web_modules = './web_modules'

main()

async function main () {
  for (const dep of pkg.cjsDependencies) {
    await cjs(dep)
  }
}

async function cjs (moduleName) {
  const tmpFile = resolve(__root, __tmp, `${moduleName}.js`)
  const tmpContents = `window['${moduleName}'] = require('${moduleName}')`
  writeFileSync(tmpFile, tmpContents)

  const outFile = await bundle(moduleName, tmpFile)

  unlinkSync(tmpFile)

  const outContents = `export default window['${moduleName}'];`
  appendFileSync(outFile, outContents)

  const mapFile = resolve(__root, __web_modules, 'import-map.json')
  const importMap = JSON.parse(readFileSync(mapFile))
  const mapContents = {
    ...importMap,
    imports: {
      ...importMap.imports,
      [moduleName]: `./${moduleName}.js`
    }
  }
  writeFileSync(mapFile, JSON.stringify(mapContents, null, 2))

  console.log('Installed:', moduleName)
}

function bundle (name, file) {
  return new Promise((res, rej) => {
    browserify(file)
      .plugin('tinyify')
      .bundle((err, buf) => {
        if (err) {
          rej(err)
        }
        const outFile = resolve(__root, __web_modules, `${name}.js`)
        writeFileSync(outFile, buf)
        res(outFile)
      })
  })
}
