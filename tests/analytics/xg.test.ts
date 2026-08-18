import { describe, expect, it } from 'vitest'
import { estimateXG } from '../../src/lib/analytics/xg'

describe('handball xG v0.1', () => {
  it('returns a bounded estimate when distance is known', () => {
    const estimate = estimateXG({ distance: '<6m', zone: 'Z4', shotType: 'Salto', attackPhase: 'Ataque organizado' })
    expect(estimate).not.toBeNull()
    expect(estimate!.value).toBeGreaterThan(0)
    expect(estimate!.value).toBeLessThan(1)
    expect(estimate!.calibrated).toBe(false)
  })

  it('returns null when the minimum context is missing', () => {
    expect(estimateXG({ zone: 'Z4' })).toBeNull()
  })

  it('keeps the model deterministic', () => {
    const context = { distance: '7m', zone: 'Z4', shotType: '7 metros', attackPhase: 'Livre' }
    expect(estimateXG(context)).toEqual(estimateXG(context))
  })
})
