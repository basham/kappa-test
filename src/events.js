import { createRef, get, put, set } from './util.js'

const ROOT = 'root'

const eventProcessors = {
  RootCreated: rootCreatedEvent,
  GroupCreated: groupCreatedEvent,
  PersonCreated: personCreatedEvent,
  PersonUpdated: personUpdatedEvent,
  MembershipCreated: membershipCreatedEvent
}

export async function processEvent (db, event) {
  const { type } = event
  console.log('')
  console.log('# Event:', type)
  const processor = eventProcessors[type]
  if (processor) {
    await processor(db, event.data)
  }
}

async function rootCreatedEvent (db, data) {
  const { rootId, groupsId, peopleId, membershipsId, eventsId, attendancesId } = data

  const rootRef = createRef(rootId)
  const attendancesRef = createRef(attendancesId)
  const eventsRef = createRef(eventsId)
  const groupsRef = createRef(groupsId)
  const membershipsRef = createRef(membershipsId)
  const peopleRef = createRef(peopleId)

  await put(db, ROOT, rootRef)

  await put(db, rootRef, {
    rootId,
    attendances: attendancesRef,
    events: eventsRef,
    groups: groupsRef,
    memberships: membershipsRef,
    people: peopleRef
  })

  await put(db, attendancesRef, {})
  await put(db, eventsRef, {})
  await put(db, groupsRef, {})
  await put(db, membershipsRef, {})
  await put(db, peopleRef, {})

  console.log(await get(db, rootRef))
}

async function groupCreatedEvent (db, data) {
  const { groupId } = data
  const groupRef = createRef(groupId)
  const membershipsRef = createRef()
  await put(db, groupRef, {
    ...data,
    memberships: membershipsRef
  })

  await put(db, membershipsRef, {})

  const rootRef = await get(db, ROOT)
  const root = await get(db, rootRef)
  const groupsRef = root.groups
  await set(db, groupsRef, groupRef)

  console.log(await get(db, groupRef))
}

async function personCreatedEvent (db, data) {
  const { personId } = data
  const personRef = createRef(personId)
  const membershipsRef = createRef()
  await put(db, personRef, {
    ...data,
    memberships: membershipsRef
  })

  await put(db, membershipsRef, {})

  const rootRef = await get(db, ROOT)
  const root = await get(db, rootRef)
  const peopleRef = root.people
  await set(db, peopleRef, personRef)

  console.log(await get(db, personRef))
}

async function personUpdatedEvent (db, data) {
  const { personId } = data
  const personRef = createRef(personId)
  const person = await get(db, personRef)
  await put(db, personRef, {
    ...person,
    ...data
  })

  console.log(await get(db, personRef))
}

async function membershipCreatedEvent (db, data) {
  const { membershipId, groupId, personId } = data
  const membershipRef = createRef(membershipId)
  const groupRef = createRef(groupId)
  const personRef = createRef(personId)
  await put(db, membershipRef, {
    membershipId,
    group: groupRef,
    person: personRef
  })

  const rootRef = await get(db, ROOT)
  const root = await get(db, rootRef)
  const membershipsRef = root.memberships
  await set(db, membershipsRef, membershipRef)

  const group = await get(db, groupRef)
  const groupMembershipsRef = group.memberships
  await set(db, groupMembershipsRef, membershipRef)

  const person = await get(db, personRef)
  const personMembershipsRef = person.memberships
  await set(db, personMembershipsRef, membershipRef)

  console.log(await get(db, membershipRef))
}
