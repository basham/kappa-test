
(async () => {
  await pipe(
    2,
    log('A'),
    delay(250),
    multiply(4),
    log('B'),
    delay(1000),
    multiply(3),
    log('C'),
    delay(1000)
  )
  console.log('Done')
})()

function pipe (source, ...fns) {
  return fns.reduce(async (prev, fn) => await fn(prev), source)
}

function multiply (x) {
  return async (value) => await value * x
}

function delay (ms) {
  return (value) => new Promise((resolve) => {
    setTimeout(() => resolve(value), ms)
  })
}

function log (prefix) {
  return async (value) => {
    const v = await value
    console.log(prefix, v)
    return v
  }
}
