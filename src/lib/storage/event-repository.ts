import { db } from './db'
import type { MatchEvent } from './types'
import type { EventEditorData } from './event-editor'

export async function updateMatchEvent(id: string, data: EventEditorData) {
  if (!db) throw new Error('Local database is only available in the browser.')
  const event = await db.events.get(id)
  if (!event) throw new Error('Evento não encontrado.')
  const updated: MatchEvent = { ...event, ...data }
  await db.events.put(updated)
  return updated
}

export async function getMatchPlayers(matchId: string) {
  if (!db) return []
  const match = await db.matches.get(matchId)
  if (!match) return []
  const assignments = await db.playerTeamSeasons.where('teamId').equals(match.teamId).toArray()
  const players = await Promise.all(assignments.map(a => db.players.get(a.playerId)))
  return players.filter(Boolean)
}
