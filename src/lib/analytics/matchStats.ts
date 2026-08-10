import type { MatchEvent, Player } from '../storage/types'

export type PlayerMatchStats = {
  playerId: string
  name: string
  goals: number
  shots: number
  missedShots: number
  efficiency: number
  assists: number
  turnovers: number
  steals: number
  exclusions2m: number
}

export type MatchStats = {
  teamGoals: number
  opponentGoals: number
  shots: number
  goals: number
  missedShots: number
  efficiency: number
  assists: number
  turnovers: number
  steals: number
  exclusions2m: number
  players: PlayerMatchStats[]
}

export function deriveMatchStats(events: MatchEvent[], players: Player[]): MatchStats {
  const byPlayer = new Map<string, PlayerMatchStats>()
  for (const player of players) byPlayer.set(player.id, { playerId: player.id, name: player.displayName, goals: 0, shots: 0, missedShots: 0, efficiency: 0, assists: 0, turnovers: 0, steals: 0, exclusions2m: 0 })

  let teamGoals = 0, opponentGoals = 0, shots = 0, goals = 0, missedShots = 0, assists = 0, turnovers = 0, steals = 0, exclusions2m = 0
  for (const event of events) {
    const stats = event.playerId ? byPlayer.get(event.playerId) : undefined
    if (event.type === 'GOAL') {
      if (event.result === 'FOR') { teamGoals++; goals++; if (stats) stats.goals++ }
      else if (event.result === 'AGAINST') opponentGoals++
    }
    if (event.type === 'SHOT' || event.type === 'GOAL') { shots++; if (stats) stats.shots++ }
    if (event.type === 'SHOT' && event.result && event.result !== 'GOAL') { missedShots++; if (stats) stats.missedShots++ }
    if (event.type === 'ASSIST') { assists++; if (stats) stats.assists++ }
    if (event.type === 'TURNOVER') { turnovers++; if (stats) stats.turnovers++ }
    if (event.type === 'STEAL') { steals++; if (stats) stats.steals++ }
    if (event.type === '2MIN') { exclusions2m++; if (stats) stats.exclusions2m++ }
  }
  for (const stats of byPlayer.values()) stats.efficiency = stats.shots ? Math.round((stats.goals / stats.shots) * 100) : 0
  return { teamGoals, opponentGoals, shots, goals, missedShots, efficiency: shots ? Math.round((goals / shots) * 100) : 0, assists, turnovers, steals, exclusions2m, players: [...byPlayer.values()].filter(p => p.shots || p.goals || p.assists || p.turnovers || p.steals || p.exclusions2m) }
}
