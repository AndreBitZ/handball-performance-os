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

const MODEL_VERSION = 'handball-xg-v0.1-heuristic'

// Transparent starting priors. These are deliberately configuration-level values,
// not presented as a championship-trained model. They can be replaced by fitted data later.
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
  'Salto': 1.02,
  'Apoio': 0.96,
  'Rasteiro': 0.94,
  'Balão': 0.82,
  'Contra-ataque': 1.12,
  '7 metros': 1.00,
}

const phaseModifier: Record<string, number> = {
  'Ataque organizado': 1.00,
  'Transição ofensiva': 1.04,
  'Contra-ataque': 1.12,
  'Livre': 0.96,
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
