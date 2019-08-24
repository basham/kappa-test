import { html } from 'lighterhtml'
import { of } from 'rxjs'
import { whenAdded } from 'when-elements'
import { combineLatestProps, renderComponent } from './util.js'

whenAdded('#app', (el) => {
  const sub = combineLatestProps({
    messages: of([ 'woot', 'yeah' ])
  }).pipe(
    renderComponent(el, render)
  ).subscribe()

  return () => sub.unsubscribe()

  function submitMessage (event) {
    event.preventDefault()
    const message = event.target.elements.message.value
    console.log('Message', message)
  }

  function render (props) {
    const { messages } = props
    return html`
      <h1>Messages</h1>
      <ul>
        ${messages.map((msg) => html`<li>${msg}</li>`)}
      </ul>
      <form onsubmit=${submitMessage}>
        <label for='message'>Message</label>
        <textarea id='message' name='message'></textarea>
        <button type='submit'>Submit</button>
      </form>
    `
  }
})
