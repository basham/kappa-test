import { createRoot, createGroup, createPerson, createMembership, updatePerson } from './events.js'

export function createLog () {
  const ev0 = createRoot()

  const ev1 = createGroup({
    name: 'BloomingFools Hash House Harriers',
    nickname: 'BFH3',
    location: 'Bloomington, IN',
    url: 'http://www.bfh3.com/'
  })

  const ev2 = createPerson({
    firstName: 'Chris',
    lastName: 'Basham'
  })

  const ev3 = createMembership(ev1.data.groupId, ev2.data.personId)

  const ev4 = updatePerson(ev2.data.personId, { preferredName: 'UPP' })

  return [
    ev0,
    ev1,
    ev2,
    ev3,
    ev4
  ]
}
