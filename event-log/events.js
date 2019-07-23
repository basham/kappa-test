import cuid from 'cuid'

export function createEvent (type, data) {
  return {
    eventId: cuid(),
    type,
    createdAt: (new Date()).toISOString(),
    data: data()
  }
}

export function createRoot () {
  return createEvent('RootCreated', () => ({
    rootId: cuid(),
    groupsId: cuid(),
    peopleId: cuid(),
    membershipsId: cuid(),
    eventsId: cuid(),
    attendancesId: cuid()
  }))
}

export function createGroup (data) {
  return createEvent('GroupCreated', () => ({
    groupId: cuid(),
    ...data
  }))
}

export function updateGroup (groupId, data) {
  return createEvent('GroupUpdated', () => ({
    groupId,
    ...data
  }))
}

export function deleteGroup (groupId) {
  return createEvent('GroupDeleted', () => ({
    groupId
  }))
}

export function createPerson (data) {
  return createEvent('PersonCreated', () => ({
    personId: cuid(),
    ...data
  }))
}

export function updatePerson (personId, data) {
  return createEvent('PersonUpdated', () => ({
    personId,
    ...data
  }))
}

export function deletePerson (personId) {
  return createEvent('PersonDeleted', () => ({
    personId
  }))
}

export function createMembership (groupId, personId) {
  return createEvent('MembershipCreated', () => ({
    membershipId: cuid(),
    groupId,
    personId
  }))
}

export function updateMembership (membershipId, data) {
  return createEvent('MembershipUpdated', () => ({
    membershipId,
    ...data
  }))
}

export function deleteMembership (membershipId) {
  return createEvent('MembershipDeleted', () => ({
    membershipId
  }))
}
