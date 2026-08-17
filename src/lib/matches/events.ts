import type { MatchEvent } from '../storage/types'

export const MATCH_EVENT_TYPES = [
  'SHOT', 'GOAL', 'MISS', 'SHOT_MISS', 'SHOT_GOAL', 'SAVE',
  'ASSIST', 'ASSISTENCIA', 'ASSISTÊNCIA', 'TURNOVER', 'PERDA', 'PERDA_BOLA',
  'YELLOW_CARD', 'YELLOW', 'AMARELO', 'RED_CARD', 'RED', 'VERMELHO',
] as const

export type MatchEventType = typeof MATCH_EVENT_TYPES[number]
const normalize = (value?: string) => value?.trim().toUpperCase() ?? ''

export const isShotEvent = (event: Pick<MatchEvent, 'type'>) =>
  ['SHOT', 'GOAL', 'MISS', 'SHOT_MISS', 'SHOT_GOAL'].includes(normalize(event.type))

export const isGoalEvent = (event: Pick<MatchEvent, 'type' | 'result'>) => {
  const type = normalize(event.type)
  return ['GOAL', 'SHOT_GOAL'].includes(type) || normalize(event.result) === 'GOAL'
}

export const isSaveEvent = (event: Pick<MatchEvent, 'type'>) => normalize(event.type) === 'SAVE'
export const isAssistEvent = (event: Pick<MatchEvent, 'type'>) => ['ASSIST', 'ASSISTENCIA', 'ASSISTÊNCIA'].includes(normalize(event.type))
export const isTurnoverEvent = (event: Pick<MatchEvent, 'type'>) => ['TURNOVER', 'PERDA', 'PERDA_BOLA'].includes(normalize(event.type))
export const isYellowCardEvent = (event: Pick<MatchEvent, 'type'>) => ['YELLOW_CARD', 'YELLOW', 'AMARELO'].includes(normalize(event.type))
export const isRedCardEvent = (event: Pick<MatchEvent, 'type'>) => ['RED_CARD', 'RED', 'VERMELHO'].includes(normalize(event.type))

export function validateMatchEvent(event: MatchEvent): string[] {
  const errors: string[] = []
  if (!event.id) errors.push('id is required')
  if (!event.matchId) errors.push('matchId is required')
  if (!Number.isFinite(event.timestampSeconds) || event.timestampSeconds < 0) errors.push('timestampSeconds must be a non-negative finite number')
  if (!event.type?.trim()) errors.push('type is required')
  if (event.durationSeconds !== undefined && (!Number.isFinite(event.durationSeconds) || event.durationSeconds < 0)) errors.push('durationSeconds must be a non-negative finite number')
  if (event.playerId !== undefined && !event.playerId.trim()) errors.push('playerId cannot be empty')
  if (event.teamId !== undefined && !event.teamId.trim()) errors.push('teamId cannot be empty')
  return errors
}
