import type { Match, MatchEvent, MatchSquad, Player, PlayerTeamSeason } from '../storage/types'

export type SeasonPlayerStats = {
  playerId: string
  name: string
  matches: number
  starts: number
  minutes: number
  goals: number
  shots: number
  missedShots: number
  efficiency: number
  assists: number
  turnovers: number
  steals: number
  exclusions2m: number
  goalsPerMatch: number
  shotsPerMatch: number
}

const SHOT_TYPES = new Set(['SHOT', 'GOAL'])

function isFor(event: MatchEvent) {
  return event.result === 'FOR' || event.teamId !== undefined
}

export function deriveSeasonPlayerStats(
  seasonId: string,
  teamId: string,
  players: Player[],
  relations: PlayerTeamSeason[],
  matches: Match[],
  squads: MatchSquad[],
  events: MatchEvent[],
): SeasonPlayerStats[] {
  const seasonMatches = matches.filter(m => m.seasonId === seasonId && m.teamId === teamId)
  const relationIds = new Set(relations.filter(r => r.seasonId === seasonId && r.teamId === teamId).map(r => r.playerId))
  const stats = new Map<string, SeasonPlayerStats>()

  for (const player of players) {
    if (!relationIds.has(player.id)) continue
    stats.set(player.id, { playerId: player.id, name: player.displayName, matches: 0, starts: 0, minutes: 0, goals: 0, shots: 0, missedShots: 0, efficiency: 0, assists: 0, turnovers: 0, steals: 0, exclusions2m: 0, goalsPerMatch: 0, shotsPerMatch: 0 })
  }

  for (const match of seasonMatches) {
    for (const squad of squads) {
      if (squad.matchId !== match.id) continue
      const row = stats.get(squad.playerId)
      if (!row) continue
      row.matches++
      if (squad.starter) row.starts++
    }

    for (const event of events) {
      if (event.matchId !== match.id || !event.playerId) continue
      const row = stats.get(event.playerId)
      if (!row) continue
      if (event.type === 'GOAL' && isFor(event)) row.goals++
      if (SHOT_TYPES.has(event.type) && isFor(event)) row.shots++
      if (event.type === 'SHOT' && event.result && event.result !== 'GOAL') row.missedShots++
      if (event.type === 'ASSIST') row.assists++
      if (event.type === 'TURNOVER') row.turnovers++
      if (event.type === 'STEAL') row.steals++
      if (event.type === '2MIN') row.exclusions2m++
    }
  }

  for (const row of stats.values()) {
    row.efficiency = row.shots ? Math.round((row.goals / row.shots) * 100) : 0
    row.goalsPerMatch = row.matches ? Number((row.goals / row.matches).toFixed(2)) : 0
    row.shotsPerMatch = row.matches ? Number((row.shots / row.matches).toFixed(2)) : 0
  }

  return [...stats.values()].sort((a, b) => b.goals - a.goals || b.efficiency - a.efficiency || a.name.localeCompare(b.name, 'pt'))
}
