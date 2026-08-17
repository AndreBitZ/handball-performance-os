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
    ])

    expect(stats.shots).toBe(4)
    expect(stats.goals).toBe(2)
  })

  it('counts common Portuguese and English event names', () => {
    const stats = calculatePlayerStats([], [
      event('1', 'ASSISTÊNCIA'),
      event('2', 'ASSISTENCIA'),
      event('3', 'PERDA_BOLA'),
      event('4', 'AMARELO'),
      event('5', 'VERMELHO'),
    ])

    expect(stats.assists).toBe(2)
    expect(stats.turnovers).toBe(1)
    expect(stats.yellowCards).toBe(1)
    expect(stats.redCards).toBe(1)
  })

  it('recognizes a goal recorded in the result field', () => {
    const stats = calculatePlayerStats([], [event('1', 'SHOT', 'GOAL')])
    expect(stats.shots).toBe(1)
    expect(stats.goals).toBe(1)
  })
})
