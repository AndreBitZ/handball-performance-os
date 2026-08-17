export const HALF_SECONDS = 30 * 60

export type PlayerInterval = {
  playerId: string
  period: 1 | 2
  startSeconds: number
  endSeconds?: number
}

export function calculatePlayerSeconds(
  intervals: PlayerInterval[],
  currentPeriod: 1 | 2,
  currentSeconds: number,
): Record<string, number> {
  const totals: Record<string, number> = {}
  const safeCurrent = Math.max(0, Math.min(HALF_SECONDS, currentSeconds))

  for (const interval of intervals) {
    const end = interval.endSeconds ?? (interval.period === currentPeriod ? safeCurrent : HALF_SECONDS)
    const start = Math.max(0, Math.min(HALF_SECONDS, interval.startSeconds))
    const safeEnd = Math.max(start, Math.min(HALF_SECONDS, end))
    totals[interval.playerId] = (totals[interval.playerId] ?? 0) + (safeEnd - start)
  }

  return totals
}

export function validatePlayerIntervals(intervals: PlayerInterval[]): string[] {
  const errors: string[] = []
  const openByPlayer = new Set<string>()

  for (const interval of intervals) {
    if (interval.startSeconds < 0 || interval.startSeconds > HALF_SECONDS) errors.push(`${interval.playerId}: início inválido`)
    if (interval.endSeconds !== undefined && (interval.endSeconds < interval.startSeconds || interval.endSeconds > HALF_SECONDS)) errors.push(`${interval.playerId}: fim inválido`)
    if (interval.endSeconds === undefined) {
      if (openByPlayer.has(`${interval.playerId}:${interval.period}`)) errors.push(`${interval.playerId}: dois intervalos abertos na mesma parte`)
      openByPlayer.add(`${interval.playerId}:${interval.period}`)
    }
  }

  return errors
}
