import type { MatchEvent, MatchSquad } from '../storage/types'

const HALF_SECONDS = 30 * 60

type Interval = { start: number; end: number }

function playerIntervals(events: MatchEvent[], playerId: string, half: 1 | 2): Interval[] {
  const offset = half === 1 ? 0 : HALF_SECONDS
  const sorted = events.filter(e => e.playerId === playerId && (e.type === 'SUBSTITUTION_IN' || e.type === 'SUBSTITUTION_OUT')).sort((a, b) => a.timestampSeconds - b.timestampSeconds)
  let on = false
  let start = offset
  const intervals: Interval[] = []
  for (const event of sorted) {
    const local = Math.max(0, Math.min(HALF_SECONDS, event.timestampSeconds - offset))
    if (event.type === 'SUBSTITUTION_IN' && !on) { on = true; start = local }
    if (event.type === 'SUBSTITUTION_OUT' && on) { intervals.push({ start, end: local }); on = false }
  }
  if (on) intervals.push({ start, end: HALF_SECONDS })
  return intervals
}

export function derivePlayerMinutes(events: MatchEvent[], squad: MatchSquad[], playerId: string, totalPeriods: 1 | 2 = 2): number {
  const starter = squad.find(s => s.playerId === playerId)?.starter ?? false
  const periods = totalPeriods === 2 ? [1, 2] as const : [1] as const
  let seconds = 0
  for (const half of periods) {
    const relevant = events.filter(e => e.timestampSeconds >= (half - 1) * HALF_SECONDS && e.timestampSeconds <= half * HALF_SECONDS)
    const intervals = playerIntervals(relevant, playerId, half)
    if (starter && half === 1 && intervals.length === 0) seconds += HALF_SECONDS
    for (const interval of intervals) seconds += Math.max(0, interval.end - interval.start)
  }
  return Math.min(totalPeriods * HALF_SECONDS, seconds)
}

export function formatMinutes(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${String(secs).padStart(2, '0')}`
}
