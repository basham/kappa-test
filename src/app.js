import cuid from 'cuid'
import sdk from 'dat-sdk'
import { html } from 'lighterhtml'
import { BehaviorSubject } from 'rxjs'
import { whenAdded } from 'when-elements'
import { combineLatestProps, renderComponent } from './util.js'

const { Hypercore } = sdk()

const core = Hypercore(null, {
  valueEncoding: 'json',
  persist: false
})

function postMessage (text) {
  core.append(JSON.stringify({
    id: cuid(),
    text,
    createdTime: new Date().toJSON()
  }))
}

whenAdded('#app', (el) => {
  const messages$ = new BehaviorSubject([])
  const nextMessage = (value) => {
    messages$.next([ ...messages$.getValue(), value ])
  }

  core.on('append', () => {
    core.head((err, data) => {
      const value = JSON.parse(data)
      nextMessage(value)
      console.log('Appended:', value)
    })
  })

  const sub = combineLatestProps({
    messages: messages$
  }).pipe(
    renderComponent(el, render)
  ).subscribe()

  return () => sub.unsubscribe()

  function submitMessage (event) {
    event.preventDefault()
    const messageEl = event.target.elements.message
    const message = messageEl.value
    postMessage(message)
    messageEl.value = ''
    messageEl.focus()
  }

  function render (props) {
    console.log('##', props)
    const { messages } = props
    return html`
      <h1>Messages</h1>
      <ul>
        ${messages.map((msg) => html`<li>${msg.text}</li>`)}
      </ul>
      <form onsubmit=${submitMessage}>
        <label for='message'>Message</label>
        <textarea autofocus id='message' name='message'></textarea>
        <button type='submit'>Submit</button>
      </form>
    `
  }
})
