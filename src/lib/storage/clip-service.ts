import { db } from './db'
import { createId } from './id'
import { getClipWindow, formatClipName } from './clip-utils'

export async function createClipFromEvent(eventId: string, preRoll = 5, postRoll = 5) {
  if (!db) throw new Error('Local database is only available in the browser.')
  const event = await db.events.get(eventId)
  if (!event) throw new Error('Evento não encontrado.')
  const window = getClipWindow(event.timestampSeconds, preRoll, postRoll)
  const clip = {
    id: createId(),
    matchId: event.matchId,
    eventId: event.id,
    startSeconds: window.startSeconds,
    endSeconds: window.endSeconds,
    title: formatClipName(event.type, event.timestampSeconds),
    favorite: false,
    createdAt: new Date().toISOString(),
  }
  await db.clips.add(clip)
  return clip
}

export async function listMatchClips(matchId: string) {
  if (!db) return []
  return db.clips.where('matchId').equals(matchId).sortBy('startSeconds')
}
