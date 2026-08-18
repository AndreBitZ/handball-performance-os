import { describe, expect, it } from 'vitest'
import { validateMatchEvent } from '../../src/lib/match/events'

describe('match event taxonomy', () => {
  const base = { id: 'e1', matchId: 'm1', playerId: 'p1', period: 1 as const, timestampSeconds: 120, type: 'GOAL' }

  it('accepts a basic event', () => {
    expect(validateMatchEvent(base)).toEqual([])
  })

  it('rejects invalid period and timestamp', () => {
    expect(validateMatchEvent({ ...base, period: 3 as 1, timestampSeconds: -1 })).toEqual(['Período inválido', 'Timestamp inválido'])
  })

  it('requires complete shot context when shot metadata is supplied', () => {
    expect(validateMatchEvent({ ...base, type: 'SHOT', zone: 'Z3' })).toEqual(['Remate sem distância', 'Remate sem tipo'])
  })

  it('can validate that the player was on court', () => {
    expect(validateMatchEvent(base, new Set(['p2']))).toContain('Jogador não está em campo')
  })
})
