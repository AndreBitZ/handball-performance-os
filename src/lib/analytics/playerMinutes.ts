import type { MatchEvent, MatchSquad } from '../storage/types'

const MATCH_SECONDS = 60 * 60

/** Derives total court time from the starting seven plus the full substitution timeline. */
export function derivePlayerMinutes(events: MatchEvent[], squad: MatchSquad[], playerId: string, matchSeconds = MATCH_SECONDS): number {
  let onCourt = squad.find(s => s.playerId === playerId)?.starter ?? false
  let lastChange = 0
  let seconds = 0

  const substitutions = events
    .filter(e => e.playerId === playerId && (e.type === 'SUBSTITUTION_IN' || e.type === 'SUBSTITUTION_OUT'))
    .sort((a, b) => a.timestampSeconds - b.timestampSeconds)

  for (const event of substitutions) {
    const at = Math.max(0, Math.min(matchSeconds, event.timestampSeconds))
    if (event.type === 'SUBSTITUTION_OUT' && onCourt) {
      seconds += Math.max(0, at - lastChange)
      onCourt = false
      lastChange = at
    } else if (event.type === 'SUBSTITUTION_IN' && !onCourt) {
      onCourt = true
      lastChange = at
    }
  }

  if (onCourt) seconds += Math.max(0, matchSeconds - lastChange)
  return Math.min(matchSeconds, seconds)
}

export function formatMinutes(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${String(secs).padStart(2, '0')}`
}
