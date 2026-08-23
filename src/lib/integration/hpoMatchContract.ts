export const HPO_MATCH_FORMAT = 'HPO-MATCH';
export const HPO_MATCH_VERSION = '1.0';

export type HpoMatchFile = {
  format: typeof HPO_MATCH_FORMAT;
  version: typeof HPO_MATCH_VERSION;
  direction: 'PERFORMANCE_OS_TO_ANDEBOL_STATS' | 'ANDEBOL_STATS_TO_PERFORMANCE_OS';
  exportedAt: string;
  match: Record<string, unknown>;
  players: unknown[];
  roster: unknown[];
  events: unknown[];
  statistics: Record<string, unknown>;
  timeline: unknown[];
  video: {
    anchors: Record<string, unknown>;
    clips: unknown[];
  };
  metadata: {
    source: string;
    sourceVersion?: string;
    dataSources?: string[];
  };
};

export function validateHpoMatchFile(payload: unknown): payload is HpoMatchFile {
  const value = payload as HpoMatchFile;
  return !!value && typeof value === 'object'
    && value.format === HPO_MATCH_FORMAT
    && value.version === HPO_MATCH_VERSION
    && (value.direction === 'PERFORMANCE_OS_TO_ANDEBOL_STATS' || value.direction === 'ANDEBOL_STATS_TO_PERFORMANCE_OS')
    && typeof value.match === 'object'
    && Array.isArray(value.players)
    && Array.isArray(value.roster)
    && Array.isArray(value.events)
    && typeof value.statistics === 'object'
    && Array.isArray(value.timeline)
    && !!value.video
    && typeof value.video.anchors === 'object'
    && Array.isArray(value.video.clips)
    && !!value.metadata
    && typeof value.metadata.source === 'string';
}
