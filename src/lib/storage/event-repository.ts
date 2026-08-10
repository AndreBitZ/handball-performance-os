import type { MatchEvent, Player } from './types'
import type { EventEditorData } from './event-editor'
import { db } from './db'

export async function updateMatchEvent(id: string, data: EventEditorData) {
  if (!db) throw new Error('Local database is only available in the browser.')
  const event = await db.events.get(id)
  if (!event) throw new Error('Evento não encontrado.')
  const updated: MatchEvent = { ...event, ...data }
  await db.events.put(updated)
  return updated
}

export async function getMatchPlayers(matchId: string): Promise<Player[]> {
  if (!db) return []

  const database = db
  const match = await database.matches.get(matchId)
  if (!match) return []

  const assignments = await database.playerTeamSeasons
    .where('teamId')
    .equals(match.teamId)
    .toArray()

  const players: Player[] = []

  for (const assignment of assignments) {
    const player = await database.players.get(assignment.playerId)
    if (player) players.push(player)
  }

  return players
}
