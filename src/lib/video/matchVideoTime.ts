import type { MatchVideoSync } from '../storage/types';

export function mapMatchTimeToVideoSeconds(matchSeconds: number, halfDurationMinutes: number, sync?: MatchVideoSync): number | null {
  if (!sync) return null;
  const half = Math.max(1, Number(halfDurationMinutes || 30) * 60);
  const value = Math.max(0, Number(matchSeconds || 0));
  if (value <= half) {
    if (sync.firstHalfStartVideoSeconds == null || sync.firstHalfEndVideoSeconds == null) return null;
    const ratio = Math.min(1, value / half);
    return sync.firstHalfStartVideoSeconds + ratio * (sync.firstHalfEndVideoSeconds - sync.firstHalfStartVideoSeconds);
  }
  if (sync.secondHalfStartVideoSeconds == null || sync.secondHalfEndVideoSeconds == null) return null;
  const ratio = Math.min(1, Math.max(0, (value - half) / half));
  return sync.secondHalfStartVideoSeconds + ratio * (sync.secondHalfEndVideoSeconds - sync.secondHalfStartVideoSeconds);
}
