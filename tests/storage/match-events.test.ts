import { describe, expect, it } from 'vitest'
import type { MatchEvent } from '../../src/lib/storage/types'
import {
  isAssistEvent,
  isGoalEvent,
  isRedCardEvent,
  isSaveEvent,
  isShotEvent,
  isTurnoverEvent,
  isYellowCardEvent,
  validateMatchEvent,
} from '../../src/lib/matches/events'

const event = (overrides: Partial<MatchEvent> = {}): MatchEvent => ({
  id: 'event-1',
  matchId: 'match-1',
  timestampSeconds: 30,
  type: 'SHOT',
  createdAt: new Date(0).toISOString(),
  ...overrides,
})

describe('match event rules', () => {
  it('classifies shot outcomes consistently', () => {
    expect(isShotEvent(event({ type: 'SHOT' }))).toBe(true)
    expect(isShotEvent(event({ type: 'GOAL' }))).toBe(true)
    expect(isShotEvent(event({ type: 'SHOT_GOAL' }))).toBe(true)
    expect(isShotEvent(event({ type: 'SHOT_MISS' }))).toBe(true)
    expect(isShotEvent(event({ type: 'SAVE' }))).toBe(false)
    expect(isGoalEvent(event({ type: 'SHOT_GOAL' }))).toBe(true)
    expect(isGoalEvent(event({ type: 'SHOT', result: 'GOAL' }))).toBe(true)
  })

  it('classifies non-shot actions and cards', () => {
    expect(isSaveEvent(event({ type: 'SAVE' }))).toBe(true)
    expect(isAssistEvent(event({ type: 'ASSISTÊNCIA' }))).toBe(true)
    expect(isTurnoverEvent(event({ type: 'PERDA_BOLA' }))).toBe(true)
    expect(isYellowCardEvent(event({ type: 'AMARELO' }))).toBe(true)
    expect(isRedCardEvent(event({ type: 'VERMELHO' }))).toBe(true)
  })

  it('rejects invalid timestamps and missing identity fields', () => {
    expect(validateMatchEvent(event({ id: '', matchId: '', type: '', timestampSeconds: -1 }))).toEqual([
      'id is required',
      'matchId is required',
      'timestampSeconds must be a non-negative finite number',
      'type is required',
    ])
  })

  it('accepts valid events and optional duration', () => {
    expect(validateMatchEvent(event({ durationSeconds: 4.5, playerId: 'p1', teamId: 't1' }))).toEqual([])
    expect(validateMatchEvent(event({ durationSeconds: -1 }))).toContain('durationSeconds must be a non-negative finite number')
  })
})
