import cuid from 'cuid'
import kappa from 'kappa-core'
import list from 'kappa-view-list'
import level from 'level'
import { html } from 'lighterhtml'
//import RA from 'random-access-idb'
import RAW from 'random-access-web'
import { BehaviorSubject } from 'rxjs'
import { whenAdded } from 'when-elements'
import { append, combineLatestProps, readListView, renderComponent } from './util.js'

const storage = RAW('app-events')

const core = kappa(storage, { valueEncoding: 'json' })

const idx = level('app-db')

core.use('events', 1, list(idx, (msg, next) => {
  const { value } = msg
  const { eventId } = value
  if (!eventId) return next()
  next(null, [ eventId ])
}))

async function postMessage (text) {
  const event = {
    eventId: cuid(),
    type: 'message',
    text,
    createdTime: new Date().toJSON()
  }
  core.writer('local', async (err, feed) => {
    await append(feed, event)
  })
}

whenAdded('#app', (el) => {
  const messages$ = new BehaviorSubject([])

  core.ready('events', async () => {
    const list = await readListView(core.api.events)
    console.log('LIST', list)
    const messages = list
      .map(({ value }) => value)
      .filter(({ type }) => type === 'message')
    messages$.next(messages)

    core.api.events.onInsert((data) => {
      console.log('INSERT', data)
      const { value } = data
      const { type } = value
      if (type === 'message') {
        messages$.next([ ...messages$.getValue(), value ])
      }
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
