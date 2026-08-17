import type { MatchEvent, MatchSquad } from '../storage/types'

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

const normalize = (value?: string) => value?.trim().toUpperCase() ?? ''

export function calculatePlayerStats(squads: MatchSquad[], events: MatchEvent[]): PlayerStats {
  const stats = { ...EMPTY_STATS }
  const matchIds = new Set(squads.map(squad => squad.matchId))

  stats.matches = matchIds.size
  stats.starts = squads.filter(squad => squad.starter).length
  stats.events = events.length

  for (const event of events) {
    const type = normalize(event.type)
    const result = normalize(event.result)

    // A save is a goalkeeper action, not a shot by the player.
    if (['SHOT', 'GOAL', 'MISS', 'SHOT_MISS', 'SHOT_GOAL'].includes(type)) stats.shots += 1
    if (['GOAL', 'SHOT_GOAL'].includes(type) || result === 'GOAL') stats.goals += 1
    if (['ASSIST', 'ASSISTENCIA', 'ASSISTÊNCIA'].includes(type)) stats.assists += 1
    if (['TURNOVER', 'PERDA', 'PERDA_BOLA'].includes(type)) stats.turnovers += 1
    if (['YELLOW_CARD', 'YELLOW', 'AMARELO'].includes(type)) stats.yellowCards += 1
    if (['RED_CARD', 'RED', 'VERMELHO'].includes(type)) stats.redCards += 1
  }

  return stats
}
