import { describe, expect, it } from 'vitest'
import { calculatePlayerStats } from '../../src/lib/players/stats'
import type { MatchEvent, MatchSquad } from '../../src/lib/storage/types'

const squad = (id: string, matchId: string, starter = false): MatchSquad => ({
  id,
  matchId,
  playerId: 'player-1',
  starter,
  captain: false,
})

const event = (id: string, type: string, result?: string): MatchEvent => ({
  id,
  matchId: 'match-1',
  playerId: 'player-1',
  timestampSeconds: Number(id),
  type,
  result,
  createdAt: new Date(0).toISOString(),
})

describe('calculatePlayerStats', () => {
  it('returns zeroed stats for empty input', () => {
    expect(calculatePlayerStats([], [])).toEqual({
      matches: 0,
      starts: 0,
      events: 0,
      shots: 0,
      goals: 0,
      assists: 0,
      turnovers: 0,
      yellowCards: 0,
      redCards: 0,
    })
  })

  it('calculates match and starter totals without double-counting matches', () => {
    const stats = calculatePlayerStats([
      squad('s1', 'match-1', true),
      squad('s2', 'match-1', false),
      squad('s3', 'match-2', true),
    ], [])

    expect(stats.matches).toBe(2)
    expect(stats.starts).toBe(2)
  })

  it('counts shots and goals correctly and never counts saves as shots', () => {
    const stats = calculatePlayerStats([], [
      event('1', 'SHOT'),
      event('2', 'GOAL'),
      event('3', 'MISS'),
      event('4', 'SAVE'),
      event('5', 'SHOT_GOAL'),
      event('6', 'SHOT_MISS'),
    ])

    expect(stats.events).toBe(6)
    expect(stats.shots).toBe(5)
    expect(stats.goals).toBe(2)
  })

  it('normalizes event names and counts common Portuguese and English variants', () => {
    const stats = calculatePlayerStats([], [
      event('1', 'assist'),
      event('2', 'ASSISTÊNCIA'),
      event('3', 'ASSISTENCIA'),
      event('4', 'TURNOVER'),
      event('5', 'PERDA'),
      event('6', 'PERDA_BOLA'),
      event('7', 'YELLOW_CARD'),
      event('8', 'AMARELO'),
      event('9', 'RED_CARD'),
      event('10', 'VERMELHO'),
    ])

    expect(stats.assists).toBe(3)
    expect(stats.turnovers).toBe(3)
    expect(stats.yellowCards).toBe(2)
    expect(stats.redCards).toBe(2)
  })

  it('recognizes a goal recorded in the result field without double-counting it', () => {
    const stats = calculatePlayerStats([], [
      event('1', 'SHOT', 'GOAL'),
      event('2', 'GOAL', 'GOAL'),
    ])

    expect(stats.shots).toBe(2)
    expect(stats.goals).toBe(2)
  })
})
