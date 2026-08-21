export const MATCH_TIMELINE_SCHEMA_VERSION = '1.0.0' as const;

export type TimelineEventType = 'period_start' | 'period_end' | 'clock_stop' | 'clock_resume';

export interface MatchTimelineEvent {
  id: string;
  kind: 'timeline';
  schemaVersion: typeof MATCH_TIMELINE_SCHEMA_VERSION;
  period: 1 | 2;
  type: TimelineEventType;
  gameTime: number;
  videoTime: number | null;
  reason: string | null;
}

export interface VideoAnchor {
  gameTime: number;
  videoTime: number;
}

export interface VideoSyncAnchors {
  firstHalfStart: VideoAnchor | null;
  firstHalfEnd: VideoAnchor | null;
  secondHalfStart: VideoAnchor | null;
  secondHalfEnd: VideoAnchor | null;
}

export function gameTimeToVideoTime(
  gameTime: number,
  period: 1 | 2,
  anchors: VideoSyncAnchors,
  timeline: MatchTimelineEvent[]
): number | null {
  if (!Number.isFinite(gameTime) || gameTime < 0) return null;
  const anchor = period === 1 ? anchors.firstHalfStart : anchors.secondHalfStart;
  if (!anchor) return null;

  const pauses = timeline
    .filter(e => e.period === period && e.type === 'clock_stop')
    .map(stop => {
      const resume = timeline.find(e => e.period === period && e.type === 'clock_resume' && e.gameTime === stop.gameTime && e.videoTime !== null);
      if (stop.videoTime === null || !resume || resume.videoTime === null || stop.gameTime >= gameTime) return 0;
      return Math.max(0, resume.videoTime - stop.videoTime);
    })
    .reduce((sum, duration) => sum + duration, 0);

  return anchor.videoTime + Math.max(0, gameTime - anchor.gameTime) + pauses;
}
