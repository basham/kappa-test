import { createRef, get, put, set } from './util.js'

const eventProcessors = {
  GroupCreated: groupCreatedEvent,
  MemberCreated: memberCreatedEvent
}

export async function processEvent (db, event) {
  const { type } = event
  console.log('')
  console.log('# Event:', type)
  const processor = eventProcessors[type]
  if (processor) {
    await processor(db, event)
  }
}

async function groupCreatedEvent (db, event) {
  const { value } = event
  const { id } = value
  const groupRef = createRef(id)
  await put(db, groupRef, value)

  const rootRef = await get(db, 'root', () => createRef())
  const root = await get(db, rootRef, {})
  const groupsRef = root.groups || createRef()
  await put(db, rootRef, { ...root, groups: groupsRef })
  await set(db, groupsRef, groupRef)

  console.log('Groups', await get(db, groupsRef))
}

async function memberCreatedEvent (db, event) {
  const { value } = event
  const { id, group: groupId } = value
  const memberRef = createRef(id)
  const groupRef = createRef(groupId)
  await put(db, memberRef, { ...value, group: groupRef })

  const group = await get(db, groupRef, {})
  const groupMembersRef = group.members || createRef()
  await put(db, groupRef, { ...group, members: groupMembersRef })
  await set(db, groupMembersRef, memberRef)

  const rootRef = await get(db, 'root', () => createRef())
  const root = await get(db, rootRef, {})
  const membersRef = root.members || createRef()
  await put(db, rootRef, { ...root, members: membersRef })
  await set(db, membersRef, memberRef)

  console.log('Member', await get(db, memberRef))
  console.log('Group Members', await get(db, groupMembersRef))
}
