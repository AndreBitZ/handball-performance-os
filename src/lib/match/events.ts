import type { MatchEvent } from '../storage/types'

export const EVENT_ACTIONS = ['GOAL','SHOT','SHOT_MISS','SAVE','TURNOVER','STEAL','ASSIST','SUSPENSION_2M','SEVEN_METER','FOUL','YELLOW','RED'] as const
export type EventAction = typeof EVENT_ACTIONS[number]
export const EVENT_ZONES = ['Z1','Z2','Z3','Z4','Z5','Z6','Z7','Z8'] as const
export type EventZone = typeof EVENT_ZONES[number]
export const EVENT_DISTANCES = ['LT6M','SEVEN_M','6TO9M','GT9M'] as const
export type EventDistance = typeof EVENT_DISTANCES[number]
export const EVENT_SHOT_TYPES = ['JUMP_SHOT','STANDING_SHOT','FLOATER','FAST_BREAK','WING_SHOT','PIVOT_SHOT','BREAKTHROUGH','LOB','OTHER'] as const
export type EventShotType = typeof EVENT_SHOT_TYPES[number]
export const ATTACK_PHASES = ['SET_ATTACK','FAST_BREAK','SECOND_WAVE','NUMERICAL_PLUS','NUMERICAL_MINUS','LAST_ATTACK'] as const
export type AttackPhase = typeof ATTACK_PHASES[number]
export const EVENT_RESULTS = ['GOAL','SAVE','MISS','BLOCK','POST','TURNOVER','FOUL_WON','FOUL_COMMITTED','SEVEN_METER_WON','SEVEN_METER_CONCEDED','SUSPENSION'] as const
export type EventResult = typeof EVENT_RESULTS[number]

export type StructuredEventInput = Pick<MatchEvent,'id'|'matchId'|'timestampSeconds'|'period'|'type'|'playerId'> & {
  zone?: EventZone
  distance?: EventDistance
  shotType?: EventShotType
  attackPhase?: AttackPhase
  result?: EventResult
}

export function validateMatchEvent(event: StructuredEventInput, playersOnCourt?: Set<string>): string[] {
  const errors: string[] = []
  if (!event.id || !event.matchId) errors.push('Evento sem identificador')
  if (!EVENT_ACTIONS.includes(event.type as EventAction)) errors.push(`Ação inválida: ${event.type}`)
  if (event.period !== 1 && event.period !== 2) errors.push('Período inválido')
  if (!Number.isFinite(event.timestampSeconds) || event.timestampSeconds < 0 || event.timestampSeconds > 3600) errors.push('Timestamp inválido')
  if (!event.playerId) errors.push('Evento sem jogador')
  if (playersOnCourt && event.playerId && !playersOnCourt.has(event.playerId)) errors.push('Jogador não está em campo')
  if (['SHOT','SHOT_MISS','GOAL'].includes(event.type)) {
    if (!event.zone) errors.push('Remate sem zona')
    if (!event.distance) errors.push('Remate sem distância')
    if (!event.shotType) errors.push('Remate sem tipo')
  }
  return errors
}
