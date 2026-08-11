import type { Match, MatchEvent, MatchSquad } from '../storage/types'
import { derivePlayerGameMinutes } from './playerGameMinutes'

export type PlayerBenchmark = {
  playerId: string
  matches: number
  minutes: number
  utilisation: number
  goalsPerMatch: number
  shotsPerMatch: number
  goalsPerMinute: number
  shotsPerMinute: number
  teamGoalsPerMatch: number
  teamShotsPerMatch: number
}

export function buildPlayerBenchmark(playerId: string, matches: Match[], squads: MatchSquad[], events: MatchEvent[]): PlayerBenchmark {
  const rows = derivePlayerGameMinutes(matches, squads, events, playerId)
  const goals = rows.reduce((sum, row) => sum + row.goals, 0)
  const shots = rows.reduce((sum, row) => sum + row.shots, 0)
  const minutes = rows.reduce((sum, row) => sum + row.minutes, 0)
  const available = matches.length * 60
  const teamGoals = events.filter(e => e.type === 'GOAL' && e.result === 'FOR').length
  const teamShots = events.filter(e => e.type === 'SHOT').length
  return {
    playerId,
    matches: matches.length,
    minutes,
    utilisation: available ? (minutes / available) * 100 : 0,
    goalsPerMatch: matches.length ? goals / matches.length : 0,
    shotsPerMatch: matches.length ? shots / matches.length : 0,
    goalsPerMinute: minutes ? goals / minutes : 0,
    shotsPerMinute: minutes ? shots / minutes : 0,
    teamGoalsPerMatch: matches.length ? teamGoals / matches.length : 0,
    teamShotsPerMatch: matches.length ? teamShots / matches.length : 0,
  }
}
