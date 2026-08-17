import type { MatchEvent, MatchSquad } from '../storage/types'
import {
  isAssistEvent,
  isGoalEvent,
  isRedCardEvent,
  isShotEvent,
  isTurnoverEvent,
  isYellowCardEvent,
} from '../matches/events'

export type PlayerStats = {
  matches: number
  starts: number
  events: number
  shots: number
  goals: number
  assists: number
  turnovers: number
  yellowCards: number
  redCards: number
}

const EMPTY_STATS: PlayerStats = {
  matches: 0,
  starts: 0,
  events: 0,
  shots: 0,
  goals: 0,
  assists: 0,
  turnovers: 0,
  yellowCards: 0,
  redCards: 0,
}

export function calculatePlayerStats(squads: MatchSquad[], events: MatchEvent[]): PlayerStats {
  const stats = { ...EMPTY_STATS }
  const matchIds = new Set(squads.map(squad => squad.matchId))

  stats.matches = matchIds.size
  stats.starts = squads.filter(squad => squad.starter).length
  stats.events = events.length

  for (const event of events) {
    if (isShotEvent(event)) stats.shots += 1
    if (isGoalEvent(event)) stats.goals += 1
    if (isAssistEvent(event)) stats.assists += 1
    if (isTurnoverEvent(event)) stats.turnovers += 1
    if (isYellowCardEvent(event)) stats.yellowCards += 1
    if (isRedCardEvent(event)) stats.redCards += 1
  }

  return stats
}
