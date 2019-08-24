import { html } from 'lighterhtml'
import { of } from 'rxjs'
import { whenAdded } from 'when-elements'
import { combineLatestProps, renderComponent } from './util.js'

whenAdded('#app', (el) => {
  const sub = combineLatestProps({
    title: of('HA!')
  }).pipe(
    renderComponent(el, render)
  ).subscribe()

  return () => sub.unsubscribe()

  function render (props) {
    console.log('rending', props)
    const { title } = props
    return html`
      <h1>Database: ${title}</h1>
      <p>Hello</p>
    `
  }
})
