import type { MatchEvent, Player } from '../storage/types'

export type XGContext = {
  distance?: string
  zone?: string
  shotType?: string
  attackPhase?: string
}

export type XGEstimate = {
  value: number
  modelVersion: string
  calibrated: boolean
}

export type PlayerXG = {
  playerId: string
  name: string
  shots: number
  goals: number
  xG: number
  xGPerShot: number
  goalsMinusXG: number
}

export type MatchXGReport = {
  shots: number
  goals: number
  xG: number
  goalsMinusXG: number
  xGPerShot: number
  players: PlayerXG[]
  modelVersion: string
  calibrated: boolean
}

const MODEL_VERSION = 'handball-xg-v0.1-heuristic'

const distanceBase: Record<string, number> = {
  '<6m': 0.58,
  '7m': 0.72,
  '6–9m': 0.34,
  '>9m': 0.18,
}

const zoneModifier: Record<string, number> = {
  Z1: 1.05, Z2: 1.08, Z3: 1.04, Z4: 1.10,
  Z5: 1.04, Z6: 0.98, Z7: 0.94, Z8: 0.90,
}

const shotModifier: Record<string, number> = {
  Salto: 1.02,
  Apoio: 0.96,
  Rasteiro: 0.94,
  Balão: 0.82,
  'Contra-ataque': 1.12,
  '7 metros': 1.00,
}

const phaseModifier: Record<string, number> = {
  'Ataque organizado': 1.00,
  'Transição ofensiva': 1.04,
  'Contra-ataque': 1.12,
  Livre: 0.96,
}

function clamp(value: number) {
  return Math.min(0.99, Math.max(0.01, value))
}

export function estimateXG(context: XGContext): XGEstimate | null {
  const base = context.distance ? distanceBase[context.distance] : undefined
  if (base == null) return null

  const value = clamp(
    base *
    (context.zone ? zoneModifier[context.zone] ?? 1 : 1) *
    (context.shotType ? shotModifier[context.shotType] ?? 1 : 1) *
    (context.attackPhase ? phaseModifier[context.attackPhase] ?? 1 : 1),
  )

  return { value: Number(value.toFixed(3)), modelVersion: MODEL_VERSION, calibrated: false }
}

export function xGForEvent(context: XGContext, result?: string) {
  const estimate = estimateXG(context)
  if (!estimate) return null
  return { ...estimate, result }
}

function isShot(event: MatchEvent) {
  return event.type === 'SHOT' || event.type === 'GOAL'
}

function isGoal(event: MatchEvent) {
  return event.type === 'GOAL' && event.result === 'FOR'
}

export function deriveMatchXG(events: MatchEvent[], players: Player[]): MatchXGReport {
  const playerMap = new Map(players.map(player => [player.id, player]))
  const byPlayer = new Map<string, PlayerXG>()
  let shots = 0
  let goals = 0
  let xG = 0

  for (const event of events) {
    if (!isShot(event)) continue
    const estimate = estimateXG({
      distance: event.distance,
      zone: event.zone,
      shotType: event.shotType,
      attackPhase: event.attackPhase,
    })
    if (!estimate) continue

    shots++
    const goal = isGoal(event)
    if (goal) goals++
    xG += estimate.value

    if (event.playerId) {
      const current = byPlayer.get(event.playerId) ?? {
        playerId: event.playerId,
        name: playerMap.get(event.playerId)?.displayName ?? 'Jogador desconhecido',
        shots: 0,
        goals: 0,
        xG: 0,
        xGPerShot: 0,
        goalsMinusXG: 0,
      }
      current.shots++
      if (goal) current.goals++
      current.xG += estimate.value
      byPlayer.set(event.playerId, current)
    }
  }

  const playersReport = [...byPlayer.values()]
    .map(player => ({
      ...player,
      xG: Number(player.xG.toFixed(3)),
      xGPerShot: Number((player.xG / player.shots).toFixed(3)),
      goalsMinusXG: Number((player.goals - player.xG).toFixed(3)),
    }))
    .sort((a, b) => b.xG - a.xG)

  return {
    shots,
    goals,
    xG: Number(xG.toFixed(3)),
    goalsMinusXG: Number((goals - xG).toFixed(3)),
    xGPerShot: Number((xG / shots || 0).toFixed(3)),
    players: playersReport,
    modelVersion: MODEL_VERSION,
    calibrated: false,
  }
}
