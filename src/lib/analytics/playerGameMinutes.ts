import type { Match, MatchEvent, MatchSquad } from '../storage/types'
import { derivePlayerMinutes, formatMinutes } from './playerMinutes'

export type PlayerGameMinutes = {
  matchId: string
  date: string
  opponentName: string
  playerId: string
  minutes: number
  minutesLabel: string
  availableMinutes: number
  utilisation: number
  starter: boolean
  goals: number
  shots: number
  goalsPerMinute: number
  shotsPerMinute: number
}

export function derivePlayerGameMinutes(matches: Match[], squads: MatchSquad[], events: MatchEvent[], playerId: string): PlayerGameMinutes[] {
  return matches
    .filter(match => squads.some(s => s.matchId === match.id && s.playerId === playerId))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(match => {
      const matchSquad = squads.filter(s => s.matchId === match.id)
      const matchEvents = events.filter(e => e.matchId === match.id)
      const minutes = derivePlayerMinutes(matchEvents, matchSquad, playerId, 2)
      const availableMinutes = 60
      const playerEvents = matchEvents.filter(e => e.playerId === playerId)
      const goals = playerEvents.filter(e => e.type === 'GOAL' && e.result === 'FOR').length
      const shots = playerEvents.filter(e => e.type === 'SHOT').length
      return {
        matchId: match.id,
        date: match.date,
        opponentName: match.opponentName,
        playerId,
        minutes,
        minutesLabel: formatMinutes(minutes),
        availableMinutes,
        utilisation: Number(((minutes / availableMinutes) * 100).toFixed(1)),
        starter: matchSquad.find(s => s.playerId === playerId)?.starter ?? false,
        goals,
        shots,
        goalsPerMinute: minutes ? Number((goals / (minutes / 60)).toFixed(2)) : 0,
        shotsPerMinute: minutes ? Number((shots / (minutes / 60)).toFixed(2)) : 0,
      }
    })
}
