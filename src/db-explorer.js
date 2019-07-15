import 'cuid/dist/cuid.min.js?external'
import 'lighterhtml/min.js?external'
import 'rxjs/bundles/rxjs.umd.min.js?external'
import 'when-elements?external'

import cuid from 'cuid'
import level from 'level'
import { html, render } from 'lighterhtml'
import { ReplaySubject, combineLatest, isObservable, of } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import sub from 'subleveldown'
import { whenAdded } from 'when-elements'
import { get } from '../util.js'

const idx = level('db')
const db = sub(idx, 'graph', { valueEncoding: 'json' })

//import { test } from './bundle.js'
//console.log('!!', test)

//import cuid from './bundle.js'

console.log('??', cuid())

/*
Gun.chain.$ = function rxjs () {
  const stream = new ReplaySubject(1)
  this.on((value) => stream.next(value))
  return stream
}
*/

async function start () {
  //const root = await get(db, 'root')
  const root = await db.get('root')
  console.log('WOO', root)
}
start()

const combineProps = (source) => {
  const streams = Object.keys(source)
    .filter((key) => isObservable(source[key]))
    .map((key) =>
      source[key].pipe(
        map((value) => ({ [key]: value }))
      )
    )
  const data = Object.keys(source)
    .filter((key) => !isObservable(source[key]))
    .map((key) => ({ [key]: source[key] }))
    .reduce((prev, curr) => ({ ...prev, ...curr }), {})
  return combineLatest(streams).pipe(
    map((props) =>
      props
        .reduce((prev, curr) => ({ ...prev, ...curr }), data)
    )
  )
}

function pluralize (value, str) {
  return `${str}${value === 1 ? '' : 's'}`
}

const renderComponent = (element, renderer) => (source$) => source$.pipe(
  tap((props) => render(element, () => renderer(props)))
)

whenAdded('#app', (el) => {
  const org$ = of({ name: 'Test', members: [1, 2] })
  const memberCount$ = org$.pipe(
    map(({ members }) => Object.keys(members).length)
  )
  const sub = combineProps({
    org: org$,
    memberCount: memberCount$,
    foo: 'bar'
  }).pipe(
    renderComponent(el, render)
  ).subscribe()
  return () => sub.unsubscribe()
  function render (props) {
    const { memberCount, org } = props
    console.log('&&', props)
    const { name } = org
    return html`
      <h1>${name}</h1>
      <p>${memberCount} ${pluralize(memberCount, 'member')}</p>
    `
  }
})
