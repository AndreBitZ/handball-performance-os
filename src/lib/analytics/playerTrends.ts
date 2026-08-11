import type { MatchEvent } from '../storage/types'

export type TrendPoint = { matchId: string; date: string; opponentName: string; minutes: number; utilisation: number; goals: number; shots: number; goalsPerMinute: number; shotsPerMinute: number }

export function rollingAverage(values: number[], window = 3): number[] {
  return values.map((_, i) => { const slice = values.slice(Math.max(0, i - window + 1), i + 1); return slice.reduce((a, b) => a + b, 0) / slice.length })
}

export function trendDirection(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable'
  const recent = values.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, values.length)
  const previous = values.slice(Math.max(0, values.length - 6), Math.max(0, values.length - 3))
  if (!previous.length) return 'stable'
  const old = previous.reduce((a, b) => a + b, 0) / previous.length
  if (recent > old * 1.08) return 'up'
  if (recent < old * 0.92) return 'down'
  return 'stable'
}

export function trendFromEvents(events: MatchEvent[], playerId: string) {
  const goals = events.filter(e => e.playerId === playerId && e.type === 'GOAL' && e.result === 'FOR').length
  const shots = events.filter(e => e.playerId === playerId && e.type === 'SHOT').length
  return { goals, shots }
}
