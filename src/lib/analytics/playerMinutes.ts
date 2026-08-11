import type { MatchEvent, MatchSquad } from '../storage/types'

const HALF_SECONDS = 30 * 60
const MATCH_SECONDS = HALF_SECONDS * 2

type TimelineEvent = MatchEvent & { globalTimestamp: number }

/**
 * Converts the current Live Match clock into a match timeline.
 * Older events store the clock as 0..1800 for both halves, so we detect a
 * clock reset using creation order and add the second-half offset. Future
 * events can already use a global timestamp and are left untouched.
 */
function normalizeTimeline(events: MatchEvent[]): TimelineEvent[] {
  const chronological = [...events].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  let offset = 0
  let previousClock = -1
  let seenSecondHalf = false
  const normalized: TimelineEvent[] = []

  for (const event of chronological) {
    const clock = Math.max(0, Math.min(HALF_SECONDS, event.timestampSeconds))
    if (previousClock >= 0 && clock + 5 < previousClock && !seenSecondHalf) {
      offset = HALF_SECONDS
      seenSecondHalf = true
    }
    previousClock = clock
    normalized.push({ ...event, globalTimestamp: Math.min(MATCH_SECONDS, clock + offset) })
  }

  return normalized
}

/** Derives total court time from the starting seven plus the complete substitution timeline. */
export function derivePlayerMinutes(events: MatchEvent[], squad: MatchSquad[], playerId: string, matchSeconds = MATCH_SECONDS): number {
  const timeline = normalizeTimeline(events)
  let onCourt = squad.find(s => s.playerId === playerId)?.starter ?? false
  let lastChange = 0
  let seconds = 0

  const substitutions = timeline
    .filter(e => e.playerId === playerId && (e.type === 'SUBSTITUTION_IN' || e.type === 'SUBSTITUTION_OUT'))
    .sort((a, b) => a.globalTimestamp - b.globalTimestamp)

  for (const event of substitutions) {
    const at = Math.max(0, Math.min(matchSeconds, event.globalTimestamp))
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
